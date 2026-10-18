// Phase 22.9a: the games at the fire. Who's there, horseshoes from your throws once a night,
// and bond with whoever's playing no faster than a day climbing together. Liar's dice is
// Perudo now (perudo.test.ts, Phase 36.1).
import { describe, expect, it } from 'vitest';
import { GAMES } from './dials';
import { atFire, bidWords, gameBlocked, theirShoes } from './fire';
import { act, newGame } from './game';
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
    // Dice go on as long as the fire does; nothing does once it's out.
    expect(gameBlocked(base({ today: ['dice'] }), 'dice')).toBeNull();
    expect(gameBlocked(base({ min: GAMES.late }), 'shoes')).toMatch(/coals/);
    expect(bidWords(20, 6)).toBe('twenty 6s');
    expect(bidWords(1, 3)).toBe('one 3');
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

describe('what the games pay', () => {
  it('is bond with whoever’s playing, once a day however many games, as a day climbing gives', () => {
    const s = base({ people: regulars, day: 7 });
    const players = atFire(s);
    const shoes = run(s, { t: 'shoes', throws: [0, 0, 0, 0] }).state;
    for (const w of players) expect(shoes.people[w]!.bond).toBe(regulars[w as 'hazel'].bond + 1);
    const dice = run(run(shoes, { t: 'dice', do: 'deal' }).state, { t: 'dice', do: 'leave' }).state;
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
