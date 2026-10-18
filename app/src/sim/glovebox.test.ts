// Phase 36.4: the glovebox deck. The fire's three games for matchsticks on a copy of the
// climber: the cast at its table, the fire's limits lifted, and the career never touched.
import { describe, expect, it } from 'vitest';
import { cardsBlocked } from './cards';
import { GAMES } from './dials';
import { atFire, fireOut, gameBlocked } from './fire';
import { act, newGame } from './game';
import { GLOVE_CAST, gloveShort, gloveTable } from './glovebox';
import type { Action, GameState } from './types';

// A climber at the gym at noon, with a knock waiting: nowhere near a fire.
const career = (): GameState => ({
  ...act(newGame('glove'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  day: 12,
  at: 'gym',
  min: 12 * 60,
  energy: 20,
  cash: 3,
  encounter: { kind: 'knock', id: 'jump' } as GameState['encounter'],
});
const play = (g: GameState, ...as: Action[]) => as.reduce((s, a) => ({ ...act(s, a).state, energy: 100 }), g);
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';

describe('the glovebox deck', () => {
  it('deals the cast in on a copy of the climber, a box of matches in hand and nothing else on', () => {
    const s = career();
    const g = gloveTable(s, 1);
    expect(g.glovebox).toEqual({ cast: GLOVE_CAST });
    expect(g.cash).toBe(GAMES.glove.sticks);
    expect(g).toMatchObject({ table: null, cards: null, encounter: null, breakdown: null, expedition: null });
    expect(g.seed).not.toBe(s.seed);
    expect(gloveTable(s, 2).seed).not.toBe(g.seed);
    expect(atFire(g)).toEqual(GLOVE_CAST);
  });

  it('lifts the fire’s limits: where, when, once a night, tired, and the fire’s close', () => {
    const g = gloveTable(career(), 1);
    expect(gameBlocked(g, 'dice')).toBeNull();
    // By day and away from the Lot, the cast is still dealt in.
    const noon = { ...g, at: 'gym', min: 12 * 60 };
    expect(atFire(noon)).toEqual(GLOVE_CAST);
    expect(gameBlocked(noon, 'dice')).toBeNull();
    expect(cardsBlocked(noon, 'holdem')).toBeNull();
    expect(gameBlocked({ ...g, today: ['shoes'] }, 'shoes')).toBeNull();
    expect(cardsBlocked({ ...g, today: ['bj', 'holdem'] }, 'bj')).toBeNull();
    expect(cardsBlocked({ ...g, cash: 1 }, 'holdem')).toMatch(/matchsticks/);
    expect(fireOut({ ...g, min: GAMES.late + 600 })).toBe(false);
  });

  it('plays all three games on the copy, as often as you like', () => {
    let g = gloveTable(career(), 1);
    g = play(g, { t: 'dice', do: 'deal' });
    expect(g.table!.seats.map((p) => p.who)).toEqual(['you', ...GLOVE_CAST]);
    g = play(g, { t: 'dice', do: 'leave' }, { t: 'dice', do: 'deal' }, { t: 'dice', do: 'leave' });
    expect(g.table).toBeNull();
    g = play(g, { t: 'bj', do: 'sit' }, { t: 'bj', do: 'deal', bet: GAMES.bj.bets[0]! });
    expect(g.cards).toMatchObject({ game: 'bj', who: GLOVE_CAST[0] });
    for (let k = 0; k < 6 && g.cards!.bj && !g.cards!.bj.paid; k++) g = play(g, { t: 'bj', do: 'stand' });
    g = play(g, { t: 'bj', do: 'leave' }, { t: 'bj', do: 'sit' });
    expect(g.cards?.game).toBe('bj');
    g = play(g, { t: 'bj', do: 'leave' }, { t: 'holdem', do: 'sit' }, { t: 'holdem', do: 'deal' });
    expect(g.cards!.he!.seats.map((p) => p.who)).toEqual(['you', ...GLOVE_CAST]);
    for (let k = 0; k < 40 && g.cards!.he && !g.cards!.he.won; k++) g = play(g, { t: 'holdem', do: 'call' });
    expect(g.cards!.he!.won).not.toBeNull();
    // Up again: the matchsticks in front of you back in the box with the rest.
    const up = play(g, { t: 'holdem', do: 'leave' });
    expect(up.cards).toBeNull();
    expect(up.cash).toBe(g.cash + g.cards!.chips);
  });

  it('never touches the climber it was copied from', () => {
    const s = career();
    const before = JSON.stringify(s);
    let g = gloveTable(s, 1);
    g = play(g, { t: 'dice', do: 'deal' }, { t: 'dice', do: 'bid', n: 1, face: 2 });
    g = play(g, { t: 'dice', do: 'leave' }, { t: 'holdem', do: 'sit' }, { t: 'holdem', do: 'deal' });
    expect(JSON.stringify(s)).toBe(before);
    // And the career itself still can't play at the gym, at noon, with the knock unanswered.
    expect(refused(act(s, { t: 'dice', do: 'deal' }))).toBe(true);
  });

  it('offers a new box once what’s left won’t cover a hand of either card game', () => {
    const g = gloveTable(career(), 1);
    expect(gloveShort(g)).toBe(false);
    // Short of blackjack's least bet, hold'em's blinds are still covered.
    const low = { ...g, cash: GAMES.bj.bets[0]! - 1 };
    expect(gloveShort(low)).toBe(true);
    expect(cardsBlocked(low, 'bj')).toMatch(/matchsticks/);
    expect(cardsBlocked(low, 'holdem')).toBeNull();
    expect(gloveShort({ ...g, cash: 1 })).toBe(true);
    // Sat at a table, it isn't short: the matchsticks are in front of you.
    expect(gloveShort({ ...g, cash: 0, table: play(g, { t: 'dice', do: 'deal' }).table })).toBe(false);
  });
});
