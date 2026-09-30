// Phase 21.4: The Cave, a second gym. Its weekly set, its own pass and specialty, coaching,
// and a campus board you can train on.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { caveSet, routeById, routesAt } from './content/gym';
import { CLIMB } from './dials';
import { act, goBlocked, newGame } from './game';
import { trainBlocked } from './sessions';
import type { GameState } from './types';

const at = (grade: number, over: Partial<GameState> = {}): GameState => {
  const k = needFor(grade);
  return {
    ...newGame('cave'),
    at: 'cave',
    min: 10 * 60,
    today: ['warm'],
    cash: 100,
    climber: {
      name: 'Kit',
      start: 'allrounder',
      skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
    },
    ...over,
  };
};
const refused = (r: ReturnType<typeof act>) => {
  const e = r.events.find((x) => x.k === 'refused');
  return e?.k === 'refused' ? e.why : null;
};

describe('The Cave', () => {
  it('sets eight problems a week, V5 to V12, the same for the same seed', () => {
    const w1 = caveSet('a', 1);
    expect(w1.map((r) => r.grade)).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
    expect(w1.every((r) => r.place === 'cave' && r.disc === 'boulder')).toBe(true);
    expect(caveSet('a', 1)).toBe(w1);
    expect(caveSet('a', 2).map((r) => r.name)).not.toEqual(w1.map((r) => r.name));
    expect(routesAt('a', 'cave', 8)).toEqual(caveSet('a', 2));
    expect(routeById('a', w1[3]!.id)).toBe(w1[3]);
    // Mostly power and crimps, as v0.956's were.
    const types = [1, 2, 3, 4, 5, 6].flatMap((w) => caveSet('a', w).map((r) => r.type));
    expect(types.filter((t) => t === 'power' || t === 'crimp').length / types.length).toBeGreaterThan(0.6);
  });

  it('takes its own day pass, and brings on power and fingers faster', () => {
    const s = at(6);
    const r = caveSet('cave', 1)[2]!;
    expect(goBlocked(s, r)).toBe('Buy a day pass at the desk first');
    // Send City's pass doesn't get you in here.
    expect(goBlocked({ ...s, today: ['warm', 'pass'] }, r)).toBe('Buy a day pass at the desk first');
    const paid = act(s, { t: 'act', act: 'cave.pass' }).state;
    expect(goBlocked(paid, r)).toBeNull();
    const went = act(act(paid, { t: 'go', route: r.id }).state, {
      t: 'done',
      route: r.id,
      result: { sent: false, hi: 3, fellAt: 'A', tried: ['A1'], skin: 0 },
    });
    const gains = went.events.find((e) => e.k === 'skills');
    expect(gains?.k === 'skills' && gains.gains.power).toBeGreaterThan(0);
    expect(CLIMB.gymSpecialty).toBeGreaterThan(1);
  });

  it('pays you to coach once you climb V5, pass included', () => {
    expect(refused(act(at(4), { t: 'act', act: 'cave.coach' }))).toMatch(/V5/);
    const r = act(at(5), { t: 'act', act: 'cave.coach' });
    expect(refused(r)).toBeNull();
    expect(r.state.cash).toBe(100 + 34);
    expect(r.state.today).toContain('cavepass');
    expect(r.state.jobs.coach).toBe(1);
  });

  it('has a campus board you can train on, with a pass', () => {
    const s = { ...at(5), gear: { shoes: 60, chalk: 30 } };
    expect(trainBlocked(s, 'campus')).toBe('Buy a day pass at the desk first');
    expect(trainBlocked({ ...s, today: [...s.today, 'cavepass'] }, 'campus')).toBeNull();
  });
});
