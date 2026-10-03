// Lives that change (Phase 17.3): the cast on the age clock (AGE.days to a year). Ray's last
// season and his retirement, Tam slowing and stopping, Frank's rig, and partners off the rock
// for a stretch, hurt or away. Like presence, nothing here is stored: it's the seed, the day
// and the day you met. What is stored is which of their life's moments you've heard about
// (PersonLog.life) and whether you've spoken (PersonLog.talked).

import { AGE, LIFE } from './dials';
import { Rng } from './rng';
import type { GameState, PersonLog } from './types';

const YEAR = AGE.days;
// The first day of a year of the game, counting from 0.
const yearStart = (y: number) => y * YEAR + 1;
const yearOf = (day: number) => Math.floor((day - 1) / YEAR);

// Ray: his last season, then the day he stops coming out.
export const RAY_LAST = yearStart(LIFE.ray.last);
export const RAY_GONE = yearStart(LIFE.ray.retire);

// Tam, counted from the day you met: slower, then done.
export const tamSlows = (p?: PersonLog): number | null =>
  p?.since !== undefined ? p.since + LIFE.tam.slow * YEAR : null;
export const tamStops = (p?: PersonLog): number | null =>
  p?.since !== undefined ? p.since + LIFE.tam.stop * YEAR : null;

// Frank's rig, from the day you met.
export const frankParks = (p?: PersonLog): number | null =>
  p?.since !== undefined ? p.since + LIFE.frank.rig * YEAR : null;

export type StintKind = 'hurt' | 'away';
export interface Stint {
  from: number;
  // The first day they're back.
  to: number;
  kind: StintKind;
}

// A year's stint for a partner, if the seed gives them one.
function stintIn(seed: string, who: string, y: number): Stint | null {
  const S = LIFE.stint;
  if (y < 1 || !S.who.includes(who)) return null;
  const r = Rng.fromStream(seed, 'events').derive(`stint-${who}-${y}`);
  if (!r.chance(S.chance)) return null;
  const from = yearStart(y) + r.int(0, YEAR - 1);
  return { from, to: from + r.int(S.min, S.max), kind: r.chance(0.5) ? 'hurt' : 'away' };
}

// The stint they're on today, if any: this year's, or last year's running over.
export function stintOn(seed: string, who: string, day: number): Stint | null {
  const y = yearOf(day);
  for (const st of [stintIn(seed, who, y), stintIn(seed, who, y - 1)])
    if (st && day >= st.from && day < st.to) return st;
  return null;
}

// Whether a moment of someone's life is due for you to hear: "who/n", the nth not heard yet
// and its day come.
export function lifeDue(s: GameState, ref: string): boolean {
  const [who, n] = ref.split('/');
  const p = s.people[who ?? ''];
  if (!p || (p.life ?? 0) !== Number(n) - 1) return false;
  if (who === 'ray') return s.day >= RAY_LAST && s.day < RAY_GONE;
  if (who === 'tam') return s.day >= (tamSlows(p) ?? Infinity);
  if (who === 'frank') return s.day >= (frankParks(p) ?? Infinity);
  return false;
}
