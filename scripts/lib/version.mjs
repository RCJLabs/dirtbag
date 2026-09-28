// One version string, read from package.json, drives the service-worker cache name and the TWA
// manifest. The app's own copy is compiled into index.html by the source build, so here it can
// only be checked, not written.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = new URL('../..', import.meta.url).pathname;
export const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

export function packageVersion() {
  const v = JSON.parse(read('package.json')).version;
  if (!/^\d+\.\d+\.\d+$/.test(v)) throw new Error(`package.json version "${v}" is not plain X.Y.Z`);
  return v;
}

// 0.956.0 -> dirtbag-v09560. This is the format the live service worker already uses, kept so
// that stamping an unchanged version leaves service-worker.js byte-identical (a changed SW makes
// every installed client re-download the whole ~10 MB game). Phase 2 replaces this with a hash
// of the build.
export const cacheName = (v) => `dirtbag-v${v.split('.').join('')}`;

export const CACHE_RE = /const CACHE = '([^']*)';/;

// The bundle declares the version right before the "what's new" storage key, e.g.
// ZN="0.956.0",eB="dirtbag-whatsnew-seen". The minified names change per build; the key doesn't.
// Used only to say *which* version index.html has when the check fails.
export function embeddedVersion(html) {
  const m = html.match(/"(\d+\.\d+\.\d+)",[\w$]+="dirtbag-whatsnew-seen"/);
  return m ? m[1] : null;
}
