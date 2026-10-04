// Phase 25.1: giving, after v0.956's food bank and access fund. Once a week each: the food
// bank at the market for a little psyche, the access fund at the gear shop for the old crowd's
// nod. Over a life it adds up, and the Record Book notices.

import { GIVING } from './dials';
import type { GameState } from './types';

export type Gift = 'food' | 'access';

// Where each is given.
export const GIFT_AT: Record<Gift, string> = { food: 'market', access: 'shop' };

// Why you can't give this now, or null.
export function giveBlocked(s: GameState, to: Gift): string | null {
  if (s.at !== GIFT_AT[to])
    return to === 'food' ? 'The food bank’s at the market' : 'The access fund’s jar is at the gear shop';
  const last = s.giving[to];
  if (last && s.day - last < GIVING.every) return `You gave this week. Again on day ${last + GIVING.every}`;
  if (s.cash < GIVING[to].cash) return `It’s $${GIVING[to].cash}, in hand`;
  return null;
}
