// Phase 44: the setter's panel. A hold's square, the reach between two, and a set's moves as
// climbed: each hold made harder by a long reach to it. Its own module so the gym's lookup
// can rebuild a hung set from its id (yourset.ts) without importing the shifts.

import { SET_MOVES, type SetMove } from './content/setting';
import { SETTING } from './dials';

// A hold's square on the panel, across and up from the bottom left.
export type Cell = [number, number];

// Where holds go when only their order is known: up the middle a row at a time, no move
// long enough to count. A set played without squares (and a bot's) climbs as before.
export const straightUp = (n: number): Cell[] =>
  Array.from({ length: n }, (_, i) => [Math.floor(SETTING.panel.cols / 2), i]);

// How far a move spans, in squares, and how much harder that makes it.
export const spanOf = (a: Cell, b: Cell): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const spanBump = (d: number): number =>
  d >= SETTING.panel.huge ? 2 : d >= SETTING.panel.long ? 1 : 0;

// A set's moves as climbed: each hold, made harder by a long reach to it.
export function setMoves(ids: readonly string[], at: readonly Cell[] = straightUp(ids.length)): SetMove[] {
  return ids.map((id, i) => {
    const m = SET_MOVES[id]!;
    const bump = i && at[i - 1] && at[i] ? spanBump(spanOf(at[i - 1]!, at[i]!)) : 0;
    return bump ? { ...m, hard: Math.min(3, m.hard + bump) } : m;
  });
}

// A set's grade, from how hard its moves are and how hard its hardest is.
export function setGrade(moves: readonly SetMove[]): number {
  if (!moves.length) return 0;
  const sum = moves.reduce((a, m) => a + m.hard, 0);
  const top = Math.max(...moves.map((m) => m.hard));
  return Math.max(0, Math.round(0.6 * sum + 0.5 * top - 2));
}
