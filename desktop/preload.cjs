// The one bridge between the game's page and the desktop (Phase 14.3): the game's keys in the
// user-data file, the window's full screen, quitting, (14.4) Steam's achievements, (14.6b)
// whether it's a Deck and Steam's keyboard, and (15.3) the full game's store page and a mail
// for the player's own mail app. Nothing else of Electron or Node reaches the page.
// A sandboxed preload must be CommonJS.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dirtbagDesktop', {
  all: () => ipcRenderer.sendSync('store:all'),
  set: (key, value) => ipcRenderer.sendSync('store:set', key, value),
  remove: (key) => ipcRenderer.sendSync('store:remove', key),
  fullscreen: (on) => ipcRenderer.sendSync('window:fullscreen', on),
  quit: () => ipcRenderer.send('window:quit'),
  achieve: (names) => ipcRenderer.sendSync('steam:achieve', names),
  deck: () => ipcRenderer.sendSync('steam:deck'),
  keyboard: (x, y, w, h) => ipcRenderer.send('steam:keyboard', x, y, w, h),
  toStore: () => ipcRenderer.sendSync('steam:store'),
  mail: (url) => ipcRenderer.sendSync('desktop:mail', url),
});
