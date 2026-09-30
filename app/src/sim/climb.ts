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
//
// On trad there are no bolts. Let go at a stance and you place a piece, which costs pump
// where hanging would pay it back; climb through and you've run it out. A fall catches on
// the last piece you placed, and with nothing low enough to hold it, you hit the ground.

import { margin, pumpFactor, windowFactor } from './climber';
import { effGrade, PUMPED, type BetaDef, type CruxDef, type RouteDef, type Verb } from './content/routes';
import { cold } from './body';
import { BODY, CLIMB, FOOD, FREESOLO, LOAD, TRAD } from './dials';
import { historyWindows } from './scars';
import { sickWindows } from './sick';
import { psycheWindows } from './psyche';
import { soloed } from './solo';
import { kitFactor } from './kit';
import { indoor } from './content/gym';
import { trainWindows } from './training';
import type { GameState, GoResult } from './types';
import { conditionsAt, sunOn } from './weather';

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
  // Trad: the feet you hit the ground from, when nothing held.
  deck?: number;
}

export interface Attempt {
  route: string;
  // The route itself travels with the go, so a go never looks anything up.
  def: RouteDef;
  pick: Record<string, string>;
  // Fixed at the tie-in: each crux's window scale (your skills against its grade, the rock,
  // your hunger), and how fast you pump (your endurance against the route).
  mods: { crux: Record<string, number>; pump: number; speed: number };
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
  // The beta you tried this go, crux by crux, in order.
  tried: string[];
  // Trad: the stances you've placed at, and how long you've been placing at this one.
  placed: number[];
  placing: number;
  t: number;
}

export type AttemptEvent =
  | { k: 'crux'; crux: string }
  | { k: 'cleared'; crux: string }
  | { k: 'fell'; crux: string | null }
  | { k: 'lowered' }
  | { k: 'placed'; at: number }
  | { k: 'sent' };

export interface Step {
  att: Attempt;
  events: AttemptEvent[];
}

// The step the game advances a go by; tests use the same one.
export const STEP = 1 / 60;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export const routeOf = (att: Attempt): RouteDef => att.def;

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
export function picks(s: GameState, r: RouteDef): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of r.cruxes) out[c.id] = s.routes[r.id]?.pick[c.id] ?? c.beta[0] ?? '';
  return out;
}

// What the day does to every window: the rock's conditions and the sun (outdoors only),
// hunger, whether you've warmed up, and your training block (peak, a taper).
export function dayFactor(s: GameState, r: RouteDef): { windows: number; grease: boolean } {
  const weak = s.fed < BODY.weakBelow ? 1 - (0.3 * (BODY.weakBelow - s.fed)) / BODY.weakBelow : 1;
  // A hard line before you've warmed up.
  // A meal that fuels you (Phase 22.3) widens every window for the rest of the day.
  const fuel = s.fueled === s.day ? FOOD.fueled : 1;
  // An old injury flaring where this line loads you, and fear of its style (Phase 22.4b).
  const body =
    weak *
    (cold(s, r) ? LOAD.coldWindows : 1) *
    trainWindows(s) *
    fuel *
    historyWindows(s, r.type) *
    sickWindows(s) *
    psycheWindows(s);
  if (indoor(r.place)) return { windows: body, grease: false };
  const c = conditionsAt(s.seed, s.day, r.place);
  const grease = s.min >= sunOn(s.seed, s.day, r.place, r.id);
  // No rope: your body climbs tighter, whatever you tell it.
  const solo = soloed(s, r) ? FREESOLO.windows : 1;
  return { windows: c.windows * (grease ? CLIMB.greaseFactor : 1) * body * solo, grease };
}

// A beta's scale for you, today: your skills in its style against the route's grade, and
// the day. It's what the beta sheet shows as bars and what the go uses.
export function betaScale(s: GameState, r: RouteDef, beta: string): number {
  const b = r.beta[beta];
  if (!b) return 1;
  return (
    windowFactor(margin(s.climber.skills, b.style, effGrade(r))) *
    dayFactor(s, r).windows *
    kitFactor(s, b.style)
  );
}

// How fast you move through a line: your level in its style against its grade.
export function paceFor(s: GameState, r: RouteDef): number {
  const P = CLIMB.pace;
  return clamp(1 + P.perGrade * margin(s.climber.skills, r.type, effGrade(r)), P.min, P.max);
}

// Called after the 'go' action has charged the go's costs.
export function startAttempt(s: GameState, r: RouteDef): Attempt {
  const pick = picks(s, r);
  const crux: Record<string, number> = {};
  for (const c of r.cruxes) crux[c.id] = betaScale(s, r, pick[c.id] ?? '');
  return {
    route: r.id,
    def: r,
    pick,
    mods: { crux, pump: pumpFactor(s.climber.skills, effGrade(r)), speed: paceFor(s, r) },
    pos: 0,
    pump: 0,
    hold: false,
    phase: 'climb',
    done: [],
    grease: dayFactor(s, r).grease,
    skinAtStart: s.skin,
    skin: 0,
    crux: null,
    fall: null,
    msg: null,
    hi: 0,
    tried: [],
    placed: [],
    placing: 0,
    t: 0,
  };
}

