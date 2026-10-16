// The gate (Phase 19.1), switched on as it will be at launch, on its own build: `npm run
// build:gated` first. A climber who was here before its first start keeps the full game; one
// who starts after plays the first season, to its last card; and once that one's unlocked, the
// same climber carries on from the same morning. Then in the Android app (19.2), with Play
// faked: the unlock at Play's price, bought and restored. It fails on any error, failed request
// or request that leaves the site, as the playthrough does.
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { startServer } from '../../scripts/lib/serve.mjs';

const APP = new URL('..', import.meta.url).pathname;
const OUT = join(APP, 'e2e-artifacts');
mkdirSync(OUT, { recursive: true });
const server = await startServer({ root: join(APP, 'dist-gated') });
// Phase 19.4: today's build, the gate off, for the tester's link (`npm run build` first).
const today = await startServer({ root: join(APP, 'dist') });
const ours = (u) => [server.url, today.url].some((s) => u.startsWith(s) || u.startsWith(`blob:${s}`));
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chromium' },
);
const problems = [];
let page;

// A browser of its own: its own storage, as a player's.
async function fresh() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && problems.push(`console.error: ${m.text()}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  page.on('request', (r) => {
    const u = r.url();
    if (!ours(u) && !u.startsWith('data:')) problems.push(`left the site: ${u}`);
  });
  return ctx;
}

async function fail(msg) {
  await page?.screenshot({ path: join(OUT, 'gate-failed.png') }).catch(() => {});
  console.error(`\n✗ ${msg}`);
  if (problems.length) console.error(problems.join('\n'));
  await browser.close();
  await server.close();
  await today.close();
  process.exit(1);
}
const ok = (what) => console.log(`✓ ${what}`);
const text = (sel) => page.evaluate((q) => document.querySelector(q)?.textContent?.trim() ?? null, sel);
const stored = (k) => page.evaluate((key) => localStorage.getItem(key), k);

// The map's pins, closing it after.
const FULL = ['moon', 'mesa', 'stone', 'wind', 'crucible', 'cove'];
async function pins() {
  await page.keyboard.press('m');
  await page.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Close');
  await page.waitForTimeout(400);
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('.pin')].map((p) => p.id.replace(/^pin-/, '')),
  );
  await page.keyboard.press('m');
  await page.waitForFunction(() => document.querySelector('#b-nav')?.textContent !== 'Close');
  return { ids, full: FULL.every((p) => ids.includes(p)), demo: !ids.some((p) => FULL.includes(p)) };
}

// 1. A climber here before the gate: two hundred days in, saved before its first start.
{
  const ctx = await fresh();
  const fixture = readFileSync(join(APP, 'src/sim/fixtures/save-v75.json'), 'utf8');
  await ctx.addInitScript((raw) => {
    if (!localStorage.getItem('dirtbag.gate')) localStorage.setItem('dirtbag.save', raw);
  }, fixture);
  await page.goto(server.url, { waitUntil: 'load' });
  await page.waitForFunction(() => /Day 201/.test(document.querySelector('#h-time')?.textContent ?? ''));
  await page.waitForTimeout(500);
  while (await page.locator('#sheet .x').count()) {
    await page.locator('#sheet .x').first().click();
    await page.waitForTimeout(200);
  }
  if ((await stored('dirtbag.unlock')) !== '{"how":"before"}' || (await stored('dirtbag.gate')) !== '1')
    await fail(`the climber from before: unlock ${await stored('dirtbag.unlock')}`);
  const map = await pins();
  if (!map.full) await fail(`the climber from before, the map: ${map.ids.join(', ')}`);
  ok('a climber from before the gate keeps the full game');
  await ctx.close();
}

// 2. A climber after it: the first season, on the full game's keys.
const ctx = await fresh();
await page.goto(server.url, { waitUntil: 'load' });
await page.waitForSelector('#create');
if (!/^The demo: /.test((await text('#c-demo')) ?? ''))
  await fail(`the first screen: ${await text('#c-demo')}`);
await page.fill('#c-name', 'Kit');
await page.click('#c-go');
await page.waitForFunction(() => !document.querySelector('#create'));
await page.waitForTimeout(500);
const keys = await page.evaluate(() => Object.keys(localStorage).sort());
if (keys.includes('dirtbag.unlock') || !keys.includes('dirtbag.gate') || !keys.includes('dirtbag.save'))
  await fail(`a climber after the gate, the keys: ${keys.join(', ')}`);
const first = await pins();
if (!first.demo || !first.ids.includes('road'))
  await fail(`after the gate, the map: ${first.ids.join(', ')}`);
ok(`a climber after the gate plays the first season: ${first.ids.join(', ')}`);

// The morning after Dex's race: the last card.
const file = JSON.parse(await stored('dirtbag.save'));
const day = file.state.day + 6;
file.state = {
  ...file.state,
  day,
  goals: 5,
  firsts: { ...file.state.firsts, rsopen: { name: 'Hers Now', call: 0, day: day - 1, by: 'dex' } },
};
await page.evaluate((s) => localStorage.setItem('dirtbag.save', s), JSON.stringify(file));
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === 'That’s the season');
if (await page.locator('#sheet .x').count()) await fail('the last card can be closed');
// Phase 19.2: Play's unlock is the Android app's; a browser has no Play to ask.
if (await page.locator('#sheet .opt', { hasText: 'Unlock the full game' }).count())
  await fail('Play’s unlock offered in a browser');
await page.screenshot({ path: join(OUT, 'gate-end.png') });
ok('and ends on the last card, the morning after Dex’s race');

// 3. Unlocked, however it was: the same climber, the same morning, the full game.
await page.evaluate(() => localStorage.setItem('dirtbag.unlock', JSON.stringify({ how: 'play' })));
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(
  (d) => (document.querySelector('#h-time')?.textContent ?? '').includes(`Day ${d}`),
  day,
);
await page.waitForTimeout(800);
if ((await text('#sheet-title')) === 'That’s the season') await fail('unlocked, and still the last card');
while (await page.locator('#sheet .x').count()) {
  await page.locator('#sheet .x').first().click();
  await page.waitForTimeout(200);
}
const after = await pins();
const kept = JSON.parse(await stored('dirtbag.save'));
if (!after.full || kept.state.climber.name !== 'Kit' || kept.state.day !== day)
  await fail(`unlocked: ${kept.state.climber.name}, day ${kept.state.day}; ${after.ids.join(', ')}`);
await page.waitForTimeout(600);
await page.screenshot({ path: join(OUT, 'gate-unlocked.png') });
ok(`unlocked, Kit carries on from day ${day} with the whole valley`);
await ctx.close();

// 4. In the Android app (19.2), with Play as the page sees it: the Digital Goods API and Payment
// Request, faked here. What the account has bought, and how Play's sheet answers, are kept
// beside the game's keys so they last a reload, as Play's would.
async function inTheApp(preset = null) {
  const c = await fresh();
  await c.addInitScript((p) => {
    // The preset goes in once: later loads find what the game has made of it since.
    if (p && !localStorage.getItem('e2e.preset')) {
      for (const [k, v] of Object.entries(p)) localStorage.setItem(k, v);
      localStorage.setItem('e2e.preset', '1');
    }
    const bought = () =>
      localStorage.getItem('e2e.play') === 'bought' ? [{ itemId: 'full_game', purchaseToken: 'e2e' }] : [];
    const service = {
      getDetails: async (ids) => ids.map((itemId) => ({ itemId, price: { currency: 'USD', value: '4.99' } })),
      listPurchases: async () => bought(),
    };
    window.getDigitalGoodsService = async (method) => {
      if (method !== 'https://play.google.com/billing') throw new Error('no such service');
      return service;
    };
    window.PaymentRequest = class {
      constructor(methods) {
        if (methods[0]?.data?.sku !== 'full_game')
          throw new Error(`asked Play for ${JSON.stringify(methods)}`);
      }
      async show() {
        if (localStorage.getItem('e2e.sheet') === 'cancel') throw new DOMException('cancelled', 'AbortError');
        localStorage.setItem('e2e.play', 'bought');
        return { details: { purchaseToken: 'e2e' }, complete: async () => undefined };
      }
    };
  }, preset);
  return c;
}
const pastTheRace = JSON.stringify(file);
const opt = (label) => page.locator('#sheet .opt', { hasText: label }).first();
const toast = async (re) => {
  await page
    .waitForFunction(
      (src) => new RegExp(src).test(document.querySelector('#toast')?.textContent ?? ''),
      re.source,
      {
        timeout: 5000,
      },
    )
    .catch(() => fail(`no toast saying ${re}`));
};
{
  const c = await inTheApp({ 'dirtbag.gate': '1', 'dirtbag.save': pastTheRace });
  await page.goto(server.url, { waitUntil: 'load' });
  await page.waitForFunction(
    () => document.querySelector('#sheet-title')?.textContent === 'That’s the season',
  );
  await opt('Unlock the full game')
    .waitFor({ timeout: 5000 })
    .catch(() => fail('no unlock on the app’s last card'));
  const card = (await text('#sheet')) ?? '';
  if (!/Once, through Google Play: \$4\.99\./.test(card) || !/carries on from this morning/.test(card))
    await fail(`the app's last card: ${card.slice(0, 400)}`);
  await page.screenshot({ path: join(OUT, 'gate-play.png') });
  ok('in the Android app, the last card offers the unlock at Play’s price');

  await opt('You’ve bought it already').click();
  await toast(/Play has no purchase of the full game/);
  await page.evaluate(() => localStorage.setItem('e2e.sheet', 'cancel'));
  await opt('Unlock the full game').click();
  await page.waitForTimeout(500);
  if ((await text('#sheet-title')) !== 'That’s the season' || (await stored('dirtbag.unlock')))
    await fail('a cancelled purchase changed something');
  ok('nothing bought, nothing found; a cancel leaves the card as it was');

  await page.evaluate(() => localStorage.setItem('e2e.sheet', 'buy'));
  await Promise.all([page.waitForEvent('load'), opt('Unlock the full game').click()]);
  await page.waitForFunction(() => !!document.querySelector('#h-time'));
  await page.waitForTimeout(800);
  if (
    (await stored('dirtbag.unlock')) !== '{"how":"play"}' ||
    (await text('#sheet-title')) === 'That’s the season'
  )
    await fail(`bought, and still locked: ${await stored('dirtbag.unlock')}`);
  ok('bought: the game opens again, unlocked, on the same morning');
  await c.close();
}
{
  // A new phone: the climber's save brought over, the gate already started, Play's purchase there.
  const c = await inTheApp({ 'dirtbag.gate': '1', 'dirtbag.save': pastTheRace, 'e2e.play': 'bought' });
  await page.goto(server.url, { waitUntil: 'load' });
  await page
    .waitForFunction(() => localStorage.getItem('dirtbag.unlock') === '{"how":"play"}', null, {
      timeout: 10_000,
    })
    .catch(() => fail('Play’s purchase wasn’t restored at start-up'));
  await page.waitForFunction(() => !!document.querySelector('#h-time'));
  await page.waitForTimeout(1500);
  if ((await text('#sheet-title')) === 'That’s the season') await fail('restored, and still the last card');
  ok('on a new phone, Play’s purchase opens the game at start-up');
  await c.close();
}

