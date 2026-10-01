// Plays the first days of the built game in headless Chromium, the way a player would: taps,
// keys and the hold button, reading only what's on screen. Fails on any uncaught error,
// console error, failed request or request that leaves the site, and on any step that
// doesn't land where it should.
//
//   npm run build && npm run e2e           (Playwright comes from the repo root: npm ci there)
//
// Three days, on a pinned seed. Day one: make a climber (Act I's first goal on screen),
// Hazel's tip about the roof, a double at the café (the goal done), the drive out, an
// onsight of the Warm Boulder and its card, a fall on The Pump that shows you the
// rock-over, dinner, the fire, sleep, and a reload that comes back to the same morning.
// Day two: Send City, a setting shift, Sage turning up and showing you a problem's trick,
// a flash with it, the board, then home to lie around till dark, and tomorrow's café shift
// signed up for from the week.
// Day three is counted (Phase 11): a shift, the crag, three goes, back, dinner and bed in
// 20 taps or fewer, not counting the climbing itself. Every trip is counted too: two taps
// from the map, three from a scene. Day four runs day three again as a plan, and day five
// runs one the day won't allow.
// Then a v0.956 player, in a browser of their own: the retirement notice, their career kept
// as a file, and coming across as they were. Then a save broken down on the road: the ways
// out, a tow to the garage, and new tires.
// Then a day played with the keyboard alone, and the text at its larger size (Phase 12):
// making a climber, Hazel, the journal, the map's pins, a go on the Warm Boulder, the drive
// home and bed, with nothing running off the screen.
// Last, a first morning on a landscape window (Phase 12): the screen widens rather than
// letterboxing, sheets dock at the right, the map's valley sits in the middle of more
// country, a wall close up is a panel over its crag, and turning the window to portrait
// and back mid-go keeps the game where it was.
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
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
// The seed a new climber's valley rolls is pinned, so day three's weather is the same every
// run: prime, and Roadside open. The game rolls it from eight random bytes; anything else
// that asks for random bytes still gets them.
const SEED = 'dirtbag-qc6qki1m66opy';
const problems = [];
// Every sound the portrait run plays, by cue (Phase 13: every verb has a sound).
const heard = new Set();
// And every place's ambience it played (Phase 13: every place has ambience).
const beds = new Set();

