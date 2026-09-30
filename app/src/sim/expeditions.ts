// Expeditions: the odds of a pitch, whether a day is a storm, and the chance of the summit,
// worked out exactly before you pay, so the decision is made with the odds in view (the
// audit found v0.956's "V7" El Cap went about one time in twenty).

import { margin } from './climber';
import type { ExpeditionDef } from './content/expeditions';
import type { WallDef } from './content/routes';
import { EXPED, WALL } from './dials';
import { Rng } from './rng';
import type { GameState, Skills } from './types';

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

// A pitch's odds for you: your endurance against the objective, digging deep or not.
export function pitchOdds(k: Skills, e: ExpeditionDef, dig: boolean): number {
  const p = EXPED.base + EXPED.perGrade * margin(k, 'endurance', e.grade) + (dig ? EXPED.digBonus : 0);
  return clamp(p, EXPED.floor, EXPED.ceiling);
}

// Whether a day out there is a storm: seeded by the expedition and the day, so it's the same
// storm however you get to it.
export const stormOn = (seed: string, id: string, e: ExpeditionDef, day: number): boolean =>
  Rng.fromStream(seed, 'events').derive(`storm-${id}-${day}`).next() < e.stormOdds;

// A pitch's roll: seeded by the expedition, the day and the pitch.
export const pitchRoll = (seed: string, id: string, day: number, pitch: number): number =>
  Rng.fromStream(seed, 'events').derive(`pitch-${id}-${day}-${pitch}`).next();

// The chance of the summit from where you stand, if you lead whenever the weather and your
// energy let you (digging deep, or not), and rest otherwise: exact, over every storm and
// every fall, by working back from the last day.
export function summitOdds(
  k: Skills,
  e: ExpeditionDef,
  dig: boolean,
  from: { day: number; pitch: number; energy: number } = { day: 1, pitch: 0, energy: EXPED.energy },
): number {
  const p = pitchOdds(k, e, dig);
  const cost = dig ? EXPED.dig : EXPED.lead;
  const memo = new Map<string, number>();
  const go = (day: number, pitch: number, energy: number): number => {
    if (pitch >= e.pitches) return 1;
    if (day > e.days) return 0;
    const key = `${day}/${pitch}/${energy}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    // Every night gives a little back; a day in camp, more.
    const night = (n: number) => Math.min(EXPED.energy, n + EXPED.night);
    const rest = go(day + 1, pitch, night(energy + EXPED.rest));
    const fair =
      energy >= cost
        ? p * go(day + 1, pitch + 1, night(energy - cost)) +
          (1 - p) * go(day + 1, pitch, night(energy - cost))
        : rest;
    const v = e.stormOdds * rest + (1 - e.stormOdds) * fair;
    memo.set(key, v);
    return v;
  };
  return go(from.day, from.pitch, from.energy);
}

// What a wall's first summit pays: a magazine buys the photos.
export const wallPay = (w: WallDef): number =>
  WALL.pay.base + WALL.pay.perGrade * w.grade + WALL.pay.perPitch * w.pitches.length;

export const onExpedition = (s: GameState): boolean => s.expedition !== null;
