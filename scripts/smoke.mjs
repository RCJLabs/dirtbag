// Boots the game in headless Chromium the way a new player does and fails on anything a player
// would hit: an uncaught error, a failed request, a request that leaves the site (the privacy page
// promises nothing is sent anywhere), a new game that never reaches town, a clock that doesn't tick,
// a save that doesn't write, a reload that doesn't come back, or no offline start.
//
//   npm run smoke                      serve this folder and test it
//   npm run smoke -- --root _site      test a staged deploy folder
//   npm run smoke -- --url https://dirtbag.rcjlabs.com/   test the live site
//
// Needs Playwright's Chromium (`npx playwright install chromium`), or set CHROMIUM_PATH.
import { appendFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { startServer } from './lib/serve.mjs';
import { ROOT, packageVersion, cacheName } from './lib/version.mjs';

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const OUT = join(ROOT, 'smoke-artifacts');
const SAVE_KEY = 'dirtbag-save-v3';
const CACHE = cacheName(packageVersion());
// How long a real phone on a decent connection might take to show the title (measured ~12 s on
// throttled 4G in the audit). Locally it's under a second.
const BOOT_TIMEOUT = 60_000;
const STEP_TIMEOUT = 10_000;

const server = arg('url') ? null : await startServer({ root: resolve(arg('root') || ROOT) });
const url = arg('url') || server.url;
const origin = new URL(url).origin;

// channel 'chromium' is the full browser in new-headless mode. The default headless shell skips
// browser-level behaviour a player gets, such as the favicon request.
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chromium' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();

const problems = [];
const warnings = [];
let requests = 0;
let onProblem = () => {};
const report = (msg) => {
  problems.push(msg);
  onProblem();
};
page.on('pageerror', (e) => report(`uncaught: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') report(`console.error: ${m.text().slice(0, 300)}${m.location()?.url ? ` (${m.location().url})` : ''}`);
  if (m.type() === 'warning') warnings.push(m.text());
});
context.on('request', (r) => {
  const u = r.url();
  if (u.startsWith('data:') || u.startsWith('blob:')) return;
  requests++;
  if (new URL(u).origin !== origin) report(`request left the site: ${u}`);
});
context.on('response', (r) => {
  if (r.status() >= 400) report(`HTTP ${r.status()} ${r.url()}`);
});

const results = [];
let seen = 0; // problems[] up to here are already charged to an earlier step
// A step fails the moment any problem is reported (no waiting out a 60 s timeout behind an
// uncaught error), and its report leads with the problems rather than the timeout they caused.
async function step(name, fn) {
  const t0 = Date.now();
  let trip;
  const tripped = new Promise((_, reject) => (trip = reject));
  tripped.catch(() => {});
  onProblem = () => trip(new Error('problem reported'));
  if (problems.length > seen) onProblem();
  let error = null;
  let detail = '';
  try {
    detail = (await Promise.race([fn(), tripped])) ?? '';
  } catch (e) {
    error = e;
  }
  onProblem = () => {};
  const fresh = problems.slice(seen);
  seen = problems.length;
  const ok = !error && !fresh.length;
  if (!ok && error && error.message !== 'problem reported') fresh.push(error.message.split('\n')[0]);
  results.push({ ok, name, detail: ok ? detail : fresh.slice(0, 6).join('\n    '), ms: Date.now() - t0 });
  if (!ok) {
    mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: join(OUT, `${name.replace(/\W+/g, '-')}.png`) }).catch(() => {});
    throw new Error(`step failed: ${name}`);
  }
}

const button = (name) => page.getByRole('button', { name }).first();
const click = (name) => button(name).click({ timeout: STEP_TIMEOUT });
const clockText = () => page.evaluate(() => (document.body.innerText.match(/\b\d{1,2}:\d{2}\s?[AP]M\b/) || [null])[0]);
const readSave = () =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw);
      return { day: s.day, kb: Math.round(raw.length / 1024) };
    } catch {
      return { corrupt: true };
    }
  }, SAVE_KEY);

try {
  await step('boot', async () => {
    await page.goto(url, { waitUntil: 'load', timeout: BOOT_TIMEOUT });
    await button(/PLAY/).waitFor({ state: 'visible', timeout: BOOT_TIMEOUT });
    return 'title screen up';
  });

  await step('service worker', async () => {
    const info = await page.evaluate(async (cache) => {
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(r, 20_000))]);
      if (!reg) return { error: 'never became ready within 20 s' };
      const hit = await caches.open(cache).then((c) => c.match(new URL('index.html', location.href).href));
      return { script: reg.active?.scriptURL, cached: !!hit, keys: await caches.keys() };
    }, CACHE);
    if (info.error) throw new Error(`service worker ${info.error}`);
    if (!info.script?.endsWith('/service-worker.js')) throw new Error(`unexpected worker ${info.script}`);
    if (!info.cached) throw new Error(`cache ${CACHE} has no index.html (caches: ${info.keys.join(', ') || 'none'})`);
    return `active, ${CACHE} holds index.html`;
  });

  await step('new game', async () => {
    await click(/PLAY/);
    await click(/^New Game$/);
    await click(/^Normal/);
    for (const next of ['Build', 'Style', 'Calling', 'Flaw', 'You']) await click(new RegExp(`^Next · ${next}`));
    await click(/^START CLIMBING$/);
    await click(/^LIVE THE DREAM$/);
    await page.getByText('ENERGY', { exact: true }).waitFor({ state: 'visible', timeout: STEP_TIMEOUT });
    await page.getByText('Day 1', { exact: true }).waitFor({ state: 'visible', timeout: STEP_TIMEOUT });
    return 'default build reached town (Day 1 HUD)';
  });

  await step('save', async () => {
    // The game autosaves on its 1 Hz clock, so the first save lands a second or two after town.
    let s = await readSave();
    for (let i = 0; i < 20 && !s; i++) {
      await page.waitForTimeout(500);
      s = await readSave();
    }
    if (!s) throw new Error(`${SAVE_KEY} was never written`);
    if (s.corrupt) throw new Error(`${SAVE_KEY} is not valid JSON`);
    if (s.day !== 1) throw new Error(`save says day ${s.day}, expected 1`);
    return `${SAVE_KEY} written, ${s.kb} KB`;
  });

  await step('clock', async () => {
    // 1 real second is 1 game minute, so a few seconds must move the HUD clock.
    const a = await clockText();
    if (!a) throw new Error('no clock on screen');
    let b = a;
    for (let i = 0; i < 10 && b === a; i++) {
      await page.waitForTimeout(500);
      b = await clockText();
    }
    if (a === b) throw new Error(`clock stuck at ${a}`);
    return `${a} → ${b}`;
  });

  await step('reload', async () => {
    await page.reload({ waitUntil: 'load', timeout: BOOT_TIMEOUT });
    await button(/PLAY/).waitFor({ state: 'visible', timeout: BOOT_TIMEOUT });
    const s = await readSave();
    if (!s || s.corrupt || s.day !== 1) throw new Error(`save did not survive a reload: ${JSON.stringify(s)}`);
    return 'title back, save intact';
  });

  await step('offline', async () => {
    // Stop serving entirely when we own the server, so only the service-worker cache can answer.
    if (server) await server.close();
    await context.setOffline(true);
    await page.reload({ waitUntil: 'load', timeout: BOOT_TIMEOUT });
    await button(/PLAY/).waitFor({ state: 'visible', timeout: BOOT_TIMEOUT });
    return 'boots from the service-worker cache';
  });

  await step('network and console', async () => `${requests} requests, all same-origin; ${warnings.length} console warnings`);
} catch {
  // Recorded by step(); fall through to the report.
} finally {
  await browser.close();
  if (server) await server.close().catch(() => {});
}

const lines = results.map((r) => `${r.ok ? '✓' : '✗'} ${r.name} (${(r.ms / 1000).toFixed(1)} s)${r.detail ? ` — ${r.detail}` : ''}`);
console.log(`smoke test: ${url}\n${lines.join('\n')}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = results.map((r) => `| ${r.ok ? '✅' : '❌'} | ${r.name} | ${(r.ms / 1000).toFixed(1)} s | ${r.detail.replace(/\n\s*/g, '<br>')} |`);
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Smoke test\n\n| | Step | Time | Detail |\n|---|---|---|---|\n${rows.join('\n')}\n\n`);
}
const failed = results.some((r) => !r.ok) || problems.length > seen;
if (failed) console.error(`\nsmoke test failed — screenshots in ${OUT}${problems.length > seen ? `\n  late: ${problems.slice(seen).join('\n  late: ')}` : ''}`);
process.exit(failed ? 1 : 0);
