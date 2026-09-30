// Phase 22.5b: busking outside the café. Evan's call: it pays less than any job at first,
// more an hour than any job after hundreds of sets, and the crowds grow as you get better.
import { describe, expect, it } from 'vitest';
import { ACTS } from './content/places';
import { JOBS } from './content/jobs';
import { BUSK } from './dials';
import { buskBlocked, buskCrowd, buskHeads, buskRate, buskTips, guitarRank, guitarSkill } from './busk';
import { act, newGame } from './game';
import type { GameState } from './types';
import { skyOn } from './weather';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('busk'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  at: 'cafe',
  min: 12 * 60,
  cash: 20,
  energy: 60,
  ...over,
});
// A dry day, so the street's out.
const DRY = Array.from({ length: 40 }, (_, i) => i + 1).find((d) => skyOn('busk', d) !== 'rain')!;
const busk = (s: GameState, acc: number) => act(s, { t: 'busk', acc });
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

// Every job's pay an hour at its first rank and at its top, with its lowest tips.
const jobHours = Object.values(ACTS)
  .filter((a) => a.job && a.job.shifts === 1)
  .map((a) => {
    const j = JOBS[a.job!.id]!;
    const h = (a.cost.min ?? 60) / 60;
    const tips = j.tips?.[0] ?? 0;
    return {
      first: ((a.cost.cash ?? 0) + tips) / h,
      top: ((a.cost.cash ?? 0) + tips + j.raise * (j.ranks.length - 1)) / h,
    };
  });

describe('busking', () => {
  it('pays less than any job an hour at first, and more than any job after a few hundred sets', () => {
    expect(buskRate(0)).toBeLessThan(Math.min(...jobHours.map((j) => j.first)));
    const best = Math.max(...jobHours.map((j) => j.top));
    expect(buskRate(100)).toBeLessThan(best);
    expect(buskRate(300)).toBeGreaterThan(best);
  });

  it('takes hundreds of sets to get good, and clean sets count for more', () => {
    expect(guitarRank(0)).toBe('beginner');
    expect(guitarSkill(BUSK.learn)).toBeCloseTo(1 - Math.exp(-1));
    expect(guitarRank(400)).toBe('legend');
    const s = base({ day: DRY });
    expect(busk(s, 1).state.guitar).toBe(1);
    expect(busk(s, 0).state.guitar).toBe(BUSK.practice.floor);
  });

  it('draws bigger crowds as you get better', () => {
    const s = base({ day: DRY });
    expect(buskHeads({ ...s, guitar: 300 })).toBeGreaterThan(buskHeads(s) * 5);
  });

  it('pays the crowd times how clean it was, for an hour, once a day', () => {
    const s = base({ day: DRY, guitar: 150 });
    const r = busk(s, 0.75);
    expect(r.state.cash).toBe(20 + buskTips(s, 0.75));
    expect(buskTips(s, 1)).toBe(Math.round(buskRate(150) * buskCrowd(s)));
    expect(r.state.min).toBe(s.min + BUSK.min);
    expect(r.state.energy).toBe(60 - BUSK.energy);
    expect(lines(r)[0]).toMatch(/people stop to listen|One person stops|Nobody stops/);
    expect(busk(r.state, 1).events[0]).toMatchObject({ k: 'refused' });
  });

  it('only outside the café, by day, and not in the rain', () => {
    expect(buskBlocked(base({ day: DRY, at: 'diner' }))).toMatch(/Coffee Shop/);
    expect(buskBlocked(base({ day: DRY, min: 21 * 60 }))).toMatch(/quiet/);
    const wet = Array.from({ length: 60 }, (_, i) => i + 1).find((d) => skyOn('busk', d) === 'rain');
    if (wet) expect(buskBlocked(base({ day: wet }))).toMatch(/rain/);
    expect(busk(base({ day: DRY }), 1.5).events[0]).toMatchObject({ k: 'refused' });
  });

  it('says so when your playing earns a name', () => {
    // One clean set short of a busker's name.
    let sets = 0;
    while (guitarRank(sets + 1) === 'beginner') sets += 0.5;
    const r = busk(base({ day: DRY, guitar: sets }), 1);
    expect(lines(r).some((l) => /started stopping to listen/.test(l))).toBe(true);
  });
});
