// Phase 23.6: the Board. Three jobs a week on the seed, pitched at your grade, and gone with
// the week. Phase 29.2: bounties. You take one; it counts from then, and pays cash, parts or
// some of each, as it was dealt, the moment it's done.
import { describe, expect, it } from 'vitest';
import {
  bestWeek,
  boardWeek,
  bountyPay,
  bountyProgress,
  jobGrade,
  jobProgress,
  jobText,
  partWorth,
  PAYS,
  payWords,
  payWorth,
  postBoard,
} from './board';
import { bountyFor, playDays } from './bot';
import { needFor } from './climber';
import { BOARD_JOBS } from './content/board';
import { indoor, WEEK_DAYS } from './content/gym';
import { ROUTES } from './content/routes';
import { BOARD, HUSTLE } from './dials';
import { act, newGame } from './game';
import type { GameState } from './types';

const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const payOf = (j: { cash: number; parts: number }) =>
  j.cash && j.parts ? 'both' : j.cash ? 'cash' : 'parts';
const bounty = (id: string, pay: (typeof PAYS)[number] = 'cash') => ({
  id,
  grade: 3,
  ...bountyPay(BOARD_JOBS[id]!, pay),
  paid: false,
});

const made = (grade = 3): GameState => {
  const s = act(newGame('board'), { t: 'create', name: 'Pat', start: 'allrounder' }).state;
  const n = needFor(grade) + 0.5;
  return {
    ...s,
    climber: { ...s.climber, skills: { power: n, fingers: n, endurance: n, technique: n, head: n } },
  };
};
const outside = Object.values(ROUTES).filter((r) => !indoor(r.place) && !r.exped);
const log = (day: number) => ({
  known: [],
  told: [],
  pick: {},
  falls: {},
  goes: 1,
  goesToday: 0,
  hi: 0,
  sent: { day, go: 1, style: 'redpoint' as const },
  sentToday: false,
});