// 5. A tester's link (19.4) on today's site, the gate off: a licence tester's own climber, two
// hundred days in and marked as from before, opens `?gate=try` in the app. The gate shuts for
// that tab alone, the climber stops at the season's last card (never set aside as a save that
// won't load), Play's unlock is bought, and the game opens again on the same climber.
{
  const fixture = readFileSync(join(APP, 'src/sim/fixtures/save-v75.json'), 'utf8');
  const c = await inTheApp({ 'dirtbag.save': fixture, 'dirtbag.unlock': JSON.stringify({ how: 'before' }) });
  await page.goto(`${today.url}?gate=try`, { waitUntil: 'load' });
  await page
    .waitForFunction(
      () => document.querySelector('#sheet-title')?.textContent === 'That’s the season',
      null,
      {
        timeout: 10_000,
      },
    )
    .catch(() => fail('the tester’s link didn’t shut the gate'));
  await opt('Unlock the full game')
    .waitFor({ timeout: 5000 })
    .catch(() => fail('no unlock on the tester’s card'));
  const keys = await page.evaluate(() => Object.keys(localStorage));
  if (keys.some((k) => k.startsWith('dirtbag.save.corrupt')) || (await stored('dirtbag.save')) !== fixture)
    await fail(`the tester's climber was set aside: ${keys.join(', ')}`);
  ok('a tester’s link shuts the gate for that tab; their climber waits at the last card, untouched');
  await Promise.all([page.waitForEvent('load'), opt('Unlock the full game').click()]);
  await page.waitForFunction(() => !!document.querySelector('#h-time'));
  await page.waitForTimeout(1200);
  if (
    (await stored('dirtbag.unlock')) !== '{"how":"play"}' ||
    (await text('#sheet-title')) === 'That’s the season'
  )
    await fail(`the tester bought it, and it's still shut: ${await stored('dirtbag.unlock')}`);
  ok('bought on the tester’s link: open again, the same climber');
  await c.close();
}
{
  // The same site without the link: the gate's off, as it is for everyone.
  const c = await fresh();
  const fixture = readFileSync(join(APP, 'src/sim/fixtures/save-v75.json'), 'utf8');
  await c.addInitScript((raw) => {
    if (!localStorage.getItem('dirtbag.save')) localStorage.setItem('dirtbag.save', raw);
  }, fixture);
  await page.goto(today.url, { waitUntil: 'load' });
  await page.waitForFunction(() => /Day 201/.test(document.querySelector('#h-time')?.textContent ?? ''));
  await page.waitForTimeout(800);
  if ((await text('#sheet-title')) === 'That’s the season') await fail('the gate shut without the link');
  ok('without the link, today’s site is open to everyone');
  await c.close();
}

if (problems.length) await fail('problems on the way');
await browser.close();
await server.close();
await today.close();
console.log(
  '\n✓ The gate lets the climbers from before it through, holds the rest to the first season, and opens to Play’s unlock.',
);
