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
// Then the same day with a controller alone, on a Steam Deck's shape (Phase 14.1): focus
// moved by the D-pad, A to press and hold, B to put things down, Start and Select for the
// journal and the map, and a name picked for a player who can't type one.
// Then a save out as a file, the game started over, a file that isn't a save turned away,
// and the climber brought back from the first screen (Phase 14.2). And a crash on purpose:
// the error screen, the save as a file, and carrying on (Phase 15.2).
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
  await p.exposeFunction('problem', async (why) => {
    problems.push(`${who}${why}`);
    const geo = await p.evaluate(() => {
      const r = (q) => document.querySelector(q)?.getBoundingClientRect();
      return {
        toast: r('#toast'),
        sheet: r('#sheet'),
        vw: innerWidth,
        vh: innerHeight,
        large: document.querySelector('.screen')?.className,
      };
    });
    console.log('PROBLEM-GEO', JSON.stringify(geo));
    await p.screenshot({ path: join(OUT, `problem-${problems.length}.png`) });
  });
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
        // A control scrolled out of a sheet's view is clipped by it: only the part you can
        // see could take a tap.
        const r = c.getBoundingClientRect();
        const box = c.closest('.sheet')?.getBoundingClientRect();
        const b = box
          ? {
              left: Math.max(r.left, box.left),
              right: Math.min(r.right, box.right),
              top: Math.max(r.top, box.top),
              bottom: Math.min(r.bottom, box.bottom),
            }
          : r;
        if (b.right <= b.left || b.bottom <= b.top) continue;
        if (a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top) continue;
        const what = c.id ? `#${c.id}` : c.getAttribute('aria-label') || c.textContent?.trim().slice(0, 30);
        window.problem(`a toast over ${what}: ${t}`);
      }
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  // Phase 14.6: the marks the fonts lack are drawn (Glyph.tsx), never left as text a Deck
  // would show as a box. Any that turns up as text, on any screen the run passes, fails it.
  await p.addInitScript(() => {
    const raw = /[✓✕○←♠♥♦♣]/;
    const seen = new Set();
    const look = (n) => {
      const t = n.nodeType === Node.TEXT_NODE ? n.textContent : n.nodeType === Node.ELEMENT_NODE ? null : '';
      if (t === null) {
        const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) look(w.currentNode);
      } else if (raw.test(t) && !seen.has(t)) {
        seen.add(t);
        window.problem(`a mark the fonts lack, as text: ${t.trim().slice(0, 60)}`);
      }
    };
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'characterData') look(m.target);
        for (const n of m.addedNodes) look(n);
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

// A save changed by hand, and a page loaded from it. The change goes in as the page reloads,
// before the game boots: written while the old page still ran, it could be overwritten by a
// save the old page made on its way out (a fade's last step, a card just answered). Nationals'
// final once came back as the qualifier's morning that way. Returns the save it went in with.
// `key`: the problem of the day's slot (Phase 45), in place of the career's save.
let reloads = 0;
async function reloadWith(p, change, key = 'dirtbag.save') {
  const file = change(JSON.parse(await p.evaluate((k) => localStorage.getItem(k), key)));
  const next = JSON.stringify(file);
  const token = `e2e-reload-${++reloads}`;
  await p.addInitScript(
    ([t, raw, k]) => {
      if (sessionStorage.getItem('e2e-reload') !== t) return;
      sessionStorage.removeItem('e2e-reload');
      localStorage.setItem(k, raw);
    },
    [token, next, key],
  );
  await p.evaluate((t) => sessionStorage.setItem('e2e-reload', t), token);
  await p.reload({ waitUntil: 'load' });
  return file;
}

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
    // Whatever's being waited on, a Record Book card isn't it.
    if (!/Record Book|"Right"/.test(what)) await bookCards();
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
// Phase 23.1: an entry just gone in the Record Book comes up as a card when the sheet before
// it closes. A one-off, not part of a routine day, so taking it isn't counted against
// Phase 11's budgets; what went in is logged.
const booked = [];
async function bookCards() {
  for (let i = 0; i < 4; i++) {
    const t = await page.evaluate(() => {
      const sh = document.querySelector('#sheet');
      const title = document.querySelector('#sheet-title')?.textContent ?? '?';
      if (title === 'What are you climbing for?') return 'calling';
      return sh && /In the Record Book/.test(sh.textContent ?? '') ? title : null;
    });
    if (!t) return;
    // Phase 23.3: asked what you're climbing for, after enough sends; the Purist, first on
    // the list (and what Enter takes on the keyboard day).
    if (t === 'calling') {
      log('asked what you’re climbing for: The Purist');
      if (holdPad) await padA();
      else if (holdKey) await page.keyboard.press('Enter');
      else await page.locator('#sheet .opt', { hasText: 'The Purist' }).first().click();
      await page.waitForTimeout(150);
      continue;
    }
    booked.push(t);
    log(`record book: ${t}`);
    // On the keyboard and controller days, as their players would: the sheet focuses its
    // button.
    if (holdPad) await padA();
    else if (holdKey) await page.keyboard.press('Enter');
    else await page.locator('#sheet .opt', { hasText: 'Right' }).first().click();
    await page.waitForTimeout(150);
  }
}

async function tapAt(x, y) {
  await bookCards();
  const box = await page.locator('#cv').boundingBox();
  const k = box.height / 740;
  await page.mouse.click(box.x + x * k, box.y + y * k);
  taps++;
}

const click = async (sel, name) => {
  if (name !== 'Right') await bookCards();
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
  await bookCards();
  await page.keyboard.press(key);
  taps++;
};

const hudTime = () => text('#h-time');

// ---- the hold button ----

let down = false;
// The keyboard day holds on with the space bar instead of a finger on the button, and the
// controller day with A.
let holdKey = false;
let holdPad = false;
// The controller day's pad: one of the standard mapping's buttons, down or up. The page reads
// it once a frame, so a press stays down long enough for a few frames to see it.
const PAD = {
  a: 0,
  b: 1,
  x: 2,
  y: 3,
  lb: 4,
  rb: 5,
  rt: 7,
  select: 8,
  start: 9,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
};
const padSet = (b, on) =>
  page.evaluate(
    ([i, on]) => {
      const x = window.__pad.buttons[i];
      x.pressed = on;
      x.value = on ? 1 : 0;
    },
    [PAD[b], on],
  );
