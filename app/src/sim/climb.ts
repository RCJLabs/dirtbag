// One go on a route, as a fixed-step model. The player's hold/release enters through
// attemptInput(); time enters only through stepAttempt(). Both are pure, so a go replays
// exactly from its inputs: the tests drive it with a script, the game with a finger.
//
// Between cruxes you hold to climb and pump builds; letting go pays it back, a rest pays it
// back faster. At a crux the beta you picked sets the verb and the window:
//   tension  hold and release to keep the marker in a band that drifts;
//   timing   tap when the sweeping marker crosses the band, twice;
//   load     hold to charge, let go inside the band.
// Pump, afternoon sun and thin skin shrink the window when the crux starts.

import { PUMPED, ROUTES, type BetaDef, type CruxDef, type RouteDef, type Verb } from './content/routes';
import { CLIMB } from './dials';
import type { GameState, GoResult } from './types';

export type Phase = 'climb' | 'crux' | 'fall' | 'lowered' | 'sent';

export interface CruxRun {
  id: string;
  beta: string;
  verb: Verb;
  // Half-width of the window, fixed when the crux starts.
  w: number;
  // Seconds in the crux.
  t: number;
  // The marker and the band's centre, both 0..1 along the meter.
  m: number;
  c: number;
  // Seconds spent inside the band (tension).
  inT: number;
  hits: number;
  miss: number;
}

export interface FallRun {
  crux: string | null;
  move: number;
  text: string;
  ft: number;
  from: number;
  to: number;
  t: number;
}

export interface Attempt {
  route: string;
  pick: Record<string, string>;
  // Moves climbed, fractional.
  pos: number;
  pump: number;
  hold: boolean;
  phase: Phase;
  done: string[];
  grease: boolean;
  skinAtStart: number;
  // Extra skin spent on the way.
  skin: number;
  crux: CruxRun | null;
  fall: FallRun | null;
  // The climb panel's current line and how long it stays up.
  msg: { text: string; t: number } | null;
  hi: number;
  t: number;
}

export type AttemptEvent =
  | { k: 'crux'; crux: string }
  | { k: 'cleared'; crux: string }
  | { k: 'fell'; crux: string | null }
  | { k: 'lowered' }
  | { k: 'sent' };

export interface Step {
  att: Attempt;
  events: AttemptEvent[];
}

// The step the game advances a go by; tests use the same one.
export const STEP = 1 / 60;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function routeOf(att: Attempt): RouteDef {
  const r = ROUTES[att.route];
  if (!r) throw new Error(`unknown route ${att.route}`);
  return r;
}

export function betaOf(r: RouteDef, id: string): BetaDef {
  const b = r.beta[id];
  if (!b) throw new Error(`unknown beta ${id}`);
  return b;
}

function cruxOf(r: RouteDef, id: string): CruxDef {
  const c = r.cruxes.find((x) => x.id === id);
  if (!c) throw new Error(`unknown crux ${id}`);
  return c;
}

// The beta each crux will use: your pick, or the obvious sequence.
export function picks(s: GameState, routeId: string): Record<string, string> {
  const r = ROUTES[routeId];
  const out: Record<string, string> = {};
  for (const c of r?.cruxes ?? []) out[c.id] = s.routes[routeId]?.pick[c.id] ?? c.beta[0] ?? '';
  return out;
}

// Called after the 'go' action has charged the go's costs.
export function startAttempt(s: GameState, routeId: string): Attempt {
  return {
    route: routeId,
    pick: picks(s, routeId),
    pos: 0,
    pump: 0,
    hold: false,
    phase: 'climb',
    done: [],
    grease: s.min >= CLIMB.greaseFrom,
    skinAtStart: s.skin,
    skin: 0,
    crux: null,
    fall: null,
    msg: null,
    hi: 0,
    t: 0,
  };
}

