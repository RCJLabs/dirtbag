// Phase 22.3b: the lake. Fishing is food, not cash, seeded by the day and hour, best at dawn
// and dusk and slim in winter, once a day; a swim gives a little back, not in winter. Neither
// out-earns a shift for its time.
import { describe, expect, it } from 'vitest';
import { ACTS } from './content/places';
import { LAKE } from './dials';
import { act, newGame } from './game';
import { biteOdds, fishCatch } from './lake';
import type { GameState } from './types';
import { seasonOf } from './weather';

const dayIn = (season: string) =>
  Array.from({ length: 60 }, (_, i) => i + 1).find((d) => seasonOf(d) === season)!;
const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('lake'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  at: 'lake',
  min: 12 * 60,
  fed: 20,
  ...over,
});

describe('the lake', () => {
  it('feeds you what bites, once a day, and never pays cash', () => {
    const s = base();
    const r = act(s, { t: 'act', act: 'lake.fish' }).state;
    expect(r.fed).toBe(20 + fishCatch(s) * LAKE.fish);
    expect(r.cash).toBe(s.cash);
    expect(r.min).toBe(s.min + 120);
    expect(act(r, { t: 'act', act: 'lake.fish' }).events[0]).toMatchObject({ k: 'refused' });
  });

  it('bites best at dawn and dusk, and least in winter', () => {
    const summer = dayIn('summer');
    expect(biteOdds(base({ day: summer, min: 7 * 60 }))).toBeGreaterThan(
      biteOdds(base({ day: summer, min: 12 * 60 })),
    );
    expect(biteOdds(base({ day: dayIn('winter') }))).toBeLessThan(biteOdds(base({ day: summer })));
  });

  it('catches the same for the same cast, and varies across the days', () => {
    const s = base();
    expect(fishCatch(s)).toBe(fishCatch({ ...s }));
    const catches = new Set(
      Array.from({ length: 30 }, (_, d) => fishCatch(base({ day: d + 1, min: 7 * 60 }))),
    );
    expect(catches.size).toBeGreaterThan(1);
  });

  it('is worth less than a shift for its time: at best a diner meal', () => {
    const best = LAKE.most * LAKE.fish;
    expect(best).toBeLessThanOrEqual(ACTS['diner.meal']!.cost.fed!);
  });

  it('lets you swim, but not in winter', () => {
    const r = act(base({ energy: 50 }), { t: 'act', act: 'lake.swim' }).state;
    expect(r.energy).toBe(50 + LAKE.swim.energy);
    expect(act(base({ day: dayIn('winter') }), { t: 'act', act: 'lake.swim' }).events[0]).toMatchObject({
      k: 'refused',
      why: expect.stringMatching(/ice/),
    });
  });
});
