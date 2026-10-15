// Phase 32: the Hollow, the crag nobody has a topo for. 32.1: it's on no map and no road you
// know of until you've found it; finding it (the quest, 32.2) puts it in `unlocked`.

import { PLACES } from './content/places';
import type { GameState } from './types';

// Whether you know a place is there: every place but a hidden one you haven't found.
export const known = (s: GameState, id: string): boolean => !PLACES[id]?.hidden || s.unlocked.includes(id);
