/**
 * Violet ERP - Configuración del Servidor
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Aplicación
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Violet ERP',
  appVersion: process.env.APP_VERSION || '1.0.0',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:3000',

  // Servidor
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'violet-erp-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'violet-erp-refresh-secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Base de datos
  dbType: (process.env.DB_TYPE as 'sqlite' | 'postgres' | 'supabase') || 'sqlite',
  sqlitePath: process.env.SQLITE_PATH || './violet.db',
  postgresUrl: process.env.DATABASE_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',

  // WebSockets
  wsEnabled: process.env.WS_ENABLED !== 'false',
  wsPort: parseInt(process.env.WS_PORT || '3001', 10),

  // Seguridad
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  sessionSecret: process.env.SESSION_SECRET || 'violet-session-secret',

  // Rate limiting
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logs
  logLevel: process.env.LOG_LEVEL || 'debug',
  logFile: process.env.LOG_FILE || './logs/app.log',

  // Uploads
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10),
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'jpg,jpeg,png,pdf,xlsx,xls,csv,doc,docx').split(','),
};

export default config;
