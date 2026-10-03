// What a player downloads for the rebuilt game, by part, against a budget. Text files count
// gzipped, as Pages serves them. Fonts count as-is, WOFF2 only: every browser that can run
// the game picks WOFF2, so the WOFF fallbacks are never fetched.
//
//   npm run build && npm run size
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = new URL('../dist/', import.meta.url).pathname;
// R0's budget was 250 KB (docs/ROADMAP.md, rebuild track). Evan raised it to 300 KB on
// 30 Sep 2026, when Phase 22's van reached 248.5 KB, and to 340 KB on 1 Oct 2026 for Phase
// 24's three expedition scenes (287.4 KB before them), and to 360 KB on 3 Oct 2026 for Phase
// 17's writing (338.3 KB after its cast). The art is code, so the game is mostly React, the
// fonts and the painters; this catches an accidental asset or dependency.
const BUDGET = 360 * 1024;

const PART = { '.js': 'script', '.css': 'styles', '.html': 'page', '.svg': 'icon', '.woff2': 'fonts' };
const TEXT = new Set(['.js', '.css', '.html', '.svg']);

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );

const parts = {};
let total = 0;
for (const f of files(DIST)) {
  const ext = extname(f);
  const part = PART[ext];
  if (!part) continue;
  const raw = readFileSync(f);
  const bytes = TEXT.has(ext) ? gzipSync(raw, { level: 9 }).length : raw.length;
  (parts[part] ??= []).push([relative(DIST, f), bytes]);
  total += bytes;
}

const kb = (b) => `${(b / 1024).toFixed(1)} KB`.padStart(9);
for (const [part, list] of Object.entries(parts)) {
  const sum = list.reduce((n, [, b]) => n + b, 0);
  console.log(`${part.padEnd(8)}${kb(sum)}`);
  for (const [name, b] of list) console.log(`  ${kb(b)}  ${name}`);
}
console.log(`${'total'.padEnd(8)}${kb(total)}   budget ${kb(BUDGET).trim()}`);
if (total > BUDGET) {
  console.error(`\n✗ Over budget by ${kb(total - BUDGET).trim()}.`);
  process.exit(1);
}
