const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Determinar si estamos en desarrollo o producción
const isDev = process.env.NODE_ENV !== 'production' && !process.resourcesPath;

// Función para obtener la ruta base correcta
function getBasePath() {
  if (isDev) {
    // En desarrollo
    return path.join(__dirname, '../..');
  } else {
    // En producción, los archivos están en resources/app.asar
    // pero necesitamos la ruta al directorio resources para acceder a dist
    return process.resourcesPath;
  }
}

const basePath = getBasePath();

// Importar módulos - en producción estos están dentro de app.asar y funcionan con require
const createApp = require('./app');
const { port, cors } = require('./config/server');
const syncService = require('./services/sync.service');

let io = null;
let serverInstance = null;
let connectedNodes = [];

// Función de logging
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Server] ${message}`);
}

/**
 * Inicia el servidor local
 */
function startLocalServer() {
  if (serverInstance) {
    log('El servidor ya está en ejecución');
    return;
  }

  log('Iniciando servidor local...');
  log(`Puerto configurado: ${port}`);

  // NO inicializar base de datos aquí - ya se hizo en electron/main.cjs
  log('Base de datos ya inicializada desde Electron');

  // Crear aplicación Express
  let app;
  try {
    app = createApp();
    log('✓ Aplicación Express creada');
  } catch (err) {
    log(`✗ Error al crear aplicación Express: ${err.message}`);
    throw err;
  }
  
  try {
    serverInstance = http.createServer(app);
    log('✓ Servidor HTTP creado');
  } catch (err) {
    log(`✗ Error al crear servidor HTTP: ${err.message}`);
    throw err;
  }
  
  // Setup Socket.io
  try {
    io = new Server(serverInstance, { cors });
    log('✓ Socket.io configurado');
  } catch (err) {
    log(`✗ Error al configurar Socket.io: ${err.message}`);
    throw err;
  }

  // Servir archivos estáticos
  const express = require('express');
  
  // En producción, dist está FUERA de app.asar, en resources/app.asar.unpacked/dist
  // o directamente en resources/dist
  let distPath;
  
  if (isDev) {
    distPath = path.join(basePath, 'dist');
  } else {
    // Intentar múltiples ubicaciones posibles
    const possiblePaths = [
      path.join(process.resourcesPath, 'app.asar.unpacked', 'dist'),
      path.join(process.resourcesPath, 'dist'),
      path.join(process.resourcesPath, 'app.asar', 'dist'),
      path.join(basePath, 'dist')
    ];
    
    log('Buscando carpeta dist en ubicaciones posibles:');
    for (const p of possiblePaths) {
      log(`  - ${p}: ${fs.existsSync(p) ? '✓ EXISTE' : '✗ no existe'}`);
      if (fs.existsSync(p)) {
        distPath = p;
        break;
      }
    }
  }
  
  log(`Ruta de archivos estáticos seleccionada: ${distPath}`);
  
  if (!distPath || !fs.existsSync(distPath)) {
    const error = `ERROR CRÍTICO: No se encontró la carpeta dist en ninguna ubicación`;
    log(`✗ ${error}`);
    throw new Error(error);
  }
  
  app.use(express.static(distPath));
  log('✓ Middleware de archivos estáticos configurado');
  
  const indexPath = path.join(distPath, 'index.html');
  const indexExists = fs.existsSync(indexPath);
  log(`index.html existe: ${indexExists}`);

  // Socket.io eventos
  io.on('connection', (socket) => {
    const nodeIp = socket.handshake.address;
    log(`Nuevo nodo conectado: ${socket.id} (IP: ${nodeIp})`);
    
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
      log(`Nodo desconectado: ${socket.id}`);
      connectedNodes = connectedNodes.filter(n => n.id !== socket.id);
      io.emit('nodes:update', connectedNodes);
    });
  });

  // SPA Fallback
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ 
        success: false, 
        error: 'Endpoint no encontrado' 
      });
    }
    log(`Sirviendo index.html para: ${req.path}`);
    
    const indexPath = path.join(distPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      log(`✗ ERROR: index.html no encontrado en ${indexPath}`);
      res.status(500).send(`Error: index.html no encontrado en ${indexPath}`);
    }
  });

  // Iniciar servidor
  try {
    serverInstance.listen(port, '0.0.0.0', () => {
      log(`✓ Servidor ejecutándose en http://0.0.0.0:${port}`);
      log(`✓ Archivos estáticos servidos desde: ${distPath}`);
    });
  } catch (err) {
    log(`✗ Error al iniciar servidor en puerto ${port}: ${err.message}`);
    throw err;
  }

  serverInstance.on('error', (err) => {
    log(`✗ Error del servidor: ${err.message}`);
    log(`Stack: ${err.stack}`);
    throw err;
  });

  // Iniciar sincronización
  try {
    syncService.start();
    log('✓ Servicio de sincronización iniciado');
  } catch (err) {
    log(`✗ Error al iniciar sincronización: ${err.message}`);
  }
}

/**
 * Obtiene la instancia de Socket.io
 */
function getSocketIo() {
  return io;
}

module.exports = {
  startLocalServer,
  getSocketIo,
  basePath
};
