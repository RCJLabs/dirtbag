import { describe, expect, it } from 'vitest';
import {
  attemptInput,
  cruxWindow,
  dayFactor,
  goResult,
  resting,
  startAttempt,
  STEP,
  stepAttempt,
  type Attempt,
  type AttemptEvent,
} from './climb';
import { needFor } from './climber';
import { PUMPED, ROUTES } from './content/routes';
import { BODY, CLIMB } from './dials';
import { act, newGame } from './game';
import type { GameState } from './types';

const pump = ROUTES.pump!;
const warm = ROUTES.warm!;

// A climber whose skills sit exactly at The Pump's grade in every style, at the crag on a
// prime morning: skills and pump rate factor out, so these tests see the mechanics alone.
const fit = needFor(pump.grade);
function atCrag(min = 9 * 60): GameState {
  return {
    ...newGame('t'),
    at: 'road',
    min,
    climber: {
      name: 'Test',
      start: 'allrounder',
      skills: { power: fit, fingers: fit, endurance: fit, technique: fit, head: fit },
    },
  };
}
// The day's scale on every window: prime rock, before the sun.
const DAY1 = 1.1;

// A careful climber: rests on the ledge until the pump is nearly gone, and plays each verb
// by reading the meter the way the e2e bot reads it off the screen.
function careful() {
  let rested = false;
  let lastTap = -99;
  return (a: Attempt, i: number): boolean => {
    const v = a.crux;
    if (a.phase === 'crux' && v) {
      if (v.verb === 'tension') return v.m < v.c;
      if (v.verb === 'load') return v.m < CLIMB.load.target - v.w * 0.3;
      // timing: one-step taps near the middle, at most one per quarter second
      if (Math.abs(v.m - CLIMB.timing.center) < v.w * 0.5 && i - lastTap > 15) {
        lastTap = i;
        return true;
      }
      return false;
    }
    if (resting(a) && !rested) {
      if (a.pump > 6) return false;
      rested = true;
    }
    return true;
  };
}

// Runs a go to its end. Returns the final attempt, every event, and the input script
// (step index -> finger down or up) so the go can be replayed without the policy.
function run(att: Attempt, policy: (a: Attempt, i: number) => boolean, max = 60 * 90) {
  const events: AttemptEvent[] = [];
  const script: [number, boolean][] = [];
  for (let i = 0; i < max; i++) {
    const want = policy(att, i);
    if (want !== att.hold) {
      script.push([i, want]);
      const r = attemptInput(att, want);
      att = r.att;
      events.push(...r.events);
    }
    const r = stepAttempt(att, STEP);
    att = r.att;
    events.push(...r.events);
    if (att.phase === 'lowered' || att.phase === 'sent') break;
  }
  return { att, events, script };
}

function replay(att: Attempt, script: [number, boolean][], max = 60 * 90): Attempt {
  const at = new Map(script);
  for (let i = 0; i < max; i++) {
    const want = at.get(i);
    if (want !== undefined) att = attemptInput(att, want).att;
    att = stepAttempt(att, STEP).att;
    if (att.phase === 'lowered' || att.phase === 'sent') break;
  }
  return att;
}

function tiedIn(s: GameState = atCrag(), picks: Record<string, string> = {}): Attempt {
  let st = s;
  for (const [crux, beta] of Object.entries(picks)) {
    st = {
      ...st,
      routes: { ...st.routes, pump: { ...(st.routes.pump ?? emptyKnown()), known: ['A2', 'B2'] } },
    };
    st = act(st, { t: 'pick', route: 'pump', crux, beta }).state;
  }
  const r = act(st, { t: 'go', route: 'pump' });
  if (r.events.some((e) => e.k === 'refused')) throw new Error(JSON.stringify(r.events));
  return startAttempt(r.state, pump);
}

const emptyKnown = () => ({
  known: [],
  told: [],
  pick: {},
  falls: {},
  goes: 0,
  goesToday: 0,
  hi: 0,
  sent: null,
  sentToday: false,
});

