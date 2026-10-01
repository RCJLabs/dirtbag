// Cards at the fire (Phase 22.9b): blackjack for money, and heads-up hold'em for money that
// keeps reads on each person. Both are dealt from the seed, a fresh deck a hand; the numbers
// are GAMES.bj and GAMES.holdem (dials.ts), the people's styles content/cards.ts.

import { isNight } from './cond';
import { STYLES } from './content/cards';
import { PEOPLE } from './content/people';
import { atFire } from './fire';
import { GAMES } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';

// A card is 0–51: rank (0 = two … 12 = ace) and suit.
export const rank = (c: number): number => c % 13;
export const suit = (c: number): number => Math.floor(c / 13);
const RANKS = '23456789TJQKA';
const SUITS = '♠♥♦♣';
export const cardName = (c: number): string =>
  `${RANKS[rank(c)] === 'T' ? '10' : RANKS[rank(c)]}${SUITS[suit(c)]}`;
export const cardsName = (cs: number[]): string => cs.map(cardName).join(' ');

// A fresh deck for one hand, shuffled from the seed.
export function deckFor(s: GameState, label: string): number[] {
  const r = Rng.fromStream(s.seed, 'events').derive(label);
  const d = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 51; i > 0; i--) {
    const j = r.int(0, i);
    [d[i], d[j]] = [d[j]!, d[i]!];
  }
  return d;
}

export type Cards = NonNullable<GameState['cards']>;
export type CardGame = Cards['game'];
export const CARD_NAME: Record<CardGame, string> = { bj: 'Blackjack', holdem: 'Hold’em' };

// What you need in front of you to play a hand: a bet, or every bet a hold'em hand can ask.
export const handNeeds = (g: CardGame): number =>
  g === 'bj' ? GAMES.bj.bet : GAMES.holdem.ante + GAMES.holdem.bets.reduce((a, b) => a + b, 0);

export function cardsBlocked(s: GameState, g: CardGame, who?: string): string | null {
  if (s.at !== 'lot') return 'The cards are at the fire at the Lot';
  if (!isNight(s.min)) return 'Nobody’s dealing till dark';
  if (!atFire(s).length) return 'Nobody’s at the fire tonight';
  if (who && !atFire(s).includes(who)) return `${PEOPLE[who]?.name ?? who} isn’t at the fire tonight`;
  if (s.today.includes(g)) return `You’ve played ${CARD_NAME[g].toLowerCase()} tonight`;
  if (s.energy < GAMES.energy) return 'Too tired for cards';
  if (Math.floor(s.cash) < handNeeds(g)) return `You need ${'$'}${handNeeds(g)} in hand to sit down`;
  if (g === 'holdem' && who && !STYLES[who]) return 'They don’t play';
  return null;
}

// ---- blackjack ----

// A hand's total, aces counted high while they fit, and whether one still is (soft).
export function bjTotal(cs: number[]): { n: number; soft: boolean } {
  let n = 0;
  let aces = 0;
  for (const c of cs) {
    const r = rank(c);
    if (r === 12) {
      aces++;
      n += 11;
    } else n += r >= 8 ? 10 : r + 2;
  }
  while (n > 21 && aces) {
    n -= 10;
    aces--;
  }
  return { n, soft: aces > 0 };
}
export const isBlackjack = (cs: number[]): boolean => cs.length === 2 && bjTotal(cs).n === 21;

export const bjDeck = (s: GameState, hands: number): number[] => deckFor(s, `bj-${s.day}-${hands}`);

// The dealer draws to 17 and stands on every 17, soft ones too.
export function dealerPlays(
  dealer: number[],
  deck: number[],
  next: number,
): { dealer: number[]; next: number } {
  const d = [...dealer];
  let i = next;
  while (bjTotal(d).n < 17) d.push(deck[i++]!);
  return { dealer: d, next: i };
}

// What a finished hand pays back, the bet included: a blackjack 3:2, a win even, a push the
// bet, a loss nothing.
export function bjSettle(you: number[], dealer: number[], bet: number): { back: number; how: string } {
  const y = bjTotal(you).n;
  const d = bjTotal(dealer).n;
  if (y > 21) return { back: 0, how: 'bust' };
  // 3:2, to the dollar up: a $5 blackjack pays $8.
  if (isBlackjack(you) && !isBlackjack(dealer))
    return { back: bet + Math.ceil((bet * 3) / 2), how: 'blackjack' };
  if (isBlackjack(dealer) && !isBlackjack(you)) return { back: 0, how: 'dealer blackjack' };
  if (d > 21) return { back: bet * 2, how: 'dealer bust' };
  if (y > d) return { back: bet * 2, how: 'win' };
  if (y === d) return { back: bet, how: 'push' };
  return { back: 0, how: 'lose' };
}

// ---- hold'em ----

