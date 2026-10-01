// Phase 22.9a: the games at the fire. Who's there, horseshoes from your throws, liar's dice a
// call at a time; each once a night, and bond with whoever's playing no faster than a day
// climbing together.
import { describe, expect, it } from 'vitest';
import { GAMES } from './dials';
import { atFire, bidWords, dealDice, gameBlocked, theirShoes, theyCall, yourRaise } from './fire';
import { act, newGame } from './game';
import { fromSave, toSave } from './save';
import type { Action, GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('fire'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  min: 21 * 60,
  energy: 60,
  ...over,
});
const run = (s: GameState, a: Action) => act(s, a);
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const regulars = { hazel: { bond: 10, last: 0 }, sage: { bond: 40, last: 0 } };

describe('the fire', () => {
  it('is Hazel at night at the Lot, and Sage some nights once you’re regulars', () => {
    expect(atFire(base())).toEqual(['hazel']);
    expect(atFire(base({ min: 12 * 60 }))).toEqual([]);
    expect(atFire(base({ at: 'gym' }))).toEqual([]);
    // Not a regular yet: never.
    const strangers = Array.from({ length: 50 }, (_, d) =>
      atFire(base({ day: d + 1, people: { sage: { bond: 1, last: 0 } } })),
    );
    expect(strangers.every((w) => !w.includes('sage'))).toBe(true);
    // A regular: about `sage` of nights.
    const nights = Array.from({ length: 400 }, (_, d) => atFire(base({ day: d + 1, people: regulars })));
    const share = nights.filter((w) => w.includes('sage')).length / nights.length;
    expect(share).toBeGreaterThan(GAMES.sage - 0.08);
    expect(share).toBeLessThan(GAMES.sage + 0.08);
  });

  it('says why a game’s off', () => {
    expect(gameBlocked(base({ min: 12 * 60 }), 'shoes')).toMatch(/till dark/);
    expect(gameBlocked(base({ at: 'gym' }), 'dice')).toMatch(/at the Lot/);
    expect(gameBlocked(base({ energy: 1 }), 'shoes')).toMatch(/tired/);
    expect(gameBlocked(base({ today: ['shoes'] }), 'shoes')).toMatch(/tonight/);
    expect(gameBlocked(base({ today: ['shoes'] }), 'dice')).toBeNull();
  });
});

describe('horseshoes', () => {
  it('scores your throws against everyone there’s, from the seed, once a night', () => {
    const s = base({ people: regulars, day: 7 });
    const r = run(s, { t: 'shoes', throws: [1, 0.5, 0, 1] });
    expect(refused(r)).toBe(false);
    const mine = 2 * GAMES.shoes.ringer + GAMES.shoes.leaner;
    const them = theirShoes(s, 'hazel');
    const said = lines(r).join(' ');
    expect(said).toMatch(/Two ringers in four throws/);
    expect(said).toContain(
      mine > them ? `you beat Hazel, ${mine} to ${them}` : mine < them ? `Hazel beats you` : `tie at ${mine}`,
    );
    expect(r.state.min).toBe(s.min + GAMES.min);
    expect(r.state.energy).toBe(s.energy - GAMES.energy);
    expect(r.state.today).toContain('shoes');
    expect(refused(run(r.state, { t: 'shoes', throws: [1, 1, 1, 1] }))).toBe(true);
  });

  it('takes only four throws, each clean, near or off', () => {
    expect(refused(run(base(), { t: 'shoes', throws: [1, 1, 1] }))).toBe(true);
    expect(refused(run(base(), { t: 'shoes', throws: [1, 1, 1, 0.7] }))).toBe(true);
  });

  it('throws a ringer about `odds` of the time for the others', () => {
    const avg =
      Array.from({ length: 300 }, (_, d) => theirShoes(base({ day: d }), 'hazel')).reduce(
        (a, b) => a + b,
        0,
      ) / 300;
    const expected =
      GAMES.shoes.throws * (GAMES.shoes.odds * GAMES.shoes.ringer + GAMES.shoes.lean * GAMES.shoes.leaner);
    expect(Math.abs(avg - expected)).toBeLessThan(0.4);
  });
});

