// Saves in localStorage. The rules from the audit, where v0.956 lost players' games:
//   - Nothing is written until a load has succeeded or a new game has started.
//   - A save that won't load is moved aside to a quarantine key, never overwritten.
//   - The last save from an earlier day is kept as a fallback.
//   - A failed write is reported, not swallowed.

import { fromSave, newGame, toSave, type GameState } from '../sim';

const KEY = 'dirtbag.save';
const PREV = 'dirtbag.save.prev';
const QUARANTINE = 'dirtbag.save.corrupt.';

export interface Boot {
  state: GameState;
  // What to tell the player about how the load went, if anything.
  note: string | null;
}

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function quarantine(ls: Storage, raw: string): string {
  const key = QUARANTINE + Date.now();
  try {
    ls.setItem(key, raw);
  } catch {
    // Storage full: leave the bad save where it is rather than lose it.
    return KEY;
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
    raw = ls.getItem(KEY);
  } catch {
    return noStore;
  }
  if (raw === null) return { state: newGame(seed()), note: null };
  const got = fromSave(raw);
  if (got.ok) return { state: got.state, note: null };
  const kept = quarantine(ls, raw);
  try {
    if (kept !== KEY) ls.removeItem(KEY);
  } catch {
    // Leaving it in place is safe: the next save overwrites only a save that loaded.
  }
  let prev: string | null = null;
  try {
    prev = ls.getItem(PREV);
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
    const cur = ls.getItem(KEY);
    if (cur !== null) {
      const was = fromSave(cur);
      if (was.ok && was.state.day < state.day) ls.setItem(PREV, cur);
    }
    ls.setItem(KEY, toSave(state, __APP_VERSION__));
    if (!warned) {
      warned = true;
      void navigator.storage?.persist?.().catch(() => undefined);
    }
    return true;
  } catch {
    return false;
  }
}

export function wipe(): void {
  try {
    const ls = store();
    ls?.removeItem(KEY);
    ls?.removeItem(PREV);
  } catch {
    // Nothing to wipe if storage is off.
  }
}

// Settings live beside the save, never in it: starting over keeps them, and a save that
// won't load doesn't take them with it.
const SETTINGS = 'dirtbag.settings';

export interface Settings {
  // Follow the device, or override it either way.
  motion: 'system' | 'reduce' | 'full';
  text: 'normal' | 'large';
  sound: 'on' | 'quiet' | 'off';
  // A buzz in the hand on a send, a fall or a crux, where the device can.
  buzz: 'on' | 'off';
}

export const DEFAULT_SETTINGS: Settings = { motion: 'system', text: 'normal', sound: 'on', buzz: 'on' };

export function loadSettings(): Settings {
  try {
    const raw = store()?.getItem(SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const v = JSON.parse(raw) as Partial<Settings>;
    return {
      motion: v.motion === 'reduce' || v.motion === 'full' ? v.motion : 'system',
      text: v.text === 'large' ? 'large' : 'normal',
      sound: v.sound === 'quiet' || v.sound === 'off' ? v.sound : 'on',
      buzz: v.buzz === 'off' ? 'off' : 'on',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): boolean {
  try {
    const ls = store();
    if (!ls) return false;
    ls.setItem(SETTINGS, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