// A page the bot plays on, watched for everything the run fails on. `who` names it in a
// problem.
async function playPage(viewport, deviceScaleFactor, who = '') {
  const p = await browser.newPage({ viewport, deviceScaleFactor });
  await p.addInitScript(() => {
    const real = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = (a) => {
      if (!(a instanceof Uint32Array) || a.length !== 2) return real(a);
      a.set([1592590338, 3517427878]);
      return a;
    };
  });
  // Phase 12: no toast runs past 30 words, and none lands on a control you could tap. Every
  // toast the run shows is watched, not just the ones the bot looks for, across reloads.
  await p.exposeFunction('problem', (why) => problems.push(`${who}${why}`));
  await p.exposeFunction('heard', (cue) => !who && heard.add(cue));
  await p.exposeFunction('bed', (key) => !who && beds.add(key.split(':')[0]));
  await p.addInitScript(() => {
    window.addEventListener('dirtbag:sound', (e) => window.heard(e.detail));
    window.addEventListener('dirtbag:ambience', (e) => window.bed(e.detail));
  });
  await p.addInitScript(() => {
    let last = '';
    new MutationObserver(() => {
      const el = document.getElementById('toast');
      const t = el?.textContent?.trim() ?? '';
      if (t === last) return;
      last = t;
      if (!el) return;
      if (t.split(/\s+/).length > 30) window.problem(`a toast over 30 words: ${t}`);
      const a = el.getBoundingClientRect();
      // A thing in a scene isn't counted: its tap area can be a whole wall, top to ground, and
      // no lane misses it. Toasts never take a tap, so a tap there still lands.
      for (const c of document.querySelectorAll(
        'button:not(:disabled):not(.hot), button.hot.pin, input, [role="radio"]',
      )) {
        const b = c.getBoundingClientRect();
        if (!b.width || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)
          continue;
        const what = c.id ? `#${c.id}` : c.getAttribute('aria-label') || c.textContent?.trim().slice(0, 30);
        window.problem(`a toast over ${what}: ${t}`);
      }
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  p.on('pageerror', (e) => problems.push(`${who}uncaught: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && problems.push(`${who}console.error: ${m.text()}`));
  p.on('requestfailed', (r) => problems.push(`${who}request failed: ${r.url()}`));
  // data: and this page's own blob: URLs (the send card's image) never touch the network.
  p.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(server.url) && !u.startsWith('data:') && !u.startsWith(`blob:${server.url}`))
      problems.push(`${who}left the site: ${u}`);
  });
  return p;
}

// Every helper below plays on `page`; the landscape morning at the end swaps it.
let page = await playPage({ width: 390, height: 844 }, 2);

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

// Every tap, click, key and walk the player makes, for Phase 11's budgets. The hold button
// isn't counted: that's the climbing itself.
let taps = 0;

// Taps on the game screen in its own logical pixels: 740 tall, and 360 across in portrait.
async function tapAt(x, y) {
  const box = await page.locator('#cv').boundingBox();
  const k = box.height / 740;
  await page.mouse.click(box.x + x * k, box.y + y * k);
  taps++;
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
  taps++;
};

const press = async (key) => {
  await page.keyboard.press(key);
  taps++;
};

const hudTime = () => text('#h-time');

// ---- the hold button ----

let down = false;
// The keyboard day holds on with the space bar instead of a finger on the button.
let holdKey = false;
async function setHold(on) {
  if (on === down) return;
  if (holdKey) {
    if (on) await page.keyboard.down(' ');
    else await page.keyboard.up(' ');
    down = on;
    return;
  }
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
    const pump = parseFloat(document.getElementById('c-pump')?.style.getPropertyValue('--w') ?? '0') || 0;
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
// Scenes are 960 wide unless they say otherwise; the gym runs on past its wall to the board.
const GYM_W = 1250;
const camFor = (x, w = 960) => Math.min(Math.max(x - VW / 2, 0), w - VW);
const screenX = (worldX, standX, w) => (worldX - camFor(standX, w)) * Z;
const screenY = (worldY) => worldY * Z + (612 - 560 * Z);

async function walk(dx) {
  const key = dx < 0 ? 'ArrowLeft' : 'ArrowRight';
  await page.keyboard.down(key);
  await wait((Math.abs(dx) / WALK) * 1000);
  await page.keyboard.up(key);
  taps++;
  await wait(1500);
}

// ---- trips ----

// Where the map's pins are, on the game screen: MAP_PINS, fitted under the HUD as MAP_FIT
// fits them (both in view/layout.ts). Change one and the other must follow.
const FIT = { top: 112, bottom: 648, from: 34, to: 612 };
const FK = (FIT.bottom - FIT.top) / (FIT.to - FIT.from);
const fit = ([x, y]) => [180 + (x - 180) * FK, FIT.top + (y - FIT.from) * FK];
const PIN = Object.fromEntries(
  Object.entries({
    lot: [262, 612],
    diner: [96, 458],
    gym: [282, 414],
    cafe: [282, 476],
    shop: [240, 540],
  }).map(([id, at]) => [id, fit(at)]),
);
const trips = [];

// A trip from a scene: the map, the pin, the drive. Phase 11 holds every trip to two taps
// from the map, so three from a scene; the card between pin and drive stays, since it shows
// the cost, the weather and who's there. `onMap` runs on the map and `onCard` on the card,
// neither of them counted.
async function driveFrom(what, pin, card, { onMap, onCard } = {}) {
  const t0 = taps;
  await openMap();
  if (onMap) await onMap();
  await tapAt(...pin);
  await expectText('#sheet', card, 'place card');
  if (onCard) await onCard();
  await click('#sheet .opt', 'Drive here');
  counted(what, taps - t0, 3);
}

async function openMap() {
  await click('#b-nav', 'Map');
  await until('the map', async () => (await text('#b-nav')) === 'Close');
  await wait(450); // taps during a fade are ignored, as they are for a player
}

// A place card's header, painted: enough of the canvas has something on it. It's painted
// after the card is up, so this waits for it.
const header = (what) =>
  until(what, () =>
    page.evaluate(() => {
      const c = document.querySelector('#place-head');
      const d = c?.width ? c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data : null;
      if (!d) return false;
      let n = 0;
      for (let i = 3; i < d.length; i += 4 * 101) if (d[i]) n++;
      return n > d.length / (4 * 101) / 2 ? `${c.width}×${c.height}` : false;
    }),
  );

// A drive offered on the card in front of you (a card-only place, or the van): its tap is
// the whole trip.
async function driveOn(what, label) {
  const t0 = taps;
  await click('#sheet .opt', label);
  counted(what, taps - t0, 2);
}

function counted(what, n, most) {
  trips.push(`${what} ${n}`);
  if (n > most) problems.push(`${what} took ${n} taps; the most is ${most}`);
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

// Three goes on the Warm Boulder, arriving at Roadside by the van: the first from where you
// park (180), where it's just off the right of the screen, then from its foot (310) after a
// send, or straight from the rest after a fall. Ends walked off, back in the scene.
async function warmGoes() {
  let from = 180;
  for (let go = 1; ; go++) {
    if (!(await page.locator('#sheet .go').count())) {
      await tapAt(from === 180 ? 350 : screenX(340, from), screenY(540));
      await expectText('#sheet', /Warm Boulder · V2/, 'beta sheet');
    }
    await click('#sheet .go');
    await until('the climb panel', () => page.locator('#climb').count());
    await climb();
    const next = await until(
      'the go to end',
      async () =>
        ((await page.locator('#sheet .opt', { hasText: 'Rest, then go again' }).count()) &&
          'Rest, then go again') ||
        ((await page.locator('#sheet .opt', { hasText: 'Walk down the back' }).count()) &&
          'Walk down the back'),
      15_000,
    );
    log(`go ${go}: ${(await text('#sheet'))?.slice(0, 60)}`);
    if (go === 3) {
      await click('#sheet .opt', next === 'Walk down the back' ? next : 'Walk off');
      break;
    }
    await click('#sheet .opt', next);
    if (next === 'Walk down the back') {
      await until('the crag again', async () => (await text('#b-nav')) === 'Map');
      await wait(600);
      from = 310;
    }
  }
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
await press('Enter');
await expectText('#bubble', /staring at The Pump/, 'Hazel');
await shot('hazel');
await click('#bubble button', 'Ask about the roof');
await expectText('#bubble', /Hook your left heel/, 'Hazel on the roof');
await click('#bubble button', 'Got it');
await expectText('#toast', /New beta: heel-hook the lip/, 'toast');

console.log('A double at the café');
await driveFrom('the Lot to the café', PIN.cafe, /Coffee Shop/, {
  onMap: () => shot('map'),
  // A place you only see as a card has its front drawn: the café, with Wren at the window.
  onCard: async () => log(`the café's front: ${await header("the café's front")}`),
});
await expectText('#sheet', /Wren is on the bar/, 'at the café');
await click('#sheet .opt', 'Pick up a double');
await expectText('#h-cash', /^\$96$/, 'paid');
await expectText('#h-time', /1:48 PM$/, 'clock');

console.log('Drive to Roadside Crag');
await driveOn('the café to Roadside', 'Drive to Roadside Crag');
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
// Day one's a prime day: the sun comes round the far end of Roadside at 2, and the Warm
// Boulder, by the road, is the last line it reaches.
await expectText('#sheet', /in the shade till 4 PM/, 'the shade on it');
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
await driveFrom('Roadside to the diner', PIN.diner, /The Diner/);
await expectText('#sheet', /Otis is reading the paper/, 'at the diner');
await click('#sheet .opt', 'Order the special');
await shot('diner');
await driveOn('the diner to the Lot', 'Drive back to the Lot');
await until('the Lot', async () => (await text('#hint')) === 'Tap anywhere to walk');
await expectText('#h-time', clockRe(17 * 60 + 33 + late), 'clock');

console.log('The evening');
// The van, 160 px to the left of where you park: cook, which runs the clock past dusk.
await tapAt(100, 560);
await expectText('#sheet', /Your van/, 'van');
await click('#sheet .opt', 'Cook ramen');
await expectText('#h-time', clockRe(17 * 60 + 53 + late), 'clock');
// Above the sheet, which at night has Tonight on it too.
await tapAt(200, 150);
await until('the sheet to close', async () => !(await page.locator('#sheet').count()));
for (let i = 0; i < 2; i++) {
  await tapAt(340, 650);
  await wait(2200);
}
await press('Enter');
await expectText('#bubble', new RegExp(`${goes + 1} goes today`), 'Hazel at night');
await shot('fire');
await click('#bubble button', 'Sit a while');
await expectText('#h-time', clockRe(18 * 60 + 33 + late), 'clock');

console.log('Sleep');
await page.keyboard.down('ArrowLeft');
await wait(2600);
await page.keyboard.up('ArrowLeft');
taps++;
await press('Enter');
await expectText('#sheet', /Your van/, 'van');
// Tonight says what bed will do, and bed does it: $41 in the morning.
await expectText('#tonight', /The spot\$18.*Morning\$41/, 'tonight');
// Psyche by morning, and the fire you sat at is part of why.
await expectText('#psyche', /^Psyche(Keen|Psyched)Up for .*the fire\./, 'psyche');
await click('#sheet .opt', 'Sleep');
await expectText('#h-time', /^Day 2 · 7:10 AM$/, 'morning');
await expectText('#h-cash', /^\$41$/, 'cash');
await shot('day-2');

console.log('Reload');
await page.reload({ waitUntil: 'load' });
await expectText('#h-time', /^Day 2 · 7:10 AM$/, 'clock after reload');
await expectText('#h-cash', /^\$41$/, 'cash after reload');
if (await page.locator('#create').count()) await fail('the climber screen came back after a reload');

console.log('The journal');
// Your body in the HUD opens your journal; "Lately" has yesterday in full, newest first.
await click('#h-you');
await expectText('#sheet-title', /^Robin/, 'the journal');
await click('#j-lately');
const days = await until('the log', () =>
  page.evaluate(() => [...document.querySelectorAll('#log .crux')].map((e) => e.textContent).join(', ')),
);
if (!days.startsWith('Day 2, Day 1')) await fail(`the log's days: ${days}`);
log(`lately: ${days}`);
await expectText('#log', /Van spot, \$18\. Morning comes anyway\./, 'last night, in full');
await shot('journal');
// Phase 22.9c: the words, a glossary, grouped.
await click('#j-words');
await expectText('#words', /On the wall.*Crimp.*How it went.*Onsight.*The life.*Dirtbag/, 'the words');
log(`words: ${await page.evaluate(() => document.querySelectorAll('#words dt').length)} of them`);
await shot('words');
await click('#sheet .x');

// ---- day two ----

console.log('Place cards');
// Before the drive, a card shows the place as you'd find it, and who'd be there. Day two is
// fair: Roadside at 8:10 AM has Hazel till five, so a belayer and a spotter till then.
await openMap();
await tapAt(...fit([292, 220]));
await expectText(
  '#around',
  /around at 8:10 AM.*Hazel, till 5 PM.*A belayer and a spotter till 5 PM\./,
  "who's around at Roadside",
);
log(`Roadside's header: ${await header("Roadside's header")}`);
await shot('card-road');
await click('#sheet .x');
await click('#b-nav', 'Close');
await until('the Lot', async () => (await text('#b-nav')) === 'Map');

console.log('Send City');
// Sage's there from nine, but you haven't met her yet.
await driveFrom(
  'the Lot to Send City',
  PIN.gym,
  /Send City.*around at 7:22 AM.*Someone you haven't met, from 9 AM till 6 PM/,
);
await until('the gym', async () => (await text('#hint'))?.includes('Day pass at the desk'));
await wait(400);
await shot('gym');

console.log('A setting shift, and Sage turns up');
// Spawn 70, camera at 0: the desk is at 170.
await tapAt(170 * Z, screenY(540));
await expectText('#sheet', /The desk/, 'desk');
await click('#sheet .opt', 'Set problems for a shift');
await expectText('#h-time', /11:22 AM$/, 'clock');
await expectText('#h-cash', /^\$70$/, 'paid');
await expectText('#toast', /Sage turns up/, 'Sage');
await click('#sheet .x');
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
taps++;
await until(
  'the new beta picked',
  async () => (await page.locator('#sheet .beta').nth(1).getAttribute('aria-checked')) === 'true',
);
await shot('beta-gym');
const gymGoes = await sendIt('the V0');
if (gymGoes !== 1) await fail(`the V0 took ${gymGoes} goes`);
await expectText('#sheet', /^Flash/, 'result');
await shot('flash');

console.log('The board');
// Off the V0 at its foot (354). The board hangs past the wall, 990 to 1190: walk most of
// the way, and it's on screen.
await click('#sheet .opt', 'Drop onto the mats');
await until('the gym again', async () => (await text('#b-nav')) === 'Map');
await wait(600);
await walk(700);
await tapAt(screenX(1090, 1054, GYM_W), screenY(450));
await expectText('#sheet', /The board.*4 problems, V4 to V7/, 'the board');
await shot('board');
await click('#sheet .opt');
await expectText('#sheet', /· V4/, 'a board problem');
await shot('beta-board');
// Down from a board problem, you're back under the board, not at the wall's first problem.
await click('#b-nav', 'Down');
await until('the gym again', async () => (await text('#b-nav')) === 'Map');
await wait(600);
await tapAt(screenX(1090, 1050, GYM_W), screenY(450));
await expectText('#sheet', /The board/, 'the board, from its foot');
await click('#sheet .x');
await wait(300);

console.log('The save');
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save') ?? 'null'));
const st = saved?.state;
const pump = st?.routes?.pump;
if (
  saved?.v !== 29 ||
  st.encounter !== null ||
  st.table !== null ||
  st.cards !== null ||
  st.booked !== null ||
  !Array.isArray(st.deck?.seen) ||
  !(st.guitar >= 0) ||
  !Array.isArray(st.seen) ||
  !(st.psyche?.level >= 0) ||
  !Array.isArray(st.crags) ||
  !(st.supplies >= 0) ||
  !Array.isArray(st.scars) ||
  st.insurance !== 'catastrophic' ||
  !Array.isArray(st.meals) ||
  st.spot !== 'lot' ||
  !(st.van?.tires > 0) ||
  st.breakdown !== null ||
  // Day two's setting shift was a walk-in: paid, and not counted.
  st.jobs?.set !== undefined ||
  !Array.isArray(st.shifts) ||
  st.lifestyle !== 'dirtbag' ||
  st.training?.phase !== 'base' ||
  st.seed !== SEED ||
  !(st.gear?.shoes > 0 && st.gear.shoes < 60) ||
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
await expectText('#h-cash', /^\$70$/, 'cash offline');
await shot('offline');
await page.context().setOffline(false);

console.log('Home, and lie around till dark');
// Nothing more today: one tap takes the afternoon, and bed opens once it's dark.
await driveFrom('Send City to the Lot', PIN.lot, /The Lot/);
await until('the Lot', async () => (await text('#hint')) === 'Tap anywhere to walk');
await tapAt(100, 560);
await expectText('#sheet', /Your van/, 'van');
await click('#sheet .opt', 'Lie around till dark');
await expectText('#h-time', /^Day 2 · 5:00 PM$/, 'dark');

console.log('The week: a shift signed up for, where you park, insurance, and how you live');
// Tomorrow's café shift, signed up for from the van, so day three's shift counts toward a
// raise. How you live stays a dirtbag's: day three's money is counted as it always was.
await click('#sheet .opt', 'Your week');
await expectText('#shifts', /Today.*Coffee Shop/, 'the schedule');
await click('#sh-cafe-1');
await until('signed up', async () => (await page.getAttribute('#sh-cafe-1', 'aria-pressed')) === 'true');
await expectText('#spots', /The Lot.*The Upper Trailhead.*The Ridge/, 'where you park');
if ((await page.getAttribute('#spot-lot', 'aria-checked')) !== 'true') await fail('not parked at the Lot');
if ((await page.getAttribute('#spot-ridge', 'aria-disabled')) !== 'true')
  await fail('the Ridge is open on day two');
await expectText('#plans', /No insurance · free.*Catastrophic · \$25 a week.*Full cover/, 'insurance');
if ((await page.getAttribute('#plan-catastrophic', 'aria-checked')) !== 'true')
  await fail('not on the catastrophic plan');
await expectText('#living', /Dirtbag · free.*Comfortable/, 'how you live');
if ((await page.getAttribute('#live-dirtbag', 'aria-checked')) !== 'true')
  await fail('not living as a dirtbag');
await shot('week');
await click('#sheet .x');
await tapAt(100, 560);
await expectText('#sheet', /Your van/, 'van');
await expectText('#sheet', /Next shift: Coffee Shop, Wed/, 'the next shift, from the van');
await expectText(
  '#sheet',
  /The pantry.*Empty\. Supplies \d+\. The market’s in Midtown/,
  'the pantry, from the van',
);
await click('#sheet .opt', 'Sleep');
await expectText('#h-time', /^Day 3 · 7:10 AM$/, 'morning');

// ---- day three, counted ----

console.log('Day three, counted');
// A working day on Phase 11's budget, 20 taps or fewer, not counting the climbing itself:
// a shift, the crag, three goes, back, dinner, bed.
const day3 = taps;
await driveFrom('the Lot to the café', PIN.cafe, /Coffee Shop/);
await click('#sheet .opt', 'Work a shift');
await expectText('#h-time', /^Day 3 · 10:18 AM$/, 'clock');
if ((await text('#toast'))?.includes('walk-in')) await fail('a signed-up shift paid as a walk-in');
await driveOn('the café to Roadside', 'Drive to Roadside Crag');
await until('the crag', async () => (await text('#hint'))?.includes('Boulders on the talus'));
await wait(400);
await warmGoes();
await until('the crag again', async () => (await text('#b-nav')) === 'Map');
await wait(600);
// The van, parked on the left: on screen from the boulder's foot.
{
  const t0 = taps;
  await tapAt(screenX(215, 310), screenY(520));
  await expectText('#sheet', /The van/, 'the van');
  await click('#sheet .opt', 'Drive back to the Lot');
  counted('Roadside to the Lot, by the van', taps - t0, 3);
}
await until('the Lot', async () => (await text('#hint')) === 'Tap anywhere to walk');
await tapAt(100, 560);
await expectText('#sheet', /Your van/, 'van');
await click('#sheet .opt', 'Cook ramen');
await click('#sheet .opt', 'Lie around till dark');
await expectText('#h-time', /^Day 3 · 5:00 PM$/, 'dark');
await click('#sheet .opt', 'Sleep');
await expectText('#h-time', /^Day 4 · 7:10 AM$/, 'morning');
const loop = taps - day3;
log(`day three: ${loop} taps, the most being 20`);
log(`trips, in taps: ${trips.join(' · ')}`);
if (loop > 20) await fail(`day three took ${loop} taps; the most is 20`);
await shot('day-4');

// ---- day four, by the plan (Phase 11.4) ----

console.log('Day four, by the plan');
// Yesterday, as played, is today's plan: one tap runs its drives and errands, it waits while
// you climb, and "Go on" runs the rest of the day.
const day4 = taps;
await tapAt(100, 560);
await expectText('#sheet', /Your van/, 'van');
await click('#sheet .opt', 'Plan the day');
await expectText(
  '#sheet',
  /Yesterday, as you played it.*Coffee Shop · Work a shift.*Roadside Crag · Climb.*The Lot · Cook ramen.*The Lot · Lie around till dark.*The Lot · Sleep/,
  'the plan',
);
await shot('plan');
await click('#plan-run');
await until(
  'the plan to wait at the crag',
  async () => (await text('#plan-chip'))?.includes('Go on'),
  30_000,
);
await expectText('#h-time', /^Day 4 · 11:23 AM$/, 'clock');
await expectText('#plan-chip', /Climb, then The Lot/, 'the plan waiting');
await shot('plan-waiting');
await warmGoes();
await until('the crag again', async () => (await text('#b-nav')) === 'Map');
await wait(600);
await click('#plan-go');
// Someone on the road home (Phase 22.6b, this seed's runaway): an answer is a choice, not
// a chore, so it isn't counted; the plan waits for it and carries on.
await until(
  'the next morning, or someone on the road',
  async () =>
    /^Day 5 · 7:10 AM$/.test((await text('#h-time')) ?? '') ||
    /Drive on past/.test((await text('#sheet')) ?? ''),
  30_000,
);
if (/Drive on past/.test((await text('#sheet')) ?? '')) {
  log(`on the road home: ${(await text('#sheet'))?.slice(0, 60)}`);
  await page.locator('#sheet .opt').first().click();
}
await until('the next morning', async () => /^Day 5 · 7:10 AM$/.test((await text('#h-time')) ?? ''), 30_000);
const byPlan = taps - day4;
log(`day four, by the plan: ${byPlan} taps, the most being 13`);
if (byPlan > 13) await fail(`day four took ${byPlan} taps by the plan; the most is 13`);

console.log("Day five: a plan the day won't allow");
// Lie around till dark, then run the plan: the café won't start a shift that late, and the
// plan stops there and says so.
await tapAt(100, 560);
await expectText('#sheet', /Run the plan/, 'the plan kept');
await click('#sheet .opt', 'Lie around till dark');
await click('#sheet .opt', 'Run the plan');
await expectText('#plan-chip', /Plan stopped.*Shifts start by 3 PM/, 'the plan stopped');
await shot('plan-stopped');
await click('#plan-chip .plan-x');

console.log('Busking');
// Phase 22.5b: a set out front, the marker read off the bar and strummed as it crosses the
// middle, as a player's eye would.
await click('#sheet .opt', 'Busk out front');
await until('the set', async () => (await page.locator('#busk').count()) > 0);
for (let n = 0; n < 8; n++) {
  // Watched a frame at a time, in the page: a poll from here is too slow for the band.
  const ok = await page.evaluate(
    () =>
      new Promise((done) => {
        const t0 = performance.now();
        const look = () => {
          const m = document.querySelector('#busk .mark');
          const x = m ? parseFloat(getComputedStyle(m).getPropertyValue('--x')) : NaN;
          if (x >= 46 && x <= 54) {
            document
              .querySelector('#b-strum')
              .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
            done(true);
          } else if (performance.now() - t0 > 5000) done(false);
          else requestAnimationFrame(look);
        };
        look();
      }),
  );
  if (!ok) await fail('the marker never crossed the band');
  await wait(120);
}
await expectText(
  '#b-status',
  /(stop to listen|stops to listen|Nobody stops).*(in the case|stays empty)/,
  'the set',
);
log(`the set: ${await text('#b-status')}`);
await shot('busking');
await click('#b-done');

console.log('The gear shop');
// Phase 21.1: the shop has a front, sells a block of chalk, and the kit shows on the You
// page: the shoes you drove out in, and the chalk.
await expectText('#sheet', /Drive to The Gear Shop/, 'the café’s card');
await driveOn('the café to the gear shop', 'Drive to The Gear Shop');
await header('the shop’s front');
await expectText('#sheet', /A block of chalk/, 'at the shop');
// Phase 21.2: the rack's on the wall at the shop, for the trad lines.
await expectText('#sheet', /A rack/, 'a rack for sale');
const before = await text('#h-cash');
await click('#sheet .opt', 'A block of chalk');
await expectText('#toast', /You crush half of it/, 'chalk bought');
log(`cash ${before} → ${await text('#h-cash')}`);
await shot('gear-shop');

console.log('Training');
// Phase 21.3: home to the van, where the train sheet has the block you're in and prehab,
// which needs no hangboard.
await driveOn('the shop to the Lot', 'Drive back to the Lot');
await until('the Lot', async () => (await text('#b-nav')) === 'Map', 15_000);
await wait(600);
await tapAt(100, 560);
await expectText('#sheet', /Train/, 'the van');
await click('#sheet .opt', 'Train');
await expectText('#sheet', /Base: no phase on.*Prehab.*Change phase.*Taper for a send/, 'the train sheet');
await click('#sheet .opt', 'Prehab');
await expectText('#toast', /Covered for \d+ days/, 'prehab done');
await shot('train-sheet');
await press('Escape');
await click('#h-you');
await expectText('#kit', /Shoes.*Chalk\d+ left/, 'the kit');

console.log('What it sounded like');
log(`heard: ${[...heard].sort().join(', ')}`);
log(`ambience: ${[...beds].sort().join(', ')}`);
// The places the five days go; beds.test.ts holds the Gorge and Moonstone to theirs.
const quiet = ['cafe', 'diner', 'gym', 'lot', 'map', 'road', 'shop'].filter((b) => !beds.has(b));
if (quiet.length) await fail(`no ambience at: ${quiet.join(', ')}`);
// Everything the five days do. Scout and a hold-to-load's charge and throw aren't in them;
// cues.test.ts holds those to having a sound.
const HEARD =
  'breath cleared clip crux drive earn eat fell grip land move paper pay pullon rest send slap sleep step strum talk tap train';
const silent = HEARD.split(' ').filter((c) => !heard.has(c));
if (silent.length) await fail(`never heard: ${silent.join(', ')}`);

console.log('A v0.956 player');
// v0.956 retired at R3. Someone who played it opens the new game in a browser that still
// holds their career: they're told, they can keep it as a file, and they come across as
// they were, capped. Their old keys are left exactly as they were.
{
  const career = {
    name: 'Robin Vance',
    day: 212,
    skills: { power: 180, fingers: 220, endurance: 150, technique: 170, head: 90 },
    needs: { cash: 3120 },
  };
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    acceptDownloads: true,
  });
  await ctx.addInitScript((c) => {
    if (localStorage.getItem('dirtbag-save-v3') === null) {
      localStorage.setItem('dirtbag-save-v3', JSON.stringify(c));
      localStorage.setItem('dirtbag-whatsnew-seen', '0.956.0');
    }
  }, career);
  const vet = await ctx.newPage();
  vet.on('pageerror', (e) => problems.push(`v0.956 player: uncaught: ${e.message}`));
  vet.on(
    'console',
    (m) => m.type() === 'error' && problems.push(`v0.956 player: console.error: ${m.text()}`),
  );
  vet.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(server.url) && !u.startsWith('data:') && !u.startsWith(`blob:${server.url}`))
      problems.push(`v0.956 player left the site: ${u}`);
  });
  await vet.goto(server.url, { waitUntil: 'load' });
  await vet.waitForSelector('#legacy', { timeout: 10_000 });
  const seen = await vet.evaluate(() => ({
    notice: document.querySelector('#legacy h3')?.textContent,
    name: document.querySelector('#c-name')?.value,
    carry: document.querySelector('#c-carry')?.getAttribute('aria-checked'),
    line: document.querySelector('#c-carry small')?.textContent,
  }));
  log(`notice: ${seen.notice} · name ${seen.name} · ${seen.line}`);
  if (
    seen.notice !== 'v0.956 has retired' ||
    seen.name !== 'Robin Vance' ||
    seen.carry !== 'true' ||
    !/^You were climbing V6\. You come back at V3/.test(seen.line ?? '')
  )
    await fail(`the retirement notice: ${JSON.stringify(seen)}`);
  await vet.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-v0956-player.png`) });
  const [dl] = await Promise.all([vet.waitForEvent('download'), vet.click('#c-export')]);
  const file = JSON.parse(readFileSync(await dl.path(), 'utf8'));
  if (
    dl.suggestedFilename() !== 'dirtbag-v0956-career.json' ||
    file.keys?.['dirtbag-save-v3'] !== JSON.stringify(career)
  )
    await fail(`the exported career: ${dl.suggestedFilename()} ${JSON.stringify(file).slice(0, 200)}`);
  log(`kept: ${dl.suggestedFilename()}, ${Object.keys(file.keys).length} keys`);
  await vet.click('#c-go');
  const me = await vet
    .waitForFunction(() => JSON.parse(localStorage.getItem('dirtbag.save') ?? 'null')?.state?.climber, null, {
      timeout: 10_000,
    })
    .then((h) => h.jsonValue());
  const avg = Object.values(me.skills).reduce((a, b) => a + b, 0) / 5;
  const grade = Math.floor((-8 + Math.sqrt(64 + 9.6 * avg)) / 4.8);
  const old = await vet.evaluate(() => localStorage.getItem('dirtbag-save-v3'));
  if (me.name !== 'Robin Vance' || me.start !== 'v0956' || grade !== 3 || old !== JSON.stringify(career))
    await fail(`came across as ${JSON.stringify(me)} (V${grade}); old save ${old ? 'kept' : 'gone'}`);
  log(
    `came across: ${me.name}, V${grade}, fingers still the strength (${me.skills.fingers} vs head ${me.skills.head})`,
  );
  await ctx.close();
}

console.log('Broken down on the road');
// Phase 22.2a. A save from the side of the road (the day-five climber, tires gone, halfway to
// Roadside) comes back to the breakdown and nothing else. A tow takes the van to the
// garage, and the garage puts new tires on it.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    at: 'lot',
    x: null,
    min: 9 * 60,
    cash: 300,
    van: { tires: 5, engine: 80, battery: 80 },
    breakdown: { part: 'tires', to: 'road', rest: 30, bodged: false },
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const road = await ctx.newPage();
  road.on('pageerror', (e) => problems.push(`breakdown: uncaught: ${e.message}`));
  road.on('console', (m) => m.type() === 'error' && problems.push(`breakdown: console.error: ${m.text()}`));
  await road.goto(server.url, { waitUntil: 'load' });
  const sheetText = () => road.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  await road.waitForFunction(
    () => /Broken down/.test(document.querySelector('#sheet')?.textContent ?? ''),
    null,
    {
      timeout: 10_000,
    },
  );
  const ways = await sheetText();
  log(`breakdown: ${ways.slice(0, 120)}`);
  if (!/Bodge it/.test(ways) || !/Limp on to Roadside Crag/.test(ways) || !/Call a tow/.test(ways))
    await fail(`the ways out: ${ways}`);
  if (await road.$('#sheet .x')) await fail('a breakdown can be closed without a way out');
  await road.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-breakdown.png`) });
  await road.locator('#sheet .opt', { hasText: 'Call a tow' }).first().click();
  await road.waitForFunction(
    () => /The Garage/.test(document.querySelector('#sheet')?.textContent ?? ''),
    null,
    {
      timeout: 10_000,
    },
  );
  // Dale fits upgrades too (Phase 22.2c): the heater for winter among them.
  const garage = await sheetText();
  if (!/Fit a diesel heater/.test(garage) || !/Insulate the van/.test(garage))
    await fail(`the garage's upgrades: ${garage.slice(0, 200)}`);
  await road.locator('#sheet .opt', { hasText: 'New tires' }).first().click();
  const after = await road
    .waitForFunction(
      () => {
        const st = JSON.parse(localStorage.getItem('dirtbag.save') ?? 'null')?.state;
        return st?.van?.tires === 100 ? st : null;
      },
      null,
      { timeout: 10_000 },
    )
    .then((h) => h.jsonValue());
  if (after.at !== 'garage' || after.breakdown !== null || !(after.cash < 300 - 70))
    await fail(`after the tow and the tires: ${JSON.stringify({ at: after.at, cash: after.cash })}`);
  log(`towed and fixed: at the garage, $${after.cash}, tires ${after.van.tires}`);
  await road.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-garage.png`) });
  await ctx.close();
}

console.log('A knock on the van');
// Phase 22.6a. The day-five climber on the night of day seven at the Lot, which this seed's
// deck knocks on: bed, the knock (heard), its card with three answers and no ✕, an answer,
// and the morning.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 7,
    min: 21 * 60,
    at: 'lot',
    x: null,
    cash: 150,
    spot: 'lot',
    encounter: null,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
    window.cues = [];
    window.addEventListener('dirtbag:sound', (e) => window.cues.push(e.detail));
  }, JSON.stringify(saved));
  const night = await ctx.newPage();
  night.on('pageerror', (e) => problems.push(`knock: uncaught: ${e.message}`));
  night.on('console', (m) => m.type() === 'error' && problems.push(`knock: console.error: ${m.text()}`));
  await night.goto(server.url, { waitUntil: 'load' });
  const sheetOf = () => night.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  await night.waitForFunction(() =>
    /Tap anywhere to walk/.test(document.querySelector('#hint')?.textContent ?? ''),
  );
  await night.mouse.click(100, 560);
  await night.waitForFunction(() => /Your van/.test(document.querySelector('#sheet')?.textContent ?? ''));
  await night.locator('#sheet .opt', { hasText: 'Sleep' }).first().click();
  await night.waitForFunction(
    () => /The Dumpster Behind the Building/.test(document.querySelector('#sheet')?.textContent ?? ''),
    null,
    { timeout: 10_000 },
  );
  const card = await sheetOf();
  log(`knock: ${card.slice(0, 110)}`);
  if (!/Have a proper look yourself/.test(card) || !/Go back to bed/.test(card))
    await fail(`the answers: ${card}`);
  if (await night.$('#sheet .x')) await fail('a knock can be closed without an answer');
  if (!(await night.evaluate(() => window.cues.includes('knock')))) await fail('the knock was never heard');
  await night.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-knock.png`) });
  await night.locator('#sheet .opt', { hasText: 'Go back to bed' }).first().click();
  await night.waitForFunction(
    () => /^Day 8 · /.test(document.querySelector('#h-time')?.textContent ?? ''),
    null,
    {
      timeout: 10_000,
    },
  );
  const after = await night.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (after.encounter !== null || after.deck.knock !== 7)
    await fail(`after the knock: ${JSON.stringify(after.deck)}`);
  log('knock: answered, and morning');
  await ctx.close();
}

