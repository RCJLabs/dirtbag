// Saves in the game's store (localStorage on the web; see storage.ts). The rules from the
// audit, where v0.956 lost players' games:
//   - Nothing is written until a load has succeeded or a new game has started.
//   - A save that won't load is moved aside to a quarantine key, never overwritten.
//   - The last save from an earlier day is kept as a fallback.
//   - A failed write is reported, not swallowed.

import { DEMO_BUILD, fromSave, newGame, toSave, type GameState } from '../sim';
import { DEMO_SAVE, ours, store } from './storage';
import { DEFAULT_BINDS, readBinds, type Binds } from './binds';

// The demo's keys are its own (storage.ts, Phase 14.5c).
const KEY = () => ours('save');
const PREV = () => ours('save.prev');
const QUARANTINE = () => ours('save.corrupt.');
// Phase 14.2: the climber a save brought in from a file took the place of, kept in case.
const REPLACED = () => ours('save.replaced');

export interface Boot {
  state: GameState;
  // What to tell the player about how the load went, if anything.
  note: string | null;
}

function quarantine(ls: Storage, raw: string): string {
  const key = QUARANTINE() + Date.now();
  try {
    ls.setItem(key, raw);
  } catch {
    // Storage full: leave the bad save where it is rather than lose it.
    return KEY();
  }
  return key;
}

export function boot(seed: () => string): Boot {
  const ls = store();
  const noStore = {
    state: newGame(seed()),
    note: "This browser won't keep a save. Progress ends when you close it.",
  };
  if (!ls) return noStore;
  let raw: string | null;
  try {
    raw = ls.getItem(KEY());
  } catch {
    return noStore;
  }
  if (raw === null) return { state: newGame(seed()), note: null };
  const got = fromSave(raw);
  if (got.ok) return { state: got.state, note: null };
  const kept = quarantine(ls, raw);
  try {
    if (kept !== KEY()) ls.removeItem(KEY());
  } catch {
    // Leaving it in place is safe: the next save overwrites only a save that loaded.
  }
  let prev: string | null = null;
  try {
    prev = ls.getItem(PREV());
  } catch {
    // Unreadable fallback: treat it as missing.
  }
  const back = prev === null ? null : fromSave(prev);
  if (back?.ok) {
    return {
      state: back.state,
      note: `Your last save wouldn't load (${got.why}). Back to the morning before; the damaged one is kept.`,
    };
  }
  return {
    state: newGame(seed()),
    note: `Your save wouldn't load (${got.why}). It's kept, and this is a new game.`,
  };
}

let warned = false;

// Returns false if the write failed, so the caller can say so.
export function save(state: GameState): boolean {
  const ls = store();
  if (!ls) return false;
  try {
    const cur = ls.getItem(KEY());
    if (cur !== null) {
      const was = fromSave(cur);
      if (was.ok && was.state.day < state.day) ls.setItem(PREV(), cur);
    }
    ls.setItem(KEY(), toSave(state, __APP_VERSION__));
    if (!warned) {
      warned = true;
      void navigator.storage?.persist?.().catch(() => undefined);
    }
    return true;
  } catch {
    return false;
  }
}

// Phase 14.2: a save brought in from a file takes the place of this one. The climber it
// replaces is kept aside, and the earlier day's fallback goes with them: a save that won't
// load must never fall back to somebody else.
export function replace(state: GameState): boolean {
  const ls = store();
  if (!ls) return false;
  try {
    const cur = ls.getItem(KEY());
    if (cur !== null) ls.setItem(REPLACED(), cur);
    ls.removeItem(PREV());
    ls.setItem(KEY(), toSave(state, __APP_VERSION__));
    return true;
  } catch {
    return false;
  }
}

// Phase 15.2: the save as it's kept, for the error screen to hand over as a file without
// loading it (whatever broke may be in the loading); null if there's none or no store.
export function rawSave(): string | null {
  try {
    return store()?.getItem(KEY()) ?? null;
  } catch {
    return null;
  }
}

// Phase 14.5c: the demo's climber, where the full game finds one beside its own (the two share
// a site or a desktop folder): loaded as any save is, or null. The full game offers to carry
// on with them; the demo's copy stays where it is, the demo's to keep.
export function demoClimber(): GameState | null {
  if (DEMO_BUILD) return null;
  try {
    const raw = store()?.getItem(DEMO_SAVE);
    const got = raw ? fromSave(raw) : null;
    return got?.ok && got.state.climber.name ? got.state : null;
  } catch {
    return null;
  }
}

export function wipe(): void {
  try {
    const ls = store();
    ls?.removeItem(KEY());
    ls?.removeItem(PREV());
  } catch {
    // Nothing to wipe if storage is off.
  }
}

// Settings live beside the save, never in it: starting over keeps them, and a save that
// won't load doesn't take them with it.
const SETTINGS = () => ours('settings');

export interface Settings {
  // Follow the device, or override it either way.
  motion: 'system' | 'reduce' | 'full';
  text: 'normal' | 'large';
  sound: 'on' | 'quiet' | 'off';
  // A buzz in the hand on a send, a fall or a crux, where the device can.
  buzz: 'on' | 'off';
  // Phase 25: the music, made in code.
  music: 'on' | 'off';
  // Phase 14.6: frames a second in a corner, for checking a Deck holds 60.
  meter: 'off' | 'on';
  // Phase 14.6b: what the pad's buttons and the keys do.
  binds: Binds;
}

export const DEFAULT_SETTINGS: Settings = {
  motion: 'system',
  text: 'normal',
  sound: 'on',
  buzz: 'on',
  music: 'on',
  meter: 'off',
  binds: DEFAULT_BINDS,
};

export function loadSettings(): Settings {
  try {
    const raw = store()?.getItem(SETTINGS());
    if (!raw) return DEFAULT_SETTINGS;
    const v = JSON.parse(raw) as Partial<Settings>;
    return {
      motion: v.motion === 'reduce' || v.motion === 'full' ? v.motion : 'system',
      text: v.text === 'large' ? 'large' : 'normal',
      sound: v.sound === 'quiet' || v.sound === 'off' ? v.sound : 'on',
      buzz: v.buzz === 'off' ? 'off' : 'on',
      music: v.music === 'off' ? 'off' : 'on',
      meter: v.meter === 'on' ? 'on' : 'off',
      binds: readBinds(v.binds),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): boolean {
  try {
    const ls = store();
    if (!ls) return false;
    ls.setItem(SETTINGS(), JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
