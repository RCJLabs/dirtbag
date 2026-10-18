// Phase 36.3: hold'em round the fire, everyone in, fixed limit. The blinds and the button,
// the streets and their bets, a raise reopening the betting and four bets the most, folds, the
// showdown and a split, your all in, the others' styles and their tells, the reads, a night
// at the table, and the save.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { boardAt, equity, readsOn, theyKnow } from './cards';
import { STYLES } from './content/cards';
import { GAMES } from './dials';
import { atFire, fireOut } from './fire';
import { act, newGame } from './game';
import { canRaise, deal, owes, play, showdown, theirMove, theirTurns, type Holdem } from './holdem';
import { ACTS } from './content/places';
import { fromSave, toSave } from './save';
import type { Action, GameState } from './types';

const V78 = readFileSync(new URL('./fixtures/save-v78.json', import.meta.url), 'utf8');
// Cards by name: "As", "Td", "2c".
const C = (x: string): number => '23456789TJQKA'.indexOf(x[0]!) + 13 * 'shdc'.indexOf(x[1]!);
const H = (x: string): number[] => x.split(' ').map(C);
const regulars = { hazel: { bond: 10, last: 0 }, sage: { bond: 40, last: 0 } };
const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('holdem'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  at: 'lot',
  min: 21 * 60,
  energy: 80,
  cash: 200,
  people: regulars,
  ...over,
});
const run = (s: GameState, a: Action) => act(s, a);
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const SHIFT = ACTS['cafe.shift']!.cost.cash!;
// Nights with Sage at the fire, and without.
const sageNights = Array.from({ length: 200 }, (_, d) => d + 1).filter((d) =>
  atFire(base({ day: d })).includes('sage'),
);
const hazelNight = Array.from({ length: 200 }, (_, d) => d + 1).find(
  (d) => !atFire(base({ day: d })).includes('sage'),
)!;
const [B0, B1] = GAMES.holdem.blinds as [number, number];
// A hand with the cards set by hand: holes for each seat, and the board.
const fixed = (h: Holdem, holes: string[], board: string): Holdem => ({
  ...h,
  seats: h.seats.map((p, i) => ({ ...p, hole: H(holes[i]!) })),
  board: H(board),
});
const playing = (s: GameState) => !!s.cards?.he && !s.cards.he.won;

describe('the blinds and the button', () => {
  it('heads-up: the button posts the small blind and moves first before the flop, last after', () => {
    const s = base();
    const h0 = deal(s, ['hazel'], 0, 40);
    expect(h0.button).toBe(0);
    expect(h0.seats.map((p) => p.put)).toEqual([B0, B1]);
    expect(h0.turn).toBe(0);
    const h1 = deal(s, ['hazel'], 1, 40);
    expect(h1.button).toBe(1);
    expect(h1.seats.map((p) => p.put)).toEqual([B1, B0]);
    expect(h1.turn).toBe(1);
    // Two cards each and five on the board, all different.
    expect(new Set([...h0.seats.flatMap((p) => p.hole), ...h0.board]).size).toBe(9);
  });

  it('three-handed: the blinds after the button, the first move after the big blind, the button going round', () => {
    const s = base();
    const h = deal(s, ['hazel', 'sage'], 0, 40);
    expect(h.seats.map((p) => p.put)).toEqual([0, B0, B1]);
    expect(h.turn).toBe(0);
    expect(h.bet).toBe(B1);
    const next = deal(s, ['hazel', 'sage'], 1, 40);
    expect(next.button).toBe(1);
    expect(next.seats.map((p) => p.put)).toEqual([B1, 0, B0]);
    expect(next.turn).toBe(1);
  });
});

