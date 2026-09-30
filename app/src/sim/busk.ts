// Busking outside the café (Phase 22.5b): how good a guitar player the sets have made you,
// who stops to listen, and what lands in the case. The numbers are BUSK (dials.ts).

import { isWeekend } from './cond';
import { BUSK } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';
import { skyOn } from './weather';

// How far along you are, 0 to 1, from the sets you've played.
export const guitarSkill = (sets: number): number => 1 - Math.exp(-sets / BUSK.learn);

// What a set adds to your playing: some for turning up, the rest for playing it clean.
export const practiceOf = (acc: number): number =>
  BUSK.practice.floor + (1 - BUSK.practice.floor) * Math.max(0, Math.min(1, acc));

// Your rate an hour on an ordinary crowd, played clean.
export const buskRate = (sets: number): number =>
  BUSK.rate.start + (BUSK.rate.top - BUSK.rate.start) * guitarSkill(sets);

// The crowd outside the café now: the hour, the weekend, the sky, the day's luck.
export function buskCrowd(s: GameState): number {
  let hour = 0;
  for (const h of BUSK.hours) if (s.min >= h.from) hour = h.f;
  const luck = 1 + BUSK.luck * (2 * Rng.fromStream(s.seed, 'events').derive(`busk-${s.day}`).next() - 1);
  return hour * (isWeekend(s.day) ? BUSK.weekend : 1) * BUSK.sky[skyOn(s.seed, s.day)] * luck;
}

// People who stop: more as you get better, and as the street fills.
export const buskHeads = (s: GameState): number =>
  Math.round((BUSK.heads[0] + (BUSK.heads[1] - BUSK.heads[0]) * guitarSkill(s.guitar)) * buskCrowd(s));

export const buskTips = (s: GameState, acc: number): number =>
  Math.round(buskRate(s.guitar) * buskCrowd(s) * (BUSK.sloppy + (1 - BUSK.sloppy) * acc));

export type GuitarRank = 'beginner' | 'busker' | 'regular' | 'legend';
const RANKS: GuitarRank[] = ['beginner', 'busker', 'regular', 'legend'];
export const guitarRank = (sets: number): GuitarRank =>
  RANKS[BUSK.ranks.filter((r) => guitarSkill(sets) >= r).length]!;

export const RANK_NAME: Record<GuitarRank, string> = {
  beginner: 'Beginner',
  busker: 'Busker',
  regular: 'A regular',
  legend: 'Local legend',
};

// Said the set you reach a rank.
export const RANK_LINE: Record<Exclude<GuitarRank, 'beginner'>, string> = {
  busker: 'People have started stopping to listen, not just to see what the noise is.',
  regular: 'Wren says customers ask when you’re playing next.',
  legend: 'Somebody’s filming. Somebody else knows every word. You’re a fixture now.',
};

export function buskBlocked(s: GameState): string | null {
  if (s.at !== 'cafe') return 'You busk outside the Coffee Shop';
  if (s.today.includes('busked')) return 'You’ve played your set today';
  if (s.min < BUSK.from) return 'Nobody’s about yet';
  if (s.min >= BUSK.until) return 'The street’s gone quiet for the night';
  if (skyOn(s.seed, s.day) === 'rain') return 'Nobody stops in the rain';
  if (s.energy < BUSK.energy) return 'Too tired to play';
  return null;
}
