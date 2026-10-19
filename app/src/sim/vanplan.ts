// Phase 43: your van, laid out. What takes room has a spot on a grid: the bed, the kitchen, the
// shelf and the heater on the floor, the solar panel on the roof. A spot fits inside the van,
// clear of the door, on top of nothing. Where it goes is yours and changes no rule. A piece
// you've taken out stays out till you put it back; one you've just got goes in where it fits.

import { VAN_PLAN } from './dials';
import type { GameState, Spot, VanPlan } from './types';

export const PIECES = Object.keys(VAN_PLAN.pieces);

// The bed's always there, and stays in: you sleep in it. The rest are yours once you've got
// them, and can come out to make room.
export const fixed = (id: string): boolean => id === 'bed';
export const owned = (s: Pick<GameState, 'gear'>, id: string): boolean =>
  fixed(id) || (s.gear?.[id] ?? 0) > 0;

// Whether a piece can turn at all: one longer than the van is wide can't.
export const turns = (id: string): boolean => (VAN_PLAN.pieces[id]?.long ?? 0) <= VAN_PLAN.wide;

// How long the floor is: the Rig's is longer.
export const floorLen = (s: Pick<GameState, 'dream'>): number =>
  s.dream?.owned?.includes('rig') ? VAN_PLAN.rig : VAN_PLAN.len;

export const onRoof = (id: string): boolean => !!VAN_PLAN.pieces[id]?.roof;

// The cells a piece covers at a spot, turned or not: [x along the van, y across it].
export function cellsOf(id: string, at: Spot): [number, number][] {
  const p = VAN_PLAN.pieces[id]!;
  const [w, h] = at.r ? [p.across, p.long] : [p.long, p.across];
  const out: [number, number][] = [];
  for (let x = at.x; x < at.x + w; x++) for (let y = at.y; y < at.y + h; y++) out.push([x, y]);
  return out;
}

// The sliding door's cells, along the near side of the floor.
export const isDoor = (x: number, y: number): boolean => y === VAN_PLAN.wide - 1 && VAN_PLAN.door.includes(x);

// Why a piece can't go at a spot, or null when it fits. It never sits on itself.
export function fitBlocked(len: number, plan: VanPlan, id: string, at: Spot): string | null {
  const cells = cellsOf(id, at);
  if (cells.some(([x, y]) => x < 0 || y < 0 || x >= len || y >= VAN_PLAN.wide)) return 'It doesn’t fit there';
  if (!onRoof(id) && cells.some(([x, y]) => isDoor(x, y))) return 'That’s the door';
  const taken = new Set(
    Object.entries(plan)
      .filter(([o, sp]) => o !== id && sp && onRoof(o) === onRoof(id))
      .flatMap(([o, sp]) => cellsOf(o, sp!).map(([x, y]) => `${x},${y}`)),
  );
  if (cells.some(([x, y]) => taken.has(`${x},${y}`))) return 'Something’s already there';
  return null;
}

// Where each piece goes in a van laid out for you: the bed across the back, the kitchen and the
// shelf along the far wall at the front, the heater in the front corner by the door, the panel
// mid-roof.
const HOME: Record<string, (len: number) => Spot> = {
  bed: (len) => ({ x: len - VAN_PLAN.pieces.bed!.long, y: 0, r: 0 }),
  kitchen: () => ({ x: 0, y: 0, r: 0 }),
  shelf: () => ({ x: 2, y: 0, r: 0 }),
  heater: () => ({ x: 0, y: VAN_PLAN.wide - 1, r: 0 }),
  solar: () => ({ x: 2, y: 0, r: 0 }),
};

// Its own spot if that's free, else the first that fits, from the front, unturned first.
export function spotFor(len: number, plan: VanPlan, id: string): Spot | null {
  const home = HOME[id]?.(len);
  if (home && !fitBlocked(len, plan, id, home)) return home;
  for (const r of [0, 1] as const)
    for (let x = 0; x < len; x++)
      for (let y = 0; y < VAN_PLAN.wide; y++) if (!fitBlocked(len, plan, id, { x, y, r })) return { x, y, r };
  return null;
}

// A van laid out for you, with what you own: a new game's, a new van's, and a save from before.
export function defaultPlan(s: Pick<GameState, 'gear' | 'dream'>): VanPlan {
  const len = floorLen(s);
  const plan: VanPlan = {};
  for (const id of PIECES) {
    if (!owned(s, id)) continue;
    const at = spotFor(len, plan, id);
    if (at) plan[id] = at;
  }
  return plan;
}

// After anything: what you no longer have comes off the plan, and what you've got that isn't on
// it, and wasn't taken out, goes in where it fits.
export function syncPlan(s: GameState): void {
  const len = floorLen(s);
  for (const id of Object.keys(s.vanPlan)) if (!PIECES.includes(id) || !owned(s, id)) delete s.vanPlan[id];
  for (const id of PIECES) {
    if (!owned(s, id) || s.vanPlan[id] !== undefined) continue;
    const at = spotFor(len, s.vanPlan, id);
    if (at) s.vanPlan[id] = at;
  }
}
