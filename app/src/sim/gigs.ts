// Phase 26b (Evan's call, 13 Oct 2026): money in a day. Day labor, posted on the seed's days
// at the market, which takes the whole day; and a family at a busy crag who'd pay you to hang
// them a rope, the one earner that leaves the day for climbing. Nothing here is kept: the
// day's flags say what's been done.

import { GIGS } from './content/gigs';
import { routesAt } from './content/gym';
import { PLACES } from './content/places';
import { roped, type RouteDef } from './content/routes';
import { crowdNow } from './crowds';
import { GIG, TOURISTS } from './dials';
import { clock } from './format';
import { has } from './kit';
import { Rng } from './rng';
import type { GameState } from './types';
import { seasonOf } from './weather';

// The day labor posted for a day, or null: the seed's, and the season's.
export function gigOn(seed: string, day: number): string | null {
  const r = Rng.fromStream(seed, 'events').derive(`gig-${day}`);
  if (!r.chance(GIG.odds)) return null;
  const pool = Object.entries(GIGS)
    .filter(([, g]) => !g.season || g.season.includes(seasonOf(day)))
    .map(([id]) => id);
  return pool.length ? pool[r.int(0, pool.length - 1)]! : null;
}

// Why you can't take today's day labor, or null when you can.
export function gigBlocked(s: GameState): string | null {
  if (!gigOn(s.seed, s.day)) return 'No day labor posted today';
  if (s.at !== 'market') return `It's posted at ${PLACES.market!.name}`;
  if (s.min > GIG.by) return `It starts by ${clock(GIG.by)}`;
  if (s.today.includes('worked')) return 'You’ve worked today';
  if (s.energy < GIG.energy) return 'Too tired for a day of lifting';
  return null;
}

// The line you'd hang a family's rope on here: the easiest roped line you've sent.
export function touristLine(s: GameState, place = s.at): RouteDef | null {
  return (
    routesAt(s.seed, place, s.day)
      .filter((r) => roped(r) && !r.wall && !r.exped && !r.dws && s.routes[r.id]?.sent)
      .sort((a, b) => a.grade - b.grade)[0] ?? null
  );
}

// Whether a family at a crag asks today: a busy day, a line of yours to hang it on, a rope,
// and the seed.
export function touristsOn(s: GameState, place = s.at): boolean {
  if (!PLACES[place]?.crag || PLACES[place]?.land) return false;
  const c = crowdNow(s, place);
  if (c !== 'busy' && c !== 'packed') return false;
  if (!has(s, 'rope') || !touristLine(s, place)) return false;
  return Rng.fromStream(s.seed, 'events').derive(`tourists-${s.day}-${place}`).chance(TOURISTS.odds);
}

// Why you can't hang them the rope, or null when you can.
export function touristsBlocked(s: GameState): string | null {
  if (s.today.includes('tourists')) return 'You’ve hung them a rope today';
  if (s.min >= TOURISTS.till) return 'They’ve packed up and gone';
  if (!touristsOn(s)) return 'Nobody’s asking';
  if (s.energy < TOURISTS.energy) return 'Too tired to lead anything';
  return null;
}

// What the family tips, by the seed and the day.
export const touristTip = (s: GameState): number =>
  Rng.fromStream(s.seed, 'events').derive(`tourist-tip-${s.day}`).int(0, TOURISTS.tip);
