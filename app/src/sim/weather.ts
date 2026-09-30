// Each day's weather and what it does to the rock, from the seed. v0.956's seasons (14 days
// each) and weights (docs/audit/climbing.md §2.13). Nothing is stored: a day's sky is a
// pure function of the seed and the day, so the forecast is simply tomorrow's roll.

import { PLACES } from './content/places';
import { CLIMB } from './dials';
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

// The sky over a place: the valley's anywhere in it; its own for a place out of it, from
// the season's odds shifted by its climate, as v0.956 rolled its crags. The desert gets 12
// points more heat, 10 less rain and 2 less prime; shade 8 more rain and 6 less heat. (v0.956
// rolled the Gorge apart too; the rebuild keeps it on the valley's sky, which R2's season
// was tuned on.)
export function skyAt(seed: string, day: number, place: string): Sky {
  const p = PLACES[place];
  if (!p?.ownSky) return skyOn(seed, day);
  if (day <= 1) return 'prime';
  const w = [...WEIGHTS[seasonOf(day)]];
  if (p.desert) {
    w[2]! += 0.12;
    w[3] = Math.max(0, w[3]! - 0.1);
    w[0] = Math.max(0, w[0]! - 0.02);
  }
  if (p.shaded) {
    w[3]! += 0.08;
    w[2] = Math.max(0, w[2]! - 0.06);
  }
  const r =
    Rng.fromStream(seed, 'worldgen').derive(`sky-${place}-${day}`).next() * w.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < 4; i++) {
    acc += w[i]!;
    if (r < acc) return SKIES[i]!;
  }
  return 'fair';
}

export interface Conditions {
  sky: Sky;
  // The crag is climbable at all.
  open: boolean;
  // When the sun first reaches Roadside's wall. It crosses the wall from there, greasing
  // each line in turn (sunOn), and has all of it CLIMB.sunSweep minutes later.
  greaseFrom: number;
  // Every outdoor window is scaled by this.
  windows: number;
  // Wet from yesterday's rain.
  seeping: boolean;
}

// When the sun is halfway across the wall: 3 PM on a prime day, 2 on a fair one, noon on
// a hot one. It reaches the wall half a sweep before that.
const SUN_HALFWAY: Record<Sky, number> = { prime: 15 * 60, fair: 14 * 60, hot: 12 * 60, rain: 14 * 60 };

// What the day means at the crag. Prime is cold and dry: the best friction and the sun
// comes round later. Hot days grease the wall by noon. Rain closes it, and it seeps the
// day after.
export const conditions = (seed: string, day: number): Conditions =>
  fromSky(skyOn(seed, day), day > 1 ? skyOn(seed, day - 1) : null);

function fromSky(sky: Sky, before: Sky | null): Conditions {
  const seeping = sky !== 'rain' && before === 'rain';
  const base = sky === 'prime' ? 1.1 : sky === 'hot' ? 0.9 : 1;
  return {
    sky,
    open: sky !== 'rain',
    greaseFrom: SUN_HALFWAY[sky] - CLIMB.sunSweep / 2,
    windows: base * (seeping ? 0.92 : 1),
    seeping,
  };
}

// What the day means at a particular crag: its sky (the valley's, or its own out of it),
// plus its own shade and closures. Shaded rock doesn't grease and doesn't mind the heat.
export function conditionsAt(
  seed: string,
  day: number,
  place: string,
): Conditions & { closed: string | null } {
  const p = PLACES[place];
  const c = p?.ownSky
    ? fromSky(skyAt(seed, day, place), day > 1 ? skyAt(seed, day - 1, place) : null)
    : conditions(seed, day);
  const shut = p?.closed?.season;
  const closed =
    p?.closed && (Array.isArray(shut) ? shut.includes(seasonOf(day)) : seasonOf(day) === shut)
      ? p.closed.why
      : null;
  if (p?.desert) return { ...c, closed, windows: c.windows * CLIMB.desertFactor };
  if (!p?.shaded) return { ...c, closed };
  return {
    ...c,
    closed,
    greaseFrom: 24 * 60,
    windows: (c.sky === 'hot' ? 1 : c.sky === 'prime' ? 1.1 : 1) * (c.seeping ? 0.92 : 1),
  };
}

// When the sun reaches a line at a crag: the crag's first sun, plus its share of the sweep
// by where it stands in the sun's path. Shaded rock never gets it, and a crag without a
// path takes the sun all at once.
export function sunOn(seed: string, day: number, place: string, route: string): number {
  const c = conditionsAt(seed, day, place);
  const path = PLACES[place]?.sun;
  const i = path?.indexOf(route) ?? -1;
  if (!path || i < 0 || path.length < 2 || PLACES[place]?.shaded) return c.greaseFrom;
  return Math.round(c.greaseFrom + (CLIMB.sunSweep * i) / (path.length - 1));
}

export const SKY_NAME: Record<Sky, string> = { prime: 'Prime', fair: 'Fair', hot: 'Hot', rain: 'Rain' };
