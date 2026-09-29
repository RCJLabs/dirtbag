// How hard the people you know climb, day by day, from the seed alone. Nothing is stored:
// like the weather, a partner's season is already decided, and it doesn't bend to yours.
//
// Sage climbs steadily. Dex has a curve of his own (Phase 6's fix for v0.956's rival, who
// stayed one grade ahead of you whatever you did): steady gains to a peak drawn from the
// seed, a stretch off hurt when he gains nothing, and streaks, good and bad weeks, on top.

import { CURVES, RIVAL } from './dials';
import { Rng } from './rng';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface DexSeason {
  peak: number;
  // He's hurt from hurtFrom up to (not including) hurtTo.
  hurtFrom: number;
  hurtTo: number;
}

export function dexSeason(seed: string): DexSeason {
  const r = Rng.fromStream(seed, 'events').derive('dex');
  const peak = r.float(RIVAL.peak[0]!, RIVAL.peak[1]!);
  const hurtFrom = r.int(RIVAL.hurtFrom[0]!, RIVAL.hurtFrom[1]!);
  return { peak, hurtFrom, hurtTo: hurtFrom + r.int(RIVAL.hurtDays[0]!, RIVAL.hurtDays[1]!) };
}

export const dexHurt = (seed: string, day: number): boolean => {
  const d = dexSeason(seed);
  return day >= d.hurtFrom && day < d.hurtTo;
};

// A week's form, -1 to 1, eased from one week to the next so streaks build and fade.
function form(seed: string, day: number): number {
  const w = Math.floor(day / 7);
  const at = (k: number) => Rng.fromStream(seed, 'events').derive(`dex-form-${k}`).float(-1, 1);
  const t = (day % 7) / 7;
  return lerp(at(w), at(w + 1), t * t * (3 - 2 * t));
}

export function dexLevel(seed: string, day: number): number {
  const d = dexSeason(seed);
  // Days he's trained: every day but the ones he spent hurt.
  const trained = day - Math.max(0, Math.min(day, d.hurtTo) - d.hurtFrom);
  const c = CURVES.dex;
  return Math.min(d.peak, c.start + c.perDay * trained) + RIVAL.streak * form(seed, day);
}

export function sageLevel(day: number): number {
  const c = CURVES.sage;
  return Math.min(c.peak, c.start + c.perDay * day);
}

// Someone's grade on a day, or null for people who don't climb against you.
export function gradeOfPerson(seed: string, who: string, day: number): number | null {
  if (who === 'dex') return Math.max(0, Math.floor(dexLevel(seed, day)));
  if (who === 'sage') return Math.floor(sageLevel(day));
  return null;
}
