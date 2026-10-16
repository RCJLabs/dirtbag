// Phase 19.1 (Evan's calls, 16 Oct 2026): at launch the web serves the demo, and a player
// whose climber was here before that keeps the full game. The full game's build runs the
// demo's rules (sim/edition.ts) till it's unlocked, with the same climber and the same keys,
// so an unlock carries on from the morning it happens.
//
// The gate is a build switch, off until launch: `__GATE__` (vite.config.ts, from
// DIRTBAG_GATE=1 or `--mode gated`). While it's off, everyone plays the full game, and every
// player with a climber is quietly marked as here before the gate. The first gated start
// marks anyone with a climber or a v0.956 career who wasn't, then remembers that it has: a
// climber started after that plays the demo's rules till it's unlocked, and isn't marked by a
// build from before the flip either, if one's put back.
//
// It's an honor gate. Everything it keeps is in the player's own storage, and nothing is
// checked anywhere else: the privacy page promises no network calls.

import { asDemo, DEMO, DEMO_BUILD, fromSave } from '../sim';
import { findLegacy } from './legacy';
import { ours, store } from './storage';

declare const __GATE__: boolean | undefined;

// The gate's switch, as this build was made.
export const GATE: boolean = typeof __GATE__ !== 'undefined' && __GATE__ === true;

// The full game's own build, playing the demo's rules till it's unlocked: the demo's build
// never is.
export const locked = (): boolean => DEMO && !DEMO_BUILD;

// Phase 19.2: where else the full game is sold, for a locked game's last card outside the
// Android app (whose only way to buy is Play's). Evan's to fill at launch: the Steam page, and
// itch.io's.
export const STORES: readonly { name: string; url: string }[] = [];

// How the full game came to be unlocked here: the desktop's full edition (bought on Steam,
// never written down); a climber here before the gate; Play's unlock in the Android app
// (19.2).
export type How = 'desktop' | 'before' | 'play';

const UNLOCK = () => ours('unlock');
const GATED = () => ours('gate');

// The unlock this storage remembers, if any.
export function unlockIn(ls: Storage | null): How | null {
  try {
    const raw = ls?.getItem(UNLOCK());
    const how: unknown = raw ? (JSON.parse(raw) as { how?: unknown }).how : null;
    return how === 'before' || how === 'play' ? how : null;
  } catch {
    return null;
  }
}

// Writes an unlock down. False if it couldn't be kept.
export function keepUnlock(ls: Storage | null, how: Exclude<How, 'desktop'>): boolean {
  try {
    if (!ls) return false;
    ls.setItem(UNLOCK(), JSON.stringify({ how }));
    return true;
  } catch {
    return false;
  }
}

// A climber already here: a save (or the morning before it) that loads, with a name; or a
// v0.956 career in this browser.
function climberIn(ls: Storage, legacy: Storage | null): boolean {
  for (const key of [ours('save'), ours('save.prev')]) {
    try {
      const raw = ls.getItem(key);
      const got = raw ? fromSave(raw) : null;
      if (got?.ok && got.state.climber.name) return true;
    } catch {
      // An unreadable key is no climber.
    }
  }
  return !!findLegacy(legacy);
}

export interface Opening {
  gate: boolean;
  desktop: boolean;
  // Where v0.956 kept its career: the browser's localStorage, which the desktop's store isn't.
  legacy: Storage | null;
}

// Whether the full game is open here, and how; null while it's locked. Writes down what the
// gate needs to remember: a climber here before it, and that it has been gated.
export function opened(ls: Storage | null, o: Opening): How | null {
  if (o.desktop) return 'desktop';
  const kept = unlockIn(ls);
  if (kept || !ls) return kept;
  // Once the gate has started here, nobody else is from before it: not even under a build from
  // before the flip, put back for a rollback.
  try {
    if (ls.getItem(GATED()) !== null) return null;
  } catch {
    return null;
  }
  const here = climberIn(ls, o.legacy);
  // The unlock goes down before the mark: if it can't be kept, there's no mark either, and the
  // next start looks again. Every way it can go wrong errs toward the player.
  if (here && !keepUnlock(ls, 'before')) return 'before';
  if (o.gate) {
    try {
      ls.setItem(GATED(), '1');
    } catch {
      // Not kept: the next start looks again.
    }
  }
  return here ? 'before' : null;
}

// At start-up, before the game boots: the demo's rules while the full game is locked. The
// demo's build is the demo whatever happens here.
export function openGate(desktop: boolean): How | null {
  if (DEMO_BUILD) return null;
  let legacy: Storage | null = null;
  try {
    legacy = window.localStorage;
  } catch {
    // No browser storage: no v0.956 career to find.
  }
  const how = opened(store(), { gate: GATE, desktop, legacy });
  asDemo(GATE && !how);
  return how;
}
