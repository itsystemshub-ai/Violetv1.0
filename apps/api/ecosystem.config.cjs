/**
 * Violet ERP - Configuración de PM2
 * 
 * Alternativa a Docker para producción
 * Gestión de procesos, auto-reinicio, logs, clustering
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
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
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
      log_file: './logs/sync-combined.log',
      time: true,
      autorestart: true,
    },
    {
      name: 'violet-erp-socket',
      script: './src/socket/standalone.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        WS_PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        WS_PORT: 3001,
      },
      error_file: './logs/socket-err.log',
      out_file: './logs/socket-out.log',
      time: true,
      autorestart: true,
    },
  ],
};
