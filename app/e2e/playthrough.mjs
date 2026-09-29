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
// a flash with it, the board, then home to lie around till dark.
// Day three is counted (Phase 11): a shift, the crag, three goes, back, dinner and bed in
// 20 taps or fewer, not counting the climbing itself. Every trip is counted too: two taps
// from the map, three from a scene. Day four runs day three again as a plan, and day five
// runs one the day won't allow.
// Then a v0.956 player, in a browser of their own: the retirement notice, their career kept
// as a file, and coming across as they were.
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

// Where the map's pins are, on the game screen (view/layout.ts, MAP_PINS).
const PIN = { lot: [262, 612], diner: [96, 458], gym: [282, 414], cafe: [282, 476] };
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
await click('#sheet .x');

// ---- day two ----

console.log('Place cards');
// Before the drive, a card shows the place as you'd find it, and who'd be there. Day two is
// fair: Roadside at 8:10 AM has Hazel till five, so a belayer and a spotter till then.
await openMap();
await tapAt(292, 220);
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
await expectText('#h-cash', /^\$68$/, 'paid');
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
  saved?.v !== 4 ||
  st.seed !== SEED ||
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

console.log('Home, and lie around till dark');
// Nothing more today: one tap takes the afternoon, and bed opens once it's dark.
await driveFrom('Send City to the Lot', PIN.lot, /The Lot/);
await until('the Lot', async () => (await text('#hint')) === 'Tap anywhere to walk');
await tapAt(100, 560);
await expectText('#sheet', /Your van/, 'van');
await click('#sheet .opt', 'Lie around till dark');
await expectText('#h-time', /^Day 2 · 5:00 PM$/, 'dark');
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

console.log('What it sounded like');
log(`heard: ${[...heard].sort().join(', ')}`);
log(`ambience: ${[...beds].sort().join(', ')}`);
// The places the five days go; beds.test.ts holds the Gorge and Moonstone to theirs.
const quiet = ['cafe', 'diner', 'gym', 'lot', 'map', 'road'].filter((b) => !beds.has(b));
if (quiet.length) await fail(`no ambience at: ${quiet.join(', ')}`);
// Everything the five days do. Paying, Scout and a hold-to-load's charge and throw aren't
// in them; cues.test.ts holds those to having a sound.
const HEARD =
  'breath cleared clip crux drive earn eat fell grip land move paper pullon rest send slap sleep step talk tap';
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
  await tapAt(left + 292, 220);
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
