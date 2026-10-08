// Phase 25.5: comps outside the ladder. The Fall Festival dyno comp, once a year at Send
// City, five throws each further than the last, no points; and League night's season, the
// same field all year, a table of its nights settled on the last one. Phase 26: the dyno comp
// grows with the years, and a season won moves you up to the A league for good.
import { describe, expect, it } from 'vitest';
import {
  compField,
  compHere,
  compOn,
  compSet,
  goesFor,
  gradesFor,
  leagueNights,
  leagueTable,
  leagueTier,
  nightPlaces,
  rungOpen,
  seasonEnds,
} from './comps';
import { A_LEAGUE, COMP_LADDER, COMP_TIERS, DYNO_COMP } from './content/comps';
import { wallAt } from './content/gym';
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

describe('the dyno comp, as word gets round (Phase 26)', () => {
  it('raises its throws and its field a grade a year, for its first three years', () => {
    const on = (y: number) => DYNO.on + y * YEAR.days;
    const [lo, hi] = DYNO.grades;
    expect(gradesFor(DYNO_COMP, on(0))).toEqual([lo, hi]);
    expect(gradesFor(DYNO_COMP, on(1))).toEqual([lo + 1, hi + 1]);
    expect(gradesFor(DYNO_COMP, on(3))).toEqual([lo + 3, hi + 3]);
    expect(gradesFor(DYNO_COMP, on(6))).toEqual([lo + 3, hi + 3]);
    const set = compSet('league', DYNO_COMP, on(3));
    expect([set[0]!.grade, set.at(-1)!.grade]).toEqual([lo + 3, hi + 3]);
    // The field tops more of a year-three set than a first year's field would.
    const tops = (y: number) =>
      Array.from({ length: 8 }, (_, k) =>
        compField(`grow-${k}`, DYNO_COMP, on(y)).reduce((a, f) => a + f.tops, 0),
      ).reduce((a, b) => a + b, 0);
    expect(tops(3)).toBeGreaterThan(0);
    // Every other comp's grades stay put.
    expect(gradesFor(0, on(3))).toEqual(COMP_TIERS[0]!.grades);
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

describe('the A league (Phase 26)', () => {
  const won = (year: number, place = 1) => ({ year, place, of: 10 });
  const up = (over: Partial<GameState> = {}) =>
    base({ comps: { ...base().comps, seasons: [won(0)] }, ...over });

  it('is yours the year after a season won, for good, and League night isn’t', () => {
    const y0 = leagueNights(0)[3]!;
    const y1 = leagueNights(1)[0]!;
    expect(leagueTier(base(), 1)).toBe(0);
    expect(leagueTier(up(), 0)).toBe(0);
    expect(leagueTier(up(), 1)).toBe(A_LEAGUE);
    expect(leagueTier(up(), 5)).toBe(A_LEAGUE);
    expect(leagueTier(base({ comps: { ...base().comps, seasons: [won(0, 2)] } }), 1)).toBe(0);
    expect(compHere(up(), y0, 'gym')).toBe(0);
    expect(compHere(up(), y1, 'gym')).toBe(A_LEAGUE);
    // Never a comp on a day of its own, never a rung.
    expect(compOn(y1, 'gym')).toBe(0);
    expect(COMP_LADDER).not.toContain(A_LEAGUE);
    expect(ladderById('comp').rungs(up())).not.toContain(COMP_TIERS[A_LEAGUE]!.name);
  });

  it('is entered at the desk on League night: harder problems on the wall, a field of its own', () => {
    const d = leagueNights(1)[0]!;
    const s = up({ day: d, at: 'gym', min: 10 * 60 });
    const r = act(s, { t: 'comp', do: 'enter' });
    const A = COMP_TIERS[A_LEAGUE]!;
    expect(r.state.comps.on?.tier).toBe(A_LEAGUE);
    expect(r.state.cash).toBe(s.cash - A.fee);
    expect(lines(r)[0]).toContain(`V${A.grades[0]} to V${A.grades[1]}`);
    const set = compSet(s.seed, A_LEAGUE, d);
    expect(
      wallAt(r.state, 'gym')
        .slice(0, set.length)
        .map((x) => x.id),
    ).toEqual(set.map((x) => x.id));
    expect(set[0]!.grade).toBe(A.grades[0]);
    expect(set.at(-1)!.grade).toBe(A.grades[1]);
    // Its field is the same all year, and drawn apart from League night's.
    const names = (t: number, n: number) => compField(s.seed, t, n).map((f) => f.name);
    const nights = leagueNights(1);
    expect(names(A_LEAGUE, nights[4]!)).toEqual(names(A_LEAGUE, nights[0]!));
    expect(names(A_LEAGUE, d)).toHaveLength(A.field - 1);
  });

  it('keeps its own table, and its season pays more', () => {
    const nights = leagueNights(1);
    const win = (d: number) => ({ tier: A_LEAGUE, day: d, place: 1, of: 10 });
    const s = up({ day: nights.at(-1)!, comps: { ...up().comps, results: nights.map(win) } });
    const table = leagueTable(s, 1, nights.at(-1)!);
    expect(table[0]).toMatchObject({ you: true, pts: LEAGUE.best * COMP_TIERS[A_LEAGUE]!.field });
    // League night's own table that year hasn't heard of you.
    expect(leagueTable(s, 1, nights.at(-1)!, 0).some((x) => x.you)).toBe(false);
    const r = sleep(s);
    expect(r.state.comps.seasons.at(-1)).toEqual({ year: 1, place: 1, of: table.length });
    expect(lines(r).some((l) => l.includes('The A league’s season is yours'))).toBe(true);
    const quiet = sleep({ ...s, comps: { ...s.comps, results: [] } });
    expect(r.state.cash - quiet.state.cash).toBe(LEAGUE.prizeA);
  });
});
