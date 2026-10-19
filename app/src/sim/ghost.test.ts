// Phase 38: a ghost of your best go. A go keeps its pace from your first move (where it stopped
// and started, a cleared crux in a moment, where it came off); a line keeps its best go, the
// highest and of two as high the quicker, till it's sent; the ghost climbs that pace to where
// it came off and no further; a set's problem that's come down takes its ghost with it; and
// the save.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { attemptInput, goResult, startAttempt, STEP, stepAttempt, type Attempt } from './climb';
import { needFor } from './climber';
import { ROUTES } from './content/routes';
import { CLIMB, GHOST } from './dials';
import { act, newGame } from './game';
import { ghostAt, ghostOf, outclimbs } from './ghost';
import { fromSave, toSave } from './save';
import type { GameState, GoResult, RouteLog } from './types';

const V80 = readFileSync(new URL('./fixtures/save-v80.json', import.meta.url), 'utf8');

// The Pump: a tension move at A (3.65 to 5.9), a throw at B (from 13.25).
const pump = ROUTES.pump!;
const fit = needFor(pump.grade);
const atCrag = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('ghost'),
  at: 'road',
  min: 9 * 60,
  today: ['warm'],
  psyche: { level: 50, stale: 0 },
  climber: {
    name: 'Test',
    start: 'allrounder',
    skills: { power: fit, fingers: fit, endurance: fit, technique: fit, head: fit },
  },
  ...over,
});

// Hands that hold on till the moves run out: wait `wait` steps before the first move, stop
// for `rest` steps at step `restAt`, read A's band and stay in it, and jab B's throw.
function hands(o: { wait?: number; restAt?: number; rest?: number; flicker?: number } = {}) {
  let jabbed = false;
  return (a: Attempt, i: number): boolean => {
    if (i < (o.wait ?? 0)) return false;
    const v = a.crux;
    if (a.phase === 'crux' && v) {
      if (v.verb === 'tension') return v.m < v.c;
      if (v.verb === 'load') return !jabbed && (jabbed = true);
      return false;
    }
    if (o.restAt !== undefined && i >= o.restAt && i < o.restAt + (o.rest ?? 0)) return false;
    if (o.flicker && i < o.flicker) return i % 4 < 2;
    return true;
  };
}

