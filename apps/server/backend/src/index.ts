/**
 * Violet ERP Backend - Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { productsRouter } from './routes/products.js';
import { invoicesRouter } from './routes/invoices.js';
import { tenantsRouter } from './routes/tenants.js';
import { initDatabase } from './database/init.js';
import https from 'https';
import http from 'http';
import fs from 'fs';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.nodeEnv === 'production',
  crossOriginEmbedderPolicy: config.nodeEnv === 'production',
}));

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/tenants', tenantsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize database
await initDatabase();

// Start server
const startServer = () => {
  if (config.ssl.enabled && config.nodeEnv === 'production') {
    // HTTPS server
    try {
      const httpsOptions = {
        key: fs.readFileSync(config.ssl.keyPath),
        cert: fs.readFileSync(config.ssl.certPath),
      };

      const httpsServer = https.createServer(httpsOptions, app);
      
      httpsServer.listen(config.port, config.host, () => {
        logger.info(`🔒 HTTPS Server running on https://${config.host}:${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
      });
    } catch (error) {
      logger.error('Failed to start HTTPS server:', error);
      logger.info('Falling back to HTTP server');
      startHttpServer();
    }
  } else {
    startHttpServer();
  }
};

const startHttpServer = () => {
  const httpServer = http.createServer(app);
  
  httpServer.listen(config.port, config.host, () => {
    logger.info(`🚀 HTTP Server running on http://${config.host}:${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export { app };
