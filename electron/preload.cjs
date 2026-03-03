const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al proceso de renderizado (el ERP)
contextBridge.exposeInMainWorld('electronAPI', {
  // Identificador de entorno
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,

  // Configuración persistente (AppData/config.json)
  getConfig:  ()      => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg)   => ipcRenderer.invoke('save-config', cfg),

  // Versión de la app
  getVersion: ()      => ipcRenderer.invoke('get-version'),

  // Impresión nativa
  printPage:  ()      => ipcRenderer.invoke('print-page'),
  getInstanceInfo: () => ipcRenderer.invoke('get-instance-info'),
  setInstanceInfo: (info) => ipcRenderer.invoke('set-instance-info', info),
  executeSql: (query, params) => ipcRenderer.invoke('execute-sql', { query, params }),
  mutateRecord: (data) => ipcRenderer.invoke('mutate-record', data),
  createBackup: () => ipcRenderer.invoke('create-backup'),
  getSyncLogs: () => ipcRenderer.invoke('get-sync-logs'),
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('[Violet ERP] Preload activado — plataforma:', process.platform);
});
