// Phase 23.6: the Board. Three jobs a week on the seed, pitched at your grade, each paying
// on its own the moment it's done, and gone with the week.
import { describe, expect, it } from 'vitest';
import { bestWeek, boardWeek, jobGrade, jobProgress, jobText, postBoard } from './board';
import { needFor } from './climber';
import { BOARD_JOBS } from './content/board';
import { indoor, WEEK_DAYS } from './content/gym';
import { ROUTES } from './content/routes';
import { BOARD } from './dials';
import { act, newGame } from './game';
import type { GameState } from './types';

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
  it('goes up with the first thing you do each week: three jobs, on the seed, pitched at your grade', () => {
    const s = made(5);
    expect(s.board.week).toBe(1);
    expect(s.board.jobs).toHaveLength(BOARD.jobs);
    expect(new Set(s.board.jobs.map((j) => j.id)).size).toBe(BOARD.jobs);
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

  it('counts only this week’s sends, and pays once, on its own', () => {
    const s0 = made(3);
    const job = { id: 'rock', grade: 3, paid: false };
    const s = {
      ...s0,
      day: 9,
      board: { week: 2, jobs: [job], shifts0: 0, sessions: 0 },
      at: 'lot',
      min: 9 * 60,
    };
    const ids = outside.slice(0, 3).map((r) => r.id);
    const lastWeek = { ...s, routes: Object.fromEntries(ids.map((id) => [id, log(7)])) };
    expect(jobProgress(lastWeek, job)).toBe(0);
    const now = { ...s, routes: Object.fromEntries(ids.map((id) => [id, log(8)])) };
    expect(jobProgress(now, job)).toBe(3);
    const r = act(now, { t: 'act', act: 'lot.rest' });
    expect(r.state.cash).toBe(now.cash + BOARD_JOBS.rock!.cash);
    expect(r.state.board.jobs[0]!.paid).toBe(true);
    const again = act({ ...r.state, min: 9 * 60 }, { t: 'act', act: 'lot.rest' });
    expect(again.state.cash).toBe(r.state.cash);
  });

  it('counts sessions and shifts since it went up', () => {
    const s0 = made(3);
    const s = { ...s0, board: { week: 1, jobs: [], shifts0: 2, sessions: 3 }, jobs: { cafe: 5 } };
    expect(jobProgress(s, { id: 'train', grade: 3 })).toBe(3);
    expect(jobProgress(s, { id: 'work', grade: 3 })).toBe(3);
  });

  it('is a bonus, not a living: the best week is small', () => {
    expect(bestWeek()).toBe(
      Object.values(BOARD_JOBS)
        .map((j) => j.cash)
        .sort((a, b) => b - a)
        .slice(0, 3)
        .reduce((a, b) => a + b),
    );
    expect(boardWeek(WEEK_DAYS)).toBe(1);
    expect(boardWeek(WEEK_DAYS + 1)).toBe(2);
  });
});