describe('liar’s dice', () => {
  it('deals a hand from the seed, and nothing else happens till it’s played', () => {
    const s = base({ day: 5 });
    const r = run(s, { t: 'dice', do: 'deal' });
    expect(r.state.table).toEqual(dealDice(s, 'hazel'));
    expect(r.state.table!.mine).toHaveLength(GAMES.dice.n);
    expect(refused(run(r.state, { t: 'act', act: 'lot.sleep' }))).toBe(true);
    expect(refused(run(r.state, { t: 'dice', do: 'deal' }))).toBe(true);
    expect(refused(run(s, { t: 'dice', do: 'call' }))).toBe(true);
  });

  it('opens on their best face: what they hold, one more, or a bluff of two, and your cup is the tell', () => {
    const over = new Set<number>();
    let none = 0;
    let noneRight = 0;
    for (let d = 1; d < 400; d++) {
      const t = dealDice(base({ day: d }), 'hazel');
      const held = t.theirs.filter((x) => x === t.bid.face).length;
      expect(t.bid.n - held).toBeGreaterThanOrEqual(0);
      expect(t.bid.n - held).toBeLessThanOrEqual(2);
      over.add(t.bid.n - held);
      const yours = t.mine.filter((x) => x === t.bid.face).length;
      // Holding two of their face, their bid stands.
      if (yours >= 2) expect(held + yours).toBeGreaterThanOrEqual(t.bid.n);
      if (yours === 0) {
        none++;
        if (held < t.bid.n) noneRight++;
      }
    }
    expect(over).toEqual(new Set([0, 1, 2]));
    // Holding none of it, calling is right more often than not, and not always.
    expect(noneRight / none).toBeGreaterThan(0.5);
    expect(noneRight / none).toBeLessThan(0.8);
  });

  it('calls it right by what’s under both cups', () => {
    for (let d = 1; d < 30; d++) {
      const r = run(base({ day: d }), { t: 'dice', do: 'deal' });
      const t = r.state.table!;
      const n = [...t.mine, ...t.theirs].filter((x) => x === t.bid.face).length;
      const out = run(r.state, { t: 'dice', do: 'call' });
      expect(out.state.table).toBeNull();
      expect(lines(out).join(' ')).toMatch(n >= t.bid.n ? /telling the truth/ : /bluffing/);
      expect(lines(out).join(' ')).toContain(bidWords(n, t.bid.face));
    }
  });

  it('raises your best face; they call it or let it go', () => {
    const seen = new Set<string>();
    for (let d = 1; d < 60; d++) {
      const t = run(base({ day: d }), { t: 'dice', do: 'deal' }).state.table!;
      const up = yourRaise(t);
      // The least that beats theirs: a higher face at the same count, or one more.
      expect(up.n * 6 + up.face).toBeGreaterThan(t.bid.n * 6 + t.bid.face);
      expect(up.n).toBeLessThanOrEqual(t.bid.n + 1);
      const out = lines(
        run(run(base({ day: d }), { t: 'dice', do: 'deal' }).state, { t: 'dice', do: 'raise' }),
      ).join(' ');
      seen.add(theyCall(t, up) ? (/Yours/.test(out) ? 'won' : 'lost') : 'folded');
      if (!theyCall(t, up)) expect(out).toMatch(/lets it go/);
    }
    // Over a couple of months, all three happen.
    expect(seen).toEqual(new Set(['won', 'lost', 'folded']));
  });

  it('saves a hand on the go, and won’t load a broken one', () => {
    const s = run(base(), { t: 'dice', do: 'deal' }).state;
    const back = fromSave(toSave(s, 'test'));
    expect(back.ok && back.state.table).toEqual(s.table);
    const bad = JSON.parse(toSave(s, 'test'));
    bad.state.table.mine = [7, 1, 1, 1, 1];
    expect(fromSave(JSON.stringify(bad)).ok).toBe(false);
  });
});

describe('what the games pay', () => {
  it('is bond with whoever’s playing, once a day however many games, as a day climbing gives', () => {
    const s = base({ people: regulars, day: 7 });
    const players = atFire(s);
    const shoes = run(s, { t: 'shoes', throws: [0, 0, 0, 0] }).state;
    for (const w of players) expect(shoes.people[w]!.bond).toBe(regulars[w as 'hazel'].bond + 1);
    const dice = run(run(shoes, { t: 'dice', do: 'deal' }).state, { t: 'dice', do: 'call' }).state;
    expect(dice.people.hazel!.bond).toBe(shoes.people.hazel!.bond);
    // Climbed with Hazel today already: the fire adds nothing to it.
    const climbed = base({ people: { hazel: { bond: 10, last: 7 } }, day: 7 });
    expect(run(climbed, { t: 'shoes', throws: [1, 1, 1, 1] }).state.people.hazel!.bond).toBe(10);
  });

  it('is company, for psyche', () => {
    const s = run(base({ day: 3 }), { t: 'shoes', throws: [0, 0, 0, 0] }).state;
    expect(s.people.hazel!.last).toBe(3);
  });
});
