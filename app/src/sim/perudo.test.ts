// Phase 36.1: liar's dice is Perudo, everyone at the fire. The rules (ones wild, a raise beats
// the last bid, a call costs whoever's wrong a die, the last cup takes it), the others' bids
// from their own cups and styles, the night's clock, and the save.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PERUDO, PERUDO_STYLES } from './content/perudo';
import { GAMES } from './dials';
import { atFire, fireOut } from './fire';
import { act, newGame } from './game';
import {
  atLeast,
  beats,
  callLines,
  called,
  FACES,
  inCup,
  inPlay,
  least,
  nextRound,
  nextSeat,
  playedOut,
  settle,
  showing,
  sitDown,
  theirMove,
  theirTurns,
  YOU,
  type Table,
} from './perudo';
import { fromSave, toSave } from './save';
import type { Action, GameState } from './types';

const V76 = readFileSync(new URL('./fixtures/save-v76.json', import.meta.url), 'utf8');
const regulars = { hazel: { bond: 10, last: 0 }, sage: { bond: 40, last: 0 } };
// A night at the Lot's fire.
const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('perudo'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  at: 'lot',
  min: 21 * 60,
  energy: 60,
  ...over,
});
// A night with Sage at the fire too.
const sageNight = () => {
  for (let d = 1; ; d++) {
    const s = base({ day: d, people: regulars });
    if (atFire(s).includes('sage')) return s;
  }
};
const run = (s: GameState, a: Action) => act(s, a);
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
// A table by hand: cups as given, a bid on it or not, someone's turn.
const table = (
  cups: number[][],
  bid: Table['bid'] = null,
  turn = 0,
  who = ['hazel', 'sage', 'frank'],
): Table => ({
  seats: cups.map((dice, i) => ({ who: i === 0 ? YOU : who[i - 1]!, dice })),
  turn,
  bid,
  said: bid ? [{ by: bid.by, n: bid.n, face: bid.face }] : [],
  round: 0,
  game: 21 * 60,
  shown: null,
  over: null,
});
// Your play, simply: call a bid of more than a third of the dice, else the least raise on the
// face you hold most of.
const yourMove = (t: Table): Action => {
  if (t.bid && t.bid.n > inPlay(t) / 3) return { t: 'dice', do: 'call' };
  const mine = t.seats[0]!.dice;
  const face = [...FACES].sort((a, b) => inCup(mine, b) - inCup(mine, a))[0]!;
  return { t: 'dice', do: 'bid', n: Math.max(least(t.bid, face), t.bid ? 0 : 1), face };
};
// A whole game from sitting down, by `yourMove`: every state it passed through.
const playGame = (s0: GameState): GameState[] => {
  let s = run(s0, { t: 'dice', do: 'deal' }).state;
  const seen = [s];
  for (let i = 0; i < 400 && !s.table!.over; i++) {
    const t = s.table!;
    const r = run(s, t.shown ? { t: 'dice', do: 'next' } : yourMove(t));
    if (refused(r)) throw new Error(`refused: ${JSON.stringify(r.events[0])}`);
    s = r.state;
    if (!s.table) break;
    seen.push(s);
  }
  return seen;
};

