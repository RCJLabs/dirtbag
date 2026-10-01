// Phase 22.9b: cards at the fire. Blackjack for money under a nightly cap, and heads-up
// hold'em for money that keeps reads on each person, and lets them read you back. Neither
// is a living: played well, each is about even.
import { describe, expect, it } from 'vitest';
import {
  bjSettle,
  bjTotal,
  boardAt,
  cardsBlocked,
  equity,
  handValue,
  handWord,
  readsOn,
  theyKnow,
} from './cards';
import { STYLES } from './content/cards';
import { ACTS } from './content/places';
import { GAMES } from './dials';
import { act, newGame } from './game';
import { fromSave, toSave } from './save';
import type { Action, GameState } from './types';

// Cards by name: "As", "Td", "2c".
const C = (x: string): number => '23456789TJQKA'.indexOf(x[0]!) + 13 * 'shdc'.indexOf(x[1]!);
const H = (x: string): number[] => x.split(' ').map(C);

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('cards'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  min: 21 * 60,
  energy: 80,
  cash: 200,
  people: { hazel: { bond: 10, last: 0 }, sage: { bond: 40, last: 0 } },
  ...over,
});
const run = (s: GameState, a: Action) => act(s, a);
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
// A café shift's pay, the least a shift pays.
const SHIFT = ACTS['cafe.shift']!.cost.cash!;
// A night with Sage at the fire: the first, from the seed, she's there.
const sageNight = (() => {
  for (let d = 1; ; d++) if (!cardsBlocked(base({ day: d }), 'holdem', 'sage')) return d;
})();

describe('the hands', () => {
  it('ranks every kind of hand, ties broken by what’s left', () => {
    const order = [
      'As Kd 9h 7c 3s 2d 4h',
      '9s 9d Ah Kc 3s 2d 4h',
      '9s 9d Kh Kc 3s 2d 7h',
      '9s 9d 9h Kc 3s 2d 7h',
      '5s 6d 7h 8c 9s 2d Kh',
      '2h 7h 9h Jh Kh 2d 3c',
      '9s 9d 9h Kc Ks 2d 7h',
      '9s 9d 9h 9c Ks 2d 7h',
      '5h 6h 7h 8h 9h 2d Kc',
    ].map((h) => handValue(H(h)));
    for (let i = 1; i < order.length; i++) expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    expect(handWord(H('9s 9d 9h Kc Ks 2d 7h'))).toBe('a full house');
    // The wheel is a straight, and the lowest.
    expect(handWord(H('As 2d 3h 4c 5s Kd Qh'))).toBe('a straight');
    expect(handValue(H('As 2d 3h 4c 5s'))).toBeLessThan(handValue(H('2s 3d 4h 5c 6s')));
    expect(handValue(H('As Ad Kh 7c 3s'))).toBeGreaterThan(handValue(H('Ah Ac Qh Jc 9s')));
  });

  it('counts blackjack aces high while they fit, and pays 3:2 to the dollar up', () => {
    expect(bjTotal(H('As 6d'))).toEqual({ n: 17, soft: true });
    expect(bjTotal(H('As 6d Td'))).toEqual({ n: 17, soft: false });
    expect(bjTotal(H('As Ad 9c'))).toEqual({ n: 21, soft: true });
    expect(bjSettle(H('As Kd'), H('9s 8d'), 5).back).toBe(5 + Math.ceil(7.5));
    expect(bjSettle(H('As Kd'), H('Ah Qd'), 5)).toEqual({ back: 5, how: 'push' });
    expect(bjSettle(H('Ts 8d'), H('9s 7d 8h'), 5)).toEqual({ back: 10, how: 'dealer bust' });
    expect(bjSettle(H('Ts 8d 5h'), H('9s 7d'), 5)).toEqual({ back: 0, how: 'bust' });
  });
});

