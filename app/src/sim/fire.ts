// The fire at night (Phase 22.9a): who's there, and the games. Horseshoes' throws come from
// the player's hands (a beat, as busking's), the others' from the seed; liar's dice is dealt
// from the seed and played a call at a time. The numbers are GAMES (dials.ts).

import { PEOPLE } from './content/people';
import { isNight } from './cond';
import { GAMES } from './dials';
import { tierOf, whereNow } from './presence';
import { Rng } from './rng';
import type { GameState } from './types';

// Who's at the fire tonight: Hazel, who lives at the Lot, Sage some nights, once you're
// regulars, and Frank if you've asked him over (Phase 17.5) and his rig's here.
export function atFire(s: GameState): string[] {
  if (s.at !== 'lot' || !isNight(s.min)) return [];
  const out: string[] = [];
  if (s.people.hazel || PEOPLE.hazel?.known) out.push('hazel');
  if (s.today.includes('fire-frank') && whereNow(s, 'frank') === 'lot') out.push('frank');
  const sage = s.people.sage;
  if (sage && tierOf(sage.bond) >= 2 && !(sage.away !== undefined && s.day < sage.away)) {
    if (Rng.fromStream(s.seed, 'events').derive(`sage-fire-${s.day}`).next() < GAMES.sage) out.push('sage');
  }
  return out;
}

export type Game = 'shoes' | 'dice';
export const GAME_NAME: Record<Game, string> = { shoes: 'Horseshoes', dice: 'Liar’s dice' };

export function gameBlocked(s: GameState, g: Game): string | null {
  if (s.at !== 'lot') return 'The games are at the fire at the Lot';
  if (!isNight(s.min)) return 'Nobody’s at the fire till dark';
  if (!atFire(s).length) return 'Nobody’s at the fire tonight';
  if (s.today.includes(g)) return `You’ve played ${GAME_NAME[g].toLowerCase()} tonight`;
  if (s.energy < GAMES.energy) return 'Too tired for games';
  return null;
}

// A throw's points, from how near the middle of the band it landed (1 clean, a half near).
export const throwPoints = (score: number): number =>
  score >= 1 ? GAMES.shoes.ringer : score > 0 ? GAMES.shoes.leaner : 0;

// Someone else's four throws tonight: their points.
export function theirShoes(s: GameState, who: string): number {
  const r = Rng.fromStream(s.seed, 'events').derive(`shoes-${who}-${s.day}`);
  let n = 0;
  for (let i = 0; i < GAMES.shoes.throws; i++) {
    const x = r.next();
    n +=
      x < GAMES.shoes.odds
        ? GAMES.shoes.ringer
        : x < GAMES.shoes.odds + GAMES.shoes.lean
          ? GAMES.shoes.leaner
          : 0;
  }
  return n;
}

// Liar's dice: a hand dealt from the seed, and their opening bid on the face they hold most
// of: what they hold and no more (safe), one more (what your cup is likely to add), or two
// (a bluff), `bids` of the time each.
export function dealDice(s: GameState, who: string): NonNullable<GameState['table']> {
  const r = Rng.fromStream(s.seed, 'events').derive(`dice-${who}-${s.day}`);
  const roll = () => Array.from({ length: GAMES.dice.n }, () => r.int(1, 6));
  const mine = roll();
  const theirs = roll();
  const face = mostOf(theirs);
  const x = r.next();
  const [safe, fair] = GAMES.dice.bids;
  const over = x < safe! ? 0 : x < safe! + fair! ? 1 : 2;
  return { who, mine, theirs, bid: { n: count(theirs, face) + over, face } };
}

// A bid in words: "three 5s".
const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const bidWords = (n: number, face: number): string => `${WORD[n] ?? n} ${face}${n === 1 ? '' : 's'}`;

// Your ringers, to open a sentence: "Two ringers", "No ringers".
export const ringersSaid = (n: number): string => {
  const w = `${WORD[n] ?? n} ringer${n === 1 ? '' : 's'}`;
  return `${w[0]!.toUpperCase()}${w.slice(1)}`;
};

export const bidSaid = (n: number, face: number): string => {
  const w = bidWords(n, face);
  return `${w[0]!.toUpperCase()}${w.slice(1)}`;
};

export const count = (dice: number[], face: number): number => dice.filter((d) => d === face).length;
export function mostOf(dice: number[]): number {
  let best = 6;
  for (let f = 6; f >= 1; f--) if (count(dice, f) > count(dice, best)) best = f;
  return best;
}

// Your raise: the least that beats their bid on the face you hold most of: the same count on
// a higher face, or one more.
export function yourRaise(t: NonNullable<GameState['table']>): { n: number; face: number } {
  const face = mostOf(t.mine);
  return { n: face > t.bid.face ? t.bid.n : t.bid.n + 1, face };
}

// Whether they call your raise: when it needs more than `call` of your dice, past what they hold.
export const theyCall = (t: NonNullable<GameState['table']>, bid: { n: number; face: number }): boolean =>
  bid.n - count(t.theirs, bid.face) > GAMES.dice.call;
