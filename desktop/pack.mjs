// Packs the desktop build for this machine's platform and processor (Phase 14.3): the game
// from app/dist copied in beside main.js, then @electron/packager's folder, which is what a
// Steam depot takes. Build the game first. Run on each platform (the Build desktop workflow's
// matrix does); unsigned.
//
//   npm run pack            the full game, from app/dist, as "Dirtbag"
//   npm run pack:demo       (15.3) the demo, from app/dist-demo (npm run build:demo --prefix
//                           app), as "Dirtbag Demo": its own folder, user-data folder and
//                           Steam app (edition.json, which this writes beside main.js)
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packager } from '@electron/packager';
import { editionOf } from './edition.js';
import { drawIcons } from './icons.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const edition = editionOf(HERE, { DIRTBAG_EDITION: process.argv.includes('--demo') ? 'demo' : 'full' });
const DIST = join(HERE, '..', 'app', edition.build);
const GAME = join(HERE, 'game');
const { version } = JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8'));

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(
    `✗ No game to pack: run \`npm run ${edition.demo ? 'build:demo' : 'build'} --prefix app\` first.`,
  );
  process.exit(1);
}
rmSync(GAME, { recursive: true, force: true });
cpSync(DIST, GAME, { recursive: true });
writeFileSync(join(HERE, 'edition.json'), `${JSON.stringify({ edition: edition.demo ? 'demo' : 'full' })}\n`);
const icon = drawIcons(join(HERE, 'icons'));

// The game's copy and the edition are the packed app's, not a dev run's: gone once it's packed,
// so `npm start` and the smoke run the repo's own build again. (The icons stay, for the
// window's icon in a dev run.)
const tidy = () => {
  rmSync(GAME, { recursive: true, force: true });
  rmSync(join(HERE, 'edition.json'), { force: true });
};
const out = await packager({
  dir: HERE,
  out: join(HERE, 'out'),
  name: edition.name,
  appVersion: version,
  icon,
  overwrite: true,
  // Steamworks' native module and Steam's library load from disk, not from inside the archive.
  asar: { unpack: '**/*.{node,so,dll,dylib}' },
  prune: true,
  // Only what the app runs: the game, the main process and its parts, and the window's icon.
  ignore: [
    /^\/out($|\/)/,
    /^\/steam($|\/)/,
    /^\/(smoke|pack|icons|store\.test|edition\.test)\.mjs$/,
    /^\/icons\/dirtbag\.(ico|icns)$/,
    /^\/(\.gitignore|STEAM\.md)$/,
  ],
}).finally(tidy);
console.log(`✓ packed ${edition.name} ${version}: ${out.join(', ')}`);
