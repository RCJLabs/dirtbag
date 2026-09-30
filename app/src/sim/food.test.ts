// Phase 22.3: food. The market fills the pantry, the camp kitchen turns it into meals, a meal
// that fuels you widens the day's windows (never a skill), the last few meals are counted
// for variety, coffee crashes past two, and a hungry bedtime eats the pantry first.
import { describe, expect, it } from 'vitest';
import { dayFactor } from './climb';
import { INGREDIENTS, RECIPES } from './content/food';
import { ACTS } from './content/places';
import { routeById } from './content/gym';
import { BODY, FOOD } from './dials';
import { act, actCost, newGame } from './game';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('food'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 200,
  min: 8 * 60,
  ...over,
});
const full = Object.fromEntries(Object.keys(INGREDIENTS).map((k) => [k, 4]));
const why = (s: GameState, id: string) => {
  const e = act(s, { t: 'act', act: id }).events[0];
  return e?.k === 'refused' ? e.why : null;
};

describe('food', () => {
  it('fills the pantry at the market, a pack at a time', () => {
    const s = base({ at: 'market' });
    const r = act(s, { t: 'act', act: 'market.rice' }).state;
    expect(r.pantry.rice).toBe(INGREDIENTS.rice!.servings);
    expect(r.cash).toBe(200 - INGREDIENTS.rice!.price);
  });

  it('cooks only with the kitchen and the ingredients, and uses a serving of each', () => {
    expect(why(base({ pantry: full }), 'lot.ricebeans')).toMatch(/camp kitchen/);
    expect(why(base({ gear: { kitchen: 1 } }), 'lot.ricebeans')).toMatch(/No rice/);
    const s = base({ gear: { kitchen: 1 }, pantry: full, fed: 20 });
    const r = act(s, { t: 'act', act: 'lot.ricebeans' }).state;
    expect(r.pantry.rice).toBe(3);
    expect(r.pantry.beans).toBe(3);
    expect(r.fed).toBe(20 + RECIPES.ricebeans!.fed);
    expect(r.meals).toEqual(['ricebeans']);
    expect(r.fueled).toBe(0);
  });

  it('fuels you for the day with the right meal: wider windows, no skill', () => {
    const s = base({ gear: { kitchen: 1 }, pantry: full });
    const r = act(s, { t: 'act', act: 'lot.burritos' }).state;
    expect(r.fueled).toBe(r.day);
    expect(r.climber.skills).toEqual(s.climber.skills);
    const route = routeById(s.seed, 'warm')!;
    expect(dayFactor(r, route).windows / dayFactor(s, route).windows).toBeCloseTo(FOOD.fueled);
    expect(dayFactor({ ...r, day: r.day + 1 }, route).windows).toBeCloseTo(
      dayFactor({ ...s, day: s.day + 1 }, route).windows,
    );
  });

  it('remembers the last few meals, ramen and the special too', () => {
    let s = base({ cash: 200 });
    for (let n = 0; n < FOOD.same + 2; n++) s = act({ ...s, fed: 10 }, { t: 'act', act: 'lot.cook' }).state;
    expect(s.meals).toEqual(Array(FOOD.same).fill('ramen'));
  });

  it('crashes you past a couple of coffees a day', () => {
    let s = base({ at: 'cafe', energy: 50 });
    for (let n = 0; n < FOOD.coffees; n++) s = act(s, { t: 'act', act: 'cafe.coffee' }).state;
    expect(s.energy).toBe(50 + FOOD.coffees * ACTS['cafe.coffee']!.cost.energy!);
    expect(actCost(s, ACTS['cafe.coffee']!).energy).toBe(FOOD.crash);
    const r = act(s, { t: 'act', act: 'cafe.coffee' });
    expect(r.state.energy).toBe(s.energy + FOOD.crash);
  });

  it('eats the pantry cold before bed when you’re going to bed hungry', () => {
    const s = base({ min: 21 * 60, fed: 2, pantry: { oats: 3 } });
    const r = act(s, { t: 'act', act: 'lot.sleep' });
    expect(r.state.pantry.oats).toBe(3 - FOOD.coldMax);
    expect(r.state.fed).toBe(2 + FOOD.coldMax * FOOD.cold - BODY.nightFed);
    expect(r.events.some((e) => e.k === 'line' && /from the pantry/.test(e.text))).toBe(true);
  });
});