describe('the rules', () => {
  it('counts ones for every face, and never bids them', () => {
    expect(inCup([1, 1, 3, 5, 6], 5)).toBe(3);
    expect(inCup([2, 2, 2, 4, 4], 6)).toBe(0);
    expect(FACES).toEqual([2, 3, 4, 5, 6]);
    expect(beats({ n: 2, face: 1 }, null, 10)).toBe(false);
  });

  it('takes a raise as more of any face, or as many of a higher one', () => {
    const on = { n: 4, face: 4, by: 1 };
    expect(beats({ n: 4, face: 5 }, on, 20)).toBe(true);
    expect(beats({ n: 5, face: 2 }, on, 20)).toBe(true);
    expect(beats({ n: 4, face: 4 }, on, 20)).toBe(false);
    expect(beats({ n: 4, face: 3 }, on, 20)).toBe(false);
    expect(beats({ n: 3, face: 6 }, on, 20)).toBe(false);
    // Never more than the dice there are, and whole dice.
    expect(beats({ n: 21, face: 6 }, on, 20)).toBe(false);
    expect(beats({ n: 4.5, face: 6 }, on, 20)).toBe(false);
    // Anything from one, to open.
    expect(beats({ n: 1, face: 2 }, null, 20)).toBe(true);
    expect(least(on, 5)).toBe(4);
    expect(least(on, 4)).toBe(5);
    expect(least(null, 3)).toBe(1);
  });

  it('weighs a bid by the odds a third of the dice nobody’s seen count', () => {
    expect(atLeast(0, 5)).toBe(1);
    expect(atLeast(6, 5)).toBe(0);
    expect(atLeast(1, 1)).toBeCloseTo(1 / 3);
    expect(atLeast(2, 2)).toBeCloseTo(1 / 9);
    for (let k = 1; k < 15; k++) expect(atLeast(k + 1, 15)).toBeLessThan(atLeast(k, 15));
  });

  it('costs whoever’s wrong a die on a call: the bidder if there are fewer, the caller if there are as many', () => {
    const cups = [
      [5, 1, 2],
      [5, 3, 4],
    ];
    // Three 5s showing (a one is a 5).
    expect(showing(table(cups), 5)).toBe(3);
    expect(called(table(cups, { n: 3, face: 5, by: 1 }), 0)).toEqual({ count: 3, loser: 0 });
    expect(called(table(cups, { n: 4, face: 5, by: 1 }), 0)).toEqual({ count: 3, loser: 1 });
    const s = base();
    const t = settle(s, table(cups, { n: 4, face: 5, by: 1 }), 0);
    // The cups as they were, and a die off the bidder.
    expect(t.shown).toMatchObject({ caller: 0, by: 1, n: 4, face: 5, count: 3, loser: 1, cups });
    expect(t.seats.map((p) => p.dice.length)).toEqual([3, 2]);
    expect(t.over).toBeNull();
  });

  it('opens the next round with whoever lost, or the next seat with dice if they’re out', () => {
    const s = base();
    const t = settle(s, table([[2, 3], [4], [5, 6]], { n: 3, face: 6, by: 1 }, 0), 0);
    // Hazel bid three 6s on two (a 6 and nothing wild): she loses her last die and is out.
    expect(t.seats[1]!.dice).toEqual([]);
    expect(nextSeat(t, 0)).toBe(2);
    const r = nextRound(s, t);
    expect(r.turn).toBe(2);
    expect(r.round).toBe(1);
    expect(r.bid).toBeNull();
    expect(r.shown).toBeNull();
    expect(r.seats.map((p) => p.dice.length)).toEqual([2, 0, 2]);
  });

  it('ends with the last cup that has dice, and plays it out without you if yours is empty', () => {
    const s = base();
    const won = settle(s, table([[3], [2]], { n: 1, face: 6, by: 1 }), 0);
    expect(won.over).toBe(YOU);
    expect(callLines(won).join(' ')).toMatch(/Last cup standing: yours/);
    // Your last die on a call you got wrong: the others play on to a winner.
    const out = settle(s, table([[6], [6, 2], [3, 4], [5, 5]], { n: 2, face: 6, by: 1 }), 0);
    expect(out.seats[0]!.dice).toEqual([]);
    expect(['hazel', 'sage', 'frank']).toContain(out.over);
    expect(out.over).toBe(playedOut(s, { ...out, over: null }));
    expect(callLines(out).join(' ')).toMatch(
      /You are out of dice\. They play it out without you\. .* takes it, last cup standing\./,
    );
    // Out on the call that left one cup: that was the game, with nothing to play out.
    const beaten = settle(s, table([[3], [2]], { n: 1, face: 3, by: 1 }), 0);
    expect(beaten.over).toBe('hazel');
    expect(callLines(beaten).join(' ')).toMatch(/You are out of dice\. Hazel takes it, last cup standing\.$/);
  });
});

