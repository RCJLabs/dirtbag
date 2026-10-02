// The speed wall: what a run's time is for you, what it teaches, and why you can't run now.

import { gradeOf, hi } from './climber';
import { daysOff, goLoad } from './body';
import { INDOOR, INDOOR_CLOSE } from './content/gym';
import { SPEED, TRAIN } from './dials';
import type { GameState, Skills } from './types';
import { gainMult } from './identity';

const round2 = (v: number) => Math.round(v * 100) / 100;

export const SPEED_WALL = 'gym';

// Seconds on the screen to seconds on the clock: your power and technique, as a grade.
export function speedFactor(k: Skills): number {
  const m = 0.6 * k.power + 0.4 * k.technique;
  const g = gradeOf({ power: m, fingers: m, endurance: m, technique: m, head: m });
  return Math.max(SPEED.factor.floor, SPEED.factor.v0 - SPEED.factor.perGrade * g);
}

export const speedTime = (k: Skills, real: number): number =>
  round2(Math.max(real, SPEED.minReal) * speedFactor(k));

// Runs today: the count resets when the day does.
export const runsToday = (s: GameState): number => (s.speed.day === s.day ? s.speed.runs : 0);

// What a run teaches: a session's scale, for the first few a day.
export function speedGains(s: GameState): Partial<Skills> {
  if (runsToday(s) >= SPEED.fresh) return {};
  const k = s.climber.skills;
  const total = TRAIN.base + TRAIN.perGrade * gradeOf(k);
  return {
    power: round2(total * SPEED.trains.power * hi(k.power) * gainMult(s, 'power', 'train')),
    technique: round2(total * SPEED.trains.technique * hi(k.technique) * gainMult(s, 'technique', 'train')),
  };
}

export const speedLoad = (s: GameState): number =>
  round2(goLoad(SPEED.energy, gradeOf(s.climber.skills), 1) * SPEED.intensity);

export function speedBlocked(s: GameState): string | null {
  const gym = INDOOR[SPEED_WALL]!;
  if (s.at !== SPEED_WALL) return `The speed wall is at ${gym.name}`;
  if (s.min >= INDOOR_CLOSE) return `${gym.name} is closed`;
  if (!s.today.includes(gym.pass)) return 'Buy a day pass at the desk first';
  if (daysOff(s) > 0) return `Not on your ${s.injury!.kind}`;
  if (s.energy < SPEED.energy) return 'Too tired to race anything';
  if (s.skin < SPEED.skin) return 'Your skin is done for today';
  return null;
}