console.log('A hitchhiker on the way to Roadside');
// Phase 22.6b. The day-five climber on the morning of day four, whose drive to Roadside this
// seed's deck puts a busker beside: the map, the drive, the door (heard), their card with
// no ✕, three chords, and the crag. The busker remembers what you asked for.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 4,
    min: 9 * 60,
    at: 'lot',
    x: null,
    cash: 150,
    energy: 80,
    guitar: 0,
    van: { tires: 100, engine: 100, battery: 100 },
    deck: { last: 0, knock: 0, seen: [], hitch: 0, stop: 0, stops: [], met: {}, epic: 0 },
    encounter: null,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
    window.cues = [];
    window.addEventListener('dirtbag:sound', (e) => window.cues.push(e.detail));
  }, JSON.stringify(saved));
  const trip = await ctx.newPage();
  trip.on('pageerror', (e) => problems.push(`hitchhiker: uncaught: ${e.message}`));
  trip.on('console', (m) => m.type() === 'error' && problems.push(`hitchhiker: console.error: ${m.text()}`));
  await trip.goto(server.url, { waitUntil: 'load' });
  const sheetOf = () => trip.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  await trip.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await trip.click('#b-nav');
  await trip.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Close');
  await trip.waitForTimeout(450);
  const box = await trip.locator('#cv').boundingBox();
  const [rx, ry] = fit([292, 220]);
  await trip.mouse.click(box.x + (rx * box.height) / 740, box.y + (ry * box.height) / 740);
  await trip.waitForFunction(() => /Roadside Crag/.test(document.querySelector('#sheet')?.textContent ?? ''));
  await trip.locator('#sheet .opt', { hasText: 'Drive here' }).first().click();
  await trip.waitForFunction(
    () => /A busker with a guitar/.test(document.querySelector('#sheet')?.textContent ?? ''),
    null,
    { timeout: 15_000 },
  );
  const card = await sheetOf();
  log(`hitchhiker: ${card.slice(0, 110)}`);
  if (!/Ask them to teach you three chords/.test(card) || !/Drive on past/.test(card))
    await fail(`the answers: ${card}`);
  if (await trip.$('#sheet .x')) await fail('a hitchhiker can be closed without an answer');
  if (!(await trip.evaluate(() => window.cues.includes('door')))) await fail('the door was never heard');
  await trip.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-hitchhiker.png`) });
  await trip.locator('#sheet .opt', { hasText: 'Ask them to teach you three chords' }).first().click();
  await trip.waitForFunction(() => !document.querySelector('#sheet'), null, { timeout: 10_000 });
  const after = await trip.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (after.at !== 'road' || after.guitar !== 3 || after.deck.met.busker !== 2 || after.encounter !== null)
    await fail(`after the ride: at ${after.at}, guitar ${after.guitar}, ${JSON.stringify(after.deck)}`);
  log('hitchhiker: three chords, and Roadside');
  await ctx.close();
}

console.log('A roadside stop on the way to Roadside');
// Phase 22.6b. Day eight's morning drive to Roadside passes this seed's Balanced Rock: the
// tires onto gravel (heard), its card, pulling over, and the find kept.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 8,
    min: 9 * 60,
    at: 'lot',
    x: null,
    cash: 150,
    energy: 80,
    van: { tires: 100, engine: 100, battery: 100 },
    deck: { last: 0, knock: 0, seen: [], hitch: 0, stop: 0, stops: [], met: {}, epic: 0 },
    encounter: null,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
    window.cues = [];
    window.addEventListener('dirtbag:sound', (e) => window.cues.push(e.detail));
  }, JSON.stringify(saved));
  const pull = await ctx.newPage();
  pull.on('pageerror', (e) => problems.push(`stop: uncaught: ${e.message}`));
  pull.on('console', (m) => m.type() === 'error' && problems.push(`stop: console.error: ${m.text()}`));
  await pull.goto(server.url, { waitUntil: 'load' });
  await pull.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await pull.click('#b-nav');
  await pull.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Close');
  await pull.waitForTimeout(450);
  const box = await pull.locator('#cv').boundingBox();
  const [rx, ry] = fit([292, 220]);
  await pull.mouse.click(box.x + (rx * box.height) / 740, box.y + (ry * box.height) / 740);
  await pull.waitForFunction(() => /Roadside Crag/.test(document.querySelector('#sheet')?.textContent ?? ''));
  await pull.locator('#sheet .opt', { hasText: 'Drive here' }).first().click();
  await pull.waitForFunction(
    () => /Balanced Rock/.test(document.querySelector('#sheet')?.textContent ?? ''),
    null,
    {
      timeout: 15_000,
    },
  );
  if (await pull.$('#sheet .x')) await fail('a stop can be closed without an answer');
  if (!(await pull.evaluate(() => window.cues.includes('pullover'))))
    await fail('the pull-off was never heard');
  await pull.locator('#sheet .opt', { hasText: 'Pull over' }).first().click();
  await pull.waitForFunction(() => !document.querySelector('#sheet'), null, { timeout: 10_000 });
  const after = await pull.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (after.at !== 'road' || !after.deck.stops.includes('balanced') || after.encounter !== null)
    await fail(`after the stop: at ${after.at}, ${JSON.stringify(after.deck)}`);
  log('stop: Balanced Rock, pulled over, and kept');
  await ctx.close();
}

console.log('A walk-out from Roadside');
// Phase 22.6c. The day-five climber at Roadside at half nine on the night of day four,
// spent, hungry, alone and with no headlamp, which this seed's deck turns into The Walk Out:
// the map, the drive that waits, the trail (heard), three careful calls, out clean, and the
// journal has it.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 4,
    min: 21 * 60 + 30,
    at: 'road',
    x: null,
    energy: 20,
    fed: 10,
    cash: 150,
    people: {},
    injury: null,
    van: { tires: 100, engine: 100, battery: 100 },
    deck: { last: 0, knock: 0, seen: [], hitch: 0, stop: 0, stops: [], met: {}, epic: 0 },
    encounter: null,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
    window.cues = [];
    window.addEventListener('dirtbag:sound', (e) => window.cues.push(e.detail));
  }, JSON.stringify(saved));
  const dark = await ctx.newPage();
  dark.on('pageerror', (e) => problems.push(`walk-out: uncaught: ${e.message}`));
  dark.on('console', (m) => m.type() === 'error' && problems.push(`walk-out: console.error: ${m.text()}`));
  await dark.goto(server.url, { waitUntil: 'load' });
  const sheetOf = () => dark.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  await dark.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await dark.click('#b-nav');
  await dark.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Close');
  await dark.waitForTimeout(450);
  const box = await dark.locator('#cv').boundingBox();
  const [lx, ly] = fit([262, 612]);
  await dark.mouse.click(box.x + (lx * box.height) / 740, box.y + (ly * box.height) / 740);
  await dark.waitForFunction(() => /Drive here/.test(document.querySelector('#sheet')?.textContent ?? ''));
  await dark.locator('#sheet .opt', { hasText: 'Drive here' }).first().click();
  await dark.waitForFunction(
    () => /The Walk Out/.test(document.querySelector('#sheet')?.textContent ?? ''),
    null,
    {
      timeout: 10_000,
    },
  );
  log(`walk-out: ${(await sheetOf()).slice(0, 110)}`);
  if (await dark.$('#sheet .x')) await fail('a walk-out can be closed without a call');
  if (!(await dark.evaluate(() => window.cues.includes('walkout')))) await fail('the trail was never heard');
  await dark.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-walk-out.png`) });
  for (const call of [
    'Sit down and wait for the moon',
    'Follow the bank down until it narrows',
    'Contour around, however long it takes',
  ]) {
    await dark.waitForFunction(
      (c) => (document.querySelector('#sheet')?.textContent ?? '').includes(c),
      call,
    );
    await dark.locator('#sheet .opt', { hasText: call }).first().click();
  }
  await dark.waitForFunction(() => !document.querySelector('#sheet'), null, { timeout: 10_000 });
  const after = await dark.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (after.encounter !== null || after.at !== 'road' || after.deck.epic !== 4 || after.injury !== null)
    await fail(
      `after the walk-out: at ${after.at}, ${JSON.stringify(after.deck)}, ${JSON.stringify(after.injury)}`,
    );
  if (!after.log.some((l) => /The Walk Out at Roadside Crag/.test(l.text)))
    await fail('the journal missed it');
  log('walk-out: three careful calls, out clean, in the journal');
  await ctx.close();
}

