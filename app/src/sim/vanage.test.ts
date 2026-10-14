// Phase 29.3: the van ages with miles driven (Evan's calls). The engine's cap falls with the
// miles, and the van's worth with it; when a rebuild costs more than the van's worth, Dale puts
// it to you: rebuild it, trade it in for a used van, claim the Rig, or limp on.
import { describe, expect, it } from 'vitest';
import { DALE_VERDICT, RIG_TRADE } from './content/garage';
import { road } from './content/places';
import { BUILD, UPGRADE, VAN, VAN_AGE } from './dials';
import { fill, money } from './format';
import { act, newGame } from './game';
import {
  breakdownOdds,
  engineCap,
  FITTED,
  milesFor,
  repairCost,
  usedPrice,
  vanWorth,
  verdictDue,
} from './van';
import type { GameState } from './types';

const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const base = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('vanage'),
  day: 5,
  at: 'lot',
  min: 9 * 60,
  cash: 3000,
  climber: {
    name: 'Kit',
    start: 'allrounder',
    skills: { power: 30, fingers: 30, endurance: 30, technique: 30, head: 30 },
  },
  ...over,
});
// The engine's cap at 55: the van worth less than a rebuild.
const TIRED = VAN_AGE.from + 45 * VAN_AGE.per;
const tired = (over: Partial<GameState> = {}) => {
  const s = base(over);
  return { ...s, van: { ...s.van, miles: TIRED }, ...over };
};

describe('the van’s miles', () => {
  it('start at a used van’s, with the engine’s cap at a new climber’s', () => {
    expect(base().van.miles).toBe(VAN_AGE.start);
    expect(engineCap(base())).toBe(VAN.start.engine);
    expect(verdictDue(base())).toBe(false);
  });

  it('go on with every drive, by its minutes, but not when a friend drives', () => {
    const s = base();
    const r = act(s, { t: 'travel', to: 'road' });
    expect(refused(r)).toBe(false);
    expect(r.state.van.miles).toBe(s.van.miles + milesFor(road('lot', 'road')!.min));
    const ride = act(base({ today: ['ride-hazel'] }), { t: 'travel', to: 'road' });
    expect(ride.state.van.miles).toBe(s.van.miles);
  });
});

describe('the engine', () => {
  it('comes back from a service only to its cap, and the bill is for what it puts back', () => {
    const s = tired({ at: 'garage' });
    const worn = { ...s, van: { ...s.van, engine: 30 } };
    expect(engineCap(worn)).toBe(55);
    expect(repairCost(worn, 'engine')).toBe(Math.ceil((VAN.price.engine * 25) / 100));
    const r = act(worn, { t: 'act', act: 'garage.engine' });
    expect(refused(r)).toBe(false);
    expect(r.state.van.engine).toBe(55);
    // Tires still go back to new.
    const t = act({ ...worn, van: { ...worn.van, tires: 40 } }, { t: 'act', act: 'garage.tires' });
    expect(t.state.van.tires).toBe(100);
    // At its cap, there's nothing to service.
    expect(refused(act(r.state, { t: 'act', act: 'garage.engine' }))).toBe(true);
  });

  it('breaks down more, limping on at a low cap', () => {
    const s = tired();
    const low = { ...s, van: { ...s.van, engine: engineCap(s) } };
    expect(breakdownOdds(low, 120)).toBeGreaterThan(breakdownOdds(base(), 120));
  });
});

describe('Dale’s verdict', () => {
  it('comes at the garage once the van’s worth is under a rebuild, and once', () => {
    const s = tired({ at: 'shop' });
    expect(vanWorth(s)).toBeLessThan(VAN_AGE.rebuild.price);
    const r = act(s, { t: 'travel', to: 'garage' });
    expect(lines(r)).toContain(
      fill(DALE_VERDICT, { rebuild: money(VAN_AGE.rebuild.price), worth: money(vanWorth(s)) }),
    );
    expect(r.state.van.verdict).toBe(s.day);
    const again = act({ ...r.state, at: 'shop' }, { t: 'travel', to: 'garage' });
    expect(lines(again).some((l) => l.startsWith('Dale wipes'))).toBe(false);
    // Not with a van worth its rebuild.
    expect(act(base({ at: 'shop' }), { t: 'travel', to: 'garage' }).state.van.verdict).toBeNull();
  });

  it('a rebuild takes miles off the engine and keeps everything fitted', () => {
    const s = tired({ at: 'garage', gear: { ...base().gear, bed: 1, shelf: 1 } });
    const r = act(s, { t: 'act', act: 'garage.rebuild' });
    expect(refused(r)).toBe(false);
    expect(r.state.cash).toBe(s.cash - VAN_AGE.rebuild.price);
    expect(engineCap(r.state)).toBe(55 + VAN_AGE.rebuild.off / VAN_AGE.per);
    expect(r.state.van.engine).toBe(engineCap(r.state));
    expect(r.state.van.miles).toBe(s.van.miles);
    expect(r.state.van.verdict).toBeNull();
    expect(r.state.gear).toMatchObject({ bed: 1, shelf: 1 });
    // Only once it's come to that.
    expect(refused(act(base({ at: 'garage' }), { t: 'act', act: 'garage.rebuild' }))).toBe(true);
  });

  it('a used van takes yours in part exchange: fresh miles, and what’s fitted stays with the old one', () => {
    const fitted = { bed: 1, heater: 1, kitchen: 1, shelf: 1, solar: 1, toolkit: 1 };
    const s = tired({ at: 'garage', gear: { ...base().gear, ...fitted } });
    expect(usedPrice(s)).toBe(VAN_AGE.used.price - vanWorth(s));
    const r = act(s, { t: 'act', act: 'garage.used' });
    expect(refused(r)).toBe(false);
    expect(r.state.cash).toBe(s.cash - usedPrice(s));
    expect(r.state.van).toMatchObject({ ...VAN.start, miles: VAN_AGE.used.miles, rebuilt: 0, verdict: null });
    expect(engineCap(r.state)).toBeGreaterThan(VAN.start.engine);
    for (const id of FITTED) expect(r.state.gear[id] ?? 0).toBe(0);
    expect(r.state.gear.toolkit).toBe(1);
    expect(refused(act(base({ at: 'garage' }), { t: 'act', act: 'garage.used' }))).toBe(true);
  });

  it('the Rig is a new van, fitted and built out, and Dale takes the old one', () => {
    const s = tired({ dream: { pick: 'rig', pot: 2800, owned: [] } });
    const r = act(s, { t: 'dream', do: 'claim' });
    expect(refused(r)).toBe(false);
    expect(r.state.cash).toBe(s.cash + vanWorth(s));
    expect(r.state.van).toEqual({
      tires: 100,
      engine: 100,
      battery: 100,
      miles: VAN_AGE.rig.miles,
      rebuilt: 0,
      verdict: null,
    });
    for (const id of [...Object.keys(UPGRADE), ...Object.keys(BUILD)]) expect(r.state.gear[id]).toBe(1);
    expect(lines(r)).toContain(fill(RIG_TRADE, { worth: money(vanWorth(s)) }));
  });
});
