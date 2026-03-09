const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  // Identificadores
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,

  // Configuración
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),

  // Versión
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Impresión
  printPage: () => ipcRenderer.invoke('print-page'),

  // Base de datos
  executeSql: (query, params) => ipcRenderer.invoke('execute-sql', { query, params }),

  // Instancia
  getInstanceInfo: () => ipcRenderer.invoke('get-instance-info'),
  setInstanceInfo: (info) => ipcRenderer.invoke('set-instance-info', info),

  // Backup
  createBackup: () => ipcRenderer.invoke('create-backup')
});

console.log('[Violet ERP] Preload cargado - Plataforma:', process.platform);
console.log('[Violet ERP] APIs expuestas:', Object.keys(window.electronAPI || {}));