console.log('Scout’s last day');
// Phase 22.7. Scout, sixteen in dog-years tomorrow, and a best friend: bed, the morning, the
// chord (heard), his card with no ✕, the van doors open, and the journal keeps him.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  const day = 300;
  saved.state = {
    ...saved.state,
    day,
    min: 21 * 60,
    at: 'lot',
    x: null,
    cash: 150,
    trips: 20,
    dog: { name: 'Scout', since: day + 1 - 16 * 18, fed: 80, bond: 85 },
    dogs: [],
    deck: { last: 0, knock: day, seen: [], hitch: 0, stop: 0, stops: [], met: {}, epic: 0 },
    encounter: null,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
    window.cues = [];
    window.addEventListener('dirtbag:sound', (e) => window.cues.push(e.detail));
  }, JSON.stringify(saved));
  const last = await ctx.newPage();
  last.on('pageerror', (e) => problems.push(`farewell: uncaught: ${e.message}`));
  last.on('console', (m) => m.type() === 'error' && problems.push(`farewell: console.error: ${m.text()}`));
  await last.goto(server.url, { waitUntil: 'load' });
  await last.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await last.waitForTimeout(600);
  await last.mouse.click(100, 560);
  await last.waitForFunction(() => /Your van/.test(document.querySelector('#sheet')?.textContent ?? ''));
  await last.locator('#sheet .opt', { hasText: 'Sleep' }).first().click();
  await last.waitForFunction(
    () => /not getting up the step into the van/.test(document.querySelector('#sheet')?.textContent ?? ''),
    null,
    { timeout: 10_000 },
  );
  if (await last.$('#sheet .x')) await fail('his last day can be closed without spending it');
  if (!(await last.evaluate(() => window.cues.includes('farewell'))))
    await fail('the last morning was never heard');
  await last.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-farewell.png`) });
  await last.locator('#sheet .opt', { hasText: 'Just the two of you' }).first().click();
  await last.waitForFunction(
    () => JSON.parse(localStorage.getItem('dirtbag.save')).state.dog === null,
    null,
    {
      timeout: 10_000,
    },
  );
  const after = await last.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (after.dogs?.[0]?.name !== 'Scout' || after.dogs[0].years !== 16)
    await fail(`after: ${JSON.stringify(after.dogs)}`);
  if (!after.log.some((l) => /Scout, 16 years\. Spent it with the van doors open/.test(l.text)))
    await fail('the journal missed him');
  log('farewell: the van doors open, and the journal keeps him');
  await ctx.close();
}

console.log('A dream');
// Phase 22.8. A climber with $3,000 in hand at the van: the dreams, the Dream Rig picked,
// everything in the jar, and claimed. Every upgrade is fitted, and the Lot costs half.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 20,
    min: 12 * 60,
    at: 'lot',
    x: null,
    cash: 3000,
    dream: { pick: null, pot: 0, owned: [] },
    encounter: null,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const jar = await ctx.newPage();
  jar.on('pageerror', (e) => problems.push(`dream: uncaught: ${e.message}`));
  jar.on('console', (m) => m.type() === 'error' && problems.push(`dream: console.error: ${m.text()}`));
  await jar.goto(server.url, { waitUntil: 'load' });
  await jar.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await jar.waitForTimeout(600);
  await jar.mouse.click(100, 560);
  await jar.waitForFunction(() => /Your van/.test(document.querySelector('#sheet')?.textContent ?? ''));
  const pick = async (text) => {
    await jar.waitForFunction((t) => (document.querySelector('#sheet')?.textContent ?? '').includes(t), text);
    await jar.locator('#sheet .opt', { hasText: text }).first().click();
  };
  await pick('Dreams');
  await pick('The Dream Rig');
  await pick('Put all $3000 in');
  await pick('Claim The Dream Rig');
  await jar.waitForFunction(() =>
    JSON.parse(localStorage.getItem('dirtbag.save')).state.dream.owned.includes('rig'),
  );
  const after = await jar.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (after.dream.pot !== 200 || after.gear.bed !== 1 || after.gear.kitchen !== 1)
    await fail(`after the Rig: ${JSON.stringify(after.dream)}, ${JSON.stringify(after.gear)}`);
  await jar.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-dream.png`) });
  log('dream: the Dream Rig, claimed from the jar, and fitted out');
  await ctx.close();
}

