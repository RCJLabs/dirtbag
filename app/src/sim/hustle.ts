// The hustle (Phase 22.5a): what a couple of hours of cans, a run at the bins or a forage
// brings in, seeded by the day, so a reload can't reroll it. The numbers are HUSTLE (dials.ts).

import { HUSTLE } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';
import { seasonOf } from './weather';

export type Hustle = 'cans' | 'bins' | 'forage';

// Dollars for the cans, food for the bins and the forage; 0 when the bins come up empty.
export function hustleTake(s: GameState, h: Hustle): number {
  const r = Rng.fromStream(s.seed, 'events').derive(`hustle-${h}-${s.day}`);
  if (h === 'cans') return r.int(HUSTLE.cans.cash[0], HUSTLE.cans.cash[1]);
  if (h === 'bins') return r.next() < HUSTLE.bins.odds ? r.int(HUSTLE.bins.fed[0], HUSTLE.bins.fed[1]) : 0;
  const n = r.int(HUSTLE.forage.fed[0], HUSTLE.forage.fed[1]);
  return seasonOf(s.day) === 'winter' ? Math.round(n * HUSTLE.forage.winter) : n;
}

// Hungry and broke, and never told where the net is.
export const needsTeaching = (s: GameState): boolean =>
  s.fed < HUSTLE.teach.fed && s.cash < HUSTLE.teach.cash && !s.seen.includes('hustle');

export const HUSTLE_TEACH =
  'Hungry and broke. There are ways round both: cans round the Lot are worth a few dollars, the bins behind the market get last night’s bread once it shuts, and there’s food by the lake if you know where to look.';
