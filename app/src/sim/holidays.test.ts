// Phase 35.4: holiday nights (Evan's call). At the Lot on a holiday with your people about,
// a scene at the fire before bed: the potluck, the headlamp night, the opener's eve, the
// solstice fire; three ways to spend it, the first always open, and everyone there.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HOLIDAY_SCENES, HOLIDAYS } from './content/folks';
import { INGREDIENTS } from './content/food';
import { HOLIDAY } from './dials';
import { DISH, holidayBlocked, holidayDish, holidayNote, holidayScene } from './folks';
import { act, newGame } from './game';
import { fromSave } from './save';
import type { GameState, PersonLog } from './types';
import { seasonOf, type Season } from './weather';

const V75 = readFileSync(new URL('./fixtures/save-v75.json', import.meta.url), 'utf8');
const friend = (bond: number): PersonLog => ({ bond, last: 0, since: 2, talked: true });
// A holiday night at the Lot, Hazel and Rico there.
const eve = (n = 0, over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('holidays'), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  day: HOLIDAY.on[n]!,
  at: 'lot',
  min: 18 * 60,
  energy: 50,
  cash: 100,
  people: { hazel: friend(3), rico: friend(3) },
  ...over,
});
const scene = (s: GameState) => act(s, { t: 'act', act: 'lot.sleep' }).state;
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

describe('holiday nights', () => {
  it('are a scene at the fire on each of the four, with your people there, and not alone', () => {
    for (const [n, season] of (['fall', 'winter', 'spring', 'summer'] as Season[]).entries()) {
      const s = eve(n);
      expect(seasonOf(s.day)).toBe(season);
      expect(holidayScene(s)).toBe(season);
      expect(scene(s).encounter).toEqual({ kind: 'holiday', id: season });
    }
    // Nobody about, somewhere else, or not a holiday: no scene.
    expect(holidayScene(eve(0, { people: {} }))).toBeNull();
    expect(holidayScene(eve(0, { at: 'gorge' }))).toBeNull();
    expect(holidayScene(eve(0, { day: HOLIDAY.on[0]! + 1 }))).toBeNull();
  });

  it('offer three ways each, the first always open, in words with nothing typed in', () => {
    const broke = eve(0, { cash: 0, pantry: {} });
    for (const [season, sc] of Object.entries(HOLIDAY_SCENES)) {
      expect(sc.opts, season).toHaveLength(3);
      expect(holidayBlocked(broke, sc.opts[0]!.fx), season).toBeNull();
      for (const t of [
        HOLIDAYS[season as Season].name,
        sc.scene,
        ...sc.opts.flatMap((o) => [o.label, o.out]),
      ]) {
        expect(t, t).not.toMatch(/\d/);
        expect(t, t).not.toMatch(/'/);
      }
    }
  });

  it('spend the night as you choose, with everyone there: a day together and the bond', () => {
    const s = eve(1);
    const lamps = HOLIDAY_SCENES.winter.opts[2]!;
    const r = act(scene(s), { t: 'answer', opt: 2 });
    expect(lines(r)).toContain(lamps.out);
    for (const w of ['hazel', 'rico']) expect(r.state.people[w]!.bond).toBe(3 + 1 + lamps.fx.bond!);
    // The night's gone by: morning, and no card for it (the scene was the night).
    expect(r.state.day).toBe(s.day + 1);
    expect(r.state.encounter).toBeNull();
    expect(r.events.some((e) => e.k === 'holiday')).toBe(false);
  });

  it('bring a dish from the pantry to the potluck, two servings of what there is most of', () => {
    const s = eve(0, { pantry: { beans: 3, rice: 2, oats: 1 } });
    expect(holidayDish(s)).toEqual({ id: 'beans', name: INGREDIENTS.beans!.name });
    const dish = HOLIDAY_SCENES.fall.opts[1]!;
    expect(holidayNote(s, dish.fx)).toContain(`${DISH} beans from the pantry`);
    const r = act(scene(s), { t: 'answer', opt: 1 });
    expect(r.state.pantry.beans).toBe(3 - DISH);
    expect(lines(r).some((t) => t.startsWith('Your dish of beans goes first'))).toBe(true);
    // Nothing to make a dish of, or no money for cider: those ways are shut.
    const bare = eve(0, { pantry: { oats: 1 }, cash: 0 });
    expect(holidayBlocked(bare, dish.fx)).not.toBeNull();
    expect(holidayBlocked(bare, HOLIDAY_SCENES.fall.opts[2]!.fx)).not.toBeNull();
    expect(act(scene(bare), { t: 'answer', opt: 1 }).events[0]).toMatchObject({ k: 'refused' });
  });

  it('loads a real 0.999.73 save as it was', () => {
    const r = fromSave(V75);
    if (!r.ok) throw new Error(r.why);
    expect(r.from).toBe(75);
    expect(r.state).toEqual({
      ...JSON.parse(V75).state,
      sesh: null,
      seshFirsts: 0,
      vanPlan: expect.any(Object),
    });
  });
});
