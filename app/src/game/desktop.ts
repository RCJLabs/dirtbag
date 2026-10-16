// Phase 14.3 (Evan's call): the desktop build's bridge (desktop/preload.cjs), there only when
// the game runs in it. The game's keys live in a file in the user-data folder, which Steam
// Cloud syncs; the window can go full-screen and quit; the Record Book unlocks on Steam; and
// (15.3) the demo shows the full game's store page.
export interface Desktop {
  all(): Record<string, string>;
  set(key: string, value: string): boolean;
  remove(key: string): boolean;
  // Asked with nothing, says whether it is; with a yes or a no, makes it so.
  fullscreen(on?: boolean): boolean;
  quit(): void;
  // Phase 14.4: Steam achievements by name; how many unlocked just now (none without Steam).
  achieve(names: string[]): number;
  // Phase 14.6b: whether Steam says this is a Steam Deck; and Steam's floating keyboard, under
  // a text field at x, y (w by h), in the window's pixels.
  deck(): boolean;
  keyboard(x: number, y: number, w: number, h: number): void;
  // Phase 15.3: the full game's store page in Steam's overlay, and whether Steam took it; and a
  // mailto: link handed to the player's own mail app, and whether it was one.
  toStore(): boolean;
  mail(url: string): boolean;
}

declare global {
  interface Window {
    dirtbagDesktop?: Desktop;
  }
}

export const desktop: Desktop | null = typeof window !== 'undefined' ? (window.dirtbagDesktop ?? null) : null;

// On a Deck, the pad's buttons are named as the Deck prints them (L1, not LB).
export const onDeck: boolean = desktop?.deck() ?? false;

// The file's keys as the Storage the game's store wants: read once at start-up, every write
// through to the file before it counts. A write the file refused throws, as a full
// localStorage does, so the game says it couldn't save.
export function fileStorage(d: Desktop): Storage {
  const keys = new Map(Object.entries(d.all()));
  return {
    get length() {
      return keys.size;
    },
    key: (i: number) => [...keys.keys()][i] ?? null,
    getItem: (k: string) => keys.get(k) ?? null,
    setItem(k: string, v: string) {
      const s = String(v);
      if (!d.set(k, s)) throw new Error('The save file could not be written.');
      keys.set(k, s);
    },
    removeItem(k: string) {
      if (d.remove(k)) keys.delete(k);
    },
    clear() {
      for (const k of [...keys.keys()]) if (d.remove(k)) keys.delete(k);
    },
  };
}