console.log('Games at the fire');
// Phase 22.9a. Half nine at the Lot, Hazel up: the van, the fire, four horseshoes thrown as
// the marker crosses the band (the busking beat), back to the fire, and a hand of liar's
// dice called. Both are heard, both are played once tonight, and Hazel's bond moves once.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 20,
    min: 21 * 60 + 30,
    at: 'lot',
    x: null,
    energy: 60,
    today: [],
    people: { ...saved.state.people, hazel: { bond: 12, last: 18 } },
    deck: { ...saved.state.deck, knock: 20 },
    encounter: null,
    table: null,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
    window.cues = [];
    window.addEventListener('dirtbag:sound', (e) => window.cues.push(e.detail));
  }, JSON.stringify(saved));
  const fire = await ctx.newPage();
  fire.on('pageerror', (e) => problems.push(`fire: uncaught: ${e.message}`));
  fire.on('console', (m) => m.type() === 'error' && problems.push(`fire: console.error: ${m.text()}`));
  await fire.goto(server.url, { waitUntil: 'load' });
  await fire.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await fire.waitForTimeout(600);
  await fire.mouse.click(100, 560);
  await fire.waitForFunction(() => /Your van/.test(document.querySelector('#sheet')?.textContent ?? ''));
  const pick = async (text) => {
    await fire.waitForFunction(
      (t) => (document.querySelector('#sheet')?.textContent ?? '').includes(t),
      text,
    );
    await fire.locator('#sheet .opt', { hasText: text }).first().click();
  };
  await pick('The fire');
  await pick('Horseshoes');
  await fire.waitForSelector('#busk');
  for (let n = 0; n < 4; n++) {
    const ok = await fire.evaluate(
      () =>
        new Promise((done) => {
          const t0 = performance.now();
          const look = () => {
            const m = document.querySelector('#busk .mark');
            const x = m ? parseFloat(getComputedStyle(m).getPropertyValue('--x')) : NaN;
            if (x >= 46 && x <= 54) {
              document
                .querySelector('#b-strum')
                .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
              done(true);
            } else if (performance.now() - t0 > 5000) done(false);
            else requestAnimationFrame(look);
          };
          look();
        }),
    );
    if (!ok) await fail('fire: the shoe never crossed the band');
    await fire.waitForTimeout(120);
  }
  await fire.waitForFunction(() =>
    /in four throws.*Hazel/.test(document.querySelector('#b-status')?.textContent ?? ''),
  );
  const shoes = await fire.evaluate(() => document.querySelector('#b-status').textContent);
  await fire.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-horseshoes.png`) });
  await fire.click('#b-done');
  await pick('Liar’s dice');
  await fire.waitForFunction(() => /Your cup/.test(document.querySelector('#sheet')?.textContent ?? ''));
  await fire.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-liars-dice.png`) });
  await pick('Call it');
  await fire.waitForFunction(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.table === null);
  const after = await fire.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  const heard = await fire.evaluate(() => window.cues);
  if (
    !after.today.includes('shoes') ||
    !after.today.includes('dice') ||
    after.people.hazel.bond !== 13 ||
    after.people.hazel.last !== 20 ||
    !heard.includes('clang') ||
    !heard.includes('dice')
  )
    await fail(`after the fire: ${JSON.stringify({ today: after.today, hazel: after.people.hazel, heard })}`);
  log(`fire: ${shoes}`);
  await ctx.close();
}

