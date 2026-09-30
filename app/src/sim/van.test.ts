// Phase 22.2a: the van's parts wear with the miles and the nights, a worn one breaks down on
// a drive out of town, a breakdown has its ways out, and the garage puts it all back.
import { describe, expect, it } from 'vitest';
import { ACTS, road } from './content/places';
import { BODY, VAN } from './dials';
import { act, actCost, newGame } from './game';
import type { Action, GameState } from './types';
import { breakdownOdds, breakdownRoll, repairCost } from './van';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('van'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 200,
  ...over,
});
const refused = (s: GameState, a: Action) => {
  const e = act(s, a).events.find((x) => x.k === 'refused');
  return e && e.k === 'refused' ? e.why : null;
};
const van = (tires: number, engine = 100, battery = 100) => ({ tires, engine, battery });

// A state that breaks down on the drive to Roadside: the first minute of the morning that
// rolls one, with the tires just good enough to leave town on.
function brokenDown(over: Partial<GameState> = {}): GameState {
  for (let m = 7 * 60; m < 12 * 60; m++) {
    const s = base({ van: van(VAN.unsafe + 1), min: m, ...over });
    if (breakdownRoll(s, road('lot', 'road')!.min, 'road')) return act(s, { t: 'travel', to: 'road' }).state;
  }
  throw new Error('no breakdown all morning');
}

describe('the van', () => {
  it('wears the tires and engine by the minute driven, and the battery by the night', () => {
    const s = base({ van: van(100, 100, 100) });
    const r = act(s, { t: 'travel', to: 'road' }).state;
    const min = road('lot', 'road')!.min;
    expect(r.van.tires).toBeCloseTo(100 - VAN.wear.tires * min);
    expect(r.van.engine).toBeCloseTo(100 - VAN.wear.engine * min);
    const night = act({ ...s, min: 22 * 60 }, { t: 'act', act: 'lot.sleep' }).state;
    expect(night.van.battery).toBe(100 - VAN.night);
  });

  it('never breaks down kept up, or across town, and more often the worse it gets', () => {
    expect(breakdownOdds(base({ van: van(100) }), 120)).toBe(0);
    expect(breakdownOdds(base({ van: van(0) }), 10)).toBe(0);
    const at = (c: number) => breakdownOdds(base({ van: van(c) }), 120);
    expect(at(85)).toBeLessThan(0.01);
    expect(at(50)).toBeGreaterThan(at(85));
    expect(at(20)).toBeGreaterThan(at(50));
  });

  it('won’t leave town on a shot part or a flat battery, but always gets you across it', () => {
    expect(refused(base({ van: van(10) }), { t: 'travel', to: 'road' })).toMatch(/won’t make it out of town/);
    expect(refused(base({ van: van(10) }), { t: 'travel', to: 'garage' })).toBeNull();
    // A flat battery: a jump across town, to a shift or the garage, but not out of it.
    const flat = base({ van: van(100, 100, 0) });
    expect(refused(flat, { t: 'travel', to: 'road' })).toMatch(/battery’s flat/);
    expect(refused(flat, { t: 'travel', to: 'cafe' })).toBeNull();
    expect(refused(flat, { t: 'travel', to: 'garage' })).toBeNull();
    // Out at the crag on a shot part, the drive home still goes.
    expect(refused(base({ at: 'road', van: van(10) }), { t: 'travel', to: 'lot' })).toBeNull();
  });

  it('breaks down halfway, and holds everything until you find a way out', () => {
    const s = brokenDown();
    expect(s.breakdown).toMatchObject({ part: 'tires', to: 'road', bodged: false });
    expect(s.at).toBe('lot');
    expect(s.van.tires).toBe(VAN.broken);
    expect(refused(s, { t: 'act', act: 'lot.cook' })).toMatch(/broken down/);
  });

  it('tows you to the garage, for cash and time', () => {
    const s = brokenDown();
    const r = act(s, { t: 'fix', how: 'tow' }).state;
    expect(r).toMatchObject({
      at: 'garage',
      breakdown: null,
      cash: s.cash - VAN.tow.cash,
      min: s.min + VAN.tow.min,
    });
  });

  it('lets you limp on, slow and tired, on what’s left of the part', () => {
    const s = brokenDown();
    const r = act(s, { t: 'fix', how: 'limp' }).state;
    expect(r.at).toBe('road');
    expect(r.min).toBe(s.min + s.breakdown!.rest * VAN.limp.slow);
    expect(r.energy).toBe(s.energy - VAN.limp.energy);
  });

  it('lets you try a bodge once: it holds and you drive on, or it doesn’t', () => {
    const s = brokenDown();
    const r = act(s, { t: 'fix', how: 'bodge' }).state;
    if (r.breakdown) {
      expect(r.breakdown.bodged).toBe(true);
      expect(refused(r, { t: 'fix', how: 'bodge' })).toMatch(/tried that/);
    } else {
      expect(r.at).toBe('road');
      expect(r.van.tires).toBe(VAN.bodge.to);
    }
  });

  it('brings a friend out, once you’re close enough to call one', () => {
    expect(refused(brokenDown(), { t: 'fix', how: 'friend' })).toMatch(/Nobody/);
    const s = brokenDown({ people: { hazel: { bond: 3, last: 0, since: 1 } } });
    const r = act(s, { t: 'fix', how: 'friend' }).state;
    expect(r).toMatchObject({ at: 'road', breakdown: null });
    expect(r.van.tires).toBe(VAN.friend.to);
  });

  it('puts a part back to new at the garage, priced by its wear', () => {
    const s = base({ at: 'garage', van: van(40, 100, 100) });
    expect(repairCost(s, 'tires')).toBe(Math.ceil(VAN.price.tires * 0.6));
    expect(actCost(s, ACTS['garage.tires']!).cash).toBe(-repairCost(s, 'tires'));
    const r = act(s, { t: 'act', act: 'garage.tires' }).state;
    expect(r.van.tires).toBe(100);
    expect(r.cash).toBe(s.cash - repairCost(s, 'tires'));
    expect(refused(s, { t: 'act', act: 'garage.engine' })).toMatch(/fine/);
    expect(refused({ ...s, cash: -140 }, { t: 'act', act: 'garage.tires' })).toMatch(/declined/);
  });

  it('keeps the drive’s energy cost', () => {
    const s = base({ van: van(100) });
    expect(act(s, { t: 'travel', to: 'road' }).state.energy).toBe(s.energy - BODY.driveEnergy);
  });
});
