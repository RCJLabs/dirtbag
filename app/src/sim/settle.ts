// Phase 32.4: repeats settle every first ascent of yours (Evan's call). In the weeks after, others
// come and repeat it, seeded per line; after a few, the grade on the map is what the line is,
// whatever you called it. Derived from the seed and the day you sent it: nothing is stored but
// how many of them you've heard about (`FirstAscent.heard`).

import { PLACES } from './content/places';
import { ROUTES } from './content/routes';
import { FA_NOTE } from './content/settle';
import { SETTLE } from './dials';
import { fill } from './format';
import { Rng } from './rng';
import type { GameState } from './types';

// The days the line's repeats come, up to the one that settles it. Only your own: a first
// ascent somebody else got (or the family's, from before you) has had its repeats already.
export function repeatDays(s: GameState, id: string): number[] {
  const f = s.firsts[id];
  if (!f || f.by) return [];
  const r = Rng.fromStream(s.seed, 'events').derive(`repeats-${id}`);
  const slow = PLACES[ROUTES[id]?.place ?? '']?.wild ? SETTLE.wild : 1;
  const days: number[] = [];
  let d = f.day;
  for (let i = 0; i < SETTLE.repeats; i++) {
    d += r.int(SETTLE.gap[0], SETTLE.gap[1]) * slow;
    days.push(d);
  }
  return days;
}

// How many repeats you could have heard of by today: those on a day that's over.
export const repeatsOf = (s: GameState, id: string): number =>
  repeatDays(s, id).filter((d) => d < s.day).length;

// Settled: the grade is the line's now, not your call.
export const settled = (s: GameState, id: string): boolean => repeatsOf(s, id) >= SETTLE.repeats;

// The beta sheet's note on a line of yours: the repeats so far, or the grade it settled at.
export function faNote(s: GameState, id: string, grade: string): string {
  const n = repeatsOf(s, id);
  if (n >= SETTLE.repeats) return fill(FA_NOTE.settled, { grade });
  return n ? fill(FA_NOTE.some, { n, of: SETTLE.repeats }) : FA_NOTE.none;
}