const padA = async () => {
  await padSet('a', true);
  await page.waitForTimeout(70);
  await padSet('a', false);
  await page.waitForTimeout(70);
};
async function setHold(on) {
  if (on === down) return;
  if (holdPad) {
    await padSet('a', on);
    down = on;
    return;
  }
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
  await bookCards();
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
// Where you came from (Phase 23.2): Sold It All, the one already picked, says so and starts richer.
await click('#o-quit');
await expectText('#o-quit', /Every shift pays 12% more/, 'the origin’s terms');
await expectText('#c-go', /\$191, a van/, 'the start with the origin’s cash');
await click('#c-go', 'Start');
await until('the climber screen to go', async () => !(await page.locator('#create').count()));
await expectText('#h-cash', /^\$191$/, 'cash');
await expectText('#hint', /Tap anywhere to walk/, 'hint');
// $191 is past the first goal's $60, as Sold It All's $300 was in v0.956: it's done at the start.
await expectText('#goal', /Send 3 lines anywhere/, 'the first goal, the money one already met');
await wait(400);
await shot('lot-morning');

// Phase 40: "What now?", lit on Act I's first morning. Hazel's moves, each with its reason,
// the story's first; asked, it stops asking for the day.
if (!(await page.locator('#whatnow.lit').count())) await fail('what now: not lit on the first morning');
await click('#whatnow');
await expectText('#sheet', /Next on your list: Send 3 lines anywhere/, 'what now');
const moves = await page.locator('#sheet .opt').count();
if (moves < 2 || moves > 3) await fail(`what now: ${moves} moves`);
await shot('what-now');
await click('#sheet .x');
await until('the card to close', async () => !(await page.locator('#sheet').count()));
if (await page.locator('#whatnow.lit').count()) await fail('what now: still lit once asked');

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
// What's going on at the café changes by the day (Phase 25.6), and Wren's in all of it.
await expectText('#sheet', /Wren/, 'at the café');
// Phase 41: the radio behind the bar, the valley's next five days, each a call and how sure.
await expectText('#sheet', /The radio behind the bar, on the valley’s next five days\./, 'the radio');
await expectText('#forecast', /^Tomorrow(Prime|Fair|Hot|Rain), (likely|maybe)/, 'tomorrow, called');
const called = await page.locator('#forecast li').count();
if (called !== 5) await fail(`the radio called ${called} days, not five`);
// The rush (Phase 18.2), looked at and left: the queue made in the order tapped, each
// drink in time or not, and back to the café's card without working it.
await click('#sheet .opt', 'Work the rush');
await expectText('#sheet-title', /The morning rush/, 'the rush');
const orders = await page.locator('#rush .beta').count();
for (let i = 0; i < orders; i++) await page.locator('#rush .beta').nth(i).click();
await expectText('#play-says', /% of the tips this queue had in it/, 'the rush, scored');
await shot('rush');
await click('#sheet .x');
await expectText('#sheet', /Wren/, 'back at the café');
await click('#sheet .opt', 'Pick up a double');
// The double's $56, 12% more for Sold It All.
await expectText('#h-cash', /^\$253$/, 'paid');
await expectText('#h-time', /1:48 PM$/, 'clock');

console.log('Drive to Roadside Crag');
await driveOn('the café to Roadside', 'Drive to Roadside Crag');
await wait(800);
await shot('driving');
await until('arrival', async () => (await text('#h-time')) === 'Day 1 · 2:53 PM');
await expectText('#h-cash', /^\$241$/, 'cash after gas');
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
// Phase 41: and what the prime day does for every window on it, in words from the dials.
await expectText('#friction', /^Cold and dry: every window 10% wider\.$/, 'the friction');
await shot('beta-warm');
// Phase 27.4: call the onsight first. A checkbox of its own, never a beta row.
await click('#sheet .call', 'Call the onsight');
await until('the call', async () => (await page.locator('#sheet .call[aria-checked="true"]').count()) === 1);
const goes = await sendIt('Warm Boulder');
await expectText('#sheet', go1(goes), 'result');
if (goes === 1) await expectText('#sheet', /You called the onsight, and it went\./, 'the call answered');
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
  !/^Warm Boulder, V2\. Onsight, called\. Roadside Crag, day 1, fall\.$/.test(card[2])
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
// Well under it on day one: it climbs with more cruxes for you than the topo shows.
await expectText(
  '#sheet',
  /Over your grade, it climbs with (one more crux|\d more cruxes) than the topo shows/,
  'over your grade',
);
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
await expectText('#sheet-title', /The Diner/, 'at the diner');
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
// Tonight says what bed will do, and bed does it: $198 in the morning.
await expectText('#tonight', /The spot\$18.*Morning\$198/, 'tonight');
// Phase 41: tomorrow as the radio calls it, never the day itself.
await expectText('#tonight-sky', /^Tomorrow(Prime|Fair|Hot|Rain), (likely|maybe)$/, 'tomorrow, called');
// Psyche by morning, and the fire you sat at is part of why.
await expectText('#psyche', /^Psyche(Keen|Psyched)Up for .*the fire\./, 'psyche');
await click('#sheet .opt', 'Sleep');
await expectText('#h-time', /^Day 2 · 7:10 AM$/, 'morning');
await expectText('#h-cash', /^\$198$/, 'cash');
await shot('day-2');

console.log('Reload');
await page.reload({ waitUntil: 'load' });
await expectText('#h-time', /^Day 2 · 7:10 AM$/, 'clock after reload');
await expectText('#h-cash', /^\$198$/, 'cash after reload');
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
// Phase 23.1: the Record Book, with the first day in it.
await click('#j-book');
await expectText('#book', /\d+ of \d+ in the book\..*First Send · day 1/, 'the record book');
await shot('record-book');
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
await click('#sheet .opt', 'Set to the brief');
// The setter's panel (Phase 44, on Phase 18.1's puzzle): five holds from the bucket, each put
// on its square, from the bottom up; the third a long reach from the second, a big move. The
// set's grade and checks live as they go up; the shift's pay, and the set's bonus on top.
await expectText('#sheet-title', /Set problems for a shift/, 'the setter’s brief');
const squares = [
  [1, 1],
  [2, 2],
  [4, 4],
  [4, 5],
  [3, 7],
];
for (const [i, [x, y]] of squares.entries()) {
  await page.locator('#moves .beta').nth(i).click();
  await page.locator(`#set-panel .sp-cell[aria-label^="Panel, ${x} across, ${y} up"]`).click();
  taps += 2;
}
await expectText('#set-checks', /V\d+, for V\d+/, 'the set’s grade, live');
// Phase 44.2: named as it's hung; it stays up on the panel till the reset.
await page.fill('#set-name', 'First Light');
if ((await page.locator('#set-panel .sp-lines line').count()) !== 4)
  await fail('the panel: not four moves between five holds');
if ((await page.locator('#set-panel .sp-lines line.big').count()) !== 1)
  await fail('the panel: the long reach to the third hold isn’t a big move');
await shot('setter');
const bonus = Number(/\+\$(\d+) on top/.exec((await text('#play-says')) ?? '')?.[1] ?? 0);
await click('#play-go', 'Hang it');
await expectText('#h-time', /11:22 AM$/, 'clock');
await expectText('#h-cash', new RegExp(`^\\$${231 + bonus}$`), 'paid');
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
  saved?.v !== 83 ||
  // Phase 44.2: the day's set, up on the panel under its name.
  st.setUp?.name !== 'First Light' ||
  !st.setUp.id.startsWith(`ys-${st.day}-`) ||
  // Phase 43: a new climber's van, laid out: the bed across the back, and nothing else yet.
  JSON.stringify(st.vanPlan) !== JSON.stringify({ bed: { x: 4, y: 0, r: 0 } }) ||
  // Phase 29.1: nothing scavenged, a few days in.
  st.parts !== 0 ||
  // Phase 29.3: miles on the clock past a new climber's, and nothing for Dale to say yet.
  !(st.van?.miles > 160000) ||
  st.van.verdict !== null ||
  // Phase 27.4: the onsight was called, and it went.
  st.routes.warm?.sent?.called !== true ||
  // Phase 28.1: no crew to name yet, a few days in.
  st.crewName !== null ||
  // Phase 28.2: no crew, so no project.
  st.crewProject !== null ||
  st.crewSends?.length !== 0 ||
  // Phase 28.3: no favours owed either way, a few days in.
  Object.values(st.people ?? {}).some((p) => p.owed || p.lent) ||
  // Phase 26: no warnings, so nothing to lapse.
  JSON.stringify(st.struck) !== '{}' ||
  st.romance !== null ||
  st.family !== null ||
  // You spoke to Hazel about the roof (Phase 17.3).
  st.people?.hazel?.talked !== true ||
  st.life?.retired !== null ||
  st.life.told !== 22 ||
  st.year?.home !== 'none' ||
  !Array.isArray(st.board?.jobs) ||
  st.board.pick !== null ||
  typeof st.scene?.old !== 'number' ||
  typeof st.habits?.goes !== 'number' ||
  typeof st.calling?.offered !== 'boolean' ||
  st.origin !== 'quit' ||
  st.talents?.ids?.length !== 2 ||
  !Array.isArray(st.book) ||
  st.record?.firstsend !== 1 ||
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

// Phase 23.6: the week's board, in the journal. Phase 29.2: its bounties, one taken, and
// the rest come down.
await click('#h-you');
await click('#j-board');
await expectText('#board', /This week’s, up at the café.*Take one/, 'the board');
log(`board: ${st.board.jobs.map((j) => `${j.id} ($${j.cash}, ${j.parts} parts)`).join(', ')}`);
await shot('bounties');
await click('#bounty-0');
await expectText('#board', /You took one.*since you took it/, 'a bounty taken');
await click('#sheet .x');

console.log('Offline');
// The service worker has had two days to install; with the network gone, a reload still
// starts the game where you left it, and nothing fails to load.
await until('the service worker to control the page', () =>
  page.evaluate(() => !!navigator.serviceWorker?.controller),
);
await page.context().setOffline(true);
await page.reload({ waitUntil: 'load' });
await expectText('#h-time', /^Day 2 · 1[12]:\d\d AM$/, 'clock offline');
// What the save had: the setting shift's pay, and anything the week's board paid since.
await expectText('#h-cash', new RegExp(`^\\$${st.cash}$`), 'cash offline');
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
// Phase 41: each day the radio reaches marked with its call; today's the sky itself.
await expectText(
  '#shifts',
  /^Today.*(Prime|Fair|Hot|Rain)\..*(Prime|Fair|Hot|Rain), (likely|maybe)\./,
  'the calls',
);
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
    van: { ...saved.state.van, tires: 5, engine: 80, battery: 80 },
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
// and the morning. Phase 35.4: day seven is Harvest, so nobody's close enough yet to make a
// scene of it, and the night is the knock's.
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
    people: Object.fromEntries(
      Object.entries(saved.state.people).map(([w, p]) => [w, { ...p, bond: Math.min(p.bond, 2) }]),
    ),
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

console.log('Harvest at the Lot');
// Phase 35.4. The same night, Harvest, with Hazel close enough to be there and beans in the
// pantry: bed, the potluck's scene at the fire (Hazel's line, three ways to spend it), a dish
// from the pantry, and the morning, two servings lighter.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  const hazel = saved.state.people.hazel ?? { bond: 0, last: 0, talked: true };
  saved.state = {
    ...saved.state,
    day: 7,
    min: 21 * 60,
    at: 'lot',
    x: null,
    cash: 150,
    spot: 'lot',
    encounter: null,
    pantry: { beans: 3 },
    people: { ...saved.state.people, hazel: { ...hazel, bond: Math.max(hazel.bond, 3) } },
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const fest = await ctx.newPage();
  fest.on('pageerror', (e) => problems.push(`harvest: uncaught: ${e.message}`));
  fest.on('console', (m) => m.type() === 'error' && problems.push(`harvest: console.error: ${m.text()}`));
  await fest.goto(server.url, { waitUntil: 'load' });
  const sheetOf = () => fest.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  await fest.waitForFunction(() =>
    /Tap anywhere to walk/.test(document.querySelector('#hint')?.textContent ?? ''),
  );
  await fest.mouse.click(100, 560);
  await fest.waitForFunction(() => /Your van/.test(document.querySelector('#sheet')?.textContent ?? ''));
  await fest.locator('#sheet .opt', { hasText: 'Sleep' }).first().click();
  await fest.waitForFunction(
    () => /Sendsgiving/.test(document.querySelector('#sheet')?.textContent ?? ''),
    null,
    {
      timeout: 10_000,
    },
  );
  const card = await sheetOf();
  log(`harvest: ${card.slice(0, 120)}`);
  if (
    !/Harvest/.test(card) ||
    !/Hazel/.test(card) ||
    !/Bring a dish from the pantry/.test(card) ||
    !/beans from the pantry/.test(card)
  )
    await fail(`the harvest scene: ${card.slice(0, 300)}`);
  if (await fest.$('#sheet .x')) await fail('a holiday scene can be closed without an answer');
  await fest.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-harvest.png`) });
  await fest.locator('#sheet .opt', { hasText: 'Bring a dish from the pantry' }).first().click();
  await fest.waitForFunction(
    () => /^Day 8 · /.test(document.querySelector('#h-time')?.textContent ?? ''),
    null,
    {
      timeout: 10_000,
    },
  );
  const after = await fest.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (after.encounter !== null || !((after.pantry.beans ?? 0) <= 1))
    await fail(`after harvest: ${JSON.stringify({ e: after.encounter, pantry: after.pantry })}`);
  log('harvest: a dish of beans at the potluck, and morning');
  await ctx.close();
}

console.log('A hitchhiker on the way to Roadside');
// Phase 22.6b. The day-five climber on the morning of day four, whose drive to Roadside this
// seed's deck puts a hitchhiker beside: the map, the drive, the door (heard), their card with
// no ✕, three chords, and the crag. The busker remembers what you asked for. Phase 35.1:
// everyone else on the road has come by twice already, so it's the busker's turn (the
// rotation, in the browser).
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  const others = [
    'kid',
    'oldhand',
    'nurse',
    'photog',
    'runaway',
    'grifter',
    'thief',
    'guide',
    'setter',
    'stranded',
    'ranger',
  ];
  saved.state = {
    ...saved.state,
    day: 4,
    min: 9 * 60,
    at: 'lot',
    x: null,
    cash: 150,
    energy: 80,
    guitar: 0,
    van: { ...saved.state.van, tires: 100, engine: 100, battery: 100 },
    deck: {
      last: 0,
      knock: 0,
      seen: [],
      hitch: 0,
      stop: 0,
      stops: [],
      met: {},
      epic: 0,
      meets: Object.fromEntries(others.map((id) => [id, 2])),
      back: [],
    },
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
  // Phase 35.1: and counted as come once.
  if (
    after.at !== 'road' ||
    after.guitar !== 3 ||
    after.deck.met.busker !== 2 ||
    after.deck.meets.busker !== 1 ||
    after.encounter !== null
  )
    await fail(`after the ride: at ${after.at}, guitar ${after.guitar}, ${JSON.stringify(after.deck)}`);
  log('hitchhiker: three chords, and Roadside');
  await ctx.close();
}

console.log('A roadside stop on the way to Roadside');
// Phase 22.6b. Day eight's morning drive to Roadside passes this seed's Balanced Rock: the
// tires onto gravel (heard), its card, pulling over, and the find kept. Phase 35.2: the card
// offers ways to spend it, each saying what it gives; the photo for the feed brings followers.
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
    van: { ...saved.state.van, tires: 100, engine: 100, battery: 100 },
    deck: {
      last: 0,
      knock: 0,
      seen: [],
      hitch: 0,
      stop: 0,
      stops: [],
      met: {},
      epic: 0,
      meets: {},
      back: [],
    },
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
  const card = await pull.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  if (!/Stand under it a while/.test(card) || !/followers/.test(card) || !/Keep driving/.test(card))
    await fail(`the stop's ways: ${card.slice(0, 200)}`);
  await pull.locator('#sheet .opt', { hasText: 'The photo of you holding it up' }).first().click();
  await pull.waitForFunction(
    () => !/Keep driving/.test(document.querySelector('#sheet')?.textContent ?? ''),
    null,
    { timeout: 10_000 },
  );
  // A first photo can put something in the Record Book: taken as any card is.
  for (let i = 0; i < 4; i++) {
    await pull.waitForTimeout(300);
    const t = await pull.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
    if (/In the Record Book/.test(t)) {
      log(`record book: ${await pull.evaluate(() => document.querySelector('#sheet-title')?.textContent)}`);
      await pull.locator('#sheet .opt', { hasText: 'Right' }).first().click();
    } else if (!t) break;
    else await fail(`after the photo, a sheet: ${t.slice(0, 200)}`);
  }
  const after = await pull.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (
    after.at !== 'road' ||
    !after.deck.stops.includes('balanced') ||
    after.encounter !== null ||
    after.media.followers <= saved.state.media.followers
  )
    await fail(`after the stop: at ${after.at}, ${JSON.stringify(after.deck)}, ${after.media.followers}`);
  log('stop: Balanced Rock, the photo taken, the find kept');
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
    van: { ...saved.state.van, tires: 100, engine: 100, battery: 100 },
    deck: {
      last: 0,
      knock: 0,
      seen: [],
      hitch: 0,
      stop: 0,
      stops: [],
      met: {},
      epic: 0,
      meets: {},
      back: [],
    },
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
    deck: {
      last: 0,
      knock: day,
      seen: [],
      hitch: 0,
      stop: 0,
      stops: [],
      met: {},
      epic: 0,
      meets: {},
      back: [],
    },
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
// the marker crosses the band (the busking beat), back to the fire, and liar's dice (Phase
// 36.1, Perudo): your bid a count up from the one offered, the round played out to a call,
// the cups up, another round, and up from the table. Both are heard, and Hazel's bond moves
// once for the two.
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
  const table = () => fire.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  const sat = (await table()).min;
  await pick('Liar’s dice');
  await fire.waitForSelector('#perudo #p-bid');
  await fire.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-liars-dice.png`) });
  await fire.click('#p-more');
  const opened = (await fire.locator('#p-bid span').first().textContent()).trim();
  await fire.click('#p-bid');
  // Then call any bid past a third of the dice, and raise as offered otherwise.
  for (let i = 0; i < 40; i++) {
    await fire.waitForSelector('#p-bid, #p-next, #p-again');
    if (await fire.$('#p-next, #p-again')) break;
    const tb = (await table()).table;
    const dice = tb.seats.reduce((k, p) => k + p.dice.length, 0);
    await fire.click(tb.bid && tb.bid.n > dice / 3 ? '#p-call' : '#p-bid');
  }
  const up = await fire.evaluate(() => ({
    text: document.querySelector('#perudo')?.textContent ?? '',
    shown: document.querySelectorAll('#perudo .p-seat .die').length,
  }));
  if (!/The cups come up/.test(up.text) || !up.shown) await fail(`fire: the cups never came up: ${up.text}`);
  await fire.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-liars-dice-called.png`) });
  const said = (await table()).table.said.length;
  await fire.click('#p-next');
  await fire.waitForSelector('#p-bid, #p-next');
  await fire.click('#p-up');
  await fire.waitForFunction(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.table === null);
  const after = await table();
  const heard = await fire.evaluate(() => window.cues);
  if (
    !after.today.includes('shoes') ||
    !after.today.includes('dice') ||
    after.people.hazel.bond !== 13 ||
    after.people.hazel.last !== 20 ||
    !(after.min > sat) ||
    !heard.includes('clang') ||
    !heard.includes('dice')
  )
    await fail(
      `after the fire: ${JSON.stringify({ today: after.today, hazel: after.people.hazel, min: [sat, after.min], heard })}`,
    );
  log(`fire: ${shoes} Dice: opened “${opened}”, ${said} bids to the call, two rounds by ${after.min} min.`);
  await ctx.close();
}

