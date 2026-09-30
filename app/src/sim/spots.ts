// Where you park for the night (Phase 22.2b): which spots you can use tonight, what the
// night will cost and give, and the ticket odds at the Lot. sleep() and Tonight both read
// nightAt, so the numbers a player weighs are the ones the night uses.

import { SPOT, SPOTS, UPGRADE, WINTER, type SpotId } from './dials';
import { headroom } from './cond';
import { PARTNERS, tierOf } from './presence';
import { Rng } from './rng';
import type { GameState } from './types';
import { seasonOf } from './weather';

export const SPOT_IDS = Object.keys(SPOTS) as SpotId[];

// The partner whose driveway you'd use, or null.
export function drivewayHost(s: GameState): string | null {
  for (const who of PARTNERS) {
    const p = s.people[who];
    if (p && tierOf(p.bond) >= SPOT.driveway.tier && !(p.away !== undefined && s.day < p.away)) return who;
  }
  return null;
}

// Why you can't park there tonight, or null when you can.
export function spotBlocked(s: GameState, id: SpotId): string | null {
  if (id === 'driveway') {
    if (!drivewayHost(s)) return 'You’d need a partner who’d have you.';
    if (s.day - s.driveway < SPOT.driveway.every) return 'You were there lately. Give it a few nights.';
  }
  if (id === 'ridge' && s.trips < SPOT.ridgeTrips) return 'The locals haven’t shown you the way up yet.';
  return null;
}

// The chance of a ticket at the Lot tonight, from the nights in a row you've parked there.
export function ticketOdds(nights: number): number {
  const n = nights + 1 - SPOT.tickets.from;
  return n <= 0 ? 0 : Math.min(SPOT.tickets.cap, n * SPOT.tickets.per);
}

// Tonight's ticket odds at the Lot, curtains and all.
export const ticketTonight = (s: GameState): number =>
  ticketOdds(s.lotNights) * ((s.gear.curtains ?? 0) > 0 ? UPGRADE.curtains.tickets : 1);

export const ticketRoll = (s: GameState): boolean =>
  Rng.fromStream(s.seed, 'events').derive(`ticket-${s.day}`).next() < ticketTonight(s);

export interface Night {
  // The spot the night will be at: yours, or the Lot when yours won't have you tonight.
  spot: SpotId;
  // The spot you chose, when the night falls back from it.
  wanted: SpotId | null;
  // Paid tonight: the spot and the gas there and back; nothing in the pullout.
  cost: number;
  // Energy the spot adds or takes, winter included.
  energy: number;
  // Minutes of driving in the morning, before the day starts.
  drive: number;
  // The card won't cover it: the pullout.
  rough: boolean;
  ticket: number;
  // Winter (Phase 22.2c): the cold the night takes out of you after the heater and the
  // insulation (0 or less), and whether the heater burns a tank of propane for it.
  cold: number;
  heat: boolean;
}

export function nightAt(s: GameState): Night {
  const want = s.spot;
  const spot: SpotId = spotBlocked(s, want) ? 'lot' : want;
  const d = SPOTS[spot];
  const cost = d.cost + d.gas;
  const rough = headroom(s) < cost;
  // Winter: the van's cold and the spot's, unless the heater's lit; insulation halves what's
  // left. The pullout's as cold as the Lot.
  const winter = seasonOf(s.day) === 'winter';
  const heat = winter && (s.gear.heater ?? 0) > 0 && (s.gear.propane ?? 0) > 0;
  const chill = winter && !heat ? WINTER.cold + (rough ? 0 : d.winter) : 0;
  const cold = Math.round(chill * ((s.gear.insulation ?? 0) > 0 ? UPGRADE.insulation.cold : 1));
  const bed = (s.gear.bed ?? 0) > 0 && !rough ? UPGRADE.bed.energy : 0;
  return {
    spot,
    wanted: spot === want ? null : want,
    cost: rough ? 0 : cost,
    energy: (rough ? 0 : d.energy) + cold + bed,
    drive: rough ? 0 : d.drive,
    rough,
    ticket: !rough && spot === 'lot' ? ticketTonight(s) : 0,
    cold,
    heat,
  };
}
