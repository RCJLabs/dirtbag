// Phase 36.4 (Evan's call, 18 Oct 2026): the glovebox deck. The fire's three games for
// matchsticks against the cast, as long as you like, outside the career: played by the same
// rules on a copy of the climber that's thrown away after, so no time passes and nothing
// carries over. The copy's `glovebox` flag seats the cast at its table and lifts the fire's
// limits; its cash is the box of matches.

import { GAMES } from './dials';
import type { GameState } from './types';

// Who's dealt in: the three who play at the fire. Hazel deals the blackjack.
export const GLOVE_CAST = ['hazel', 'sage', 'frank'];

// The glovebox's table, from the climber as they are: its own seed (the `n`th sitting), at
// the Lot at night with nothing else on, a box of matches in hand.
export function gloveTable(s: GameState, n: number): GameState {
  return {
    ...s,
    seed: `${s.seed}/glovebox/${n}`,
    glovebox: { cast: [...GLOVE_CAST] },
    at: 'lot',
    min: 21 * 60,
    energy: 100,
    cash: GAMES.glove.sticks,
    today: [],
    table: null,
    cards: null,
    encounter: null,
    breakdown: null,
    expedition: null,
    wall: null,
  };
}

// A new box is there for the taking once what's left won't cover the least a hand of either card
// game takes (liar's dice is played for nothing).
export const gloveShort = (g: GameState): boolean =>
  !g.table && !g.cards && Math.floor(g.cash) < Math.max(GAMES.bj.bets[0]!, GAMES.holdem.blinds[1]!);