console.log('Cooking at the van');
// Phase 29.4 (Phase 29's criterion 3). Seven at the Lot with a camp kitchen and pasta and
// greens in the pantry: the recipe goes to the stove, five stirs on the beat, and it's a good
// meal: the pantry down a serving each, and tonight's sleep and psyche the better for it.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 20,
    min: 19 * 60,
    at: 'lot',
    x: null,
    energy: 60,
    today: [],
    gear: { ...saved.state.gear, kitchen: 1 },
    pantry: { pasta: 2, greens: 2 },
    encounter: null,
    table: null,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
    window.cues = [];
    window.addEventListener('dirtbag:sound', (e) => window.cues.push(e.detail));
  }, JSON.stringify(saved));
  const van = await ctx.newPage();
  van.on('pageerror', (e) => problems.push(`stove: uncaught: ${e.message}`));
  van.on('console', (m) => m.type() === 'error' && problems.push(`stove: console.error: ${m.text()}`));
  await van.goto(server.url, { waitUntil: 'load' });
  await van.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await van.waitForTimeout(600);
  await van.mouse.click(100, 560);
  await van.waitForFunction(() =>
    /Cook pasta and greens/.test(document.querySelector('#sheet')?.textContent ?? ''),
  );
  await van.locator('#sheet .opt', { hasText: 'Cook pasta and greens' }).first().click();
  await van.waitForSelector('#busk');
  await van.waitForFunction(() =>
    /At the stove: Pasta and greens/.test(document.querySelector('#busk')?.textContent ?? ''),
  );
  if (!(await van.$('#b-skip'))) await fail('stove: no way to just eat it');
  for (let k = 0; k < 5; k++) {
    const ok = await van.evaluate(
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
    if (!ok) await fail('stove: the stir never crossed the band');
    await van.waitForTimeout(120);
  }
  await van.waitForFunction(() =>
    /Done right for once/.test(document.querySelector('#b-status')?.textContent ?? ''),
  );
  const cooked = await van.evaluate(() => document.querySelector('#b-status').textContent);
  await van.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-stove.png`) });
  await van.click('#b-done');
  await van.waitForFunction(() => /Your van/.test(document.querySelector('#sheet')?.textContent ?? ''));
  const after = await van.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  const heard = await van.evaluate(() => window.cues);
  if (
    !after.today.includes('meal-good') ||
    !after.meals.includes('pasta') ||
    after.pantry.pasta !== 1 ||
    after.pantry.greens !== 1 ||
    !heard.includes('tap') ||
    !heard.includes('eat')
  )
    await fail(`after the stove: ${JSON.stringify({ today: after.today, pantry: after.pantry, heard })}`);
  log(`stove: ${cooked}`);
  await ctx.close();
}

console.log('The Hollow: the walk in, and a crack cleaned for gear');
// Phase 32.5. The day-five climber at the Gorge on a fine morning, holding all three clues to
// the Hollow: the van's row, the walk up the wash the way the clues point (the old hand's
// fork, Ray's patience, the margin's headstones), standing in the Hollow and in the Record
// Book, then along the canyon floor to the split, whose sheet offers gear or bolts. Cleaned
// for gear, it's a line, and the old guard approves.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 30,
    min: 9 * 60,
    at: 'gorge',
    x: null,
    energy: 90,
    fed: 80,
    cash: 300,
    injury: null,
    encounter: null,
    table: null,
    hollow: { clues: ['old', 'hitch', 'book'], tries: 0 },
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const hol = await ctx.newPage();
  hol.on('pageerror', (e) => problems.push(`hollow: uncaught: ${e.message}`));
  hol.on('console', (m) => m.type() === 'error' && problems.push(`hollow: console.error: ${m.text()}`));
  await hol.goto(server.url, { waitUntil: 'load' });
  const sheetOf = () => hol.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  await hol.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await hol.waitForTimeout(600);
  // The van, on the left of the Gorge as of every crag.
  await hol.mouse.click(100, 560);
  await hol.waitForFunction(() =>
    /Look for the canyon/.test(document.querySelector('#sheet')?.textContent ?? ''),
  );
  await hol.locator('#sheet .opt', { hasText: 'Look for the canyon' }).first().click();
  for (const call of ['Take the left', 'Wait for your eyes', 'Look for the headstones']) {
    await hol.waitForFunction((c) => (document.querySelector('#sheet')?.textContent ?? '').includes(c), call);
    await hol.locator('#sheet .opt', { hasText: call }).first().click();
  }
  await hol.waitForFunction(
    () => !/Look for the headstones/.test(document.querySelector('#sheet')?.textContent ?? ''),
    null,
    { timeout: 10_000 },
  );
  // Off the Map, in the Record Book, comes up as the Hollow does: taken as any card is.
  for (let i = 0; i < 8; i++) {
    await hol.waitForTimeout(300);
    const t = await sheetOf();
    if (/In the Record Book/.test(t)) {
      log(`record book: ${await hol.evaluate(() => document.querySelector('#sheet-title')?.textContent)}`);
      await hol.locator('#sheet .opt', { hasText: 'Right' }).first().click();
    } else if (!t) break;
  }
  const there = await hol.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (
    there.at !== 'hollow' ||
    !there.unlocked.includes('hollow') ||
    there.record.hollow !== 30 ||
    !there.log.some((l) => /You’re standing in the Hollow/.test(l.text))
  )
    await fail(`after the walk in: at ${there.at}, ${JSON.stringify(there.hollow)}, ${there.record.hollow}`);
  await hol
    .waitForFunction(() => /yours to name/.test(document.querySelector('#hint')?.textContent ?? ''), null, {
      timeout: 10_000,
    })
    .catch(async () =>
      fail(
        `the Hollow's hint never showed: hint ${await hol.evaluate(() => document.querySelector('#hint')?.textContent ?? '–')}, sheet ${(await sheetOf()).slice(0, 160)}`,
      ),
    );
  await hol.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-hollow.png`) });
  // Along the floor to the split, 460 px on at 118 a second, and Enter for what's nearest.
  await hol.keyboard.down('ArrowRight');
  await hol.waitForTimeout(3900);
  await hol.keyboard.up('ArrowRight');
  await hol.waitForTimeout(300);
  await hol.keyboard.press('Enter');
  await hol.waitForFunction(
    () => /^The split/.test(document.querySelector('#sheet-title')?.textContent ?? ''),
    null,
    {
      timeout: 10_000,
    },
  );
  if (!(await hol.$('#gear-it')) || !(await hol.$('#bolt-it')))
    await fail(`the split's sheet: no choice of gear or bolts: ${(await sheetOf()).slice(0, 160)}`);
  await hol.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-hollow-crack.png`) });
  await hol.click('#gear-it');
  await hol.waitForFunction(() =>
    JSON.parse(localStorage.getItem('dirtbag.save')).state.bolted.includes('hsplit'),
  );
  const after = await hol.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (after.boltedCracks.length || after.scene.old <= there.scene.old || after.scene.gym !== there.scene.gym)
    await fail(
      `after cleaning the split: ${JSON.stringify({ cracks: after.boltedCracks, scene: after.scene })}`,
    );
  log('hollow: walked in the way the clues point, found it, and cleaned the split for gear');
  await ctx.close();
}

console.log('Nationals: a qualifier and a final');
// Phase 33.4 (Phase 33's criterion 2). Nationals morning at the Training Center (its second
// edition, day 36), for a climber well over its grades with the points to enter: signed up at
// the desk, the qualifier's eight problems climbed, the card handed in and through; the next
// evening, the final's four climbed and its card handed in, placed in the comp, and the team
// picked.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  const strong = 760;
  saved.state = {
    ...saved.state,
    day: 36,
    min: 9 * 60,
    at: 'center',
    x: null,
    energy: 100,
    skin: 100,
    fed: 100,
    cash: 500,
    // Warm, and well within their load: a dozen goes on comp day can't tweak anything, so the
    // rounds are all that's being played.
    today: ['warm'],
    load: { acute: 10, chronic: 200, today: 0 },
    injury: null,
    climber: {
      ...saved.state.climber,
      skills: { power: strong, fingers: strong, endurance: strong, technique: strong, head: strong },
    },
    comps: { ...saved.state.comps, on: null, points: [{ day: 35, pts: 300 }] },
    encounter: null,
    table: null,
  };
  const main = page;
  page = await playPage({ width: 390, height: 844 }, 2, 'nationals: ');
  await page.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  // A thing on the wall or at the desk, by its label: walked to till it's on screen, past
  // any Record Book card a send turned up (a strong climber's first sends at a grade).
  const open = async (label, key = 'ArrowRight') => {
    const hot = page.locator(`button.hot[aria-label^="${label}"]`);
    const other = key === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight';
    walk: for (const [k, most] of [
      [key, 30],
      [other, 60],
    ])
      for (let i = 0; i < most; i++) {
        await bookCards();
        if (await hot.count()) break walk;
        await page.keyboard.down(k);
        await wait(200);
        await page.keyboard.up(k);
        await wait(150);
      }
    if (!(await hot.count())) await fail(`nationals: never found ${label}`);
    await hot.first().evaluate((el) => el.click());
    taps++;
  };
  const climbAll = async (prefix, n) => {
    for (let i = 1; i <= n; i++) {
      await open(`Nationals ${prefix}${i},`);
      await expectText('#sheet', new RegExp(`Nationals ${prefix}${i} · V`), `Nationals ${prefix}${i}`);
      await sendIt(`Nationals ${prefix}${i}`);
      await click('#sheet .opt', 'Drop onto the mats');
      await until('the wall again', async () => (await text('#b-nav')) === 'Map');
      await wait(500);
    }
  };
  await page.goto(server.url, { waitUntil: 'load' });
  await until('the Training Center', async () => (await text('#b-nav')) === 'Map');
  await wait(600);
  await open('The desk', 'ArrowLeft');
  await expectText('#sheet', /Enter Nationals.*5 minutes on each.*The favourites:/, 'the entry row');
  await shot('nationals-desk');
  await click('#sheet .opt', 'Enter Nationals');
  await until('signed up', async () => (await state()).comps.on?.round === 0);
  await click('#sheet .x');
  await wait(300);
  await climbAll('', 8);
  await open('The desk', 'ArrowLeft');
  await click('#sheet .opt', 'Hand in your qualifier scorecard');
  const through = await until('through to the final', async () => {
    const st = await state();
    return st.comps.on?.round === 1 ? st : null;
  });
  if (through.comps.on.day !== 37 || !through.log.some((l) => /Through to the final tomorrow/.test(l.text)))
    await fail(`nationals: after the qualifier: ${JSON.stringify(through.comps.on)}`);
  log(`nationals: ${through.log.at(-1).text}`);
  // The next evening, at the comp's wall, no pass bought.
  const evening = {
    ...through,
    day: 37,
    min: 17 * 60,
    today: ['warm'],
    load: { acute: 10, chronic: 200, today: 0 },
    energy: 100,
    skin: 100,
    fed: 100,
    x: null,
  };
  await reloadWith(page, (f) => ({ ...f, state: evening }));
  await until('the final', async () => (await text('#b-nav')) === 'Map');
  await wait(600);
  await climbAll('F', 4);
  await open('The desk', 'ArrowLeft');
  await expectText('#sheet', /Hand in your final scorecard/, 'the final’s card');
  await click('#sheet .opt', 'Hand in your final scorecard');
  const done = await until('the result', async () => {
    const st = await state();
    return st.comps.on === null ? st : null;
  });
  const result = done.comps.results.at(-1);
  if (result?.tier !== 2 || result.day !== 37 || result.of !== 16 || result.place > 6)
    await fail(`nationals: the result: ${JSON.stringify(result)}`);
  const said = done.log.slice(-4).map((l) => l.text);
  if (!said.some((t) => /^Nationals final: /.test(t)))
    await fail(`nationals: the final's line: ${said.join(' | ')}`);
  if (result.place <= 3 && !said.some((t) => /on the national team/.test(t)))
    await fail(`nationals: a podium and no team: ${said.join(' | ')}`);
  log(`nationals: place ${result.place} of ${result.of}: ${said.join(' | ')}`);
  await shot('nationals-final');
  await page.close();
  page = main;
}

console.log('Cards at the fire');
// Phase 22.9b. Half nine at the Lot with $100: blackjack, a hand stood on and up again; then
// hold'em with Hazel, a hand checked and called to the end, and up again. The money in front
// of you comes back to your pocket, both games are played once tonight, and Hazel's had a
// hand played on her. Phase 36.2: blackjack drawn, the $10 bet picked, two hands stood on,
// each a hand's minutes, and the played hand left face up on the table. Phase 36.3: hold'em
// with everyone at the fire, a hand checked and called to its end, the board drawn.
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
    /In front of you: \$40/.test(document.querySelector('#bj')?.textContent ?? ''),
  );
  const clock = async () =>
    await cards.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.min);
  const sat = await clock();
  await cards.click('#bj-bet-10');
  for (let hand = 1; hand <= 2; hand++) {
    await cards.click('#bj-deal');
    // This hand on the go, or already paid (a blackjack either side).
    await cards.waitForFunction((h) => {
      const c = JSON.parse(localStorage.getItem('dirtbag.save')).state.cards;
      return c?.bj && ((!c.bj.paid && c.hands === h - 1) || c.hands === h);
    }, hand);
    if (hand === 1 && !(await seated()).bj.paid)
      await cards.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-blackjack.png`) });
    for (let g = 0; g < 4 && !(await seated()).bj.paid; g++) {
      await cards.click('#bj-stand');
      await cards.waitForTimeout(150);
    }
    await cards.waitForFunction(
      (h) => JSON.parse(localStorage.getItem('dirtbag.save')).state.cards?.hands === h,
      hand,
    );
  }
  const table = await seated();
  const drawn = await cards.evaluate(() => document.querySelectorAll('#bj .pc:not(.down)').length);
  if (table.bj.you[0].bet !== 10 || !table.bj.paid || !(drawn >= 4) || !((await clock()) > sat))
    await fail(`blackjack: ${JSON.stringify({ table, drawn, sat, now: await clock() })}`);
  await cards.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-blackjack-played.png`) });
  await cards.click('#bj-up');
  await cards.waitForFunction(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.cards === null);
  // Phase 36.3: hold'em with everyone at the fire, drawn: a hand checked and called to its end.
  await pick('Hold’em');
  await cards.waitForSelector('#he #he-deal');
  await cards.click('#he-deal');
  await cards.waitForFunction(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.cards?.he);
  await cards.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-holdem.png`) });
  for (let g = 0; g < 30 && !(await seated()).he.won; g++) {
    const was = JSON.stringify(await seated());
    await cards.click('#he-call');
    await cards.waitForFunction(
      (w) => JSON.stringify(JSON.parse(localStorage.getItem('dirtbag.save')).state.cards) !== w,
      was,
    );
  }
  const hand = (await seated()).he;
  const board = await cards.evaluate(() => document.querySelectorAll('#he .he-board .pc').length);
  if (!hand.won || !(board >= 3 || !hand.won.shown))
    await fail(`hold’em: ${JSON.stringify({ won: hand.won, board, said: hand.said })}`);
  await cards.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-holdem-over.png`) });
  await cards.click('#he-up');
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
  log(`cards: up from the fire with $${after.cash}, two hands of blackjack and one of hold’em`);
  await ctx.close();
}

