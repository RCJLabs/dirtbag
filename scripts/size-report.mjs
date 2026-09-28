// What a player downloads, broken down by part. Phase 3 ("Cut the load") works from these numbers,
// so the report prints the heaviest tracks and sprites too.
//   npm run size                 table to stdout (and to the GitHub job summary in CI)
//   npm run size -- --json f     also write the numbers as JSON
import { appendFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { splitBuild, bytes } from './lib/build-parts.mjs';
import { ROOT, read, packageVersion } from './lib/version.mjs';

const html = read('index.html');
const p = splitBuild(html);
// zlib's default level, close to what GitHub Pages' CDN sends.
const gz = (s) => gzipSync(Buffer.from(s, 'utf8')).length;
const mb = (n) => `${(n / 1e6).toFixed(2)} MB`;
const kb = (n) => `${(n / 1e3).toFixed(1)} KB`;
const size = (n) => (n >= 1e5 ? mb(n) : kb(n));
const sum = (entries) => Object.values(entries).reduce((n, e) => n + e.decoded, 0);

const rows = [
  { part: `Music (${Object.keys(p.audio.entries).length} tracks, base64)`, raw: p.audio.bytes, gz: gz(p.audio.body), note: `${mb(sum(p.audio.entries))} of MP3 inside` },
  { part: `Sprites (${Object.keys(p.assets.entries).length}, base64)`, raw: p.assets.bytes, gz: gz(p.assets.body), note: `${mb(sum(p.assets.entries))} of PNG inside` },
  { part: 'App JavaScript', raw: p.js.bytes, gz: gz(p.js.body), note: '' },
  { part: 'CSS', raw: p.css.bytes, gz: gz(p.css.body), note: '' },
  { part: 'HTML shell', raw: p.shell.bytes, gz: gz(p.shell.body), note: '' },
];
const total = { raw: p.total, gz: gz(html) };

const top = (entries, n) =>
  Object.entries(entries)
    .sort((a, b) => b[1].decoded - a[1].decoded)
    .slice(0, n)
    .map(([name, e]) => `| ${name} | ${kb(e.decoded)} |`)
    .join('\n');

// Files served next to index.html (same allowlist idea as stage-site.mjs, but just sizes).
const others = ['service-worker.js', 'manifest.webmanifest', 'favicon.ico', 'privacy.html', ...readdirSync(join(ROOT, 'icons')).map((f) => `icons/${f}`)];
const otherBytes = others.reduce((n, f) => n + statSync(join(ROOT, f)).size, 0);

const md = `### Build size — index.html ${packageVersion()}

| Part | Raw | Gzipped | Share | Notes |
|---|---:|---:|---:|---|
${rows.map((r) => `| ${r.part} | ${size(r.raw)} | ${size(r.gz)} | ${Math.round((100 * r.raw) / total.raw)}% | ${r.note} |`).join('\n')}
| **index.html** | **${mb(total.raw)}** | **${mb(total.gz)}** | | one file, downloaded before anything shows |

Other site files (service worker, manifest, icons, favicon, privacy page): ${kb(otherBytes)}.

<details><summary>Heaviest tracks and sprites (decoded)</summary>

| Track | Size |
|---|---:|
${top(p.audio.entries, 20)}

| Sprite | Size |
|---|---:|
${top(p.assets.entries, 15)}

</details>
`;

console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
const jsonAt = process.argv.indexOf('--json');
if (jsonAt > 0) {
  const data = { version: packageVersion(), total, parts: rows, otherBytes, shellBytes: bytes(p.shell.body) };
  writeFileSync(process.argv[jsonAt + 1], JSON.stringify(data, null, 2) + '\n');
}
