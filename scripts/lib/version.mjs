// One version string, in the root package.json, for the whole release. Copies of it live in the
// rebuild's package (compiled into the game, and written into every save), both lockfiles, and
// the Play build's versionName. `npm run stamp` writes them; `npm run check` fails on drift.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = new URL('../..', import.meta.url).pathname;
export const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

export function packageVersion() {
  const v = JSON.parse(read('package.json')).version;
  if (!/^\d+\.\d+\.\d+$/.test(v)) throw new Error(`package.json version "${v}" is not plain X.Y.Z`);
  return v;
}

// Each file that carries a copy: how to read its copies, and how to write them.
export const COPIES = [
  {
    file: 'package-lock.json',
    get: (j) => [j.version, j.packages?.['']?.version],
    set: (j, v) => {
      j.version = v;
      if (j.packages?.['']) j.packages[''].version = v;
    },
  },
  { file: 'app/package.json', get: (j) => [j.version], set: (j, v) => (j.version = v) },
  {
    file: 'app/package-lock.json',
    get: (j) => [j.version, j.packages?.['']?.version],
    set: (j, v) => {
      j.version = v;
      if (j.packages?.['']) j.packages[''].version = v;
    },
  },
  // Bubblewrap writes this file without a final newline; keep it that way.
  { file: 'twa-manifest.json', get: (j) => [j.appVersionName], set: (j, v) => (j.appVersionName = v), bare: true },
];
