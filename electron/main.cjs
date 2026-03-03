const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

// Variables globales para logging
let logPath;
let logStream;

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  if (logStream) {
    logStream.write(logMessage);
  }
}

// Inicializar logging después de que app esté ready
function initLogging() {
  logPath = path.join(app.getPath('userData'), 'violet_erp.log');
  logStream = fs.createWriteStream(logPath, { flags: 'a' });
  
  log('='.repeat(80));
  log('INICIANDO VIOLET ERP');
  log('='.repeat(80));
  log(`isDev: ${isDev}`);
  log(`__dirname: ${__dirname}`);
  log(`process.resourcesPath: ${process.resourcesPath}`);
  log(`app.getAppPath(): ${app.getAppPath()}`);
  log(`userData: ${app.getPath('userData')}`);
  log(`Log file: ${logPath}`);
}

// Determinar la ruta base correcta según el entorno
function getBasePath() {
  if (isDev) {
    // En desarrollo, usar la ruta del proyecto
    return path.join(__dirname, '..');
  } else {
    // En producción, los archivos están en app.asar
    return path.join(process.resourcesPath, 'app.asar');
  }
}

// Importar servidor unificado
let startServer, startProxyServer;

try {
  const serverPath = path.join(__dirname, '../backend/server.js');
  log(`Cargando servidor desde: ${serverPath}`);
  
  const serverModule = require(serverPath);
  startServer = serverModule.startServer;
  startProxyServer = serverModule.startProxyServer;
  
  log(`✓ Módulo del servidor cargado correctamente`);
} catch (err) {
  log(`✗ Error al cargar módulo del servidor: ${err.message}`);
  log(`  Stack: ${err.stack}`);
}

// ─── Health Check: SQLite Binary ─────────────────────────────────────────────
// ─── Health Check: SQLite Binary ─────────────────────────────────────────────
async function downloadAndInstallRedist() {
  const https = require('https');
  const { exec } = require('child_process');
  const redistUrl = 'https://aka.ms/vs/17/release/vc_redist.x64.exe';
  const tempPath = path.join(app.getPath('temp'), 'vc_redist.x64.exe');

  return new Promise((resolve) => {
    const file = fs.createWriteStream(tempPath);
    
    console.log('[Health] Iniciando descarga de VS Redist...');
    https.get(redistUrl, (response) => {
      // Manejar redirecciones (aka.ms redirecciona)
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (res) => res.pipe(file));
      } else {
        response.pipe(file);
      }

      file.on('finish', () => {
        file.close();
        console.log('[Health] Descarga completada. Ejecutando instalador...');
        
        // Ejecutar en modo silencioso (/install /quiet /norestart)
        exec(`"${tempPath}" /install /quiet /norestart`, (err) => {
          if (err) {
            console.error('[Health] Error al instalar:', err);
            resolve(false);
          } else {
            console.log('[Health] Instalación solicitada con éxito.');
            resolve(true);
          }
        });
      });
    }).on('error', (err) => {
      fs.unlink(tempPath, () => {});
      console.error('[Health] Error de descarga:', err);
      resolve(false);
    });
  });
}

async function checkSystemDependencies() {
  try {
    require('better-sqlite3');
    console.log('[Health] better-sqlite3 cargado correctamente.');
    return true;
  } catch (err) {
    console.error('[CRITICAL] Error al cargar better-sqlite3. Probablemente faltan los Visual C++ Redistributables.');
    
    const choice = dialog.showMessageBoxSync({
      type: 'error',
      buttons: ['Reparar Automáticamente', 'Cerrar'],
      defaultId: 0,
      title: 'Error de Dependencias',
      message: 'No se pudo iniciar el motor de base de datos.',
      detail: 'Parece que faltan los "Visual C++ Redistributables" de Microsoft necesarios para ejecutar el ERP.\n\n¿Deseas que los descarguemos e instalemos por ti? (Requiere Internet y Administrador)'
    });

    if (choice === 0) {
      // Mostrar diálogo de "Cargando"
      const progressDialog = dialog.showMessageBoxSync({
        type: 'info',
        buttons: ['Entendido'],
        title: 'Reparación en curso',
        message: 'Estamos descargando e instalando los componentes necesarios.',
        detail: 'Por favor, espera unos segundos. Es posible que Windows te pida permisos de administrador para completar la tarea. La aplicación se cerrará al terminar para que puedas reiniciarla.'
      });

      const success = await downloadAndInstallRedist();
      if (success) {
        dialog.showMessageBoxSync({
          type: 'info',
          title: 'Reparación Finalizada',
          message: 'Componentes instalados correctamente.',
          detail: 'Por favor, abre la aplicación nuevamente.'
        });
      } else {
        dialog.showMessageBoxSync({
          type: 'error',
          title: 'Fallo en la Reparación',
          message: 'No se pudo completar la instalación automática.',
          detail: 'Por favor, intenta instalar manualmente los Visual C++ Redistributables (X64) desde el sitio de Microsoft.'
        });
      }
    }
    
    app.quit();
    return false;
  }
}
const { initDatabase, executeSql, upsertRecord } = require('./db.cjs');

