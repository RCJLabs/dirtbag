// Plays the first day of the built game in headless Chromium, the way a player would: taps,
// keys and the hold button, reading only what's on screen. Fails on any uncaught error,
// console error, failed request or request that leaves the site, and on any step that
// doesn't land where it should.
//
//   npm run build && npm run e2e           (Playwright comes from the repo root: npm ci there)
//
// The day: Hazel's tip about the roof, the drive out, a fall at the crimp rail that shows
// you the rock-over, a redpoint with it, a diner shift, the evening at the fire, sleep, and
// a reload that comes back to the same morning.
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { startServer } from '../../scripts/lib/serve.mjs';

const APP = new URL('..', import.meta.url).pathname;
const OUT = join(APP, 'e2e-artifacts');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const server = await startServer({ root: join(APP, 'dist') });
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chromium' },
);
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const problems = [];
page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && problems.push(`console.error: ${m.text()}`));
page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
page.on('request', (r) => {
  if (!r.url().startsWith(server.url) && !r.url().startsWith('data:'))
    problems.push(`left the site: ${r.url()}`);
});

let n = 0;
const shot = (name) => page.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-${name}.png`) });
const log = (...a) => console.log('  ', ...a);
const wait = (ms) => page.waitForTimeout(ms);

async function fail(msg) {
  await shot('failed').catch(() => {});
  console.error(`\n✗ ${msg}`);
  if (problems.length) console.error(problems.join('\n'));
  await browser.close();
  await server.close();
  process.exit(1);
}

const text = (sel) =>
  page.evaluate((s) => document.querySelector(s)?.textContent?.replace(/\s+/g, ' ').trim() ?? null, sel);

async function until(what, fn, ms = 10_000) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) await fail(`timed out waiting for ${what}`);
    await wait(50);
  }
}

async function expectText(sel, re, what) {
  const t = await until(`${what} (${sel})`, async () => {
    const v = await text(sel);
    return v && re.test(v) ? v : null;
  });
  log(`${what}: ${t.slice(0, 110)}`);
  return t;
}

// Taps on the game screen in its own 360 x 740 logical pixels.
async function tapAt(x, y) {
  const box = await page.locator('#cv').boundingBox();
  const k = box.width / 360;
  await page.mouse.click(box.x + x * k, box.y + y * k);
}

const click = async (sel, name) => {
  await until(`"${name ?? sel}"`, () =>
    page
      .locator(sel, name ? { hasText: name } : {})
      .first()
      .isEnabled()
      .catch(() => false),
  );
  await page
    .locator(sel, name ? { hasText: name } : {})
    .first()
    .click();
};

const hudTime = () => text('#h-time');

// ---- the hold button ----

let down = false;
async function setHold(on) {
  if (on === down) return;
  // page.$ doesn't wait: the button is gone the moment a go ends.
  const el = await page.$('#hold');
  const b = el && (await el.boundingBox());
  if (!b) {
    if (!on) await page.mouse.up();
    down = false;
    return;
  }
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  if (on) await page.mouse.down();
  else await page.mouse.up();
  down = on;
}

const panel = () =>
  page.evaluate(() => {
    const v = document.getElementById('verb');
    const pump = parseFloat(document.getElementById('c-pump')?.style.width ?? '0') || 0;
    const move =
      parseInt((document.getElementById('c-move')?.textContent ?? '').replace(/\D+/g, ' ').trim(), 10) || 0;
    return {
      climbing: !!document.getElementById('climb') && !document.getElementById('stamp'),
      verb: v ? v.dataset.verb : null,
      m: v ? +v.dataset.m : 0,
      c: v ? +v.dataset.c : 0,
      w: v ? +v.dataset.w : 0,
      pump,
      move,
    };
  });

// Plays a go to its end. `failFirst` lets the first crux win by timing out on purpose.
async function climb({ failFirst = false } = {}) {
  let rested = false;
  let lastTap = 0;
  let cruxes = 0;
  let inCrux = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 40_000) {
    const s = await panel();
    if (!s.climbing) {
      await setHold(false);
      return;
    }
    if (s.verb) {
      if (!inCrux) {
        inCrux = true;
        cruxes++;
        if (s.verb !== 'tension') await setHold(false);
      }
      if (failFirst && cruxes === 1) await setHold(false);
      else if (s.verb === 'tension') await setHold(s.m < s.c);
      else if (s.verb === 'load') await setHold(s.m < s.c - s.w * 0.3);
      else if (Math.abs(s.m - s.c) < s.w * 0.55 && Date.now() - lastTap > 250) {
        await setHold(true);
        await wait(30);
        await setHold(false);
        lastTap = Date.now();
      }
      await wait(8);
      continue;
    }
    inCrux = false;
    if (!rested && (s.move === 10 || s.move === 11) && s.pump > 20) {
      await setHold(false);
      await until('the pump to drain on the ledge', async () => (await panel()).pump < 6, 12_000);
      rested = true;
      continue;
    }
    await setHold(true);
    await wait(30);
  }
  await fail('a go that never ended');
}

// ---- the day ----

console.log('Boot');
await page.goto(server.url, { waitUntil: 'load' });
await expectText('#h-time', /^Day 1 · 7:40 AM$/, 'clock');
await expectText('#h-cash', /^\$41$/, 'cash');
await wait(600);
await shot('lot-morning');

console.log('Hazel');
await tapAt(340, 650);
await wait(2200);
await tapAt(340, 650);
await wait(2200);
await page.keyboard.press('Enter');
await expectText('#bubble', /staring at The Pump/, 'Hazel');
await shot('hazel');
await click('#bubble button', 'Ask about the roof');
await expectText('#bubble', /Hook your left heel/, 'Hazel on the roof');
await click('#bubble button', 'Got it');
await expectText('#toast', /New beta: heel-hook the lip/, 'toast');

console.log('Drive to Roadside Crag');
await click('#b-nav', 'Map');
await until('the map', async () => (await text('#b-nav')) === 'Close');
await wait(450);
await shot('map');
await tapAt(292, 220);
await expectText('#sheet', /Roadside Crag/, 'place card');
await click('#sheet .opt', 'Drive here');
await wait(800);
await shot('driving');
await until('arrival', async () => (await text('#h-time')) === 'Day 1 · 8:40 AM');
await expectText('#h-cash', /^\$29$/, 'cash after gas');
await until('the crag', async () => (await text('#hint'))?.includes('The Pump'));
await wait(400);
await shot('crag');

console.log('Walk to The Pump');
for (let i = 0; i < 4; i++) {
  await tapAt(340, 650);
  await wait(1700);
}
await page.keyboard.press('Enter');
await expectText('#sheet', /The Pump · 5\.12a/, 'beta sheet');
await click('#sheet .beta', 'Heel-hook');
await until('the heel hook picked', () =>
  page.locator('#sheet .beta[aria-checked="true"]', { hasText: 'Heel-hook' }).count(),
);
await shot('beta');

console.log('Go 1: come off the crimp rail on purpose');
await click('#sheet .go', 'Tie in and go');
await until('the climb panel', () => page.locator('#climb').count());
await climb({ failFirst: true });
await expectText('#sheet', /Off at the crimp rail/, 'fall');
await expectText('#sheet', /New beta: high-step and rock over/, 'the rock-over');
await shot('fell');

console.log('Go 2: rock over, heel hook, send');
await click('#sheet .opt', 'Rest, then go again');
await click('#sheet .beta', 'High-step');
await until('the rock-over picked', () =>
  page.locator('#sheet .beta[aria-checked="true"]', { hasText: 'High-step' }).count(),
);
await click('#sheet .go', 'Tie in and go');
await until('the climb panel', () => page.locator('#climb').count());
await page.waitForTimeout(100);
await climb();
await expectText('#stamp', /Sent/, 'stamp');
await shot('sent');
await expectText('#sheet', /Redpoint/, 'result');
await expectText('#sheet', /on go 2/, 'go count');
await click('#sheet .opt', 'Lower off and walk out');

console.log('A shift at the diner');
await until('the crag again', async () => (await text('#b-nav')) === 'Map');
await click('#b-nav', 'Map');
await until('the map', async () => (await text('#b-nav')) === 'Close');
await wait(450); // taps during a fade are ignored, as they are for a player
await tapAt(96, 458);
await expectText('#sheet', /The Diner/, 'place card');
await click('#sheet .opt', 'Drive here');
await expectText('#sheet', /Otis is reading the paper/, 'at the diner');
await click('#sheet .opt', 'Work a shift');
await expectText('#h-cash', /^\$69$/, 'paid');
await click('#sheet .opt', 'Order the special');
await shot('diner');
await click('#sheet .opt', 'Drive back to the Lot');
await until('the Lot', async () => (await text('#hint')) === 'Tap anywhere to walk');
await expectText('#h-time', /4:40 PM$/, 'clock');

console.log('The evening');
// The van, 160 px to the left of where you park: cook, which runs the clock into the night.
await tapAt(100, 560);
await expectText('#sheet', /Your van/, 'van');
await click('#sheet .opt', 'Cook ramen');
await expectText('#h-time', /5:00 PM$/, 'clock');
await tapAt(200, 300);
await until('the sheet to close', async () => !(await page.locator('#sheet').count()));
for (let i = 0; i < 2; i++) {
  await tapAt(340, 650);
  await wait(2200);
}
await page.keyboard.press('Enter');
await expectText('#bubble', /You sent it/, 'Hazel at night');
await shot('fire');
await click('#bubble button', 'Sit a while');
await expectText('#h-time', /5:40 PM$/, 'clock');
await page.keyboard.press('Enter');
await expectText('#bubble', /You sent it/, 'Hazel again');
await click('#bubble button', 'Sit a while');
await expectText('#h-time', /6:20 PM$/, 'clock');

console.log('Sleep');
await page.keyboard.down('ArrowLeft');
await wait(2600);
await page.keyboard.up('ArrowLeft');
await page.keyboard.press('Enter');
await expectText('#sheet', /Your van/, 'van');
await click('#sheet .opt', 'Sleep');
await expectText('#h-time', /^Day 2 · 7:10 AM$/, 'morning');
await expectText('#h-cash', /^\$39$/, 'cash');
await shot('day-2');

console.log('Reload');
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save') ?? 'null'));
const pump = saved?.state?.routes?.pump;
if (!pump || pump.sent?.style !== 'redpoint' || !pump.known.includes('A2') || !pump.told.includes('B2'))
  await fail(`the save doesn't show the day: ${JSON.stringify(pump)}`);
log('save: redpoint on go', pump.sent.go, '· known', pump.known.join(', '));
await page.reload({ waitUntil: 'load' });
await expectText('#h-time', /^Day 2 · 7:10 AM$/, 'clock after reload');
await expectText('#h-cash', /^\$39$/, 'cash after reload');

if (problems.length) await fail(`${problems.length} problem(s) during play`);
await browser.close();
await server.close();
console.log('\n✓ Played day 1 through to day 2 with no errors and nothing sent off the site.');
