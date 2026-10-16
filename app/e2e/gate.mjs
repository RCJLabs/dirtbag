// The gate (Phase 19.1), switched on as it will be at launch, on its own build: `npm run
// build:gated` first. A climber who was here before its first start keeps the full game; one
// who starts after plays the first season, to its last card; and once that one's unlocked, the
// same climber carries on from the same morning. It fails on any error, failed request or
// request that leaves the site, as the playthrough does.
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { startServer } from '../../scripts/lib/serve.mjs';

const APP = new URL('..', import.meta.url).pathname;
const OUT = join(APP, 'e2e-artifacts');
mkdirSync(OUT, { recursive: true });
const server = await startServer({ root: join(APP, 'dist-gated') });
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
    if (!u.startsWith(server.url) && !u.startsWith('data:') && !u.startsWith(`blob:${server.url}`))
      problems.push(`left the site: ${u}`);
  });
  return ctx;
}

async function fail(msg) {
  await page?.screenshot({ path: join(OUT, 'gate-failed.png') }).catch(() => {});
  console.error(`\n✗ ${msg}`);
  if (problems.length) console.error(problems.join('\n'));
  await browser.close();
  await server.close();
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
await page.screenshot({ path: join(OUT, 'gate-end.png') });
ok('and ends on the last card, the morning after Dex’s race');

// 3. Unlocked (as Play's will, 19.2): the same climber, the same morning, the full game.
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

if (problems.length) await fail('problems on the way');
await browser.close();
await server.close();
console.log('\n✓ The gate lets the climbers from before it through, and holds the rest to the first season.');
