// Phase 40: "What now?" from Hazel. Her moves come from the state: what's pressing first, then
// the story's next goal, then what's good today; three at most, never two to one place; every
// fact in a reason is the state's (criterion 1); the button asks through Act I's mornings.
import { describe, expect, it } from 'vitest';
import { weeklyBills } from './clinic';
import { needFor } from './climber';
import { PEOPLE } from './content/people';
import { ACTS, PLACES } from './content/places';
import { ROUTES } from './content/routes';
import { WHAT_NOW } from './content/whatnow';
import { CLIMB, WHATNOW } from './dials';
import { dayName, duration, money } from './format';
import { actCost, newGame } from './game';
import { whereNow } from './presence';
import { currentGoal, goalDesc } from './story';
import { conditionsAt } from './weather';
import { shiftNow, whatNow, whatNowLit } from './whatnow';
import type { GameState } from './types';

const at = (over: Partial<GameState> = {}): GameState => {
  const k = needFor(3);
  return {
    ...newGame('whatnow'),
    climber: {
      name: 'Test',
      start: 'allrounder',
      skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
    },
    at: 'lot',
    x: null,
    min: 8 * 60,
    energy: 90,
    skin: 90,
    fed: 80,
    ...over,
  };
};
// A day, from `from`, when `want` holds.
function find(want: (s: GameState) => boolean, over: Partial<GameState> = {}, from = 2): GameState {
  for (let d = from; d < 400; d++) {
    const s = at({ day: d, ...over });
    if (want(s)) return s;
  }
  throw new Error('no such day');
}

