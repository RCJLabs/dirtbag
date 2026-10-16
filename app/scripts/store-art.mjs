// Phase 15.1: the store page's art and screenshots, made from the game itself.
//
//   npm run build && npm run store:art      (Playwright comes from the repo root: npm ci there)
//
// Writes store-art/ (not committed: binary, and remade whenever the game changes):
//   steam/   each capsule, the library's art and the community icon, at Steam's sizes, from
//            src/dev/store.ts under Vite's dev server; and the screenshots, 1920 × 1080.
//   play/    the same screenshots on a phone, 1080 × 1920, and the send card.
//   dirtbag-presskit/ and dirtbag-presskit.zip (15.4): the press kit, docs/PRESSKIT.md's words
//            with Steam's description from docs/STORE.md, the logo, the capsules and the shots.
// The screenshots are played on the build: a new climber's first morning, the map, Roadside's
// card, the Warm Boulder's beta, a go on it and its send; then a career two hundred days in
// (the v75 fixture): its fire at night, and its journal's You and Record pages. docs/STORE.md says which goes where.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { startServer } from '../../scripts/lib/serve.mjs';
import { presskit } from './presskit.mjs';

const APP = new URL('..', import.meta.url).pathname;
const OUT = join(APP, 'store-art');
rmSync(OUT, { recursive: true, force: true });
for (const d of ['steam', 'play']) mkdirSync(join(OUT, d), { recursive: true });

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chromium' },
);
const png = (file, dataUrl) => writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
const made = [];

// ---- the art ----

