// Phase 23.2: where you came from and what's in you. An origin's numbers reach every price
// and gain through identity.ts, so what the screen says is what's charged; talents are dealt
// on the seed, hidden, and show once a skill has come on far enough to notice.
import { describe, expect, it } from 'vitest';
import { injuryChance } from './body';
import { ACTS } from './content/places';
import { CAME_ACROSS, ORIGINS } from './content/origins';
import { STARTS } from './climber';
import { TALENTS } from './content/talents';
import { LIFESTYLE, LOAD, MONEY, PLANS, TALENT } from './dials';
import { weeklyBills } from './clinic';
import { act, actCost, newGame } from './game';
import { dealTalents, gainMult, originTerms, premiumOf, talentsShowing } from './identity';
import { livingTonight } from './jobs';
import type { GameState } from './types';

const made = (origin?: string, seed = 'who') =>
  act(newGame(seed), { t: 'create', name: 'Ash', start: 'allrounder', origin }).state;
const as = (origin: string | null, over: Partial<GameState> = {}): GameState => ({
  ...made(),
  origin,
  ...over,
});

describe('origins', () => {
  it('start you with their skills on top of your start’s, their cash, and their opening line', () => {
    const r = act(newGame('who'), { t: 'create', name: 'Ash', start: 'allrounder', origin: 'gymnast' });
    const base = STARTS.allrounder!.skills;
    const o = ORIGINS.gymnast!;
    expect(r.state.origin).toBe('gymnast');
    expect(r.state.climber.skills.power).toBe(base.power + o.skills.power!);
    expect(r.state.climber.skills.head).toBe(Math.max(1, base.head + o.skills.head!));
    expect(made('quit').cash).toBe(made().cash + ORIGINS.quit!.fx.cash!);
    expect(r.events.some((e) => e.k === 'line' && e.text === o.open)).toBe(true);
  });

  it('refuse one that isn’t there', () => {
    const r = act(newGame('who'), { t: 'create', name: 'Ash', start: 'allrounder', origin: 'astronaut' });
    expect(r.events[0]?.k).toBe('refused');
  });

  it('move a shift’s pay, and the shift pays what it said', () => {
    const shift = ACTS['cafe.shift']!;
    const plain = actCost(as(null), shift).cash!;
    expect(actCost(as('quit'), shift).cash).toBe(Math.round(plain * ORIGINS.quit!.fx.pay!));
    expect(actCost(as('trustfund'), shift).cash).toBe(Math.round(plain * ORIGINS.trustfund!.fx.pay!));
  });

  it('move what you buy, and nothing else that costs', () => {
    const buy = Object.values(ACTS).find((d) => d.gear && (d.cost.cash ?? 0) < 0)!;
    expect(actCost(as('trustfund'), buy).cash).toBe(Math.round(buy.cost.cash! * ORIGINS.trustfund!.fx.shop!));
    expect(actCost(as('quit'), buy).cash).toBe(buy.cost.cash);
  });

  it('move how much you learn, by where: the gym rat’s indoors and out, the gymnast’s sessions', () => {
    expect(gainMult(as('gymrat'), 'technique', 'in')).toBe(ORIGINS.gymrat!.fx.gainIn);
    expect(gainMult(as('gymrat'), 'technique', 'out')).toBe(ORIGINS.gymrat!.fx.gainOut);
    expect(gainMult(as('gymnast'), 'head', 'train')).toBe(ORIGINS.gymnast!.fx.gainTrain);
    expect(gainMult(as('gymnast'), 'head', 'in')).toBe(1);
    // Less spring: power and fingers only.
    expect(gainMult(as('late'), 'fingers', 'out')).toBe(ORIGINS.late!.fx.spring);
    expect(gainMult(as('late'), 'head', 'out')).toBe(1);
    expect(gainMult(as(null), 'power', 'in')).toBe(1);
  });

  it('move living, insurance and the week’s bills', () => {
    const rich = { cash: 1000 };
    expect(livingTonight(as('desert', rich), 0).cost).toBe(
      Math.round(LIFESTYLE[made().lifestyle].cost * ORIGINS.desert!.fx.living!),
    );
    expect(premiumOf(as('late'), 'full')).toBe(Math.round(PLANS.full.premium * ORIGINS.late!.fx.premium!));
    expect(weeklyBills(as('quit'))).toBe(weeklyBills(as(null)) + ORIGINS.quit!.fx.bill!);
    expect(weeklyBills(as(null))).toBe(MONEY.registration + MONEY.insurance);
  });

  it('say their terms from their numbers, each with a perk and a cost, counting its skills', () => {
    for (const o of Object.values(ORIGINS)) {
      const t = originTerms(o);
      const sk = Object.values(o.skills);
      expect(t.perks.length + sk.filter((v) => v > 0).length, o.name).toBeGreaterThan(0);
      expect(t.costs.length + sk.filter((v) => v < 0).length, o.name).toBeGreaterThan(0);
    }
    const q = originTerms(ORIGINS.quit!);
    expect(q.perks).toContain('Every shift pays 12% more.');
    expect(q.costs[0]).toContain(`$${ORIGINS.quit!.fx.bill} a week`);
    expect(originTerms(ORIGINS.trustfund!).perks).toContain('30% off everything you buy.');
  });

  it('a carried climber came across, with nothing dealt and no terms', () => {
    const s = as(CAME_ACROSS, { talents: { ids: [], known: [], from: made().climber.skills } });
    const shift = ACTS['cafe.shift']!;
    expect(actCost(s, shift).cash).toBe(actCost(as(null), shift).cash);
    expect(gainMult(s, 'power', 'out')).toBe(1);
  });
});