describe('blackjack', () => {
  it('sits you down with what’s in hand up to the cap, once a night, and gets you up with the rest', () => {
    const s = base();
    const sat = run(s, { t: 'bj', do: 'sit' });
    expect(sat.state.cash).toBe(s.cash - GAMES.bj.cap);
    expect(sat.state.cards).toMatchObject({ game: 'bj', who: 'hazel', chips: GAMES.bj.cap, hands: 0 });
    expect(sat.state.min).toBe(s.min + GAMES.min);
    expect(refused(run(sat.state, { t: 'act', act: 'lot.sleep' }))).toBe(true);
    const up = run(sat.state, { t: 'bj', do: 'leave' }).state;
    expect(up.cash).toBe(s.cash);
    expect(up.cards).toBeNull();
    expect(refused(run(up, { t: 'bj', do: 'sit' }))).toBe(true);
    // Short of a cap: all of it.
    expect(run(base({ cash: 23.5 }), { t: 'bj', do: 'sit' }).state.cards!.chips).toBe(23);
    expect(refused(run(base({ cash: 3 }), { t: 'bj', do: 'sit' }))).toBe(true);
    expect(refused(run(base({ min: 12 * 60 }), { t: 'bj', do: 'sit' }))).toBe(true);
  });

  it('plays a hand out, and stops at the night’s last', () => {
    let s = run(base({ day: 4 }), { t: 'bj', do: 'sit' }).state;
    for (let h = 0; h < GAMES.bj.hands; h++) {
      s = run(s, { t: 'bj', do: 'deal' }).state;
      while (s.cards!.bj) s = run(s, { t: 'bj', do: 'stand' }).state;
    }
    expect(s.cards!.hands).toBe(GAMES.bj.hands);
    expect(refused(run(s, { t: 'bj', do: 'deal' }))).toBe(true);
  });

  it('doubles on two cards only, for one more card', () => {
    for (let d = 1; d < 40; d++) {
      const s = run(run(base({ day: d }), { t: 'bj', do: 'sit' }).state, { t: 'bj', do: 'deal' }).state;
      if (!s.cards!.bj) continue;
      const r = run(s, { t: 'bj', do: 'double' });
      expect(r.state.cards!.bj).toBeNull();
      expect(r.state.cards!.hands).toBe(1);
      expect(lines(r).join(' ')).toMatch(/\(\d+\)/);
      const hit = run(s, { t: 'bj', do: 'hit' }).state;
      if (hit.cards!.bj) expect(refused(run(hit, { t: 'bj', do: 'double' }))).toBe(true);
      return;
    }
  });

  it('is about even played by the book: variance, not a living', () => {
    let s = base();
    let net = 0;
    let wager = 0;
    for (let d = 1; d <= 120; d++) {
      s = run({ ...s, day: d, min: 21 * 60, energy: 80, cash: 200, today: [] }, { t: 'bj', do: 'sit' }).state;
      const start = s.cards!.chips;
      for (let h = 0; h < GAMES.bj.hands && s.cards!.chips >= GAMES.bj.bet; h++) {
        s = run(s, { t: 'bj', do: 'deal' }).state;
        wager += GAMES.bj.bet;
        while (s.cards!.bj) {
          const y = bjTotal(s.cards!.bj.you);
          const up = bjTotal([s.cards!.bj.dealer[0]!]).n;
          const two = s.cards!.bj.you.length === 2;
          const a =
            two && !y.soft && (y.n === 11 || (y.n === 10 && up < 10)) && s.cards!.chips >= s.cards!.bj.bet
              ? 'double'
              : (y.soft ? y.n <= 17 : y.n <= 11 || (y.n <= 16 && up >= 7))
                ? 'hit'
                : 'stand';
          s = run(s, { t: 'bj', do: a }).state;
        }
      }
      net += s.cards!.chips - start;
      s = run(s, { t: 'bj', do: 'leave' }).state;
    }
    expect(Math.abs(net / wager)).toBeLessThan(0.06);
    // A night's worth is nowhere near a shift's.
    expect(net / 120).toBeLessThan(SHIFT / 4);
  });
});

