// The Training Center (Phase 21, criterion 3's gap): a third gym, comp-style, V7 to V14, so a
// climber past The Cave still has something new indoors on a wet day.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { centerSet, INDOOR, routeById, routesAt } from './content/gym';
import { PLACES } from './content/places';
import { MONEY } from './dials';
import { act, goBlocked, newGame } from './game';
import type { GameState } from './types';

const at = (grade: number, over: Partial<GameState> = {}): GameState => {
  const k = needFor(grade);
  return {
    ...newGame('center'),
    at: 'center',
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

describe('The Training Center', () => {
  it('sets eight comp problems a week, V7 to V14, the same for the same seed', () => {
    const w1 = centerSet('a', 1);
    expect(w1.map((r) => r.grade)).toEqual([7, 8, 9, 10, 11, 12, 13, 14]);
    expect(w1.every((r) => r.place === 'center' && r.disc === 'boulder')).toBe(true);
    expect(centerSet('a', 1)).toBe(w1);
    expect(routesAt('a', 'center', 8)).toEqual(centerSet('a', 2));
    expect(routeById('a', w1[5]!.id)).toBe(w1[5]);
    // Comp setting: dynos, slabs and compression more than crimps.
    const types = [1, 2, 3, 4, 5, 6].flatMap((w) => centerSet('a', w).map((r) => r.type));
    expect(types.filter((t) => t === 'dyno').length / types.length).toBeGreaterThan(0.25);
    expect(types.filter((t) => t === 'crimp').length / types.length).toBeLessThan(0.25);
  });

  it('wants V7 to get in, like the Mesa', () => {
    expect(PLACES.center!.minGrade).toBe(7);
    const low = { ...at(5), at: 'gym' };
    const r = act(low, { t: 'travel', to: 'center' });
    expect(refused(r)).toBeTruthy();
    expect(refused(act({ ...at(7), at: 'gym' }, { t: 'travel', to: 'center' }))).toBeNull();
  });

  it('takes its own dearer pass, and brings on power and technique', () => {
    const s = at(8);
    const r = centerSet('center', 1)[1]!;
    expect(goBlocked(s, r)).toBe('Buy a day pass at the desk first');
    expect(goBlocked({ ...s, today: ['warm', 'pass', 'cavepass'] }, r)).toBe(
      'Buy a day pass at the desk first',
    );
    const paid = act(s, { t: 'act', act: 'center.pass' }).state;
    expect(paid.cash).toBe(100 - MONEY.centerPass);
    expect(MONEY.centerPass).toBeGreaterThan(MONEY.dayPass);
    expect(goBlocked(paid, r)).toBeNull();
    expect(INDOOR.center!.specialty.sort()).toEqual(['power', 'technique']);
  });
});