describe('the others at the table', () => {
  // Every turn they could face across many seeded nights: theirs from the opening and after
  // every raise you'd make.
  const spots = (n: number) => {
    const out: { s: GameState; t: Table }[] = [];
    for (let d = 1; out.length < n; d++) {
      const s = base({ day: d });
      let t = sitDown(s, ['hazel', 'sage', 'frank'], 21 * 60);
      for (let k = 0; k < 6 && !t.shown; k++) {
        if (t.turn === 0) {
          const m = yourMove(t);
          if (m.t !== 'dice' || m.do !== 'bid') break;
          t = { ...t, bid: { n: m.n!, face: m.face!, by: 0 }, turn: 1 };
        }
        out.push({ s, t });
        const their = theirMove(s, t, t.turn);
        if ('call' in their) break;
        t = { ...t, bid: { ...their, by: t.turn }, turn: nextSeat(t, t.turn) };
      }
    }
    return out;
  };

  it('bid legally or call, the same way every time from the same cups', () => {
    for (const { s, t } of spots(400)) {
      const m = theirMove(s, t, t.turn);
      expect(theirMove(s, t, t.turn)).toEqual(m);
      if ('call' in m) expect(t.bid).not.toBeNull();
      else expect(beats(m, t.bid, inPlay(t))).toBe(true);
    }
  });

  it('play their styles: Sage calls more and pushes faces she hasn’t got; Hazel lets more go', () => {
    const calls = { hazel: 0, sage: 0 };
    const facing = { hazel: 0, sage: 0 };
    const bluffs = { hazel: 0, sage: 0 };
    const bids = { hazel: 0, sage: 0 };
    for (const { s, t } of spots(1200)) {
      // The same spot from each of their chairs: their own cup, the table's bid.
      for (const who of ['hazel', 'sage'] as const) {
        const seat = t.turn === 0 ? 1 : t.turn;
        const as: Table = { ...t, seats: t.seats.map((p, i) => (i === seat ? { ...p, who } : p)) };
        const m = theirMove(s, as, seat);
        if (t.bid) facing[who]++;
        if ('call' in m) calls[who]++;
        else {
          bids[who]++;
          if (inCup(as.seats[seat]!.dice, m.face) === 0) bluffs[who]++;
        }
      }
    }
    expect(calls.sage / facing.sage).toBeGreaterThan(calls.hazel / facing.hazel);
    expect(bluffs.sage / bids.sage).toBeGreaterThan(bluffs.hazel / bids.hazel);
    expect(PERUDO_STYLES.sage!.bluff).toBeGreaterThan(PERUDO_STYLES.hazel!.bluff);
  });

  it('take their turns till it’s yours or someone calls', () => {
    const s = base({ day: 9 });
    const t = sitDown(s, ['hazel', 'sage', 'frank'], 21 * 60);
    const after = theirTurns(s, {
      ...t,
      bid: { n: 2, face: 4, by: 0 },
      said: [{ by: 0, n: 2, face: 4 }],
      turn: 1,
    });
    expect(after.turn === 0 || after.shown !== null).toBe(true);
    // Each bid beat the one before it.
    for (let i = 1; i < after.said.length; i++)
      expect(beats(after.said[i]!, { ...after.said[i - 1]! }, inPlay(after))).toBe(true);
  });
});