describe('talents', () => {
  it('deal one good and one bad, on the seed, only to a climber with an origin', () => {
    const ids = made('quit').talents.ids;
    expect(ids).toHaveLength(2);
    expect(TALENTS[ids[0]!]!.good).toBe(true);
    expect(TALENTS[ids[1]!]!.good).toBe(false);
    expect(dealTalents('who')).toEqual(ids);
    expect(made().talents.ids).toEqual([]);
    const seen = new Set(Array.from({ length: 40 }, (_, i) => dealTalents(`s${i}`).join()));
    expect(seen.size).toBeGreaterThan(5);
  });

  it('multiply what their skill learns, wherever', () => {
    const s = as(null, { talents: { ids: ['crimper', 'skittish'], known: [], from: made().climber.skills } });
    expect(gainMult(s, 'fingers', 'out')).toBe(TALENTS.crimper!.gain);
    expect(gainMult(s, 'head', 'train')).toBe(TALENTS.skittish!.gain);
    expect(gainMult(s, 'power', 'in')).toBe(1);
  });

  it('glass tendons tweak easier on crimps, and not on technical lines', () => {
    const base = as(null, { load: { acute: 60, chronic: 20, today: 0 } });
    const glass = { ...base, talents: { ...base.talents, ids: ['glass'] } };
    const p = (s: GameState, type: 'crimp' | 'technical') => injuryChance(s, { type }, LOAD.perGo, false);
    expect(p(base, 'crimp')).toBeGreaterThan(0);
    expect(p(glass, 'crimp')).toBeCloseTo(p(base, 'crimp') * TALENTS.glass!.injury!, 10);
    expect(p(glass, 'technical')).toBe(p(base, 'technical'));
  });

  it('stay hidden until the skill has come on far enough, then show once, with a note', () => {
    const s0 = made('quit');
    const id = s0.talents.ids[0]!;
    const k = TALENTS[id]!.skill;
    expect(talentsShowing(s0)).toEqual([]);
    const near = {
      ...s0,
      climber: {
        ...s0.climber,
        skills: { ...s0.climber.skills, [k]: s0.talents.from[k] + TALENT.reveal - 0.01 },
      },
    };
    expect(talentsShowing(near)).not.toContain(id);
    const there = {
      ...near,
      climber: {
        ...near.climber,
        skills: { ...near.climber.skills, [k]: s0.talents.from[k] + TALENT.reveal },
      },
    };
    expect(talentsShowing(there)).toContain(id);
    const r = act({ ...there, at: 'lot', min: 9 * 60 }, { t: 'act', act: 'lot.rest' });
    expect(r.state.talents.known).toContain(id);
    expect(talentsShowing(r.state)).not.toContain(id);
  });
});