let mainWindow;
let splashWindow;

// ─── Rutas de configuración ──────────────────────────────────────────────────
const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      // Generar configuración por defecto en el primer inicio
      const defaultConfig = {
        windowWidth: 1280,
        windowHeight: 800,
        instance_role: 'master',
        master_ip: 'localhost',
        cloud_sync_enabled: true
      };
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
  } catch (err) {
    console.error('Error al cargar config:', err);
  }
  return {};
}

function saveConfigFile(data) {
  try {
    const current = loadConfig();
    fs.writeFileSync(configPath, JSON.stringify({ ...current, ...data }, null, 2));
    return { success: true };
  } catch (err) {
    console.error('Error al guardar config:', err);
    return { success: false, error: err.message };
  }
}

// ─── Estado de ventana ───────────────────────────────────────────────────────
function getWindowState() {
  const cfg = loadConfig();
  return {
    width:  cfg.windowWidth  || 1280,
    height: cfg.windowHeight || 800,
    x:      cfg.windowX,
    y:      cfg.windowY,
  };
}

function saveWindowState(win) {
  if (!win || win.isMaximized() || win.isMinimized()) return;
  const { x, y, width, height } = win.getBounds();
  saveConfigFile({ windowX: x, windowY: y, windowWidth: width, windowHeight: height });
}

// ─── Splash Screen ───────────────────────────────────────────────────────────
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

