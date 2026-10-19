// Phase 14.2 (Evan's call): the one place the game's own keys are kept: the save, the plan,
// the settings. The web build keeps them in this browser's localStorage. The desktop build
// hands over a store of its own, backed by a file Steam Cloud can sync, before anything
// reads. It's Storage-shaped and synchronous, as every caller already is.
//
// v0.956's keys don't come through here: they were only ever in a browser's localStorage,
// and legacy.ts reads them there.

import { DEMO_BUILD } from '../sim';

let chosen: Storage | null | undefined;

// Phase 14.5c: the demo keeps its keys apart from the full game's, under dirtbag.demo., so the
// two never meet in one store (one site, one desktop folder): the demo would set the full
// game's climber aside as a save it can't play. Both stay clear of v0.956's dirtbag- keys. The
// demo's build, that is: the full game playing the demo's rules till it's unlocked (19.1) keeps
// the full game's keys, so the same climber carries on once it is.
export const ours = (name: string): string => (DEMO_BUILD ? 'dirtbag.demo.' : 'dirtbag.') + name;
// The demo's save, where the full game looks for a climber to carry on with.
export const DEMO_SAVE = 'dirtbag.demo.save';

// Phase 45: the problem of the day keeps its save in a slot of its own, so a day never
// touches the career's: its keys are the career's with `day.` in front (dirtbag.day.save, or
// dirtbag.demo.day.save in the demo). Settings stay where they are: they're the player's,
// whoever's climbing. Chosen once, at start-up, before the game boots.
let slot = '';
export function useSlot(name: '' | 'day'): void {
  slot = name ? `${name}.` : '';
}
export const slotted = (name: string): string => ours(slot + name);

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
