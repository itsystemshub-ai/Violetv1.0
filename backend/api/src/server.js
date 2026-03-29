/**
 * Violet ERP - Backend API
 * Servidor principal Express con Socket.IO
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import authRouter from './modules/auth/index.js';
import usersRouter from './modules/users/index.js';
import productsRouter from './modules/products/index.js';
import { setupSocket } from './socket/index.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: config.appVersion,
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'Violet ERP API',
    version: config.appVersion,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
    },
  });
});

// ============================================================================
// RUTAS DE LA API
// ============================================================================

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);

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
// SOCKET.IO
// ============================================================================

setupSocket(io);

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

const startServer = async () => {
  try {
    server.listen(config.port, config.host, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   💜  V I O L E T   E R P   -   A P I   S E R V E R       ║
║                                                           ║
║   Environment: ${config.nodeEnv.padEnd(42)} ║
║   Port: ${String(config.port).padEnd(48)}║
║   Host: ${String(config.host).padEnd(46)}║
║                                                           ║
║   API: http://${config.host}:${config.port}/api                       ║
║   Health: http://${config.host}:${config.port}/health                 ║
║   WebSocket: ws://${config.host}:${config.wsPort || 3001}                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    console.log('   ✅ Server ready!');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io, server };
