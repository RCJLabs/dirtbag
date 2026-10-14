// Phase 29.4: cooking a recipe at the van plays the beat panel. Cooked right, it's a good
// meal: more from the night's sleep and a lift to psyche inside the day's cap, as the fire
// is. Skipped, it's the plain meal it always was; ramen stays a tap.
import { describe, expect, it } from 'vitest';
import { COOK_BURNT, COOK_GOOD } from './content/food';
import { COOK, PSYCHE } from './dials';
import { act, newGame } from './game';
import { psycheDay } from './psyche';
import { nightAt } from './spots';
import type { GameState } from './types';

const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const base = (over: Partial<GameState> = {}): GameState => {
  const s = newGame('cook');
  return {
    ...s,
    day: 5,
    at: 'lot',
    min: 18 * 60,
    cash: 100,
    climber: {
      name: 'Kit',
      start: 'allrounder',
      skills: { power: 30, fingers: 30, endurance: 30, technique: 30, head: 30 },
    },
    gear: { ...s.gear, kitchen: 1 },
    pantry: { pasta: 2, greens: 2 },
    ...over,
  };
};
const beats = (x: number) => Array.from({ length: COOK.beats }, () => x);
const cook = (s: GameState, x: number | number[]) =>
  act(s, { t: 'act', act: 'lot.pasta', play: { cook: Array.isArray(x) ? x : beats(x) } });

describe('cooking on the beat', () => {
  it('skipped, is the plain meal it always was', () => {
    const r = act(base(), { t: 'act', act: 'lot.pasta' });
    expect(refused(r)).toBe(false);
    expect(r.state.today).not.toContain('meal-good');
    expect(r.state.pantry).toEqual({ pasta: 1, greens: 1 });
    expect(r.state.meals).toContain('pasta');
  });

  it('cooked right, is a good meal: a better night and a lift, inside the cap', () => {
    const s = base();
    const r = cook(s, 1);
    expect(refused(r)).toBe(false);
    expect(r.state.today).toContain('meal-good');
    expect(lines(r)).toContain(COOK_GOOD);
    expect(r.state.pantry).toEqual({ pasta: 1, greens: 1 });
    expect(nightAt(r.state).energy - nightAt(s).energy).toBe(COOK.energy);
    expect(psycheDay(r.state).up).toContain('a good meal');
    expect(psycheDay(r.state).delta - psycheDay(s).delta).toBe(PSYCHE.meal);
    // Twice a day is still one good meal.
    const again = cook({ ...r.state, min: 19 * 60 }, 1);
    expect(again.state.today.filter((f) => f === 'meal-good')).toHaveLength(1);
  });

  it('scorched, is still dinner, and only that', () => {
    const r = cook(base(), 0);
    expect(refused(r)).toBe(false);
    expect(lines(r)).toContain(COOK_BURNT);
    expect(r.state.today).not.toContain('meal-good');
    // In between, nothing more to say.
    const so = cook(base(), 0.5);
    expect(lines(so).some((l) => l === COOK_GOOD || l === COOK_BURNT)).toBe(false);
  });

  it('is for a recipe, played whole', () => {
    expect(refused(cook(base(), [1, 1]))).toBe(true);
    expect(refused(cook(base(), beats(2)))).toBe(true);
    expect(refused(act(base(), { t: 'act', act: 'lot.cook', play: { cook: beats(1) } }))).toBe(true);
  });
});
