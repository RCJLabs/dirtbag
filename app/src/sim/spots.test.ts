// Phase 22.2b: where you park. Each spot's night costs and gives what it says, the Lot
// tickets you for staying, the driveway wants a partner and a gap between visits, the Ridge
// wants you known, and a spot that won't have you tonight falls back to the Lot.
import { describe, expect, it } from 'vitest';
import { BODY, MONEY, SPOT, SPOTS, WINTER } from './dials';
import { act, newGame } from './game';
import { nightAt, spotBlocked, ticketOdds } from './spots';
import { tonight } from './tonight';
import type { GameState } from './types';
import { seasonOf } from './weather';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('spots'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 200,
  energy: 20,
  min: 21 * 60,
  day: 10,
  ...over,
});
// No knock tonight (Phase 22.6a has its own tests): a knock the night before keeps the door quiet.
const sleep = (s: GameState) =>
  act({ ...s, deck: { ...s.deck, knock: s.day } }, { t: 'act', act: 'lot.sleep' });

describe('where you park', () => {
  it('charges each spot and its gas, and wakes you at the Lot after the drive back', () => {
    for (const [id, d] of Object.entries(SPOTS)) {
      const s = base({
        spot: id as GameState['spot'],
        trips: 30,
        people: { hazel: { bond: 5, last: 0, since: 1 } },
      });
      const r = sleep(s).state;
      expect(r.cash, id).toBe(200 - d.cost - d.gas);
      expect(r.min, id).toBe(7 * 60 + 10 + d.drive);
      expect(r.energy, id).toBe(20 + BODY.sleepEnergy + d.energy);
      expect(r.at, id).toBe('lot');
      expect(tonight(s).cash, id).toBe(r.cash);
    }
  });

  it('is colder up high in winter, on top of the van’s own cold', () => {
    const winter = Array.from({ length: 400 }, (_, i) => i + 1).find((d) => seasonOf(d) === 'winter')!;
    const s = base({ spot: 'trailhead', day: winter });
    expect(nightAt(s).energy).toBe(SPOTS.trailhead.energy + SPOTS.trailhead.winter + WINTER.cold);
  });

  it('tickets you at the Lot once you’ve stayed a few nights running, and a night away resets it', () => {
    expect(ticketOdds(0)).toBe(0);
    expect(ticketOdds(SPOT.tickets.from - 1)).toBe(0);
    expect(ticketOdds(SPOT.tickets.from)).toBeCloseTo(SPOT.tickets.per);
    expect(ticketOdds(99)).toBe(SPOT.tickets.cap);
    let s = base();
    let fined = 0;
    for (let n = 0; n < 30; n++) {
      const r = sleep({ ...s, min: 21 * 60, cash: 200 });
      if (r.state.cash < 200 - MONEY.vanSpot) fined++;
      s = r.state;
    }
    expect(s.lotNights).toBe(30);
    expect(fined).toBeGreaterThan(0);
    expect(sleep({ ...s, min: 21 * 60, spot: 'trailhead' }).state.lotNights).toBe(0);
  });

  it('wants a partner for the driveway, a gap between visits, and the locals for the Ridge', () => {
    expect(spotBlocked(base(), 'driveway')).toMatch(/partner/);
    const friend = base({ people: { hazel: { bond: 5, last: 0, since: 1 } } });
    expect(spotBlocked(friend, 'driveway')).toBeNull();
    expect(act(base(), { t: 'spot', spot: 'ridge' }).events[0]).toMatchObject({ k: 'refused' });
    expect(act(base({ trips: SPOT.ridgeTrips }), { t: 'spot', spot: 'ridge' }).state.spot).toBe('ridge');
    // After a night there, the driveway waits; that night's the Lot, and it says so.
    const once = sleep({ ...friend, spot: 'driveway' }).state;
    expect(once.driveway).toBe(10);
    const next = { ...once, min: 21 * 60, cash: 200 };
    expect(nightAt(next)).toMatchObject({ spot: 'lot', wanted: 'driveway' });
    const r = sleep(next);
    expect(r.state.cash).toBe(200 - MONEY.vanSpot);
    expect(r.events.some((e) => e.k === 'line' && /wouldn’t work tonight/.test(e.text))).toBe(true);
  });

  it('sleeps in the pullout when the card won’t cover the spot', () => {
    const s = base({ spot: 'trailhead', cash: -MONEY.cardLimit });
    expect(nightAt(s)).toMatchObject({ rough: true, cost: 0, drive: 0 });
    expect(sleep(s).state.cash).toBe(-MONEY.cardLimit);
  });
});