// The window a beta gets right now.
export function cruxWindow(b: BetaDef, att: Attempt): number {
  const skinNow = att.skinAtStart - att.skin;
  return (
    b.w *
    (1 - (CLIMB.pumpShrink * att.pump) / 100) *
    (att.grease ? CLIMB.greaseFactor : 1) *
    (b.crimpy && skinNow < CLIMB.thinSkinBelow ? CLIMB.thinSkinFactor : 1)
  );
}

// The move you're on, as the climb panel counts it (0..moves).
export const moveAt = (att: Attempt, r: RouteDef = routeOf(att)): number =>
  clamp(Math.floor(att.pos), 0, r.moves);

export const resting = (att: Attempt, r: RouteDef = routeOf(att)): boolean =>
  !!r.rest && att.phase === 'climb' && Math.abs(att.pos - r.rest.at) < r.rest.radius;

function copy(a: Attempt): Attempt {
  return {
    ...a,
    done: [...a.done],
    crux: a.crux && { ...a.crux },
    fall: a.fall && { ...a.fall },
    msg: a.msg && { ...a.msg },
  };
}

function say(a: Attempt, text: string, t: number): void {
  a.msg = { text, t };
}

function startCrux(a: Attempt, r: RouteDef, c: CruxDef, ev: AttemptEvent[]): void {
  const id = a.pick[c.id] ?? c.beta[0] ?? '';
  const b = betaOf(r, id);
  // A tension move carries a held finger straight in. A throw or a foot waits for a fresh
  // press, so it never starts charging on its own.
  const keep = b.verb === 'tension' && a.hold;
  a.phase = 'crux';
  a.hold = keep;
  a.crux = {
    id: c.id,
    beta: id,
    verb: b.verb,
    w: cruxWindow(b, a),
    t: 0,
    m: 0,
    c: 0.5,
    inT: 0,
    hits: 0,
    miss: 0,
  };
  if (b.skin) a.skin += b.skin;
  ev.push({ k: 'crux', crux: c.id });
}

function clear(a: Attempt, r: RouteDef, ev: AttemptEvent[]): void {
  if (!a.crux) return;
  const c = cruxOf(r, a.crux.id);
  a.done.push(c.id);
  a.pos = c.to + CLIMB.clearCrux;
  a.phase = 'climb';
  a.crux = null;
  say(a, c.win, 1.6);
  ev.push({ k: 'cleared', crux: c.id });
}

function fall(a: Attempt, r: RouteDef, text: string | undefined, ev: AttemptEvent[]): void {
  const line = text ?? 'You come off.';
  const clipped = r.bolts.filter((b) => b < a.pos - CLIMB.clipPast);
  const last = clipped.length ? clipped[clipped.length - 1]! : null;
  const over = last === null ? a.pos : a.pos - last;
  const move = Math.min(r.moves, Math.floor(a.pos) + 1);
  a.fall = {
    crux: a.crux?.id ?? null,
    move,
    text: line,
    ft: Math.round((2 * over * r.heightFt) / r.moves + CLIMB.slackFt),
    from: a.pos,
    to: last === null ? 0 : Math.max(0, last - over - CLIMB.lowerMargin),
    t: 0,
  };
  a.hi = Math.max(a.hi, move);
  a.phase = 'fall';
  a.hold = false;
  a.crux = null;
  say(a, line, 3);
  ev.push({ k: 'fell', crux: a.fall.crux });
}

function send(a: Attempt, r: RouteDef, ev: AttemptEvent[]): void {
  a.phase = 'sent';
  a.pos = r.moves;
  a.hold = false;
  a.hi = r.moves;
  ev.push({ k: 'sent' });
}

