// Packs the desktop build for this machine's platform and processor (Phase 14.3): the game
// from app/dist copied in beside main.js, then @electron/packager's folder, which is what a
// Steam depot takes. Build the game first. Run on each platform (the Build desktop workflow's
// matrix does); unsigned, and with Electron's own icon until there's art for one.
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packager } from '@electron/packager';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(HERE, '..', 'app', 'dist');
const GAME = join(HERE, 'game');
const { version } = JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8'));

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✗ No game to pack: run `npm run build --prefix app` first.');
  process.exit(1);
}
rmSync(GAME, { recursive: true, force: true });
cpSync(DIST, GAME, { recursive: true });

const out = await packager({
  dir: HERE,
  out: join(HERE, 'out'),
  name: 'Dirtbag',
  appVersion: version,
  overwrite: true,
  // Steamworks' native module and Steam's library load from disk, not from inside the archive.
  asar: { unpack: '**/*.{node,so,dll,dylib}' },
  prune: true,
  // Only what the app runs: the game, the main process and its parts.
  ignore: [
    /^\/out($|\/)/,
    /^\/steam($|\/)/,
    /^\/(smoke|pack|store\.test)\.mjs$/,
    /^\/(\.gitignore|STEAM\.md)$/,
  ],
});
console.log(`✓ packed ${version}: ${out.join(', ')}`);
