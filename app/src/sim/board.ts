// The Board (Phase 23.6): this week's jobs, how far along each is, and the pay, on its own.

import { gradeOf } from './climber';
import { BOARD_JOBS, type BoardJob } from './content/board';
import { indoor, routeById, WEEK_DAYS, weekOf } from './content/gym';
import { BOARD } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';

const shiftsWorked = (s: GameState): number => Object.values(s.jobs).reduce((a, b) => a + b, 0);

// A week's board, drawn on the seed: its jobs, pitched at the grade you climb now.
export function postBoard(s: GameState, week: number): GameState['board'] {
  const r = Rng.fromStream(s.seed, 'events').derive(`board-${week}`);
  const ids = Object.keys(BOARD_JOBS);
  for (let i = ids.length - 1; i > 0; i--) {
    const k = r.int(0, i);
    [ids[i], ids[k]] = [ids[k]!, ids[i]!];
  }
  const g = gradeOf(s.climber.skills);
  return {
    week,
    jobs: ids.slice(0, BOARD.jobs).map((id) => ({ id, grade: g, paid: false })),
    shifts0: shiftsWorked(s),
    sessions: 0,
  };
}

// The grade a job asks for, if it asks for one.
export function jobGrade(j: BoardJob, grade: number): number | null {
  const c = j.crit;
  return c.k === 'grade' || c.k === 'outsideGrade' ? Math.max(0, grade + c.over) : null;
}

// How far along a job is this week.
export function jobProgress(s: GameState, job: { id: string; grade: number }): number {
  const j = BOARD_JOBS[job.id];
  if (!j) return 0;
  const c = j.crit;
  if (c.k === 'train') return s.board.sessions;
  if (c.k === 'work') return shiftsWorked(s) - s.board.shifts0;
  const from = (s.board.week - 1) * WEEK_DAYS + 1;
  const min = jobGrade(j, job.grade) ?? 0;
  let n = 0;
  for (const [id, l] of Object.entries(s.routes)) {
    if (!l.sent || l.sent.day < from) continue;
    const r = routeById(s.seed, id);
    if (!r || r.exped) continue;
    const out = !indoor(r.place);
    if (c.k === 'send') n++;
    else if (c.k === 'grade' && r.grade >= min) n++;
    else if (c.k === 'outside' && out) n++;
    else if (c.k === 'outsideGrade' && out && r.grade >= min) n++;
    else if (c.k === 'type' && r.type === c.type) n++;
  }
  return n;
}

// A job in words, from its numbers: "Send 3 lines at V5 or harder."
export function jobText(j: BoardJob, grade: number): string {
  const c = j.crit;
  const g = jobGrade(j, grade);
  if (c.k === 'send') return `Send ${j.n} lines anywhere.`;
  if (c.k === 'grade') return `Send ${j.n} lines at V${g} or harder.`;
  if (c.k === 'outside') return `Send ${j.n} lines outside.`;
  if (c.k === 'outsideGrade') return `Send ${j.n} lines outside at V${g} or harder.`;
  if (c.k === 'type') return `Send ${j.n} ${c.type} lines.`;
  if (c.k === 'train') return `Get ${j.n} training sessions in.`;
  return `Work ${j.n} shifts.`;
}

// The board's week, on any day.
export const boardWeek = (day: number): number => weekOf(day);

// The most a week's board could pay: its three best jobs.
export const bestWeek = (): number =>
  Object.values(BOARD_JOBS)
    .map((j) => j.cash)
    .sort((a, b) => b - a)
    .slice(0, BOARD.jobs)
    .reduce((a, b) => a + b, 0);
