// Where people are, from the seed, the day and the clock. Like the weather, nothing is
// stored: tomorrow's schedule is already decided, you just don't know it yet.

import { Rng } from './rng';
import { conditions } from './weather';

// Hazel lives at the Lot and spends open days at the crag, where she'll belay you.
function hazel(seed: string, day: number, min: number): string {
  const open = conditions(seed, day).open;
  return open && min >= 8 * 60 && min < 17 * 60 ? 'road' : 'lot';
}

// Sage turns up about half the days, at the crag when it's dry and the gym when it isn't.
// Day two is always the gym: the first week should include meeting them.
function sage(seed: string, day: number, min: number): string | null {
  if (min < 9 * 60 || min >= 18 * 60 || day < 2) return null;
  const open = conditions(seed, day).open;
  if (day === 2) return 'gym';
  const r = Rng.fromStream(seed, 'events').derive(`sage-${day}`);
  if (!r.chance(0.55)) return null;
  if (!open) return 'gym';
  return r.chance(0.6) ? 'road' : 'gym';
}

export function whereIs(seed: string, who: string, day: number, min: number): string | null {
  if (who === 'hazel') return hazel(seed, day, min);
  if (who === 'sage') return sage(seed, day, min);
  return null;
}

// Who's at a place right now.
export const around = (seed: string, place: string, day: number, min: number): string[] =>
  ['hazel', 'sage'].filter((w) => whereIs(seed, w, day, min) === place);
