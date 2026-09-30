// The van (Phase 22.2a): its three parts, what driving and nights do to them, the odds of a
// breakdown on a drive, and what the garage charges. The numbers are VAN's (dials.ts).

import { UPGRADE, VAN, type VanPart } from './dials';
import { PARTNERS, tierOf } from './presence';
import { Rng } from './rng';
import type { GameState } from './types';

export const PARTS: VanPart[] = ['tires', 'engine', 'battery'];
// The parts that break on the road; a battery goes flat overnight instead.
export type RoadPart = 'tires' | 'engine';
export const ROAD_PARTS: RoadPart[] = ['tires', 'engine'];

export const PART_NAME: Record<VanPart, string> = { tires: 'Tires', engine: 'Engine', battery: 'Battery' };

// How worn a part is, 0 (new) to 1 (gone).
const wornOf = (c: number): number => Math.max(0, Math.min(1, (100 - c) / 100));

// The chance a drive of `min` minutes breaks down, from the worst of the road parts.
export function breakdownOdds(s: GameState, min: number): number {
  if (min < VAN.from) return 0;
  const w = Math.max(...ROAD_PARTS.map((p) => wornOf(s.van[p])));
  return Math.min(0.5, (min / 60) * (VAN.base + VAN.worn * w * w));
}

// Whether a drive breaks down, and which part goes: seeded by the day and the minute you
// set out, from where to where, so a reload can't reroll it. The part is picked by wear: the worse, the likelier.
export function breakdownRoll(s: GameState, min: number, to: string): RoadPart | null {
  const r = Rng.fromStream(s.seed, 'events').derive(`breakdown-${s.day}-${s.min}-${s.at}-${to}`);
  if (r.next() >= breakdownOdds(s, min)) return null;
  const w = ROAD_PARTS.map((p) => wornOf(s.van[p]) + 0.05);
  let x = r.next() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ROAD_PARTS.length; i++) if ((x -= w[i]!) < 0) return ROAD_PARTS[i]!;
  return ROAD_PARTS[0]!;
}

// Whether a bodge holds.
export const bodgeOdds = (s: GameState): number =>
  (s.gear.toolkit ?? 0) > 0 ? UPGRADE.toolkit.bodge : VAN.bodge.odds;
export const bodgeHolds = (s: GameState): boolean =>
  Rng.fromStream(s.seed, 'events').derive(`bodge-${s.day}-${s.min}`).next() < bodgeOdds(s);

// What a drive's gas comes to, with the tune-up (Phase 22.2c).
export const gasFor = (s: GameState, cash: number): number =>
  (s.gear.tuneup ?? 0) > 0 ? Math.round(cash * UPGRADE.tuneup.gas) : cash;

// What the garage charges to put a part back to new.
export function repairCost(s: GameState, part: VanPart): number {
  return Math.max(VAN.least, Math.ceil(VAN.price[part] * wornOf(s.van[part])));
}

// The worst road part, if it's too far gone for a drive out of town.
export function unsafePart(s: GameState): RoadPart | null {
  return ROAD_PARTS.find((p) => s.van[p] < VAN.unsafe) ?? null;
}

// How a part reads, in words.
export function partWord(c: number): string {
  if (c <= 0) return 'dead';
  if (c < VAN.unsafe) return 'shot';
  if (c < 40) return 'worn';
  if (c < 75) return 'fair';
  return 'good';
}

// Who you'd call from the side of the road: a partner you're close enough to, who isn't
// away. The first one found.
export function friendFor(s: GameState): string | null {
  for (const who of PARTNERS) {
    const p = s.people[who];
    if (!p || tierOf(p.bond) < VAN.friend.tier) continue;
    if (p.away !== undefined && s.day < p.away) continue;
    return who;
  }
  return null;
}
