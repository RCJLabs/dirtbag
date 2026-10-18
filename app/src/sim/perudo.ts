// Phase 36.1 (Evan's calls, 18 Oct 2026): liar's dice at the fire, played in full: Perudo.
// Everyone at the fire has a cup of five dice; ones are wild, and never bid. A bid is a count
// of a face (2 to 6) under every cup put together, and each bid has to beat the last: as many
// of a higher face, or more of any. Instead of raising you can call the last bid a lie: the
// cups come up, and whoever was wrong (the bidder if there are fewer, the caller if there are
// as many or more) loses a die. The loser opens the next round; a player with no dice is out,
// and the last cup with dice takes the game. Rolled from the seed a round at a time; the
// others bid on what's in their own cup, by their style (content/perudo.ts).

import { PEOPLE } from './content/people';
import { DICE_STYLE, PERUDO, PERUDO_STYLES } from './content/perudo';
import { GAMES } from './dials';
import { bidWords } from './fire';
import { fill } from './format';
import { Rng } from './rng';
import type { GameState } from './types';

export type Table = NonNullable<GameState['table']>;
export interface Bid {
  n: number;
  face: number;
}
export type Move = { call: true } | Bid;

// Your seat: always the first.
export const YOU = 'you';
// The faces a bid can name: ones are wild, so they're never bid.
export const FACES: readonly number[] = [2, 3, 4, 5, 6];

// How many of a cup's dice count for a face: the face, and the ones.
export const inCup = (dice: readonly number[], face: number): number =>
  dice.filter((d) => d === face || d === 1).length;
// Under every cup.
export const showing = (t: Table, face: number): number =>
  t.seats.reduce((n, p) => n + inCup(p.dice, face), 0);
// The dice still in the game.
export const inPlay = (t: Table): number => t.seats.reduce((n, p) => n + p.dice.length, 0);

// The least count of a face that beats the bid on the table: as many of a higher face, one
// more of the same face or a lower one. One, to open.
export const least = (on: Bid | null, face: number): number => (!on ? 1 : face > on.face ? on.n : on.n + 1);
export const beats = (b: Bid, on: Bid | null, dice: number): boolean =>
  FACES.includes(b.face) && Number.isInteger(b.n) && b.n >= least(on, b.face) && b.n <= dice;

// The chance that at least `k` of `m` dice nobody's seen count for a face: a third each (the
// face, or a one).
export function atLeast(k: number, m: number): number {
  if (k <= 0) return 1;
  if (k > m) return 0;
  let p = 0;
  let c = 1;
  for (let i = 0; i <= m; i++) {
    if (i > 0) c = (c * (m - i + 1)) / i;
    if (i >= k) p += c * (1 / 3) ** i * (2 / 3) ** (m - i);
  }
  return p;
}

const rng = (s: GameState, t: Table, label: string) =>
  Rng.fromStream(s.seed, 'events').derive(`perudo-${s.day}-${t.game}-${t.round}-${label}`);

// A round's cups, rolled from the seed: each keeps as many dice as it has left.
export function rolled(s: GameState, t: Table): Table['seats'] {
  return t.seats.map((p, i) => {
    const r = rng(s, t, `cup-${i}`);
    return { ...p, dice: p.dice.map(() => r.int(1, 6)) };
  });
}

// You and everyone at the fire, five dice each, the first round rolled; you open it.
export function sitDown(s: GameState, who: readonly string[], game: number): Table {
  const t: Table = {
    seats: [YOU, ...who].map((w) => ({ who: w, dice: Array.from({ length: GAMES.dice.n }, () => 0) })),
    turn: 0,
    bid: null,
    said: [],
    round: 0,
    game,
    shown: null,
    over: null,
  };
  return { ...t, seats: rolled(s, t) };
}

// The next seat round the fire that still has dice.
export function nextSeat(t: Table, from: number): number {
  for (let k = 1; k <= t.seats.length; k++) {
    const i = (from + k) % t.seats.length;
    if (t.seats[i]!.dice.length) return i;
  }
  return from;
}

// What one of the others does on their turn, from their own cup: call the bid on the table
// when it looks less likely than their `doubt`; otherwise the raise likeliest to be true
// (or, `bluff` of the time, one on the face they hold least of). They open a little under
// what they expect, by their `caution`.
export function theirMove(s: GameState, t: Table, seat: number): Move {
  const me = t.seats[seat]!;
  const style = PERUDO_STYLES[me.who] ?? DICE_STYLE;
  const unseen = inPlay(t) - me.dice.length;
  const on = t.bid;
  if (on && atLeast(on.n - inCup(me.dice, on.face), unseen) < style.doubt) return { call: true };
  const bluff = rng(s, t, `move-${seat}-${t.said.length}`).next() < style.bluff;
  let best: { bid: Bid; score: number; own: number } | null = null;
  for (const face of FACES) {
    const own = inCup(me.dice, face);
    const n = on ? least(on, face) : Math.max(1, Math.floor(own + unseen / 3 - style.caution));
    if (n > inPlay(t)) continue;
    const score = bluff ? -own : atLeast(n - own, unseen);
    if (
      !best ||
      score > best.score ||
      (score === best.score && (own > best.own || (own === best.own && face > best.bid.face)))
    )
      best = { bid: { n, face }, score, own };
  }
  return best ? best.bid : { call: true };
}

