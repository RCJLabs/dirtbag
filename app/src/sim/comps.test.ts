// Phase 18.4: the comp ladder. Comps on their days at their walls, the wall's set the comp's
// that day; a scorecard of tops in a few goes each, against a fixed field; points that fade,
// and let you up the ladder; the purse, the path and the book.
import { describe, expect, it } from 'vitest';
import {
  compBlocked,
  compField,
  compOn,
  compSet,
  ladderPoints,
  nextComp,
  placing,
  pointsFor,
  rungOpen,
} from './comps';
import { COMP_TIERS } from './content/comps';
import { routesAt, wallAt } from './content/gym';
import { COMP } from './dials';
import { act, newGame } from './game';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('comps'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  energy: 100,
  skin: 100,
  cash: 200,
  ...over,
});
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const LEAGUE = COMP_TIERS[0]!;

describe('the comp ladder', () => {
  it('runs each rung on its days at its wall, and puts the comp’s problems on the wall', () => {
    expect(compOn(LEAGUE.on, 'gym')).toBe(0);
    expect(compOn(LEAGUE.on + 1, 'gym')).toBeNull();
    expect(compOn(LEAGUE.on, 'cave')).toBeNull();
    const set = compSet('comps', 0, LEAGUE.on);
    expect(set).toHaveLength(6);
    expect(set[0]!.grade).toBe(LEAGUE.grades[0]);
    expect(set.at(-1)!.grade).toBe(LEAGUE.grades[1]);
    // On the wall for those signed up; the week's set for anyone else.
    const day = base({ day: LEAGUE.on, at: 'gym', min: 9 * 60 });
    expect(wallAt(day, 'gym')).toEqual(routesAt('comps', 'gym', LEAGUE.on));
    expect(routesAt('comps', 'gym', LEAGUE.on).slice(0, 6)).not.toEqual(set);
    const signed = act(day, { t: 'comp', do: 'enter' }).state;
    expect(wallAt(signed, 'gym').slice(0, 6)).toEqual(set);
    expect(nextComp(1)).toEqual({ tier: 0, day: LEAGUE.on });
    // Every rung's days fall on a wall that has a comp; the A league's are League night's
    // (Phase 26).
    for (const [i, t] of COMP_TIERS.entries()) expect(compOn(t.on, t.venue)).toBe(t.division ? 0 : i);
  });

  it('draws a fixed field: the same on a reload, and it doesn’t move with you', () => {
    const f = compField('comps', 2, 24);
    expect(f).toHaveLength(COMP_TIERS[2]!.field - 1);
    expect(compField('comps', 2, 24)).toEqual(f);
    expect(new Set(f.map((x) => x.name)).size).toBe(f.length);
  });

  it('places tops first, then fewest goes, a tie your way', () => {
    const field = [
      { name: 'A', tops: 4, goes: 6 },
      { name: 'B', tops: 3, goes: 3 },
    ];
    expect(placing({ name: 'You', tops: 5, goes: 9 }, field)).toBe(1);
    expect(placing({ name: 'You', tops: 3, goes: 3 }, field)).toBe(2);
    expect(placing({ name: 'You', tops: 3, goes: 4 }, field)).toBe(3);
    expect(pointsFor(0, 1, 10)).toBe(LEAGUE.pts);
    expect(pointsFor(0, 10, 10)).toBe(Math.round(LEAGUE.pts / 10));
  });

  it('fades points by half every so often, and lets you up the ladder on them', () => {
    const s = base({
      day: 100,
      comps: { on: null, points: [{ day: 100, pts: 30 }], results: [], seasons: [] },
    });
    expect(ladderPoints(s)).toBe(30);
    expect(ladderPoints({ ...s, day: 100 + COMP.half })).toBe(15);
    expect(rungOpen(s)).toBe(1);
    expect(rungOpen({ ...s, day: 100 + COMP.half })).toBe(0);
  });

  it('signs you up on the day, before sign-up closes, with the fee and the points', () => {
    const at = base({ day: LEAGUE.on, at: 'gym', min: 9 * 60 });
    expect(compBlocked(at)).toBeNull();
    expect(compBlocked({ ...at, min: COMP.close })).toMatch(/closed/);
    expect(compBlocked({ ...at, day: LEAGUE.on + 1 })).toMatch(/No comp/);
    expect(compBlocked({ ...at, cash: 1 })).toMatch(/fee/);
    const circuit = base({ day: COMP_TIERS[1]!.on, at: 'cave', min: 9 * 60 });
    expect(compBlocked(circuit)).toMatch(/points on the ladder/);
    const r = act(at, { t: 'comp', do: 'enter' });
    expect(r.state.cash).toBe(at.cash - LEAGUE.fee);
    expect(r.state.comps.on).toMatchObject({ tier: 0, day: LEAGUE.on });
    // The entry's the wall for the day.
    expect(r.state.today).toContain('pass');
  });

  it('counts a top in its first few goes, hands in the card for a place, points and the purse', () => {
    let s = act(base({ day: LEAGUE.on, at: 'gym', min: 9 * 60 }), { t: 'comp', do: 'enter' }).state;
    const set = compSet(s.seed, 0, LEAGUE.on);
    for (const p of set) {
      s = act(s, { t: 'go', route: p.id }).state;
      s = act(
        { ...s, energy: 100, skin: 100 },
        { t: 'done', route: p.id, result: { sent: true, hi: p.moves, fellAt: null, tried: [], skin: 1 } },
      ).state;
    }
    expect(Object.keys(s.comps.on!.tops)).toHaveLength(set.length);
    const before = s.cash;
    const r = act(s, { t: 'comp', do: 'finish' });
    expect(r.state.comps.on).toBeNull();
    expect(r.state.comps.results[0]).toMatchObject({ tier: 0, place: 1, of: LEAGUE.field });
    expect(r.state.cash).toBe(before + LEAGUE.purse[0]);
    expect(lines(r).some((l) => /1st of/.test(l))).toBe(true);
    expect(r.state.record.comp).toBeDefined();
    expect(r.state.record.compwin).toBeDefined();
  });

  it('hands in your card at bed if you didn’t', () => {
    const s = act(base({ day: LEAGUE.on, at: 'gym', min: 9 * 60 }), { t: 'comp', do: 'enter' }).state;
    let night = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
    // A knock on the van that night waits for an answer before the night goes on.
    if (night.state.encounter) night = act(night.state, { t: 'answer', opt: 0 });
    expect(night.state.comps.on).toBeNull();
    expect(night.state.comps.results).toHaveLength(1);
  });
});
