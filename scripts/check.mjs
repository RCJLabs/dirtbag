// Static checks on the release: one version everywhere, the built site is whole, and the Play
// app can still verify the domain. Fast, no browser. Run before every commit that touches the
// site: `npm run check`. The site is the rebuild's build, so build it first
// (`npm run build --prefix app`); a missing build fails, it doesn't skip.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { contrast, tokens } from './lib/contrast.mjs';
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

// --- the store copy fits Play's limits --------------------------------------------------------
check("docs/STORE.md fits Play's limits", () => {
  const md = read('docs/STORE.md');
  const LIMIT = { short: 80, full: 4000, 'whats-new': 500 };
  const out = Object.entries(LIMIT).map(([key, max]) => {
    const block = md.match(new RegExp('```text ' + key + '\\n([\\s\\S]*?)\\n```'));
    if (!block) fail(`no \`\`\`text ${key} block`);
    const n = [...block[1]].length;
    if (n > max) fail(`${key} is ${n} characters; Play allows ${max}`);
    return `${key} ${n}/${max}`;
  });
  return out.join(', ');
});

// --- the game's text is readable ------------------------------------------------------------
// Every pairing of text and ground in the panel kit, held to WCAG AA: 4.5:1 for text (all of
// the kit's is under 18pt), 3:1 for the keyboard's ring against the paper it sits on.
check("the kit's colours meet WCAG AA", () => {
  const t = tokens(read('app/src/ui/styles.css'));
  const pairs = [
    ['ink', 'bg', 4.5],
    ['dim', 'bg', 4.5],
    ['acc', 'bg', 4.5],
    ['rain', 'bg', 4.5],
    ['btnInk', 'btn', 4.5],
    ['hudInk', 'hudBg', 4.5],
    ['acc', 'hudBg', 4.5],
    ['focus', 'bg', 3],
  ];
  const out = pairs.map(([fg, bg, min]) => {
    if (!t[fg] || !t[bg]) fail(`no --u-${t[fg] ? bg : fg} colour in the kit`);
    const r = contrast(t[fg], t[bg]);
    if (r < min) fail(`${fg} on ${bg} is ${r.toFixed(2)}:1; AA needs ${min}:1`);
    return r;
  });
  return `${pairs.length} pairs, the lowest ${Math.min(...out).toFixed(2)}:1`;
});

// --- no one-off inline styles --------------------------------------------------------------
// The game's panels take their look from styles.css. Inline, a component sets only custom
// properties (levels and geometry from the game) through ui/vars.ts, and code touching an
// element's style sets only custom properties too. Dev tools (src/dev) don't ship.
check('the game sets no inline styles but custom properties', () => {
  const files = ['app/src/ui', 'app/src/game'].flatMap((dir) =>
    readdirSync(join(ROOT, dir), { recursive: true })
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))
      .map((f) => `${dir}/${f}`),
  );
  const bad = [];
  for (const f of files)
    read(f)
      .split('\n')
      .forEach((line, i) => {
        if (/style=\{(?!vars\(|box\()/.test(line) || /\.style\.(?!setProperty\(\s*['"`]--)/.test(line))
          bad.push(`${f}:${i + 1}`);
      });
  if (bad.length) fail(`inline styles at ${bad.join(', ')}; set custom properties with vars() and style in styles.css`);
  return `${files.length} files`;
});

// --- every sound is in the licence ledger -------------------------------------------------
// The game's sound is made in code. An audio file may ship only as a recording the ledger
// lists with its author, licence and source (app/src/audio/ledger.json), so no sound goes
// out with its licence unwritten.
check('every audio file is in the licence ledger', () => {
  const AUDIO = /\.(mp3|ogg|oga|opus|wav|m4a|aac|flac|webm)$/i;
  const ledger = json('app/src/audio/ledger.json');
  const listed = new Set(ledger.recordings.map((r) => r.file));
  const files = ['app/src', 'app/public', DIST].flatMap((dir) =>
    exists(dir)
      ? readdirSync(join(ROOT, dir), { recursive: true })
          .filter((f) => AUDIO.test(f))
          .map((f) => `${dir}/${f}`)
      : [],
  );
  const unlisted = files.filter((f) => ![...listed].some((l) => f.endsWith(l)));
  if (unlisted.length) fail(`audio not in the ledger: ${unlisted.join(', ')}`);
  for (const r of ledger.recordings)
    if (!r.author || !r.licence || !r.url) fail(`${r.file}: the ledger needs its author, licence and source`);
  return `${Object.keys(ledger.sounds).length} sounds, ${ledger.recordings.length} recordings, ${files.length} audio files`;
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