console.log('The glovebox deck');
// Phase 36.4 (Phase 36's criterion 3). A morning at the Lot: the van, the glovebox deck, and a
// turn at each of the fire's games for matchsticks (a bid at liar's dice, a blackjack hand
// stood on, a hold'em hand called down), then the deck put away. The career's save and its
// clock never move. Phase 36.5 (Phase 36's criterion 1): then each game by its full rules,
// where the clock's no object: liar's dice to the last cup, blackjack till a hand's doubled
// and a pair's split, hold'em with a raise and then a fold.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 22,
    min: 10 * 60,
    at: 'lot',
    x: null,
    energy: 60,
    cash: 100,
    today: [],
    encounter: null,
    table: null,
    cards: null,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const glove = await ctx.newPage();
  glove.on('pageerror', (e) => problems.push(`glovebox: uncaught: ${e.message}`));
  glove.on('console', (m) => m.type() === 'error' && problems.push(`glovebox: console.error: ${m.text()}`));
  await glove.goto(server.url, { waitUntil: 'load' });
  await glove.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await glove.waitForTimeout(600);
  const before = await glove.evaluate(() => localStorage.getItem('dirtbag.save'));
  const text = (q) => glove.evaluate((sel) => document.querySelector(sel)?.textContent ?? '', q);
  await glove
    .locator('button.hot[aria-label="Your van"]')
    .first()
    .evaluate((el) => el.click());
  await glove.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === 'Your van');
  await glove.locator('#sheet .opt', { hasText: 'The glovebox deck' }).first().click();
  await glove.waitForSelector('#glovebox');
  await glove.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-glovebox.png`) });
  // Liar's dice: a bid when it comes round (someone may have called before it did), and up.
  await glove.click('#g-dice');
  await glove.waitForSelector('#perudo #p-bid, #perudo #p-next');
  if (await glove.$('#p-bid')) await glove.click('#p-bid');
  await glove.waitForTimeout(150);
  const dice = await text('#perudo');
  await glove.click('#p-up');
  await glove.waitForSelector('#glovebox');
  // Blackjack: a hand at the least bet, stood on.
  await glove.click('#g-bj');
  await glove.waitForSelector('#bj #bj-deal');
  await glove.click('#bj-deal');
  for (let g = 0; g < 4 && (await glove.$('#bj-stand')); g++) {
    await glove.click('#bj-stand');
    await glove.waitForTimeout(150);
  }
  await glove.waitForSelector('#bj-up');
  const bj = await text('#bj');
  await glove.click('#bj-up');
  await glove.waitForSelector('#glovebox');
  // Hold'em: a hand checked and called to its end.
  await glove.click('#g-holdem');
  await glove.waitForSelector('#he #he-deal');
  await glove.click('#he-deal');
  for (let g = 0; g < 30 && (await glove.$('#he-call')); g++) {
    await glove.click('#he-call');
    await glove.waitForTimeout(150);
  }
  await glove.waitForSelector('#he-up');
  const he = await text('#he');
  await glove.click('#he-up');
  await glove.waitForSelector('#glovebox');
  const box = await text('#g-box-left');
  const tap = async (q) => {
    await glove.click(q);
    await glove.waitForTimeout(120);
  };
  // Short at a card table: up, a new box if the box is short too, and back down.
  const restock = async (up, sit) => {
    await tap(up);
    await glove.waitForSelector('#glovebox');
    if (await glove.$('#g-box')) await tap('#g-box');
    await tap(sit);
  };
  // Liar's dice: open, then call whatever comes round, to the last cup.
  await tap('#g-dice');
  let rounds = 0;
  for (let i = 0; i < 200; i++) {
    await glove.waitForSelector('#p-bid, #p-next, #p-again');
    if (await glove.$('#p-again')) break;
    if (await glove.$('#p-next')) {
      rounds++;
      await tap('#p-next');
    } else await tap((await glove.$('#p-call:not([disabled])')) ? '#p-call' : '#p-bid');
  }
  const last = await text('#perudo');
  if (!(await glove.$('#p-again')) || !/last cup standing/i.test(last))
    await fail(`glovebox: liar's dice never came to its last cup: ${last.slice(0, 240)}`);
  await tap('#p-up');
  await glove.waitForSelector('#glovebox');
  // Blackjack: the first pair dealt split, and the first two cards that can be doubled.
  await tap('#g-bj');
  let split = false;
  let doubled = '';
  for (let k = 0; k < 150 && !(split && doubled); k++) {
    await glove.waitForSelector('#bj-deal');
    if (await glove.$('#bj-deal[disabled]')) {
      await restock('#bj-up', '#g-bj');
      continue;
    }
    await tap('#bj-deal');
    for (let g = 0; g < 8 && (await glove.$('#bj-stand')); g++) {
      if (!split && (await glove.$('#bj-split:not([disabled])'))) {
        await tap('#bj-split');
        split = /Hand 2/.test(await text('#bj'));
      } else if (!doubled && (await glove.$('#bj-double:not([disabled])'))) {
        await tap('#bj-double');
        doubled = await text('#bj');
      } else await tap('#bj-stand');
    }
  }
  if (!split || !/10 matchsticks|push/.test(doubled))
    await fail(`glovebox: blackjack in full: ${JSON.stringify({ split, doubled: doubled.slice(0, 240) })}`);
  await tap('#bj-up');
  await glove.waitForSelector('#glovebox');
  // Hold'em: a raise at the first chance, called down; in a later hand, a fold to a bet.
  await tap('#g-holdem');
  let raised = -1;
  let folded = '';
  for (let k = 0; k < 40 && !folded; k++) {
    await glove.waitForSelector('#he-deal');
    if (await glove.$('#he-deal[disabled]')) {
      await restock('#he-up', '#g-holdem');
      continue;
    }
    await tap('#he-deal');
    for (let g = 0; g < 40 && (await glove.$('#he-call')); g++) {
      if (raised < 0 && (await glove.$('#he-bet:not([disabled])'))) {
        await tap('#he-bet');
        raised = k;
      } else if (raised >= 0 && raised < k && (await glove.$('#he-fold'))) {
        await tap('#he-fold');
        folded = await text('#he');
      } else await tap('#he-call');
    }
  }
  if (raised < 0 || !/folded/.test(folded))
    await fail(`glovebox: hold'em in full: ${JSON.stringify({ raised, folded: folded.slice(0, 240) })}`);
  await glove.click('#sheet .x');
  await glove.waitForFunction(() => !document.querySelector('#sheet'));
  const after = await glove.evaluate(() => localStorage.getItem('dirtbag.save'));
  // No minutes and no dollars at the glovebox's tables, and nothing of it in the save.
  const priced = [dice, bj, he].filter((t) => /\$|\bmin\b/.test(t));
  if (
    after !== before ||
    priced.length ||
    !/matchsticks/.test(bj + he) ||
    !/matchsticks? in the box/.test(box)
  )
    await fail(`glovebox: ${JSON.stringify({ same: after === before, priced, box, bj: bj.slice(0, 160) })}`);
  log(`glovebox: liar's dice, blackjack and hold'em for matchsticks; ${box.toLowerCase()}`);
  log(
    `glovebox, in full: liar's dice played to the last cup (${rounds + 1} rounds at the table); blackjack doubled and split; hold'em raised and folded. The save untouched.`,
  );
  await ctx.close();
}

console.log('A session at Roadside');
// Phase 37 (Phase 37's criterion 1). Day 39 on this seed is a busy morning at Roadside, with
// Dex and Sage there: the session on the Warm Boulder, joined from its beta. The first go comes
// off at its crux, which turns up its move for you; telling them pays what the card says, in
// the save. Then goes till it's decided: the day's first send pays what the card said, if it's
// yours, and nothing if someone beat you to it.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  const routes = { ...saved.state.routes };
  delete routes.warm;
  saved.state = {
    ...saved.state,
    day: 39,
    min: 10 * 60,
    at: 'road',
    x: null,
    energy: 100,
    skin: 100,
    fed: 100,
    today: ['crag', 'warm'],
    load: { acute: 10, chronic: 200, today: 0 },
    injury: null,
    routes,
    people: {
      ...saved.state.people,
      sage: { since: 1, ...saved.state.people.sage, bond: 4, last: 0 },
      dex: { bond: 2, last: 0, since: 1 },
    },
    encounter: null,
    table: null,
    cards: null,
    sesh: null,
  };
  const main = page;
  page = await playPage({ width: 390, height: 844 }, 2, 'session: ');
  await page.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  const warm = () =>
    page
      .locator('button.hot[aria-label^="Warm Boulder"]')
      .first()
      .evaluate((el) => el.click());
  // Back to the session's card after a go: from its fall, past any call the crag puts to you
  // between goes (a stance, answered its first way, as a player would) and the card it leaves,
  // then by the wall, whose beta has the way back.
  const toSession = async () => {
    for (let i = 0; i < 8; i++) {
      const title = (await text('#sheet-title')) ?? '';
      if (/^The session/.test(title)) return;
      if (await page.locator('#sheet .opt', { hasText: 'Back to the session' }).count())
        await click('#sheet .opt', 'Back to the session');
      else if (await page.locator('#sesh-back').count()) await click('#sesh-back');
      else if ((await state()).encounter && (await page.locator('#sheet').count())) {
        log(`session: a call between goes: ${title}`);
        await page.locator('#sheet .opt').first().click();
      } else if (await page.locator('#sheet').count())
        await page.locator('#sheet .x, #sheet .opt').first().click();
      else await tapAt(180, 300);
      await wait(400);
    }
    await fail(`session: never back at the session: ${(await text('#sheet'))?.slice(0, 200)}`);
  };
  await page.goto(server.url, { waitUntil: 'load' });
  await until('Roadside', async () => (await text('#b-nav')) === 'Map');
  await wait(600);
  await warm();
  await expectText('#sheet', /Join the session/, 'the session on the beta');
  await click('#sesh-join');
  await expectText('#sheet', /The session: Warm Boulder/, 'the session');
  await shot('session');
  const joined = await state();
  const cast = joined.sesh.seats.filter((p) => !p.who.startsWith('local-')).map((p) => p.who);
  // Off at the crux on the first go: the move turns up, and the card asks.
  await click('#sheet .opt', 'Your go');
  await until('the climb panel', () => page.locator('#climb').count());
  await climb({ failFirst: true });
  await until('off', async () => !(await page.locator('#climb').count()));
  await wait(400);
  await toSession();
  const asked = await expectText('#sheet', /Tell them, or keep it\?/, 'a find');
  await shot('session-find');
  // Telling them: what the card says it pays, against the save.
  const says = (await page.locator('#sheet .opt', { hasText: 'Tell them' }).first().textContent()) ?? '';
  const old = Number(/\+(\d+) with the old guard/.exec(says)?.[1] ?? NaN);
  const bond = Number(/\+(\d+) bond with/.exec(says)?.[1] ?? 0);
  const was = await state();
  // Phase 38: the go kept its pace for a ghost, from the first move to where it came off.
  const ghost = was.routes.warm?.ghost;
  if (
    !ghost ||
    ghost.length < 4 ||
    ghost.length % 2 ||
    ghost[0] !== 0 ||
    ghost[1] !== 0 ||
    ghost.at(-1) > was.routes.warm.hi
  )
    await fail(`ghost: the first go's pace ${JSON.stringify({ ghost, hi: was.routes.warm?.hi })}`);
  await click('#sheet .opt', 'Tell them');
  await expectText('#sheet', /You tell them/, 'told');
  const told = await state();
  const paid =
    told.scene.old === Math.min(100, was.scene.old + old) &&
    cast.every((w) => told.people[w].bond === was.people[w].bond + bond) &&
    told.sesh.seats.every((p) => p.knows.length > 0);
  if (!paid || !Number.isFinite(old))
    await fail(
      `session: telling them paid ${JSON.stringify({ says, old, bond, was: was.scene.old, now: told.scene.old })}`,
    );
  // Then goes till it's decided.
  let before = told;
  let sent = false;
  for (let g = 0; g < 8 && !sent; g++) {
    before = await state();
    if (!before.sesh || !(await page.locator('#sheet .opt', { hasText: 'Your go' }).count())) break;
    await click('#sheet .opt', 'Your go');
    await until('the climb panel', () => page.locator('#climb').count());
    await climb();
    await until('the go to end', async () => !(await page.locator('#climb').count()), 15_000);
    await wait(400);
    sent = !!(await state()).routes.warm?.sent;
    if (!sent) await toSession();
  }
  const after = await state();
  const firstWas = before.sesh?.first ?? null;
  if (sent && !firstWas && (after.seshFirsts !== 1 || !after.record.firstup))
    await fail(
      `session: first to the top, unpaid: ${JSON.stringify({ firsts: after.seshFirsts, record: !!after.record.firstup })}`,
    );
  if (sent && firstWas && after.seshFirsts !== 0) await fail('session: paid for second');
  // The ghost goes with the send; till then, the best go stays.
  if (sent ? after.routes.warm?.ghost : !after.routes.warm?.ghost)
    await fail(`ghost: ${sent ? 'still there after the send' : 'gone without a send'}`);
  log(
    `ghost: the first go's pace, ${ghost.length / 2} points, off at ${ghost.at(-1)} moves in ${ghost.at(-2)}s; ${sent ? 'gone with the send' : 'kept'}.`,
  );
  log(
    `session: ${[...cast, ...(joined.sesh.seats.length - cast.length === 1 ? ['a local'] : [`${joined.sesh.seats.length - cast.length} locals`])].join(', ')}; ${asked.match(/You’ve worked out [^?]*\?/)?.[0] ?? ''} told them; ${sent ? (firstWas ? `sent it after ${firstWas}` : 'first to the top') : 'not sent in eight goes'}.`,
  );
  await page.close();
  page = main;
}

