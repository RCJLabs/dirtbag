// Phase 23.4: paths, mastery and quirks. A path's tier is claimed, gated on your grade and a
// deed of its own, two paths at most; mastery comes from sends; a quirk is named from how
// you've climbed. Each is an edge on the dials the rules already read.
import { describe, expect, it } from 'vitest';
import { injuryChance } from './body';
import { betaScale } from './climb';
import { needFor, type Style } from './climber';
import { gymSet, indoor } from './content/gym';
import { HYBRIDS, MASTERY, OPEN_PATHS, PATHS, QUIRKS } from './content/paths';
import { ROUTES } from './content/routes';
import { LOAD, MASTERY_AT, PATH, QUIRK } from './dials';
import { act, newGame } from './game';
import { gainMult, livingMult } from './identity';
import { countGo, edgeText, edgeWindows, masteryOf, newMastery, pathBlocked, quirkFor } from './paths';
import { gasFor } from './van';
import type { GameState, SendStyle } from './types';

const at = (g: number): GameState['climber']['skills'] => {
  const n = needFor(g) + 0.5;
  return { power: n, fingers: n, endurance: n, technique: n, head: n };
};
const made = (grade = 0) => {
  const s = act(newGame('paths'), { t: 'create', name: 'Ro', start: 'allrounder' }).state;
  return { ...s, climber: { ...s.climber, skills: at(grade) } };
};
const outside = Object.values(ROUTES).filter((r) => !indoor(r.place) && !r.exped);
const ofType = (t: Style) => outside.filter((r) => r.type === t);
const log = (style: SendStyle = 'redpoint') => ({
  known: [],
  told: [],
  pick: {},
  falls: {},
  goes: 2,
  goesToday: 0,
  hi: 0,
  sent: { day: 1, go: 2, style },
  sentToday: false,
});
const sent = (s: GameState, ids: string[], style?: SendStyle): GameState => ({
  ...s,
  routes: { ...s.routes, ...Object.fromEntries(ids.map((id) => [id, log(style)])) },
});
const crimps = (n: number) =>
  ofType('crimp')
    .slice(0, n)
    .map((r) => r.id);

describe('paths', () => {
  it('are six, Scene open with the comps (Phase 18.4); each tier a deed and an edge said from its numbers', () => {
    expect(OPEN_PATHS).toEqual(['power', 'fingers', 'head', 'style', 'dirtbag', 'scene']);
    for (const id of OPEN_PATHS) {
      expect(PATHS[id]!.tiers).toHaveLength(PATH.gates.length);
      for (const t of PATHS[id]!.tiers) expect(edgeText(t.edge), `${id} ${t.name}`).not.toBe('');
    }
    expect(edgeText(PATHS.fingers!.tiers[0]!.edge)).toBe('Cruxes 10% kinder on crimp lines.');
    expect(edgeText(PATHS.dirtbag!.tiers[0]!.edge)).toBe('Gas 50% cheaper.');
  });

  it('gate each tier on your grade and its deed', () => {
    const s = sent(made(3), crimps(4));
    expect(pathBlocked(s, 'fingers')).toBe(`Climbing V${PATH.gates[0]} first.`);
    expect(pathBlocked(sent(made(4), crimps(3)), 'fingers')).toMatch(/4 crimp lines sent first/);
    expect(pathBlocked(sent(made(4), crimps(4)), 'fingers')).toBeNull();
    expect(pathBlocked(made(9), 'scene')).toBe('3 comps entered first.');
    expect(pathBlocked(made(9), 'nope')).toBe('Not a path you can take.');
  });

  it('are claimed a tier at a time, told about once, and two at most', () => {
    let s = sent({ ...made(4), trips: 6 }, [
      ...crimps(4),
      ...ofType('technical')
        .slice(0, 4)
        .map((r) => r.id),
    ]);
    const told = act({ ...s, at: 'lot', min: 9 * 60 }, { t: 'act', act: 'lot.rest' });
    expect(told.state.paths.told).toEqual(expect.arrayContaining(['fingers:1', 'style:1', 'dirtbag:1']));
    s = act(s, { t: 'path', id: 'fingers' }).state;
    s = act(s, { t: 'path', id: 'dirtbag' }).state;
    expect(s.paths.tiers).toEqual({ fingers: 1, dirtbag: 1 });
    expect(act(s, { t: 'path', id: 'style' }).events[0]?.k).toBe('refused');
    expect(pathBlocked(s, 'fingers')).toBe(`Climbing V${PATH.gates[1]} first.`);
  });

  it('give their edges: windows by style, injury, gains, gas', () => {
    const s = made(4);
    const crimp = ofType('crimp')[0]!;
    const tech = ofType('technical')[0]!;
    const t1 = { ...s, paths: { tiers: { fingers: 1 }, told: [] } };
    expect(edgeWindows(t1, crimp, false)).toBeCloseTo(1.1, 10);
    expect(edgeWindows(t1, tech, false)).toBe(1);
    const b = Object.keys(crimp.beta)[0]!;
    const here = { ...s, at: crimp.place };
    expect(betaScale({ ...here, paths: t1.paths }, crimp, b)).toBeCloseTo(
      betaScale(here, crimp, b) * 1.1,
      10,
    );
    const t2 = {
      ...s,
      paths: { tiers: { fingers: 2 }, told: [] },
      load: { acute: 60, chronic: 20, today: 0 },
    };
    const p = (x: GameState) => injuryChance(x, { type: 'technical' }, LOAD.perGo, false);
    expect(p(t2)).toBeCloseTo(p({ ...t2, paths: { tiers: {}, told: [] } }) * 0.55, 10);
    const t3 = { ...s, paths: { tiers: { fingers: 3 }, told: [] } };
    expect(gainMult(t3, 'fingers', 'out')).toBeCloseTo(1.15, 10);
    expect(gasFor({ ...s, paths: { tiers: { dirtbag: 1 }, told: [] } }, 10)).toBe(5);
    const nerve = { ...s, paths: { tiers: { head: 3 }, told: [] } };
    expect(edgeWindows(nerve, tech, true)).toBeCloseTo(1.03 * 1.04 * 1.05, 10);
    expect(edgeWindows(nerve, tech, false)).toBe(1);
  });
});

