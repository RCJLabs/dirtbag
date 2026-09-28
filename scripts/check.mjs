// Static checks on the release files. Fast, no browser. Run before every commit that touches the
// site: `npm run check`. Exits non-zero on the first run of failures, listing all of them.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { splitBuild } from './lib/build-parts.mjs';
import { ROOT, read, packageVersion, cacheName, CACHE_RE, embeddedVersion } from './lib/version.mjs';

const results = [];
const check = (name, fn) => {
  try {
    const detail = fn();
    results.push({ ok: true, name, detail });
  } catch (e) {
    results.push({ ok: false, name, detail: e.message });
  }
};
const fail = (msg) => {
  throw new Error(msg);
};
const json = (rel) => {
  try {
    return JSON.parse(read(rel));
  } catch (e) {
    fail(`${rel} is not valid JSON: ${e.message}`);
  }
};
const exists = (rel) => existsSync(join(ROOT, rel));

const version = packageVersion();
const html = read('index.html');
const sw = read('service-worker.js');

// --- one version everywhere ---------------------------------------------------------------
check(`index.html embeds ${version}`, () => {
  if (!html.includes(`"${version}"`)) {
    const found = embeddedVersion(html);
    fail(`index.html was built as ${found ?? 'an unknown version'}, package.json says ${version}. Rebuild from source, or fix package.json.`);
  }
});
check(`service worker cache is ${cacheName(version)}`, () => {
  const m = sw.match(CACHE_RE);
  if (!m) fail(`service-worker.js has no "const CACHE = '…';" line`);
  if (m[1] !== cacheName(version)) fail(`service-worker.js uses ${m[1]}. Run \`npm run stamp\`.`);
});
check(`twa-manifest.json appVersionName is ${version}`, () => {
  const v = json('twa-manifest.json').appVersionName;
  if (v !== version) fail(`twa-manifest.json says ${v}. Run \`npm run stamp\`.`);
});

// --- the build is still the shape the tooling expects ---------------------------------------
check('index.html splits into audio / sprites / js / css', () => {
  const p = splitBuild(html);
  return `${Object.keys(p.audio.entries).length} tracks, ${Object.keys(p.assets.entries).length} sprites`;
});

// --- everything the page, manifest and service worker point at exists ---------------------------
check('index.html links resolve', () => {
  // Scan only the HTML shell; the 2 MB bundle contains markup-looking strings.
  const shell = splitBuild(html).shell.body;
  const refs = [...shell.matchAll(/<link [^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const reg = shell.match(/serviceWorker\.register\('([^']+)'/);
  if (reg) refs.push(reg[1]);
  const missing = refs.filter((r) => !/^https?:/.test(r) && !exists(r));
  if (missing.length) fail(`missing: ${missing.join(', ')}`);
  return `${refs.length} refs`;
});
check('service worker precache list resolves', () => {
  const shell = sw.match(/const SHELL = \[([\s\S]*?)\];/);
  if (!shell) fail('no SHELL array in service-worker.js');
  const urls = [...shell[1].matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  const missing = urls.filter((u) => !exists(u));
  if (missing.length) fail(`precached but missing: ${missing.join(', ')}`);
  return `${urls.length} files`;
});
check('web manifest is valid and its icons exist', () => {
  const m = json('manifest.webmanifest');
  const missing = (m.icons || []).map((i) => i.src).filter((s) => !exists(s));
  if (missing.length) fail(`missing icons: ${missing.join(', ')}`);
});
check('favicon.ico exists', () => {
  if (!exists('favicon.ico')) fail('browsers request /favicon.ico on every load; without it every load logs a 404');
});

// --- the Play build can still verify the domain ----------------------------------------------------
check('TWA host matches CNAME and assetlinks.json names the app', () => {
  const twa = json('twa-manifest.json');
  const cname = read('CNAME').trim();
  if (twa.host !== cname) fail(`twa-manifest host ${twa.host} != CNAME ${cname}`);
  const links = json('.well-known/assetlinks.json');
  const entry = links.find((l) => l.target?.package_name === twa.packageId);
  if (!entry) fail(`assetlinks.json has no entry for ${twa.packageId}; the Play app would show a browser bar`);
  if (!entry.target.sha256_cert_fingerprints?.length) fail('assetlinks.json entry has no certificate fingerprints');
});

const bad = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
if (bad.length) {
  console.error(`\n${bad.length} check(s) failed.`);
  process.exit(1);
}
