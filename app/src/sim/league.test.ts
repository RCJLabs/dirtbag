// Phase 25.5: comps outside the ladder. The Fall Festival dyno comp, once a year at Send
// City, five throws each further than the last, no points; and League night's season, the
// same field all year, a table of its nights settled on the last one.
import { describe, expect, it } from 'vitest';
import {
  compField,
  compOn,
  compSet,
  goesFor,
  leagueNights,
  leagueTable,
  nightPlaces,
  rungOpen,
  seasonEnds,
} from './comps';
import { COMP_LADDER, COMP_TIERS, DYNO_COMP } from './content/comps';
import { LEAGUE, YEAR } from './dials';
import { act, newGame } from './game';
import { ladderById } from './ladders';
import { aimEarned } from './record';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('league'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  energy: 100,
  skin: 100,
  cash: 500,
  ...over,
});
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const sleep = (s: GameState) => {
  let r = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
  if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
  return r;
};
const DYNO = COMP_TIERS[DYNO_COMP]!;

describe('the dyno comp', () => {
  it('is once a year at Send City in the fall: five throws, each further, a few goes each', () => {
    const days = Array.from({ length: 3 * YEAR.days }, (_, i) => i + 1).filter(
      (d) => compOn(d, 'gym') === DYNO_COMP,
    );
    expect(days).toEqual([DYNO.on, DYNO.on + YEAR.days, DYNO.on + 2 * YEAR.days]);
    expect(compOn(DYNO.on, 'cave')).toBeNull();
    const set = compSet('league', DYNO_COMP, DYNO.on);
    expect(set).toHaveLength(5);
    expect(set.every((p) => p.type === 'dyno')).toBe(true);
    expect(set.map((p) => p.grade)).toEqual([...set.map((p) => p.grade)].sort((a, b) => a - b));
    expect(set[0]!.grade).toBe(DYNO.grades[0]);
    expect(set.at(-1)!.grade).toBe(DYNO.grades[1]);
    expect(goesFor(DYNO_COMP)).toBe(3);
    expect(compField('league', DYNO_COMP, DYNO.on)).toHaveLength(DYNO.field - 1);
  });

  it('is off the ladder: no points, never a rung', () => {
    expect(COMP_LADDER).not.toContain(DYNO_COMP);
    expect(ladderById('comp').rungs(base())).not.toContain(DYNO.name);
    const s = base({ day: DYNO.on, at: 'gym', min: 10 * 60 });
    const r = act(s, { t: 'comp', do: 'enter' });
    expect(r.state.comps.on?.tier).toBe(DYNO_COMP);
    expect(r.state.cash).toBe(s.cash - DYNO.fee);
    expect(lines(r)[0]).toContain('5 throws');
    // Every throw stuck first go: a win, the purse, the book's page, and nothing on the ladder.
    const tops = Object.fromEntries(compSet(s.seed, DYNO_COMP, DYNO.on).map((p) => [p.id, 1]));
    const won = act(
      { ...r.state, comps: { ...r.state.comps, on: { ...r.state.comps.on!, tops } } },
      {
        t: 'comp',
        do: 'finish',
      },
    );
    expect(won.state.comps.results.at(-1)).toMatchObject({ tier: DYNO_COMP, place: 1 });
    expect(won.state.comps.points).toEqual([]);
    expect(won.state.cash).toBe(r.state.cash + DYNO.purse[0]);
    expect(lines(won)[0]).not.toContain('point');
    expect(aimEarned(won.state, { comp: 'dyno' })).toBe(true);
    expect(rungOpen(won.state)).toBe(0);
    expect(ladderById('comp').at(won.state)).toBe(0);
  });
});

describe('League night’s season', () => {
  it('has the same field every night of a year, and eight nights', () => {
    const nights = leagueNights(0);
    expect(nights).toHaveLength(YEAR.days / 7);
    const names = (d: number) => compField('league', 0, d).map((f) => f.name);
    for (const d of nights) expect(names(d)).toEqual(names(nights[0]!));
    // The nights still go differently.
    const tops = new Set(nights.map((d) => JSON.stringify(compField('league', 0, d).map((f) => f.tops))));
    expect(tops.size).toBeGreaterThan(1);
    expect(seasonEnds(nights.at(-1)!)).toBe(true);
    expect(seasonEnds(nights[0]!)).toBe(false);
  });

  it('places everyone each night, you where your result says', () => {
    const d = leagueNights(0)[2]!;
    const s = base({ comps: { ...base().comps, results: [{ tier: 0, day: d, place: 3, of: 10 }] } });
    const p = nightPlaces(s, d);
    expect(p.size).toBe(COMP_TIERS[0]!.field);
    expect([...p.values()].sort((a, b) => a - b)).toEqual(Array.from({ length: p.size }, (_, i) => i + 1));
    expect(p.get('Kit')).toBe(3);
    // Without you, the field fills the places themselves.
    expect(nightPlaces(base(), d).size).toBe(COMP_TIERS[0]!.field - 1);
  });

  it('counts your best six nights, and settles on the last: the prize and the book for the top', () => {
    const nights = leagueNights(1);
    const win = (d: number) => ({ tier: 0, day: d, place: 1, of: 10 });
    const s = base({ day: nights.at(-1)!, comps: { ...base().comps, results: nights.map(win) } });
    const table = leagueTable(s, 1, nights.at(-1)!);
    expect(table[0]).toMatchObject({ you: true, nights: 8, pts: LEAGUE.best * COMP_TIERS[0]!.field });
    const r = sleep(s);
    expect(r.state.comps.seasons).toEqual([{ year: 1, place: 1, of: table.length }]);
    expect(lines(r).some((l) => l.includes('League night’s season is yours'))).toBe(true);
    expect(aimEarned(r.state, { league: true })).toBe(true);
    // The prize, in with the night's other money.
    const quiet = sleep({ ...s, comps: { ...s.comps, results: [] } });
    expect(quiet.state.comps.seasons).toEqual([]);
    expect(r.state.cash - quiet.state.cash).toBe(LEAGUE.prize);
  });

  it('settles a season you did badly in, without the prize', () => {
    const nights = leagueNights(1);
    const s = base({
      day: nights.at(-1)!,
      comps: { ...base().comps, results: [{ tier: 0, day: nights[0]!, place: 10, of: 10 }] },
    });
    const r = sleep(s);
    const was = r.state.comps.seasons[0]!;
    expect(was.place).toBeGreaterThan(3);
    expect(aimEarned(r.state, { league: true })).toBe(false);
    expect(lines(r).some((l) => l.includes(`of ${was.of} on the table`))).toBe(true);
  });
});