describe('mastery', () => {
  // The gym's sets turn over weekly: forty crimps sent across them.
  const gymCrimps = (s: GameState, n: number) => {
    const ids: string[] = [];
    for (let w = 1; ids.length < n && w < 200; w++)
      for (const r of gymSet(s.seed, w)) if (r.type === 'crimp' && ids.length < n) ids.push(r.id);
    return ids;
  };

  it('comes at enough sends of a style, once, with a note, and is an edge after', () => {
    const s = made();
    expect(newMastery(sent(s, gymCrimps(s, MASTERY_AT.sends - 1)))).toEqual([]);
    const deep = { ...sent(s, gymCrimps(s, MASTERY_AT.sends)), at: 'lot', min: 9 * 60 };
    expect(newMastery(deep)).toEqual(['crimp']);
    const r = act(deep, { t: 'act', act: 'lot.rest' });
    expect(r.state.mastery).toEqual(['crimp']);
    expect(newMastery(r.state)).toEqual([]);
    expect(gainMult(r.state, 'fingers', 'in')).toBeCloseTo(MASTERY.crimp.edge.gain![1], 10);
  });
});

describe('hybrids', () => {
  it('come with two skills both at the hybrid grade, in the same track', () => {
    const s = made(MASTERY_AT.hybrid - 1);
    expect(newMastery(s)).toEqual([]);
    const both = made(MASTERY_AT.hybrid);
    expect(newMastery(both)).toHaveLength(Object.keys(HYBRIDS).length);
    const need = needFor(MASTERY_AT.hybrid);
    const one = { ...s, climber: { ...s.climber, skills: { ...s.climber.skills, power: need, head: need } } };
    expect(newMastery(one)).toEqual(['hy_fearless']);
    expect(masteryOf('hy_fearless')!.name).toBe('Fearless');
    const r = act({ ...one, at: 'lot', min: 9 * 60 }, { t: 'act', act: 'lot.rest' });
    expect(r.state.mastery).toEqual(['hy_fearless']);
  });
});

describe('quirks', () => {
  const habits = (h: Partial<GameState['habits']>): GameState['habits'] => ({
    goes: QUIRK.after,
    outdoor: 0,
    fresh: 0,
    tired: 0,
    evening: 0,
    dawn: 0,
    easy: 0,
    power: 0,
    ...h,
  });

  it('are counted a go at a time', () => {
    const r = ofType('power')[0]!;
    const s = { ...made(10), energy: 80, min: 18 * 60 };
    const h = countGo(s, r);
    expect(h).toEqual({
      ...s.habits,
      goes: 1,
      outdoor: 1,
      fresh: 1,
      evening: 1,
      easy: r.grade <= 8 ? 1 : 0,
      power: 1,
    });
  });

  it('are named once enough goes say so, the first that fits, and not before', () => {
    const s = made();
    expect(quirkFor({ ...s, habits: habits({ goes: QUIRK.after - 1, outdoor: 29 }) })).toBeNull();
    expect(quirkFor({ ...s, habits: habits({ outdoor: 28 }) })).toBe('purist');
    expect(quirkFor({ ...s, hurt: 2, habits: habits({ outdoor: 28, power: 14 }) })).toBe('glasscannon');
    expect(quirkFor({ ...s, habits: habits({ evening: 14, dawn: 2 }) })).toBe('nightowl');
    expect(quirkFor({ ...s, habits: habits({}) })).toBeNull();
    expect(quirkFor({ ...s, day: 150, habits: habits({}) })).toBe('slowburn');
    // Two podiums, and the crowd's yours (Phase 18.4).
    const podium = { tier: 0, day: 4, place: 2, of: 10 };
    expect(
      quirkFor({
        ...s,
        habits: habits({}),
        comps: { on: null, points: [], results: [podium, podium], seasons: [] },
      }),
    ).toBe('compbeast');
    const r = act(
      { ...s, at: 'lot', min: 9 * 60, habits: habits({ outdoor: 28 }) },
      { t: 'act', act: 'lot.rest' },
    );
    expect(r.state.quirk).toBe('purist');
    expect(livingMult(r.state)).toBeCloseTo(0.75, 10);
  });

  it('move windows by the hour and your legs', () => {
    const r = ofType('technical')[0]!;
    const owl = { ...made(), quirk: 'nightowl' };
    expect(edgeWindows({ ...owl, min: 18 * 60 }, r, false)).toBeCloseTo(1.07, 10);
    expect(edgeWindows({ ...owl, min: 8 * 60 }, r, false)).toBeCloseTo(0.93, 10);
    expect(edgeWindows({ ...owl, min: 12 * 60 }, r, false)).toBe(1);
    const ww = { ...made(), quirk: 'weekend' };
    expect(edgeWindows({ ...ww, energy: 90 }, r, false)).toBeCloseTo(1.08, 10);
    expect(edgeWindows({ ...ww, energy: 20 }, r, false)).toBeCloseTo(0.9, 10);
  });
});
