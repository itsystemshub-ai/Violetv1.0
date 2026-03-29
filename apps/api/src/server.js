/**
 * Violet ERP - Backend API
 * Servidor principal Express con Socket.IO
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRoutes } from './modules/auth/routes.js';
import { userRoutes } from './modules/users/routes.js';
import { productRoutes } from './modules/products/routes.js';
import { inventoryRoutes } from './modules/inventory/routes.js';
import { saleRoutes } from './modules/sales/routes.js';
import { customerRoutes } from './modules/customers/routes.js';
import { purchaseRoutes } from './modules/purchases/routes.js';
import { supplierRoutes } from './modules/suppliers/routes.js';
import { financeRoutes } from './modules/finance/routes.js';
import { accountingRoutes } from './modules/accounting/routes.js';
import { reportRoutes } from './modules/reports/routes.js';
import { setupSocket } from './socket/index.js';

const app: Express = express();
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
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: config.appVersion,
  });
});

// API Info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Violet ERP API',
    version: config.appVersion,
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      inventory: '/api/inventory',
      sales: '/api/sales',
      customers: '/api/customers',
      purchases: '/api/purchases',
      suppliers: '/api/suppliers',
      finance: '/api/finance',
      accounting: '/api/accounting',
      reports: '/api/reports',
    },
  });
});

// ============================================================================
// RUTAS DE LA API
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
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
    // Inicializar base de datos
    const { initializeDatabase } = await import('./database/index.js');
    await initializeDatabase();

    server.listen(config.port, config.host, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   💜  V I O L E T   E R P   -   A P I   S E R V E R       ║
║                                                           ║
║   Environment: ${config.nodeEnv.padEnd(42)} ║
║   Port: ${String(config.port).padEnd(48)}║
║   Host: ${String(config.host).padEnd(46)}║
║   Database: ${config.dbType.padEnd(42)} ║
║                                                           ║
║   API: http://${config.host}:${config.port}/api                       ║
║   Health: http://${config.host}:${config.port}/health                 ║
║   WebSocket: ws://${config.host}:${config.wsPort}                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // WebSocket server
    if (config.wsEnabled) {
      io.listen(config.wsPort);
      console.log(`   WebSocket Server: ws://${config.host}:${config.wsPort}`);
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io, server };