const vite = await createServer({ root: APP, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
await vite.listen();
{
  const page = await browser.newPage();
  page.on('pageerror', (e) => {
    throw e;
  });
  await page.goto(`${vite.resolvedUrls.local[0]}store.html`);
  const art = await page.evaluate(() => window.storeArt);
  for (const [name, url] of Object.entries(art)) {
    png(join(OUT, 'steam', `${name}.png`), url);
    made.push(`steam/${name}.png`);
  }
  await page.close();
}
// The community icon is the game's own, as the home screen has it.
const { iconPng } = await vite.ssrLoadModule('/build/pwa.ts');
writeFileSync(join(OUT, 'steam', 'community-icon.png'), iconPng(184));
made.push('steam/community-icon.png');
await vite.close();

// ---- the screenshots ----

const dist = join(APP, 'dist');
const server = await startServer({ root: dist });
const fixture = JSON.parse(readFileSync(join(APP, 'src/sim/fixtures/save-v75.json'), 'utf8'));
fixture.state.climber.name = 'Robin';

// One run of the screenshots on a screen: Steam's, or a phone's at three device pixels.
async function shoot(dir, viewport, deviceScaleFactor) {
  const page = await browser.newPage({ viewport, deviceScaleFactor });
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  // The valley rolls the e2e's seed, so the first day's weather is the same every run.
  await page.addInitScript(() => {
    const real = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = (a) => {
      if (!(a instanceof Uint32Array) || a.length !== 2) return real(a);
      a.set([1592590338, 3517427878]);
      return a;
    };
  });
  let n = 0;
  // A shot waits for any toast to go: they're the moment's news, not the screen's.
  const shot = async (name) => {
    await wait(700);
    for (let t = 0; t < 80 && (await page.locator('#toast').count()); t++) await wait(100);
    const file = `${dir}/${String(++n).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: join(OUT, file) });
    made.push(file);
  };
  const text = (sel) => page.evaluate((q) => document.querySelector(q)?.textContent ?? '', sel);
  const until = async (what, fn, ms = 15_000) => {
    const t0 = Date.now();
    for (;;) {
      const v = await fn();
      if (v) return v;
      if (Date.now() - t0 > ms) throw new Error(`${dir}: waited too long for ${what}`);
      await wait(100);
    }
  };
  const opt = (name) => page.locator('#sheet .opt', { hasText: name }).first().click();
  // The invisible buttons over the scene and the map, by what they say.
  const hot = (label) =>
    page.evaluate((l) => {
      const b = [...document.querySelectorAll('button.hot')].find((x) =>
        x.getAttribute('aria-label')?.startsWith(l),
      );
      if (!b) throw new Error(`no ${l} to tap`);
      b.click();
    }, label);

  await page.goto(server.url, { waitUntil: 'load' });
  await until('the climber screen', () => page.locator('#create').count());
  await page.fill('#c-name', 'Robin');
  await page.click('#c-go');
  await until('the Lot', async () => !(await page.locator('#create').count()));
  await shot('lot-morning');

  await page.locator('#b-nav', { hasText: 'Map' }).click();
  await until('the map', async () => (await text('#b-nav')) === 'Close');
  await shot('map');

  await hot('Roadside Crag');
  await until('Roadside’s card', async () => /Roadside Crag/.test(await text('#sheet')));
  await shot('place-card');
  await opt('Drive here');
  await until('Roadside', async () => /Boulders on the talus/.test(await text('#hint')), 30_000);

  await hot('Warm Boulder');
  await until('the beta sheet', async () => /Warm Boulder · V2/.test(await text('#sheet')));
  await shot('beta');

  // A go, played as the e2e plays one: held between cruxes, each crux's verb as it asks.
  // The screenshot is taken a little way up, before the first crux.
  for (let go = 1; go <= 3; go++) {
    await page.locator('#sheet .go').first().click();
    await until('the climb panel', () => page.locator('#climb').count());
    const hold = await page.locator('#hold').boundingBox();
    await page.mouse.move(hold.x + hold.width / 2, hold.y + hold.height / 2);
    let down = false;
    const set = async (on) => {
      if (on === down) return;
      down = on;
      await (on ? page.mouse.down() : page.mouse.up());
    };
    let shotUp = go > 1;
    const t0 = Date.now();
    while (Date.now() - t0 < 40_000) {
      const s = await page.evaluate(() => {
        const v = document.getElementById('verb');
        return {
          on: !!document.getElementById('climb') && !document.getElementById('stamp'),
          verb: v?.dataset.verb ?? null,
          m: v ? +v.dataset.m : 0,
          c: v ? +v.dataset.c : 0,
          w: v ? +v.dataset.w : 0,
        };
      });
      if (!s.on) break;
      if (!s.verb) {
        await set(true);
        if (!shotUp && Date.now() - t0 > 1200) {
          shotUp = true;
          await page.screenshot({ path: join(OUT, `${dir}/${String(++n).padStart(2, '0')}-climbing.png`) });
          made.push(`${dir}/${String(n).padStart(2, '0')}-climbing.png`);
        }
        await wait(30);
        continue;
      }
      if (s.verb === 'tension') await set(s.m < s.c);
      else if (s.verb === 'load') await set(s.m < s.c - s.w * 0.3);
      else if (Math.abs(s.m - s.c) < s.w * 0.55) {
        await set(true);
        await wait(30);
        await set(false);
        await wait(220);
      } else await set(false);
      await wait(8);
    }
    await set(false);
    const after = await until('the go to end', async () => (await text('#stamp')) || (await text('#sheet')));
    if (/Sent/.test(after)) break;
    if (go === 3) throw new Error(`${dir}: the Warm Boulder never went`);
    await opt('Rest, then go again');
  }
  await until('the send', async () => /Keep a card of it/.test(await text('#sheet')));
  await shot('sent');
  await opt('Keep a card of it');
  const card = await until('the card', () =>
    page.evaluate(() => {
      const img = document.querySelector('#card');
      return img?.complete && img.naturalWidth ? img.src : null;
    }),
  );
  await shot('card');
  if (dir === 'play') {
    const raw = card.startsWith('data:')
      ? card
      : await page.evaluate(
          (src) =>
            fetch(src)
              .then((r) => r.blob())
              .then(
                (b) =>
                  new Promise((ok) =>
                    Object.assign(new FileReader(), { onload: (e) => ok(e.target.result) }).readAsDataURL(b),
                  ),
              ),
          card,
        );
    png(join(OUT, 'play', 'send-card.png'), raw);
    made.push('play/send-card.png');
  }

  // Two hundred days on: the v75 fixture's career, named for the store, at the Lot at night
  // with its crew; then its Record Book.
  const night = structuredClone(fixture);
  night.state.min = 20 * 60 + 30;
  await page.evaluate((raw) => {
    localStorage.clear();
    localStorage.setItem('dirtbag.save', raw);
  }, JSON.stringify(night));
  await page.reload({ waitUntil: 'load' });
  await until('the career', async () => /Day 201/.test(await text('#h-time')));
  await shot('lot-night');
  // J opens the journal on any screen (the button is only there on a wide one).
  await page.keyboard.press('j');
  await until('the journal', () => page.locator('#j-you').count());
  await page.click('#j-you');
  await shot('journal-you');
  await page.click('#j-book');
  await shot('record-book');

  if (problems.length) throw new Error(`${dir}: ${problems.join('; ')}`);
  await page.close();
}

await shoot('steam', { width: 1920, height: 1080 }, 1);
await shoot('play', { width: 360, height: 640 }, 3);
await server.close();
// Phase 15.4: the press kit, from all of the above and docs/PRESSKIT.md.
made.push(relative(OUT, presskit(OUT)));
await browser.close();
console.log(`✓ ${made.length} files in ${OUT}`);
for (const f of made) console.log(`  ${f}`);