describe('the betting', () => {
  it('ends a street when everyone’s matched and moved, the big blind with its option', () => {
    let h = deal(base(), ['hazel', 'sage'], 0, 40);
    h = play(h, 0, 'call', 40);
    expect(h.turn).toBe(1);
    h = play(h, 1, 'call', 0);
    // Everyone's put in the big blind, but it hasn't moved: its option.
    expect(h.street).toBe(0);
    expect(h.turn).toBe(2);
    expect(owes(h, 2)).toBe(0);
    h = play(h, 2, 'call', 0);
    expect(h.street).toBe(1);
    expect(h.pot).toBe(3 * B1);
    expect(h.bet).toBe(0);
    // After the flop, the first in after the button.
    expect(h.turn).toBe(1);
  });

  it('reopens the betting on a raise, and takes four bets a street at most', () => {
    let h = deal(base(), ['hazel', 'sage'], 0, 100);
    h = play(play(play(h, 0, 'call', 100), 1, 'call', 0), 2, 'call', 0);
    const B = GAMES.holdem.bets[0]!;
    h = play(h, 1, 'bet', 0);
    expect(h.bet).toBe(B);
    h = play(h, 2, 'bet', 0);
    expect(h.bet).toBe(2 * B);
    h = play(h, 0, 'bet', 100);
    expect(h.bet).toBe(3 * B);
    expect(h.seats[1]!.acted).toBe(false);
    h = play(h, 1, 'bet', 0);
    expect(h.bets).toBe(GAMES.holdem.raises + 1);
    expect(canRaise(h)).toBe(false);
    // Past the last bet, a raise is a call.
    h = play(h, 2, 'bet', 0);
    expect(h.bet).toBe(4 * B);
    expect(h.said.at(-1)!.did).toBe('calls');
  });

  it('gives the pot to the last one in, with no cards shown', () => {
    let h = deal(base(), ['hazel', 'sage'], 0, 40);
    h = play(h, 0, 'bet', 40);
    h = play(h, 1, 'fold', 0);
    h = play(h, 2, 'fold', 0);
    expect(h.street).toBe(4);
    const won = showdown(h);
    expect(won).toEqual({ by: [0], back: B0 + B1 + B1 + GAMES.holdem.bets[0]!, shown: false });
  });

  it('shows down to the best hand, and splits a tie', () => {
    const h = deal(base(), ['hazel', 'sage'], 0, 40);
    const all = { ...h, seats: h.seats.map((p) => ({ ...p, total: 10 })) };
    const board = '2c 7d 9s Jc 3h';
    expect(showdown(fixed(all, ['As Ah', 'Ks Kh', 'Qs Qd'], board))).toEqual({
      by: [0],
      back: 30,
      shown: true,
    });
    expect(showdown(fixed(all, ['As Kd', 'Ac Kh', 'Qs 4d'], board))).toEqual({
      by: [0, 1],
      back: 15,
      shown: true,
    });
    expect(showdown(fixed(all, ['Qs 4d', 'As Ah', 'Ks Kh'], board)).back).toBe(0);
  });

  it('puts you all in short of a call, for the money that matched yours', () => {
    let h = deal(base(), ['hazel', 'sage'], 0, 1);
    // A dollar in front of you, two to call.
    h = play(h, 0, 'call', 1);
    expect(h.seats[0]).toMatchObject({ put: 1, total: 1, all: true });
    expect(h.said.at(-1)!.did).toBe('calls, all in');
    const over = fixed(
      { ...h, seats: h.seats.map((p, i) => ({ ...p, total: [1, 10, 4][i]!, in: i !== 2 })) },
      ['As Ah', 'Ks Kh', 'Qs Qd'],
      '2c 7d 9s Jc 3h',
    );
    // Yours: a dollar from each seat, the folded one's included.
    expect(showdown(over)).toEqual({ by: [0], back: 3, shown: true });
  });
});