describe('at the fire', () => {
  it('seats you and everyone at the fire, five dice each from the seed, and you open', () => {
    const s = sageNight();
    const r = run(s, { t: 'dice', do: 'deal' });
    const t = r.state.table!;
    expect(t.seats.map((p) => p.who)).toEqual([YOU, ...atFire(s)]);
    expect(
      t.seats.every((p) => p.dice.length === GAMES.dice.n && p.dice.every((d) => d >= 1 && d <= 6)),
    ).toBe(true);
    expect(t.turn).toBe(0);
    expect(r.state.min).toBe(s.min + GAMES.dice.min);
    expect(r.state.energy).toBe(s.energy - GAMES.energy);
    // The same night rolls the same; another minute, another game.
    expect(run(s, { t: 'dice', do: 'deal' }).state.table).toEqual(t);
    expect(run({ ...s, min: s.min + 1 }, { t: 'dice', do: 'deal' }).state.table!.seats).not.toEqual(t.seats);
  });

  it('holds everything else till you get up', () => {
    const s = run(base(), { t: 'dice', do: 'deal' }).state;
    const r = run(s, { t: 'act', act: 'lot.sleep' });
    expect(refused(r)).toBe(true);
    expect(JSON.stringify(r.events[0])).toMatch(/at the dice/);
    expect(refused(run(s, { t: 'dice', do: 'deal' }))).toBe(true);
    expect(refused(run(s, { t: 'dice', do: 'again' }))).toBe(true);
    expect(refused(run(s, { t: 'dice', do: 'next' }))).toBe(true);
    // Nothing bid yet: nothing to call.
    expect(refused(run(s, { t: 'dice', do: 'call' }))).toBe(true);
    expect(refused(run(s, { t: 'dice', do: 'bid', n: 0, face: 3 }))).toBe(true);
    expect(refused(run(s, { t: 'dice', do: 'bid', n: 2, face: 1 }))).toBe(true);
    const up = run(s, { t: 'dice', do: 'leave' }).state;
    expect(up.table).toBeNull();
    expect(refused(run(up, { t: 'act', act: 'lot.sleep' }))).toBe(false);
  });

  it('plays your bid round the fire: theirs follow in order, till it’s yours again or someone calls', () => {
    const ends = new Set<string>();
    for (let d = 1; d < 40; d++) {
      const s = run(base({ day: d, people: regulars }), { t: 'dice', do: 'deal' }).state;
      // A low opening goes round; a high one gets called.
      const open = d % 2 ? { n: 1, face: 2 } : { n: 8, face: 6 };
      const r = run(s, { t: 'dice', do: 'bid', ...open });
      const t = r.state.table!;
      expect(t.said[0]).toEqual({ by: 0, ...open });
      expect(t.said.map((b) => b.by)).toEqual(t.said.map((_, i) => i % t.seats.length));
      expect(t.turn === 0 || t.shown !== null).toBe(true);
      ends.add(t.shown ? 'called' : 'yours');
      if (t.shown) expect(lines(r).join(' ')).toMatch(/The cups come up/);
      // A bid that doesn't beat the table's is refused.
      else expect(refused(run(r.state, { t: 'dice', do: 'bid', n: t.bid!.n, face: t.bid!.face }))).toBe(true);
    }
    expect(ends).toEqual(new Set(['called', 'yours']));
  });

  it('plays a whole game to the last cup, a die gone with every call, a round’s minutes each', () => {
    const results = new Set<string>();
    for (let d = 1; d <= 12; d++) {
      const s0 = base({ day: d, people: regulars });
      const seen = playGame(s0);
      const end = seen[seen.length - 1]!;
      const t = end.table!;
      expect(t.over).not.toBeNull();
      results.add(t.over === YOU ? 'won' : 'lost');
      // Every call took one die off the table; every round after the first took its minutes.
      // (A round can open and close on the others' turns, straight after the last one's call.)
      const shows = seen.filter(
        (x, i) =>
          x.table!.shown && (!seen[i - 1]?.table!.shown || seen[i - 1]!.table!.round !== x.table!.round),
      );
      const rounds = t.round + 1;
      expect(shows.length).toBe(rounds);
      expect(end.min).toBe(s0.min + GAMES.dice.min * rounds);
      // Energy once a game.
      expect(end.energy).toBe(s0.energy - GAMES.energy);
      // Once over, only another game or getting up.
      expect(refused(run(end, { t: 'dice', do: 'next' }))).toBe(true);
      expect(refused(run(end, { t: 'dice', do: 'call' }))).toBe(true);
      const again = run(end, { t: 'dice', do: 'again' });
      expect(again.state.table!.seats.every((p) => p.dice.length === GAMES.dice.n)).toBe(true);
    }
    // You don't always win.
    expect(results).toEqual(new Set(['won', 'lost']));
  });

  it('goes on as long as the fire, and stops when it’s down to coals', () => {
    // Played once already tonight: another's fine.
    const twice = run(run(run(base(), { t: 'dice', do: 'deal' }).state, { t: 'dice', do: 'leave' }).state, {
      t: 'dice',
      do: 'deal',
    });
    expect(twice.state.table).not.toBeNull();
    const late = base({ min: GAMES.late });
    expect(fireOut(late)).toBe(true);
    expect(JSON.stringify(run(late, { t: 'dice', do: 'deal' }).events[0])).toMatch(/down to coals/);
    // A call just before it, and the next round never comes: the cups go away.
    let s = run(base({ min: GAMES.late - GAMES.dice.min - 1 }), { t: 'dice', do: 'deal' }).state;
    for (let i = 0; i < 40 && !s.table!.shown; i++) s = run(s, yourMove(s.table!)).state;
    expect(s.table!.shown).not.toBeNull();
    const r = run({ ...s, min: GAMES.late }, { t: 'dice', do: 'next' });
    expect(r.state.table).toBeNull();
    expect(lines(r).join(' ')).toMatch(/down to coals/);
  });

  it('pays bond with everyone playing, once a day however many games', () => {
    const s = sageNight();
    const players = atFire(s);
    const one = playGame(s).at(-1)!;
    for (const w of players) expect(one.people[w]!.bond).toBe((s.people[w]?.bond ?? 0) + 1);
    const two = run(run(one, { t: 'dice', do: 'again' }).state, { t: 'dice', do: 'leave' }).state;
    for (const w of players) expect(two.people[w]!.bond).toBe(one.people[w]!.bond);
  });
});