// The finger goes down (on) or comes up (off).
export function attemptInput(att: Attempt, on: boolean): Step {
  const a = copy(att);
  const ev: AttemptEvent[] = [];
  if (a.phase === 'fall' || a.phase === 'lowered' || a.phase === 'sent') {
    a.hold = false;
    return { att: a, events: ev };
  }
  const was = a.hold;
  a.hold = on;
  const v = a.crux;
  if (a.phase !== 'crux' || !v) return { att: a, events: ev };
  const r = routeOf(a);
  const b = betaOf(r, v.beta);
  if (v.verb === 'load' && was && !on) {
    const target = CLIMB.load.target;
    if (Math.abs(v.m - target) <= v.w) clear(a, r, ev);
    else fall(a, r, v.m < target ? b.lines.short : b.lines.long, ev);
  } else if (v.verb === 'timing' && on && !was) {
    if (Math.abs(v.m - CLIMB.timing.center) <= v.w) {
      v.hits++;
      say(a, b.lines.hit ?? 'Good.', 0.8);
    } else {
      v.miss++;
      say(a, b.lines.miss ?? 'Missed.', 0.8);
    }
    if (v.hits >= CLIMB.timing.hits) clear(a, r, ev);
    else if (v.miss >= CLIMB.timing.misses) fall(a, r, b.lines.fall, ev);
  }
  return { att: a, events: ev };
}

export function stepAttempt(att: Attempt, dt: number = STEP): Step {
  const a = copy(att);
  const ev: AttemptEvent[] = [];
  const r = routeOf(a);
  a.t += dt;
  if (a.msg) {
    a.msg.t -= dt;
    if (a.msg.t <= 0) a.msg = null;
  }

  if (a.phase === 'fall' && a.fall) {
    a.fall.t += dt;
    const k = clamp(a.fall.t / CLIMB.fallTime, 0, 1);
    a.pos = a.fall.from + (a.fall.to - a.fall.from) * (1 - Math.pow(1 - k, 3));
    if (k >= 1) {
      a.phase = 'lowered';
      ev.push({ k: 'lowered' });
    }
    return { att: a, events: ev };
  }

  if (a.phase === 'climb') {
    if (a.hold) {
      a.pos += CLIMB.climbRate * dt;
      a.pump += CLIMB.pumpClimb * dt;
      for (const c of r.cruxes) {
        if (!a.done.includes(c.id) && a.pos >= c.from) {
          a.pos = c.from;
          startCrux(a, r, c, ev);
          return { att: a, events: ev };
        }
      }
      if (a.pos >= r.moves) {
        send(a, r, ev);
        return { att: a, events: ev };
      }
    } else {
      a.pump -= (resting(a, r) ? CLIMB.pumpRest : CLIMB.pumpHang) * dt;
    }
    a.pump = clamp(a.pump, 0, 100);
    if (a.pump >= 100) fall(a, r, PUMPED, ev);
    return { att: a, events: ev };
  }

  if (a.phase === 'crux' && a.crux) {
    const v = a.crux;
    const b = betaOf(r, v.beta);
    v.t += dt;
    a.pump = clamp(a.pump + CLIMB.pumpCrux * dt, 0, 100);
    if (v.verb === 'load') {
      if (a.hold) {
        v.m += CLIMB.load.rate * dt;
        if (v.m >= 1) {
          v.m = 1;
          fall(a, r, b.lines.held, ev);
        }
      }
    } else if (v.verb === 'tension') {
      const T = CLIMB.tension;
      v.m = clamp(v.m + (a.hold ? T.speed : -T.speed) * dt, 0, 1);
      v.c = T.center + T.swing * Math.sin(v.t * (b.rate ?? 1.6));
      if (Math.abs(v.m - v.c) <= v.w) v.inT += dt;
      if (v.inT >= (b.need ?? 1.6)) clear(a, r, ev);
      else if (v.t > T.timeout) fall(a, r, b.lines.fall, ev);
    } else {
      const ph = (v.t % CLIMB.timing.period) / CLIMB.timing.period;
      v.m = ph < 0.5 ? ph * 2 : 2 - ph * 2;
    }
  }
  return { att: a, events: ev };
}

export function goResult(att: Attempt): GoResult {
  return { sent: att.phase === 'sent', hi: att.hi, fellAt: att.fall?.crux ?? null, skin: att.skin };
}
