// Phase 38: a ghost of your best go. Every go keeps its pace (climb.ts); the best so far on a
// line you haven't sent climbs beside your next go on it, faint, to where it came off and no
// further. The best is the highest, and of two as high, the quicker there.

import { CLIMB } from './dials';
import type { GoResult, RouteLog } from './types';

// Where a go's pace ends: the moment it came off, from its first move, and the place.
const endOf = (k: number[]): { t: number; pos: number } => ({ t: k[k.length - 2]!, pos: k[k.length - 1]! });

// Whether a go that came off beats the ghost the line keeps: higher, or as high and quicker.
// With none kept, it has to reach the line's high point from before it: a save from before
// Phase 38 flags one with no pace to show for it.
export function outclimbs(res: GoResult, ghost: number[] | undefined, hiWas: number): boolean {
  if (!res.trace) return false;
  if (!ghost) return res.hi >= hiWas;
  const e = endOf(res.trace);
  const g = endOf(ghost);
  return e.pos > g.pos || (e.pos === g.pos && e.t < g.t);
}

// The ghost a line shows your next go: your best go's pace. A high point from before paces
// were kept climbs evenly, at the pace you climb now (the go's `speed`), up into the move it
// came off. None before a go, and none once it's sent.
export function ghostOf(L: RouteLog | undefined, speed: number): number[] | null {
  if (!L || L.sent || L.hi <= 0) return null;
  if (L.ghost) return L.ghost;
  const to = L.hi - 0.5;
  return [0, 0, Math.round((to / (CLIMB.climbRate * speed)) * 100) / 100, to];
}

// Where the ghost is `t` seconds after your first move: on its pace up the line, then off it
// (`off`, from 0 as it lets go to 1 as it's gone, over a fall's time). Null once it's gone.
export function ghostAt(k: number[], t: number): { pos: number; off: number } | null {
  const end = endOf(k);
  if (t >= end.t) {
    const off = (t - end.t) / CLIMB.fallTime;
    return off >= 1 ? null : { pos: end.pos, off };
  }
  for (let i = 2; i < k.length; i += 2) {
    const t1 = k[i]!;
    if (t >= t1) continue;
    const t0 = k[i - 2]!;
    const p0 = k[i - 1]!;
    const p1 = k[i + 1]!;
    return { pos: t1 > t0 ? p0 + ((p1 - p0) * (t - t0)) / (t1 - t0) : p1, off: 0 };
  }
  return { pos: end.pos, off: 0 };
}