// The window a beta gets right now, at this crux.
export function cruxWindow(b: BetaDef, att: Attempt, crux: string): number {
  const skinNow = att.skinAtStart - att.skin;
  return (
    b.w *
    (att.mods.crux[crux] ?? 1) *
    (1 - (CLIMB.pumpShrink * att.pump) / 100) *
    (b.crimpy && skinNow < CLIMB.thinSkinBelow ? CLIMB.thinSkinFactor : 1)
  );
}

// The move you're on, as the climb panel counts it (0..moves).
export const moveAt = (att: Attempt, r: RouteDef = routeOf(att)): number =>
  clamp(Math.floor(att.pos), 0, r.moves);

export const resting = (att: Attempt, r: RouteDef = routeOf(att)): boolean =>
  !!r.rest && att.phase === 'climb' && Math.abs(att.pos - r.rest.at) < r.rest.radius;

// Trad: the stance you're at, if you're at one and haven't placed there yet.
export function stanceAt(att: Attempt, r: RouteDef = routeOf(att)): number | null {
  if (att.phase !== 'climb') return null;
  for (const at of r.stances ?? [])
    if (att.pos >= at - TRAD.before && att.pos <= at + TRAD.after && !att.placed.includes(at)) return at;
  return null;
}

// What catches a fall: the bolts clipped, or the pieces placed, below where you are.
export function protection(att: Attempt, r: RouteDef = routeOf(att)): number[] {
  const all = r.disc === 'trad' ? [...att.placed].sort((x, y) => x - y) : r.bolts;
  return all.filter((b) => b < att.pos - CLIMB.clipPast);
}

// Feet off the ground at `moves`.
const feetAt = (r: RouteDef, moves: number): number => (Math.max(0, moves) * r.heightFt) / r.moves;

function copy(a: Attempt): Attempt {
  return {
    ...a,
    done: [...a.done],
    tried: [...a.tried],
    placed: [...a.placed],
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
    w: cruxWindow(b, a, c.id),
    t: 0,
    m: 0,
    c: 0.5,
    inT: 0,
    hits: 0,
    miss: 0,
  };
  if (b.skin) a.skin += b.skin;
  a.tried.push(id);
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
  const move = Math.min(r.moves, Math.floor(a.pos) + 1);
  let ft: number;
  let to: number;
  let deck: number | undefined;
  if (r.disc === 'boulder') {
    // No rope: you drop to the pads from wherever you were.
    ft = Math.max(1, Math.round((a.pos * r.heightFt) / r.moves));
    to = 0;
  } else {
    const clipped = protection(a, r);
    const last = clipped.length ? clipped[clipped.length - 1]! : null;
    const over = last === null ? a.pos : a.pos - last;
    ft = Math.round((2 * over * r.heightFt) / r.moves + CLIMB.slackFt);
    to = last === null ? 0 : Math.max(0, last - over - CLIMB.lowerMargin);
    // On trad, a fall longer than the air under you ends on the ground. (Sport's first bolt
    // is low enough that the same fall is a step down, so its falls stay as they were.)
    const air = feetAt(r, a.pos);
    if (r.disc === 'trad' && ft >= air) {
      ft = Math.max(1, Math.round(air));
      to = 0;
      deck = ft;
    }
  }
  a.fall = {
    crux: a.crux?.id ?? null,
    move,
    text: line,
    ft,
    from: a.pos,
    to,
    t: 0,
    ...(deck ? { deck } : {}),
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
      // A piece half-placed when you move on isn't in.
      a.placing = 0;
      a.pos += CLIMB.climbRate * a.mods.speed * dt;
      a.pump += CLIMB.pumpClimb * a.mods.pump * dt;
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
      const at = stanceAt(a, r);
      if (at !== null) {
        // Placing: one hand on the rock, the other fiddling a cam in.
        a.placing += dt;
        a.pump += TRAD.placePump * dt;
        if (a.placing >= TRAD.placeTime) {
          a.placed.push(at);
          a.placing = 0;
          say(a, 'Piece in.', 1);
          ev.push({ k: 'placed', at });
        }
      } else a.pump -= (resting(a, r) ? CLIMB.pumpRest : CLIMB.pumpHang) * dt;
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
  return {
    sent: att.phase === 'sent',
    hi: att.hi,
    fellAt: att.fall?.crux ?? null,
    tried: [...att.tried],
    skin: att.skin,
    ...(att.fall?.deck ? { deck: att.fall.deck } : {}),
  };
}
