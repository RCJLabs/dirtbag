// Which game this copy is (Phase 15.3): the full game, or the demo, packed from the same
// desktop code. A packed copy says so in edition.json beside main.js, which pack.mjs writes;
// a dev run or a test says so in DIRTBAG_EDITION. The demo runs the demo's build, keeps its
// own user-data folder (a demo and the full game on one machine never share a save file, as
// 14.5c's keys keep them apart in one browser), and is its own Steam app, as Steam's demos are.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const EDITIONS = {
  full: { demo: false, name: 'Dirtbag', build: 'dist', steamKey: 'appId' },
  demo: { demo: true, name: 'Dirtbag Demo', build: 'dist-demo', steamKey: 'demoAppId' },
};

export function editionOf(here, env = {}) {
  let id = env.DIRTBAG_EDITION;
  if (!id) {
    try {
      id = JSON.parse(readFileSync(join(here, 'edition.json'), 'utf8')).edition;
    } catch {
      id = 'full';
    }
  }
  return EDITIONS[id] ?? EDITIONS.full;
}
