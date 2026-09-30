// Old injuries and fear (Phase 22.4b): what a healed injury leaves, what a flare and a fear do
// to a line's windows, and the risk a mark adds. The numbers are SCARS and FEAR (dials.ts).

import type { Style } from './climber';
import { AREA, markOf, type Mark } from './content/injuries';
import { FEAR, SCARS } from './dials';
import { Rng } from './rng';
import type { GameState, Injury } from './types';

// Whether a healed injury leaves a mark, seeded by the day it healed and what it was.
export function scarRoll(s: GameState, hurt: Injury): Mark | null {
  const mark = markOf(hurt.kind);
  if (!mark || s.scars.includes(mark)) return null;
  const p = SCARS.chance[hurt.tier - 1] ?? 0;
  return Rng.fromStream(s.seed, 'session').derive(`scar-${s.day}-${hurt.kind}`).next() < p ? mark : null;
}

// Whether a line of this style loads a marked area.
export const scarred = (s: GameState, type: Style): boolean => s.scars.includes(AREA[type]);

export const flaring = (s: GameState, type: Style): boolean =>
  !!s.flare && s.day < s.flare.until && s.flare.area === AREA[type];

// A go on a marked line might flare it: seeded by the go.
export const flareRoll = (s: GameState, n: number): boolean =>
  Rng.fromStream(s.seed, 'session').derive(`flare-${s.day}-${n}`).next() < SCARS.flare;

// What your history does to a line's windows today: a flare where it's marked, and fear of
// its style.
export const historyWindows = (s: GameState, type: Style): number =>
  (flaring(s, type) ? SCARS.flareWindows : 1) * (s.fear.includes(type) ? FEAR.windows : 1);