console.log('A belay at Roadside');
// Phase 42 (Phase 42's criterion 1). Day 39's open morning at Roadside, Hazel there and the Pump
// the line you've worked most: "Want a belay?" from her talk puts her rope in your hands. The
// hand reads the meter as a player's eye would: take in when the slack runs high, let it run
// when it's low or she's clipping, and when she falls, brake, then give as it comes tight. In
// the save: its half hour, the day together, and on a clean belay a beta on the Pump.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 39,
    min: 10 * 60,
    at: 'road',
    x: null,
    energy: 100,
    skin: 100,
    fed: 100,
    today: ['crag'],
    injury: null,
    routes: {
      ...saved.state.routes,
      pump: {
        known: [],
        told: [],
        pick: {},
        falls: {},
        goes: 9,
        goesToday: 0,
        hi: 6,
        sent: null,
        sentToday: false,
      },
    },
    people: {
      ...saved.state.people,
      // Her favour answered this window, so it's the crag's offer she makes, not her ask.
      hazel: {
        since: 1,
        ...saved.state.people.hazel,
        bond: 3,
        last: 0,
        talked: true,
        arc: 9,
        beatDay: 1,
        favour: 39,
      },
    },
    encounter: null,
    table: null,
    cards: null,
    sesh: null,
  };
  const main = page;
  page = await playPage({ width: 390, height: 844 }, 2, 'belay: ');
  await page.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  await page.goto(server.url, { waitUntil: 'load' });
  await until('Roadside', async () => (await text('#b-nav')) === 'Map');
  await wait(600);
  // Hazel, wherever she's standing at the base: walked to till she's on screen.
  const hazel = page.locator('button.hot[aria-label="Hazel"]');
  walk: for (const [k, most] of [
    ['ArrowRight', 30],
    ['ArrowLeft', 60],
  ])
    for (let i = 0; i < most; i++) {
      if (await hazel.count()) break walk;
      await page.keyboard.down(k);
      await wait(200);
      await page.keyboard.up(k);
      await wait(150);
    }
  if (!(await hazel.count())) await fail('belay: never found Hazel at Roadside');
  await hazel.first().evaluate((el) => el.click());
  await expectText('#bubble', /Want a belay\?/, 'Hazel, with the rope');
  const before = await state();
  await click('#bubble button', 'Want a belay?');
  await until('the rope', () => page.locator('#belay').count());
  await shot('belay');
  // The hand, on Space: read the meter every 40 ms and act on what it shows.
  let held = false;
  const hand = async (on) => {
    if (on === held) return;
    held = on;
    await (on ? page.keyboard.down(' ') : page.keyboard.up(' '));
  };
  for (let i = 0; i < 1500; i++) {
    const r = await page.evaluate(() => {
      const el = document.getElementById('rope');
      return el ? { phase: el.dataset.phase, slack: Number(el.dataset.slack) } : null;
    });
    if (!r || r.phase === 'caught') break;
    if (r.phase === 'fall') await hand(r.slack > 0.12);
    else if (r.phase === 'clip') await hand(false);
    else await hand(r.slack > 0.55 ? true : r.slack < 0.45 ? false : held);
    await wait(40);
  }
  await hand(false);
  await until('the catch', () => page.locator('#belay-done').count(), 30_000);
  const said = (await text('#belay-status')) ?? '';
  const after = await state();
  const clean = /Soft as you like/.test(said);
  if (!clean && !/That one I felt/.test(said)) await fail(`belay: Hazel said "${said}"`);
  if (after.min !== before.min + 30 || !after.today.includes('belayed-hazel'))
    await fail(`belay: not in the save: ${JSON.stringify({ min: after.min, today: after.today })}`);
  if (after.people.hazel.bond !== before.people.hazel.bond + 1 || after.people.hazel.last !== 39)
    await fail(`belay: no day together: ${JSON.stringify(after.people.hazel)}`);
  if (after.routes.pump.known.length !== (clean ? 1 : 0))
    await fail(
      `belay: ${clean ? 'clean' : 'hard'}, and the Pump's beta is ${JSON.stringify(after.routes.pump.known)}`,
    );
  await shot('belay-caught');
  await click('#belay-done');
  await until('untied', async () => !(await page.locator('#belay').count()));
  log(
    `belay: ${clean ? 'a soft catch and a clean belay, and Hazel told a beta on the Pump' : 'a hard catch'}: ${said}`,
  );
  await page.close();
  page = main;
}

console.log('The van, laid out');
// Phase 43. A morning at the Lot with a kitchen and a shelf in the van: "Lay out the van" from
// the van card. The kitchen turned to run across; the shelf taken out, then put back in the gap;
// the bed moved along, never out or turned; the door refused. Each in the save as it's done, and
// none of it costs a minute.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 39,
    min: 10 * 60,
    at: 'lot',
    x: null,
    gear: { ...saved.state.gear, kitchen: 1, shelf: 1 },
    vanPlan: { bed: { x: 4, y: 0, r: 0 }, kitchen: { x: 0, y: 0, r: 0 }, shelf: { x: 2, y: 0, r: 0 } },
    today: [],
    encounter: null,
    table: null,
    cards: null,
    sesh: null,
  };
  const main = page;
  page = await playPage({ width: 390, height: 844 }, 2, 'vanplan: ');
  await page.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  const at = (id) => page.evaluate((i) => document.getElementById(`vp-${i}`)?.dataset.at ?? null, id);
  const cell = (x, y) => click(`#vp-floor .vp-cell[aria-label^="Floor, ${x} along, ${y} across"]`);
  const plan = async (want, what) => {
    await until(what, async () => JSON.stringify((await state()).vanPlan) === JSON.stringify(want));
  };
  await page.goto(server.url, { waitUntil: 'load' });
  await until('the Lot', async () => (await text('#b-nav')) === 'Map');
  await wait(600);
  await page
    .locator('button.hot[aria-label="Your van"]')
    .first()
    .evaluate((el) => el.click());
  await until('the van card', async () => (await text('#sheet-title')) === 'Your van');
  await click('#sheet .opt', 'Lay out the van');
  await until('the plan', async () => (await text('#sheet-title')) === 'The van, laid out');
  const laid = [await at('bed'), await at('kitchen'), await at('shelf')].join(' ');
  if (laid !== '4,0,0 0,0,0 2,0,0') await fail(`vanplan: laid out as ${laid}`);
  const before = await state();
  // The kitchen, turned where it stands.
  await cell(1, 1);
  await click('#vp-turn');
  await plan(
    { bed: { x: 4, y: 0, r: 0 }, kitchen: { x: 0, y: 0, r: 1 }, shelf: { x: 2, y: 0, r: 0 } },
    'the kitchen turned, in the save',
  );
  // The shelf out, and back in the gap the kitchen left.
  await cell(3, 1);
  await click('#vp-out');
  await plan({ bed: { x: 4, y: 0, r: 0 }, kitchen: { x: 0, y: 0, r: 1 }, shelf: null }, 'the shelf out');
  await click('#vp-back-shelf');
  await cell(2, 2);
  await plan(
    { bed: { x: 4, y: 0, r: 0 }, kitchen: { x: 0, y: 0, r: 1 }, shelf: { x: 1, y: 1, r: 0 } },
    'the shelf back in',
  );
  // The bed: no turning it and no taking it out, but it moves along.
  await cell(6, 2);
  await expectText('#sheet .sub', /The bed: .*It runs along the van/, 'the bed, picked');
  if ((await page.locator('#vp-turn, #vp-out').count()) > 0)
    await fail('vanplan: the bed offered a turn or out');
  await cell(4, 1);
  await plan(
    { bed: { x: 3, y: 0, r: 0 }, kitchen: { x: 0, y: 0, r: 1 }, shelf: { x: 1, y: 1, r: 0 } },
    'the bed moved along',
  );
  // The kitchen over the door: refused, and left where it was.
  await cell(1, 1);
  await cell(3, 3);
  await expectText('#toast', /That’s the door\./, 'the door refused');
  await shot('vanplan');
  const after = await state();
  if (JSON.stringify(after.vanPlan.kitchen) !== JSON.stringify({ x: 0, y: 0, r: 1 }))
    await fail(`vanplan: the door moved the kitchen: ${JSON.stringify(after.vanPlan.kitchen)}`);
  if (after.min !== before.min) await fail(`vanplan: laying it out took ${after.min - before.min} minutes`);
  log(`vanplan: ${JSON.stringify(after.vanPlan)}`);
  await page.close();
  page = main;
}

console.log('Your set on the wall');
// Phase 44.2 (Phase 44's criterion 1, its second half). A set of yours up on the panel this
// week, "First Light", five holds straight up: walked to at the end of the wall, its sheet by
// its name, and climbed till it goes. In the save, its goes and its send, as on any problem.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  // Day 39's set: the jug, the shake, the rail, a smear and an undercling, up the middle.
  const id = 'ys-39-020121222823524';
  saved.state = {
    ...saved.state,
    day: 39,
    min: 10 * 60,
    at: 'gym',
    x: null,
    energy: 100,
    skin: 100,
    fed: 100,
    // A day pass bought at the desk, as on any morning at Send City.
    today: ['pass'],
    injury: null,
    setUp: { id, name: 'First Light' },
    encounter: null,
    table: null,
    cards: null,
    sesh: null,
  };
  const main = page;
  page = await playPage({ width: 390, height: 844 }, 2, 'yourset: ');
  await page.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  await page.goto(server.url, { waitUntil: 'load' });
  await until('Send City', async () => (await text('#b-nav')) === 'Map');
  await wait(600);
  // The panel's at the end of the wall: walked to till it's on screen.
  const mine = page.locator('button.hot[aria-label^="First Light"]');
  for (let i = 0; i < 40 && !(await mine.count()); i++) {
    await page.keyboard.down('ArrowRight');
    await wait(200);
    await page.keyboard.up('ArrowRight');
    await wait(150);
  }
  if (!(await mine.count())) await fail('yourset: never found First Light on the panel');
  await mine.first().evaluate((el) => el.click());
  await expectText('#sheet-title', /First Light · V0/, 'your set, by its name');
  await shot('yourset');
  const goes = await sendIt('First Light');
  const after = await state();
  if (!after.routes[id]?.sent || after.routes[id].goes !== goes)
    await fail(`yourset: not in the save: ${JSON.stringify(after.routes[id])}`);
  log(`yourset: First Light sent on go ${goes}`);
  await page.close();
  page = main;
}

console.log('The problem of the day');
// Phase 45 (its criterion 2; criterion 1 is daily.test.ts). Your climber's save beside it, the
// page opened on a pinned date's day: its sheet (the line, the climber made for it), the line,
// a go come off on purpose and the day going on, then goes till it goes or the day's done, and
// the day's sheet. Its own slot all along: the career's save the same to the byte, and back to
// it from the sheet. Then the next day, begun too tired for more than one go: it ends on the
// fall, on the day's sheet.
{
  const career = await page.evaluate(() => localStorage.getItem('dirtbag.save'));
  const main = page;
  page = await playPage({ width: 390, height: 844 }, 2, 'day: ');
  await page.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, career);
  const dayUrl = (date) => new URL(`?day=${date}`, server.url).href;
  const slot = () => page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.day.save')).state);
  // This page comes and goes more than most: each load waits for the network to go quiet, so
  // the next navigation can't cut off the browser's own favicon request, which counts as a
  // request failed (it did once on CI).
  await page.goto(dayUrl('2026-10-19'), { waitUntil: 'networkidle' });
  await expectText('#sheet-title', /The problem of the day/, 'day: its sheet');
  await expectText('#sheet', /19 October 2026\. Hueco Pockets, V9, at Moonstone Boulders\./, 'day: its line');
  await expectText('#sheet', /Today you climb V7, on a V9\./, 'day: its climber');
  if ((await text('#b-nav')) !== 'The day') await fail(`day: the nav reads ${await text('#b-nav')}`);
  if (await page.locator('#h-cash').count()) await fail('day: money in the HUD on a day');
  await expectText('#h-time', /^19 Oct · 7:40/, 'day: its date and first light');
  await shot('day');
  await click('#sheet .opt', 'To the line');
  await expectText('#sheet-title', /Hueco Pockets · V9/, 'day: the line, up close');
  // Off at the first crux, on purpose: the fall's own sheet, and the day goes on.
  await click('#sheet .go');
  await until('the climb panel', () => page.locator('#climb').count());
  await climb({ failFirst: true });
  await until(
    'day: the fall',
    () => page.locator('#sheet .opt', { hasText: 'Rest, then go again' }).count(),
    15_000,
  );
  let goes = 1;
  const over = () =>
    page.evaluate(() => {
      const t = document.querySelector('#sheet-title')?.textContent ?? '';
      return / on go \d+$|^Not today$/.test(t) ? t : null;
    });
  let end = null;
  while (!end && goes < 16) {
    await click('#sheet .opt', 'Rest, then go again');
    end = await until(
      'day: the beta sheet, or the day over',
      async () => (await over()) ?? ((await page.locator('#sheet .go').count()) ? 'more' : null),
    );
    if (end !== 'more') break;
    end = null;
    await click('#sheet .go');
    goes++;
    await until('the climb panel', () => page.locator('#climb').count());
    await climb();
    end = await until(
      'day: the go to end',
      async () =>
        (await over()) ??
        ((await page.locator('#sheet .opt', { hasText: 'Rest, then go again' }).count()) ? 'fell' : null),
      15_000,
    );
    if (end === 'fell') end = null;
  }
  if (!end) await fail(`day: still going after ${goes} goes`);
  await shot('day-over');
  const st = await slot();
  // The day's line is the only one with goes on it.
  const tried = Object.values(st.routes).filter((l) => l.goes > 0);
  const L = tried[0];
  if (st.seed !== 'day:2026-10-19') await fail(`day: the slot holds ${st.seed}`);
  if (tried.length !== 1 || (L.sent ? L.sent.go : L.goes) !== goes)
    await fail(`day: ${goes} goes played, the slot says ${JSON.stringify(st.routes)}`);
  if (/ on go /.test(end) !== !!L.sent)
    await fail(`day: the sheet says "${end}", the slot ${JSON.stringify(L.sent)}`);
  log(`day: ${end} (${goes} goes)`);
  // Its own slot: the career's save as it was, to the byte.
  if ((await page.evaluate(() => localStorage.getItem('dirtbag.save'))) !== career)
    await fail('day: the career’s save changed');
  log(`day: keys ${(await page.evaluate(() => Object.keys(localStorage).sort())).join(', ')}`);
  // Phase 45.2: its card, painted on the device at full size and saved as a file, and back.
  const dayCard = async (re, what) => {
    await click('#sheet .opt', 'A card of it');
    const card = await until(`${what}: its card`, () =>
      page.evaluate(() => {
        const img = document.querySelector('#card');
        return img?.complete && img.naturalWidth ? [img.naturalWidth, img.naturalHeight, img.alt] : null;
      }),
    );
    if (card[0] !== 1080 || card[1] !== 1920 || !re.test(card[2]))
      await fail(`${what}: the card: ${JSON.stringify(card)}`);
    log(`${what}: card ${card[0]}×${card[1]}, "${card[2]}"`);
  };
  await dayCard(
    new RegExp(
      `^The problem of the day, 19 October 2026: Hueco Pockets, V9, at Moonstone Boulders\\. ${
        / on go /.test(end) ? `(Onsight|Flash|Redpoint), go ${goes}` : `High point \\d+ of 9, ${goes} goes`
      }\\.$`,
    ),
    'day',
  );
  const [png] = await Promise.all([page.waitForEvent('download'), click('#sheet .opt', 'Save the image')]);
  if (png.suggestedFilename() !== 'dirtbag-2026-10-19-hueco-pockets.png')
    await fail(`day: the card saved as ${png.suggestedFilename()}`);
  await shot('day-card');
  await click('#sheet .opt', 'Back');
  await expectText('#sheet-title', new RegExp(`^${end}$`), 'day: back on its sheet');
  // Opened again, the same day, as it ended.
  await page.goto(dayUrl('2026-10-19'), { waitUntil: 'networkidle' });
  await expectText('#sheet-title', new RegExp(`^${end}$`), 'day: the same day again');
  if (JSON.stringify((await slot()).routes) !== JSON.stringify(st.routes))
    await fail('day: opened again, the day moved');
  // Back to your own climber.
  await click('#sheet .opt', 'Back to your own climber');
  await until(
    'day: back to the career',
    async () => /^Day \d+ · /.test((await text('#h-time')) ?? ''),
    15_000,
  );
  if (new URL(page.url()).search) await fail(`day: back at ${page.url()}`);
  if ((await page.evaluate(() => localStorage.getItem('dirtbag.save'))) === null)
    await fail('day: no climber to go back to');
  await page.waitForLoadState('networkidle');
  // The next day, begun with energy for one go: off it, and that's the day.
  await page.goto(dayUrl('2026-10-20'), { waitUntil: 'networkidle' });
  await expectText('#sheet', /20 October 2026\./, 'day: the next day');
  await reloadWith(page, (f) => ({ ...f, state: { ...f.state, energy: 12 } }), 'dirtbag.day.save');
  await expectText('#sheet-title', /The problem of the day/, 'day: the next day, tired');
  await click('#sheet .opt', 'To the line');
  await click('#sheet .go');
  await until('the climb panel', () => page.locator('#climb').count());
  await climb({ failFirst: true });
  await expectText('#sheet-title', /^Not today$/, 'day: over on the fall');
  await expectText('#sheet', /Too tired to try\./, 'day: why');
  // How close it got, on its card.
  await dayCard(
    /: Alpine Crimps, V9, at Wind River Walls\. High point \d+ of \d+, 1 go\.$/,
    'day: the next day',
  );
  await click('#sheet .opt', 'Back');
  if ((await page.evaluate(() => localStorage.getItem('dirtbag.save'))) !== career)
    await fail('day: the career’s save changed on the next day');
  await page.close();
  page = main;
}

