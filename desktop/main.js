// The desktop build (Phase 14.3, Evan's call): the game the site serves, in a window of its
// own, for Steam. Electron, so it's the same Chromium the game is tuned on. It serves the
// built game from app:// (no network, no service worker), keeps the game's keys in a file in
// the user-data folder for Steam Cloud, and lets sound start without a tap, since a
// controller's press doesn't count as one. The same code packs the demo (Phase 15.3): its own
// build, user-data folder, title and Steam app (edition.js).
import { app, BrowserWindow, ipcMain, Menu, net, protocol, shell } from 'electron';
import { existsSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { editionOf } from './edition.js';
import { appIdIn, overlayForSteam, startSteam } from './steam.js';
import { fileStore } from './store.js';
import { keepWindow, loadWindow } from './window.js';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const EDITION = editionOf(HERE, process.env);
// The game: copied in beside this file for a packed build, or the repo's own build of this
// edition for a dev run (a copy a pack left behind is never it).
const GAME = app.isPackaged ? join(HERE, 'game') : join(HERE, '..', 'app', EDITION.build);
const ORIGIN = 'app://game';
// The window's icon where the system takes it from the window (Linux); pack.mjs draws it.
const ICON = join(HERE, 'icons', 'dirtbag.png');

// A test runs in a folder of its own, never a player's. The demo keeps a folder of its own
// beside the full game's (which stays where it always was, named for the product).
if (process.env.DIRTBAG_USER_DATA) app.setPath('userData', process.env.DIRTBAG_USER_DATA);
else if (EDITION.demo) app.setPath('userData', join(app.getPath('appData'), EDITION.name));
if (EDITION.demo) app.setName(EDITION.name);

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
overlayForSteam();

// The game's files, and nothing outside them.
async function serve(req) {
  const { host, pathname } = new URL(req.url);
  const file = normalize(join(GAME, decodeURIComponent(pathname === '/' ? '/index.html' : pathname)));
  if (host !== 'game' || !file.startsWith(GAME + sep)) return new Response('Not found', { status: 404 });
  try {
    return await net.fetch(pathToFileURL(file).toString());
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

// Only the game's own page may use the bridge.
const ours = (e) => e.senderFrame?.url?.startsWith(`${ORIGIN}/`) === true;

function open(store, winFile) {
  const at = loadWindow(winFile);
  const win = new BrowserWindow({
    width: at.width,
    height: at.height,
    x: at.x,
    y: at.y,
    minWidth: 360,
    minHeight: 600,
    fullscreen: at.fullscreen,
    title: EDITION.name,
    ...(existsSync(ICON) ? { icon: ICON } : {}),
    backgroundColor: '#14141a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(HERE, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  // The window keeps its edition's name; the page's own title would say only "Dirtbag".
  win.on('page-title-updated', (e) => e.preventDefault());
  // Nothing leaves the game: no new windows, no navigating away.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(`${ORIGIN}/`)) e.preventDefault();
  });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    }
  });
  win.on('close', () => keepWindow(winFile, win));
  void win.loadURL(`${ORIGIN}/index.html`);
  return win;
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.whenReady().then(() => {
    const data = app.getPath('userData');
    const store = fileStore(join(data, 'dirtbag.json'));
    const winFile = join(data, 'window.json');
    // A test can turn Steam off outright, whatever's running on the machine.
    const ids = join(HERE, 'steam.json');
    const steam = startSteam(process.env.DIRTBAG_STEAM === 'off' ? null : appIdIn(ids, EDITION.steamKey));
    protocol.handle('app', serve);
    ipcMain.on('store:all', (e) => (e.returnValue = ours(e) ? store.all() : {}));
    ipcMain.on('store:set', (e, k, v) => {
      e.returnValue = ours(e) && typeof k === 'string' && typeof v === 'string' && store.set(k, v);
    });
    ipcMain.on(
      'store:remove',
      (e, k) => (e.returnValue = ours(e) && typeof k === 'string' && store.remove(k)),
    );
    ipcMain.on('window:fullscreen', (e, on) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (win && ours(e) && typeof on === 'boolean') win.setFullScreen(on);
      e.returnValue = win?.isFullScreen() ?? false;
    });
    ipcMain.on('window:quit', (e) => ours(e) && app.quit());
    // The Record Book's ids, in Steam's capitals; how many unlocked just now.
    ipcMain.on('steam:achieve', (e, names) => {
      const ok =
        Array.isArray(names) && names.length <= 64 && names.every((n) => /^[A-Z0-9_]{1,64}$/.test(n));
      e.returnValue = ours(e) && ok ? steam.achieve(names) : 0;
    });
    // Phase 14.6b: whether this is a Steam Deck, and Steam's keyboard under a text field.
    ipcMain.on('steam:deck', (e) => (e.returnValue = ours(e) && steam.deck));
    ipcMain.on('steam:keyboard', (e, ...box) => {
      const ok = box.length === 4 && box.every((n) => Number.isFinite(n) && n >= 0 && n <= 16384);
      if (ours(e) && ok) steam.keyboard(...box.map(Math.round));
    });
    // Phase 15.3: the full game's store page, in Steam's overlay (the demo's last card asks).
    ipcMain.on('steam:store', (e) => {
      const full = appIdIn(ids);
      e.returnValue = ours(e) && !!full && steam.toStore(full);
    });
    // A mail the player sends from their own mail app (the error screen's report): handed to
    // the system, since the window goes nowhere but the game. Only a mailto: link, and only
    // what the page itself asks for.
    ipcMain.on('desktop:mail', (e, url) => {
      const ok = typeof url === 'string' && url.length <= 8192 && /^mailto:[^\s"<>]+$/.test(url);
      e.returnValue = ours(e) && ok;
      if (e.returnValue) void shell.openExternal(url).catch(() => undefined);
    });
    // macOS keeps its app menu, for Quit and for copy and paste in a name; elsewhere, none.
    Menu.setApplicationMenu(
      process.platform === 'darwin'
        ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }])
        : null,
    );
    let win = open(store, winFile);
    app.on('second-instance', () => {
      if (win.isMinimized()) win.restore();
      win.focus();
    });
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) win = open(store, winFile);
    });
  });
  app.on('window-all-closed', () => app.quit());
}