// A 5-to-7-card hand's value: higher beats lower. Category (high card 0 … straight flush 8),
// then the ranks that break ties, in base 13.
export function handValue(cs: number[]): number {
  const counts = new Array<number>(13).fill(0);
  const bySuit: number[][] = [[], [], [], []];
  for (const c of cs) {
    counts[rank(c)]!++;
    bySuit[suit(c)]!.push(rank(c));
  }
  const straightTop = (ranks: Set<number>): number => {
    for (let top = 12; top >= 4; top--) if ([0, 1, 2, 3, 4].every((k) => ranks.has(top - k))) return top;
    // The wheel: A-2-3-4-5, the ace low.
    if ([12, 0, 1, 2, 3].every((r) => ranks.has(r))) return 3;
    return -1;
  };
  const score = (cat: number, ks: number[]): number => {
    let v = cat;
    for (let i = 0; i < 5; i++) v = v * 13 + (ks[i] ?? 0);
    return v;
  };
  const flush = bySuit.find((x) => x.length >= 5);
  if (flush) {
    const sf = straightTop(new Set(flush));
    if (sf >= 0) return score(8, [sf]);
  }
  const desc = (pred: (r: number) => boolean) => {
    const out: number[] = [];
    for (let r = 12; r >= 0; r--) if (pred(r)) out.push(r);
    return out;
  };
  const quads = desc((r) => counts[r]! === 4);
  const trips = desc((r) => counts[r]! === 3);
  const pairs = desc((r) => counts[r]! === 2);
  const kick = (skip: number[], n: number) => desc((r) => counts[r]! > 0 && !skip.includes(r)).slice(0, n);
  if (quads.length) return score(7, [quads[0]!, ...kick([quads[0]!], 1)]);
  if (trips.length && (trips.length > 1 || pairs.length)) {
    const t = trips[0]!;
    const p = Math.max(trips[1] ?? -1, pairs[0] ?? -1);
    return score(6, [t, p]);
  }
  if (flush) return score(5, [...flush].sort((a, b) => b - a).slice(0, 5));
  const st = straightTop(new Set(desc((r) => counts[r]! > 0)));
  if (st >= 0) return score(4, [st]);
  if (trips.length) return score(3, [trips[0]!, ...kick([trips[0]!], 2)]);
  if (pairs.length >= 2) return score(2, [pairs[0]!, pairs[1]!, ...kick([pairs[0]!, pairs[1]!], 1)]);
  if (pairs.length) return score(1, [pairs[0]!, ...kick([pairs[0]!], 3)]);
  return score(0, kick([], 5));
}

const CATEGORY = [
  'high card',
  'a pair',
  'two pair',
  'three of a kind',
  'a straight',
  'a flush',
  'a full house',
  'four of a kind',
  'a straight flush',
];
export const handWord = (cs: number[]): string => CATEGORY[Math.floor(handValue(cs) / 13 ** 5)]!;

// How often a hand wins against a random one by the river, from what it can see: a seeded
// sample of the cards it can't.
export function equity(hole: number[], board: number[], label: string, s: GameState): number {
  const r = Rng.fromStream(s.seed, 'events').derive(label);
  const seen = new Set([...hole, ...board]);
  const rest = Array.from({ length: 52 }, (_, i) => i).filter((c) => !seen.has(c));
  let won = 0;
  const n = GAMES.holdem.samples;
  for (let k = 0; k < n; k++) {
    const pool = [...rest];
    const take = () => pool.splice(r.int(0, pool.length - 1), 1)[0]!;
    const opp = [take(), take()];
    const b = [...board];
    while (b.length < 5) b.push(take());
    const me = handValue([...hole, ...b]);
    const them = handValue([...opp, ...b]);
    won += me > them ? 1 : me === them ? 0.5 : 0;
  }
  return won / n;
}

// How much of the board is showing on a street: none, the flop, then all five.
export const boardAt = (street: number): number => (street === 0 ? 0 : street === 1 ? 3 : 5);

// What they've learned about you: how often you've been caught betting a loser, as a share of
// the hands you've played them, which loosens their calls.
export function theyKnow(s: GameState, who: string): number {
  const r = s.reads[who];
  if (!r || r.hands < GAMES.holdem.reads[0]!) return 0;
  return Math.min(1, r.caught / r.hands / GAMES.holdem.caughtShare);
}

// Their move on a street: call your bet or fold; or, when you've checked, bet or check.
export function theirMove(
  s: GameState,
  he: NonNullable<Cards['he']>,
  who: string,
  facing: boolean,
  hands: number,
): 'call' | 'fold' | 'bet' | 'check' {
  const st = STYLES[who]!;
  const label = `he-${who}-${s.day}-${hands}-${he.street}`;
  const e = equity(he.them, he.board.slice(0, boardAt(he.street)), `${label}-eq`, s);
  if (facing) return e >= st.call - GAMES.holdem.adapt * theyKnow(s, who) ? 'call' : 'fold';
  const bluff = Rng.fromStream(s.seed, 'events').derive(`${label}-bluff`).next() < st.bluff;
  return e >= st.bet || bluff ? 'bet' : 'check';
}

// The reads you've earned on someone: how they bet, from the first count of hands played,
// and how often they bluff, from the second.
export function readsOn(s: GameState, who: string): string[] {
  const st = STYLES[who];
  const r = s.reads[who];
  if (!st || !r) return [];
  const name = PEOPLE[who]?.name ?? who;
  const all = [st.read, `${name} bluffs about one hand in ${Math.round(1 / st.bluff)}. ${st.tell}`];
  return all.filter((_, i) => r.hands >= GAMES.holdem.reads[i]!);
}
