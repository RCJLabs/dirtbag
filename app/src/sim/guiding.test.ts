// Phase 25.2: guiding. A day's clients, a line each, scored against the best the day allowed;
// not solved by any one rule (criterion 3, as Phase 18's jobs); and an outfit of your own.
import { describe, expect, it } from 'vitest';
import { ACTS } from './content/places';
import { ROUTES } from './content/routes';
import { JOBS } from './content/jobs';
import { GUIDING } from './dials';
import { act, actCost, newGame } from './game';
import { isPosted } from './jobs';
import {
  bestPlan,
  guestsToday,
  guestValue,
  guideCragLines,
  outfitBlocked,
  planRefused,
  planValue,
  type Guest,
} from './guiding';
import type { GameState } from './types';
import { playBonus } from './work';

const strong = { power: 400, fingers: 400, endurance: 400, technique: 400, head: 400 };
const base = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('guiding'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return {
    ...s,
    at: 'shop',
    min: 8 * 60,
    energy: 100,
    cash: 5000,
    climber: { ...s.climber, skills: strong },
    shifts: [{ job: 'guide', day: s.day }],
    ...over,
  };
};
const lead = (over: Partial<GameState> = {}) => base({ jobs: { guide: JOBS.guide!.at.at(-1)! }, ...over });
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';

// A plan by a fixed rule, one rope to a line: each client the free line nearest `want(g)`.
function byRule(guests: Guest[], want: (g: Guest) => number): string[] {
  const used = new Set<string>();
  return guests.map((g) => {
    const r = guideCragLines()
      .filter((x) => !used.has(x.id))
      .sort((a, b) => Math.abs(a.grade - want(g)) - Math.abs(b.grade - want(g)))[0]!;
    used.add(r.id);
    return r.id;
  });
}

describe('a guiding day', () => {
  it('brings the same clients on a reload, more of them as you rise', () => {
    expect(guestsToday(base())).toEqual(guestsToday(base()));
    expect(guestsToday(base())).toHaveLength(GUIDING.clients[0]!);
    expect(guestsToday(lead())).toHaveLength(GUIDING.clients.at(-1)!);
    for (const g of guestsToday(lead())) expect(g.goal - g.level).toBeGreaterThanOrEqual(1);
  });

  it('bores a client on a line too easy, frightens one past their goal, and pays their goal best', () => {
    const g: Guest = { name: 'Gwen', level: 3, goal: 4, nervous: false };
    expect(guestValue(g, 0)).toBe(GUIDING.bored);
    expect(guestValue(g, 6)).toBe(GUIDING.scared);
    expect(guestValue({ ...g, nervous: true }, 6)).toBe(0);
    expect(guestValue(g, 3)).toBe(1);
    // At their goal, worth more than a good day only if they can likely send it.
    expect(guestValue({ ...g, level: 4, goal: 5 }, 5)).toBeGreaterThan(
      guestValue({ ...g, level: 3, goal: 5 }, 5),
    );
    expect(guestValue({ ...g, nervous: true }, 4)).toBeLessThan(guestValue(g, 4));
  });

  it('wants a line each, one rope to a line, at the crag', () => {
    const guests = guestsToday(base());
    const ids = guideCragLines().map((r) => r.id);
    expect(planRefused(guests, ids.slice(0, guests.length - 1))).toMatch(/each/);
    expect(
      planRefused(
        guests,
        guests.map(() => ids[0]!),
      ),
    ).toMatch(/One rope/);
    expect(
      planRefused(
        guests,
        guests.map((_, i) => (i ? ids[i]! : 'cmyth')),
      ),
    ).toMatch(/line you guide/);
    expect(planRefused(guests, bestPlan(guests).ids)).toBeNull();
  });

  it('pays the day, and more for a good day, played from the shop', () => {
    const day = Array.from({ length: 14 }, (_, i) => i + 1).find((d) => isPosted('guiding', 'guide', d))!;
    const s = base({ day, shifts: [{ job: 'guide', day }] });
    const guests = guestsToday(s);
    const top = bestPlan(guests);
    const worked = act(s, { t: 'act', act: 'shop.guide' });
    const played = act(s, { t: 'act', act: 'shop.guide', play: { guide: top.ids } });
    expect(refused(worked)).toBe(false);
    const pay = actCost(s, ACTS['shop.guide']!).cash!;
    expect(played.state.cash - worked.state.cash).toBe(playBonus(pay, 1, GUIDING.from));
    expect(played.state.jobs.guide).toBe(1);
    expect(
      refused(
        act(
          {
            ...s,
            climber: {
              ...s.climber,
              skills: { ...strong, power: 0, fingers: 0, endurance: 0, technique: 0, head: 0 },
            },
          },
          { t: 'act', act: 'shop.guide' },
        ),
      ),
    ).toBe(true);
  });

  it('isn’t solved: the best plan moves with the clients, and no fixed rule gets close (criterion 3)', () => {
    const rules: [string, (g: Guest) => number][] = [
      ['their goal', (g) => g.goal],
      ['their level', (g) => g.level],
      ['a grade under the goal', (g) => g.goal - 1],
    ];
    const days = Array.from({ length: 60 }, (_, d) => lead({ day: d + 1 }));
    const bests = new Set(days.map((s) => bestPlan(guestsToday(s)).ids.join()));
    expect(bests.size).toBeGreaterThan(20);
    for (const [, want] of rules) {
      const share =
        days.reduce((a, s) => {
          const g = guestsToday(s);
          return a + planValue(g, byRule(g, want)) / bestPlan(g).value;
        }, 0) / days.length;
      expect(share).toBeLessThan(0.95);
    }
  });
});

describe('your own outfit', () => {
  it('opens to lead guides with the money, at the shop', () => {
    expect(outfitBlocked(base())).toMatch(/lead guides/);
    expect(outfitBlocked(lead({ cash: 10 }))).toMatch(/in hand/);
    const r = act(lead(), { t: 'outfit', do: 'start' });
    expect(r.state.outfit).toMatchObject({ guides: 1, till: 0 });
    expect(r.state.cash).toBe(5000 - GUIDING.outfit.price);
    expect(r.state.shifts.some((x) => x.job === 'guide')).toBe(false);
    expect(refused(act({ ...lead(), at: 'lot' }, { t: 'outfit', do: 'start' }))).toBe(true);
  });

  it('takes on guides to the permit’s limit, draws its till, and sells', () => {
    let s = act(lead(), { t: 'outfit', do: 'start' }).state;
    for (let i = 1; i < GUIDING.outfit.guides; i++) s = act(s, { t: 'outfit', do: 'hire' }).state;
    expect(s.outfit!.guides).toBe(GUIDING.outfit.guides);
    expect(refused(act(s, { t: 'outfit', do: 'hire' }))).toBe(true);
    s = { ...s, outfit: { ...s.outfit!, till: 400 } };
    const drawn = act(s, { t: 'outfit', do: 'draw' });
    expect(drawn.state.cash).toBe(s.cash + 400);
    const sold = act(s, { t: 'outfit', do: 'sell' });
    expect(sold.state.outfit).toBeNull();
    expect(sold.state.cash).toBe(s.cash + Math.round(GUIDING.outfit.price * GUIDING.outfit.resale + 400));
  });

  it('earns on an open day and pays the insurance on a shut one', () => {
    const s = act(lead(), { t: 'outfit', do: 'start' }).state;
    let r = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
    if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
    const net = r.state.outfit!.last;
    const O = GUIDING.outfit;
    expect([O.fee - O.wage - O.insurance, -O.insurance]).toContain(net);
    expect(ROUTES.warm).toBeDefined();
  });
});