describe('the board', () => {
  it('goes up with the first thing you do each week: three bounties, on the seed, at your grade, one of each pay', () => {
    const s = made(5);
    expect(s.board.week).toBe(1);
    expect(s.board.jobs).toHaveLength(BOARD.jobs);
    expect(new Set(s.board.jobs.map((j) => j.id)).size).toBe(BOARD.jobs);
    // One of each pay, none taken.
    expect(new Set(s.board.jobs.map(payOf)).size).toBe(PAYS.length);
    expect(s.board.pick).toBeNull();
    expect(postBoard(s, 3)).toEqual(postBoard(s, 3));
    expect(postBoard(s, 3).jobs.every((j) => j.grade === 5)).toBe(true);
    const weeks = new Set(
      Array.from({ length: 12 }, (_, w) =>
        postBoard(s, w + 1)
          .jobs.map((j) => j.id)
          .join(),
      ),
    );
    expect(weeks.size).toBeGreaterThan(8);
    const r = act({ ...s, day: WEEK_DAYS + 1, at: 'lot', min: 9 * 60 }, { t: 'act', act: 'lot.rest' });
    expect(r.state.board.week).toBe(2);
  });

  it('says each job from its numbers, a grade job from the grade it went up at', () => {
    expect(jobText(BOARD_JOBS.push!, 7)).toBe('Send 2 lines at V7 or harder.');
    expect(jobText(BOARD_JOBS.real!, 7)).toBe('Send 2 lines outside at V6 or harder.');
    expect(jobText(BOARD_JOBS.crack!, 7)).toBe('Send 2 crack lines.');
    expect(jobGrade(BOARD_JOBS.step!, 0)).toBe(0);
  });

  it('pays the one you took, once, counted from when you took it, and nothing else', () => {
    const rock = bounty('rock');
    const volume = bounty('volume', 'parts');
    const s = {
      ...made(3),
      day: 9,
      board: { week: 2, jobs: [rock, volume], shifts0: 0, sessions: 0, pick: null },
      at: 'lot',
      min: 9 * 60,
    };
    const ids = outside.slice(0, 6).map((r) => r.id);
    // Last week's sends don't count, this week's do.
    const lastWeek = { ...s, routes: Object.fromEntries(ids.slice(0, 3).map((id) => [id, log(7)])) };
    expect(jobProgress(lastWeek, rock)).toBe(0);
    const before = { ...s, routes: Object.fromEntries(ids.slice(0, 3).map((id) => [id, log(8)])) };
    expect(jobProgress(before, rock)).toBe(3);
    // Taken now, the three before it don't count either.
    const took = act(before, { t: 'bounty', i: 0 });
    expect(refused(took)).toBe(false);
    expect(took.state.board.pick).toEqual({ i: 0, base: 3 });
    expect(bountyProgress(took.state)).toBe(0);
    expect(took.state.cash).toBe(before.cash);
    expect(lines(took)[0]).toContain(jobText(BOARD_JOBS.rock!, 3));
    // One a week.
    expect(refused(act(took.state, { t: 'bounty', i: 1 }))).toBe(true);
    // Three more outside: it pays, once. The parts bounty, done too, doesn't.
    const done = {
      ...took.state,
      routes: { ...took.state.routes, ...Object.fromEntries(ids.slice(3).map((id) => [id, log(9)])) },
    };
    expect(bountyProgress(done)).toBe(3);
    const r = act(done, { t: 'act', act: 'lot.rest' });
    expect(r.state.cash).toBe(done.cash + rock.cash);
    expect(r.state.parts).toBe(done.parts);
    expect(r.state.board.jobs[0]!.paid).toBe(true);
    expect(lines(r)).toContain(`${BOARD_JOBS.rock!.title}, done. ${payWords(rock)} off the board.`);
    const again = act({ ...r.state, min: 9 * 60 }, { t: 'act', act: 'lot.rest' });
    expect(again.state.cash).toBe(r.state.cash);
  });

  it('pays parts, or some of each, as it was dealt', () => {
    for (const pay of PAYS) {
      const job = bounty('work', pay);
      const s = {
        ...made(3),
        day: 9,
        at: 'lot',
        min: 9 * 60,
        board: { week: 2, jobs: [job], shifts0: 0, sessions: 0, pick: { i: 0, base: 0 } },
        jobs: { cafe: BOARD_JOBS.work!.n },
      };
      const r = act(s, { t: 'act', act: 'lot.rest' });
      expect(r.state.cash - s.cash).toBe(job.cash);
      expect(r.state.parts - s.parts).toBe(job.parts);
    }
  });

  it('can only be taken off this week’s board', () => {
    const s = { ...made(3), day: 9, board: { ...postBoard(made(3), 1) } };
    expect(refused(act(s, { t: 'bounty', i: 0 }))).toBe(true);
    const now = { ...s, board: postBoard(s, 2) };
    expect(refused(act(now, { t: 'bounty', i: BOARD.jobs }))).toBe(true);
    expect(refused(act(now, { t: 'bounty', i: 0 }))).toBe(false);
  });

  it('comes down with the week, taken or not', () => {
    const s = act({ ...made(3), day: 4, at: 'lot', min: 9 * 60 }, { t: 'bounty', i: 0 }).state;
    expect(s.board.pick).not.toBeNull();
    const next = act({ ...s, day: WEEK_DAYS + 1, min: 9 * 60 }, { t: 'act', act: 'lot.rest' }).state;
    expect(next.board.week).toBe(2);
    expect(next.board.pick).toBeNull();
  });

  it('deals its pay from the job’s worth: parts at what the cans pay for the pile’s time, never over', () => {
    const mid = ([a, b]: [number, number]) => (a + b) / 2;
    expect(partWorth).toBe(mid(HUSTLE.cans.cash) / mid(HUSTLE.scrap.parts));
    for (const j of Object.values(BOARD_JOBS)) {
      const w = j.worth * BOARD.pay;
      expect(bountyPay(j, 'cash')).toEqual({ cash: w, parts: 0 });
      expect(bountyPay(j, 'parts').cash).toBe(0);
      for (const p of PAYS) {
        expect(payWorth(bountyPay(j, p))).toBeLessThanOrEqual(w);
        expect(payWorth(bountyPay(j, p))).toBeGreaterThan(w - partWorth);
      }
    }
    expect(payWords({ cash: 18, parts: 0 })).toBe('$18');
    expect(payWords({ cash: 0, parts: 1 })).toBe('1 part');
    expect(payWords({ cash: 18, parts: 4 })).toBe('$18 and 4 parts');
  });

  it('counts sessions and shifts since it went up', () => {
    const s0 = made(3);
    const s = { ...s0, board: { week: 1, jobs: [], shifts0: 2, sessions: 3, pick: null }, jobs: { cafe: 5 } };
    expect(jobProgress(s, { id: 'train', grade: 3 })).toBe(3);
    expect(jobProgress(s, { id: 'work', grade: 3 })).toBe(3);
  });

  it('is a bonus, not a living: the best week is its best bounty', () => {
    expect(bestWeek()).toBe(Math.max(...Object.values(BOARD_JOBS).map((j) => j.worth * BOARD.pay)));
    expect(boardWeek(WEEK_DAYS)).toBe(1);
    expect(boardWeek(WEEK_DAYS + 1)).toBe(2);
  });
});

describe('a bot at the board', () => {
  const job = (id: string, cash: number, parts: number) => ({ id, grade: 3, cash, parts, paid: false });
  // Last week: the shifts worked, no sends.
  const s = { ...made(3), jobs: { cafe: BOARD_JOBS.work!.n } };
  const last = { ...s, board: { ...s.board, shifts0: 0 } };

  it('takes what it got done last week over what pays more', () => {
    const on = { ...s, board: { ...s.board, jobs: [job('big', 36, 0), job('work', 16, 0)] } };
    expect(bountyFor(on, last)).toBe(1);
    // With nothing to go on, what pays most.
    expect(bountyFor(on, null)).toBe(0);
  });

  it('takes the cash, whatever the parts would fetch', () => {
    const jobs = [job('work', 0, 9), job('work', 8, 2), job('work', 16, 0)];
    expect(bountyFor({ ...s, board: { ...s.board, jobs } }, last)).toBe(2);
  });

  it('takes one every week, and never asks twice', () => {
    const run = playDays('bounty-bot', { days: 3 * WEEK_DAYS, strategy: 'balanced' });
    const weeks = run.actions.filter((a) => a.t === 'bounty').length;
    expect(weeks).toBeGreaterThanOrEqual(3);
    expect(run.refused.filter((r) => r.includes('bounty'))).toEqual([]);
  });
});
