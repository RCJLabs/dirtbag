// Holidays and the family (Phase 17.6). A holiday is the night of its day of the year: slept
// at the Lot, it's a night at the fire with whoever you're close to that's around. A call
// from home comes due on the age clock and waits on the phone in the van till you call back.
// Nothing's stored but the calls you've had.

import { HOLIDAYS, FOLKS_CALLS, type Holiday } from './content/folks';
import { PEOPLE } from './content/people';
import { AGE, FOLKS, HOLIDAY, HOME, YEAR } from './dials';
import { RAY_GONE, stintOn, tamStops } from './lives';
import { tierOf } from './presence';
import type { GameState } from './types';
import { seasonOf } from './weather';
import { yearsDone } from './year';

// The day of the year (YEAR.days long), from 1.
const dayOfYear = (day: number) => day - yearsDone(day) * YEAR.days;

// Tonight's holiday, if it is one.
export function holidayOn(day: number): Holiday | null {
  return HOLIDAY.on.includes(dayOfYear(day)) ? HOLIDAYS[seasonOf(day)] : null;
}

// Who's around for it: everyone you're Regulars with or closer, unless they're away, off on
// a stint, or their life's moved on.
export function crew(s: GameState): string[] {
  return Object.entries(s.people)
    .filter(([id, p]) => PEOPLE[id] && tierOf(p.bond) >= HOME.tier)
    .filter(([id, p]) => !(p.away !== undefined && s.day < p.away) && !stintOn(s.seed, id, s.day))
    .filter(
      ([id, p]) =>
        !(id === 'ray' && s.day >= RAY_GONE) && !(id === 'tam' && s.day >= (tamStops(p) ?? Infinity)),
    )
    .map(([id]) => id);
}

// The call from home that's due tonight, if one is: the next of them, its year come.
export function folksDue(s: GameState): number | null {
  const n = s.folks.calls;
  if (n >= FOLKS_CALLS.length || s.life.retired) return null;
  return s.day >= (FOLKS.from + n * FOLKS.every) * AGE.days + 1 ? n : null;
}
