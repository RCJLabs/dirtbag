// Where the window was and how big, and whether it was full-screen, kept for the next launch
// in the user-data folder. A file that won't read just means the default window.
import { readFileSync, writeFileSync } from 'node:fs';

// A Steam Deck's screen, and the shape the game's landscape layout was made on.
const DEFAULT = { width: 1280, height: 800, fullscreen: false };

export function loadWindow(path) {
  try {
    const w = JSON.parse(readFileSync(path, 'utf8'));
    const n = (v) => (Number.isFinite(v) ? Math.round(v) : undefined);
    return {
      width: Math.max(360, n(w.width) ?? DEFAULT.width),
      height: Math.max(600, n(w.height) ?? DEFAULT.height),
      x: n(w.x),
      y: n(w.y),
      fullscreen: w.fullscreen === true,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function keepWindow(path, win) {
  try {
    const b = win.getNormalBounds();
    writeFileSync(path, JSON.stringify({ ...b, fullscreen: win.isFullScreen() }));
  } catch {
    // Next launch opens the default window; nothing else depends on it.
  }
}