console.log('What’s new');
// Phase 20.1. A climber whose save was last written by 0.999.33 (the last release before the
// notes began): the card comes up once, with what's come since, newest first, and has to be
// read. Read, the save is this build's, and it doesn't come back. In Settings, to read again.
{
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('dirtbag.save')));
  saved.app = '0.999.33';
  saved.state = {
    ...saved.state,
    at: 'lot',
    x: null,
    min: 9 * 60,
    encounter: null,
    table: null,
    cards: null,
    sesh: null,
  };
  const main = page;
  page = await playPage({ width: 390, height: 844 }, 2, 'news: ');
  await page.addInitScript((f) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', f);
  }, JSON.stringify(saved));
  await page.goto(server.url, { waitUntil: 'networkidle' });
  await expectText('#sheet-title', /^What’s new$/, 'news: the card');
  await expectText('#sheet', /^What’s new\s*A lot since you were last here\./, 'news: the newest first');
  await expectText('#sheet', /Your climber can leave as a file and come back/, 'news: and the one before it');
  if (await page.locator('#sheet .x').count()) await fail('news: the card can be put down unread');
  await shot('news');
  await click('#sheet .opt', 'Right');
  const app = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).app);
  if (app === '0.999.33') await fail('news: read, and the save still says 0.999.33');
  await page.reload({ waitUntil: 'networkidle' });
  await until('news: the Lot', async () => (await text('#b-nav')) === 'Map');
  await wait(600);
  if ((await text('#sheet-title')) === 'What’s new') await fail('news: the card came back');
  // In Settings, to read again, and put down.
  await openMap();
  await click('#b-settings', 'Settings');
  await click('#b-news', 'What’s new');
  await expectText('#sheet', /^What’s new\s*A lot since you were last here\./, 'news: from Settings');
  await click('#sheet .x');
  log(`news: read once, the save now ${app}`);
  await page.close();
  page = main;
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
  // Phase 24.9: lead it, through the beta and the go, with the hands that climb day three.
  const before = await trip();
  await ex.click('#sheet .go');
  await ex.waitForFunction(() => !!document.getElementById('climb'));
  // The wall's yours while you climb: no card over it.
  await ex.waitForTimeout(300);
  if (await ex.locator('#sheet').count()) await fail(`a card over the wall on a lead: ${await sheetText()}`);
  const main = page;
  page = ex;
  down = false;
  try {
    await climb();
  } finally {
    page = main;
    down = false;
  }
  const led = await ex.evaluate(
    () => JSON.parse(localStorage.getItem('dirtbag.save')).state.routes['elcap-1'],
  );
  if (!led || led.goes < 1) await fail(`a lead on El Cap's first pitch didn't count: ${JSON.stringify(led)}`);
  log(`exped: led pitch 1, ${led.sent ? 'sent' : `off at move ${led.hi}`}`);
  // Back to the day's card, past the go's own sheets.
  await ex.waitForFunction(() => !document.getElementById('stamp') && !!document.querySelector('#sheet'));
  if (!/El Capitan, day/.test(await sheetText()))
    await ex
      .locator('#sheet .opt', { hasText: /walk out|Walk off|walk down/i })
      .first()
      .click();
  await ex.waitForFunction(() => /El Capitan, day/.test(document.querySelector('#sheet')?.textContent ?? ''));
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
  await reloadWith(ex, (f) => ({ ...f, state: { ...f.state, encounter: { kind: 'wall', id: 'haulbag' } } }));
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
  // Coming home (Phase 24.5): rap off, the road back, and the trip's card; then that night at
  // the fire, its story.
  await pick('Rap off and go home');
  await ex.waitForFunction(() =>
    /^El Capitan$/.test(document.querySelector('#sheet-title')?.textContent ?? ''),
  );
  const card = await sheetText();
  if (!/You rapped off with \d+ of \d+ pitches fixed, with Hazel\./.test(card))
    await fail(`the trip's card: ${card}`);
  log(`exped: home, ${card.replace(/^El Capitan/, '').slice(0, 140)}`);
  await ex.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-exped-home.png`) });
  await pick('Right');
  const book = await ex.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.book);
  if (book.length !== 1 || book[0].end !== 'bail' || book[0].told)
    await fail(`the book: ${JSON.stringify(book)}`);
  await reloadWith(ex, (f) => ({ ...f, state: { ...f.state, min: 21 * 60 } }));
  await ex.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Map');
  await ex.waitForTimeout(600);
  await ex.mouse.click(100, 560);
  await pick('The fire');
  await pick('Tell them about El Capitan');
  await ex.waitForFunction(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.book[0].told);
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
  // Phase 39: the crag's classics on its card, none of them ticked yet.
  await expectText(
    '#sheet',
    /The classics, 0 of 5 ticked\. Still to go: Warm Boulder, /,
    'the classics on the card',
  );
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
  await expectText('#classic-note', /One of Roadside Crag’s classics/, 'a classic, starred');
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

console.log('A controller');
// The keyboard day again, with a controller and nothing else, on a Steam Deck's shape.
{
  const portrait = page;
  page = await playPage({ width: 1280, height: 800 }, 1, 'controller: ');
  await page.addInitScript(() => {
    for (const t of ['pointerdown', 'mousedown', 'touchstart', 'keydown'])
      window.addEventListener(t, () => window.problem(`the controller day used something else (${t})`), true);
    // A standard controller, plugged in, nothing pressed.
    const pad = {
      id: 'e2e pad',
      index: 0,
      connected: true,
      mapping: 'standard',
      timestamp: 0,
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
    };
    window.__pad = pad;
    Object.defineProperty(navigator, 'getGamepads', { value: () => [pad] });
  });
  holdPad = true;
  const padPress = async (b) => {
    await padSet(b, true);
    await wait(70);
    await padSet(b, false);
    await wait(70);
  };
  // Where focus is, and where the thing wanted is: the top layer's live buttons, as the game
  // reads them.
  const focusAndTarget = (re) =>
    page.evaluate((src) => {
      const r = new RegExp(src);
      const say = (a) =>
        a
          ? `${a.id}|${a.getAttribute('aria-label') ?? ''}|${a.textContent?.replace(/\s+/g, ' ').trim() ?? ''}`
          : '';
      const root =
        document.getElementById('sheet') ??
        document.getElementById('bubble') ??
        document.getElementById('create') ??
        document.querySelector('#scr .ui');
      const box = (el) => {
        const b = el.getBoundingClientRect();
        return { x0: b.left, x1: b.right, y0: b.top, y1: b.bottom };
      };
      const a = document.activeElement;
      const live = [...root.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
      const target = live.find((el) => r.test(say(el)));
      return {
        at: a && a !== document.body ? say(a) : '',
        // Which one, where several say the same (Settings has an On for each thing it sets).
        key: a && a !== document.body ? `${say(a)}#${live.indexOf(a)}` : '',
        from: a && a !== document.body ? box(a) : null,
        to: target ? box(target) : null,
      };
    }, re.source);
  // D-pad presses toward the thing, as a player who can see it would press, until focus is on
  // it: a way it lies wholly past where focus is, the farther first. A press that comes back
  // round to a button already left that way tries the other way from there, as a player
  // would; with every way tried, the thing can't be reached.
  const padTo = async (what, re, most = 40) => {
    const tried = new Set();
    for (let i = 0; i < most; i++) {
      const f = await focusAndTarget(re);
      if (re.test(f.at)) return;
      if (!f.to) await fail(`the controller can't see ${what}`);
      let dir = 'down';
      if (f.from) {
        const cx = (f.from.x0 + f.from.x1) / 2;
        const cy = (f.from.y0 + f.from.y1) / 2;
        const ways = [
          ['right', f.to.x0 >= cx, f.to.x0 - cx],
          ['left', f.to.x1 <= cx, cx - f.to.x1],
          ['down', f.to.y0 >= cy, f.to.y0 - cy],
          ['up', f.to.y1 <= cy, cy - f.to.y1],
        ].filter(([d, ok]) => ok && !tried.has(`${f.key}>${d}`));
        if (!ways.length) await fail(`the controller can't get from ${f.at} to ${what}`);
        dir = ways.sort((a, b) => b[2] - a[2])[0][0];
        tried.add(`${f.key}>${dir}`);
      }
      await padPress(dir);
    }
    await fail(`the controller never reached ${what}`);
  };

  await page.goto(server.url, { waitUntil: 'load' });
  await until('the climber screen', () => page.locator('#create').count());
  // No typing: a name, picked.
  await padTo('the name on offer', /^c-pick\|/);
  await padPress('a');
  const named = await page.inputValue('#c-name');
  if (named !== 'Robin') await fail(`the name on offer: ${named}`);
  await padTo('The Technician', /^c-technician\|/);
  await padPress('a');
  await padTo('Start', /^c-go\|/);
  await padPress('a');
  await until('the climber screen to go', async () => !(await page.locator('#create').count()));
  await wait(400);
  await shot('controller-lot');

  // Hazel's on the screen from the start on this shape; her bubble takes the controller.
  await padTo('Hazel', /\|Hazel\|/);
  await padPress('a');
  await expectText('#bubble', /staring at The Pump/, 'Hazel, by controller');
  await padPress('a');
  await expectText('#bubble', /Hook your left heel/, 'Hazel on the roof');
  await padPress('a');
  await expectText('#toast', /New beta: heel-hook the lip/, 'toast');

  // The journal on Start, B to put it down.
  await padPress('start');
  await expectText('#log', /heel-hook the lip/, 'the journal, by Start');
  await shot('controller-journal');
  await padPress('b');
  await until('the journal to close', async () => !(await page.locator('#sheet').count()));

  // The map on Select, a pin by the D-pad, and the drive.
  await padPress('select');
  await until('the map', async () => (await text('#b-nav')) === 'Close');
  await wait(450);
  await padTo('Roadside Crag’s pin', /^pin-road\|/);
  await padPress('a');
  await expectText('#sheet', /Roadside Crag/, 'the card, by controller');
  await padTo('the drive', /\|Drive here/);
  await padPress('a');
  await until('the crag', async () => (await text('#hint'))?.includes('Boulders on the talus'));
  await wait(400);

  // The Warm Boulder: its sheet, B, A at the wall for it again, and a go held on A.
  await padTo('the Warm Boulder', /\|Warm Boulder, V2/);
  await padPress('a');
  await expectText('#sheet', /Warm Boulder · V2/, 'the beta sheet, by controller');
  await padPress('b');
  await until('the sheet to close', async () => !(await page.locator('#sheet').count()));
  await padPress('a');
  await expectText('#sheet', /Warm Boulder · V2/, 'the beta sheet again, from the wall');
  await padTo('Pull on', /\|Pull on/);
  await padPress('a');
  await until('the climb panel', () => page.locator('#climb').count());
  await shot('controller-climb');
  await climb();
  await until('the go to end', () => page.locator('#sheet').count(), 15_000);
  await padTo('the way down', /\|(Walk down the back|Walk off)$/);
  await padPress('a');
  await until('the crag again', async () => (await text('#b-nav')) === 'Map');
  await wait(600);

  // Home, and bed at dark.
  await padPress('select');
  await until('the map', async () => (await text('#b-nav')) === 'Close');
  await wait(450);
  await padTo('the Lot’s pin', /^pin-lot\|/);
  await padPress('a');
  await padTo('the drive home', /\|Drive here/);
  await padPress('a');
  await until('the Lot', async () => (await text('#hint')) !== null || (await text('#b-nav')) === 'Map');
  await wait(1200);
  await padTo('your van', /\|Your van\|/);
  await padPress('a');
  await expectText('#sheet', /Your van/, 'the van, by controller');
  await padTo('lying around', /\|Lie around till dark/);
  await padPress('a');
  await padTo('bed', /\|Sleep/);
  await padPress('a');
  await expectText('#h-time', /^Day 2 · /, 'morning, by controller');
  log('a day by controller alone: a name picked, Hazel, the journal, the map, a go held on A, bed');

  // Phase 14.6: what's left of a day by controller. The stove that evening, played on A (focus
  // waits on the way out when it's done), then a second dish skipped on B; the speed wall the
  // next morning, its hands on the bumpers; and the frame meter, switched on from Settings.
  await reloadWith(page, (f) => ({
    ...f,
    state: {
      ...f.state,
      min: 19 * 60,
      at: 'lot',
      x: null,
      energy: 80,
      today: [],
      gear: { ...f.state.gear, kitchen: 1 },
      pantry: { pasta: 2, greens: 2 },
      encounter: null,
      table: null,
    },
  }));
  await wait(1200);
  // From the Lot, or from the van's card when a dish has just put you back at it.
  const stove = async () => {
    if (!/Your van/.test((await text('#sheet')) ?? '')) {
      await padTo('your van', /\|Your van\|/);
      await padPress('a');
      await expectText('#sheet', /Your van/, 'the van, by controller');
    }
    await padTo('the pasta', /\|Cook pasta and greens/);
    await padPress('a');
    await until('the stove', () => page.locator('#busk').count());
  };
  await stove();
  if (!(await page.locator('#b-skip .pad-hint').isVisible()))
    await fail('the stove: no B beside "Just eat it"');
  for (let k = 0; k < 5; k++) {
    await padPress('a');
    await wait(450);
  }
  await until('the dish', async () => /\bEat\b/.test((await text('#b-done')) ?? ''));
  const out = await page.evaluate(() => document.activeElement?.id);
  if (out !== 'b-done') await fail(`the stove's done, and focus is on ${out || 'nothing'}`);
  await padPress('a');
  await expectText('#sheet', /Your van/, 'back at the van, by controller');
  await stove();
  await padPress('b');
  await until('the plain meal', async () => !(await page.locator('#busk').count()));
  const fed = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state.pantry);
  if (fed.pasta !== 0 || fed.greens !== 0) await fail(`two dishes by controller: ${JSON.stringify(fed)}`);
  await shot('controller-stove');

  await reloadWith(page, (f) => ({
    ...f,
    state: { ...f.state, min: 10 * 60, at: 'gym', x: null, energy: 90, today: ['pass'], encounter: null },
  }));
  await wait(1200);
  // A day pass bought, and the wall at the far end of the gym: the stick walks there.
  await page.evaluate(() => (window.__pad.axes[0] = 1));
  await until(
    'the speed wall on screen',
    () => page.locator('button[aria-label="The speed wall"]').count(),
    10_000,
  );
  await page.evaluate(() => (window.__pad.axes[0] = 0));
  await wait(300);
  await padTo('the speed wall', /\|The speed wall\|/);
  await padPress('a');
  // A walks you to the wall's foot first, then opens its card.
  await expectText('#sheet', /The speed wall/, 'the speed wall, by controller');
  await padTo('the race', /\|Race the clock/);
  await padPress('a');
  await until('the green light', () => page.locator('#speed .green').count(), 6000);
  for (let k = 0; k < 20 && !(await page.locator('#s-again').count()); k++)
    await padPress(k % 2 ? 'rb' : 'lb');
  await until('the clock to stop', () => page.locator('#s-again').count(), 6000);
  const at = await page.evaluate(() => document.activeElement?.id);
  if (at !== 's-again') await fail(`the run's over, and focus is on ${at || 'nothing'}`);
  const run = await text('#s-status');
  await shot('controller-speed');
  await padTo('done', /^s-done\|/);
  await padPress('a');
  await until('off the wall', async () => !(await page.locator('#speed').count()));

  await padPress('select');
  await until('the map', async () => (await text('#b-nav')) === 'Close');
  await wait(450);
  await padTo('Settings', /^b-settings\|/);
  await padPress('a');
  await padTo('the frame meter', /\|On: frames a second/);
  await padPress('a');
  await padPress('b');
  await until('the meter', async () =>
    /^\d+ fps · slowest \d+ ms · \d+ slow$/.test((await text('#meter')) ?? ''),
  );
  const meter = await text('#meter');

  // Phase 14.6b: Back moved to X from Settings, by controller. B does nothing then, X puts the
  // sheet down; then the controls put back as they were, and B is Back again.
  await padTo('Settings', /^b-settings\|/);
  await padPress('a');
  await padTo('Back, on the pad', /^bind-pad-b\|/);
  await padPress('a');
  await expectText('#bind-pad-b', /Press a button/, 'Settings waiting for a button');
  await padPress('x');
  await expectText('#bind-pad-b', /X$/, 'Back, on X');
  await padPress('b');
  await wait(300);
  if (!(await page.locator('#sheet').count())) await fail('B still put Settings down, with Back on X');
  await padPress('x');
  await until('Settings put down on X', async () => !(await page.locator('#sheet').count()));
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.settings')).binds.pad.b);
  if (kept !== 2) await fail(`Back's button, kept: ${kept}`);
  await padTo('Settings', /^b-settings\|/);
  await padPress('a');
  await padTo('the controls as they were', /^bind-reset\|/);
  await padPress('a');
  await expectText('#bind-pad-b', /B$/, 'Back, on B again');
  await padPress('b');
  await until('Settings put down on B', async () => !(await page.locator('#sheet').count()));
  log(
    `and by controller: a dish stirred on A, another skipped on B, the speed wall on the bumpers (${run}), the meter: ${meter}, Back moved to X and put back`,
  );
  holdPad = false;
  down = false;
  await page.close();
  page = portrait;
}

