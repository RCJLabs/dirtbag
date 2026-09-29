// Static checks on the release: one version everywhere, the built site is whole, and the Play
// app can still verify the domain. Fast, no browser. Run before every commit that touches the
// site: `npm run check`. The site is the rebuild's build, so build it first
// (`npm run build --prefix app`); a missing build fails, it doesn't skip.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { COPIES, ROOT, read, packageVersion } from './lib/version.mjs';

const DIST = 'app/dist';
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
const built = (rel) => exists(`${DIST}/${rel}`);

const version = packageVersion();

// --- one version everywhere ---------------------------------------------------------------
for (const { file, get } of COPIES)
  check(`${file} says ${version}`, () => {
    const found = get(json(file)).filter((v) => v !== undefined);
    const off = found.filter((v) => v !== version);
    if (!found.length) fail(`${file} carries no version`);
    if (off.length) fail(`${file} says ${off.join(', ')}. Run \`npm run stamp\`.`);
  });

// --- the build is the site, and it's whole ------------------------------------------------
check(`${DIST} is built`, () => {
  if (!built('index.html')) fail(`no ${DIST}/index.html. Build it: npm run build --prefix app`);
});
if (built('index.html')) {
  const html = read(`${DIST}/index.html`);
  const sw = built('service-worker.js') ? read(`${DIST}/service-worker.js`) : '';
  const assets = readdirSync(join(ROOT, DIST, 'assets'));

  check(`the game is built as ${version}`, () => {
    const js = assets.filter((f) => f.endsWith('.js')).map((f) => read(`${DIST}/assets/${f}`));
    // The minifier may quote it any of three ways.
    if (!js.some((t) => ['"', "'", '`'].some((q) => t.includes(`${q}${version}${q}`))))
      fail(`no script in ${DIST}/assets carries "${version}". Rebuild after \`npm run stamp\`.`);
  });
  check('index.html links resolve', () => {
    const refs = [...html.matchAll(/(?:href|src)="\.\/([^"]+)"/g)].map((m) => m[1]);
    const missing = refs.filter((r) => !built(r));
    if (missing.length) fail(`missing: ${missing.join(', ')}`);
    return `${refs.length} refs`;
  });
  check('service-worker.js precaches files that exist', () => {
    if (!sw) fail(`no ${DIST}/service-worker.js: returning players' browsers would keep v0.956's worker`);
    const list = sw.match(/const FILES = (\[[\s\S]*?\]);/);
    if (!list) fail('no FILES list in service-worker.js');
    const files = JSON.parse(list[1]).map((f) => f.replace(/^\.\//, '')).filter(Boolean);
    const missing = files.filter((f) => !built(f));
    if (missing.length) fail(`precached but missing: ${missing.join(', ')}`);
    return `${files.length} files`;
  });
  check("service-worker.js clears v0.956's cache", () => {
    if (!sw.includes('dirtbag-v\\d+')) fail("the worker no longer deletes v0.956's cache (dirtbag-v…)");
  });
  check('web manifest is valid and its icons exist', () => {
    const m = json(`${DIST}/manifest.webmanifest`);
    const missing = (m.icons || []).map((i) => i.src).filter((s) => !built(s));
    if (missing.length) fail(`missing icons: ${missing.join(', ')}`);
    if (m.id !== '/' || m.scope !== './') fail(`id ${m.id} / scope ${m.scope}: an installed copy would become a second app`);
  });
  check('favicon.ico is built', () => {
    if (!built('favicon.ico')) fail('browsers request /favicon.ico; without it every load logs a 404');
  });
}

// --- served beside the build ---------------------------------------------------------------
check('privacy.html exists', () => {
  if (!exists('privacy.html')) fail('the Play listing links the privacy page');
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