// ─── Ventana Principal ───────────────────────────────────────────────────────
function createWindow() {
  const state = getWindowState();

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    show: false,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../dist/favicon.ico'),
    titleBarStyle: 'default',
    title: 'Violet ERP',
  });

  if (isDev) {
    log('[Window] Cargando desde Vite dev server: http://localhost:8080');
    mainWindow.loadURL('http://localhost:8080');
  } else {
    // En producción, esperar a que el servidor esté listo y luego cargar
    log('[Window] Intentando cargar desde servidor local: http://localhost:3000');
    const maxRetries = 10;
    let retries = 0;
    
    const tryLoad = () => {
      mainWindow.loadURL('http://localhost:3000').then(() => {
        log(`[Window] ✓ Página cargada exitosamente en intento ${retries + 1}`);
      }).catch(err => {
        log(`[Window] ✗ Intento ${retries + 1}/${maxRetries} falló: ${err.message}`);
        retries++;
        if (retries < maxRetries) {
          setTimeout(tryLoad, 1000);
        } else {
          log('[Window] ✗ No se pudo conectar al servidor local después de varios intentos');
          dialog.showErrorBox(
            'Error de Conexión',
            `No se pudo conectar al servidor local después de ${maxRetries} intentos.\n\nRevisa el archivo de log en:\n${logPath}`
          );
        }
      });
    };
    
    tryLoad();
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[mainWindow] Fallo al cargar: ${errorCode} - ${errorDescription} (${validatedURL})`);
    console.error('[mainWindow] Event:', event);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error(`[mainWindow] El proceso de renderizado se ha detenido: ${details.reason}`);
    console.error('[mainWindow] Details:', details);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const logPath = path.join(app.getPath('userData'), 'renderer_debug.log');
    const logMessage = `[${level}] ${message} (${sourceId}:${line})\n`;
    fs.appendFileSync(logPath, logMessage);
    // También mostrar en consola principal
    console.log('[Renderer]', logMessage.trim());
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[mainWindow] Página cargada exitosamente');
  });
  
  mainWindow.webContents.on('dom-ready', () => {
    console.log('[mainWindow] DOM listo');
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
    
    // Abrir DevTools en producción para debugging (temporal)
    if (!isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('close', () => saveWindowState(mainWindow));
  mainWindow.on('resize', () => saveWindowState(mainWindow));
  mainWindow.on('move',   () => saveWindowState(mainWindow));
  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  buildMenu();
}

// ─── Menú de la aplicación ───────────────────────────────────────────────────
function buildMenu() {
  const viewSubmenu = [
    { 
      label: 'Recargar', 
      accelerator: 'F5',
      role: 'reload' 
    },
    { 
      label: 'Forzar Recarga (Sin Caché)', 
      accelerator: 'Ctrl+F5',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.reloadIgnoringCache();
        }
      }
    },
    { 
      label: 'Limpiar Caché Completo', 
      click: async () => {
        if (mainWindow) {
          const session = mainWindow.webContents.session;
          await session.clearCache();
          await session.clearStorageData({
            storages: ['appcache', 'serviceworkers', 'cachestorage', 'indexdb', 'localstorage', 'websql']
          });
          mainWindow.webContents.reloadIgnoringCache();
          
          // Mostrar notificación
          const { dialog } = require('electron');
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Caché Limpiado',
            message: 'El caché ha sido limpiado completamente',
            detail: 'La aplicación se ha recargado con los datos más recientes.',
            buttons: ['OK']
          });
        }
      }
    },
    { type: 'separator' },
    { label: 'Pantalla completa', role: 'togglefullscreen' },
    { type: 'separator' },
    { label: 'Herramientas de Desarrollador', role: 'toggleDevTools' }
  ];

  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Recargar Aplicación',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        {
          label: 'Forzar Recarga',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.reloadIgnoringCache();
            }
          }
        },
        {
          label: 'Limpiar Caché y Recargar',
          accelerator: 'CmdOrCtrl+Shift+Delete',
          click: async () => {
            if (mainWindow) {
              const session = mainWindow.webContents.session;
              await session.clearCache();
              await session.clearStorageData({
                storages: ['appcache', 'serviceworkers', 'cachestorage']
              });
              mainWindow.webContents.reloadIgnoringCache();
              console.log('[Cache] Caché limpiado y aplicación recargada');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Imprimir…',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.print({ silent: false, printBackground: true });
            }
          }
        },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' }
      ],
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
        { label: 'Seleccionar todo', role: 'selectAll' },
      ],
    },
    {
      label: 'Vista',
      submenu: viewSubmenu,
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: `Violet ERP v${app.getVersion()}`,
          enabled: false,
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
ipcMain.handle('print-page', () => {
  if (mainWindow) {
    mainWindow.webContents.print({ silent: false, printBackground: true });
  }
});

ipcMain.handle('get-config', () => loadConfig());
ipcMain.handle('save-config', (_e, cfg) => saveConfigFile(cfg));
ipcMain.handle('get-version', () => app.getVersion());

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

ipcMain.handle('execute-sql', async (_e, { query, params }) => {
  try {
    const result = executeSql(query, params || []);
    return { success: true, data: result };
  } catch (err) {
    console.error('[IPC:execute-sql] Error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mutate-record', async (_e, { tableName, action, payload, recordId }) => {
  try {
    // 1. Si es INSERT o UPDATE, realizamos el upsert en la tabla real
    if (action === 'INSERT' || action === 'UPDATE') {
      upsertRecord(tableName, payload);
    } else if (action === 'DELETE') {
      executeSql(`DELETE FROM ${tableName} WHERE id = ?`, [recordId]);
    }

    // 2. Insertar en sync_logs para subir a la nube
    const syncLogId = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    executeSql(`
      INSERT INTO sync_logs (id, table_name, record_id, action, payload, sync_status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `, [syncLogId, tableName, recordId, action, JSON.stringify(payload)]);

    return { success: true };
  } catch (err) {
    console.error('[IPC:mutate-record] Error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('create-backup', async () => {
  try {
    const defaultPath = path.join(app.getPath('documents'), `VioletERP_Backup_${new Date().toISOString().split('T')[0]}.db`);
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar Copia de Seguridad',
      defaultPath: defaultPath,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const sourcePath = path.join(app.getPath('userData'), 'violet_erp.db');
    fs.copyFileSync(sourcePath, filePath);
    
    return { success: true, path: filePath };
  } catch (err) {
    console.error('[IPC:create-backup] Error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-sync-logs', async () => {
  try {
    // Only return pending logs for the UI to show
    const result = executeSql(`
      SELECT * FROM sync_logs 
      WHERE sync_status = 'PENDING' 
      ORDER BY created_at DESC
      LIMIT 100
    `, []);
    return { success: true, data: result };
  } catch (err) {
    console.error('[IPC:get-sync-logs] Error:', err.message);
    return { success: false, error: err.message };
  }
});

// ─── Ciclo de vida ───────────────────────────────────────────────────────────
app.on('ready', async () => {
  // Inicializar logging PRIMERO
  initLogging();
  
  log('[App] Evento ready disparado');
  
  if (!(await checkSystemDependencies())) {
    log('[App] ✗ Dependencias del sistema no disponibles');
    return;
  }
  log('[App] ✓ Dependencias del sistema verificadas');
  
  try {
    initDatabase();
    log('[App] ✓ Base de datos inicializada');
  } catch (err) {
    log(`[App] ✗ Error al inicializar base de datos: ${err.message}`);
    log(`[App] Stack: ${err.stack}`);
    dialog.showErrorBox('Error de Base de Datos', `No se pudo inicializar la base de datos:\n\n${err.message}`);
    app.quit();
    return;
  }
  
  if (!isDev) createSplashWindow();

  const cfg = loadConfig();
  log(`[App] Configuración cargada: role=${cfg.instance_role}`);
  
  // Iniciar servidores ANTES de crear la ventana
  if (cfg.instance_role === 'master' || !cfg.instance_role) {
    if (!isDev) {
      log('[App] Iniciando servidores...');
      try {
        // Iniciar servidor principal
        startServer();
        log('[App] ✓ Servidor principal iniciado');
        
        // Esperar a que el servidor esté listo
        log('[App] Esperando 3 segundos para que el servidor esté listo...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (err) {
        log(`[App] ✗ Error al iniciar servidor: ${err.message}`);
        log(`[App] Stack: ${err.stack}`);
        dialog.showErrorBox(
          'Error al Iniciar Servidor',
          `No se pudo iniciar el servidor local:\n\n${err.message}\n\nRevisa el archivo de log en:\n${logPath}`
        );
        app.quit();
        return;
      }
    }
  }

  // Iniciar el servidor proxy de IA
  log('[App] Iniciando servidor proxy de IA...');
  try {
    startProxyServer();
    log('[App] ✓ Servidor proxy de IA iniciado');
  } catch (err) {
    log(`[App] ✗ Error al iniciar proxy de IA: ${err.message}`);
    log(`[App] Stack: ${err.stack}`);
  }
  
  // Ahora crear la ventana
  log('[App] Creando ventana principal...');
  createWindow();

  if (!isDev) {
    try {
      const { autoUpdater } = require('electron-updater');
      
      // Auto-update logging configs
      autoUpdater.logger = console;
      autoUpdater.logger.transports.file.level = "info";

      // Bind events to inform the Window (React Frontend)
      autoUpdater.on('checking-for-update', () => {
        if (mainWindow) mainWindow.webContents.send('updater:checking');
      });

      autoUpdater.on('update-available', (info) => {
        if (mainWindow) mainWindow.webContents.send('updater:available', info);
      });

      autoUpdater.on('update-not-available', (info) => {
        if (mainWindow) mainWindow.webContents.send('updater:not-available', info);
      });

      autoUpdater.on('error', (err) => {
        if (mainWindow) mainWindow.webContents.send('updater:error', err);
      });

      autoUpdater.on('download-progress', (progressObj) => {
        if (mainWindow) mainWindow.webContents.send('updater:progress', progressObj);
      });

      autoUpdater.on('update-downloaded', (info) => {
        if (mainWindow) mainWindow.webContents.send('updater:downloaded', info);
        // Automatically install immediately after download (Silent update)
        // autoUpdater.quitAndInstall(); 
      });

      // IPC listener to manually trigger the install from React
      ipcMain.handle('updater:install', () => {
        autoUpdater.quitAndInstall();
      });

      ipcMain.handle('updater:check', () => {
        autoUpdater.checkForUpdatesAndNotify().catch(err => {
          console.warn('[AutoUpdater] Manual check failed (likely offline):', err.message);
        });
      });

      // Initial check on boot
      autoUpdater.checkForUpdatesAndNotify().catch(err => {
        console.warn('[AutoUpdater] Boot check failed (likely offline):', err.message);
      });

    } catch (err) {
      console.warn('Auto-updater module failure:', err.message);
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
