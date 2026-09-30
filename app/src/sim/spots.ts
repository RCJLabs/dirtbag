// Where you park for the night (Phase 22.2b): which spots you can use tonight, what the
// night will cost and give, and the ticket odds at the Lot. sleep() and Tonight both read
// nightAt, so the numbers a player weighs are the ones the night uses.

import { SPOT, SPOTS, type SpotId } from './dials';
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

export const ticketRoll = (s: GameState): boolean =>
  Rng.fromStream(s.seed, 'events').derive(`ticket-${s.day}`).next() < ticketOdds(s.lotNights);

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
}

export function nightAt(s: GameState): Night {
  const want = s.spot;
  const spot: SpotId = spotBlocked(s, want) ? 'lot' : want;
  const d = SPOTS[spot];
  const cost = d.cost + d.gas;
  const rough = headroom(s) < cost;
  const cold = seasonOf(s.day) === 'winter' ? d.winter : 0;
  return {
    spot,
    wanted: spot === want ? null : want,
    cost: rough ? 0 : cost,
    energy: rough ? 0 : d.energy + cold,
    drive: rough ? 0 : d.drive,
    rough,
    ticket: !rough && spot === 'lot' ? ticketOdds(s.lotNights) : 0,
  };
}
