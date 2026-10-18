// Phase 36.3 (Evan's calls, 18 Oct 2026): hold'em round the fire, everyone in, fixed limit.
// You and everyone at the fire who plays, two cards each; blinds in place of antes, the button
// going round a seat a hand; four streets, a small bet before the flop and on it and a big one
// on the turn and the river, and at most `raises` raises on a street's first bet. The others
// play their styles (content/cards.ts) against the field they face, and once you've the second
// read on someone, their tells show when they bet. Short of a call you're all in, for the
// money that matched yours. Dealt from the seed, a fresh deck a hand. The money counted is
// yours alone: theirs never runs out.

import { PEOPLE } from './content/people';
import { STYLES } from './content/cards';
import { GAMES } from './dials';
import { boardAt, cardsName, deckFor, equity, handValue, handWord, readsOn, theyKnow } from './cards';
import { money } from './format';
import { YOU } from './perudo';
import { Rng } from './rng';
import type { GameState } from './types';

export type Holdem = NonNullable<NonNullable<GameState['cards']>['he']>;
// A move: `call` checks when there's nothing to call, and `bet` raises when there is.
export type Move = 'fold' | 'call' | 'bet';

// The bet on a street: the small one before the flop and on it, the big one after.
export const betOn = (street: number): number => GAMES.holdem.bets[street < 2 ? 0 : 1]!;
// The most bets a street takes: the first, and its raises.
const MOST = GAMES.holdem.raises + 1;
export const canRaise = (h: Holdem): boolean => h.bets < MOST;
// What a seat owes to stay in.
export const owes = (h: Holdem, seat: number): number => h.bet - h.seats[seat]!.put;
export const stillIn = (h: Holdem): number => h.seats.filter((p) => p.in).length;
export const nameOf = (w: string): string => (w === YOU ? 'You' : (PEOPLE[w]?.name ?? w));

// The next seat round the fire that can still move: in, and not all in.
function nextSeat(h: Holdem, from: number): number {
  const n = h.seats.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (h.seats[i]!.in && !h.seats[i]!.all) return i;
  }
  return from;
}

// Money in from a seat: yours only as far as what's in front of you goes (`left`), and all in
// once that's all of it.
function putIn(h: Holdem, seat: number, x: number, left: number): Holdem {
  return {
    ...h,
    seats: h.seats.map((p, i) => {
      if (i !== seat) return p;
      const pay = i === 0 ? Math.min(x, left) : x;
      return { ...p, put: p.put + pay, total: p.total + pay, all: p.all || (i === 0 && pay >= left) };
    }),
  };
}

// A hand dealt to you and the players at the fire: the blinds posted (heads-up, the button's
// the small), and the first to move before the flop the seat after the big blind.
export function deal(s: GameState, who: readonly string[], hands: number, left: number): Holdem {
  const deck = deckFor(s, `he-${s.day}-${hands}`);
  const n = who.length + 1;
  const seats = [YOU, ...who].map((w, i) => ({
    who: w,
    hole: [deck[2 * i]!, deck[2 * i + 1]!],
    in: true,
    put: 0,
    total: 0,
    acted: false,
    all: false,
  }));
  const button = hands % n;
  const sb = n === 2 ? button : (button + 1) % n;
  const bb = (sb + 1) % n;
  const [small, big] = GAMES.holdem.blinds as [number, number];
  let h: Holdem = {
    seats,
    board: deck.slice(2 * n, 2 * n + 5),
    street: 0,
    button,
    turn: 0,
    bet: big,
    bets: 1,
    pot: 0,
    said: [],
    won: null,
  };
  h = putIn(h, sb, small, left);
  h = putIn(h, bb, big, left - h.seats[0]!.total);
  const first = n === 2 ? sb : (bb + 1) % n;
  const p = h.seats[first]!;
  return { ...h, turn: p.in && !p.all ? first : nextSeat(h, first) };
}

// A street's betting is done once everyone still in has moved since the last raise and put in
// the bet, or is all in.
const streetDone = (h: Holdem): boolean =>
  h.seats.every((p) => !p.in || p.all || (p.acted && p.put === h.bet));

// After a move: over (street 4) if one's left in, or after the river, or with nobody left to
// bet against; on to the next street once this one's done; otherwise the next seat's move.
function onward(h: Holdem): Holdem {
  if (stillIn(h) === 1) return { ...h, street: 4 };
  if (!streetDone(h)) return { ...h, turn: nextSeat(h, h.turn) };
  const movers = h.seats.filter((p) => p.in && !p.all).length;
  if (h.street === 3 || movers <= 1) return { ...h, street: 4 };
  const next: Holdem = {
    ...h,
    seats: h.seats.map((p) => ({ ...p, put: 0, acted: false })),
    pot: h.pot + h.seats.reduce((t, p) => t + p.put, 0),
    street: h.street + 1,
    bet: 0,
    bets: 0,
  };
  return { ...next, turn: nextSeat(next, next.button) };
}

