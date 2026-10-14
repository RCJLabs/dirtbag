// Phase 28.3: favours, both ways. You ask the crew to cover a shift, lend a rack or drive you;
// each of them asks back once in a while, on a day the seed picks, and a no costs bond. You
// can owe any one of them two (Evan's call), and no third till you've done one back.

import { crewOf } from './crew';
import { CREW, FAVOUR } from './dials';
import { Rng } from './rng';
import type { FavourAsk, GameState } from './types';

const ASKS: FavourAsk[] = ['belay', 'ride', 'loan'];

// Each `every` days is a window; in each, a partner asks on one day the seed picks.
const windowOf = (day: number): number => Math.floor(day / FAVOUR.every);
const askDay = (seed: string, who: string, w: number): number =>
  w * FAVOUR.every +
  Rng.fromStream(seed, 'events')
    .derive(`favour-${who}-${w}`)
    .int(0, FAVOUR.every - 1);

// What they'll ask this window.
export const favourKind = (seed: string, who: string, day: number): FavourAsk =>
  ASKS[
    Rng.fromStream(seed, 'events')
      .derive(`favour-kind-${who}-${windowOf(day)}`)
      .int(0, ASKS.length - 1)
  ]!;

// What one of the crew has to ask you today, if anything: their day in this window come, and
// not yet answered in it.
export function favourAsk(s: GameState, who: string): FavourAsk | null {
  if (!crewOf(s).includes(who)) return null;
  const w = windowOf(s.day);
  if (s.day < askDay(s.seed, who, w)) return null;
  const answered = s.people[who]?.favour;
  if (answered !== undefined && answered >= w * FAVOUR.every) return null;
  return favourKind(s.seed, who, s.day);
}

// Two of them want your day (Phase 25.6's drama, by another door): an ask for your time from
// one of the crew after you've said yes to another's today, while nobody's fallen out yet.
// Hazel stays out of it: her talk has no mend.
export function clashWith(s: GameState, who: string): string | null {
  if (s.crew || s.day < CREW.from || !CREW.who.includes(who)) return null;
  const k = favourAsk(s, who);
  if (k !== 'belay' && k !== 'ride') return null;
  return CREW.who.find((b) => b !== who && s.today.includes(`favour-yes-${b}`)) ?? null;
}

// The talk's conditions: "who/kind" for an ask, "who/b" for the clash.
export const favourDue = (s: GameState, ref: string): boolean => {
  const [who, kind] = ref.split('/');
  return !!who && favourAsk(s, who) === kind && !clashWith(s, who);
};
export const clashDue = (s: GameState, ref: string): boolean => {
  const [who, b] = ref.split('/');
  return !!who && clashWith(s, who) === b;
};

// Whether a friend's driving you today.
export const riding = (s: GameState): boolean => s.today.some((f) => f.startsWith('ride-'));
