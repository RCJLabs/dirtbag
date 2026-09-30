// The lake (Phase 22.3b): what a morning with a line in the water brings in, seeded by the day
// and the hour you cast, so a reload can't reroll it.

import { LAKE } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';
import { seasonOf } from './weather';

// The chance of each fish, casting now.
export function biteOdds(s: GameState): number {
  const golden = s.min < LAKE.dawn || s.min >= LAKE.dusk ? LAKE.golden : 1;
  return Math.min(0.9, LAKE.bite[seasonOf(s.day)] * golden);
}

export function fishCatch(s: GameState): number {
  const r = Rng.fromStream(s.seed, 'events').derive(`fish-${s.day}-${s.min}`);
  const p = biteOdds(s);
  let n = 0;
  for (let i = 0; i < LAKE.most; i++) if (r.next() < p) n++;
  return n;
}
