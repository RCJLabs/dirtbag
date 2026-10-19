// Phase 41: the valley's forecast. A call a day, tomorrow to five out, right nine times in ten
// tomorrow and six in ten at the last; how sure it is from the odds, said as a word; a place
// with its own sky its own calls; today's no call at all; and right as often as it says.
import { describe, expect, it } from 'vitest';
import { accuracy, callOn, forecastFrom } from './forecast';
import { forecastCalibration } from './harness';
import { CLIMB, FORECAST } from './dials';
import { conditions, fromSky, seasonOf, SEASON_DAYS, skyAt, skyOn } from './weather';

describe('Phase 41: the valley’s forecast', () => {
  it('comes true less often the further out it calls, in a straight line', () => {
    expect(accuracy(0)).toBe(1);
    expect(accuracy(1)).toBeCloseTo(FORECAST.near);
    expect(accuracy(FORECAST.days)).toBeCloseTo(FORECAST.far);
    const step = accuracy(1) - accuracy(2);
    for (let lead = 2; lead <= FORECAST.days; lead++)
      expect(accuracy(lead - 1) - accuracy(lead)).toBeCloseTo(step);
  });

  it('calls tomorrow to the last day it reaches, the same however often it’s asked', () => {
    const days = forecastFrom('fc', 10);
    expect(days.map((c) => c.day)).toEqual([11, 12, 13, 14, 15].slice(0, FORECAST.days));
    expect(forecastFrom('fc', 10)).toEqual(days);
    for (const c of days) {
      expect(c.word).toBe(c.sure >= FORECAST.likely ? 'likely' : 'maybe');
      expect(c.sure).toBeGreaterThan(0);
      expect(c.sure).toBeLessThanOrEqual(1);
    }
    // Today needs no call: it's the sky.
    expect(callOn('fc', 10, 10)).toEqual({ day: 10, sky: skyOn('fc', 10), sure: 1, word: null });
  });

  it('changes its mind about a day as the day comes closer, and is sure-er nearer', () => {
    let changed = 0;
    let nearer = 0;
    for (let d = 10; d < 200; d++) {
      const far = callOn('mind', d - FORECAST.days, d);
      const near = callOn('mind', d - 1, d);
      if (far.sky !== near.sky) changed++;
      if (near.word === 'likely') nearer++;
    }
    expect(changed).toBeGreaterThan(0);
    // Tomorrow's call says likely nearly always; five days out's hardly ever.
    expect(nearer).toBeGreaterThan(150);
  });

  it('never calls a sky the season doesn’t have', () => {
    // Winter has no hot days in the valley.
    for (let k = 0; k < 20; k++)
      for (let d = SEASON_DAYS + 1; d <= 2 * SEASON_DAYS; d++) {
        expect(seasonOf(d)).toBe('winter');
        for (let lead = 1; lead <= FORECAST.days; lead++)
          expect(callOn(`w-${k}`, d - lead, d).sky).not.toBe('hot');
      }
  });

  it('gives a place with its own sky its own calls, of its own sky', () => {
    let apart = 0;
    let right = 0;
    for (let d = 2; d < 300; d++) {
      const moon = callOn('own', d - 1, d, 'moon');
      if (moon.sky !== callOn('own', d - 1, d).sky) apart++;
      if (moon.sky === skyAt('own', d, 'moon')) right++;
      // Somewhere in the valley calls the valley's sky.
      expect(callOn('own', d - 1, d, 'road')).toEqual(callOn('own', d - 1, d));
    }
    expect(apart).toBeGreaterThan(50);
    expect(right / 298).toBeGreaterThan(FORECAST.near - 0.08);
  });

  it('comes true as often as it says, by how far out and by the word', () => {
    const cal = forecastCalibration(6, 112);
    for (const l of cal.byLead) {
      expect(Math.abs(l.right - accuracy(l.lead))).toBeLessThan(0.03);
      expect(Math.abs(l.right - l.said)).toBeLessThan(0.03);
    }
    expect(cal.byLead.map((l) => l.lead)).toEqual([1, 2, 3, 4, 5].slice(0, FORECAST.days));
    const word = Object.fromEntries(cal.byWord.map((w) => [w.word, w]));
    expect(word.likely!.right).toBeGreaterThanOrEqual(FORECAST.likely);
    expect(word.maybe!.right).toBeLessThan(FORECAST.likely);
    for (const w of cal.byWord) expect(Math.abs(w.right - w.said)).toBeLessThan(0.03);
  });

  it('reads a call the way the day itself is read: prime days widen every window', () => {
    expect(fromSky('prime', 'fair').windows).toBe(CLIMB.sky.prime);
    expect(fromSky('hot', null).windows).toBe(CLIMB.sky.hot);
    expect(fromSky('fair', 'rain')).toMatchObject({ seeping: true, windows: CLIMB.sky.seep });
    // The day itself, read the same way.
    for (let d = 2; d < 60; d++) {
      const c = conditions('read', d);
      expect(c).toEqual(fromSky(skyOn('read', d), skyOn('read', d - 1)));
    }
  });
});
