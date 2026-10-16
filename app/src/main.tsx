// Fonts are bundled with the build: nothing on the page may load from another site. Latin
// only; the game's text doesn't reach past it.
import '@fontsource/patrick-hand/latin-400';
import '@fontsource/patrick-hand-sc/latin-400';
import '@fontsource/big-shoulders-display/latin-800';
import './ui/styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { desktop, fileStorage } from './game/desktop';
import { Game } from './game/game';
import { keepIn } from './game/storage';
import { askPlay } from './game/play';
import { locked, openGate } from './game/unlock';
import { App } from './ui/App';
import { crashed, notACrash } from './ui/crash';

// Phase 14.3: on the desktop, the game's keys live in a file Steam Cloud syncs, read before
// the game boots.
if (desktop) keepIn(fileStorage(desktop));
// Phase 19.1: the full game, or its demo's rules till it's unlocked, settled before the game
// boots and never changed while it runs.
openGate(!!desktop);

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const game = new Game({ still });
// Phase 19.2: while it's locked, in the Android app, Play's word on it: bought before (a new
// phone) opens it at once; otherwise the last card offers it at Play's price.
if (locked())
  void askPlay(
    () => game.redraw(),
    () => game.reopen(),
  );

// Canvas text doesn't ask for a web font by itself in every browser; ask up front so the
// signs and labels switch from the fallback within a frame or two.
for (const f of ['800 12px "Big Shoulders Display"', '15px "Patrick Hand SC"', '15px "Patrick Hand"'])
  void document.fonts?.load(f).catch(() => undefined);

// The service worker makes the game start with no connection. Built only for production
// (in dev every reload should hit the server), and only on the installable page, the one
// that links the manifest: an embedded copy has no worker to register.
// register() on a worker that's already registered doesn't look for a new one, and the
// browser's own look can wait a day. So every launch asks: a page served by an older worker
// (v0.956's, after R3's switch-over, or last week's build) hands over within seconds. The
// desktop build has its files on disk, and no worker.
if (
  import.meta.env.PROD &&
  !desktop &&
  'serviceWorker' in navigator &&
  document.querySelector('link[rel="manifest"]')
)
  window.addEventListener(
    'load',
    () =>
      void navigator.serviceWorker
        .register('./service-worker.js')
        .then((r) => r.update())
        .catch(() => undefined),
  );

// Phase 15.2: a crash shows the error screen, not a blank page. React's own (a render that
// threw has torn the page down: only a reload) and anything thrown outside it, in the frame
// loop or a handler (the page may live through it). A promise left to fail isn't a crash: the
// game goes on, as it did.
window.addEventListener('error', (e) => {
  if (!notACrash(e.message, e.error)) crashed(e.error ?? e.message, true);
});

createRoot(document.getElementById('root')!, { onUncaughtError: (e) => crashed(e, false) }).render(
  <StrictMode>
    <App game={game} />
  </StrictMode>,
);
