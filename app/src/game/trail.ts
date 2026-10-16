// Phase 19.4: the last few moves, for the error screen's report, so a bug a tester hits can be
// found again from the report and their save: the save's seed, the day and the hour, where, and
// what was done just before it broke. Kept in memory, never saved, and gone on a reload. A name
// the player typed (the climber's, a first ascent's, the crew's) is left out.

import { clock, type Action, type GameState } from '../sim';

// How many moves a report carries.
export const TRAIL = 12;
// The fields that hold the player's own words.
const TYPED = new Set(['name']);

// One move, as a line: its kind, then its fields, a typed name left out.
export function moveOf(a: Action): string {
  const fields = Object.entries(a)
    .filter(([k, v]) => k !== 't' && v !== undefined)
    .map(([k, v]) => `${k}=${TYPED.has(k) ? '…' : typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
  return [a.t, ...fields].join(' ');
}

export interface Trail {
  seed: string;
  day: number;
  min: number;
  at: string;
  moves: string[];
}

export class Moves {
  private list: { line: string; t: string }[] = [];

  // A move, as the state stood when it was made. Walking sends a stand at every step, so a run
  // of them is one line, the last.
  push(s: GameState, a: Action): void {
    const line = `day ${s.day} ${clock(s.min)}: ${moveOf(a)}`;
    if (a.t === 'stand' && this.list.at(-1)?.t === 'stand') this.list.pop();
    this.list.push({ line, t: a.t });
    if (this.list.length > TRAIL) this.list.shift();
  }

  trail(s: GameState): Trail {
    return { seed: s.seed, day: s.day, min: s.min, at: s.at, moves: this.list.map((m) => m.line) };
  }
}
