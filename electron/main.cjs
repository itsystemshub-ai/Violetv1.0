const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Detectar modo desarrollo de forma confiable
const isDev = !app.isPackaged;

// ═══════════════════════════════════════════════════════════════════════════
// VARIABLES GLOBALES
// ═══════════════════════════════════════════════════════════════════════════

let mainWindow;
let splashWindow;
let logPath;
let logStream;
let db;
let backendServer;
let proxyServer;

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  if (logStream && !logStream.destroyed) {
    try {
      logStream.write(logMessage);
    } catch (err) {
      console.error('Error escribiendo log:', err);
    }
  }
}

function initLogging() {
  try {
    const safeAppName = (app.getName() || 'violet_erp').toLowerCase().replace(/\s+/g, '_');
    logPath = path.join(app.getPath('userData'), `${safeAppName}.log`);
    logStream = fs.createWriteStream(logPath, { flags: 'a' });
    
    log('='.repeat(80));
    log(`${(app.getName() || 'VIOLET ERP').toUpperCase()} - INICIANDO`);
    log('='.repeat(80));
    log(`Versión: ${app.getVersion()}`);
    log(`Modo: ${isDev ? 'DESARROLLO' : 'PRODUCCIÓN'}`);
    log(`app.isPackaged: ${app.isPackaged}`);
    log(`Plataforma: ${process.platform}`);
    log(`__dirname: ${__dirname}`);
    log(`process.resourcesPath: ${process.resourcesPath || 'N/A'}`);
    log(`app.getAppPath(): ${app.getAppPath()}`);
    log(`UserData: ${app.getPath('userData')}`);
    log(`Log: ${logPath}`);
    log('='.repeat(80));
  } catch (err) {
    console.error('Error inicializando logging:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS Y RECURSOS
// ═══════════════════════════════════════════════════════════════════════════

function getDistPath() {
  if (isDev) {
    const devPath = path.join(__dirname, '..', 'dist');
    log(`[getDistPath] Modo desarrollo: ${devPath}`);
    return devPath;
  } else {
    // En producción, dist está en resources/dist
    const prodPath = path.join(process.resourcesPath, 'dist');
    log(`[getDistPath] Modo producción: ${prodPath}`);
    log(`[getDistPath] Existe: ${fs.existsSync(prodPath)}`);
    return prodPath;
  }
}

function findIndexHtml() {
  const possiblePaths = [
    // Ruta principal en producción
    path.join(process.resourcesPath, 'dist', 'index.html'),
    // Ruta en desarrollo
    path.join(__dirname, '..', 'dist', 'index.html'),
    // Rutas alternativas
    path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
    path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
    path.join(app.getAppPath(), 'dist', 'index.html'),
  ];

  log('[findIndexHtml] Buscando index.html en:');
  for (const testPath of possiblePaths) {
    log(`  - ${testPath} ... ${fs.existsSync(testPath) ? '✓ ENCONTRADO' : '✗ no existe'}`);
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }

  log('[findIndexHtml] ✗ No se encontró index.html en ninguna ubicación');
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// BASE DE DATOS SQLite
// ═══════════════════════════════════════════════════════════════════════════

function initDatabase() {
  try {
    const safeAppName = (app.getName() || 'violet_erp').toLowerCase().replace(/\s+/g, '_');
    const dbPath = path.join(app.getPath('userData'), `${safeAppName}.db`);
    
    log(`[DB] Inicializando en: ${dbPath}`);
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    
    // Crear tablas básicas
    db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS sync_logs (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT,
        sync_status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    log('[DB] ✓ Inicializada correctamente');
    return true;
  } catch (err) {
    log(`[DB] ✗ Error: ${err.message}`);
    log(`[DB] Stack: ${err.stack}`);
    
    dialog.showErrorBox(
      'Error de Base de Datos',
      `No se pudo inicializar la base de datos.\n\nError: ${err.message}\n\nPuede que falten dependencias del sistema (Visual C++ Redistributables).\n\nLog: ${logPath}`
    );
    
    return false;
  }
}

function executeSql(query, params = []) {
  try {
    if (!db) {
      throw new Error('Base de datos no inicializada');
    }
    
    const stmt = db.prepare(query);
    const upperQuery = query.trim().toUpperCase();
    
    if (upperQuery.startsWith('SELECT') || upperQuery.includes('RETURNING')) {
      return stmt.all(...params);
    } else {
      return stmt.run(...params);
    }
  } catch (err) {
    log(`[DB] Error ejecutando SQL: ${err.message}`);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    log(`[Config] Error cargando: ${err.message}`);
  }
  
  // Configuración por defecto
  const defaultConfig = {
    windowWidth: 1280,
    windowHeight: 800,
    windowMaximized: true,
    instance_role: 'master',
    master_ip: 'localhost',
    cloud_sync_enabled: false
  };
  
  saveConfigFile(defaultConfig);
  return defaultConfig;
}

function saveConfigFile(data) {
  try {
    const current = loadConfig();
    const updated = { ...current, ...data };
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    log(`[Config] Error guardando: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SPLASH SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  const splashPath = path.join(__dirname, 'splash.html');
  if (fs.existsSync(splashPath)) {
    splashWindow.loadFile(splashPath);
    log('[Splash] ✓ Cargado');
  } else {
    log('[Splash] ✗ No se encontró splash.html');
  }
  
  splashWindow.center();
}

// ═══════════════════════════════════════════════════════════════════════════
// VENTANA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

function createWindow() {
  const config = loadConfig();
  
  mainWindow = new BrowserWindow({
    width: config.windowWidth || 1280,
    height: config.windowHeight || 800,
    show: false,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    title: app.getName() || 'Violet ERP',
    backgroundColor: '#0F172A'
  });

  // Cargar aplicación
  if (isDev) {
    log('[Window] Cargando desde dev server: http://localhost:8080');
    mainWindow.loadURL('http://localhost:8080').catch(err => {
      log(`[Window] ✗ Error cargando dev server: ${err.message}`);
    });
    // mainWindow.webContents.openDevTools();
  } else {
    // En producción, buscar index.html
    const indexPath = findIndexHtml();
    
    // TEMPORAL: Abrir DevTools para debugging
    // mainWindow.webContents.openDevTools();
    
    if (indexPath) {
      log(`[Window] Cargando desde: ${indexPath}`);
      mainWindow.loadFile(indexPath).then(() => {
        log('[Window] ✓ Página cargada exitosamente');
      }).catch(err => {
        log(`[Window] ✗ Error cargando: ${err.message}`);
        dialog.showErrorBox(
          'Error de Carga',
          `No se pudo cargar la aplicación.\n\nError: ${err.message}\n\nRuta: ${indexPath}\n\nLog: ${logPath}`
        );
      });
    } else {
      log('[Window] ✗ No se encontró index.html');
      dialog.showErrorBox(
        'Error Crítico',
        `No se encontró el archivo index.html.\n\nVerifica el log en:\n${logPath}`
      );
    }
  }

  // Eventos de la ventana
  mainWindow.once('ready-to-show', () => {
    log('[Window] Lista para mostrar');
    
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    
    if (config.windowMaximized) {
      mainWindow.maximize();
    }
    
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('close', () => {
    if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
      const bounds = mainWindow.getBounds();
      saveConfigFile({
        windowWidth: bounds.width,
        windowHeight: bounds.height,
        windowMaximized: false
      });
    } else {
      saveConfigFile({ windowMaximized: mainWindow.isMaximized() });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    log('[Window] Cerrada');
  });

  // Abrir enlaces externos en navegador
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Logging de errores
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log(`[Window] Error de carga: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log(`[Window] Proceso de renderizado terminado: ${details.reason}`);
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    log(`[Renderer] ${message}`);
  });

  buildMenu();
  log('[Window] Creada');
}

// ═══════════════════════════════════════════════════════════════════════════
// MENÚ
// ═══════════════════════════════════════════════════════════════════════════

function buildMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Recargar',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'Imprimir',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow && mainWindow.webContents.print()
        },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', role: 'undo' },
        { label: 'Rehacer', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', role: 'cut' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Pegar', role: 'paste' },
        { label: 'Seleccionar todo', role: 'selectAll' }
      ]
    },
    {
      label: 'Vista',
      submenu: [
        { label: 'Recargar', role: 'reload' },
        { label: 'Pantalla completa', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'DevTools', role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: `Violet ERP v${app.getVersion()}`,
          enabled: false
        },
        { type: 'separator' },
        {
          label: 'Ver Logs',
          click: () => {
            shell.showItemInFolder(logPath);
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ═══════════════════════════════════════════════════════════════════════════
// IPC HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

ipcMain.handle('get-config', () => loadConfig());
ipcMain.handle('save-config', (_e, cfg) => saveConfigFile(cfg));
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('print-page', () => {
  if (mainWindow) {
    mainWindow.webContents.print({ silent: false, printBackground: true });
  }
});

// IPC para base de datos
ipcMain.handle('execute-sql', async (_e, { query, params }) => {
  try {
    const result = executeSql(query, params || []);
    return { success: true, data: result };
  } catch (err) {
    log(`[IPC] Error en execute-sql: ${err.message}`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-instance-info', () => {
  const cfg = loadConfig();
  return {
    role: cfg.instance_role || 'master',
    masterIp: cfg.master_ip || 'localhost'
  };
});

ipcMain.handle('set-instance-info', (_e, info) => {
  return saveConfigFile({
    instance_role: info.role,
    master_ip: info.masterIp
  });
});

ipcMain.handle('create-backup', async () => {
  try {
    const defaultPath = path.join(
      app.getPath('documents'),
      `VioletERP_Backup_${new Date().toISOString().split('T')[0]}.db`
    );
    
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar Copia de Seguridad',
      defaultPath: defaultPath,
      filters: [{ name: 'Base de Datos SQLite', extensions: ['db'] }]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    const sourcePath = path.join(app.getPath('userData'), 'violet_erp.db');
    fs.copyFileSync(sourcePath, filePath);
    
    log(`[Backup] Creado en: ${filePath}`);
    return { success: true, path: filePath };
  } catch (err) {
    log(`[Backup] Error: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CICLO DE VIDA
// ═══════════════════════════════════════════════════════════════════════════

app.on('ready', async () => {
  initLogging();
  log('[App] Ready - Iniciando Violet ERP');
  
  // Inicializar base de datos
  const dbInitialized = initDatabase();
  if (!dbInitialized) {
    log('[App] ⚠ Base de datos no inicializada, continuando sin ella');
  }
  
  // Mostrar splash en producción
  if (!isDev) {
    createSplashWindow();
  }
  
  // Crear ventana principal
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    log('[App] Cerrando aplicación');
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  log('[App] Cerrándose - Limpiando recursos');
  
  // Cerrar base de datos
  if (db) {
    try {
      db.close();
      log('[DB] Cerrada');
    } catch (err) {
      log(`[DB] Error cerrando: ${err.message}`);
    }
  }
  
  // Cerrar log
  if (logStream) {
    logStream.end();
  }
});