describe('the words', () => {
  it('types in no number, no straight quote, and only the blanks the table fills', () => {
    const blanks = /\{(dice|caller|calls|bid|count|who|loses|is|takes)\}/g;
    for (const w of [...Object.values(PERUDO), ...Object.values(PERUDO_STYLES).map((x) => x.read)]) {
      expect(w.trim(), w).toBe(w);
      expect(w, w).not.toMatch(/\d|['"]|\s{2}/);
      expect(w.replace(blanks, ''), w).not.toMatch(/[{}]/);
    }
    // Everyone who sits at the fire has a style, each dial a share.
    for (const who of ['hazel', 'sage', 'frank']) {
      const st = PERUDO_STYLES[who]!;
      for (const x of [st.doubt, st.bluff, st.caution]) expect(x >= 0 && x <= 1).toBe(true);
    }
  });
});

describe('the save', () => {
  it('keeps a game on the go, and won’t load a broken one', () => {
    let s = run(sageNight(), { t: 'dice', do: 'deal' }).state;
    s = run(s, { t: 'dice', do: 'bid', n: 1, face: 3 }).state;
    const back = fromSave(toSave(s, 'test'));
    expect(back.ok && back.state.table).toEqual(s.table);
    const broken = (f: (t: Record<string, unknown>) => void) => {
      const bad = JSON.parse(toSave(s, 'test'));
      f(bad.state.table);
      return fromSave(JSON.stringify(bad)).ok;
    };
    expect(broken((t) => ((t.seats as { dice: number[] }[])[0]!.dice = [7, 1]))).toBe(false);
    expect(broken((t) => (t.turn = 9))).toBe(false);
    expect(broken((t) => (t.bid = { n: 2, face: 1, by: 0 }))).toBe(false);
    expect(broken((t) => (t.seats = [{ who: YOU, dice: [1] }]))).toBe(false);
  });

  it('loads a v76 save, and puts away a hand of the old one-bid game', () => {
    const r = fromSave(V76);
    if (!r.ok) throw new Error(r.why);
    expect(r.from).toBe(76);
    expect(r.state.table).toBeNull();
    const old = JSON.parse(V76);
    old.state.table = {
      who: 'hazel',
      mine: [1, 2, 3, 4, 5],
      theirs: [6, 6, 2, 2, 3],
      bid: { n: 3, face: 6 },
    };
    const r2 = fromSave(JSON.stringify(old));
    if (!r2.ok) throw new Error(r2.why);
    expect(r2.state.table).toBeNull();
    expect({ ...r2.state, table: undefined }).toEqual({ ...r.state, table: undefined });
  });
});
