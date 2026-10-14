// Phase 33.1: comps with rounds (Evan's call: small finals). From Nationals up, a qualifier
// and then the final the next day; the World Series has a semi-final between. Through the
// cut, the round is tomorrow's; under it, your place in the round is your place in the comp.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { compField, compRoute, compSet, gradesFor, roundOf, startOf } from './comps';
import { COMP_TIERS, ROUND_SAYS } from './content/comps';
import { wallAt } from './content/gym';
import { COMP } from './dials';
import { act, newGame } from './game';
import type { GameState } from './types';

const NAT = 2;
const WS = 3;
const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const k = needFor(13);
const base = (over: Partial<GameState> = {}): GameState => {
  const s = newGame('rounds');
  return {
    ...s,
    day: 24,
    at: 'center',
    min: 9 * 60,
    cash: 500,
    energy: 100,
    climber: {
      name: 'Kit',
      start: 'allrounder',
      skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
    },
    comps: { ...s.comps, points: [{ day: 23, pts: 200 }] },
    ...over,
  };
};
// Every problem on today's wall topped first go: a score nobody beats.
const clean = (s: GameState): GameState => ({
  ...s,
  comps: {
    ...s.comps,
    on: {
      ...s.comps.on!,
      tops: Object.fromEntries(compSet(s.seed, s.comps.on!.tier, s.day).map((p) => [p.id, 1])),
    },
  },
});
const enter = (s = base()) => act(s, { t: 'comp', do: 'enter' }).state;
const finish = (s: GameState) => act(s, { t: 'comp', do: 'finish' });

describe('the rounds', () => {
  it('run on the days after the comp’s own, as many as it has', () => {
    expect([24, 25, 26].map((d) => roundOf(NAT, d))).toEqual([0, 1, 0]);
    expect([17, 18, 19, 20].map((d) => roundOf(WS, d))).toEqual([0, 1, 2, 0]);
    expect(startOf(WS, 19)).toBe(17);
    expect(roundOf(0, 5)).toBe(0);
  });

  it('set fewer and harder problems after the qualifier', () => {
    const qual = compSet('rounds', NAT, 24);
    const final = compSet('rounds', NAT, 25);
    expect(final).toHaveLength(COMP.roundProblems);
    expect(qual.length).toBeGreaterThan(final.length);
    const [lo, hi] = gradesFor(NAT, 24);
    expect(final[0]!.grade).toBe(Math.round((lo + hi) / 2));
    expect(final.at(-1)!.grade).toBe(hi);
    expect(compRoute('rounds', final[2]!.id)).toEqual(final[2]);
    // The semi sits between.
    const semi = compSet('rounds', WS, 18);
    expect(semi[0]!.grade).toBeGreaterThan(compSet('rounds', WS, 17)[0]!.grade);
    expect(semi[0]!.grade).toBeLessThan(compSet('rounds', WS, 19)[0]!.grade);
  });

  it('meet the field through each cut, your place among it', () => {
    const t = COMP_TIERS[WS]!;
    expect(compField('rounds', WS, 17)).toHaveLength(t.field - 1);
    expect(compField('rounds', WS, 18)).toHaveLength(t.rounds![0]! - 1);
    expect(compField('rounds', WS, 19)).toHaveLength(t.rounds![1]! - 1);
    // The final's field went through the semi.
    const semi = new Set(compField('rounds', WS, 18).map((f) => f.name));
    expect(compField('rounds', WS, 19).every((f) => semi.has(f.name))).toBe(true);
  });
});

describe('a comp in rounds', () => {
  it('puts you through to tomorrow’s round, kept over the night, with nothing paid yet', () => {
    const s = clean(enter());
    const r = finish(s);
    expect(refused(r)).toBe(false);
    expect(r.state.comps.on).toEqual({ tier: NAT, day: 25, round: 1, tops: {} });
    expect(r.state.comps.results).toEqual([]);
    expect(r.state.cash).toBe(s.cash);
    expect(lines(r).join(' ')).toContain('Through to the final tomorrow');
    const night = act({ ...r.state, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' }).state;
    expect(night.comps.on).toMatchObject({ day: 25, round: 1 });
  });

  it('climbs the final on its day, at the comp’s wall, no pass bought', () => {
    const through = finish(clean(enter())).state;
    const day = { ...through, day: 25, min: 18 * 60, today: [] };
    expect(wallAt(day, 'center')).toEqual(compSet(day.seed, NAT, 25));
    const p = compSet(day.seed, NAT, 25)[0]!;
    expect(refused(act(day, { t: 'go', route: p.id }))).toBe(false);
    // Won.
    const r = finish(clean(day));
    expect(r.state.comps.on).toBeNull();
    expect(r.state.comps.results).toEqual([{ tier: NAT, day: 25, place: 1, of: COMP_TIERS[NAT]!.field }]);
    expect(r.state.cash).toBe(day.cash + COMP_TIERS[NAT]!.purse[0]);
  });

  it('places you last of the final for a final not climbed, and in the comp by the round you went out in', () => {
    const through = finish(clean(enter())).state;
    const blank = finish({ ...through, day: 25 });
    expect(blank.state.comps.results.at(-1)).toMatchObject({ place: COMP_TIERS[NAT]!.rounds![0], of: 16 });
    // Out in the qualifier: no tops, under the cut.
    const out = finish(enter());
    expect(out.state.comps.on).toBeNull();
    expect(out.state.comps.results.at(-1)).toMatchObject({ tier: NAT, day: 24, of: 16 });
    expect(out.state.comps.results.at(-1)!.place).toBeGreaterThan(COMP_TIERS[NAT]!.rounds![0]!);
    expect(lines(out)[0]).toContain(ROUND_SAYS.out.split('{')[0]!);
  });

  it('leaves a comp without rounds as it was', () => {
    const s = { ...base(), day: 4, at: 'gym', comps: newGame('rounds').comps };
    const r = finish(enter(s));
    expect(r.state.comps.on).toBeNull();
    expect(r.state.comps.results.at(-1)).toMatchObject({ tier: 0, day: 4 });
  });
});