// The cups come up on a call: how many count for the bid's face, and who was wrong.
export function called(t: Table, caller: number): { count: number; loser: number } {
  const on = t.bid!;
  const count = showing(t, on.face);
  return { count, loser: count >= on.n ? caller : on.by };
}

// A call settled: the cups shown as they were, a die off the loser. The game's over when one
// cup has dice; if yours is empty, the others play it out to see who.
export function settle(s: GameState, t: Table, caller: number): Table {
  const { count, loser } = called(t, caller);
  const on = t.bid!;
  const seats = t.seats.map((p, i) => (i === loser ? { ...p, dice: p.dice.slice(1) } : p));
  const shown = {
    caller,
    by: on.by,
    n: on.n,
    face: on.face,
    count,
    loser,
    cups: t.seats.map((p) => [...p.dice]),
  };
  let next: Table = { ...t, seats, shown };
  const left = seats.filter((p) => p.dice.length);
  if (left.length === 1) next = { ...next, over: left[0]!.who };
  else if (!seats[0]!.dice.length) next = { ...next, over: playedOut(s, next) };
  return next;
}

// The round after a call: the loser opens it, or the next seat on if they're out.
export function nextRound(s: GameState, t: Table): Table {
  const loser = t.shown?.loser ?? 0;
  const turn = t.seats[loser]!.dice.length ? loser : nextSeat(t, loser);
  const next: Table = { ...t, round: t.round + 1, bid: null, said: [], shown: null, turn };
  return { ...next, seats: rolled(s, next) };
}

// The others take their turns until it's yours, or someone calls.
export function theirTurns(s: GameState, t: Table): Table {
  let cur = t;
  for (let guard = 0; guard < 200 && cur.turn !== 0 && !cur.shown && !cur.over; guard++) {
    const m = theirMove(s, cur, cur.turn);
    if ('call' in m) return settle(s, cur, cur.turn);
    cur = {
      ...cur,
      bid: { ...m, by: cur.turn },
      said: [...cur.said, { by: cur.turn, n: m.n, face: m.face }],
      turn: nextSeat(cur, cur.turn),
    };
  }
  return cur;
}

// Your cup's empty: the others play on, round after round, to the last cup. Who takes it.
export function playedOut(s: GameState, t: Table): string {
  let cur: Table = t;
  for (let guard = 0; guard < 400; guard++) {
    const left = cur.seats.filter((p) => p.dice.length);
    if (left.length <= 1) return left[0]?.who ?? YOU;
    cur = nextRound(s, { ...cur, over: null });
    for (let g = 0; g < 200 && !cur.shown; g++) {
      const m = theirMove(s, cur, cur.turn);
      if ('call' in m && cur.bid) {
        const { loser } = called(cur, cur.turn);
        cur = {
          ...cur,
          seats: cur.seats.map((p, i) => (i === loser ? { ...p, dice: p.dice.slice(1) } : p)),
          shown: {
            caller: cur.turn,
            by: cur.bid.by,
            n: cur.bid.n,
            face: cur.bid.face,
            count: 0,
            loser,
            cups: [],
          },
        };
      } else if (!('call' in m)) {
        cur = {
          ...cur,
          bid: { ...m, by: cur.turn },
          said: [...cur.said, { by: cur.turn, ...m }],
          turn: nextSeat(cur, cur.turn),
        };
      } else break;
    }
  }
  return cur.seats.find((p) => p.dice.length)?.who ?? YOU;
}

// A call settled, in words: what the cups showed, who lost a die, and who's out or took it.
// The night's lines and the table say the same.
export function callLines(t: Table): string[] {
  const sh = t.shown;
  if (!sh) return [];
  const named = (w: string) => (w === YOU ? 'You' : (PEOPLE[w]?.name ?? w));
  const you = (w: string, yours: string, theirs: string) => (w === YOU ? yours : theirs);
  const caller = t.seats[sh.caller]!.who;
  const loser = t.seats[sh.loser]!.who;
  const lines = [
    `${fill(PERUDO.call, {
      caller: named(caller),
      calls: you(caller, 'call', 'calls'),
      bid: bidWords(sh.n, sh.face),
      count: bidWords(sh.count, sh.face),
    })} ${fill(PERUDO.loses, { who: named(loser), loses: you(loser, 'lose', 'loses') })}`,
  ];
  // Out, unless that was the game: the last line says who took it. Yours is said either way.
  if (!t.seats[sh.loser]!.dice.length && (!t.over || loser === YOU))
    lines.push(fill(PERUDO.out, { who: named(loser), is: you(loser, 'are', 'is') }));
  // Out yourself with others still in, the game was played out unseen (`playedOut`), their cups
  // as they were when you went out.
  const unseen = t.seats.filter((p) => p.dice.length).length > 1;
  if (t.over)
    lines.push(
      t.over === YOU
        ? PERUDO.youWon
        : fill(unseen ? PERUDO.wonWithout : PERUDO.won, { who: named(t.over), takes: 'takes' }),
    );
  return lines;
}
