// Free Solo: which lines go without a rope. Every outdoor sport line and wall pitch, for a
// climber who chose it at the start; trad keeps its rack, boulders their pads.

import type { RouteDef } from './content/routes';
import { INDOOR } from './content/gym';
import type { GameState } from './types';

export const soloed = (s: GameState, r: RouteDef): boolean =>
  s.mode === 'solo' && r.disc === 'sport' && !INDOOR[r.place];
