// Phase 25.3: the kid you coach: taken on from V7, built a session a day, never past you;
// drifting off if left alone, warned first; and their grade, a head start for an heir.
import { describe, expect, it } from 'vitest';
import { gradeOf, needFor, STARTS } from './climber';
import { MENTEE } from './dials';
import { act, newGame } from './game';
import { aimEarned } from './record';
import { heirStart, menteeAfter } from './mentee';
import type { GameState, Skills } from './types';

const at = (g: number): Skills => {
  const n = needFor(g) + 1;
  return { power: n, fingers: n, endurance: n, technique: n, head: n };
};
const base = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('mentee'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return {
    ...s,
    at: 'gym',
    min: 10 * 60,
    energy: 100,
    cash: 500,
    today: ['pass'],
    climber: { ...s.climber, skills: at(9) },
    ...over,
  };
};
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const sleep = (s: GameState) => {
  let r = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
  if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
  return r;
};

describe('a mentee', () => {
  it('is taken on at Send City from V7', () => {
    expect(
      refused(act(base({ climber: { ...base().climber, skills: at(5) } }), { t: 'mentee', do: 'take' })),
    ).toBe(true);
    expect(refused(act(base({ at: 'lot' }), { t: 'mentee', do: 'take' }))).toBe(true);
    const r = act(base(), { t: 'mentee', do: 'take' });
    expect(r.state.mentee).toMatchObject({ level: 1, sessions: 0 });
    expect(refused(act(r.state, { t: 'mentee', do: 'take' }))).toBe(true);
  });

  it('grows a session a day, slower as they grow, and never past you', () => {
    expect(menteeAfter(1, 9) - 1).toBeGreaterThan(menteeAfter(6, 9) - 6);
    expect(menteeAfter(9, 9)).toBe(9);
    expect(menteeAfter(8.9, 9)).toBe(9);
    let s = act(base(), { t: 'mentee', do: 'take' }).state;
    const r = act(s, { t: 'mentee', do: 'coach' });
    expect(r.state.mentee!.level).toBeGreaterThan(1);
    expect(r.state.energy).toBe(s.energy - MENTEE.energy);
    expect(lines(r)[0]).toContain(r.state.mentee!.name);
    expect(refused(act(r.state, { t: 'mentee', do: 'coach' }))).toBe(true);
    s = r.state;
    for (let d = 0; d < 60; d++)
      s = act({ ...s, today: ['pass'], energy: 100 }, { t: 'mentee', do: 'coach' }).state;
    expect(s.mentee!.level).toBeGreaterThan(8);
    expect(aimEarned(s, { mentee: 8 })).toBe(true);
    expect(s.mentee!.told).toEqual(expect.arrayContaining([5, 8]));
  });

  it('drifts off if left alone, warned first, and costs its shoes every week', () => {
    const s = act(base({ day: 10 }), { t: 'mentee', do: 'take' }).state;
    const warned = sleep({ ...s, day: 10 + MENTEE.lapse });
    expect(lines(warned).some((l) => /two weeks/.test(l))).toBe(true);
    expect(warned.state.mentee).not.toBeNull();
    expect(sleep({ ...s, day: 10 + 2 * MENTEE.lapse }).state.mentee).toBeNull();
    const week = sleep({ ...s, day: 14, mentee: { ...s.mentee!, last: 14 } });
    expect(lines(week).some((l) => l.includes('shoes and comp fees'))).toBe(true);
  });

  it('is let go, and passes their grade to an heir as a head start', () => {
    const s = act(base(), { t: 'mentee', do: 'take' }).state;
    expect(act(s, { t: 'mentee', do: 'let' }).state.mentee).toBeNull();
    const retired = {
      ...s,
      mentee: { ...s.mentee!, level: 8.4 },
      life: { held: 0, told: 30, retired: { day: 300, forced: false } },
    };
    const h = act(retired, { t: 'heir' }).state;
    expect(h.family!.mentee).toEqual({ name: s.mentee!.name, grade: 8 });
    expect(h.mentee).toBeNull();
    const kid = act(h, { t: 'create', name: 'Robin', start: 'allrounder' });
    const plain = act(act({ ...retired, mentee: null }, { t: 'heir' }).state, {
      t: 'create',
      name: 'Robin',
      start: 'allrounder',
    });
    // Phase 26: a V8 makes a V3, the start's own shape kept.
    expect(gradeOf(kid.state.climber.skills)).toBe(3);
    expect(gradeOf(plain.state.climber.skills)).toBe(0);
    const gap = (k: keyof Skills) => kid.state.climber.skills[k] - plain.state.climber.skills[k];
    expect(gap('head')).toBe(gap('power'));
    expect(lines(kid).some((l) => l.includes(s.mentee!.name))).toBe(true);
  });

  it('gives an heir a head start that grows with the kid’s grade, from any start (Phase 26)', () => {
    for (const st of Object.values(STARTS)) {
      const from = (g: number) => gradeOf(heirStart(st.skills, g));
      expect([5, 8, 10, 12].map(from)).toEqual([2, 3, 4, 5]);
      expect(from(0)).toBe(gradeOf(st.skills));
      // Whole skill, nobody's made weaker.
      const up = heirStart(st.skills, 8);
      for (const k of Object.keys(up) as (keyof Skills)[]) {
        expect(Number.isInteger(up[k])).toBe(true);
        expect(up[k]).toBeGreaterThanOrEqual(st.skills[k]);
      }
    }
  });
});
