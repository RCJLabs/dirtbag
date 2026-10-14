// Phase 29.1: scavenging and build-outs (Evan's call: new build-outs from parts; the garage's
// cash upgrades stay). The free pile is the cans' time for parts instead of money; parts
// build a shelf, a solar panel, door seals and a bed platform, each doing one thing.
import { describe, expect, it } from 'vitest';
import { BUILD, HUSTLE, SUPPLIES, UPGRADE, VAN, WINTER } from './dials';
import { act, newGame } from './game';
import { hustleTake } from './hustle';
import { nightAt } from './spots';
import type { GameState } from './types';
import { seasonOf } from './weather';

const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const base = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('build'),
  day: 5,
  at: 'lot',
  min: 9 * 60,
  cash: 200,
  energy: 80,
  climber: {
    name: 'Kit',
    start: 'allrounder',
    skills: { power: 30, fingers: 30, endurance: 30, technique: 30, head: 30 },
  },
  ...over,
});
const sleep = (s: GameState) => act({ ...s, min: 21 * 60 }, { t: 'act', act: 'lot.sleep' }).state;

describe('the free pile', () => {
  it('finds parts, not money, once a day and by daylight', () => {
    const s = base();
    const r = act(s, { t: 'act', act: 'lot.scrap' });
    expect(refused(r)).toBe(false);
    const take = hustleTake(s, 'scrap');
    expect(take).toBeGreaterThanOrEqual(HUSTLE.scrap.parts[0]);
    expect(take).toBeLessThanOrEqual(HUSTLE.scrap.parts[1]);
    expect(r.state.parts).toBe(take);
    expect(r.state.cash).toBe(s.cash);
    expect(r.state.min).toBe(s.min + HUSTLE.scrap.min);
    expect(refused(act(r.state, { t: 'act', act: 'lot.scrap' }))).toBe(true);
    expect(refused(act(base({ min: 22 * 60 }), { t: 'act', act: 'lot.scrap' }))).toBe(true);
  });
});

describe('build-outs', () => {
  it('take their parts and time, once', () => {
    const none = act(base(), { t: 'act', act: 'lot.shelf' });
    expect(refused(none)).toBe(true);
    const s = base({ parts: BUILD.shelf.parts + 1 });
    const r = act(s, { t: 'act', act: 'lot.shelf' });
    expect(refused(r)).toBe(false);
    expect(r.state.parts).toBe(1);
    expect(r.state.gear.shelf).toBe(1);
    expect(r.state.min).toBe(s.min + BUILD.shelf.min);
    expect(refused(act({ ...r.state, parts: 9 }, { t: 'act', act: 'lot.shelf' }))).toBe(true);
  });

  it('a shelf makes the supplies last longer', () => {
    const s = base({ supplies: 80 });
    const without = sleep(s).supplies;
    const withShelf = sleep({ ...s, gear: { ...s.gear, shelf: 1 } }).supplies;
    expect(80 - without).toBeCloseTo(SUPPLIES.night, 5);
    expect(80 - withShelf).toBeCloseTo(SUPPLIES.night * BUILD.shelf.supplies, 5);
  });

  it('a solar panel keeps the battery up overnight', () => {
    const s = base({ van: { ...base().van, battery: 50 } });
    expect(sleep(s).van.battery).toBeCloseTo(50 - VAN.night, 5);
    expect(sleep({ ...s, gear: { ...s.gear, solar: 1 } }).van.battery).toBe(50);
  });

  it('door seals take some of a winter night, and a platform gives some sleep back', () => {
    const winter = Array.from({ length: 60 }, (_, i) => i + 1).find((d) => seasonOf(d) === 'winter')!;
    const s = base({ day: winter });
    const plain = nightAt(s);
    const sealed = nightAt({ ...s, gear: { ...s.gear, seals: 1 } });
    expect(plain.cold).toBeLessThanOrEqual(WINTER.cold);
    expect(sealed.cold).toBe(Math.round(plain.cold * BUILD.seals.cold));
    const bed = nightAt({ ...s, gear: { ...s.gear, bed: 1 } });
    const both = nightAt({ ...s, gear: { ...s.gear, bed: 1, platform: 1 } });
    expect(bed.energy - plain.energy).toBe(UPGRADE.bed.energy);
    expect(both.energy - bed.energy).toBe(BUILD.platform.energy);
  });
});
