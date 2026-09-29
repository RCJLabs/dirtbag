// Writes package.json's version into every file that carries a copy (scripts/lib/version.mjs).
// Run after changing the version: `npm run stamp`.
// appVersionCode is deliberately left alone: the TWA workflow derives it from the clock at build
// time, so every upload to Play is strictly greater than the last.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { COPIES, ROOT, packageVersion, read } from './lib/version.mjs';

const version = packageVersion();
const done = COPIES.map(({ file, set, bare }) => {
  const text = read(file);
  const j = JSON.parse(text);
  set(j, version);
  const next = JSON.stringify(j, null, 2) + (bare ? '' : '\n');
  if (next === text) return `${file} unchanged`;
  writeFileSync(join(ROOT, file), next);
  return `${file} updated`;
});
console.log(`stamped ${version}: ${done.join(', ')}`);
