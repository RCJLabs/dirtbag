// Phase 18.6: your own gym and your own crag. Send City, bought off its owner once you're its
// head setter: a day's takings into a till that's yours to draw, members drawn by how fresh
// the wall is. Miller's Bluff, bought off the farmer: a line climbable once you've bolted it.

import { JOBS } from './content/jobs';
import { PLACES } from './content/places';
import type { RouteDef } from './content/routes';
import { OWN_GYM } from './dials';
import { rankAt } from './jobs';
import type { GameState, OwnGym } from './types';

export const UPGRADES = OWN_GYM.upgrades;
export type Upgrade = keyof typeof OWN_GYM.upgrades;

// Why you can't buy Send City, or null when you can.
export function gymBuyBlocked(s: GameState): string | null {
  if (s.gym) return 'It’s yours already';
  const top = JOBS.set!.ranks.length - 1;
  if (rankAt(s, 'set') < top) return `Marg sells to her head setter, and only to her`;
  if (s.cash < OWN_GYM.price) return `It’s $${OWN_GYM.price.toLocaleString('en-US')}, in hand`;
  return null;
}

// The members a wall this fresh, with these upgrades, draws in time.
export const gymTarget = (g: OwnGym): number =>
  Math.round(
    OWN_GYM.members.base +
      OWN_GYM.members.wall * g.quality +
      g.upgrades.reduce((a, u) => a + ((UPGRADES[u as Upgrade] as { members?: number }).members ?? 0), 0),
  );

// A day's money: dues and walk-ins in, rent, the desk and a setter out.
export function gymDay(g: OwnGym): { takings: number; costs: number; net: number } {
  const cafe = g.upgrades.includes('cafe') ? UPGRADES.cafe.dues : 0;
  const takings = Math.round(g.members * (OWN_GYM.dues + cafe) + g.members * OWN_GYM.walkins * OWN_GYM.pass);
  const costs = OWN_GYM.rent + OWN_GYM.desk + (g.setter ? OWN_GYM.setter : 0);
  return { takings, costs, net: takings - costs };
}

// The night: the wall goes stale (a hired setter keeps it up), members drift toward what it's
// worth, and the day's money goes in the till.
export function gymNight(g: OwnGym): OwnGym {
  const quality = Math.max(g.setter ? OWN_GYM.hired : 0, g.quality - OWN_GYM.fade);
  const members = Math.round(g.members + (gymTarget({ ...g, quality }) - g.members) * OWN_GYM.members.drift);
  const { net } = gymDay({ ...g, members });
  return { ...g, quality, members, till: g.till + net, last: net, peak: Math.max(g.peak, members) };
}

// What the wall's freshness reads as.
export const wallWord = (q: number): string =>
  q >= 0.75 ? 'the best set in the valley' : q >= 0.55 ? 'a good set' : q >= 0.35 ? 'getting tired' : 'stale';

// The rungs you've climbed on the work-and-business ladder (18.7 shows them): setting's
// ranks, then your own gym, then the busiest gym in the valley.
export function businessRung(s: GameState): number {
  if (s.gym) return s.gym.peak >= OWN_GYM.members.top ? JOBS.set!.ranks.length + 1 : JOBS.set!.ranks.length;
  return rankAt(s, 'set');
}

// ---- the bluff ----

// Whether a line is climbable: anything but the bluff's, or one of those you've bolted.
export const bolted = (s: GameState, r: RouteDef): boolean =>
  !PLACES[r.place]?.land || s.bolted.includes(r.id);

// Why you can't bolt a line, or null when you can.
export function boltBlocked(s: GameState, r: RouteDef): string | null {
  if (!PLACES[r.place]?.land) return 'It’s bolted already';
  if (!s.unlocked.includes(r.place)) return `It isn’t yours to bolt. ${PLACES[r.place]!.name} is for sale`;
  if (s.bolted.includes(r.id)) return 'It’s done already';
  if (s.at !== r.place) return `You bolt it at ${PLACES[r.place]!.name}`;
  return null;
}