console.log('A save, as a file');
{
  const portrait = page;
  page = await playPage({ width: 390, height: 844 }, 2, 'save file: ');
  await page.goto(server.url, { waitUntil: 'load' });
  await until('the climber screen', () => page.locator('#create').count());
  await page.fill('#c-name', 'Robin');
  await click('#c-technician');
  await click('#c-go', 'Start');
  await until('the climber screen to go', async () => !(await page.locator('#create').count()));
  await wait(400);

  // Out, from Settings: the save as the game keeps it, named for who and when.
  await openMap();
  await click('#b-settings', 'Settings');
  const [dl] = await Promise.all([page.waitForEvent('download'), click('#s-save-out', 'Export your save')]);
  const file = join(OUT, dl.suggestedFilename());
  await dl.saveAs(file);
  const kept = JSON.parse(readFileSync(file, 'utf8'));
  if (
    dl.suggestedFilename() !== 'dirtbag-robin-day-1.json' ||
    kept.format !== 'dirtbag' ||
    kept.state?.climber?.name !== 'Robin'
  )
    await fail(`the exported save: ${dl.suggestedFilename()} ${JSON.stringify(kept).slice(0, 120)}`);
  await expectText('#s-save-out', /Saved as dirtbag-robin-day-1\.json/, 'the export');
  await click('#sheet .x');

  // Over, and the first screen again.
  await click('.corner .restart', 'Start over');
  await click('#sheet .opt', 'Start a new game');
  await until('the climber screen', () => page.locator('#create').count());

  // A file that isn't a save: turned away, with why, and nothing changes.
  await page.setInputFiles('#save-file', {
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('nope'),
  });
  await expectText(
    '#save-why',
    /won’t load: not JSON\. Nothing here has changed\./,
    'a file that isn’t a save',
  );
  if (!(await page.locator('#create').count())) await fail('a file that isn’t a save left the first screen');

  // Robin's file: who it holds, then Robin, as they were.
  await page.setInputFiles('#save-file', file);
  await expectText('#save-confirm', /^Robin, day 1, V\d+\./, 'the save, before it loads');
  await Promise.all([page.waitForEvent('load'), click('#s-save-load', 'Load Robin')]);
  await until('the game to start again from the file', async () => !(await page.locator('#create').count()));
  const back = await page.evaluate(
    () => JSON.parse(localStorage.getItem('dirtbag.save') ?? 'null')?.state?.climber?.name,
  );
  if (back !== 'Robin') await fail(`the save brought back: ${back}`);
  log('Robin out as a file, the game over, a notes file turned away, Robin back from the first screen');

  // Phase 14.5c: a climber the demo left beside the game (they shared a site), offered on the
  // first screen and carried on with; the demo keeps its own copy.
  const demoSave = await page.evaluate(() => {
    const f = JSON.parse(localStorage.getItem('dirtbag.save'));
    f.state = { ...f.state, day: 20, climber: { ...f.state.climber, name: 'Kit' } };
    return JSON.stringify(f);
  });
  await page.addInitScript((raw) => {
    if (sessionStorage.getItem('e2e-demo') !== '1') return;
    sessionStorage.removeItem('e2e-demo');
    localStorage.removeItem('dirtbag.save');
    localStorage.removeItem('dirtbag.save.prev');
    localStorage.setItem('dirtbag.demo.save', raw);
  }, demoSave);
  await page.evaluate(() => sessionStorage.setItem('e2e-demo', '1'));
  await page.reload({ waitUntil: 'load' });
  await until('the climber screen, with a demo climber beside it', () => page.locator('#create').count());
  await expectText('#s-save-demo', /Carry on from the demo.*Kit, day 20/, 'a climber from the demo');
  await Promise.all([page.waitForEvent('load'), click('#s-save-demo', 'Carry on from the demo')]);
  await until('the game to start from the demo', async () => !(await page.locator('#create').count()));
  const kit = await page.evaluate(() => [
    JSON.parse(localStorage.getItem('dirtbag.save') ?? 'null')?.state?.climber?.name,
    !!localStorage.getItem('dirtbag.demo.save'),
  ]);
  if (kit[0] !== 'Kit' || !kit[1]) await fail(`carried on from the demo: ${kit}`);
  log('and Kit, from the demo, carried on with from the first screen');
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

console.log('A later life');
// Phase 23.8: Phase 23 later in a career, on the day-five climber's save moved on to day 57:
// close to Hazel and Sage, trusted by the old guard, asked about a calling and put off, with
// a call put to them at the crag waiting. The call (the elder's answer, there for them), its
// line in the journal; the first year's recap; a calling taken up; the Homecoming armed.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 57,
    min: 10 * 60,
    at: 'lot',
    x: null,
    people: { ...saved.state.people, hazel: { bond: 4, last: 56 }, sage: { bond: 4, last: 55 } },
    scene: { ...saved.state.scene, old: 70 },
    calling: { id: null, since: 0, rungs: [], offered: true },
    year: { recapped: 0, home: 'none' },
    encounter: { kind: 'stance', id: 'chip' },
    // Phase 16.2: Act I done; on into Act II.
    goals: 5,
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const later = await ctx.newPage();
  later.on('pageerror', (e) => problems.push(`later: uncaught: ${e.message}`));
  later.on('console', (m) => m.type() === 'error' && problems.push(`later: console.error: ${m.text()}`));
  await later.goto(server.url, { waitUntil: 'load' });
  const sheet = () => later.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  const title = () => later.evaluate(() => document.querySelector('#sheet-title')?.textContent ?? '');
  await later.waitForFunction(() =>
    /Somebody chipped your project/.test(document.querySelector('#sheet')?.textContent ?? ''),
  );
  const call = await sheet();
  if (!/Have a quiet word/.test(call) || !/The old guard warms to you/.test(call))
    await fail(`the call, with the elder's answer: ${call.slice(0, 300)}`);
  log(`later: the call: ${call.slice(0, 90)}`);
  await later.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-later-call.png`) });
  await later.locator('#sheet .opt', { hasText: 'Have a quiet word' }).first().click();
  // What it did, on a card; then the first year's recap.
  const seen = [];
  for (let i = 0; i < 20 && !seen.includes('Year 1'); i++) {
    await later.waitForTimeout(500);
    const t = await title();
    if (!t) continue;
    log(`later: a card: ${t}`);
    seen.push(t);
    if (t === 'Year 1') break;
    await later.locator('#sheet .opt').first().click();
  }
  if (!seen.includes('Year 1')) await fail(`the year's recap never came: ${seen.join(', ')}`);
  const year = await sheet();
  if (!/lines? sent|Nothing sent/.test(year) || !/in hand/.test(year)) await fail(`the recap: ${year}`);
  log(`later: ${year.slice(0, 100)}`);
  await later.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-later-year.png`) });
  await later.locator('#sheet .opt', { hasText: 'On to the next' }).first().click();
  // The You page: where you stand, the call in your words, the Homecoming; a calling.
  await later.click('#h-you');
  await later.waitForSelector('#scene');
  const actRow = await later.evaluate(() => document.querySelector('#act')?.textContent ?? '');
  if (!/^Act II, The Local’s Project · 1 of 5 · Earn some trust$/.test(actRow))
    await fail(`later: the act: ${actRow}`);
  log(`later: ${actRow}`);
  const you = await sheet();
  if (!/In with the old guard/.test(you) || !/Ended the chipping quietly/.test(you))
    await fail(`the scene on the You page: ${you.slice(0, 400)}`);
  await later.click('#calling-open');
  await later.waitForFunction(
    () => document.querySelector('#sheet-title')?.textContent === 'What are you climbing for?',
  );
  await later.locator('#sheet .opt', { hasText: 'The Purist' }).first().click();
  await later.click('#h-you');
  await later.waitForSelector('#calling');
  await later.locator('#home').click();
  const st = await later.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (
    st.calling.id !== 'purist' ||
    st.year.home !== 'armed' ||
    st.year.recapped !== 1 ||
    st.scene.stances[0]?.opt !== 3
  )
    await fail(`later: the save: ${JSON.stringify({ calling: st.calling, year: st.year, scene: st.scene })}`);
  log('later: the Purist taken up, the Homecoming armed, the call kept');
  await later.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-later-you.png`) });
  await ctx.close();
}

