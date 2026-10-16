// The desktop build's first minute (Phase 14.3): it opens on the game; a new climber is saved
// to the user-data file and nowhere in the browser's storage; with Steam off, achievements do
// nothing (14.4); a relaunch starts where it left off; nothing is asked of anywhere but app://;
// and Quit in Settings closes it. Needs the game built (app/dist) and a display (xvfb-run on a
// Linux runner); `node smoke.mjs <executable>` runs it on a packed build instead. Playwright is
// the root's pinned one, as the e2e's is.
import { mkdtempSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const HERE = fileURLToPath(new URL('.', import.meta.url));
// This package's pinned Electron, which Playwright (installed at the root) can't find itself;
// or, given a packed build's executable, that, with the app inside it.
const packed = process.argv[2];
const executablePath = packed ?? createRequire(import.meta.url)('electron');
const data = mkdtempSync(join(tmpdir(), 'dirtbag-desktop-'));
const problems = [];
// Chromium won't sandbox as root (a container); a player's machine never runs it so.
const args = [...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), ...(packed ? [] : [HERE])];

async function launch() {
  const app = await electron.launch({
    executablePath,
    args,
    env: { ...process.env, DIRTBAG_USER_DATA: data, DIRTBAG_STEAM: 'off' },
  });
  const page = await app.firstWindow();
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && problems.push(`console.error: ${m.text()}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith('app://game/') && !u.startsWith('data:') && !u.startsWith('blob:app://game/'))
      problems.push(`asked something of ${u}`);
  });
  return { app, page };
}

let app;
let page;
async function fail(why) {
  console.error(`\n✗ ${why}`);
  if (problems.length) console.error(problems.join('\n'));
  await app?.close().catch(() => undefined);
  process.exit(1);
}
const ok = (what) => console.log(`✓ ${what}`);
const keys = () => JSON.parse(readFileSync(join(data, 'dirtbag.json'), 'utf8')).keys;

({ app, page } = await launch());
await page.waitForSelector('#create', { timeout: 30_000 }).catch(() => fail('the game never opened'));
const title = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.getTitle());
if (!/Dirtbag/.test(title ?? '')) await fail(`the window's title: ${title}`);
ok(`opens on the game (${title})`);

await page.fill('#c-name', 'Robin');
await page.click('#c-go');
await page.waitForSelector('#h-time', { timeout: 15_000 });
await page.waitForFunction(() => !document.querySelector('#create'));
const saved = JSON.parse(keys()['dirtbag.save'] ?? 'null');
if (saved?.state?.climber?.name !== 'Robin') await fail('the new climber isn’t in the save file');
const leaked = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('dirtbag')));
if (leaked.length) await fail(`the browser's storage holds ${leaked.join(', ')}`);
// app:// can't have a worker at all: Chromium refuses even to list them there.
const worker = await page.evaluate(async () => {
  try {
    return (await navigator.serviceWorker?.getRegistrations?.())?.length ?? 0;
  } catch {
    return 0;
  }
});
if (worker) await fail('a service worker registered');
ok('a new climber, saved to the user-data file, nothing in the browser’s storage, no worker');

// Phase 14.4: with Steam off, the stub: achievements ask nothing and unlock nothing, and a name
// Steam wouldn't take is turned away before it gets that far.
const unlocked = await page.evaluate(() => [
  window.dirtbagDesktop.achieve(['FIRSTSEND']),
  window.dirtbagDesktop.achieve(['not a name']),
]);
if (unlocked.join() !== '0,0') await fail(`achievements with Steam off: ${unlocked}`);
ok('Steam off: the Record Book’s achievements are a quiet no');

await app.close();
({ app, page } = await launch());
await page.waitForSelector('#h-time', { timeout: 30_000 }).catch(() => fail('the relaunch never opened'));
if (await page.locator('#create').count()) await fail('the relaunch forgot the climber');
ok('a relaunch starts where it left off');

await page.keyboard.press('m');
await page.waitForFunction(() => document.querySelector('#b-nav')?.textContent === 'Close');
await page.waitForTimeout(400);
await page.click('#b-settings');
await page.waitForSelector('#s-quit');
const closed = new Promise((r) => app.on('close', r));
await page.click('#s-quit');
const quit = await Promise.race([
  closed.then(() => true),
  new Promise((r) => setTimeout(() => r(false), 10_000)),
]);
if (!quit) await fail('Quit didn’t close it');
const win = JSON.parse(readFileSync(join(data, 'window.json'), 'utf8'));
if (!(win.width >= 360 && win.height >= 600))
  await fail(`the window kept for next time: ${JSON.stringify(win)}`);
ok('Quit, from Settings, and the window kept for next time');

if (problems.length) await fail('problems on the way');
console.log(
  '\n✓ The desktop build opens, saves to its file, comes back, and quits, asking nothing of anywhere but itself.',
);