describe('the others', () => {
  // Spots from many seeded nights: each of the others' first move.
  const spots = (n: number) => {
    const out: { s: GameState; h: Holdem; seat: number }[] = [];
    for (let d = 1; out.length < n; d++) {
      const s = base({ day: d });
      let h = deal(s, ['hazel', 'sage', 'frank'], d, 40);
      for (let k = 0; k < 8 && h.street < 4; k++) {
        if (h.turn === 0) h = play(h, 0, d % 3 === 0 ? 'bet' : 'call', 40);
        else {
          out.push({ s, h, seat: h.turn });
          h = play(h, h.turn, theirMove(s, h, h.turn, `t-${d}-${k}`).m, 0);
        }
      }
    }
    return out;
  };

  it('move legally, the same way every time from the same cards', () => {
    for (const { s, h, seat } of spots(300)) {
      const m = theirMove(s, h, seat, 'x');
      expect(theirMove(s, h, seat, 'x')).toEqual(m);
      if (m.m === 'fold') expect(owes(h, seat)).toBeGreaterThan(0);
    }
  });

  it('play their styles: Sage bets and raises more than Hazel, and Frank folds to bets more than Sage', () => {
    const tally = {
      hazel: { bet: 0, all: 0, fold: 0, facing: 0 },
      sage: { bet: 0, all: 0, fold: 0, facing: 0 },
      frank: { bet: 0, all: 0, fold: 0, facing: 0 },
    };
    for (const { s, h, seat } of spots(900)) {
      for (const who of ['hazel', 'sage', 'frank'] as const) {
        const as: Holdem = { ...h, seats: h.seats.map((p, i) => (i === seat ? { ...p, who } : p)) };
        const { m } = theirMove(s, as, seat, `y-${seat}`);
        const t = tally[who];
        t.all++;
        if (m === 'bet') t.bet++;
        if (owes(h, seat) > 0) {
          t.facing++;
          if (m === 'fold') t.fold++;
        }
      }
    }
    expect(tally.sage.bet / tally.sage.all).toBeGreaterThan(tally.hazel.bet / tally.hazel.all);
    expect(tally.frank.fold / tally.frank.facing).toBeGreaterThan(tally.sage.fold / tally.sage.facing);
  });

  it('show a tell on a bet only once you’ve the second read, right about `tell` of the time', () => {
    let honest = 0;
    let told = 0;
    for (const [k, { s, h, seat }] of spots(1500).entries()) {
      const who = h.seats[seat]!.who;
      const bare = theirMove({ ...s, reads: {} }, h, seat, `z-${k}`);
      expect(bare.sign).toBeUndefined();
      const known = { ...s, reads: { [who]: { hands: GAMES.holdem.reads[1]!, caught: 0 } } };
      const r = theirMove(known, h, seat, `z-${k}`);
      if (r.m !== 'bet') {
        expect(r.sign).toBeUndefined();
        continue;
      }
      const st = STYLES[who]!;
      expect([st.signs!.strong, st.signs!.bluff]).toContain(r.sign);
      const field = h.seats.filter((p) => p.in).length - 1;
      const e = equity(h.seats[seat]!.hole, h.board.slice(0, boardAt(h.street)), `z-${k}-eq`, known, field);
      const strong = e >= (st.bet * 2) / (field + 1);
      told++;
      if ((r.sign === st.signs!.strong) === strong) honest++;
    }
    expect(told).toBeGreaterThan(100);
    expect(honest / told).toBeGreaterThan(GAMES.holdem.tell - 0.1);
    expect(honest / told).toBeLessThan(GAMES.holdem.tell + 0.1);
  });

  it('play out to your move or the hand’s end', () => {
    const s = base();
    const h = theirTurns(s, play(deal(s, ['hazel', 'sage'], 0, 40), 0, 'call', 40), 0);
    expect(h.turn === 0 || h.street === 4).toBe(true);
  });
});

