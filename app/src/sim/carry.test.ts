// A climber carried over from v0.956: their own skills, no higher than the cap, shape kept.
import { describe, expect, it } from 'vitest';
import { average, CARRIED, carried, gradeOf, needFor, startName } from './climber';
import { LEGACY } from './dials';
import { act, newGame } from './game';
import { fromSave, toSave } from './save';

const veteran = { power: 180, fingers: 220, endurance: 150, technique: 170, head: 90 };

describe('coming across from v0.956', () => {
  it('keeps a climber under the cap as they were', () => {
    const k = { power: 12, fingers: 10, endurance: 4, technique: 5, head: 6 };
    expect(carried(k)).toEqual(k);
  });

  it('brings a stronger climber down to the cap, in their own shape', () => {
    expect(gradeOf(veteran)).toBeGreaterThan(LEGACY.capGrade);
    const k = carried(veteran)!;
    expect(gradeOf(k)).toBe(LEGACY.capGrade);
    expect(average(k)).toBeLessThan(needFor(LEGACY.capGrade + 1));
    // Fingers were the strength and the head the weakness; they still are.
    expect(k.fingers / k.head).toBeCloseTo(veteran.fingers / veteran.head, 1);
  });

  it('won’t take something that isn’t five skills', () => {
    expect(carried(null)).toBeNull();
    expect(carried({ power: 1, fingers: 2 })).toBeNull();
    expect(carried({ ...veteran, head: -3 })).toBeNull();
    expect(carried({ ...veteran, head: Number.NaN })).toBeNull();
  });

  it('makes a climber through the one action, called an old hand, and the save keeps them', () => {
    const r = act(newGame('carry'), { t: 'create', name: 'Robin Vance', start: '', carry: veteran });
    expect(r.events.some((e) => e.k === 'refused')).toBe(false);
    expect(r.state.climber.start).toBe(CARRIED);
    expect(gradeOf(r.state.climber.skills)).toBe(LEGACY.capGrade);
    expect(startName(r.state.climber.start)).toBe('An old hand');
    const back = fromSave(toSave(r.state, 'test'));
    expect(back.ok && back.state.climber).toEqual(r.state.climber);
    const bad = act(newGame('carry'), {
      t: 'create',
      name: 'Robin',
      start: '',
      carry: { power: 1 } as never,
    });
    expect(bad.events[0]).toMatchObject({ k: 'refused' });
  });
});
