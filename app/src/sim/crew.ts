// Phase 25.6: crew drama. Two partners both ask for the same day; whoever you let down falls
// out with the other, and keeps away from wherever they are. Weeks later the one you picked
// asks about it, and you can try to get them back in a room. Once a life.

import { CREW } from './dials';
import { tierOf } from './presence';
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
