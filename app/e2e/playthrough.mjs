// Plays the first day of the built game in headless Chromium, the way a player would: taps,
// keys and the hold button, reading only what's on screen. Fails on any uncaught error,
// console error, failed request or request that leaves the site, and on any step that
// doesn't land where it should.
//
//   npm run build && npm run e2e           (Playwright comes from the repo root: npm ci there)
//
// Two days. Day one: make a climber (Act I's first goal on screen), Hazel's tip about the
// roof, a double at the café (the goal done), the drive out, an onsight of the Warm
// Boulder and its card, a fall on The Pump that shows you the rock-over, dinner, the fire,
// sleep, and a reload that comes back to the same morning.
// Day two: Send City, a setting shift, Sage turning up and showing you a problem's trick,
// and a flash with it.
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
// data: and this page's own blob: URLs (the send card's image) never touch the network.
page.on('request', (r) => {
  const u = r.url();
  if (!u.startsWith(server.url) && !u.startsWith('data:') && !u.startsWith(`blob:${server.url}`))
    problems.push(`left the site: ${u}`);
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

// ---- walking ----

// The player walks 118 px a second (world), and the camera settles on them within a second
// and a half. Knowing where they stand is enough to tap anything in the scene.
const WALK = 118;
const Z = 1.3;
const VW = 360 / Z;
const camFor = (x) => Math.min(Math.max(x - VW / 2, 0), 960 - VW);
const screenX = (worldX, standX) => (worldX - camFor(standX)) * Z;
const screenY = (worldY) => worldY * Z + (612 - 560 * Z);

async function walk(dx) {
  const key = dx < 0 ? 'ArrowLeft' : 'ArrowRight';
  await page.keyboard.down(key);
  await wait((Math.abs(dx) / WALK) * 1000);
  await page.keyboard.up(key);
  await wait(1500);
}

// Plays a go until it sends, resting and going again if it doesn't, up to `tries` goes.
async function sendIt(route, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    await click('#sheet .go');
    await until('the climb panel', () => page.locator('#climb').count());
    await climb();
    const sheet = await until(
      'the go to end',
      async () => (await text('#stamp')) || (await text('#sheet')),
      15_000,
    );
    if (/Sent/.test(sheet)) return i;
    log(`${route}: fell on go ${i}: ${(await text('#sheet'))?.slice(0, 80)}`);
    await click('#sheet .opt', 'Rest, then go again');
  }
  await fail(`${route} never went`);
}

// ---- day one ----

console.log('Boot');
await page.goto(server.url, { waitUntil: 'load' });
await expectText('#h-time', /^Day 1 · 7:40 AM$/, 'clock');
await expectText('#h-cash', /^\$41$/, 'cash');
await until('the climber screen', () => page.locator('#create').count());
await shot('create');

console.log('Make a climber');
await page.fill('#c-name', 'Robin');
await click('#c-technician');
await click('#c-go', 'Start');
await until('the climber screen to go', async () => !(await page.locator('#create').count()));
await expectText('#hint', /Tap anywhere to walk/, 'hint');
await expectText('#goal', /Have \$60 in hand/, 'the first goal');
await wait(400);
await shot('lot-morning');

console.log('Hazel');
// Two taps toward the fire walk you to Hazel (spawn 300: 423, then 546); Enter talks.
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

console.log('A double at the café');
await click('#b-nav', 'Map');
await until('the map', async () => (await text('#b-nav')) === 'Close');
await wait(450);
await shot('map');
await tapAt(282, 476);
await expectText('#sheet', /Coffee Shop/, 'place card');
await click('#sheet .opt', 'Drive here');
await expectText('#sheet', /Wren is on the bar/, 'at the café');
await click('#sheet .opt', 'Pick up a double');
await expectText('#h-cash', /^\$96$/, 'paid');
await expectText('#h-time', /1:48 PM$/, 'clock');

console.log('Drive to Roadside Crag');
await click('#sheet .opt', 'Drive to Roadside Crag');
await wait(800);
await shot('driving');
await until('arrival', async () => (await text('#h-time')) === 'Day 1 · 2:53 PM');
await expectText('#h-cash', /^\$84$/, 'cash after gas');
await until('the crag', async () => (await text('#hint'))?.includes('Boulders on the talus'));
await wait(400);
await shot('crag');

// The double put $60 in hand: Act I's first goal is done and the next one's up.
await expectText('#goal', /Send 3 lines anywhere/, 'the second goal');

console.log('The Warm Boulder');
// Spawn 180; the Warm Boulder stands at 340, just off the right of the screen.
await tapAt(350, screenY(540));
await expectText('#sheet', /Warm Boulder · V2/, 'beta sheet');
await shot('beta-warm');
const goes = await sendIt('Warm Boulder');
await expectText('#sheet', go1(goes), 'result');
// Every extra go on the boulder is a rest and a go: the rest of the day's clock moves by it.
const late = (goes - 1) * 20;
await shot('sent-warm');

// A first send gets a card: painted on the device at full size, shown, and back again.
await click('#sheet .opt', 'Keep a card of it');
const card = await until('the card', () =>
  page.evaluate(() => {
    const img = document.querySelector('#card');
    return img?.complete && img.naturalWidth ? [img.naturalWidth, img.naturalHeight, img.alt] : null;
  }),
);
if (
  card[0] !== 1080 ||
  card[1] !== 1920 ||
  !/^Warm Boulder, V2\. Onsight\. Roadside Crag, day 1, fall\.$/.test(card[2])
)
  await fail(`the card: ${JSON.stringify(card)}`);
log(`card: ${card[0]}×${card[1]}, "${card[2]}"`);
await shot('card-warm');
await click('#sheet .opt', 'Back');
await expectText('#sheet', go1(goes), 'back on the send');
await click('#sheet .opt', 'Walk down the back');

console.log('The Pump: come off the crimps on purpose');
// Back at the Warm Boulder's foot (310). The Pump's foot is at 670.
await until('the crag again', async () => (await text('#b-nav')) === 'Map');
await wait(600);
await walk(360);
await tapAt(screenX(700, 670), screenY(400));
await expectText('#sheet', /The Pump · 5\.12a/, 'beta sheet');
await click('#sheet .beta', 'Heel-hook');
await until('the heel hook picked', () =>
  page.locator('#sheet .beta[aria-checked="true"]', { hasText: 'Heel-hook' }).count(),
);
await shot('beta-pump');
await click('#sheet .go', 'Tie in and go');
await until('the climb panel', () => page.locator('#climb').count());
await climb({ failFirst: true });
await expectText('#sheet', /Off at the crimp rail/, 'fall');
await expectText('#sheet', /New beta: high-step and rock over/, 'the rock-over');
await shot('fell');
await click('#sheet .opt', 'Walk off');

console.log('Dinner');
await until('the crag again', async () => (await text('#b-nav')) === 'Map');
await click('#b-nav', 'Map');
await until('the map', async () => (await text('#b-nav')) === 'Close');
await wait(450); // taps during a fade are ignored, as they are for a player
await tapAt(96, 458);
await expectText('#sheet', /The Diner/, 'place card');
await click('#sheet .opt', 'Drive here');
await expectText('#sheet', /Otis is reading the paper/, 'at the diner');
await click('#sheet .opt', 'Order the special');
await shot('diner');
await click('#sheet .opt', 'Drive back to the Lot');
await until('the Lot', async () => (await text('#hint')) === 'Tap anywhere to walk');
await expectText('#h-time', clockRe(17 * 60 + 33 + late), 'clock');

console.log('The evening');
// The van, 160 px to the left of where you park: cook, which runs the clock past dusk.
await tapAt(100, 560);
await expectText('#sheet', /Your van/, 'van');
await click('#sheet .opt', 'Cook ramen');
await expectText('#h-time', clockRe(17 * 60 + 53 + late), 'clock');
await tapAt(200, 300);
await until('the sheet to close', async () => !(await page.locator('#sheet').count()));
for (let i = 0; i < 2; i++) {
  await tapAt(340, 650);
  await wait(2200);
}
await page.keyboard.press('Enter');
await expectText('#bubble', new RegExp(`${goes + 1} goes today`), 'Hazel at night');
await shot('fire');
await click('#bubble button', 'Sit a while');
await expectText('#h-time', clockRe(18 * 60 + 33 + late), 'clock');

console.log('Sleep');
await page.keyboard.down('ArrowLeft');
await wait(2600);
await page.keyboard.up('ArrowLeft');
await page.keyboard.press('Enter');
await expectText('#sheet', /Your van/, 'van');
await click('#sheet .opt', 'Sleep');
await expectText('#h-time', /^Day 2 · 7:10 AM$/, 'morning');
await expectText('#h-cash', /^\$41$/, 'cash');
await shot('day-2');

console.log('Reload');
await page.reload({ waitUntil: 'load' });
await expectText('#h-time', /^Day 2 · 7:10 AM$/, 'clock after reload');
await expectText('#h-cash', /^\$41$/, 'cash after reload');
if (await page.locator('#create').count()) await fail('the climber screen came back after a reload');

// ---- day two ----

console.log('Send City');
await click('#b-nav', 'Map');
await until('the map', async () => (await text('#b-nav')) === 'Close');
await wait(450);
await tapAt(282, 414);
await expectText('#sheet', /Send City/, 'place card');
await click('#sheet .opt', 'Drive here');
await until('the gym', async () => (await text('#hint'))?.includes('Day pass at the desk'));
await wait(400);
await shot('gym');

console.log('A setting shift, and Sage turns up');
// Spawn 70, camera at 0: the desk is at 170.
await tapAt(170 * Z, screenY(540));
await expectText('#sheet', /The desk/, 'desk');
await click('#sheet .opt', 'Set problems for a shift');
await expectText('#h-time', /11:22 AM$/, 'clock');
await expectText('#h-cash', /^\$68$/, 'paid');
await expectText('#toast', /Sage turns up/, 'Sage');
await page.locator('#sheet .x').click();
await wait(300);
// You're at the desk's front (240); Sage stands at 292.
await tapAt(screenX(292, 240), screenY(530));
await expectText('#bubble', /I'm Sage/, 'Sage');
await shot('sage');
await click('#bubble button', 'Show me something');
await expectText('#toast', /New beta on /, 'Sage shows you');

console.log('Flash the V0 with it');
// Now at Sage's front (330); the V0 is at 384.
await wait(1600);
await tapAt(screenX(384, 330), screenY(450));
await expectText('#sheet', /· V0/, 'beta sheet');
await page.locator('#sheet .beta').nth(1).click();
await until(
  'the new beta picked',
  async () => (await page.locator('#sheet .beta').nth(1).getAttribute('aria-checked')) === 'true',
);
await shot('beta-gym');
const gymGoes = await sendIt('the V0');
if (gymGoes !== 1) await fail(`the V0 took ${gymGoes} goes`);
await expectText('#sheet', /^Flash/, 'result');
await shot('flash');

console.log('The save');
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save') ?? 'null'));
const st = saved?.state;
const pump = st?.routes?.pump;
if (
  saved?.v !== 3 ||
  st.climber?.name !== 'Robin' ||
  st.climber.start !== 'technician' ||
  !st.routes.warm?.sent ||
  !pump?.known.includes('A2') ||
  !pump.told.includes('B2') ||
  !(st.people?.sage?.bond >= 1) ||
  !(st.people?.hazel?.bond >= 1)
)
  await fail(`the save doesn't show the two days: ${JSON.stringify(st).slice(0, 400)}`);
log(`save: ${st.climber.name}, skills ${JSON.stringify(st.climber.skills)}`);

console.log('Offline');
// The service worker has had two days to install; with the network gone, a reload still
// starts the game where you left it, and nothing fails to load.
await until('the service worker to control the page', () =>
  page.evaluate(() => !!navigator.serviceWorker?.controller),
);
await page.context().setOffline(true);
await page.reload({ waitUntil: 'load' });
await expectText('#h-time', /^Day 2 · 1[12]:\d\d AM$/, 'clock offline');
await expectText('#h-cash', /^\$68$/, 'cash offline');
await shot('offline');
await page.context().setOffline(false);

if (problems.length) await fail(`${problems.length} problem(s) during play`);
await browser.close();
await server.close();
console.log('\n✓ Played two days, then again offline, with no errors and nothing sent off the site.');

// The first go onsights the Warm Boulder; a later one is a redpoint.
function go1(n) {
  return n === 1 ? /^Onsight/ : /^Redpoint/;
}

// "5:33 PM" at the end of the HUD's clock, from minutes since midnight.
function clockRe(min) {
  const h = Math.floor(min / 60) % 24;
  const m = String(min % 60).padStart(2, '0');
  return new RegExp(`${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'AM' : 'PM'}$`);
}
