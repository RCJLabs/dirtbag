// Steamworks (Phase 14.4, Evan's call: behind a stub). With Steam running and an app ID, the
// Record Book's entries unlock as achievements. Without either (a dev run, the smoke test, a
// copy started outside Steam) every call does nothing, and the game plays the same. The app ID
// is in steam.json: Valve's public test app (480) until Dirtbag has its own.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const OFF = { on: false, achieve: () => 0, deck: false, keyboard: () => false };

export function appIdIn(path) {
  try {
    const id = JSON.parse(readFileSync(path, 'utf8')).appId;
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function startSteam(appId) {
  if (!appId) return OFF;
  let client;
  try {
    client = createRequire(import.meta.url)('steamworks.js').init(appId);
  } catch {
    // Steam isn't running, or this machine has none: the stub.
    return OFF;
  }
  let deck = false;
  try {
    deck = client.utils.isSteamRunningOnSteamDeck();
  } catch {
    // An older Steam: not a Deck, as far as anyone can tell.
  }
  return {
    on: true,
    // Phase 14.6b: on a Deck the game names its buttons as the Deck prints them.
    deck,
    // Steam's floating keyboard, under a text field at x, y (w by h) in the window, for a
    // player with only a controller (Steam Deck Verified asks for it). It shows only when
    // Steam's overlay is up, which a copy Steam started has.
    keyboard(x, y, w, h) {
      try {
        client.utils.showFloatingGamepadTextInput(0, x, y, w, h).catch(() => false);
        return true;
      } catch {
        return false;
      }
    },
    // Each name Steam doesn't have unlocked yet; how many were new. A name the app doesn't
    // define (480's are Spacewar's) is just not unlocked.
    achieve(names) {
      let n = 0;
      for (const name of names) {
        try {
          if (!client.achievement.isActivated(name) && client.achievement.activate(name)) n++;
        } catch {
          // Unknown to this app: nothing to unlock.
        }
      }
      return n;
    },
  };
}

// Steam's overlay (Shift+Tab, the Deck's keyboard) needs its switches before the app is ready,
// and they put the GPU in-process, so only a copy Steam itself started (it sets SteamAppId)
// takes them.
export function overlayForSteam() {
  if (!process.env.SteamAppId && !process.env.SteamGameId) return false;
  try {
    createRequire(import.meta.url)('steamworks.js').electronEnableSteamOverlay();
    return true;
  } catch {
    return false;
  }
}
