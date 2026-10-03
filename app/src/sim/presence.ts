// Where people are, from the seed, the day and the clock, and from what's between you: a
// partner turns up more as the bond grows, is gone while away, and meets you where you
// asked. Like the weather, nothing is stored: tomorrow's schedule is already decided by the
// seed and your bond, you just don't know it yet.

import { PEOPLE } from './content/people';
import { isWeekend } from './cond';
import { dexHurt } from './curves';
import { BOND, CAST, RIVAL } from './dials';
import { Rng } from './rng';
import type { GameState, PersonLog } from './types';
import { conditions, conditionsAt, seasonOf } from './weather';

// A bond's tier: 0 Stranger, 1 Acquaintance, 2 Regular, 3 Partner, 4 Ride-or-Die.
export const tierOf = (bond: number): number => BOND.tiers.filter((t) => bond >= t).length - 1;

// Hazel lives at the Lot and spends open days at the crag, where she'll belay you, unless
// you've asked her somewhere else for the day.
function hazel(seed: string, day: number, min: number, p?: PersonLog): string | null {
  // Gone to her sister's (Phase 17.2): her van's at the Lot, she isn't.
  if (p?.away !== undefined && day < p.away) return null;
  if (p?.invite?.day === day && min >= p.invite.from && min < 17 * 60) return p.invite.place;
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
  if (p.away !== undefined && day < p.away) return null;
  if (dexHurt(seed, day)) return null;
  const r = Rng.fromStream(seed, 'events').derive(`dex-${day}`);
  if (!r.chance(RIVAL.out)) return null;
  if (!conditions(seed, day).open) return 'gym';
  return r.chance(RIVAL.crag) ? 'road' : 'gym';
}

// Phase 17.1's cast (CAST says when and how often). A partner who's asked you out is where
// they said from when they said, as Sage is; otherwise they're at their own crag, on the
// day the seed and your bond give them, and only when it's dry, the Cave aside.
const asked = (day: number, min: number, p?: PersonLog): string | null =>
  p?.invite?.day === day && min >= p.invite.from ? p.invite.place : null;
const away = (day: number, p?: PersonLog): boolean => p?.away !== undefined && day < p.away;
const turnsUp = (seed: string, who: string, day: number, base: number, p?: PersonLog): boolean =>
  Rng.fromStream(seed, 'events')
    .derive(`${who}-${day}`)
    .chance(base + BOND.perTier * tierOf(p?.bond ?? 0));

// Ray has climbed at Roadside for thirty-odd years, and still comes out at the weekend.
function ray(seed: string, day: number, min: number): string | null {
  if (!isWeekend(day) || min < CAST.ray.from || min >= CAST.ray.till) return null;
  return conditionsAt(seed, day, 'road').open ? 'road' : null;
}

// Frank's rig is in the Lot some nights, fewer in winter; he's passing through, still.
function frank(seed: string, day: number, min: number): string | null {
  const F = CAST.frank;
  if (day < F.fromDay || min < F.from || min >= F.till) return null;
  const odds = seasonOf(day) === 'winter' ? F.winter : F.nights;
  return Rng.fromStream(seed, 'events').derive(`frank-${day}`).chance(odds) ? 'lot' : null;
}

// Mara climbs at the Gorge, on dry days.
function mara(seed: string, day: number, min: number, p?: PersonLog): string | null {
  const M = CAST.mara;
  if (min < M.from || min >= M.till || away(day, p)) return null;
  const inv = asked(day, min, p);
  if (inv) return inv;
  if (!turnsUp(seed, 'mara', day, M.base, p)) return null;
  return conditionsAt(seed, day, 'gorge').open ? 'gorge' : null;
}

// Rico is in the Cave most days, and out at Moonstone on some dry ones.
function rico(seed: string, day: number, min: number, p?: PersonLog): string | null {
  const R = CAST.rico;
  if (min < R.from || min >= R.till || away(day, p)) return null;
  const inv = asked(day, min, p);
  if (inv) return inv;
  if (!turnsUp(seed, 'rico', day, R.base, p)) return null;
  const dry = conditionsAt(seed, day, 'moon').open;
  return dry && Rng.fromStream(seed, 'events').derive(`rico-moon-${day}`).chance(R.moon) ? 'moon' : 'cave';
}

// Tam climbs the Mesa early, before the sandstone heats up.
function tam(seed: string, day: number, min: number, p?: PersonLog): string | null {
  const T = CAST.tam;
  if (min < T.from || min >= T.till || away(day, p)) return null;
  const inv = asked(day, min, p);
  if (inv) return inv;
  if (!turnsUp(seed, 'tam', day, T.base, p)) return null;
  return conditionsAt(seed, day, 'mesa').open ? 'mesa' : null;
}

export function whereIs(seed: string, who: string, day: number, min: number, p?: PersonLog): string | null {
  if (who === 'hazel') return hazel(seed, day, min, p);
  if (who === 'sage') return sage(seed, day, min, p);
  if (who === 'dex') return dex(seed, day, min, p);
  if (who === 'ray') return ray(seed, day, min);
  if (who === 'frank') return frank(seed, day, min);
  if (who === 'mara') return mara(seed, day, min, p);
  if (who === 'rico') return rico(seed, day, min, p);
  if (who === 'tam') return tam(seed, day, min, p);
  return null;
}

// Where someone is right now, in this game.
export const whereNow = (s: GameState, who: string): string | null =>
  whereIs(s.seed, who, s.day, s.min, s.people[who]);

// The people you can climb with: they belay, and a day climbing near them is a day together.
export const PARTNERS = ['hazel', 'sage', 'mara', 'rico', 'tam'];

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
