// ============================================================
// Concord — Electron Preload Script
// Exposes safe APIs to the renderer process
// ============================================================

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
  },
});