console.log('Hanging it up');
// Phase 16.1: the day-five climber at day 380, 43 by the clock: the countdown on the You page,
// hanging it up, asked first, and the tally; then a new climber from it.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = { ...saved.state, day: 380, min: 10 * 60, at: 'lot', x: null, encounter: null };
  // A first ascent of theirs, for the kid to inherit (Phase 16.5).
  saved.state.firsts = { ...saved.state.firsts, rsopen: { name: 'Second Wind', call: 0, day: 300 } };
  saved.state.life = { held: 0, told: 43, retired: null };
  saved.state.year = { ...saved.state.year, recapped: 6 };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const old = await ctx.newPage();
  old.on('pageerror', (e) => problems.push(`old: uncaught: ${e.message}`));
  old.on('console', (m) => m.type() === 'error' && problems.push(`old: console.error: ${m.text()}`));
  await old.goto(server.url, { waitUntil: 'load' });
  const sheet = () => old.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  const title = () => old.evaluate(() => document.querySelector('#sheet-title')?.textContent ?? '');
  await old.click('#h-you');
  await old.waitForSelector('#age');
  const age = await old.evaluate(() => document.querySelector('#age')?.textContent ?? '');
  if (!/^43\. Your body calls it at 45: 35 days left\./.test(age)) await fail(`old: the age row: ${age}`);
  log(`old: ${age}`);
  await old.click('#hangup');
  await old.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === 'Hang it up?');
  await old.locator('#sheet .opt', { hasText: 'Hang it up' }).first().click();
  await old.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === 'A climbing life');
  const tally = await sheet();
  // Phase 16.4: what became of you, from the save (a Sold It All climber), then the numbers.
  if (
    !/43: 21 years on rock\. You called it yourself\./.test(tally) ||
    !/The storage unit with the rest of your old life/.test(tally) ||
    !/The page in the Record Book you show people first/.test(tally) ||
    !/in the Record Book\./.test(tally)
  )
    await fail(`old: the tally: ${tally.slice(0, 400)}`);
  log(`old: ${tally.slice(0, 140)}`);
  await old.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-old-tally.png`) });
  // It stays the tally: a reload comes back to it.
  await old.reload({ waitUntil: 'load' });
  await old.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === 'A climbing life');
  const st = await old.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (!st.life.retired || st.life.retired.forced || st.life.retired.day !== 380 || st.record.retired !== 380)
    await fail(`old: the save: ${JSON.stringify({ life: st.life, record: st.record.retired })}`);
  // Phase 16.5: the kid they coached climbs on, the next morning, in the same world.
  await old.locator('#sheet .opt', { hasText: 'Climb on as the kid you coached' }).first().click();
  await old.waitForSelector('#create');
  const heading = await old.evaluate(() => document.querySelector('#create-title')?.textContent ?? '');
  if (heading !== 'Who has Robin’s keys?') await fail(`old: the heir's creation: ${heading}`);
  if (await old.locator('#c-solo').count())
    await fail('old: the heir is offered Free Solo; the family’s mode carries');
  await old.fill('#c-name', 'Jo');
  await old.click('#c-boulderer');
  await old.click('#o-desert');
  const startsWith = await old.evaluate(() => document.querySelector('#c-go small')?.textContent ?? '');
  await old.click('#c-go');
  await old.waitForSelector('#create', { state: 'detached' });
  const kid = await old.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  // Phase 31.1: Robin's book beside Jo's, which starts empty of Robin's entries; what Robin
  // did, kept; a share of the money, and the Start button said what Jo would have.
  if (
    kid.climber.name !== 'Jo' ||
    kid.day !== 381 ||
    kid.family?.forebear !== 'Robin' ||
    kid.family.gen !== 2 ||
    kid.firsts.rsopen?.by !== 'kin:Robin' ||
    kid.family.books?.[0]?.name !== 'Robin' ||
    kid.family.books[0].record.retired !== 380 ||
    kid.record.retired !== undefined ||
    kid.family.career?.how !== 'chose' ||
    kid.family.career.age !== 43 ||
    !startsWith.startsWith(`$${kid.cash},`) ||
    kid.life.retired !== null
  )
    await fail(
      `old: the kid's save: ${JSON.stringify({ name: kid.climber.name, day: kid.day, cash: kid.cash, startsWith, family: kid.family })}`,
    );
  // Desert Locals start at Roadside: wait for the scene, then the You page.
  await old.waitForSelector('#h-you');
  await old.click('#h-you');
  await old.waitForSelector('#family');
  const fam = await old.evaluate(() => document.querySelector('#family')?.textContent ?? '');
  if (!/^Generation 2, after Robin\. Their lines: Second Wind \(V7, Roadside Crag\)\./.test(fam))
    await fail(`old: the family row: ${fam}`);
  const actRow = await old.evaluate(() => document.querySelector('#act')?.textContent ?? '');
  if (!/^Act I, Their Shadow · 1 of 5 · The keys$/.test(actRow)) await fail(`old: the kid's act: ${actRow}`);
  log(`old: Jo climbs on: ${fam.slice(0, 70)} · ${actRow}`);
  await old.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-heir-you.png`) });
  // Phase 31.2-31.3 (criterion 1): that night Robin's at the fire. Jo sits with them, is given
  // a line, and asks about one of Robin's, learning its next beta as told.
  const night = await reloadWith(old, (f) => ({
    ...f,
    state: { ...f.state, at: 'lot', x: null, min: 20 * 60, encounter: null },
  }));
  await old
    .locator('button.hot[aria-label="Your van"]')
    .first()
    .evaluate((el) => el.click());
  await old.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === 'Your van');
  await old.locator('#sheet .opt', { hasText: 'The fire' }).first().click();
  await old.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === 'The fire');
  const fire = await sheet();
  if (!/Robin, and a camp chair with your name on it/.test(fire))
    await fail(`old: Robin at the fire: ${fire.slice(0, 200)}`);
  const told = (st) => Object.values(st.routes).reduce((t, l) => t + l.told.length, 0);
  const before = told(night.state);
  await old.locator('#sheet .opt', { hasText: 'Sit with Robin' }).first().click();
  await old.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === 'The fire');
  await old.locator('#sheet .opt', { hasText: 'Ask Robin about' }).first().click();
  await old.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === 'The fire');
  const lit = await old.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  const said = lit.log.slice(-4).map((l) => l.text);
  if (
    !said.some((t) => t.startsWith('Robin has a camp chair at the fire now')) ||
    !said.some((t) => t.includes('“One thing.')) ||
    !said.some((t) => t.startsWith('Robin draws ')) ||
    told(lit) !== before + 1 ||
    !lit.seen.includes('forebear-met')
  )
    await fail(`old: the night with Robin: ${JSON.stringify(said)}`);
  log(`old: ${said.find((t) => t.startsWith('Robin draws '))?.slice(0, 120)}`);
  await old.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-heir-fire.png`) });
  await ctx.close();
}

console.log('The Line');
// Phase 16.3: a climber on Act V's last stage who has just put up the myth above Threshold,
// close to Hazel, with the dog. The next thing they do ends the story: the naming at the
// fire, who was there, the credits, then what now; they keep climbing.
{
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')));
  saved.state = {
    ...saved.state,
    day: 420,
    min: 10 * 60,
    at: 'lot',
    x: null,
    encounter: null,
    goals: 23,
    people: { ...saved.state.people, hazel: { bond: 4, last: 419 } },
    firsts: { ...saved.state.firsts, cmyth: { name: 'The Long Dark', call: 0, day: 419 } },
    dog: { name: 'Scout', since: 100, fed: 80, bond: 60 },
  };
  saved.state.life = { held: 0, told: 45, retired: null };
  saved.state.year = { ...saved.state.year, recapped: 7 };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    if (localStorage.getItem('dirtbag.save') === null) localStorage.setItem('dirtbag.save', s);
  }, JSON.stringify(saved));
  const end = await ctx.newPage();
  end.on('pageerror', (e) => problems.push(`line: uncaught: ${e.message}`));
  end.on('console', (m) => m.type() === 'error' && problems.push(`line: console.error: ${m.text()}`));
  await end.goto(server.url, { waitUntil: 'load' });
  const sheet = () => end.evaluate(() => document.querySelector('#sheet')?.textContent ?? '');
  const titled = (t) =>
    end.waitForFunction((t) => document.querySelector('#sheet-title')?.textContent === t, t, {
      timeout: 8000,
    });
  // A few steps across the Lot, by keyboard, are enough to set it off, once the game's up to
  // hear them; again if the first steps came too soon.
  await end.waitForSelector('#h-time');
  for (let i = 0; i < 4; i++) {
    await end.keyboard.down(i % 2 ? 'ArrowRight' : 'ArrowLeft');
    await end.waitForTimeout(400);
    await end.keyboard.up(i % 2 ? 'ArrowRight' : 'ArrowLeft');
    const t = await end.evaluate(() => document.querySelector('#sheet-title')?.textContent ?? '');
    if (t === 'The naming') break;
    await end.waitForTimeout(600);
  }
  await titled('The naming');
  const naming = await sheet();
  if (!/“The Long Dark”/.test(naming) || !/V18, at The Crucible/.test(naming))
    await fail(`line: the naming: ${naming}`);
  log(`line: ${naming.slice(0, 120)}`);
  await end.locator('#sheet .opt', { hasText: 'Go on' }).first().click();
  await titled('Who was there');
  const there = await sheet();
  if (!/Hazel is at the bottom/.test(there) || !/Scout slept through the whole thing/.test(there))
    await fail(`line: who was there: ${there}`);
  await end.locator('#sheet .opt', { hasText: 'Go on' }).first().click();
  await titled('The Line');
  if (!/RCJ Labs/.test(await sheet())) await fail(`line: the credits: ${await sheet()}`);
  await end.locator('#sheet .opt', { hasText: 'Go on' }).first().click();
  await titled('What now?');
  await end.screenshot({ path: join(OUT, `${String(++n).padStart(2, '0')}-line-choice.png`) });
  await end.locator('#sheet .opt', { hasText: 'Keep climbing' }).first().click();
  // Anything queued behind The Line (the book's cards for a first ascent) comes up after.
  await end.waitForFunction(() => document.querySelector('#sheet-title')?.textContent !== 'What now?');
  log(
    `line: then ${await end.evaluate(() => document.querySelector('#sheet-title')?.textContent ?? 'nothing')}`,
  );
  const st = await end.evaluate(() => JSON.parse(localStorage.getItem('dirtbag.save')).state);
  if (st.goals !== 24 || st.life.retired !== null)
    await fail(`line: the save: ${JSON.stringify({ goals: st.goals, life: st.life })}`);
  log('line: the naming, who was there, the credits, kept climbing');
  await ctx.close();
}

console.log('Something broke');
// Phase 15.2: a crash shows the error screen, not a blank page. One thrown on purpose outside
// React, as the frame loop or a handler would: the screen says the save is safe, hands it over
// as a file, shows what went wrong (the build and the error; since 19.4 the day, the seed and the
// last moves, no name typed) to copy, and lets the game carry on. This page expects its one
// error; nothing else may go wrong.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(server.url, { waitUntil: 'load' });
  await p.waitForSelector('#c-name');
  await p.fill('#c-name', 'Wren');
  await p.click('#c-go');
  await p.waitForFunction(() => !document.querySelector('#create'));
  await p.evaluate(() =>
    setTimeout(() => {
      throw new Error('e2e: broken on purpose');
    }),
  );
  await p.waitForSelector('#crash');
  await p.screenshot({ path: join(OUT, 'crash.png') });
  const said = await p.inputValue('#crash-said');
  const version = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8')).version;
  if (
    !said.startsWith(`Dirtbag ${version}, web`) ||
    !/Error: e2e: broken on purpose/.test(said) ||
    !/^Day 1, .*; seed \S+$/m.test(said) ||
    !/^Last moves:$/m.test(said) ||
    !/: create name=… start=/.test(said) ||
    /Wren/.test(said)
  )
    await fail(`crash: what it says: ${said}`);
  if (!/Your save is as it was after your last move/.test(await p.textContent('#crash')))
    await fail('crash: the save line');
  const [file] = await Promise.all([p.waitForEvent('download'), p.click('#crash-save')]);
  const kept = JSON.parse(readFileSync(await file.path(), 'utf8'));
  if (kept.state?.climber?.name !== 'Wren')
    await fail(`crash: the save as a file: ${kept.state?.climber?.name}`);
  if (await p.locator('#crash-mail').count()) await fail('crash: a mail button with nowhere to send it');
  await p.click('#crash-on');
  await p.waitForFunction(() => !document.querySelector('#crash'));
  // Carried on: the game answers as before.
  await p.locator('#b-nav', { hasText: 'Map' }).click();
  await p.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Close');
  if (errors.length !== 1)
    problems.push(`crash: errors besides the one on purpose: ${errors.slice(1).join('; ')}`);
  log(
    'crash: the screen, the save as a file, what went wrong and the last moves (no name typed), carried on',
  );
  await ctx.close();
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
