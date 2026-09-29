// Where people are, from the seed, the day and the clock, and from what's between you: a
// partner turns up more as the bond grows, is gone while away, and meets you where you
// asked. Like the weather, nothing is stored: tomorrow's schedule is already decided by the
// seed and your bond, you just don't know it yet.

import { PEOPLE } from './content/people';
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

// Whether you'd know someone by name: you've met, or they were there from the start.
export const knows = (s: GameState, who: string): boolean => !!s.people[who] || !!PEOPLE[who]?.known;

// A stretch of someone's day at one place.
export interface Stay {
  who: string;
  from: number;
  // The minute they're gone, or the day's end if they're still there at midnight.
  till: number;
}

export const DAY_END = 24 * 60;

// Who you'd find at a place from a time to the end of the day, and from when till when: the
// place card's "Who's around", read before you drive. Hours turn on the minute an invite is
// made, as well as on the hour, so the day is read a minute at a time. Someone who leaves and
// comes back has two stays.
export function staysAt(s: GameState, place: string, from: number): Stay[] {
  const out: Stay[] = [];
  for (const who of Object.keys(PEOPLE)) {
    let open: Stay | null = null;
    for (let m = from; m < DAY_END; m++) {
      const here = whereIs(s.seed, who, s.day, m, s.people[who]) === place;
      if (here && !open) out.push((open = { who, from: m, till: DAY_END }));
      else if (!here && open) {
        open.till = m;
        open = null;
      }
    }
  }
  return out.sort((a, b) => a.from - b.from);
}
