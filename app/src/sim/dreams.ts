// Dreams (Phase 22.8): what you own, and what it takes off. The savings pot is the state's
// `dream.pot`: the card and the bills never touch it, and the broke check counts it.

import type { DreamId } from './content/dreams';
import { DREAM } from './dials';
import type { GameState } from './types';

export const owns = (s: GameState, id: DreamId): boolean => s.dream.owned.includes(id);

// An expedition's price, with the War Chest.
export const expedCost = (s: GameState, cost: number): number =>
  Math.round(cost * (owns(s, 'warchest') ? DREAM.warchest : 1));

// A spot's price for the night, with the Rig and Home Base.
export const spotCost = (s: GameState, spot: GameState['spot'], cost: number): number =>
  spot === 'lot' && owns(s, 'homebase') ? 0 : Math.round(cost * (owns(s, 'rig') ? DREAM.rig : 1));

// Money that's yours, pot and all: what "broke" means.
export const worth = (s: GameState): number => s.cash + s.dream.pot;
