// Phase 25.3: the kid you coach. Taken on at Send City from V7; a session a day there builds
// them, slower as they grow and never past you; left alone they drift off, warned first. At
// your retirement their grade passes to the next climber as a head start.

import { gradeOf } from './climber';
import { MENTEES } from './content/mentee';
import { MENTEE } from './dials';
import { INDOOR } from './content/gym';
import type { GameState } from './types';

// Who'd ask: the next name not already somebody's, by the seed.
export const menteeName = (s: GameState): string => MENTEES[(s.seed.length + s.day) % MENTEES.length]!;

// Why you can't take one on now, or null.
export function menteeTakeBlocked(s: GameState): string | null {
  if (s.mentee) return `${s.mentee.name}’s yours already`;
  if (gradeOf(s.climber.skills) < MENTEE.from) return `The kids ask climbers on V${MENTEE.from} and up`;
  if (s.at !== 'gym') return 'They’re at Send City';
  return null;
}

// Why you can't coach them now, or null.
export function menteeCoachBlocked(s: GameState): string | null {
  if (!s.mentee) return 'Nobody to coach';
  if (s.at !== 'gym') return 'You coach them at Send City';
  if (!s.today.includes(INDOOR.gym!.pass)) return 'Buy a day pass at the desk first';
  if (s.today.includes('mentored')) return 'One session a day';
  if (s.energy < MENTEE.energy) return 'Too tired to spot anyone';
  return null;
}

// A session's gain: slower as they grow, and never past your own grade.
export const menteeAfter = (level: number, yours: number): number =>
  Math.min(Math.max(level, yours), level + MENTEE.gain / (1 + level / MENTEE.slow));
