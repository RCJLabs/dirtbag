// Phase 25.6: crew drama. Two partners both ask for the same day; whoever you let down falls
// out with the other, and keeps away from wherever they are. Weeks later the one you picked
// asks about it, and you can try to get them back in a room. Once a life.

import { BOND, CREW, CREW_NAME, CREW_PROJECT, RENOWN } from './dials';
import { tamStops } from './lives';
import { PARTNERS, tierOf, whereNow } from './presence';
import { Rng } from './rng';
import type { GameState } from './types';

// The pair who'd ask, the closer first: the two you're closest to of the crew, both a
// Regular or better and not away. Null when there aren't two.
export function crewPair(s: GameState): [string, string] | null {
  const ok = CREW.who.filter((w) => {
    const p = s.people[w];
    return !!p && tierOf(p.bond) >= CREW.tier && !(p.away !== undefined && s.day < p.away);
  });
  if (ok.length < 2) return null;
  const [a, b] = [...ok].sort((x, y) => s.people[y]!.bond - s.people[x]!.bond);
  return [a!, b!];
}

// Whether a beat is due: "who/ask/other", asked by who about a day you'd given other; or
// "who/mend/other", the one you picked asking about the one you let down.
export function crewDue(s: GameState, ref: string): boolean {
  const [who, beat, other] = ref.split('/');
  if (beat === 'ask') {
    if (s.crew || s.day < CREW.from) return false;
    const pair = crewPair(s);
    return !!pair && pair[0] === who && pair[1] === other;
  }
  const c = s.crew;
  return !!c && c.stage === 'rift' && c.a === who && c.b === other && s.day - c.day >= CREW.mend;
}

// The odds a night at the fire mends it: better the more you've made up with the one you let down.
export const mendOdds = (s: GameState): number =>
  Math.min(0.95, CREW.odds + CREW.perTier * tierOf(s.people[s.crew?.b ?? '']?.bond ?? 0));

// Whether tonight's try works, by the seed and the day.
export const mends = (s: GameState): boolean =>
  Rng.fromStream(s.seed, 'events').derive(`crew-mend-${s.day}`).next() < mendOdds(s);

// Phase 28.1: the crew, closest first: the partners you're a Regular with or closer, less
// anyone who's stopped coming out for good (Tam, from his fifth year).
export function crewOf(s: GameState): string[] {
  const ok = PARTNERS.filter((w) => {
    const p = s.people[w];
    return !!p && tierOf(p.bond) >= CREW.tier && !(w === 'tam' && s.day >= (tamStops(p) ?? Infinity));
  });
  return ok.sort(
    (a, b) => s.people[b]!.bond - s.people[a]!.bond || PARTNERS.indexOf(a) - PARTNERS.indexOf(b),
  );
}

// Whether the crew can be named: enough of them, and no name yet.
export const crewNameable = (s: GameState): boolean => !s.crewName && crewOf(s).length >= CREW_NAME.min;

// Whether `who` brings it up: one of the crew, the first time it can be named. After that
// it waits on the People list.
export const crewNameDue = (s: GameState, who: string): boolean =>
  crewNameable(s) && !s.seen.includes('crew-name') && crewOf(s).includes(who);

// The day the next crew day can be called: once every `every` days.
export const crewDayFrom = (s: GameState): number =>
  s.crewDay === null ? 0 : s.crewDay + CREW_PROJECT.every;

// The crew who are here now.
export const crewHere = (s: GameState): string[] => crewOf(s).filter((w) => whereNow(s, w) === s.at);

// The day a call now is for: today before the invite hour, tomorrow after it.
export const crewDayFor = (s: GameState): number => (s.min < BOND.inviteBefore ? s.day : s.day + 1);

// Phase 28.4: the crew's renown, 0 (nobody's heard of them) to the top tier: counted from the
// projects sent with the crew there and how long it's had its name. Lines only, never shown.
export function renownTier(s: GameState): number {
  if (!s.crewName) return 0;
  const trains = s.crewSends.filter((x) => x.train.length > 0).length;
  const months = Math.floor(Math.max(0, s.day - s.crewName.day) / 30);
  const score = trains * RENOWN.train + months * RENOWN.month;
  return RENOWN.tiers.filter((t) => score >= t).length;
}

// One of the old guard's lines about the crew, due once a tier: "who/n", at tier n and not yet
// heard (a jump past a tier skips its line rather than saying something out of date).
export const renownBeatDue = (s: GameState, ref: string): boolean => {
  const [who, n] = ref.split('/');
  return renownTier(s) === Number(n) && !s.seen.includes(`renown-${who}-${n}`);
};