describe('Phase 40: “What now?” from Hazel', () => {
  it('puts what’s pressing first, each reason from the state', () => {
    const hurt = at({ day: 3, injury: { kind: 'tweaked ring finger', tier: 1, until: 6 } });
    expect(whatNow(hurt)[0]).toMatchObject({ to: { k: 'place', id: 'clinic' }, kind: 'need' });
    expect(whatNow(hurt)[0]!.why).toContain('tweaked ring finger');
    const spent = at({ day: 3, energy: CLIMB.minEnergy - 1 });
    expect(whatNow(spent)[0]).toMatchObject({ to: { k: 'place', id: 'lot' }, label: WHAT_NOW.spent.label });
    // The bills tomorrow, and not the money for them: a shift, with the bill, the cash and the day.
    const short = find((s) => s.day % 7 === 6 && !!shiftNow(s), { cash: 3 });
    const first = whatNow(short)[0]!;
    expect(first.kind).toBe('need');
    expect(first.to).toEqual({ k: 'place', id: shiftNow(short)!.place });
    expect(first.why).toContain(money(weeklyBills(short)));
    expect(first.why).toContain(money(short.cash));
    expect(first.why).toContain(dayName(short.day + 1));
    // Covered, or a week off: not pressing.
    expect(whatNow({ ...short, cash: weeklyBills(short) }).some((m) => m.kind === 'need')).toBe(false);
    expect(
      whatNow({ ...short, day: short.day - WHATNOW.billsWithin - 1 }).some((m) => m.kind === 'need'),
    ).toBe(false);
  });

  it('sends you after the story’s next goal, in its own words', () => {
    // Send three lines anywhere: at the gym, the easiest one there you haven't sent.
    const s = at({ day: 2, goals: 1, at: 'gym', today: ['gym-pass'] });
    const g = currentGoal(s)!;
    expect('sends' in g.aim).toBe(true);
    const m = whatNow(s).find((x) => x.kind === 'story')!;
    expect(m.why).toContain(goalDesc(g, s));
    expect(m.to.k).toBe('line');
    // From the Lot, the gym.
    const lot = whatNow(at({ day: 2, goals: 1 })).find((x) => x.kind === 'story')!;
    expect(lot.to).toEqual({ k: 'place', id: 'gym' });
    // Two outside: Roadside.
    const out = whatNow(at({ day: 2, goals: 2 })).find((x) => x.kind === 'story')!;
    expect(out.to).toEqual({ k: 'place', id: 'road' });
    expect(out.why).toContain(goalDesc(currentGoal(at({ day: 2, goals: 2 }))!, s));
    // A Regular: the friend you're closest to, where they are now (Sage's out from late morning).
    const sage = { bond: 3, last: 0, since: 1 } as GameState['people'][string];
    const reg = find((x) => !!whereNow(x, 'sage') && whereNow(x, 'sage') !== 'lot', {
      goals: 3,
      min: 11 * 60,
      people: { sage },
    });
    const pm = whatNow(reg).find((x) => x.kind === 'story')!;
    expect(pm.to).toEqual({ k: 'place', id: whereNow(reg, 'sage') });
    expect(pm.label).toContain(PEOPLE.sage!.name);
    expect(pm.why).toContain(PLACES[whereNow(reg, 'sage')!]!.name);
  });

  it('fills the rest with what’s good today: a friend about, a crag in prime shape, a line nearly had', () => {
    // A line you came off a move from the top of, here.
    const warm = ROUTES.warm!;
    const near = at({
      day: 2,
      at: 'road',
      today: ['crag'],
      routes: {
        warm: {
          known: [],
          told: [],
          pick: {},
          falls: {},
          goes: 2,
          goesToday: 0,
          hi: warm.moves - 1,
          sent: null,
          sentToday: false,
        },
      },
    });
    const close = whatNow(near).find((m) => m.kind === 'chance' && m.to.k === 'line');
    expect(close?.to).toEqual({ k: 'line', route: 'warm' });
    expect(close!.why).toContain(warm.name);
    // A prime day at a crag that'll have you, somewhere else.
    const prime = find(
      (s) => conditionsAt(s.seed, s.day, 'road').sky === 'prime' && conditionsAt(s.seed, s.day, 'road').open,
    );
    const pm = whatNow(prime).find((m) => m.kind === 'chance' && m.to.k === 'place' && m.to.id === 'road');
    expect(pm?.why).toContain(PLACES.road!.name);
  });

  it('offers a shift you’re signed up for first, with its pay and hours from the act', () => {
    const s = at({ day: 1, min: 7 * 60 + 40, shifts: [{ job: 'cafe', day: 1 }] });
    expect(shiftNow(s)?.place).toBe('cafe');
    const m = whatNow({ ...s, goals: 5 }).find((x) => x.label.includes(PLACES.cafe!.name))!;
    expect(m.kind).toBe('chance');
    expect(m.why).toContain(money(actCost(s, ACTS['cafe.shift']!).cash!));
    expect(m.why).toContain(duration(actCost(s, ACTS['cafe.shift']!).min!));
  });

  it('gives three at most, needs then the story then chances, never two to one place', () => {
    for (let d = 2; d < 60; d++) {
      const s = at({ day: d, cash: d % 3 ? 2 : 500, energy: d % 5 ? 90 : 1, goals: d % 5 });
      const ms = whatNow(s);
      expect(ms.length).toBeLessThanOrEqual(WHATNOW.moves);
      const order = ms.map((m) => ['need', 'story', 'chance'].indexOf(m.kind));
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      expect(new Set(ms.map((m) => JSON.stringify(m.to))).size).toBe(ms.length);
    }
  });

  it('asks through Act I’s mornings till it’s been asked, and waits after', () => {
    const s = at({ day: 4 });
    expect(whatNowLit(s, null)).toBe(true);
    expect(whatNowLit(s, 3)).toBe(true);
    expect(whatNowLit(s, 4)).toBe(false);
    expect(whatNowLit({ ...s, goals: 5 }, null)).toBe(false);
  });

  it('types in no facts: every number is the state’s', () => {
    const words = JSON.stringify(WHAT_NOW);
    expect(words).not.toMatch(/\d/);
    expect(words).not.toMatch(/'|\\"/);
    expect(words).not.toMatch(/ {2}/);
  });
});