// A go to its end, and the step it came off on.
function play(policy: (a: Attempt, i: number) => boolean, s: GameState = atCrag()) {
  let a = startAttempt(s, pump);
  let off = -1;
  for (let i = 0; i < 60 * 90; i++) {
    const want = policy(a, i);
    if (want !== a.hold) a = attemptInput(a, want).att;
    const was = a.phase;
    if (a.phase === 'fall' && off < 0) off = i;
    a = stepAttempt(a, STEP).att;
    if (was !== 'fall' && a.phase === 'fall' && off < 0) off = i + 1;
    if (a.phase === 'lowered' || a.phase === 'sent') break;
  }
  return { a, res: goResult(a), off };
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const points = (k: number[]) => k.flatMap((v, i) => (i % 2 ? [] : [{ t: v, pos: k[i + 1]! }]));
const fellAt = (k: number[], t: number, crux = 'B'): GoResult => ({
  sent: false,
  hi: Math.floor(k.at(-1)!) + 1,
  fellAt: crux,
  tried: [],
  skin: 0,
  trace: k,
});
// A go on The Pump and how it ended, through act.
function go(s: GameState, res: GoResult): GameState {
  const g = act(s, { t: 'go', route: 'pump' });
  if (g.events[0]?.k === 'refused') throw new Error(JSON.stringify(g.events[0]));
  return act(g.state, { t: 'done', route: 'pump', result: res }).state;
}
const fresh = (s: GameState): GameState => ({ ...s, energy: 100, skin: 100, min: 9 * 60 });

describe('Phase 38: a ghost of your best go', () => {
  it('keeps a go’s pace from your first move: where it stopped and started, a cleared crux in a moment, and where it came off', () => {
    const { a, res, off } = play(hands({ wait: 30, restAt: 90, rest: 60 }));
    expect(a.fall?.crux).toBe('B');
    expect(a.done).toEqual(['A']);
    const k = res.trace!;
    const p = points(k);
    // The half second you stood at the bottom isn't the go's: it starts at your first move.
    expect(a.moved).toBeCloseTo(30 * STEP, 6);
    expect(p[0]).toEqual({ t: 0, pos: 0 });
    // A second's rest a second into the climb: two points at one place, a second apart.
    expect(p[1]!.t).toBeCloseTo(60 * STEP, 1);
    expect(p[2]!.pos).toBe(p[1]!.pos);
    expect(p[2]!.t - p[1]!.t).toBeCloseTo(1, 1);
    // A's band held: still at its start till it's cleared, then past it in a moment.
    const jump = p.findIndex((q, i) => i > 0 && q.t === p[i - 1]!.t && q.pos > p[i - 1]!.pos);
    expect(p[jump - 1]!.pos).toBe(pump.cruxes[0]!.from);
    expect(p[jump]!.pos).toBe(r2(pump.cruxes[0]!.to + CLIMB.clearCrux));
    // Off B's throw: the last point is where you came off, when you did.
    expect(p.at(-1)).toEqual({ t: r2((off - 30) * STEP), pos: r2(a.fall!.from) });
    expect(p.at(-1)!.pos).toBeLessThanOrEqual(res.hi);
    // Time only runs forward, and you're never past where you came off.
    for (let i = 1; i < p.length; i++) expect(p[i]!.t).toBeGreaterThanOrEqual(p[i - 1]!.t);
    expect(Math.max(...p.map((q) => q.pos))).toBe(p.at(-1)!.pos);
  });

  it('keeps no pace for a go that never left the ground, and none for a send', () => {
    const still = play(() => false);
    expect(still.a.moved).toBeNull();
    expect(goResult(still.a).trace).toBeUndefined();
    const strong = needFor(pump.grade + 4);
    const sent = play(
      hands(),
      atCrag({
        climber: {
          name: 'Test',
          start: 'allrounder',
          skills: { power: strong, fingers: strong, endurance: strong, technique: strong, head: strong },
        },
        routes: {
          pump: {
            known: ['B2'],
            told: [],
            pick: { B: 'B2' },
            falls: {},
            goes: 0,
            goesToday: 0,
            hi: 0,
            sent: null,
            sentToday: false,
          },
        },
      }),
    );
    expect(sent.res.sent).toBe(true);
    expect(sent.res.trace).toBeUndefined();
  });

  it('keeps no more than its points, the last where it came off', () => {
    const { a, res } = play(hands({ flicker: 60 * 20 }));
    expect(a.phase).toBe('lowered');
    expect(res.trace).toHaveLength(2 * GHOST.keys);
    expect(res.trace!.at(-1)).toBe(r2(a.fall!.from));
  });

  it('climbs the pace to where it came off and no further, still where it stopped, then off (criterion 1)', () => {
    const { a, res } = play(hands({ wait: 30, restAt: 90, rest: 60 }));
    const k = res.trace!;
    const end = k.at(-2)!;
    let top = 0;
    let last = 0;
    for (let t = 0; t < end; t += 1 / 120) {
      const g = ghostAt(k, t)!;
      expect(g.off).toBe(0);
      // Up only: a ghost never climbs down.
      expect(g.pos).toBeGreaterThanOrEqual(last - 1e-9);
      last = g.pos;
      top = Math.max(top, g.pos);
    }
    expect(top).toBeLessThanOrEqual(a.fall!.from + 1e-9);
    expect(top).toBeLessThanOrEqual(res.hi);
    // Still through the rest, at the place it stopped.
    const p = points(k);
    expect(ghostAt(k, (p[1]!.t + p[2]!.t) / 2)!.pos).toBe(p[1]!.pos);
    // Off at the end: where it came off, letting go over a fall's time, then gone.
    expect(ghostAt(k, end)).toEqual({ pos: k.at(-1), off: 0 });
    expect(ghostAt(k, end + CLIMB.fallTime / 2)!.off).toBeCloseTo(0.5, 6);
    expect(ghostAt(k, end + CLIMB.fallTime)).toBeNull();
  });

  it('keeps the best go: the highest, and of two as high the quicker there', () => {
    let s = atCrag();
    const first = [0, 0, 2, 3.65, 6, 3.65];
    s = go(s, fellAt(first, 6, 'A'));
    expect(s.routes.pump!.ghost).toEqual(first);
    // Lower: the ghost stays.
    s = go(fresh(s), fellAt([0, 0, 1.5, 2.3], 1.5, 'A'));
    expect(s.routes.pump!.ghost).toEqual(first);
    // As high, slower: it stays.
    s = go(fresh(s), fellAt([0, 0, 2.5, 3.65, 7, 3.65], 7, 'A'));
    expect(s.routes.pump!.ghost).toEqual(first);
    // As high, quicker: this one.
    const quick = [0, 0, 2.2, 3.65, 4.1, 3.65];
    s = go(fresh(s), fellAt(quick, 4.1, 'A'));
    expect(s.routes.pump!.ghost).toEqual(quick);
    // Higher: this one, however long it took.
    const high = [0, 0, 2.4, 3.65, 9, 3.65, 9, 6.03, 14, 13.25, 16, 13.25];
    s = go(fresh(s), fellAt(high, 16));
    expect(s.routes.pump!.ghost).toEqual(high);
    expect(s.routes.pump!.hi).toBe(14);
  });

  it('goes once the line’s sent, and a lap climbs alone', () => {
    let s = go(atCrag(), fellAt([0, 0, 2, 3.65, 6, 3.65], 6, 'A'));
    expect(s.routes.pump!.ghost).toBeDefined();
    s = go(fresh(s), { sent: true, hi: pump.moves, fellAt: null, tried: [], skin: 0 });
    expect(s.routes.pump!.sent).not.toBeNull();
    expect(s.routes.pump!.ghost).toBeUndefined();
    expect(ghostOf(s.routes.pump, 1)).toBeNull();
    s = go(fresh(s), fellAt([0, 0, 2, 3.65, 6, 3.65], 6, 'A'));
    expect(s.routes.pump!.ghost).toBeUndefined();
  });

  it('climbs a high point from before paces were kept evenly, till a go as high takes its place', () => {
    const old: RouteLog = {
      known: [],
      told: [],
      pick: {},
      falls: { B: 1 },
      goes: 3,
      goesToday: 0,
      hi: 14,
      sent: null,
      sentToday: false,
    };
    // At your pace now, up into the move it came off: even, no stops.
    const even = ghostOf(old, 1.1)!;
    expect(even).toEqual([0, 0, r2(13.5 / (CLIMB.climbRate * 1.1)), 13.5]);
    expect(ghostOf({ ...old, hi: 0, goes: 0 }, 1)).toBeNull();
    // A go short of it isn't the best: the even climb stays.
    let s = atCrag({ routes: { pump: old } });
    s = go(s, fellAt([0, 0, 2, 3.65, 6, 3.65], 6, 'A'));
    expect(s.routes.pump!.ghost).toBeUndefined();
    expect(outclimbs(fellAt([0, 0, 9, 13.25], 9), undefined, 14)).toBe(true);
    // One as high is.
    const high = [0, 0, 2.4, 3.65, 9, 3.65, 9, 6.03, 14, 13.25, 16, 13.25];
    s = go(fresh(s), fellAt(high, 16));
    expect(s.routes.pump!.ghost).toEqual(high);
  });

  it('lets a set’s problem take its ghost when it comes down, and keeps a crag’s', () => {
    const k = [0, 0, 2, 3.65, 6, 3.65];
    const log = (): RouteLog => ({
      known: [],
      told: [],
      pick: {},
      falls: {},
      goes: 1,
      goesToday: 1,
      hi: 4,
      sent: null,
      sentToday: false,
      ghost: k,
    });
    // The last night of week one, at the van: the gym's set comes down by morning.
    const s = atCrag({
      day: 7,
      at: 'lot',
      min: 18 * 60,
      cash: 100,
      routes: { pump: log(), 'sc-1-1': log() },
    });
    const r = act(s, { t: 'act', act: 'lot.sleep' });
    expect(r.state.day).toBe(8);
    expect(r.state.routes['sc-1-1']!.ghost).toBeUndefined();
    expect(r.state.routes['sc-1-1']!.hi).toBe(4);
    expect(r.state.routes.pump!.ghost).toEqual(k);
  });

  it('loads a save from before it, high points and all, and keeps a ghost through a save', () => {
    const r = fromSave(V80);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(80);
    expect(r.state).toEqual({ ...JSON.parse(V80).state, vanPlan: expect.any(Object) });
    const flagged = Object.entries(r.state.routes).find(([, L]) => !L.sent && L.hi > 0);
    expect(flagged).toBeDefined();
    expect(ghostOf(flagged![1], 1)).toEqual([
      0,
      0,
      r2((flagged![1].hi - 0.5) / CLIMB.climbRate),
      flagged![1].hi - 0.5,
    ]);
    const s = go(atCrag(), fellAt([0, 0, 2, 3.65, 6, 3.65], 6, 'A'));
    const back = fromSave(toSave(s, 'test'));
    expect(back.ok && back.state.routes.pump!.ghost).toEqual([0, 0, 2, 3.65, 6, 3.65]);
    // A pace that runs backwards, or comes in halves, isn't one.
    for (const bad of [
      [0, 0, 2],
      [0, 0, 3, 2, 2, 3],
      [0, 0, 2, -1],
    ]) {
      const raw = JSON.parse(toSave(s, 'test'));
      raw.state.routes.pump.ghost = bad;
      expect(fromSave(JSON.stringify(raw)).ok).toBe(false);
    }
  });
});
