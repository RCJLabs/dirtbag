// Criterion 2 of Phase 13: every place has ambience.
import { describe, expect, it } from 'vitest';
import { newGame, PLACES, type GameState } from '../sim';
import { bedFor, QUIET } from './beds';

const loud = (b: ReturnType<typeof bedFor>) => Object.values(b).some((v) => v > 0);

describe('beds', () => {
  const s = newGame('beds');

  it('give every place a sound of its own', () => {
    for (const id of Object.keys(PLACES)) {
      expect(PLACES[id]!.ambience, id).toBeDefined();
      expect(loud(bedFor(s, id)), id).toBe(true);
    }
  });

  it('turn birds to crickets outdoors at night, and light the fire', () => {
    const day = bedFor({ ...s, min: 9 * 60 }, 'lot');
    const night = bedFor({ ...s, min: 21 * 60 }, 'lot');
    expect(day.birds).toBeGreaterThan(0);
    expect(night.birds).toBe(0);
    expect(night.crickets).toBe(day.birds);
    expect(night.fire).toBeGreaterThan(day.fire);
    expect(bedFor({ ...s, min: 21 * 60 }, 'diner').crickets).toBe(0);
  });

  it('bring the rain in, muffled indoors', () => {
    let wet: GameState | null = null;
    for (let day = 1; day < 60 && !wet; day++) {
      const b = bedFor({ ...s, day, min: 10 * 60 }, 'lot');
      if (b.rain > 0) wet = { ...s, day, min: 10 * 60 };
    }
    expect(wet).not.toBeNull();
    const out = bedFor(wet!, 'lot');
    const inn = bedFor(wet!, 'gym');
    expect(out.birds).toBe(0);
    expect(inn.rain).toBeGreaterThan(0);
    expect(inn.rain).toBeLessThan(out.rain);
  });

  it('have nothing where there is no place', () => {
    expect(QUIET.wind).toBe(0);
  });
});
