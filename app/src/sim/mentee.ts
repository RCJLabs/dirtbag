// Phase 25.3: the kid you coach. Taken on at Send City from V7; a session a day there builds
// them, slower as they grow and never past you; left alone they drift off, warned first. At
// your retirement their grade passes to the next climber as a head start.

import { average, gradeOf, needFor } from './climber';
import { EXPEDITIONS } from './content/expeditions';
import { MENTEES } from './content/mentee';
import { MENTEE } from './dials';
import { INDOOR } from './content/gym';
import type { GameState, Skills } from './types';

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
  if (s.team?.names[0] === s.mentee.name) return `${s.mentee.name}’s away on ${EXPEDITIONS[s.team.id]!.name}`;
  if (s.at !== 'gym') return 'You coach them at Send City';
  if (!s.today.includes(INDOOR.gym!.pass)) return 'Buy a day pass at the desk first';
  if (s.today.includes('mentored')) return 'One session a day';
  if (s.energy < MENTEE.energy) return 'Too tired to spot anyone';
  return null;
}

// A session's gain: slower as they grow, and never past your own grade.
export const menteeAfter = (level: number, yours: number): number =>
  Math.min(Math.max(level, yours), level + MENTEE.gain / (1 + level / MENTEE.slow));

// Phase 26: an heir's head start, from the grade of the kid their forebear coached. They start
// at `heir` of it, rounded (a V5 makes a V2, a V8 a V3, a V10 a V4), their own shape kept, and
// never below where they'd have started anyway. Whole skill, a hair past the grade's need.
export function heirStart(skills: Skills, grade: number): Skills {
  const need = needFor(Math.round(MENTEE.heir * grade));
  const add = Math.max(0, Math.floor(need - average(skills)) + 1);
  return Object.fromEntries(Object.entries(skills).map(([k, v]) => [k, v + add])) as unknown as Skills;
}
