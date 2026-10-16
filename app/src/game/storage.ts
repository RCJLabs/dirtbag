// Phase 14.2 (Evan's call): the one place the game's own keys are kept: the save, the plan,
// the settings. The web build keeps them in this browser's localStorage. The desktop build
// hands over a store of its own, backed by a file Steam Cloud can sync, before anything
// reads. It's Storage-shaped and synchronous, as every caller already is.
//
// v0.956's keys don't come through here: they were only ever in a browser's localStorage,
// and legacy.ts reads them there.

import { DEMO } from '../sim';

let chosen: Storage | null | undefined;

// Phase 14.5c: the demo keeps its keys apart from the full game's, under dirtbag.demo., so the
// two never meet in one store (one site, one desktop folder): the demo would set the full
// game's climber aside as a save it can't play. Both stay clear of v0.956's dirtbag- keys.
export const ours = (name: string): string => (DEMO ? 'dirtbag.demo.' : 'dirtbag.') + name;
// The demo's save, where the full game looks for a climber to carry on with.
export const DEMO_SAVE = 'dirtbag.demo.save';

// Where the keys live from now on. Called once, at start-up, before the game boots; null
// keeps nothing, and undefined goes back to the browser's.
export function keepIn(s: Storage | null | undefined): void {
  chosen = s;
}

export function store(): Storage | null {
  if (chosen !== undefined) return chosen;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
