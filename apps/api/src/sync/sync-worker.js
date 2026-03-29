/**
 * Violet ERP - Worker de Sincronización en Segundo Plano
 * 
 * Proceso independiente para manejar la sincronización
 * Se ejecuta con PM2 en modo fork
 */

import { hybridSync, hybridConfig } from './hybrid-sync.js';
import { createLogger } from './logger.js';

const logger = createLogger('sync-worker');

// ============================================================================
# INICIALIZACIÓN
# ============================================================================

async function main() {
  logger.info('Starting Sync Worker...');

  try {
    // Inicializar servicio de sincronización
    await hybridSync.initialize();

    // Manejar eventos
    hybridSync.on('sync:complete', (data) => {
      logger.info(`Sync completed: ${data.localChanges} local, ${data.cloudChanges} cloud, ${data.duration}ms`);
    });

    hybridSync.on('sync:error', (error) => {
      logger.error(`Sync error:`, error);
    });

    hybridSync.on('conflict:manual', (data) => {
      logger.warn(`Manual conflict resolution required:`, data);
    });

    hybridSync.on('sync:queued', (data) => {
      logger.debug(`Operation queued for sync: ${data.operation}`);
    });

    logger.info('Sync Worker started successfully');
    logger.info(`Sync interval: ${hybridConfig.syncInterval}ms`);
    logger.info(`Mode: ${hybridConfig.mode}`);

    // Manejar señales de terminación
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Reportar estado periódicamente
    setInterval(() => {
      const status = hybridSync.getSyncStatus();
      logger.debug('Sync status:', status);
    }, 60000);

  } catch (error) {
    logger.error('Failed to start Sync Worker:', error);
    process.exit(1);
  }
}

// ============================================================================
# SHUTDOWN GRACEFUL
# ============================================================================

async function shutdown() {
  logger.info('Shutting down Sync Worker...');
  
  try {
    hybridSync.stopAutoSync();
    await hybridSync.destroy();
    logger.info('Sync Worker shut down gracefully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// ============================================================================
# MENSAJES DESDE PM2
# ============================================================================

process.on('message', async (msg) => {
  logger.info('Received message:', msg);

  switch (msg.action) {
    case 'sync:force':
      await hybridSync.forceSync();
      process.send({ type: 'sync:complete' });
      break;

    case 'sync:status':
      process.send({ type: 'sync:status', data: hybridSync.getSyncStatus() });
      break;

    case 'sync:stop':
      hybridSync.stopAutoSync();
      process.send({ type: 'sync:stopped' });
      break;

    case 'sync:start':
      hybridSync.startAutoSync();
      process.send({ type: 'sync:started' });
      break;
  }
});

// ============================================================================
# INICIAR
# ============================================================================

main();
