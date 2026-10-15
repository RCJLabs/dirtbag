// Phase 30.1: the body's curve (Evan's call: gentle, with skill offsets, at half the sizes first
// proposed). A go uses your skills as your age has them; the grade you see doesn't move.
import { describe, expect, it } from 'vitest';
import { ageingNote, ageMult, agedSkills, dayAtAge } from './ageing';
import { gradeOf, needFor } from './climber';
import { AGEING } from './dials';
import { act, newGame } from './game';
import { reachMargin } from './reach';
import type { GameState, SkillId } from './types';

const V13 = needFor(13);
const at = (age: number): GameState => {
  const s = act(newGame('ageing'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  const t = {
    ...s,
    climber: {
      ...s.climber,
      skills: { power: V13, fingers: V13, endurance: V13, technique: V13, head: V13 },
    },
  };
  return { ...t, day: dayAtAge(t, age) };
};
const IDS = Object.keys(AGEING) as SkillId[];

describe('the years', () => {
  it('take power and fingers from 33, endurance from 35, and give head and technique from 28', () => {
    for (const k of IDS) expect(ageMult(AGEING[k].from, k)).toBe(1);
    expect(ageMult(40, 'power')).toBeCloseTo(1 + 7 * AGEING.power.a, 6);
    expect(ageMult(40, 'endurance')).toBeCloseTo(1 + 5 * AGEING.endurance.a, 6);
    expect(ageMult(40, 'technique')).toBeCloseTo(1 + 12 * AGEING.technique.a, 6);
    // And never past their limits.
    for (const k of IDS) expect(ageMult(90, k)).toBe(AGEING[k].limit);
  });

  it('are what a go uses, and not the grade you see', () => {
    const young = at(25);
    const old = at(40);
    expect(agedSkills(young)).toEqual(young.climber.skills);
    for (const k of IDS) expect(agedSkills(old)[k]).toBeCloseTo(V13 * ageMult(40, k), 6);
    expect(gradeOf(old.climber.skills)).toBe(gradeOf(young.climber.skills));
  });

  it('make a V13 climber’s power lines about a grade harder at 40, and technical ones easier', () => {
    const d = (style: Parameters<typeof reachMargin>[1]) =>
      reachMargin(at(40), style, 13) - reachMargin(at(25), style, 13);
    expect(d('power')).toBeLessThan(-0.9);
    expect(d('power')).toBeGreaterThan(-1.2);
    expect(d('technical')).toBeGreaterThan(0.75);
    expect(d('technical')).toBeLessThan(1.05);
    // Crimps and dynos lean on the strength too; endurance and cracks on technique as well.
    expect(d('crimp')).toBeLessThan(0);
    expect(Math.abs(d('endurance'))).toBeLessThan(0.15);
  });

  it('are said on the You page, from the dials', () => {
    expect(ageingNote(at(25))).toBeNull();
    const n = ageingNote(at(40))!;
    expect(n).toContain('At 40');
    expect(n).toContain(`power and fingers ${Math.round((1 - ageMult(40, 'power')) * 100)}% down`);
    expect(n).toContain(`endurance ${Number(((1 - ageMult(40, 'endurance')) * 100).toFixed(1))}% down`);
    expect(n).toContain(`head and technique ${Math.round((ageMult(40, 'head') - 1) * 100)}% up`);
    expect(ageingNote(at(29))).toBe('At 29, the years have your head and technique 0.5% up.');
  });
});