console.log('Cards at the fire');
// Phase 22.9b. Half nine at the Lot with $100: blackjack, a hand stood on and up again; then
// hold'em with Hazel, a hand checked and called to the end, and up again. The money in front
// of you comes back to your pocket, both games are played once tonight, and Hazel's had a
// hand played on her.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 21,
    min: 21 * 60 + 30,
    at: 'lot',
    x: null,
    energy: 60,
    cash: 100,
    today: [],
    people: { ...saved.state.people, hazel: { bond: 12, last: 18 } },
    deck: { ...saved.state.deck, knock: 21 },
    encounter: null,
    table: null,
    cards: null,
    reads: {},
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
    window.cues = [];
    window.addEventListener('dirtbag:sound', (e) => window.cues.push(e.detail));
  }, JSON.stringify(saved));
  const cards = await ctx.newPage();
  cards.on('pageerror', (e) => problems.push(`cards: uncaught: ${e.message}`));
  cards.on('console', (m) => m.type() === 'error' && problems.push(`cards: console.error: ${m.text()}`));
  await cards.goto(server.url, { waitUntil: 'load' });
  await cards.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await cards.waitForTimeout(600);
  await cards.mouse.click(100, 560);
  await cards.waitForFunction(() => /Your van/.test(document.querySelector('#sheet')?.textContent ?? ''));
  const sheet = () => cards.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  const pick = async (text) => {
    await cards.waitForFunction(
      (t) => (document.querySelector('#sheet')?.textContent ?? '').includes(t),
      text,
    );
    await cards.locator('#sheet .opt', { hasText: text }).first().click();
  };
  const seated = () => cards.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.cards);
  await pick('The fire');
  await pick('Blackjack');
  await cards.waitForFunction(() =>
    /In front of you: \$40/.test(document.querySelector('#sheet')?.textContent ?? ''),
  );
  await pick('Deal');
  await cards.waitForFunction(() => {
    const c = JSON.parse(localStorage.getItem('dirtbag.save')).state.cards;
    return c && (c.bj || c.hands === 1);
  });
  if ((await seated()).bj) {
    await cards.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-blackjack.png`) });
    await pick('Stand');
  }
  await cards.waitForFunction(
    () => JSON.parse(localStorage.getItem('dirtbag.save')).state.cards?.hands === 1,
  );
  await pick('Get up');
  await cards.waitForFunction(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.cards === null);
  await pick('Hold’em with Hazel');
  await pick('Deal');
  await cards.waitForFunction(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.cards?.he);
  await cards.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-holdem.png`) });
  for (let g = 0; g < 8 && (await seated())?.he; g++) {
    const was = JSON.stringify(await seated());
    await pick(/Check/.test(await sheet()) ? 'Check' : 'Call');
    await cards.waitForFunction(
      (w) => JSON.stringify(JSON.parse(localStorage.getItem('dirtbag.save')).state.cards) !== w,
      was,
    );
  }
  await pick('Get up');
  await cards.waitForFunction(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.cards === null);
  const after = await cards.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  const heard = await cards.evaluate(() => window.cues);
  if (
    !after.today.includes('bj') ||
    !after.today.includes('holdem') ||
    after.reads.hazel?.hands !== 1 ||
    !(after.cash > 100 - 40 && after.cash < 100 + 40) ||
    !heard.includes('card') ||
    !heard.includes('chips')
  )
    await fail(
      `after the cards: ${JSON.stringify({ today: after.today, reads: after.reads, cash: after.cash, heard })}`,
    );
  log(`cards: up from the fire with $${after.cash}, one hand each`);
  await ctx.close();
}

