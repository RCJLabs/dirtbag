// Phase 42: belaying, played. You hold a partner's rope while they climb: keep the slack in the
// band as they climb and clip (hold to take in, let go to pay out), and when they come off,
// brake, then give a little as the rope comes tight, for a soft catch. A fixed-step model like
// a go's, so the same hands always make the same belay, and a bot can hold a rope too.

import { STEP } from './climb';
import { PLACES } from './content/places';
import { ROUTES, roped, type RouteDef } from './content/routes';
import { bolted } from './business';
import { BELAY, CLIMB } from './dials';
import { PARTNERS, whereNow } from './presence';
import { Rng } from './rng';
import type { BelayResult, GameState } from './types';
import { conditionsAt } from './weather';

export interface Rope {
  who: string;
  // The line they climb, and where its clips are, as shares of the way up.
  route: string;
  clips: number[];
  next: number;
  // Seconds since they set off; their height, as a share of the line; the slack on the meter.
  t: number;
  pos: number;
  slack: number;
  // Your hand on the rope: taking in.
  hold: boolean;
  // Seconds left on a clip's pull; where they come off.
  clipping: number;
  fallAt: number;
  phase: 'climb' | 'clip' | 'fall' | 'caught';
  // Seconds they climbed, and how many of those the slack sat in the band.
  climbed: number;
  inBand: number;
  // When you last let go, and, once it's tight, the catch.
  let: number;
  soft: boolean | null;
}

// The roped lines someone could climb at a crag (all of them, with `place` unset): climbable
// now, not up on a wall or an expedition.
const ropesAt = (s: GameState, place?: string): RouteDef[] =>
  Object.values(ROUTES).filter(
    (r) =>
      (place ? r.place === place : !!PLACES[r.place]?.crag) &&
      roped(r) &&
      !r.wall &&
      !r.exped &&
      bolted(s, r),
  );

// The line they climb: the unsent roped one you've had the most goes on there (anywhere, for
// a favour asked away from a crag), else the easiest there. They climb your line, so what they
// tell you after is about it.
export function belayLine(s: GameState, place?: string): RouteDef | null {
  const here = place && PLACES[place]?.crag ? ropesAt(s, place) : [];
  const pool = here.length ? here : ropesAt(s);
  const worked = pool
    .filter((r) => !s.routes[r.id]?.sent && (s.routes[r.id]?.goes ?? 0) > 0)
    .sort((a, b) => s.routes[b.id]!.goes - s.routes[a.id]!.goes);
  return worked[0] ?? [...pool].sort((a, b) => a.grade - b.grade)[0] ?? null;
}

// Why you can't give them a belay at the crag now, or null when you can.
export function belayBlocked(s: GameState, who: string): string | null {
  if (!PARTNERS.includes(who) || !s.people[who]) return 'Not someone you climb with';
  if (s.today.includes(`belayed-${who}`)) return 'You’ve belayed them today';
  if (s.min + BELAY.min > CLIMB.darkFrom) return 'Too late for a rope';
  if (whereNow(s, who) !== s.at || !PLACES[s.at]?.crag) return 'Not at a crag with you';
  const c = conditionsAt(s.seed, s.day, s.at);
  if (!c.open || c.closed) return 'Nobody’s climbing today';
  if (!ropesAt(s, s.at).length) return 'Nothing here on a rope';
  if (s.energy < BELAY.energy) return 'Too tired to hold a rope';
  return null;
}

export function startRope(s: GameState, who: string, r: RouteDef): Rope {
  const rng = Rng.fromStream(s.seed, 'events').derive(`belay-${who}-${s.day}`);
  const [lo, hi] = BELAY.fall;
  const bolts = r.bolts.length
    ? r.bolts.map((b) => b / (r.moves || 1))
    : Array.from({ length: BELAY.clips }, (_, i) => (i + 1) / (BELAY.clips + 1));
  return {
    who,
    route: r.id,
    clips: bolts.filter((b) => b > 0 && b < 1),
    next: 0,
    t: 0,
    pos: 0,
    slack: BELAY.start,
    hold: false,
    clipping: 0,
    fallAt: lo + rng.next() * (hi - lo),
    phase: 'climb',
    climbed: 0,
    inBand: 0,
    let: -1,
    soft: null,
  };
}

// Your hand goes on the rope (true) or comes off it (false).
export function ropeInput(b: Rope, on: boolean): Rope {
  if (b.phase === 'caught' || b.hold === on) return b;
  return { ...b, hold: on, let: on ? b.let : b.t };
}

const clamp = (x: number) => Math.max(0, Math.min(1, x));

export function stepRope(b: Rope, dt = STEP): Rope {
  if (b.phase === 'caught') return b;
  const hand = b.hold ? -BELAY.take : BELAY.pay;
  const n = { ...b, t: b.t + dt };
  if (b.phase === 'fall') {
    n.slack = clamp(b.slack + (hand - BELAY.drop) * dt);
    if (n.slack <= 0) {
      n.phase = 'caught';
      n.soft = !n.hold && n.t - n.let <= BELAY.soft;
    }
    return n;
  }
  const [lo, hi] = BELAY.band;
  n.climbed += dt;
  if (b.slack >= lo && b.slack <= hi) n.inBand += dt;
  if (b.phase === 'clip') {
    n.slack = clamp(b.slack + (hand - BELAY.clip.pull / BELAY.clip.s) * dt);
    n.clipping = b.clipping - dt;
    if (n.clipping <= 0) {
      n.slack = clamp(n.slack + BELAY.clip.back);
      n.next = b.next + 1;
      n.phase = 'climb';
    }
    return n;
  }
  n.slack = clamp(b.slack + (hand - BELAY.climb) * dt);
  n.pos = b.pos + BELAY.pace * dt;
  if (n.pos >= b.fallAt) n.phase = 'fall';
  else if (b.next < b.clips.length && n.pos >= b.clips[b.next]!) {
    n.phase = 'clip';
    n.clipping = BELAY.clip.s;
  }
  return n;
}

export const ropeResult = (b: Rope): BelayResult => ({
  band: b.climbed > 0 ? b.inBand / b.climbed : 0,
  soft: !!b.soft,
});

export const cleanBelay = (r: BelayResult): boolean => r.soft && r.band >= BELAY.clean;

// A bot's hands on the rope, to the catch: it keeps the slack near the middle, a reaction
// late, and on the fall brakes, then lets go when it judges the rope about to come tight. `rng`
// slows and smears it like a person; without one, it holds a perfect rope.
export function playRope(b: Rope, rng: Rng | null = null): Rope {
  const react = rng ? 0.15 + rng.next() * 0.25 : 0;
  const give = BELAY.soft * (rng ? 0.2 + rng.next() * 1.1 : 0.5);
  let r = b;
  let seen = -1;
  for (let i = 0; i < 60 * 120 && r.phase !== 'caught'; i++) {
    if (r.phase === 'fall') {
      if (seen < 0) seen = r.t;
      // How long the rope has before it's tight, once the hand's off it.
      const left = r.slack / (BELAY.drop - BELAY.pay);
      if (r.t - seen >= react) r = ropeInput(r, left > give);
    } else {
      const mid = (BELAY.band[0] + BELAY.band[1]) / 2;
      const want =
        r.phase === 'clip' ? false : r.slack > mid + 0.08 ? true : r.slack < mid - 0.08 ? false : r.hold;
      r = ropeInput(r, want);
    }
    r = stepRope(r);
  }
  return r;
}
