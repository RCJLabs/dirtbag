import { describe, expect, it } from 'vitest';
import {
  gains,
  gradeOf,
  hi,
  levelOf,
  margin,
  mix,
  needFor,
  pumpFactor,
  STARTS,
  windowFactor,
  type GoSummary,
} from './climber';
import { OVER, WINDOW } from './dials';

const all = (n: number) => ({ power: n, fingers: n, endurance: n, technique: n, head: n });
const go = (o: Partial<GoSummary>): GoSummary => ({
  grade: 2,
  sent: true,
  progress: 1,
  type: 'crimp',
  styles: [],
  ...o,
});

describe('the climber', () => {
  it("reads v0.956's grade curve both ways", () => {
    for (let g = 0; g <= 18; g++) expect(levelOf(needFor(g))).toBeCloseTo(g, 9);
    expect(needFor(1)).toBeCloseTo(10.4);
    expect(needFor(3)).toBeCloseTo(45.6);
    expect(needFor(5)).toBeCloseTo(100);
    expect(gradeOf(all(needFor(3)))).toBe(3);
    expect(gradeOf(all(needFor(3) - 0.01))).toBe(2);
    expect(gradeOf(all(1e6))).toBe(18);
  });

  it('starts every archetype at V0, each ahead in its own styles', () => {
    for (const st of Object.values(STARTS)) expect(gradeOf(st.skills)).toBe(0);
    const { boulderer: b, technician: t, ropegun: r } = STARTS;
    expect(margin(b!.skills, 'power', 3)).toBeGreaterThan(margin(t!.skills, 'power', 3));
    expect(margin(t!.skills, 'technical', 3)).toBeGreaterThan(margin(b!.skills, 'technical', 3));
    // The rope gun pumps slowest.
    expect(pumpFactor(r!.skills, 4)).toBeLessThan(pumpFactor(b!.skills, 4));
  });

  it('mixes each style 65/35 from two skills', () => {
    const s = { power: 10, fingers: 20, endurance: 0, technique: 0, head: 0 };
    expect(mix(s, 'power')).toBeCloseTo(0.65 * 10 + 0.35 * 20);
    expect(mix(s, 'crimp')).toBeCloseTo(0.65 * 20);
    expect(mix(s, 'technical')).toBe(0);
  });

  it('widens windows below your level and narrows them above, within bounds', () => {
    expect(windowFactor(0)).toBe(1);
    expect(windowFactor(1)).toBeCloseTo(1.24);
    expect(windowFactor(10)).toBe(WINDOW.widest);
    // Over your level, the first grade takes the window to about 40%; past it each grade
    // closes it faster again; and at the limit it's shut.
    expect(windowFactor(-1)).toBeCloseTo(Math.exp(-WINDOW.harder));
    expect(windowFactor(-2) / windowFactor(-1)).toBeCloseTo(Math.exp(-WINDOW.harder - OVER.steeper));
    expect(windowFactor(-OVER.limit + 0.01)).toBeGreaterThan(0);
    expect(windowFactor(-OVER.limit)).toBe(0);
    expect(windowFactor(-10)).toBe(0);
    expect(pumpFactor(all(needFor(4)), 4)).toBeCloseTo(1);
    expect(pumpFactor(all(0), 18)).toBe(1.5);
  });

  it('teaches more for sends and for climbing above yourself, less as a skill grows', () => {
    const s = STARTS.allrounder!.skills;
    const send = gains(s, go({}));
    const fall = gains(s, go({ sent: false, progress: 0.5 }));
    // A V2 send at V0: (8 + 1.4·2) · (1 + 0.4·3), all of it to crimp's two skills.
    expect(send.fingers).toBeCloseTo(10.8 * 2.2 * hi(8), 1);
    expect(send.technique).toBeCloseTo((10.8 * 2.2 * hi(8)) / 2, 1);
    expect(Object.keys(send).sort()).toEqual(['fingers', 'technique']);
    expect(fall.fingers!).toBeLessThan(send.fingers!);
    const strong = { ...s, fingers: 80, technique: 80 };
    expect(gains(strong, go({ grade: 4 })).fingers!).toBeLessThan(gains(s, go({ grade: 4 })).fingers!);
    expect(hi(0)).toBe(1);
    expect(hi(40)).toBe(0.5);
  });

  it('splits a go 60/40 between the route and the sequences you tried', () => {
    const s = all(8);
    const plain = gains(s, go({ type: 'crimp' }));
    const mixed = gains(s, go({ type: 'crimp', styles: ['dyno'] }));
    expect(mixed.fingers).toBeCloseTo(plain.fingers! * 0.6, 1);
    // Dyno leans on power, then head.
    expect(mixed.power).toBeCloseTo(plain.fingers! * 0.4, 1);
    expect(mixed.head).toBeCloseTo((plain.fingers! * 0.4) / 2, 1);
  });
});
