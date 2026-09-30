// Supplies and sickness (Phase 22.4c): tonight's chance of waking sick, what from, and what
// it does. The numbers are SUPPLIES and SICK (dials.ts).

import { BODY, FOOD, SICK, SUPPLIES } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';
import { seasonOf } from './weather';

export type SickKind = 'cold' | 'bug' | 'toothache';

// What raises tonight's odds, each with its share: the cold of a winter van night without the
// heater, low supplies, going to bed hungry, and the same meal four times running.
export function sickOdds(
  s: GameState,
  heated: boolean,
): { odds: number; winter: boolean; low: boolean; hungry: boolean; same: boolean } {
  const winter = seasonOf(s.day) === 'winter' && !heated;
  const low = s.supplies < SUPPLIES.low;
  const hungry = s.fed < BODY.hungryBelow;
  const same = s.meals.length >= FOOD.same && s.meals.every((m) => m === s.meals[0]);
  const odds =
    SICK.base +
    (winter ? SICK.winter : 0) +
    (low ? SICK.supplies : 0) +
    (hungry ? SICK.hungry : 0) +
    (same ? SICK.same : 0);
  return { odds, winter, low, hungry, same };
}

// Whether tonight makes you sick, and with what: seeded by the night.
export function sickRoll(s: GameState, heated: boolean): { kind: SickKind; days: number } | null {
  const o = sickOdds(s, heated);
  const r = Rng.fromStream(s.seed, 'events').derive(`sick-${s.day}`);
  if (r.next() >= o.odds) return null;
  const kind: SickKind = o.low && r.next() < 0.4 ? 'toothache' : o.winter ? 'cold' : 'bug';
  return { kind, days: r.int(SICK.days[0], SICK.days[1]) };
}

export const isSick = (s: GameState): boolean =>
  !!s.sick && (s.sick.kind === 'toothache' || s.day < s.sick.until);

// Every window, while you're sick.
export const sickWindows = (s: GameState): number => (isSick(s) ? SICK.windows : 1);

export const SICK_NAME: Record<SickKind, string> = {
  cold: 'a cold',
  bug: 'a stomach bug',
  toothache: 'a toothache',
};
