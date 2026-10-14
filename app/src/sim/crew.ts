// Phase 25.6: crew drama. Two partners both ask for the same day; whoever you let down falls
// out with the other, and keeps away from wherever they are. Weeks later the one you picked
// asks about it, and you can try to get them back in a room. Once a life.

import { CREW, CREW_NAME } from './dials';
import { tamStops } from './lives';
import { PARTNERS, tierOf } from './presence';
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