describe('a night at the table', () => {
  it('sits you down with everyone at the fire who plays, once a night, for the energy', () => {
    const s = base({ day: sageNights[0] });
    const sat = run(s, { t: 'holdem', do: 'sit' });
    expect(sat.state.cards).toMatchObject({ game: 'holdem', chips: GAMES.holdem.cap, hands: 0, he: null });
    expect(sat.state.min).toBe(s.min);
    expect(sat.state.energy).toBe(s.energy - GAMES.energy);
    expect(lines(sat).join(' ')).toMatch(/Hazel and Sage make room/);
    const up = run(sat.state, { t: 'holdem', do: 'leave' }).state;
    expect(up.cash).toBe(s.cash);
    expect(refused(run(up, { t: 'holdem', do: 'sit' }))).toBe(true);
    expect(JSON.stringify(run(base({ min: GAMES.late }), { t: 'holdem', do: 'sit' }).events[0])).toMatch(
      /coals/,
    );
  });

  it('deals a hand a hand’s minutes, the blinds from what’s in front of you, and plays it to the end', () => {
    let s = run(base({ day: sageNights[1] }), { t: 'holdem', do: 'sit' }).state;
    const was = s.min;
    s = run(s, { t: 'holdem', do: 'deal' }).state;
    expect(s.min).toBe(was + GAMES.holdem.min);
    const h = s.cards!.he!;
    expect(h.seats.map((p) => p.who)).toEqual(['you', 'hazel', 'sage']);
    expect(s.cards!.chips).toBe(GAMES.holdem.cap - h.seats[0]!.total);
    expect(h.turn === 0 || h.won).toBeTruthy();
    for (let g = 0; g < 30 && playing(s); g++) s = run(s, { t: 'holdem', do: 'call' }).state;
    const end = s.cards!.he!;
    expect(end.won).not.toBeNull();
    expect(s.cards!.chips).toBe(GAMES.holdem.cap - end.seats[0]!.total + end.won!.back);
    expect(s.cards!.hands).toBe(1);
    expect(s.reads.hazel?.hands).toBe(1);
    expect(s.reads.sage?.hands).toBe(1);
    // Over: nothing more on it, and the next hand's yours to deal.
    for (const m of ['fold', 'call', 'bet'] as const)
      expect(refused(run(s, { t: 'holdem', do: m }))).toBe(true);
    expect(run(s, { t: 'holdem', do: 'deal' }).state.cards!.hands).toBeGreaterThanOrEqual(1);
  });

  it('deals nothing past the fire’s close, or short of the blinds', () => {
    const s = run(base({ day: hazelNight }), { t: 'holdem', do: 'sit' }).state;
    expect(JSON.stringify(run({ ...s, min: GAMES.late }, { t: 'holdem', do: 'deal' }).events[0])).toMatch(
      /coals/,
    );
    expect(refused(run({ ...s, cards: { ...s.cards!, chips: B1 - 1 } }, { t: 'holdem', do: 'deal' }))).toBe(
      true,
    );
    expect(fireOut({ ...s, min: GAMES.late })).toBe(true);
  });

  it('gives a read at five hands and another at twelve, and says so', () => {
    let s = run(base({ day: hazelNight, cash: 2000 }), { t: 'holdem', do: 'sit' }).state;
    s = { ...s, cards: { ...s.cards!, chips: 1000 } };
    const said: string[] = [];
    for (let g = 0; g < 200 && s.reads.hazel?.hands !== 12; g++) {
      const r = run(s, { t: 'holdem', do: playing(s) ? 'fold' : 'deal' });
      said.push(...lines(r));
      s = r.state;
      if (playing(s) && s.cards!.he!.turn === 0 && owes(s.cards!.he!, 0) === 0)
        s = run(s, { t: 'holdem', do: 'call' }).state;
    }
    const reads = readsOn(s, 'hazel');
    expect(reads).toHaveLength(2);
    expect(said.filter((l) => /getting a read on Hazel/.test(l))).toHaveLength(2);
    expect(reads[0]).toBe(STYLES.hazel!.read);
  });

  it('remembers you being caught on a river bet, and calls you lighter for it', () => {
    expect(theyKnow(base({ reads: { hazel: { hands: 20, caught: 0 } } }), 'hazel')).toBe(0);
    expect(theyKnow(base({ reads: { hazel: { hands: 20, caught: 5 } } }), 'hazel')).toBe(1);
    let s = base({ day: hazelNight, cash: 5000 });
    for (let n = 0; n < 4; n++) {
      s = run(
        { ...s, day: hazelNight + 56 * n, min: 21 * 60, energy: 80, today: [] },
        { t: 'holdem', do: 'sit' },
      ).state;
      for (let g = 0; g < 400 && !fireOut(s) && s.cards!.chips >= B1; g++)
        s = run(s, { t: 'holdem', do: playing(s) ? 'bet' : 'deal' }).state;
      while (playing(s)) s = run(s, { t: 'holdem', do: 'call' }).state;
      s = run(s, { t: 'holdem', do: 'leave' }).state;
    }
    expect(s.reads.hazel!.caught).toBeGreaterThan(0);
  });

  it('can’t be farmed: no simple way to play makes much of a shift an hour', { timeout: 120_000 }, () => {
    for (const way of ['bet', 'call', 'odds'] as const) {
      let s = base();
      let net = 0;
      let hands = 0;
      for (const d of sageNights.slice(0, 20)) {
        s = run(
          { ...s, day: d, min: 21 * 60, energy: 80, cash: 200, today: [] },
          { t: 'holdem', do: 'sit' },
        ).state;
        const start = s.cards!.chips;
        while (s.cards!.chips >= B1 && !fireOut(s)) {
          s = run(s, { t: 'holdem', do: 'deal' }).state;
          hands++;
          for (let g = 0; g < 40 && playing(s); g++) {
            const h = s.cards!.he!;
            const field = h.seats.filter((p) => p.in).length - 1;
            const e = equity(
              h.seats[0]!.hole,
              h.board.slice(0, boardAt(h.street)),
              `f-${d}-${hands}-${g}`,
              s,
              field,
            );
            const fair = 1 / (field + 1);
            const a =
              way === 'bet' || (way === 'odds' && e > 1.3 * fair)
                ? 'bet'
                : way === 'odds' && owes(h, 0) > 0 && e < 0.85 * fair
                  ? 'fold'
                  : 'call';
            s = run(s, { t: 'holdem', do: a }).state;
          }
        }
        net += s.cards!.chips - start;
        s = run(s, { t: 'holdem', do: 'leave' }).state;
      }
      expect(net / ((hands * GAMES.holdem.min) / 60)).toBeLessThan(SHIFT / 8);
    }
  });
});

