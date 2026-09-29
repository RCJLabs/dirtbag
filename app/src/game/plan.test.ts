// The day's plan: what you can plan where, bed always last, yesterday noted as played,
// and what storage hands back held to steps that exist.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newGame } from '../sim';
import {
  loadPlans,
  noted,
  planLine,
  savePlans,
  SLEEP,
  stepsAt,
  validSteps,
  wipePlans,
  withStep,
  type PlanStep,
} from './plan';

const s = newGame('plan');
const day: PlanStep[] = [
  { place: 'cafe', act: 'cafe.shift' },
  { place: 'road', climb: true },
  { place: 'lot', act: 'lot.cook' },
  { place: 'lot', act: 'lot.rest' },
  { place: 'lot', act: SLEEP },
];

describe('the plan', () => {
  it('offers the acts at a place, and climbing where there is something to climb', () => {
    expect(stepsAt(s, 'cafe').map((x) => x.act)).toEqual(['cafe.shift', 'cafe.double', 'cafe.coffee']);
    expect(stepsAt(s, 'road')).toEqual([{ place: 'road', climb: true }]);
    expect(stepsAt(s, 'gym')[0]).toEqual({ place: 'gym', climb: true });
    // No dog, no dog errands; and Scout picking you isn't something you plan.
    const lot = stepsAt(s, 'lot').map((x) => x.act);
    expect(lot).toContain(SLEEP);
    expect(lot).not.toContain('lot.kibble');
    expect(lot).not.toContain('lot.adopt');
    const withDog = { ...s, dog: { name: 'Scout', since: 1, fed: 60, bond: 0 } };
    expect(stepsAt(withDog, 'lot').map((x) => x.act)).toContain('lot.kibble');
  });

  it('keeps bed last', () => {
    const coffee = { place: 'diner', act: 'diner.coffee' };
    expect(withStep(day, coffee).at(-2)).toEqual(coffee);
    expect(withStep(day, coffee).at(-1)).toEqual({ place: 'lot', act: SLEEP });
    expect(withStep(day, { place: 'lot', act: SLEEP })).toBe(day);
    expect(withStep([], coffee)).toEqual([coffee]);
  });

  it('notes the day as played: each act, and a climb once a visit', () => {
    let today: PlanStep[] = [];
    today = noted(today, { place: 'cafe', act: 'cafe.shift' });
    for (let go = 0; go < 3; go++) today = noted(today, { place: 'road', climb: true });
    today = noted(today, { place: 'lot', act: 'lot.cook' });
    expect(today).toEqual(day.slice(0, 3));
  });

  it('says where it goes', () => {
    expect(planLine(day)).toBe('Coffee Shop, Roadside Crag, then The Lot');
    expect(planLine([{ place: 'gym', climb: true }])).toBe('Send City');
  });

  it('reads back only steps that exist, and nothing after bed', () => {
    expect(validSteps(day)).toEqual(day);
    expect(
      validSteps([
        { place: 'nowhere', act: 'x' },
        { place: 'cafe', act: 'diner.meal' },
        { place: 'lot', climb: true },
        { place: 'lot', act: SLEEP },
        { place: 'cafe', act: 'cafe.shift' },
      ]),
    ).toEqual([{ place: 'lot', act: SLEEP }]);
    expect(validSteps('nonsense')).toEqual([]);
  });
});

describe('the plan beside the save', () => {
  let data: Map<string, string>;
  beforeEach(() => {
    data = new Map();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => data.set(k, v),
        removeItem: (k: string) => data.delete(k),
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the plan and yesterday, and forgets them on starting over', () => {
    expect(loadPlans()).toEqual({ plan: [], yesterday: [] });
    expect(savePlans({ plan: day.slice(0, 2), yesterday: day })).toBe(true);
    expect(loadPlans()).toEqual({ plan: day.slice(0, 2), yesterday: day });
    data.set('dirtbag.plan', '{not json');
    expect(loadPlans()).toEqual({ plan: [], yesterday: [] });
    savePlans({ plan: day, yesterday: [] });
    wipePlans();
    expect(loadPlans()).toEqual({ plan: [], yesterday: [] });
  });
});
