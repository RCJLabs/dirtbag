// Your training block: the phase you're in, a taper, and prehab (Phase 21.3). Queries only;
// sessions are in sessions.ts, and every change goes through act().
//
// v0.956 let you switch phase at bedtime, hold peak forever, taper back to back and train
// fried. Here a phase holds for days, peak ends in a deload, and a taper waits its turn.

import { TRAIN } from './dials';
import type { GameState, PhaseId, Training } from './types';

export const PHASES: PhaseId[] = ['base', 'build', 'peak', 'deload'];

export const PHASE_NAME: Record<PhaseId, string> = {
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  deload: 'Deload',
};

export const freshTraining = (day: number): Training => ({
  phase: 'base',
  since: day,
  taper: null,
  prehab: 0,
});

// Days until you can change phase; 0 when you can. Base is no commitment, so it holds you
// to nothing: the lock is for a phase you chose.
export const phaseLock = (s: GameState): number =>
  s.training.phase === 'base' ? 0 : Math.max(0, s.training.since + TRAIN.lock - s.day);

// The day of the taper you're on (1 to its length), or 0.
export function taperDay(s: GameState): number {
  const t = s.training.taper;
  if (t === null) return 0;
  const d = s.day - t + 1;
  return d >= 1 && d <= TRAIN.taper.days ? d : 0;
}

// Days until you can taper again; 0 when you can.
export function taperWait(s: GameState): number {
  const t = s.training.taper;
  return t === null ? 0 : Math.max(0, t + TRAIN.taper.days + TRAIN.taper.cooldown - s.day);
}

export const prehabbed = (s: GameState): boolean => s.day <= s.training.prehab;

// What the block does to every crux window today: peak, and a taper.
export function trainWindows(s: GameState): number {
  const d = taperDay(s);
  const taper = d === 0 ? 1 : d === TRAIN.taper.days ? TRAIN.taper.last : TRAIN.taper.windows;
  return TRAIN.phases[s.training.phase].windows * taper;
}

// What it does to the chance of getting hurt: the phase, and prehab.
export const riskFactor = (s: GameState): number =>
  TRAIN.phases[s.training.phase].risk * (prehabbed(s) ? TRAIN.prehab.risk : 1);
