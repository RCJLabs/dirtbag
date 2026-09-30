// Crowds: who else is at the crag, from its draw, the weekend, the hour, the sky and the
// day's luck. A crowd queues for the ropes and knows the beta, whether you want it or not.

import { isWeekend } from './cond';
import { PLACES } from './content/places';
import { onWall, type RouteDef } from './content/routes';
import { CROWD } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';
import { conditionsAt } from './weather';

export type Crowd = 'empty' | 'quiet' | 'busy' | 'packed';

// How many are out, as a number: 1 is a crowd you'd call busy-plus.
export function crowdLevel(seed: string, day: number, min: number, place: string): number {
  const draw = PLACES[place]?.crowd;
  if (!draw) return 0;
  const c = conditionsAt(seed, day, place);
  if (c.closed || !c.open) return 0;
  let hour = 0;
  for (const h of CROWD.hours) if (min >= h.from) hour = h.f;
  const luck =
    1 + CROWD.luck * (2 * Rng.fromStream(seed, 'events').derive(`crowd-${place}-${day}`).next() - 1);
  return draw * (isWeekend(day) ? CROWD.weekend : 1) * hour * CROWD.sky[c.sky] * luck;
}

export function crowdAt(seed: string, day: number, min: number, place: string): Crowd {
  const n = crowdLevel(seed, day, min, place);
  const L = CROWD.levels;
  return n >= L.packed ? 'packed' : n >= L.busy ? 'busy' : n >= L.quiet ? 'quiet' : 'empty';
}

export const crowdNow = (s: GameState, place = s.at): Crowd => crowdAt(s.seed, s.day, s.min, place);

// Minutes in the queue before a go: for a rope when it's busy, for the boulders only when
// it's packed. A wall's pitches are above the queue.
export function queueMin(s: GameState, r: RouteDef): number {
  if (r.wall) return 0;
  const c = crowdNow(s, r.place);
  if (c !== 'busy' && c !== 'packed') return 0;
  return (onWall(r) && !r.dws ? CROWD.queue.rope : CROWD.queue.boulder)[c];
}

// The beta a crowd could tell you on a line: what you haven't learned yet, in its order.
export function sprayable(s: GameState, r: RouteDef): string[] {
  const L = s.routes[r.id];
  if (L?.sent) return [];
  const known = L?.known ?? [];
  return r.cruxes.flatMap((c) => c.beta.slice(1).filter((b) => !known.includes(b)));
}

// Whether someone at the base can tell you anything now.
export const canAsk = (s: GameState, r: RouteDef): boolean => {
  const c = crowdNow(s, r.place);
  return s.at === r.place && (c === 'busy' || c === 'packed') && sprayable(s, r).length > 0;
};

// On a first go at a packed crag, whether someone shouts the beta at you: seeded by the line
// and the day, so it's the same shout however you get there.
export const sprayedOn = (s: GameState, r: RouteDef): boolean =>
  crowdNow(s, r.place) === 'packed' &&
  !(s.routes[r.id]?.goes ?? 0) &&
  sprayable(s, r).length > 0 &&
  Rng.fromStream(s.seed, 'events').derive(`spray-${r.id}-${s.day}`).next() < CROWD.spray;
