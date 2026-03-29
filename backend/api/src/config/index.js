/**
 * Violet ERP - Configuración
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Aplicación
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Violet ERP',
  appVersion: process.env.APP_VERSION || '1.0.0',

  // Servidor
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Firebird
  firebird: {
    host: process.env.FIREBIRD_HOST || 'localhost',
    port: parseInt(process.env.FIREBIRD_PORT || '3050', 10),
    database: process.env.FIREBIRD_DATABASE || 'C:/VioletERP/database/valery3.fdb',
    user: process.env.FIREBIRD_USER || 'SYSDBA',
    password: process.env.FIREBIRD_PASSWORD || 'masterkey',
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'violet-erp-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'violet-erp-refresh-secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Seguridad
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),

  // Logs
  logLevel: process.env.LOG_LEVEL || 'debug',
  logFile: process.env.LOG_FILE || './logs/app.log',
};

export default config;