describe('a go on The Pump', () => {
  it('a careful climber sends with either beta, and needs the rest to do it', () => {
    for (const picks of [{}, { A: 'A2', B: 'B2' }] as Record<string, string>[]) {
      const { att, events } = run(tiedIn(atCrag(), picks), careful());
      expect(att.phase).toBe('sent');
      expect(events.filter((e) => e.k === 'cleared').map((e) => (e as { crux: string }).crux)).toEqual([
        'A',
        'B',
      ]);
      expect(goResult(att)).toMatchObject({
        sent: true,
        hi: 24,
        tried: ['A' + (picks.A ? '2' : '1'), picks.B ?? 'B1'],
      });
    }
    // The same climber who never shakes out redlines before the top.
    const noRest = (a: Attempt, i: number) => (a.phase === 'crux' ? careful()(a, i) : true);
    const { att } = run(tiedIn(atCrag(), { B: 'B2' }), noRest);
    expect(att.phase).toBe('lowered');
    expect(att.fall?.text).toBe(PUMPED);
  });

  it('replays exactly from its inputs', () => {
    const start = tiedIn(atCrag(), { A: 'A2' });
    const live = run(start, careful());
    expect(replay(start, live.script)).toEqual(live.att);
  });

  it('carries a held finger into a tension move, but a throw waits for a fresh press', () => {
    const hold = (a: Attempt) => a.phase === 'climb' || a.phase === 'crux';
    const crux = (picks: Record<string, string>) => {
      let a = attemptInput(tiedIn(atCrag(), picks), true).att;
      while (a.phase === 'climb') a = stepAttempt(a).att;
      return a;
    };
    const tension = crux({});
    expect(tension.crux?.verb).toBe('tension');
    expect(tension.hold && hold(tension)).toBe(true);
    // Skip crux A by clearing it in the model, then climb into the roof on B1.
    let a: Attempt = { ...crux({}), phase: 'climb', crux: null, done: ['A'], pos: 13 };
    a = attemptInput(a, true).att;
    while (a.phase === 'climb') a = stepAttempt(a).att;
    expect(a.crux?.verb).toBe('load');
    expect(a.hold).toBe(false);
  });

  it('shrinks windows for pump and thin skin on crimps', () => {
    const b = pump.beta.A1!;
    const fresh = tiedIn();
    expect(cruxWindow(b, fresh, 'A')).toBeCloseTo(b.w * DAY1);
    expect(cruxWindow(b, { ...fresh, pump: 100 }, 'A')).toBeCloseTo(b.w * DAY1 * (1 - CLIMB.pumpShrink));
    expect(cruxWindow(b, { ...fresh, skinAtStart: CLIMB.thinSkinBelow - 1 }, 'A')).toBeCloseTo(
      b.w * DAY1 * CLIMB.thinSkinFactor,
    );
    // Thin skin doesn't touch a non-crimpy sequence.
    expect(cruxWindow(pump.beta.B2!, { ...fresh, skinAtStart: 5 }, 'B')).toBeCloseTo(pump.beta.B2!.w * DAY1);
  });

  it('fixes the day at the tie-in: the sun, the weather and your hunger', () => {
    expect(tiedIn().mods).toEqual({ crux: { A: DAY1, B: DAY1 }, pump: 1 });
    const sunny = tiedIn(atCrag(15 * 60));
    expect(sunny.grease).toBe(true);
    expect(sunny.mods.crux.A).toBeCloseTo(DAY1 * CLIMB.greaseFactor);
    // Hungry, down to 70% at empty.
    expect(dayFactor({ ...atCrag(), fed: 0 }, pump).windows).toBeCloseTo(DAY1 * 0.7);
    expect(dayFactor({ ...atCrag(), fed: BODY.weakBelow }, pump).windows).toBeCloseTo(DAY1);
    // Plastic doesn't care about the weather.
    expect(dayFactor({ ...atCrag(), at: 'gym' }, { ...warm, place: 'gym' }).windows).toBe(1);
  });

  it('works to your skills: a weaker climber gets narrower windows and pumps faster', () => {
    const weak = tiedIn({
      ...atCrag(),
      climber: { ...atCrag().climber, skills: newGame('t').climber.skills },
    });
    expect(weak.mods.crux.A!).toBeLessThan(DAY1);
    expect(weak.mods.pump).toBeGreaterThan(1);
  });

  it('judges a throw on release: short, long, or held too long', () => {
    const atLoad = (m: number): Attempt => {
      const a = tiedIn();
      return {
        ...a,
        phase: 'crux',
        pos: 13.25,
        hold: true,
        done: ['A'],
        crux: { id: 'B', beta: 'B1', verb: 'load', w: 0.05, t: 0, m, c: 0.5, inT: 0, hits: 0, miss: 0 },
      };
    };
    expect(attemptInput(atLoad(0.72), false).att.phase).toBe('climb');
    expect(attemptInput(atLoad(0.5), false).att.fall?.text).toBe(pump.beta.B1!.lines.short);
    expect(attemptInput(atLoad(0.9), false).att.fall?.text).toBe(pump.beta.B1!.lines.long);
    let held = atLoad(0.95);
    while (held.phase === 'crux') held = stepAttempt(held).att;
    expect(held.fall?.text).toBe(pump.beta.B1!.lines.held);
  });

  it('counts taps on the beat: two good ones through, two bad ones off', () => {
    const atTiming = (m: number): Attempt => {
      const a = tiedIn();
      return {
        ...a,
        phase: 'crux',
        pos: 3.65,
        crux: { id: 'A', beta: 'A2', verb: 'timing', w: 0.1, t: 0, m, c: 0.5, inT: 0, hits: 0, miss: 0 },
      };
    };
    const tap = (a: Attempt) => attemptInput(attemptInput(a, true).att, false).att;
    expect(tap(tap(atTiming(0.5))).phase).toBe('climb');
    const off = tap(tap(atTiming(0.1)));
    expect(off.phase).toBe('fall');
    expect(off.fall?.text).toBe(pump.beta.A2!.lines.fall);
  });

  it('drops you to the pads off a boulder, from wherever you were', () => {
    let a = startAttempt(act(atCrag(), { t: 'go', route: 'warm' }).state, warm);
    a = stepAttempt({ ...a, pos: 3.2, pump: 99.95, hold: true }).att;
    expect(a.phase).toBe('fall');
    expect(a.fall).toMatchObject({ to: 0, ft: Math.round((a.fall!.from * warm.heightFt) / warm.moves) });
  });

  it('catches a fall on the last clip, then lowers you below it', () => {
    const a = tiedIn();
    // Pumped between the bolts at 7.8 and 10.61, on move 9, below the ledge.
    let f = stepAttempt({ ...a, pos: 8.5, pump: 99.95, hold: true, done: ['A'] }).att;
    expect(f.phase).toBe('fall');
    const over = f.fall!.from - 7.8;
    expect(f.fall).toMatchObject({ crux: null, move: 9, text: PUMPED });
    expect(f.fall!.ft).toBe(Math.round((2 * over * pump.heightFt) / pump.moves + CLIMB.slackFt));
    let t = 0;
    while (f.phase === 'fall') {
      f = stepAttempt(f).att;
      t += STEP;
    }
    expect(f.phase).toBe('lowered');
    expect(t).toBeCloseTo(CLIMB.fallTime, 1);
    expect(f.pos).toBeCloseTo(Math.max(0, 7.8 - over - CLIMB.lowerMargin));
  });
});
