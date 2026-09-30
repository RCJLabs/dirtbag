// The event deck (Phase 22.6): one seeded draw at a time, at most one encounter a day. 22.6a
// deals the knocks on the van at night, by where you're parked. The numbers are EVENTS
// (dials.ts); the knocks are content/knocks.ts.

import { KNOCKS, type Knock, type KnockFx } from './content/knocks';
import { EVENTS } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';

// Tonight's odds of a knock where the van's parked, or 0 when one's too recent, or there's
// been an encounter today already.
export function knockOdds(s: GameState, spot: GameState['spot']): number {
  if (s.deck.last === s.day) return 0;
  if (s.deck.knock && s.day - s.deck.knock < EVENTS.knock.every) return 0;
  return EVENTS.knock.odds * EVENTS.knock.spot[spot];
}

// Whether someone knocks tonight, and who: seeded by the night. The deck passes over the
// last few you've heard while the spot has others.
export function knockTonight(s: GameState, spot: GameState['spot']): Knock | null {
  const r = Rng.fromStream(s.seed, 'events').derive(`knock-${s.day}`);
  if (r.next() >= knockOdds(s, spot)) return null;
  const here = KNOCKS.filter((k) => k.spots.includes(spot));
  const recent = s.deck.seen.slice(-EVENTS.fresh);
  const fresh = here.filter((k) => !recent.includes(k.id));
  const pool = fresh.length ? fresh : here;
  return pool[r.int(0, pool.length - 1)] ?? null;
}

export const knockById = (id: string): Knock | undefined => KNOCKS.find((k) => k.id === id);

// A knock's psyche, on the rebuild's scale.
export const knockPsyche = (fx: KnockFx): number => Math.round((fx.psyche ?? 0) * EVENTS.psyche);
