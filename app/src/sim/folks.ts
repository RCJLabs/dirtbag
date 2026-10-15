// Holidays and the family (Phase 17.6). A holiday is the night of its day of the year: slept
// at the Lot, it's a night at the fire with whoever you're close to that's around. A call
// from home comes due on the age clock and waits on the phone in the van till you call back.
// Nothing's stored but the calls you've had.

import { HOLIDAYS, HOLIDAY_SCENES, FOLKS_CALLS, type Holiday, type HolidayFx } from './content/folks';
import { INGREDIENTS } from './content/food';
import { PEOPLE } from './content/people';
import { AGE, FOLKS, HOLIDAY, HOME, YEAR } from './dials';
import { RAY_GONE, stintOn, tamStops } from './lives';
import { tierOf } from './presence';
import type { GameState } from './types';
import { seasonOf, type Season } from './weather';
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

// Phase 35.4 (Evan's call): tonight's holiday as a scene at the fire, when you're sleeping at
// the Lot and your people are about. Alone, it's the night it always was.
export function holidayScene(s: GameState): Season | null {
  if (s.at !== 'lot' || !holidayOn(s.day) || !crew(s).length) return null;
  return seasonOf(s.day);
}

// The dish you'd bring: two servings of what the pantry holds most of.
export const DISH = 2;
export function holidayDish(s: GameState): { id: string; name: string } | null {
  const best = Object.entries(s.pantry)
    .filter(([id, n]) => INGREDIENTS[id] && n >= DISH)
    .sort((a, b) => b[1] - a[1])[0];
  return best ? { id: best[0], name: INGREDIENTS[best[0]]!.name } : null;
}

// Why a way to spend the night isn't open to you, or null.
export function holidayBlocked(s: GameState, fx: HolidayFx): string | null {
  if (fx.dish && !holidayDish(s)) return 'Nothing in the pantry to make a dish of';
  if (fx.cash && s.cash < -fx.cash) return 'Not the money for it';
  return null;
}

// What a way gives, in words from its numbers: "+14 psyche · +20 food · +1 bond with everyone".
export function holidayNote(s: GameState, fx: HolidayFx): string {
  const parts: string[] = [];
  const add = (n: number | undefined, unit: string) =>
    n && parts.push(`${n > 0 ? '+' : '−'}${Math.abs(n)} ${unit}`);
  add(fx.psyche, 'psyche');
  add(fx.energy, 'energy');
  add(fx.skin, 'skin');
  add(fx.fed, 'food');
  add(fx.bond, 'bond with everyone there');
  const dish = fx.dish ? holidayDish(s) : null;
  if (dish) parts.push(`${DISH} ${dish.name.toLowerCase()} from the pantry`);
  return parts.join(' · ');
}

export const holidayOpts = (season: string) => HOLIDAY_SCENES[season as Season]?.opts ?? [];
