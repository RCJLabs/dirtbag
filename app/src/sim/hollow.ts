// Phase 32: the Hollow, the crag nobody has a topo for. 32.1: it's on no map and no road you
// know of until you've found it; finding it puts it in `unlocked`. 32.2: how you find it
// (Evan's call). Once you've sent a hard enough line outside (HOLLOW.from), three people can
// each tell you something: an old-timer (Ray; Frank, once Ray's gone), the old hand on the
// road, and an old guidebook at the shop. With all three, the walk in from the Gorge.

import { indoor, routeById } from './content/gym';
import { PLACES } from './content/places';
import { HOLLOW } from './dials';
import { inEdition } from './edition';
import { RAY_GONE } from './lives';
import type { GameState, HollowClue } from './types';

// Whether you know a place is there: every place but a hidden one you haven't found, and, in
// the demo (Phase 14.5), only the demo's places.
export const known = (s: GameState, id: string): boolean =>
  inEdition(id) && (!PLACES[id]?.hidden || s.unlocked.includes(id));

export const found = (s: GameState): boolean => s.unlocked.includes('hollow');

// Your hardest send outside: a boulder or a roped line, on the one scale.
export function hardestOutside(s: GameState): number {
  let top = -1;
  for (const [id, l] of Object.entries(s.routes)) {
    const r = l.sent ? routeById(s.seed, id) : undefined;
    if (r && !indoor(r.place) && !r.exped) top = Math.max(top, r.grade);
  }
  return top;
}

// Whether anyone would tell you yet: climbing hard enough outside, and not found it.
export const asking = (s: GameState): boolean => !found(s) && hardestOutside(s) >= HOLLOW.from;

export const hasClue = (s: GameState, c: HollowClue): boolean => (s.hollow?.clues ?? []).includes(c);

// The old-timer's word, due from Ray, or from Frank once Ray's gone.
export function oldWordDue(s: GameState, who: string): boolean {
  if (!asking(s) || hasClue(s, 'old')) return false;
  const gone = s.day >= RAY_GONE;
  return who === 'frank' ? gone : who === 'ray' && !gone;
}

// The old hand's receipt: on the road, while you're asking.
export const hitchDue = (s: GameState): boolean => asking(s) && !hasClue(s, 'hitch');

export function bookBlocked(s: GameState): string | null {
  if (!asking(s) || hasClue(s, 'book')) return 'Nothing in it you need';
  if (s.at !== 'shop') return 'The old guidebook is at the gear shop';
  return null;
}

// The walk in: all three clues, at the Gorge, early enough to get there and back.
export function walkBlocked(s: GameState): string | null {
  if (found(s)) return 'You know the way now';
  const held = s.hollow?.clues.length ?? 0;
  if (held < 3) return `${held} of 3: not enough to go on yet`;
  if (s.at !== 'gorge') return 'The wash starts at the Gorge';
  if (s.min >= HOLLOW.walk.by) return 'Too late in the day to start up the wash';
  if (s.energy < HOLLOW.walk.energy) return 'Too tired for a day of looking';
  return null;
}
