// Phase 22.2c: what Dale fits to the van, and winter. Each upgrade does what its line says,
// and none of them earns; a winter night is cold unless the heater's lit, and the heater
// burns propane.
import { describe, expect, it } from 'vitest';
import { road } from './content/places';
import { BODY, SICK, SPOT, UPGRADE, VAN, WINTER } from './dials';
import { act, newGame } from './game';
import { nightAt, ticketOdds } from './spots';
import type { GameState } from './types';
import { bodgeOdds } from './van';
import { seasonOf } from './weather';

const WINTER_DAY = Array.from({ length: 60 }, (_, i) => i + 1).find((d) => seasonOf(d) === 'winter')!;
const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('upgrades'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 400,
  energy: 20,
  ...over,
});
const night = (over: Partial<GameState> = {}) =>
  act(base({ min: 21 * 60, ...over }), { t: 'act', act: 'lot.sleep' });
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

describe('winter in the van', () => {
  it('costs energy on a winter night, and says so', () => {
    const r = night({ day: WINTER_DAY });
    // Sickness (Phase 22.4c) can come with a winter night: its cost is its own.
    expect(r.state.energy).toBe(20 + BODY.sleepEnergy + WINTER.cold + (r.state.sick ? SICK.energy : 0));
    expect(lines(r).some((l) => /winter night in the van/.test(l))).toBe(true);
    expect(night({ day: 2 }).state.energy).toBe(20 + BODY.sleepEnergy);
  });

  it('is no cold at all with the heater lit, at a tank of propane a night', () => {
    const r = night({ day: WINTER_DAY, gear: { shoes: 60, heater: 1, propane: 2 } });
    expect(r.state.energy).toBe(20 + BODY.sleepEnergy);
    expect(r.state.gear.propane).toBe(1);
    // The last tank, said; and no propane, no heat.
    const last = night({ day: WINTER_DAY, gear: { shoes: 60, heater: 1, propane: 1 } });
    expect(lines(last).some((l) => /last of the propane/.test(l))).toBe(true);
    expect(nightAt(base({ day: WINTER_DAY, gear: { heater: 1, propane: 0 } })).heat).toBe(false);
  });

  it('halves the cold with insulation', () => {
    const s = base({ day: WINTER_DAY, gear: { insulation: 1 } });
    expect(nightAt(s).cold).toBe(Math.round(WINTER.cold * UPGRADE.insulation.cold));
  });

  it('warns you a few days before it comes', () => {
    const eve = WINTER_DAY - WINTER.warnDays;
    expect(lines(night({ day: eve })).some((l) => /nights are getting cold/.test(l))).toBe(true);
    expect(lines(night({ day: eve - 1 })).some((l) => /nights are getting cold/.test(l))).toBe(false);
  });
});

describe('what Dale fits', () => {
  it('fits each upgrade once, for its price and time', () => {
    const s = base({ at: 'garage' });
    for (const [id, u] of Object.entries(UPGRADE)) {
      const r = act(s, { t: 'act', act: `garage.${id}` });
      expect(r.state.gear[id], id).toBe(1);
      expect(r.state.cash, id).toBe(s.cash - u.price);
      expect(r.state.min, id).toBe(s.min + u.min);
      expect(act(r.state, { t: 'act', act: `garage.${id}` }).events[0], id).toMatchObject({ k: 'refused' });
    }
  });

  it('gives back energy with the bed, dodges tickets with the curtains, holds bodges with the kit', () => {
    expect(night({ day: 2, gear: { bed: 1 } }).state.energy).toBe(20 + BODY.sleepEnergy + UPGRADE.bed.energy);
    const n = SPOT.tickets.from + 2;
    expect(nightAt(base({ lotNights: n, gear: { curtains: 1 } })).ticket).toBeCloseTo(
      ticketOdds(n) * UPGRADE.curtains.tickets,
    );
    expect(bodgeOdds(base())).toBe(VAN.bodge.odds);
    expect(bodgeOdds(base({ gear: { toolkit: 1 } }))).toBe(UPGRADE.toolkit.bodge);
  });

  it('takes a fifth off the gas with the tune-up', () => {
    const gas = road('lot', 'road')!.cash;
    const van = { tires: 100, engine: 100, battery: 100 };
    const plain = act(base({ van }), { t: 'travel', to: 'road' }).state;
    const tuned = act(base({ van, gear: { tuneup: 1 } }), { t: 'travel', to: 'road' }).state;
    expect(400 - plain.cash).toBe(gas);
    expect(400 - tuned.cash).toBe(Math.round(gas * UPGRADE.tuneup.gas));
  });

  it('sells propane at the gear shop', () => {
    const r = act(base({ at: 'shop' }), { t: 'act', act: 'shop.propane' }).state;
    expect(r.gear.propane).toBe(WINTER.propane.nights);
    expect(r.cash).toBe(400 - WINTER.propane.price);
  });
});
