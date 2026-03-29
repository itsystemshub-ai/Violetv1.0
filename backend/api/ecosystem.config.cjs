/**
 * Violet ERP - PM2 Ecosystem Configuration
 * Producción con clustering y auto-restart
 */

module.exports = {
  apps: [
    {
      name: 'violet-erp-api',
      script: './src/server.js',
      instances: process.env.PM2_INSTANCES || 4,
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
      },
      
      // Logging
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto-restart config
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', '*.fdb', '*.log'],
      max_memory_restart: process.env.PM2_MAX_MEMORY || '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Performance
      max_requests: 10000,
      max_requests_delay: 60000,
      
      // Health check
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 10000,
    },
    {
      name: 'violet-erp-worker',
      script: './src/workers/main.js',
      instances: 2,
      exec_mode: 'cluster',
      
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      
      error_file: './logs/worker-err.log',
      out_file: './logs/worker-out.log',
      time: true,
      autorestart: true,
      max_memory_restart: '512M',
    },
  ],
};
