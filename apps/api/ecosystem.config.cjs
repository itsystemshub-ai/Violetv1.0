/**
 * Violet ERP - Configuración de PM2
 * Alternativa a Docker para producción
 */

module.exports = {
  apps: [
    {
      name: 'violet-erp-api',
      script: './src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        INSTANCES: 4,
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', '*.db'],
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'violet-erp-sync',
      script: './src/sync/sync-worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        SYNC_INTERVAL: 60000,
      },
      env_production: {
        NODE_ENV: 'production',
        SYNC_INTERVAL: 30000,
      },
      error_file: './logs/sync-err.log',
      out_file: './logs/sync-out.log',
      time: true,
      autorestart: true,
    },
  ],
};
