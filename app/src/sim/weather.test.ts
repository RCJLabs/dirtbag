import { describe, expect, it } from 'vitest';
import { whereIs, around } from './presence';
import { CLIMB } from './dials';
import { PLACES } from './content/places';
import { conditions, forecast, seasonOf, skyOn, sunOn, SEASON_DAYS, type Sky } from './weather';

const days = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('weather', () => {
  it('is a pure function of the seed and the day, and the first morning is always good', () => {
    for (const seed of ['a', 'b', 'test']) {
      expect(skyOn(seed, 1)).toBe('prime');
      expect(days(60).map((d) => skyOn(seed, d))).toEqual(days(60).map((d) => skyOn(seed, d)));
    }
    expect(days(60).map((d) => skyOn('a', d))).not.toEqual(days(60).map((d) => skyOn('b', d)));
    expect(forecast('a', 5)).toEqual([skyOn('a', 5), skyOn('a', 6), skyOn('a', 7)]);
  });

  it("follows v0.956's seasons: fall first, rainy winters, hot summers", () => {
    expect(seasonOf(1)).toBe('fall');
    expect(seasonOf(SEASON_DAYS + 1)).toBe('winter');
    expect(seasonOf(4 * SEASON_DAYS + 1)).toBe('fall');
    // Over many years of days, each season's mix comes out near its weights.
    const count = (season: number, sky: Sky) => {
      let n = 0;
      let all = 0;
      for (let y = 0; y < 40; y++)
        for (let d = 1; d <= SEASON_DAYS; d++) {
          const day = y * 4 * SEASON_DAYS + season * SEASON_DAYS + d + 1;
          all++;
          if (skyOn('stats', day) === sky) n++;
        }
      return n / all;
    };
    expect(count(1, 'rain')).toBeGreaterThan(0.4); // winter: 50%
    expect(count(1, 'hot')).toBe(0);
    expect(count(3, 'hot')).toBeGreaterThan(0.35); // summer: 45%
    expect(count(0, 'prime')).toBeGreaterThan(0.35); // fall: 45%
  });

  it('closes the crag in rain, seeps it the day after, and greases it by the afternoon', () => {
    const rain = days(60).find(
      (d) => d > 1 && skyOn('test', d) === 'rain' && skyOn('test', d + 1) !== 'rain',
    )!;
    expect(conditions('test', rain)).toMatchObject({ open: false, sky: 'rain' });
    const after = conditions('test', rain + 1);
    expect(after).toMatchObject({ open: true, seeping: true });
    // A prime day's sun is halfway across the wall at 3 PM.
    expect(conditions('test', 1)).toEqual({
      sky: 'prime',
      open: true,
      greaseFrom: 15 * 60 - CLIMB.sunSweep / 2,
      windows: 1.1,
      seeping: false,
    });
  });

  it('sends the sun across Roadside one line at a time, the projects first', () => {
    const path = PLACES.road!.sun!;
    const start = conditions('test', 1).greaseFrom;
    const times = path.map((id) => sunOn('test', 1, 'road', id));
    expect(times[0]).toBe(start);
    expect(times.at(-1)).toBe(start + CLIMB.sunSweep);
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1]!);
    // Halfway along the path, halfway across the sweep: where the single sun time used to be.
    expect(sunOn('test', 1, 'road', path[(path.length - 1) / 2]!)).toBe(15 * 60);
    // The Gorge is in the shade all day, and a line off the path takes the sun with the wall.
    expect(sunOn('test', 1, 'gorge', 'gslab')).toBe(24 * 60);
    expect(sunOn('test', 1, 'road', 'nope')).toBe(start);
  });
});

describe('where people are', () => {
  it('Hazel is at the fire mornings and nights, and at the crag on dry days', () => {
    expect(whereIs('t', 'hazel', 1, 7 * 60 + 40)).toBe('lot');
    expect(whereIs('t', 'hazel', 1, 9 * 60)).toBe('road');
    expect(whereIs('t', 'hazel', 1, 17 * 60)).toBe('lot');
    const rain = days(60).find((d) => skyOn('t', d) === 'rain')!;
    expect(whereIs('t', 'hazel', rain, 9 * 60)).toBe('lot');
  });

  it('Sage turns up about half the days, always at the gym on day two, never at the crag in rain', () => {
    expect(whereIs('t', 'sage', 1, 10 * 60)).toBeNull();
    expect(whereIs('t', 'sage', 2, 10 * 60)).toBe('gym');
    expect(whereIs('t', 'sage', 2, 8 * 60)).toBeNull();
    expect(around('t', 'gym', 2, 10 * 60)).toEqual(['sage']);
    let seen = 0;
    for (let d = 3; d < 203; d++) {
      const at = whereIs('t', 'sage', d, 10 * 60);
      if (at) seen++;
      if (skyOn('t', d) === 'rain') expect(at === null || at === 'gym').toBe(true);
    }
    expect(seen).toBeGreaterThan(90);
    expect(seen).toBeLessThan(130);
  });
});
