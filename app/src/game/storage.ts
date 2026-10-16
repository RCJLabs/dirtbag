// Phase 14.2 (Evan's call): the one place the game's own keys are kept: the save, the plan,
// the settings. The web build keeps them in this browser's localStorage. The desktop build
// hands over a store of its own, backed by a file Steam Cloud can sync, before anything
// reads. It's Storage-shaped and synchronous, as every caller already is.
//
// v0.956's keys don't come through here: they were only ever in a browser's localStorage,
// and legacy.ts reads them there.

let chosen: Storage | null | undefined;

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
