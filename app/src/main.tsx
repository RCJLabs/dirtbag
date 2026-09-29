// Fonts are bundled with the build: nothing on the page may load from another site. Latin
// only; the game's text doesn't reach past it.
import '@fontsource/patrick-hand/latin-400';
import '@fontsource/patrick-hand-sc/latin-400';
import '@fontsource/big-shoulders-display/latin-800';
import './ui/styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './game/game';
import { App } from './ui/App';

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const game = new Game({ still });

// Canvas text doesn't ask for a web font by itself in every browser; ask up front so the
// signs and labels switch from the fallback within a frame or two.
for (const f of ['800 12px "Big Shoulders Display"', '15px "Patrick Hand SC"', '15px "Patrick Hand"'])
  void document.fonts?.load(f).catch(() => undefined);

// The service worker makes the game start with no connection. Built only for production
// (in dev every reload should hit the server), and only on the installable page, the one
// that links the manifest: an embedded copy has no worker to register.
// register() on a worker that's already registered doesn't look for a new one, and the
// browser's own look can wait a day. So every launch asks: a page served by an older worker
// (v0.956's, after R3's switch-over, or last week's build) hands over within seconds.
if (import.meta.env.PROD && 'serviceWorker' in navigator && document.querySelector('link[rel="manifest"]'))
  window.addEventListener(
    'load',
    () =>
      void navigator.serviceWorker
        .register('./service-worker.js')
        .then((r) => r.update())
        .catch(() => undefined),
  );

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App game={game} />
  </StrictMode>,
);
