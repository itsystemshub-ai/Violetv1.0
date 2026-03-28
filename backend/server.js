/**
 * Servidor Express Principal para Violet ERP
 * Maneja tanto archivos estáticos como API
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Determinar entorno
const isDev = process.env.NODE_ENV !== 'production' && !process.resourcesPath;
const isElectron = !!process.resourcesPath;

// Configuración
const PORT = process.env.PORT || 3000;
const PROXY_PORT = process.env.PROXY_PORT || 3001;

// Función de logging
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Server] ${message}`);
}

/**
 * Obtener rutas base según el entorno
 */
function getPaths() {
  const rootDir = path.join(__dirname, '..');
  
  if (isDev) {
    // Desarrollo: rutas relativas al proyecto
    return {
      root: rootDir,
      dist: path.join(rootDir, 'dist'),
      backend: __dirname
    };
  } else if (isElectron) {
    // Producción Electron: archivos en resources
    return {
      root: process.resourcesPath,
      dist: path.join(process.resourcesPath, 'dist'),
      backend: path.join(process.resourcesPath, 'app.asar', 'backend')
    };
  } else {
    // Producción standalone (Cloud/Docker)
    return {
      root: rootDir,
      dist: path.join(rootDir, 'dist'),
      backend: __dirname
    };
  }
}

const paths = getPaths();

log('='.repeat(80));
log('INICIANDO SERVIDOR EXPRESS');
log('='.repeat(80));
log(`Entorno: ${isDev ? 'DESARROLLO' : 'PRODUCCIÓN'}`);
log(`Electron: ${isElectron ? 'SÍ' : 'NO'}`);
log(`Puerto: ${PORT}`);
log(`Rutas:`);
log(`  - root: ${paths.root}`);
log(`  - dist: ${paths.dist}`);
log(`  - backend: ${paths.backend}`);
log(`  - dist existe: ${fs.existsSync(paths.dist)}`);
if (fs.existsSync(paths.dist)) {
  log(`  - index.html existe: ${fs.existsSync(path.join(paths.dist, 'index.html'))}`);
}

/**
 * Crear aplicación Express
 */
function createApp() {
  const app = express();

  // Middlewares básicos
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging de requests
  app.use((req, res, next) => {
    log(`${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: isDev ? 'development' : 'production',
      electron: isElectron,
      paths: {
        dist: paths.dist,
        distExists: fs.existsSync(paths.dist)
      }
    });
  });

  // API Routes
  try {
    const apiRoutes = require('./src/routes/api.routes');
    app.use('/api', apiRoutes);
    log('✓ Rutas de API cargadas');
  } catch (err) {
    log(`⚠ No se pudieron cargar rutas de API: ${err.message}`);
  }

  // Servir archivos estáticos
  if (fs.existsSync(paths.dist)) {
    app.use(express.static(paths.dist, {
      maxAge: isDev ? 0 : '1d',
      etag: true,
      lastModified: true
    }));
    log(`✓ Sirviendo archivos estáticos desde: ${paths.dist}`);
  } else {
    log(`✗ ERROR: Carpeta dist no encontrada en: ${paths.dist}`);
  }

  // SPA Fallback - debe ser el último
  app.get('*', (req, res) => {
    // No aplicar fallback a rutas de API
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        path: req.path
      });
    }

    const indexPath = path.join(paths.dist, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      log(`Sirviendo index.html para: ${req.path}`);
      res.sendFile(indexPath);
    } else {
      log(`✗ ERROR: index.html no encontrado en: ${indexPath}`);
      res.status(500).send(`
        <h1>Error del Servidor</h1>
        <p>No se pudo encontrar index.html</p>
        <p>Ruta buscada: ${indexPath}</p>
        <p>Entorno: ${isDev ? 'desarrollo' : 'producción'}</p>
      `);
    }
  });

  return app;
}

/**
 * Iniciar servidor principal
 */
function startServer() {
  const app = createApp();
  const server = http.createServer(app);

  // Socket.io
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  let connectedNodes = [];

  io.on('connection', (socket) => {
    const nodeIp = socket.handshake.address;
    log(`✓ Cliente conectado: ${socket.id} (${nodeIp})`);
    
    connectedNodes.push({
      id: socket.id,
      ip: nodeIp,
      connectedAt: new Date().toISOString()
    });
    
    io.emit('nodes:update', connectedNodes);

    socket.on('config:update', (data) => {
      socket.broadcast.emit('config:update', data);
    });

    socket.on('disconnect', () => {
      log(`✗ Cliente desconectado: ${socket.id}`);
      connectedNodes = connectedNodes.filter(n => n.id !== socket.id);
      io.emit('nodes:update', connectedNodes);
    });
  });

  // Iniciar servidor
  server.listen(PORT, '0.0.0.0', () => {
    log('='.repeat(80));
    log(`✓ SERVIDOR EJECUTÁNDOSE EN http://0.0.0.0:${PORT}`);
    log('='.repeat(80));
  });

  server.on('error', (err) => {
    log(`✗ ERROR DEL SERVIDOR: ${err.message}`);
    if (err.code === 'EADDRINUSE') {
      log(`El puerto ${PORT} ya está en uso`);
      process.exit(1);
    }
  });

  // Iniciar servicio de sincronización
  try {
    const syncService = require('./src/services/sync.service');
    syncService.start();
    log('✓ Servicio de sincronización iniciado');
  } catch (err) {
    log(`⚠ No se pudo iniciar sincronización: ${err.message}`);
  }

  return { server, io };
}

/**
 * Iniciar servidor proxy de IA
 */
function startProxyServer() {
  try {
    const proxyApp = express();
    
    proxyApp.use(cors({ origin: '*' }));
    proxyApp.use(express.json());

    // Cargar rutas de Groq
    try {
      const groqRoutes = require('./src/routes/groq.routes');
      proxyApp.use('/api/groq', groqRoutes);
      log('✓ Rutas de Groq cargadas');
    } catch (err) {
      log(`⚠ No se pudieron cargar rutas de Groq: ${err.message}`);
    }

    proxyApp.listen(PROXY_PORT, () => {
      log(`✓ Servidor Proxy de IA ejecutándose en http://localhost:${PROXY_PORT}`);
    });
  } catch (err) {
    log(`✗ Error al iniciar servidor proxy: ${err.message}`);
  }
}

// Exportar funciones
module.exports = {
  startServer,
  startProxyServer,
  getPaths,
  paths
};

// Si se ejecuta directamente
if (require.main === module) {
  startServer();
  startProxyServer();
}
