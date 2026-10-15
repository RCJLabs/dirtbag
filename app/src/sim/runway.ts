// Phase 30.3 (Evan's call, 15 Oct 2026: all three, from 35): a late career's runway. A clinic at
// the Cave, setting a comp's problems, and a sponsor's ambassador terms (media.ts asks for a
// clinic where it asked for a send). Paid like work, never more than a job's.

import { ageOf } from './ageing';
import { compHere } from './comps';
import { isWeekend } from './cond';
import { routeById } from './content/gym';
import { RUNWAY } from './dials';
import { rankAt } from './jobs';
import type { GameState } from './types';

// Your hardest send, any kind, or 0.
const hardest = (s: GameState): number =>
  Object.entries(s.routes).reduce(
    (g, [id, l]) => (l.sent ? Math.max(g, routeById(s.seed, id)?.grade ?? 0) : g),
    0,
  );

// The climbers who'd come to a clinic of yours: a few, and more for what you've climbed.
export const clinicHeads = (s: GameState): number =>
  Math.min(RUNWAY.clinic.most, RUNWAY.clinic.base + Math.floor(hardest(s) / RUNWAY.clinic.per));

export const clinicPay = (s: GameState): number => clinicHeads(s) * RUNWAY.clinic.fee;

// Why you can't run a clinic now, or null.
export function clinicBlocked(s: GameState): string | null {
  if (ageOf(s) < RUNWAY.from) return `Clinics are for climbers of ${RUNWAY.from} and up`;
  if (rankAt(s, 'coach') < RUNWAY.clinic.coach && !s.media.sponsor)
    return 'The Cave wants a coach, or a sponsor’s name';
  if (s.at !== 'cave') return 'Clinics are at the Cave';
  if (!isWeekend(s.day)) return 'Clinics are weekend mornings';
  if (s.min > RUNWAY.clinic.by) return 'The morning’s gone';
  if (s.today.includes('clinic')) return 'You’ve run one today';
  if (s.energy < RUNWAY.clinic.energy) return 'Too tired to teach';
  return null;
}

// Tomorrow's comp here, as a tier, or null.
export const compTomorrow = (s: GameState): number | null => compHere(s, s.day + 1, s.at);

// Why you can't set tomorrow's comp, or null.
export function setCompBlocked(s: GameState): string | null {
  if (ageOf(s) < RUNWAY.from) return `Comp setting is for setters of ${RUNWAY.from} and up`;
  if (rankAt(s, 'set') < RUNWAY.setComp.rank) return 'They want a senior setter';
  if (compTomorrow(s) === null) return 'No comp here tomorrow';
  if (s.today.includes('setcomp')) return 'You’ve set it';
  if (s.energy < RUNWAY.setComp.energy) return 'Too tired for the ladder';
  return null;
}