// One move by a seat. A raise past the street's last is a call.
export function play(h: Holdem, seat: number, m: Move, left: number, sign?: string): Holdem {
  const owe = owes(h, seat);
  let next: Holdem;
  let did: string;
  if (m === 'fold' && owe > 0) {
    next = { ...h, seats: h.seats.map((p, i) => (i === seat ? { ...p, in: false } : p)) };
    did = 'folds';
  } else if (m !== 'bet' || !canRaise(h) || (seat === 0 && left <= owe)) {
    next = putIn(h, seat, owe, left);
    did = owe > 0 ? (next.seats[seat]!.put < h.bet ? 'calls, all in' : 'calls') : 'checks';
  } else {
    next = putIn(h, seat, owe + betOn(h.street), left);
    const put = next.seats[seat]!.put;
    did = h.bet === 0 ? 'bets' : 'raises';
    if (put > h.bet)
      next = {
        ...next,
        bet: put,
        bets: h.bets + 1,
        seats: next.seats.map((p, i) => (i === seat ? p : { ...p, acted: false })),
      };
  }
  next = {
    ...next,
    seats: next.seats.map((p, i) => (i === seat ? { ...p, acted: true } : p)),
    said: [...h.said, { by: seat, did, street: h.street, ...(sign ? { sign } : {}) }],
  };
  return onward(next);
}

// What one of the others does: their style against the field still in. They call a bet with a
// hand that beats the field `call` of a fair share, raise or bet one that beats it `bet` of a
// fair share (a raise wants more the more bets there are), and bluff `bluff` of the hands they'd
// check. Against your bets, lighter once you've been caught at it. With the second read on them,
// a bet or a raise shows their tell: right `tell` of the time.
export function theirMove(s: GameState, h: Holdem, seat: number, label: string): { m: Move; sign?: string } {
  const p = h.seats[seat]!;
  const st = STYLES[p.who] ?? STYLES.hazel!;
  const field = stillIn(h) - 1;
  const fair = 2 / (field + 1);
  const e = equity(p.hole, h.board.slice(0, boardAt(h.street)), `${label}-eq`, s, field);
  const r = Rng.fromStream(s.seed, 'events').derive(`${label}-mind`);
  const bluff = r.next() < st.bluff;
  const last = [...h.said]
    .reverse()
    .find((x) => x.street === h.street && (x.did === 'bets' || x.did === 'raises'));
  const lean = last?.by === 0 ? GAMES.holdem.adapt * theyKnow(s, p.who) : 0;
  const strong = e >= st.bet * fair;
  const owe = owes(h, seat);
  const m: Move =
    owe > 0
      ? canRaise(h) && e >= (st.bet + 0.1 * (h.bets - 1)) * fair
        ? 'bet'
        : e >= (st.call - lean) * fair
          ? 'call'
          : 'fold'
      : canRaise(h) && (strong || bluff)
        ? 'bet'
        : 'call';
  if (m !== 'bet' || !st.signs || readsOn(s, p.who).length < 2) return { m };
  const honest = r.next() < GAMES.holdem.tell;
  return { m, sign: strong === honest ? st.signs.strong : st.signs.bluff };
}

// The others move till it's yours, or the hand's over.
export function theirTurns(s: GameState, h: Holdem, hands: number): Holdem {
  let cur = h;
  for (let g = 0; g < 200 && cur.street < 4 && cur.turn !== 0; g++) {
    const { m, sign } = theirMove(
      s,
      cur,
      cur.turn,
      `he-${s.day}-${hands}-${cur.street}-${cur.turn}-${cur.said.length}`,
    );
    cur = play(cur, cur.turn, m, 0, sign);
  }
  return cur;
}

// The hand over: who takes it, and what comes back to you. Uncontested, the last one in takes
// everything; at the showdown the best hand does, split on a tie. Yours is the money that
// matched yours from every seat, folded or not: all in for less, the rest is theirs to fight
// over.
export function showdown(h: Holdem): NonNullable<Holdem['won']> {
  const ins = h.seats.map((p, i) => ({ p, i })).filter((x) => x.p.in);
  const pot = h.seats.reduce((t, p) => t + p.total, 0);
  if (ins.length === 1) return { by: [ins[0]!.i], back: ins[0]!.i === 0 ? pot : 0, shown: false };
  const value = (p: Holdem['seats'][number]) => handValue([...p.hole, ...h.board]);
  const best = Math.max(...ins.map((x) => value(x.p)));
  const by = ins.filter((x) => value(x.p) === best).map((x) => x.i);
  if (!by.includes(0)) return { by, back: 0, shown: true };
  const mine = h.seats[0]!.total;
  const main = h.seats.reduce((t, p) => t + Math.min(p.total, mine), 0);
  return { by, back: main / by.length, shown: true };
}

// The hand's end in words: who showed what, and who took how much.
export function holdemLines(h: Holdem): string[] {
  const won = h.won;
  if (!won) return [];
  const pot = h.seats.reduce((t, p) => t + p.total, 0);
  const names = won.by.map((i) => nameOf(h.seats[i]!.who));
  if (!won.shown)
    return [
      won.by[0] === 0
        ? `Everyone else folds. You take ${money(pot)}.`
        : `${names[0]} takes ${money(pot)}, and nobody sees the cards.`,
    ];
  const shown = h.seats
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p.in && x.i !== 0)
    .map((x) => `${nameOf(x.p.who)} shows ${cardsName(x.p.hole)}, ${handWord([...x.p.hole, ...h.board])}.`);
  const you = h.seats[0]!.in ? `You have ${handWord([...h.seats[0]!.hole, ...h.board])}.` : '';
  const end =
    won.by.length > 1
      ? won.by.includes(0)
        ? `A split pot: ${money(won.back)} back to you.`
        : `${names.join(' and ')} split it.`
      : won.by[0] === 0
        ? `You take ${money(won.back)}.`
        : `${names[0]} takes it.`;
  return [[...shown, you, end].filter(Boolean).join(' ')];
}
