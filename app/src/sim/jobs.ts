// Your working life: shifts worked at each job, the rank that earns you, and what a shift
// pays at it. The ranks are data (content/jobs.ts); every act that's a shift says which
// job and how many shifts it counts for (ActDef.job).

import { gradeOf } from './climber';
import { JOBS } from './content/jobs';
import type { GameState } from './types';

export const shiftsAt = (s: GameState, job: string): number => s.jobs[job] ?? 0;

// Your rank at a job: the highest whose shifts you've worked and whose grade you climb.
export function rankAt(s: GameState, job: string): number {
  const j = JOBS[job];
  if (!j) return 0;
  const n = shiftsAt(s, job);
  const g = gradeOf(s.climber.skills);
  let r = 0;
  for (let i = 1; i < j.ranks.length; i++) if (n >= j.at[i]! && g >= (j.grade?.[i] ?? 0)) r = i;
  return r;
}

export const rankName = (s: GameState, job: string): string => JOBS[job]?.ranks[rankAt(s, job)] ?? '';

// What a rank adds to one shift's pay.
export const raiseAt = (s: GameState, job: string): number => (JOBS[job]?.raise ?? 0) * rankAt(s, job);

// The next rank and what stands between you and it, or null at the top.
export function nextRank(
  s: GameState,
  job: string,
): { name: string; shifts: number; grade: number | null } | null {
  const j = JOBS[job];
  const r = rankAt(s, job);
  if (!j || r >= j.ranks.length - 1) return null;
  const g = j.grade?.[r + 1] ?? 0;
  return {
    name: j.ranks[r + 1]!,
    shifts: Math.max(0, j.at[r + 1]! - shiftsAt(s, job)),
    grade: gradeOf(s.climber.skills) < g ? g : null,
  };
}
