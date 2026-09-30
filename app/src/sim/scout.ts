// Scout's life (Phase 22.7): his age in dog-years, the perks his bond has earned, and the
// nights they show. v0.956's lifecycle, to his last day. The numbers are DOG (dials.ts).

import { INGREDIENTS } from './content/food';
import { DOG } from './dials';
import { Rng } from './rng';
import type { DogLog, GameState } from './types';

export const dogAge = (dog: DogLog, day: number): number => Math.floor((day - dog.since) / DOG.year);

export type Perk = keyof typeof DOG.perks;
export const hasPerk = (s: GameState, p: Perk): boolean =>
  !!s.dog && s.dog.bond >= DOG.perks[p] && s.dog.fed >= DOG.hungryBelow;

export type DogStage = 'pup' | 'prime' | 'gray' | 'senior' | 'old';
export function dogStage(dog: DogLog, day: number): DogStage {
  const a = dogAge(dog, day);
  return a >= DOG.end - 2
    ? 'old'
    : a >= DOG.senior
      ? 'senior'
      : a >= DOG.gray
        ? 'gray'
        : a >= 2
          ? 'prime'
          : 'pup';
}

// Overnight, with the perk: something for the pantry, seeded by the night.
export function scoutFinds(s: GameState): string | null {
  if (!hasPerk(s, 'find')) return null;
  const r = Rng.fromStream(s.seed, 'events').derive(`scout-find-${s.day}`);
  if (r.next() >= DOG.find) return null;
  const ids = Object.keys(INGREDIENTS);
  return ids[r.int(0, ids.length - 1)]!;
}

// A new stray's name: Scout first, then the next on the list.
export const DOG_NAMES = ['Scout', 'Moss', 'Juniper', 'Biscuit'];
export const nextDogName = (s: GameState): string => DOG_NAMES[s.dogs.length % DOG_NAMES.length]!;

// No new stray for a while after the last one's gone.
export const strayDue = (s: GameState): boolean => {
  const last = s.dogs[s.dogs.length - 1];
  return !last || s.day >= last.day + DOG.gone;
};