describe('hold’em', () => {
  it('sits you across from someone at the fire, and only them', () => {
    expect(refused(run(base({ day: sageNight }), { t: 'holdem', do: 'sit', who: 'sage' }))).toBe(false);
    const noSage = Array.from({ length: 30 }, (_, d) => d + 1).find((d) =>
      cardsBlocked(base({ day: d }), 'holdem', 'sage'),
    );
    expect(refused(run(base({ day: noSage }), { t: 'holdem', do: 'sit', who: 'sage' }))).toBe(true);
    const s = run(base(), { t: 'holdem', do: 'sit' }).state;
    expect(s.cards).toMatchObject({ game: 'holdem', who: 'hazel', chips: GAMES.holdem.cap });
  });

  it('deals a hand: an ante each, three streets, their bet to call or fold', () => {
    let s = run(run(base({ day: 3 }), { t: 'holdem', do: 'sit' }).state, { t: 'holdem', do: 'deal' }).state;
    const he = s.cards!.he!;
    expect(he).toMatchObject({ street: 0, pot: 2 * GAMES.holdem.ante, facing: 0 });
    expect(new Set([...he.you, ...he.them, ...he.board]).size).toBe(9);
    expect(s.cards!.chips).toBe(GAMES.holdem.cap - GAMES.holdem.ante);
    let guard = 0;
    while (s.cards!.he && guard++ < 10) {
      if (s.cards!.he.facing) expect(refused(run(s, { t: 'holdem', do: 'bet' }))).toBe(true);
      s = run(s, { t: 'holdem', do: 'call' }).state;
    }
    expect(s.cards!.he).toBeNull();
    expect(s.cards!.hands).toBe(1);
    expect(s.reads.hazel).toEqual({ hands: 1, caught: 0 });
  });

  it('gives a read at five hands and another at twelve, and says so', () => {
    let s = base();
    const said: string[] = [];
    for (let d = 1; s.reads.hazel?.hands !== 12; d++) {
      s = run(
        { ...s, day: d, min: 21 * 60, energy: 80, cash: 200, today: [] },
        { t: 'holdem', do: 'sit' },
      ).state;
      while (s.cards!.hands < GAMES.holdem.hands && s.reads.hazel?.hands !== 12) {
        s = run(s, { t: 'holdem', do: 'deal' }).state;
        const r = run(s, { t: 'holdem', do: 'fold' });
        said.push(...lines(r));
        s = r.state;
      }
      s = run(s, { t: 'holdem', do: 'leave' }).state;
    }
    const reads = readsOn(s, 'hazel');
    expect(reads).toHaveLength(2);
    expect(said.filter((l) => /getting a read on Hazel/.test(l))).toHaveLength(2);
    expect(reads[0]).toBe(STYLES.hazel!.read);
    expect(reads[1]).toContain(`one hand in ${Math.round(1 / STYLES.hazel!.bluff)}`);
    expect(readsOn({ ...s, reads: { hazel: { hands: 4, caught: 0 } } }, 'hazel')).toEqual([]);
  });

  it('remembers being shown a bet that loses on the river, and calls you lighter for it', () => {
    expect(theyKnow(base({ reads: { hazel: { hands: 20, caught: 0 } } }), 'hazel')).toBe(0);
    expect(theyKnow(base({ reads: { hazel: { hands: 20, caught: 5 } } }), 'hazel')).toBe(1);
    expect(theyKnow(base({ reads: { hazel: { hands: 2, caught: 2 } } }), 'hazel')).toBe(0);
    // Always betting gets you caught.
    let s = base();
    for (let d = 1; d <= 20; d++) {
      s = run(
        { ...s, day: d, min: 21 * 60, energy: 80, cash: 200, today: [] },
        { t: 'holdem', do: 'sit' },
      ).state;
      for (let h = 0; h < GAMES.holdem.hands; h++) {
        s = run(s, { t: 'holdem', do: 'deal' }).state;
        let g = 0;
        while (s.cards!.he && g++ < 10)
          s = run(s, { t: 'holdem', do: s.cards!.he.facing ? 'call' : 'bet' }).state;
      }
      s = run(s, { t: 'holdem', do: 'leave' }).state;
    }
    expect(s.reads.hazel!.caught).toBeGreaterThan(0);
    expect(theyKnow(s, 'hazel')).toBeGreaterThan(0);
  });

  it('can’t be farmed: no simple way to play earns much of a shift a night', () => {
    const night = (s: GameState, d: number) => ({
      ...s,
      day: d,
      min: 21 * 60,
      energy: 80,
      cash: 200,
      today: [],
    });
    for (const strat of ['bet', 'call', 'read'] as const) {
      let s = base();
      let net = 0;
      for (let d = 1; d <= 40; d++) {
        s = run(night(s, d), { t: 'holdem', do: 'sit' }).state;
        const start = s.cards!.chips;
        for (let h = 0; h < GAMES.holdem.hands; h++) {
          s = run(s, { t: 'holdem', do: 'deal' }).state;
          let g = 0;
          while (s.cards!.he && g++ < 10) {
            const he = s.cards!.he;
            const e = equity(he.you, he.board.slice(0, boardAt(he.street)), `t-${d}-${h}-${he.street}`, s);
            const a =
              strat === 'bet'
                ? he.facing
                  ? 'call'
                  : 'bet'
                : strat === 'call'
                  ? 'call'
                  : he.facing
                    ? e > 0.45
                      ? 'call'
                      : 'fold'
                    : e > 0.6
                      ? 'bet'
                      : 'call';
            s = run(s, { t: 'holdem', do: a }).state;
          }
        }
        net += s.cards!.chips - start;
        s = run(s, { t: 'holdem', do: 'leave' }).state;
      }
      expect(net / 40).toBeLessThan(SHIFT / 4);
    }
  });

  it('saves a hand on the go and the reads, and won’t load a broken one', () => {
    const s = run(run(base(), { t: 'holdem', do: 'sit' }).state, { t: 'holdem', do: 'deal' }).state;
    const back = fromSave(toSave({ ...s, reads: { hazel: { hands: 3, caught: 1 } } }, 'test'));
    expect(back.ok && back.state.cards).toEqual(s.cards);
    expect(back.ok && back.state.reads).toEqual({ hazel: { hands: 3, caught: 1 } });
    const bad = JSON.parse(toSave(s, 'test'));
    bad.state.cards.he.board = [52, 1, 2, 3, 4];
    expect(fromSave(JSON.stringify(bad)).ok).toBe(false);
  });
});
