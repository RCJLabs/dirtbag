// The balance harness: bots play whole seasons on the sim, and this reads the curves Phase
// 6's targets are written against. Pure like the rest of the sim; `npm run harness` prints
// the tables (harness/season.harness.ts).

import { humanHands, playDays, type BotRun, type Strategy } from './bot';
import { bjTotal, boardAt, equity, handNeeds } from './cards';
import { GAMES } from './dials';
import { atFire } from './fire';
import { act, newGame } from './game';
import type { Action, GameState } from './types';
import { Rng } from './rng';
import { runway } from './tonight';

// Runway is the van's own measure (tonight.ts): the harness and the player read the same one.
export { BASE_BURN, runway } from './tonight';

export interface SeasonOpts {
  start: string;
  strategy: Strategy;
  days: number;
  // Human-ish hands (seeded per go) or careful ones.
  human: boolean;
  reckless?: boolean;
}

export function season(seed: string, o: SeasonOpts): BotRun {
  let n = 0;
  return playDays(seed, {
    start: o.start,
    strategy: o.strategy,
    days: o.days,
    reckless: o.reckless,
    hands: o.human ? () => humanHands(Rng.fromStream(seed, 'session').derive(`bot-go-${n++}`)) : undefined,
  });
}

export interface Checkpoint {
  day: number;
  grade: number;
  cash: number;
  runway: number;
  // Days worked in the seven days up to here.
  workDays: number;
  sends: number;
}

export function checkpoints(run: BotRun, at: number[]): Checkpoint[] {
  return at.map((day) => {
    const d = run.days[day - 1];
    if (!d) throw new Error(`the run ended before day ${day}`);
    const week = run.days.slice(Math.max(0, day - 7), day);
    return {
      day,
      grade: d.grade,
      cash: d.cash,
      runway: runway(d.cash),
      workDays: week.filter((w) => w.workMin > 0).length,
      sends: run.sends.filter((x) => Number(/^day (\d+)/.exec(x)?.[1]) <= day).length,
    };
  });
}

// The first day the bot tied into a line of this grade or harder, or null.
export const firstTry = (run: BotRun, grade: number): number | null =>
  run.days.find((d) => d.hardest >= grade)?.day ?? null;

// The first day an injury landed, or null.
export const firstInjury = (run: BotRun): number | null =>
  run.injuries.length ? Number(/^day (\d+)/.exec(run.injuries[0]!)?.[1]) : null;

// The first day there was nothing new left within reach anywhere, or null. Days the body
// kept you off the rock ("resting") don't count: the lines were still there.
export const contentOut = (run: BotRun): number | null =>
  run.days.find((d) => d.where === 'nothing')?.day ?? null;

export const median = (xs: number[]): number => {
  const a = [...xs].sort((x, y) => x - y);
  return a.length ? (a[Math.floor((a.length - 1) / 2)]! + a[Math.ceil((a.length - 1) / 2)]!) / 2 : NaN;
};

// Phase 22's criterion 2, for the games at the fire (22.9): over `nights` nights with Hazel
// and Sage both up, what each game pays an hour. Bond is the most anyone's moved in a day
// with every game played; money is the night's net at blackjack by the book, and at hold'em
// three plain ways: always bet, always call, and on the hand's odds.
export function gamesAtFire(seed: string, nights: number) {
  const base: GameState = {
    ...act(newGame(seed), { t: 'create', name: 'Bot', start: 'allrounder' }).state,
    people: { hazel: { bond: 10, last: 0 }, sage: { bond: 40, last: 0 } },
  };
  const night = (s: GameState, d: number): GameState => ({
    ...s,
    day: d,
    min: 21 * 60,
    energy: 100,
    cash: 200,
    today: [],
  });
  const hours = GAMES.min / 60;
  // Bond: a night of every game, on nights both are up; the most anyone gained in one.
  let bondDay = 0;
  let s = base;
  for (let d = 1, n = 0; n < nights; d++) {
    s = night(s, d);
    if (!atFire(s).includes('sage')) continue;
    n++;
    const was = { ...s.people };
    s = act(s, { t: 'shoes', throws: [1, 0.5, 0, 1] }).state;
    s = act(s, { t: 'dice', do: 'deal' }).state;
    s = act(s, { t: 'dice', do: 'call' }).state;
    for (const g of ['bj', 'holdem'] as const) {
      s = act(s, { t: g, do: 'sit' } as Action).state;
      s = act(s, { t: g, do: 'leave' } as Action).state;
    }
    for (const w of Object.keys(was)) bondDay = Math.max(bondDay, s.people[w]!.bond - was[w]!.bond);
  }
  // Blackjack by the book: hit to 17 against a 7 or better, to 12 otherwise, soft to 18;
  // double 11, and 10 against a 9 or worse.
  let bj = 0;
  s = base;
  for (let d = 1; d <= nights; d++) {
    s = act(night(s, d), { t: 'bj', do: 'sit' }).state;
    const start = s.cards!.chips;
    while (s.cards!.hands < GAMES.bj.hands && s.cards!.chips >= GAMES.bj.bet) {
      s = act(s, { t: 'bj', do: 'deal' }).state;
      while (s.cards!.bj) {
        const h = s.cards!.bj;
        const y = bjTotal(h.you);
        const up = bjTotal([h.dealer[0]!]).n;
        const dbl =
          h.you.length === 2 && !y.soft && (y.n === 11 || (y.n === 10 && up < 10)) && s.cards!.chips >= h.bet;
        const hit = y.soft ? y.n <= 17 : y.n <= 11 || (y.n <= 16 && up >= 7);
        s = act(s, { t: 'bj', do: dbl ? 'double' : hit ? 'hit' : 'stand' }).state;
      }
    }
    bj += s.cards!.chips - start;
    s = act(s, { t: 'bj', do: 'leave' }).state;
  }
  const holdem = (way: 'bet' | 'call' | 'odds', who: string) => {
    let net = 0;
    let t = base;
    for (let d = 1, n = 0; n < nights; d++) {
      t = night(t, d);
      if (!atFire(t).includes(who)) continue;
      n++;
      t = act(t, { t: 'holdem', do: 'sit', who }).state;
      const start = t.cards!.chips;
      while (t.cards!.hands < GAMES.holdem.hands && t.cards!.chips >= handNeeds('holdem')) {
        t = act(t, { t: 'holdem', do: 'deal' }).state;
        for (let g = 0; t.cards!.he && g < 10; g++) {
          const he = t.cards!.he;
          const e = equity(
            he.you,
            he.board.slice(0, boardAt(he.street)),
            `bot-${d}-${t.cards!.hands}-${he.street}`,
            t,
          );
          const call = way === 'odds' ? e > 0.45 : true;
          const bet = way === 'bet' || (way === 'odds' && e > 0.6);
          t = act(t, { t: 'holdem', do: he.facing ? (call ? 'call' : 'fold') : bet ? 'bet' : 'call' }).state;
        }
      }
      net += t.cards!.chips - start;
      t = act(t, { t: 'holdem', do: 'leave' }).state;
    }
    return net / nights / hours;
  };
  const ways = ['bet', 'call', 'odds'] as const;
  return {
    bondDay,
    bj: bj / nights / hours,
    holdem: Object.fromEntries(
      ['hazel', 'sage'].flatMap((w) => ways.map((k) => [`${w} ${k}`, holdem(k, w)])),
    ) as Record<string, number>,
  };
}
