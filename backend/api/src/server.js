/**
 * Violet ERP - Backend API Híbrido
 * Servidor principal Express con Socket.IO y Sincronización Híbrida
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config, HYBRID_MODES } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { firebirdPool } from './database/firebird-pool.js';
import { hybridSyncService } from './services/hybrid-sync.service.js';

// Rutas de la API
import authRouter from './modules/auth/index.js';
import usersRouter from './modules/users/index.js';
import productsRouter from './modules/products/index.js';
import syncRouter from './modules/sync/index.js';

// Socket.IO setup
import { setupSocket } from './socket/index.js';

const app = express();
const server = http.createServer(app);

// ============================================================================
// CONFIGURACIÓN DE SOCKET.IO
// ============================================================================

const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: config.corsCredentials,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors({
  origin: config.corsOrigin,
  credentials: config.corsCredentials,
  exposedHeaders: ['X-Node-ID', 'X-Sync-Status'],
}));

app.use(express.json({ 
  limit: config.isHybrid ? '50mb' : '10mb',
  strict: true,
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: config.isHybrid ? '50mb' : '10mb',
}));

// Request logging
app.use(requestLogger);

// Security headers para modo híbrido
if (config.isHybrid) {
  app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'Violet ERP Hybrid');
    res.setHeader('X-Node-Role', config.hybrid.nodeRole);
    next();
  });
}

// ============================================================================
// ENDPOINTS PÚBLICOS
// ============================================================================

// Health check mejorado
app.get('/health', (req, res) => {
  const poolStats = firebirdPool.getStats();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: config.appVersion,
    mode: config.hybrid.mode,
    nodeRole: config.hybrid.nodeRole,
    isMaster: config.isMasterNode,
    nodeId: hybridSyncService.getNodeId(),
    database: {
      connected: poolStats.total > 0,
      pool: poolStats,
    },
    sync: hybridSyncService.getStats(),
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'Violet ERP API',
    version: config.appVersion,
    mode: config.hybrid.mode,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      sync: '/api/sync',
    },
    features: {
      hybrid: config.isHybrid,
      realtime: config.features.realtime,
      offline: config.features.offlineMode,
      audit: config.features.auditLog,
    },
  });
});

// Endpoint para registro de nodos (solo master)
app.post('/api/nodes/register', async (req, res) => {
  if (!config.isMasterNode) {
    return res.status(403).json({ error: 'Solo el nodo maestro puede registrar nodos' });
  }
  
  // Forward al router de sync
  syncRouter.handle(req, res);
});

// ============================================================================
// RUTAS DE LA API
// ============================================================================

// Autenticación
app.use('/api/auth', authRouter);

// Usuarios
app.use('/api/users', usersRouter);

// Productos
app.use('/api/products', productsRouter);

// Sincronización Híbrida
app.use('/api/sync', syncRouter);

// ============================================================================
// HANDLERS
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler
app.use(errorHandler);

// ============================================================================
// SOCKET.IO SETUP
// ============================================================================

setupSocket(io);

// Eventos adicionales para sync híbrido
io.on('connection', (socket) => {
  // Nodo slave conectándose
  socket.on('node:register', async (data) => {
    if (config.isMasterNode) {
      await hybridSyncService.registerNode({
        nodeId: socket.id,
        nodeUrl: data.nodeUrl,
        nodeRole: 'SLAVE',
      });
      
      socket.emit('node:registered', {
        success: true,
        masterId: io.engine.serverId,
      });
    }
  });

  // Sync en tiempo real
  socket.on('sync:record', async (data) => {
    if (config.isMasterNode) {
      const result = await hybridSyncService.receiveFromSlave(data, socket.id);
      socket.emit('sync:result', result);
    }
  });
});

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

const startServer = async () => {
  try {
    // Inicializar pool de Firebird
    await firebirdPool.initialize();
    logger.info('Firebird pool initialized');

    // Iniciar servicio de sync híbrido
    if (config.isHybrid) {
      hybridSyncService.start();
      logger.info(`Hybrid sync started in ${config.hybrid.mode} mode`);
    }

    // Iniciar servidor HTTP
    server.listen(config.port, config.host, () => {
      const modeIcon = config.isHybrid ? '☁️' : config.isLocalOnly ? '💻' : '🌐';
      
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ${modeIcon}  V I O L E T   E R P   -   H Y B R I D   S E R V E R     ║
║                                                           ║
║   Mode: ${config.hybrid.mode.padEnd(46)}║
║   Role: ${config.hybrid.nodeRole.padEnd(46)}║
║   Port: ${String(config.port).padEnd(46)}║
║   Host: ${String(config.host).padEnd(46)}║
║                                                           ║
║   API: http://${config.host}:${config.port}/api                       ║
║   Health: http://${config.host}:${config.port}/health                 ║
║   WebSocket: ws://${config.host}:${config.ws?.port || 3001}                     ║
║                                                           ║
║   Sync Interval: ${String(config.hybrid.syncInterval).padEnd(37)}║
║   Batch Size: ${String(config.hybrid.syncBatchSize).padEnd(40)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      hybridSyncService.stop();
      await firebirdPool.cleanup();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      hybridSyncService.stop();
      await firebirdPool.cleanup();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Logger helper
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  debug: (msg) => config.isDevelopment && console.log(`[DEBUG] ${msg}`),
};

// Iniciar servidor
startServer();

export { app, io, server };
