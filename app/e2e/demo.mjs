// The demo build (Phase 14.5), from both ends: its first screen says what it is, and its map has
// the demo's places and none of the full game's; then a climber the morning after Dex's race
// gets the last card, can take their save to the full game, and can start over. Run on the
// demo build: `npm run build:demo` first. It fails on any error, failed request or request
// that leaves the site, as the playthrough does.
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { startServer } from '../../scripts/lib/serve.mjs';

const APP = new URL('..', import.meta.url).pathname;
const OUT = join(APP, 'e2e-artifacts');
mkdirSync(OUT, { recursive: true });
const server = await startServer({ root: join(APP, 'dist-demo') });
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chromium' },
);
const problems = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && problems.push(`console.error: ${m.text()}`));
page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
page.on('request', (r) => {
  const u = r.url();
  if (!u.startsWith(server.url) && !u.startsWith('data:') && !u.startsWith(`blob:${server.url}`))
    problems.push(`left the site: ${u}`);
});

async function fail(msg) {
  await page.screenshot({ path: join(OUT, 'demo-failed.png') }).catch(() => {});
  console.error(`\n✗ ${msg}`);
  if (problems.length) console.error(problems.join('\n'));
  await browser.close();
  await server.close();
  process.exit(1);
}
const ok = (what) => console.log(`✓ ${what}`);
const text = (sel) => page.evaluate((q) => document.querySelector(q)?.textContent?.trim() ?? null, sel);

// The first morning: it says it's the demo.
await page.goto(server.url, { waitUntil: 'load' });
await page.waitForSelector('#create');
if (!/^The demo: /.test((await text('#c-demo')) ?? ''))
  await fail(`the demo's first screen: ${await text('#c-demo')}`);
await page.fill('#c-name', 'Kit');
await page.click('#c-go');
await page.waitForFunction(() => !document.querySelector('#create'));
await page.waitForTimeout(500);
ok('the first screen says it’s the demo');

// The map: the demo's crags, the full game's nowhere.
await page.keyboard.press('m');
await page.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Close');
await page.waitForTimeout(500);
const pins = await page.evaluate(() =>
  [...document.querySelectorAll('.pin')].map((p) => p.id.replace(/^pin-/, '')),
);
const full = ['moon', 'mesa', 'stone', 'wind', 'crucible', 'cove', 'bluff', 'hollow', 'cave', 'center'];
if (!pins.includes('road') || !pins.includes('gorge') || pins.some((p) => full.includes(p)))
  await fail(`the demo's map: ${pins.join(', ')}`);
ok(`the map: ${pins.join(', ')}`);

// The morning after Dex's race: Act I done, the open line his the day before.
// Phase 14.5c: the demo keeps its own keys, and none of the full game's.
const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('dirtbag.')));
if (!keys.includes('dirtbag.demo.save') || keys.some((k) => !k.startsWith('dirtbag.demo.')))
  await fail(`the demo's keys: ${keys.join(', ')}`);
ok(`its own keys: ${keys.join(', ')}`);
const raw = await page.evaluate(() => localStorage.getItem('dirtbag.demo.save'));
const file = JSON.parse(raw);
const day = file.state.day + 6;
file.state = {
  ...file.state,
  day,
  goals: 5,
  firsts: { ...file.state.firsts, rsopen: { name: 'Hers Now', call: 0, day: day - 1, by: 'dex' } },
};
await page.evaluate((s) => localStorage.setItem('dirtbag.demo.save', s), JSON.stringify(file));
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === 'That’s the season');
const card = (await text('#sheet')) ?? '';
if (!/Dex got there first/.test(card) || !/Export your save and bring it/.test(card))
  await fail(`the demo's last card: ${card.slice(0, 300)}`);
if (await page.locator('#sheet .x').count()) await fail('the last card can be closed');
await page.screenshot({ path: join(OUT, 'demo-end.png') });
ok('the last card, the morning after Dex took the line');

const [dl] = await Promise.all([
  page.waitForEvent('download'),
  page.locator('#sheet .opt', { hasText: 'Export your save' }).first().click(),
]);
const kept = JSON.parse(readFileSync(await dl.path(), 'utf8'));
if (dl.suggestedFilename() !== `dirtbag-kit-day-${day}.json` || kept.state?.goals !== 5)
  await fail(`the save for the full game: ${dl.suggestedFilename()}`);
ok(`the save, for the full game: ${dl.suggestedFilename()}`);

await page.locator('#sheet .opt', { hasText: 'Start over' }).first().click();
await page.waitForSelector('#create', { timeout: 10_000 }).catch(() => fail('Start over didn’t'));
ok('and a new first morning');

if (problems.length) await fail('problems on the way');
await browser.close();
await server.close();
console.log(
  '\n✓ The demo starts as the demo, keeps to its places, and ends on its last card, the save in hand.',
);
