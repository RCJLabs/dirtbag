// Compares two single-file builds part by part. Made for Phase 1's source handoff: "does a clean
// clone of the source build the game that's live?" A raw diff of two 15 MB one-line files says
// nothing; this says which tracks, sprites, code or markup differ.
//   npm run compare -- index.html path/to/dist/index.html
// Exits 0 only if the two files are byte-identical.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { splitBuild, sha256 } from './lib/build-parts.mjs';
import { embeddedVersion } from './lib/version.mjs';

const [aPath, bPath] = process.argv.slice(2);
if (!aPath || !bPath) {
  console.error('usage: npm run compare -- <a/index.html> <b/index.html>');
  process.exit(2);
}
const aHtml = readFileSync(aPath, 'utf8');
const bHtml = readFileSync(bPath, 'utf8');
const mb = (s) => `${(Buffer.byteLength(s) / 1e6).toFixed(2)} MB`;
console.log(`A ${aPath} — ${mb(aHtml)}, version ${embeddedVersion(aHtml) ?? '?'}`);
console.log(`B ${bPath} — ${mb(bHtml)}, version ${embeddedVersion(bHtml) ?? '?'}`);

if (aHtml === bHtml) {
  console.log('✓ byte-identical');
  process.exit(0);
}
console.log('✗ not byte-identical. By part:');

const a = splitBuild(aHtml);
const b = splitBuild(bHtml);

function compareMap(label, am, bm) {
  const names = new Set([...Object.keys(am), ...Object.keys(bm)]);
  const onlyA = [];
  const onlyB = [];
  const changed = [];
  let same = 0;
  for (const n of names) {
    if (!(n in bm)) onlyA.push(n);
    else if (!(n in am)) onlyB.push(n);
    else if (am[n].sha !== bm[n].sha) changed.push(n);
    else same++;
  }
  const list = (xs) => (xs.length > 12 ? `${xs.slice(0, 12).join(', ')} … (+${xs.length - 12})` : xs.join(', '));
  const bits = [`${same}/${names.size} identical`];
  if (changed.length) bits.push(`changed: ${list(changed)}`);
  if (onlyA.length) bits.push(`only in A: ${list(onlyA)}`);
  if (onlyB.length) bits.push(`only in B: ${list(onlyB)}`);
  console.log(`  ${label.padEnd(8)} ${bits.join('; ')}`);
}

compareMap('music', a.audio.entries, b.audio.entries);
compareMap('sprites', a.assets.entries, b.assets.entries);

for (const [key, label] of [['css', 'css'], ['shell', 'shell'], ['js', 'js']]) {
  if (sha256(a[key].body) === sha256(b[key].body)) {
    console.log(`  ${label.padEnd(8)} identical`);
    continue;
  }
  console.log(`  ${label.padEnd(8)} differs (${a[key].bytes.toLocaleString()} → ${b[key].bytes.toLocaleString()} bytes)`);
  if (key === 'js') {
    // Minified code rarely matches across toolchain versions even from the same source, so hand
    // over both bundles for a readable diff instead of guessing.
    const dir = join(tmpdir(), 'dirtbag-compare');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'a.js'), a.js.body);
    writeFileSync(join(dir, 'b.js'), b.js.body);
    console.log(`           bundles written to ${dir}/{a,b}.js. For a readable diff:`);
    console.log(`           npx prettier@3 --parser babel --print-width 120 --write ${dir}/a.js ${dir}/b.js && diff -u ${dir}/a.js ${dir}/b.js | less`);
  }
}
process.exit(1);
