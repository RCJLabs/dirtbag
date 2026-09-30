// Promotions: shifts worked (a double counts two) earn ranks, ranks raise the pay, and
// setting's ranks want you climbing too.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { ACTS } from './content/places';
import { JOBS } from './content/jobs';
import { act, actCost, newGame } from './game';
import { nextRank, rankAt } from './jobs';
import type { GameState } from './types';

const at = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('jobs'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  at: 'cafe',
  min: 8 * 60,
  energy: 100,
  ...over,
});
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

describe('jobs', () => {
  it('pays the first rank what it always did, and counts a double as two shifts', () => {
    const s = at();
    expect(actCost(s, ACTS['cafe.shift']!).cash).toBe(28);
    const r = act(s, { t: 'act', act: 'cafe.double' });
    expect(r.state.cash).toBe(s.cash + 56);
    expect(r.state.jobs.cafe).toBe(2);
  });

  it('promotes on the shift that earns it, with a raise on every shift after', () => {
    const J = JOBS.cafe!;
    const s = at({ jobs: { cafe: J.at[1]! - 1 } });
    expect(rankAt(s, 'cafe')).toBe(0);
    const r = act(s, { t: 'act', act: 'cafe.shift' });
    expect(rankAt(r.state, 'cafe')).toBe(1);
    expect(lines(r).some((l) => l.startsWith(`Promoted: ${J.ranks[1]}.`))).toBe(true);
    // Paid at the old rank for the shift that promoted you; the raise from the next.
    expect(r.state.cash).toBe(s.cash + 28);
    expect(actCost(r.state, ACTS['cafe.double']!).cash).toBe(56 + 2 * J.raise);
    expect(nextRank(r.state, 'cafe')).toEqual({ name: J.ranks[2], shifts: J.at[2]! - J.at[1]!, grade: null });
  });

  it('holds a setter back until they climb the grade, however many shifts', () => {
    const J = JOBS.set!;
    const k = needFor(J.grade![2]! - 1);
    const weak = at({
      jobs: { set: J.at[3]! },
      climber: {
        name: 'Kit',
        start: 'allrounder',
        skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
      },
    });
    expect(rankAt(weak, 'set')).toBe(1);
    expect(nextRank(weak, 'set')?.grade).toBe(J.grade![2]);
  });
});
