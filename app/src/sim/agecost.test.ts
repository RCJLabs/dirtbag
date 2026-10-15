// Phase 30.2 (Evan's calls: slower to recover and heal, not likelier to get hurt; insurance
// priced by age). Two climbers alike in all but their years, on the same night: the older gets
// less back, stays hurt longer, and pays more for the same plan.
import { describe, expect, it } from 'vitest';
import { ageCost, ageOf, ageingNote, healDays } from './ageing';
import { injuryChance, rollInjury } from './body';
import { premiumOf, weeklyBills } from './clinic';
import { AGE, AGE_COST, MONEY, PLANS } from './dials';
import { act, newGame } from './game';
import { tonight } from './tonight';
import type { GameState } from './types';

const D = 40;
// The same climber on the same day, `age` years old: the clock's held days set the age, so the
// night's weather, rolls and bills are the same.
const at = (age: number): GameState => {
  const s = act(newGame('agecost'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  const t = { ...s, day: D, at: 'lot', min: 22 * 60, energy: 10, skin: 20, fed: 90 };
  const held = D - 1 - (age - AGE.start) * AGE.days;
  return { ...t, life: { ...t.life, held } };
};
const sleep = (s: GameState) => {
  let r = act(s, { t: 'act', act: 'lot.sleep' });
  if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
  return r.state;
};

describe('the years’ costs', () => {
  it('start at their own ages and grow by the dials', () => {
    expect(ageOf(at(25))).toBe(25);
    expect(ageOf(at(45))).toBe(45);
    for (const k of Object.keys(AGE_COST) as (keyof typeof AGE_COST)[]) {
      expect(ageCost(at(AGE_COST[k].from), k)).toBe(1);
      expect(ageCost(at(45), k)).toBeCloseTo(1 + AGE_COST[k].a * (45 - AGE_COST[k].from), 6);
    }
    expect(ageCost(at(45), 'recover')).toBeCloseTo(0.85, 6);
    expect(ageCost(at(45), 'heal')).toBeCloseTo(1.3, 6);
    expect(ageCost(at(45), 'premium')).toBeCloseTo(1.45, 6);
  });
});

describe('a night', () => {
  it('gives an older climber back less energy and skin, as the evening said it would', () => {
    const young = at(25);
    const old = at(45);
    const y = sleep(young);
    const o = sleep(old);
    const gy = y.energy - young.energy;
    const go = o.energy - old.energy;
    expect(go).toBeLessThan(gy);
    expect(go).toBe(Math.round(gy * ageCost({ ...old, day: D + 1 }, 'recover')));
    expect(o.skin - old.skin).toBeLessThan(y.skin - young.skin);
    expect(tonight(old).energy).toBe(go);
    expect(tonight(old).skin).toBe(o.skin - old.skin);
  });
});

describe('an injury', () => {
  it('is no likelier with the years, and lasts longer from 35', () => {
    // A spiked week, well over the risk line.
    const spiked = { acute: 400, chronic: 100, today: 0 };
    const young = { ...at(25), load: spiked };
    const old = { ...at(45), load: spiked };
    const r = { type: 'crimp' as const };
    expect(injuryChance(old, r, 400, true)).toBe(injuryChance(young, r, 400, true));
    const n = Array.from({ length: 400 }, (_, i) => i).find((i) => rollInjury(young, r, 400, true, i))!;
    expect(n).toBeDefined();
    const y = rollInjury(young, r, 400, true, n)!;
    const o = rollInjury(old, r, 400, true, n)!;
    expect(o.tier).toBe(y.tier);
    expect(o.until - D - 1).toBe(healDays(old, y.until - D - 1));
    expect(healDays(at(34), 10)).toBe(10);
    expect(healDays(at(45), 10)).toBe(13);
  });
});

describe('insurance', () => {
  it('costs more each year from 30, for the same cover', () => {
    expect(premiumOf(at(29), 'catastrophic')).toBe(PLANS.catastrophic.premium);
    expect(premiumOf(at(45), 'catastrophic')).toBe(Math.round(PLANS.catastrophic.premium * 1.45));
    expect(premiumOf(at(45), 'full')).toBe(Math.round(PLANS.full.premium * 1.45));
    expect(premiumOf(at(45), 'none')).toBe(0);
    expect(weeklyBills(at(45)) - weeklyBills(at(25))).toBe(
      premiumOf(at(45), 'catastrophic') - premiumOf(at(25), 'catastrophic'),
    );
    expect(MONEY.insurance).toBe(PLANS.catastrophic.premium);
  });
});

describe('the You page', () => {
  it('says what a night and an injury cost, once they do', () => {
    expect(ageingNote(at(31))).not.toContain('injury');
    expect(ageingNote(at(31))).toContain('A night gives back 1% less');
    expect(ageingNote(at(45))).toContain('A night gives back 15% less, and an injury lasts 30% longer.');
  });
});
