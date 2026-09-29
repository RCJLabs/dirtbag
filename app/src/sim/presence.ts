// Where people are, from the seed, the day and the clock, and from what's between you: a
// partner turns up more as the bond grows, is gone while away, and meets you where you
// asked. Like the weather, nothing is stored: tomorrow's schedule is already decided by the
// seed and your bond, you just don't know it yet.

import { dexHurt } from './curves';
import { BOND, RIVAL } from './dials';
import { Rng } from './rng';
import type { GameState, PersonLog } from './types';
import { conditions } from './weather';

// A bond's tier: 0 Stranger, 1 Acquaintance, 2 Regular, 3 Partner, 4 Ride-or-Die.
export const tierOf = (bond: number): number => BOND.tiers.filter((t) => bond >= t).length - 1;

// Hazel lives at the Lot and spends open days at the crag, where she'll belay you.
function hazel(seed: string, day: number, min: number): string {
  const open = conditions(seed, day).open;
  return open && min >= 8 * 60 && min < 17 * 60 ? 'road' : 'lot';
}

// Sage turns up about half the days, at the crag when it's dry and the gym when it isn't,
// and more often the better you know each other. Day two is always the gym: the first week
// should include meeting her.
function sage(seed: string, day: number, min: number, p?: PersonLog): string | null {
  if (min < 9 * 60 || min >= 18 * 60 || day < 2) return null;
  if (p?.away !== undefined && day < p.away) return null;
  if (p?.invite?.day === day && min >= p.invite.from) return p.invite.place;
  const open = conditions(seed, day).open;
  if (day === 2) return 'gym';
  const r = Rng.fromStream(seed, 'events').derive(`sage-${day}`);
  if (!r.chance(0.55 + BOND.perTier * tierOf(p?.bond ?? 0))) return null;
  if (!open) return 'gym';
  return r.chance(0.6) ? 'road' : 'gym';
}

// Dex is nowhere until he's noticed you, and then where you met him for the rest of that
// day. After that he's out about two days in five, at the crag when it's dry and the gym
// when it isn't, and nowhere while he's hurt.
function dex(seed: string, day: number, min: number, p?: PersonLog): string | null {
  if (!p || min < 10 * 60 || min >= 17 * 60) return null;
  if (p.invite?.day === day) return min >= p.invite.from ? p.invite.place : null;
  if (dexHurt(seed, day)) return null;
  const r = Rng.fromStream(seed, 'events').derive(`dex-${day}`);
  if (!r.chance(RIVAL.out)) return null;
  if (!conditions(seed, day).open) return 'gym';
  return r.chance(RIVAL.crag) ? 'road' : 'gym';
}

export function whereIs(seed: string, who: string, day: number, min: number, p?: PersonLog): string | null {
  if (who === 'hazel') return hazel(seed, day, min);
  if (who === 'sage') return sage(seed, day, min, p);
  if (who === 'dex') return dex(seed, day, min, p);
  return null;
}

// Where someone is right now, in this game.
export const whereNow = (s: GameState, who: string): string | null =>
  whereIs(s.seed, who, s.day, s.min, s.people[who]);

// The people you can climb with.
export const PARTNERS = ['hazel', 'sage'];

// Who's at a place right now.
export const around = (
  seed: string,
  place: string,
  day: number,
  min: number,
  people: Record<string, PersonLog> = {},
): string[] => PARTNERS.filter((w) => whereIs(seed, w, day, min, people[w]) === place);
