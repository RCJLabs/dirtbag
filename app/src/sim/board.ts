// The Board (Phase 23.6): this week's jobs, how far along each is, and the pay. Phase 29.2:
// bounties. You take one; it counts from then, and pays cash, parts or both when it's done.

import { gradeOf } from './climber';
import { BOARD_JOBS, type BoardJob } from './content/board';
import { indoor, routeById, WEEK_DAYS, weekOf } from './content/gym';
import { BOARD, HUSTLE } from './dials';
import { money } from './format';
import { Rng } from './rng';
import type { GameState } from './types';

const shiftsWorked = (s: GameState): number => Object.values(s.jobs).reduce((a, b) => a + b, 0);
const mid = ([a, b]: [number, number]) => (a + b) / 2;

// What a part is worth in cash: what the cans pay for the time the pile takes to find one.
export const partWorth = mid(HUSTLE.cans.cash) / mid(HUSTLE.scrap.parts);

// How a bounty pays. Each week deals one of each, so there's always money now or the van later.
export type BountyPay = 'cash' | 'parts' | 'both';
export const PAYS: BountyPay[] = ['cash', 'parts', 'both'];

// What a job pays as a bounty, by how it's dealt. Parts round down, so no bounty pays over
// its worth.
export function bountyPay(j: BoardJob, pay: BountyPay): { cash: number; parts: number } {
  const w = j.worth * BOARD.pay;
  const cash = pay === 'cash' ? w : pay === 'both' ? Math.round(w * BOARD.split) : 0;
  return { cash, parts: Math.floor((w - cash) / partWorth) };
}

// A week's board, drawn on the seed: its jobs, pitched at the grade you climb now, each dealt
// a way to pay.
export function postBoard(s: GameState, week: number): GameState['board'] {
  const r = Rng.fromStream(s.seed, 'events').derive(`board-${week}`);
  const ids = Object.keys(BOARD_JOBS);
  for (let i = ids.length - 1; i > 0; i--) {
    const k = r.int(0, i);
    [ids[i], ids[k]] = [ids[k]!, ids[i]!];
  }
  const pays = [...PAYS];
  for (let i = pays.length - 1; i > 0; i--) {
    const k = r.int(0, i);
    [pays[i], pays[k]] = [pays[k]!, pays[i]!];
  }
  const g = gradeOf(s.climber.skills);
  return {
    week,
    jobs: ids
      .slice(0, BOARD.jobs)
      .map((id, i) => ({ id, grade: g, ...bountyPay(BOARD_JOBS[id]!, pays[i % pays.length]!), paid: false })),
    shifts0: shiftsWorked(s),
    sessions: 0,
    pick: null,
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

// How far along the bounty you took is: what's been done since you took it.
export function bountyProgress(s: GameState): number {
  const p = s.board.pick;
  const job = p ? s.board.jobs[p.i] : undefined;
  return job ? jobProgress(s, job) - p!.base : 0;
}

// What a bounty pays, in words: "$18", "4 parts", "$18 and 4 parts".
export function payWords(pay: { cash: number; parts: number }): string {
  const parts = `${pay.parts} part${pay.parts === 1 ? '' : 's'}`;
  if (!pay.parts) return money(pay.cash);
  return pay.cash ? `${money(pay.cash)} and ${parts}` : parts;
}

// What a bounty's worth, its parts at what they'd fetch.
export const payWorth = (pay: { cash: number; parts: number }): number => pay.cash + pay.parts * partWorth;

// The board's week, on any day.
export const boardWeek = (day: number): number => weekOf(day);

// The most a week's board could pay: its best bounty, however it's dealt.
export const bestWeek = (): number =>
  Math.max(...Object.values(BOARD_JOBS).flatMap((j) => PAYS.map((p) => payWorth(bountyPay(j, p)))));