console.log('An expedition');
// Phase 24.1. A V9 climber with Hazel close and $3,000 at the van in the morning: the
// expeditions, El Capitan's odds with Hazel, and away. Each day up there: wait out a storm, or
// look up at the first pitch (its beta on the wall), then hand it to Hazel and make camp. The
// trip is a day on, a night on the portaledge counted, and the valley waits.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  const v = 267;
  saved.state = {
    ...saved.state,
    day: 22,
    min: 9 * 60,
    at: 'lot',
    x: null,
    cash: 3000,
    energy: 100,
    fed: 90,
    today: [],
    climber: {
      ...saved.state.climber,
      skills: { power: v, fingers: v, endurance: v, technique: v, head: v },
    },
    people: { ...saved.state.people, hazel: { bond: 8, last: 20 } },
    deck: { ...saved.state.deck, knock: 40, last: 40 },
    encounter: null,
    expedition: null,
    wall: null,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const ex = await ctx.newPage();
  ex.on('pageerror', (e) => problems.push(`exped: uncaught: ${e.message}`));
  ex.on('console', (m) => m.type() === 'error' && problems.push(`exped: console.error: ${m.text()}`));
  await ex.goto(server.url, { waitUntil: 'load' });
  await ex.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await ex.waitForTimeout(600);
  await ex.mouse.click(100, 560);
  await ex.waitForFunction(() => /Your van/.test(document.querySelector('#sheet')?.textContent ?? ''));
  const sheetText = () => ex.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  const pick = async (text) => {
    await ex.waitForFunction((t) => (document.querySelector('#sheet')?.textContent ?? '').includes(t), text);
    await ex.locator('#sheet .opt', { hasText: text }).first().click();
  };
  const trip = () => ex.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.expedition);
  const asking = () =>
    ex.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.encounter?.kind === 'wall');
  // Something happening up there (Phase 24.4) can come with any morning: take the first call.
  const calls = async () => {
    for (let i = 0; i < 3 && (await asking()); i++) {
      const id = await ex.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.encounter.id);
      log(`exped: up there, ${id}`);
      await ex.locator('#sheet .opt').first().click();
      await ex.waitForFunction(
        (was) => JSON.parse(localStorage.getItem('dirtbag.save')).state.encounter?.id !== was,
        id,
      );
    }
  };
  await pick('Expeditions');
  await pick('El Capitan');
  // The planner (Phase 24.2): the odds with this plan and the haul bag; book it, and leave.
  await ex.waitForFunction(() =>
    /Summit odds with this plan: \d+%/.test(document.querySelector('#sheet')?.textContent ?? ''),
  );
  const planned = await sheetText();
  log(
    `exped: ${planned.match(/Summit odds with this plan[^,]*/)?.[0]}; ${planned.match(/The haul bag: [^.]*/)?.[0]}`,
  );
  await ex.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-exped-plan.png`) });
  await pick('Book it');
  await pick('Leave now');
  await ex.waitForFunction(() =>
    /El Capitan, day 1 of 10/.test(document.querySelector('#sheet')?.textContent ?? ''),
  );
  await ex.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-exped.png`) });
  // Storms first: sit them out.
  for (let d = 0; d < 6 && /A storm on the wall today/.test(await sheetText()); d++) {
    const day = (await trip()).day;
    await pick('Make camp');
    await ex.waitForFunction(
      (was) => JSON.parse(localStorage.getItem('dirtbag.save')).state.expedition?.day === was + 1,
      day,
    );
    await calls();
  }
  // The first pitch's beta, on the wall, and back to the day's card.
  await pick('Lead pitch 1');
  await ex.waitForFunction(() =>
    /^Sickle Ledge/.test(document.querySelector('#sheet-title')?.textContent ?? ''),
  );
  await ex.waitForTimeout(500);
  await ex.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-exped-pitch.png`) });
  await ex.click('#sheet .x');
  await ex.waitForFunction(() => /El Capitan, day/.test(document.querySelector('#sheet')?.textContent ?? ''));
  const before = await trip();
  await pick('Hand it to Hazel');
  await ex.waitForFunction(() =>
    JSON.parse(localStorage.getItem('dirtbag.save')).state.today.includes('exped'),
  );
  await pick('Make camp');
  await ex.waitForFunction(
    (d) => JSON.parse(localStorage.getItem('dirtbag.save')).state.expedition?.day === d + 1,
    before.day,
  );
  const after = await trip();
  if (!after || after.partner !== 'hazel' || after.nights !== before.nights + 1 || after.pitch < before.pitch)
    await fail(`after a day on El Cap: ${JSON.stringify({ before, after })}`);
  log(`exped: day ${after.day}, pitches fixed: ${after.pitch}, nights on the portaledge: ${after.nights}`);
  // The haul bag jams (Phase 24.4): its card on the reload, each call's cost beside it; cut
  // the food loose, and back to the day's card two days lighter.
  await ex.evaluate(() => {
    const f = JSON.parse(localStorage.getItem('dirtbag.save'));
    f.state.encounter = { kind: 'wall', id: 'haulbag' };
    localStorage.setItem('dirtbag.save', JSON.stringify(f));
  });
  await ex.reload({ waitUntil: 'load' });
  await ex.waitForFunction(() => /^The Pig/.test(document.querySelector('#sheet-title')?.textContent ?? ''));
  if (!(await sheetText()).includes('−2 days of food and water'))
    await fail(`the haul bag's card doesn't say what cutting it costs: ${await sheetText()}`);
  await ex.waitForTimeout(500);
  await ex.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-exped-wall.png`) });
  const pig = await trip();
  await pick('Cut the bag loose');
  await ex.waitForFunction(() => /El Capitan, day/.test(document.querySelector('#sheet')?.textContent ?? ''));
  const cut = await trip();
  if (cut.food !== pig.food - 2) await fail(`the haul bag cut loose: ${JSON.stringify({ pig, cut })}`);
  await ctx.close();
}

console.log('A tap on the van, on a phone');
// A touch opens the van's sheet on the press; the same tap's click must not land on a row
// the sheet put under the finger (it cooked ramen, on Evan's phone). Standing by the van at
// night, four taps low on it: the sheet, and nothing spent.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = { ...saved.state, at: 'lot', x: 300, min: 18 * 60, cash: 50, breakdown: null };
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const phone = await ctx.newPage();
  phone.on('pageerror', (e) => problems.push(`phone: uncaught: ${e.message}`));
  await phone.goto(server.url, { waitUntil: 'load' });
  await phone.waitForSelector('#h-cash', { timeout: 10_000 });
  await phone.waitForTimeout(800);
  for (const [x, y] of [
    [100, 560],
    [120, 620],
    [60, 650],
    [150, 680],
  ]) {
    await phone.touchscreen.tap(x, y);
    await phone.waitForTimeout(600);
    const sheet = await phone.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
    if (!/Your van/.test(sheet)) await fail(`a tap at ${x},${y} didn't open the van: ${sheet.slice(0, 80)}`);
    await phone.evaluate(() => document.querySelector('#sheet .x')?.click());
    await phone.waitForTimeout(300);
  }
  const after = [await phone.textContent('#h-cash'), await phone.textContent('#h-time')];
  if (after[0] !== '$50' || !/6:00 PM$/.test(after[1] ?? ''))
    await fail(`the taps on the van did something: ${after.join(' ')}`);
  log('four taps on the van: its sheet each time, nothing spent');
  await ctx.close();
}

