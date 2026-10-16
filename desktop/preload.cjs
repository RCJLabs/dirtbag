// The one bridge between the game's page and the desktop (Phase 14.3): the game's keys in the
// user-data file, the window's full screen, and quitting. Nothing else of Electron or Node
// reaches the page. A sandboxed preload must be CommonJS.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dirtbagDesktop', {
  all: () => ipcRenderer.sendSync('store:all'),
  set: (key, value) => ipcRenderer.sendSync('store:set', key, value),
  remove: (key) => ipcRenderer.sendSync('store:remove', key),
  fullscreen: (on) => ipcRenderer.sendSync('window:fullscreen', on),
  quit: () => ipcRenderer.send('window:quit'),
});
