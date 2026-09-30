// Your body's longer memory: training load, and the injuries that come from spiking it.
// v0.956's acute:chronic model with Phase 6's fixes: chronic load starts seeded so the first
// week can't spike it, and every roll comes from the seeded session stream, so a replay
// replays its injuries.

import { gradeOf, type Style } from './climber';
import { AREA, INJURY_NAME } from './content/injuries';
import type { RouteDef } from './content/routes';
import { BODY, INJURY, LOAD, SCARS } from './dials';
import { scarred } from './scars';
import { Rng } from './rng';
import { riskFactor } from './training';
import type { GameState, Injury, Load } from './types';

const round2 = (v: number) => Math.round(v * 100) / 100;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const freshLoad = (): Load => ({ acute: LOAD.start, chronic: LOAD.start, today: 0 });

// What a go puts through you: its effort (the energy it costs), more on harder lines, and
// more the further up you got.
export const goLoad = (energy: number, grade: number, progress: number): number =>
  round2(energy * (1 + grade / 9) * (0.6 + 0.4 * clamp01(progress)));

// The averages as they'd stand if you slept now. Today's goes count straight away, so "one
// more go" is measured against what you've already done today.
export function projected(l: Load): { acute: number; chronic: number } {
  return {
    acute: l.acute + (l.today - l.acute) * LOAD.acuteRate,
    chronic: l.chronic + (l.today - l.chronic) * LOAD.chronicRate,
  };
}

export function ratio(l: Load): number {
  const p = projected(l);
  return p.chronic > LOAD.minChronic ? p.acute / p.chronic : 1;
}

// How the ratio reads, from your body's side.
export type Zone = 'easy' | 'steady' | 'talking' | 'slow' | 'fried';
export function zone(r: number): Zone {
  if (r > LOAD.fried) return 'fried';
  if (r > LOAD.slow) return 'slow';
  if (r > LOAD.risk) return 'talking';
  return r < 0.8 ? 'easy' : 'steady';
}

// A hard line before you've warmed up: at or above your grade, with no go yet today.
export const cold = (s: GameState, r: RouteDef): boolean =>
  !s.today.includes('warm') && r.grade >= gradeOf(s.climber.skills);

// The chance this go (or session) hurts you. Nothing below the risk line; above it v0.956's
// slope, worse on crimps and cracks, cold, or hungry, scaled by how big the go was, and by
// your training phase and prehab.
export function injuryChance(s: GameState, r: { type: Style }, load: number, wasCold: boolean): number {
  const x = ratio(s.load);
  if (x <= LOAD.risk) return 0;
  const hungry = s.fed < BODY.weakBelow ? 1 + (0.5 * (BODY.weakBelow - s.fed)) / BODY.weakBelow : 1;
  return (
    Math.min(LOAD.riskCap, LOAD.riskSlope * (x - LOAD.risk)) *
    LOAD.typeRisk[r.type] *
    (wasCold ? LOAD.coldRisk : 1) *
    hungry *
    (load / LOAD.perGo) *
    riskFactor(s) *
    // An old injury where this style loads you (Phase 22.4b).
    (scarred(s, r.type) ? SCARS.risk : 1)
  );
}

// Rolls this go's injury, if any. `n` numbers the go within the day, so each go has its
// own roll and the same go always rolls the same. Worse spikes make worse injuries.
export function rollInjury(
  s: GameState,
  r: { type: Style },
  load: number,
  wasCold: boolean,
  n: number,
): Injury | null {
  const p = injuryChance(s, r, load, wasCold);
  if (p <= 0) return null;
  const rng = Rng.fromStream(s.seed, 'session').derive(`injury-${s.day}-${n}`);
  if (rng.next() >= p) return null;
  const sev = Math.max(0, ratio(s.load) - LOAD.risk) * LOAD.typeRisk[r.type] * 2 + rng.next() * 0.4;
  const tier = sev < 0.5 ? 1 : sev < 1.3 ? 2 : 3;
  const [lo, hi] = INJURY.days[tier - 1]!;
  return { kind: INJURY_NAME[AREA[r.type]][tier - 1]!, tier, until: s.day + 1 + rng.int(lo, hi) };
}

// Days still off, counting today.
export const daysOff = (s: GameState): number => (s.injury ? Math.max(0, s.injury.until - s.day) : 0);
