// The desktop build (Phase 14.3, Evan's call): the game the site serves, in a window of its
// own, for Steam. Electron, so it's the same Chromium the game is tuned on. It serves the
// built game from app:// (no network, no service worker), keeps the game's keys in a file in
// the user-data folder for Steam Cloud, and lets sound start without a tap, since a
// controller's press doesn't count as one.
import { app, BrowserWindow, ipcMain, Menu, net, protocol } from 'electron';
import { existsSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fileStore } from './store.js';
import { keepWindow, loadWindow } from './window.js';

const HERE = fileURLToPath(new URL('.', import.meta.url));
// The game: copied in beside this file for a packaged build, or the repo's own build.
const GAME = existsSync(join(HERE, 'game', 'index.html'))
  ? join(HERE, 'game')
  : join(HERE, '..', 'app', 'dist');
const ORIGIN = 'app://game';

// A test runs in a folder of its own, never a player's.
if (process.env.DIRTBAG_USER_DATA) app.setPath('userData', process.env.DIRTBAG_USER_DATA);

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

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
    title: 'Dirtbag',
    backgroundColor: '#14141a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(HERE, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
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
