// Phase 31.3: a name the old guard knows. How they had the forebear, for their word on the kid.

import type { KinBand } from './content/kin';
import { FACTION } from './dials';
import type { GameState } from './types';

// Well, neither way, or not (FACTION's bands). An heir from before Phase 31 kept no standing:
// neither way.
export function kinBand(s: GameState): KinBand {
  const old = s.family?.career?.old;
  if (old === undefined) return 'mid';
  return old >= FACTION.bands[2]! ? 'high' : old < FACTION.bands[1]! ? 'low' : 'mid';
}

// Whether one of the old guard has their word on whose kid you are due: "who/band".
export function kinBeatDue(s: GameState, key: string): boolean {
  const [who, band] = key.split('/');
  return !!s.family && !s.seen.includes(`kin-${who}`) && kinBand(s) === band;
}
