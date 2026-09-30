// Phase 22.5a: the hustle. Cans for a few dollars, the bins after the market shuts, and the
// lake's shore: each once a day, seeded by the day, and none worth a shift an hour.
import { describe, expect, it } from 'vitest';
import { ACTS } from './content/places';
import { JOBS } from './content/jobs';
import { HUSTLE } from './dials';
import { act, newGame } from './game';
import { hustleTake } from './hustle';
import type { GameState } from './types';
import { seasonOf } from './weather';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('hustle'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 40,
  fed: 50,
  energy: 60,
  ...over,
});
const run = (s: GameState, id: string) => act(s, { t: 'act', act: id });
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';
const WINTER_DAY = Array.from({ length: 60 }, (_, i) => i + 1).find((d) => seasonOf(d) === 'winter')!;

describe('the hustle', () => {
  it('pays for cans, once a day and by day, the take fixed by the day', () => {
    const s = base({ min: 10 * 60 });
    const r = run(s, 'lot.cans');
    const take = hustleTake(s, 'cans');
    expect(take).toBeGreaterThanOrEqual(HUSTLE.cans.cash[0]);
    expect(take).toBeLessThanOrEqual(HUSTLE.cans.cash[1]);
    expect(r.state.cash).toBe(40 + take);
    expect(r.state.min).toBe(s.min + HUSTLE.cans.min);
    expect(refused(run(r.state, 'lot.cans'))).toBe(true);
    expect(refused(run(base({ min: 20 * 60 }), 'lot.cans'))).toBe(true);
  });

  it('feeds you from the bins after dark, most nights, and counts it as a meal', () => {
    expect(refused(run(base({ at: 'market', min: 12 * 60 }), 'market.bins'))).toBe(true);
    let hits = 0;
    for (let day = 1; day <= 60; day++) {
      const s = base({ at: 'market', min: 20 * 60, day });
      const take = hustleTake(s, 'bins');
      const r = run(s, 'market.bins');
      expect(r.state.fed).toBe(Math.min(100, 50 + take));
      if (take) {
        hits++;
        expect(take).toBeGreaterThanOrEqual(HUSTLE.bins.fed[0]);
        expect(r.state.meals.at(-1)).toBe('bins');
      } else expect(lines(r).some((l) => /got there first/.test(l))).toBe(true);
    }
    expect(hits / 60).toBeGreaterThan(HUSTLE.bins.odds - 0.2);
    expect(hits / 60).toBeLessThan(HUSTLE.bins.odds + 0.2);
  });

  it('feeds you from the shore, slim in winter', () => {
    const summer = base({ at: 'lake', min: 10 * 60, day: 2 });
    expect(run(summer, 'lake.forage').state.fed).toBe(50 + hustleTake(summer, 'forage'));
    const cold = base({ at: 'lake', min: 10 * 60, day: WINTER_DAY });
    expect(hustleTake(cold, 'forage')).toBeLessThanOrEqual(
      Math.round(HUSTLE.forage.fed[1] * HUSTLE.forage.winter),
    );
  });

  it('says where the net is the first time you’re hungry and broke, and only then', () => {
    const s = base({ cash: 5, fed: 30, min: 10 * 60 });
    const r = run(s, 'lot.rest');
    expect(lines(r).some((l) => /Hungry and broke/.test(l))).toBe(true);
    expect(r.state.seen).toContain('hustle');
    expect(lines(run(r.state, 'lot.cans')).some((l) => /Hungry and broke/.test(l))).toBe(false);
    expect(lines(run(base({ cash: 5, fed: 60 }), 'lot.rest')).some((l) => /Hungry/.test(l))).toBe(false);
  });

  it('never pays a shift’s worth an hour (Phase 22’s criterion 2)', () => {
    // The worst-paid shift an hour at its first rank, against the best a hustle could do. Food
    // is priced at the cheapest food money buys, ramen: what the bins save you.
    const shiftHour = Math.min(
      ...Object.values(ACTS)
        .filter((a) => a.job && a.job.shifts === 1)
        .map((a) => ((a.cost.cash ?? 0) + (JOBS[a.job!.id]!.tips?.[0] ?? 0)) / ((a.cost.min ?? 60) / 60)),
    );
    const ramen = ACTS['lot.cook']!.cost;
    const perFood = -(ramen.cash ?? 0) / (ramen.fed ?? 1);
    const cans = HUSTLE.cans.cash[1] / (HUSTLE.cans.min / 60);
    const bins = (HUSTLE.bins.fed[1] * perFood) / (HUSTLE.bins.min / 60);
    const forage = (HUSTLE.forage.fed[1] * perFood) / (HUSTLE.forage.min / 60);
    for (const h of [cans, bins, forage]) expect(h).toBeLessThan(shiftHour);
  });
});
