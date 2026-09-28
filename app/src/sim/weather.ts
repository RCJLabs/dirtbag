// Each day's weather and what it does to the rock, from the seed. v0.956's seasons (14 days
// each) and weights (docs/audit/climbing.md §2.13). Nothing is stored: a day's sky is a
// pure function of the seed and the day, so the forecast is simply tomorrow's roll.

import { Rng } from './rng';

export type Sky = 'prime' | 'fair' | 'hot' | 'rain';
export type Season = 'fall' | 'winter' | 'spring' | 'summer';

export const SEASON_DAYS = 14;
// The first season is fall: send season, so a new player's first weeks are climbable.
const ORDER: Season[] = ['fall', 'winter', 'spring', 'summer'];

// Prime, fair, hot, rain.
const WEIGHTS: Record<Season, [number, number, number, number]> = {
  spring: [0.35, 0.45, 0.05, 0.15],
  summer: [0.1, 0.35, 0.45, 0.1],
  fall: [0.45, 0.4, 0.05, 0.1],
  winter: [0.2, 0.3, 0, 0.5],
};
const SKIES: Sky[] = ['prime', 'fair', 'hot', 'rain'];

export const seasonOf = (day: number): Season => ORDER[Math.floor((day - 1) / SEASON_DAYS) % 4]!;

export function skyOn(seed: string, day: number): Sky {
  // The first morning is always good: day one is for learning to climb, not for waiting.
  if (day <= 1) return 'prime';
  const r = Rng.fromStream(seed, 'worldgen').derive(`sky-${day}`).next();
  const w = WEIGHTS[seasonOf(day)];
  let acc = 0;
  for (let i = 0; i < 4; i++) {
    acc += w[i]!;
    if (r < acc) return SKIES[i]!;
  }
  return 'fair';
}

export const forecast = (seed: string, day: number, n = 3): Sky[] =>
  Array.from({ length: n }, (_, i) => skyOn(seed, day + i));

export interface Conditions {
  sky: Sky;
  // The crag is climbable at all.
  open: boolean;
  // When the sun comes onto Roadside's wall and the rock goes greasy.
  greaseFrom: number;
  // Every outdoor window is scaled by this.
  windows: number;
  // Wet from yesterday's rain.
  seeping: boolean;
}

// What the day means at the crag. Prime is cold and dry: the best friction and the sun
// comes round later. Hot days grease the wall from noon. Rain closes it, and it seeps the
// day after.
export function conditions(seed: string, day: number): Conditions {
  const sky = skyOn(seed, day);
  const seeping = sky !== 'rain' && day > 1 && skyOn(seed, day - 1) === 'rain';
  const base = sky === 'prime' ? 1.1 : sky === 'hot' ? 0.9 : 1;
  return {
    sky,
    open: sky !== 'rain',
    greaseFrom: sky === 'prime' ? 15 * 60 : sky === 'hot' ? 12 * 60 : 14 * 60,
    windows: base * (seeping ? 0.92 : 1),
    seeping,
  };
}

export const SKY_NAME: Record<Sky, string> = { prime: 'Prime', fair: 'Fair', hot: 'Hot', rain: 'Rain' };
