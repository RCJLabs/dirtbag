// Writes the package.json version into the files that carry a copy of it: the service-worker
// cache name and the TWA manifest. Run after bumping the version: `npm run stamp`.
// appVersionCode is deliberately left alone — the TWA workflow derives it from the clock at
// build time so every upload to Play is strictly greater than the last.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, read, packageVersion, cacheName, CACHE_RE } from './lib/version.mjs';

const version = packageVersion();
const write = (rel, text) => writeFileSync(join(ROOT, rel), text);

const sw = read('service-worker.js');
if (!CACHE_RE.test(sw)) throw new Error(`service-worker.js has no "const CACHE = '…';" line`);
const nextSw = sw.replace(CACHE_RE, `const CACHE = '${cacheName(version)}';`);
if (nextSw !== sw) write('service-worker.js', nextSw);

const twaText = read('twa-manifest.json');
const twa = JSON.parse(twaText);
twa.appVersionName = version;
const nextTwa = JSON.stringify(twa, null, 2); // matches the file's existing format (no final newline)
if (nextTwa !== twaText) write('twa-manifest.json', nextTwa);

console.log(`stamped ${version}: service-worker.js ${nextSw === sw ? 'unchanged' : 'updated'}, twa-manifest.json ${nextTwa === twaText ? 'unchanged' : 'updated'}`);