describe('the save', () => {
  it('keeps a hand on the go and the reads, and won’t load a broken one', () => {
    const s = run(run(base({ day: sageNights[0] }), { t: 'holdem', do: 'sit' }).state, {
      t: 'holdem',
      do: 'deal',
    }).state;
    const back = fromSave(toSave({ ...s, reads: { hazel: { hands: 3, caught: 1 } } }, 'test'));
    expect(back.ok && back.state.cards).toEqual(s.cards);
    expect(back.ok && back.state.reads).toEqual({ hazel: { hands: 3, caught: 1 } });
    const broken = (f: (h: Record<string, unknown>) => void) => {
      const bad = JSON.parse(toSave(s, 'test'));
      f(bad.state.cards.he);
      return fromSave(JSON.stringify(bad)).ok;
    };
    expect(broken(() => {})).toBe(true);
    expect(broken((h) => (h.board = [52, 1, 2, 3, 4]))).toBe(false);
    expect(broken((h) => (h.board = [1, 2, 3, 4]))).toBe(false);
    expect(broken((h) => (h.turn = 7))).toBe(false);
    expect(broken((h) => (h.street = 5))).toBe(false);
  });

  it('loads a v78 save, and puts away a heads-up hand on the go with your half of its pot', () => {
    const plain = fromSave(V78);
    if (!plain.ok) throw new Error(plain.why);
    expect(plain.from).toBe(78);
    const old = JSON.parse(V78);
    old.state.cards = {
      game: 'holdem',
      who: 'hazel',
      chips: 30,
      hands: 2,
      bj: null,
      he: {
        you: H('As Kd'),
        them: H('2c 2d'),
        board: H('3h 4h 5h 6h 7h'),
        street: 1,
        pot: 10,
        facing: 0,
        bet: false,
      },
    };
    const r = fromSave(JSON.stringify(old));
    if (!r.ok) throw new Error(r.why);
    expect(r.state.cards).toMatchObject({ game: 'holdem', chips: 35, hands: 2, he: null });
  });
});