console.log('A keyboard, and larger text');
{
  const portrait = page;
  page = await playPage({ width: 390, height: 844 }, 2, 'keyboard: ');
  await page.addInitScript(() => {
    localStorage.setItem('dirtbag.settings', JSON.stringify({ motion: 'system', text: 'large' }));
    for (const t of ['pointerdown', 'mousedown', 'touchstart'])
      window.addEventListener(t, () => window.problem(`the keyboard day used a pointer (${t})`), true);
  });
  holdKey = true;
  // Tab until the keyboard is on the thing: its id, its label, then its words.
  const tabTo = async (what, re, most = 60) => {
    for (let i = 0; i < most; i++) {
      const at = await page.evaluate(() => {
        const a = document.activeElement;
        return a
          ? `${a.id}|${a.getAttribute('aria-label') ?? ''}|${a.textContent?.replace(/\s+/g, ' ').trim() ?? ''}`
          : '';
      });
      if (re.test(at)) return;
      await page.keyboard.press('Tab');
    }
    await fail(`Tab never reached ${what}`);
  };
  const key = (k) => page.keyboard.press(k);
  // Nothing runs off the screen or scrolls sideways at the larger text.
  const fits = async (where) => {
    const out = await page.evaluate(() => {
      const s = document.getElementById('scr').getBoundingClientRect();
      const bad = [];
      for (const el of document.querySelectorAll('#scr .ui *')) {
        if (el.classList.contains('hot')) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const name = el.id || String(el.className) || el.tagName;
        if (r.left < s.left - 1 || r.right > s.right + 1) bad.push(`${name} off the screen`);
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible')
          bad.push(`${name} scrolls sideways`);
      }
      return [...new Set(bad)];
    });
    if (out.length) await fail(`at the larger text, ${where}: ${out.slice(0, 6).join(', ')}`);
    log(`fits at the larger text: ${where}`);
  };

  await page.goto(server.url, { waitUntil: 'load' });
  await until('the climber screen', () => page.locator('#create').count());
  await fits('the climber screen');
  await tabTo('the name', /^c-name\|/);
  await page.keyboard.type('Robin');
  await tabTo('The Technician', /^c-technician\|/);
  await key(' ');
  await tabTo('Start', /^c-go\|/);
  await key('Enter');
  await until('the climber screen to go', async () => !(await page.locator('#create').count()));
  await wait(400);
  await fits('the Lot');
  await shot('keyboard-lot');

  // Hazel's off the right of a portrait screen: walk that way with the arrow key until she's
  // on it, then her button; her bubble takes the keyboard.
  await page.keyboard.down('ArrowRight');
  await wait(1600);
  await page.keyboard.up('ArrowRight');
  await wait(1200);
  await tabTo('Hazel', /\|Hazel\|/);
  await key('Enter');
  await expectText('#bubble', /staring at The Pump/, 'Hazel, by keyboard');
  await fits('Hazel’s bubble');
  await key('Enter');
  await expectText('#bubble', /Hook your left heel/, 'Hazel on the roof');
  await key('Enter');
  await expectText('#toast', /New beta: heel-hook the lip/, 'toast');

  // The journal, and Escape to put it down.
  await tabTo('your body', /\|[^|]*Your journal\./);
  await key('Enter');
  await expectText('#sheet-title', /^Robin/, 'the journal, by keyboard');
  await fits('the journal');
  await shot('keyboard-journal');
  await key('Escape');
  await until('the journal to close', async () => !(await page.locator('#sheet').count()));

  // The map by M, a pin by Tab, and the drive.
  await key('m');
  await until('the map', async () => (await text('#b-nav')) === 'Close');
  await wait(450);
  await tabTo('Roadside Crag’s pin', /^pin-road\|/);
  await key('Enter');
  await expectText('#sheet', /Roadside Crag/, 'the card, by keyboard');
  await fits('a place card');
  await tabTo('the drive', /\|Drive here/);
  await key('Enter');
  await until('the crag', async () => (await text('#hint'))?.includes('Boulders on the talus'));
  await wait(400);

  // The Warm Boulder: its sheet, Escape, Enter at the wall for it again, and a go on the
  // space bar.
  await tabTo('the Warm Boulder', /\|Warm Boulder, V2/);
  await key('Enter');
  await expectText('#sheet', /Warm Boulder · V2/, 'the beta sheet, by keyboard');
  await fits('a beta sheet');
  await key('Escape');
  await until('the sheet to close', async () => !(await page.locator('#sheet').count()));
  await key('Enter');
  await expectText('#sheet', /Warm Boulder · V2/, 'the beta sheet again, from the wall');
  await tabTo('Pull on', /\|Pull on/);
  await key('Enter');
  await until('the climb panel', () => page.locator('#climb').count());
  await fits('the climb panel');
  await shot('keyboard-climb');
  await climb();
  await until('the go to end', () => page.locator('#sheet').count(), 15_000);
  await tabTo('the way down', /\|(Walk down the back|Walk off)$/);
  await key('Enter');
  await until('the crag again', async () => (await text('#b-nav')) === 'Map');
  await wait(600);

  // Home, and bed at dark.
  await key('m');
  await until('the map', async () => (await text('#b-nav')) === 'Close');
  await wait(450);
  await tabTo('the Lot’s pin', /^pin-lot\|/);
  await key('Enter');
  await tabTo('the drive home', /\|Drive here/);
  await key('Enter');
  await until('the Lot', async () => (await text('#hint')) !== null || (await text('#b-nav')) === 'Map');
  await wait(1200);
  await tabTo('your van', /\|Your van\|/);
  await key('Enter');
  await expectText('#sheet', /Your van/, 'the van, by keyboard');
  await tabTo('lying around', /\|Lie around till dark/);
  await key('Enter');
  await tabTo('bed', /\|Sleep/);
  await key('Enter');
  await expectText('#h-time', /^Day 2 · /, 'morning, by keyboard');
  holdKey = false;
  await page.close();
  page = portrait;
}

console.log('A landscape window');
// A Steam Deck's shape, 1280 x 800: the screen is 740 tall and 1184 across.
{
  const portrait = page;
  page = await playPage({ width: 1280, height: 800 }, 1, 'landscape: ');
  const screen = () =>
    page.evaluate(() => {
      const s = document.getElementById('scr');
      return {
        w: parseFloat(getComputedStyle(s).getPropertyValue('--w')),
        wide: s.classList.contains('wide'),
      };
    });
  // Where something is, in the screen's logical pixels.
  const where = (sel) =>
    page.evaluate((q) => {
      const r = document.querySelector(q)?.getBoundingClientRect();
      const c = document.getElementById('cv').getBoundingClientRect();
      const k = c.height / 740;
      return r && { x0: (r.left - c.left) / k, x1: (r.right - c.left) / k, y0: (r.top - c.top) / k };
    }, sel);

  await page.goto(server.url, { waitUntil: 'load' });
  await until('the climber screen', () => page.locator('#create').count());
  const sc = await screen();
  if (sc.w !== 1184 || !sc.wide) await fail(`the landscape screen: ${JSON.stringify(sc)}`);
  log(`screen: ${sc.w} across, sheets docked`);
  await page.fill('#c-name', 'Robin');
  await click('#c-technician');
  await click('#c-go', 'Start');
  await until('the climber screen to go', async () => !(await page.locator('#create').count()));
  await wait(400);
  await shot('landscape-lot');

  // The Lot is 960 wide and the screen sees 911 of it: Hazel at 586 is on screen from the
  // start, and a tap on her walks you over and talks.
  await tapAt(586 * Z, screenY(530));
  await expectText('#bubble', /staring at The Pump/, 'Hazel, in landscape');
  const bubble = await where('#bubble');
  if (!bubble || bubble.x0 < 586 * Z - 300 || bubble.x1 > 586 * Z + 300)
    await fail(`Hazel's bubble isn't over her: ${JSON.stringify(bubble)}`);
  await click('#bubble button', 'Ask about the roof');
  await click('#bubble button', 'Got it');

  // The journal has a button of its own on a wide HUD.
  await click('#h-journal', 'Journal');
  await expectText('#log', /heel-hook the lip/, 'the journal, from its button');
  await click('#sheet .x');

  // The map's valley sits in the middle; a sheet docks at the right, clear of it. On the
  // way, Settings and the credits: sound made in code, from the licence ledger.
  await openMap();
  await click('#b-settings', 'Settings');
  await click('#b-credits', 'Credits');
  await expectText('#credits-sound', /Made in code/, 'the credits');
  await click('#sheet .x');
  const left = (1184 - 360) / 2;
  const [rx, ry] = fit([292, 220]);
  await tapAt(left + rx, ry);
  await expectText('#sheet', /Roadside Crag/, 'place card, in landscape');
  const card = await where('#sheet');
  if (!card || card.x0 < left + 360 || Math.abs(card.x1 - 1176) > 2 || card.y0 < 60)
    await fail(`the card isn't docked clear of the valley: ${JSON.stringify(card)}`);
  await header('the card’s header, in landscape');
  await shot('landscape-map');
  await click('#sheet .opt', 'Drive here');
  await until('the crag, in landscape', async () => (await text('#hint'))?.includes('Boulders on the talus'));
  await wait(400);
  await shot('landscape-crag');

  // The camera stays at the crag's left end: the Warm Boulder's at 340.
  await tapAt(340 * Z, screenY(540));
  await expectText('#sheet', /Warm Boulder · V2/, 'beta sheet, in landscape');
  await shot('landscape-wall');
  await click('#sheet .go');
  await until('the climb panel', () => page.locator('#climb').count());
  const panelAt = await where('#climb');
  if (!panelAt || panelAt.x0 < left || panelAt.x1 > left + 360)
    await fail(`the climb panel isn't under the wall: ${JSON.stringify(panelAt)}`);
  // Turn the window to portrait and back, mid-go: the go carries on.
  await page.setViewportSize({ width: 390, height: 844 });
  await until('a portrait screen', async () => (await screen()).w === 360);
  await wait(300);
  await shot('landscape-turned');
  await page.setViewportSize({ width: 1280, height: 800 });
  await until('landscape again', async () => (await screen()).w === 1184);
  await climb();
  const after = await until(
    'the go to end',
    async () => (await text('#stamp')) || (await text('#sheet')),
    15_000,
  );
  log(`the go, turned and back: ${after.slice(0, 60)}`);
  await page.close();
  page = portrait;
}

if (problems.length) await fail(`${problems.length} problem(s) during play`);
await browser.close();
await server.close();
console.log(
  `\n✓ Played five days, day three in ${loop} taps and day four by the plan in ${byPlan}, and again offline, with no errors and nothing sent off the site.`,
);

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
