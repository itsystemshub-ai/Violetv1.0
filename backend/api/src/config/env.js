/**
 * Violet ERP - Configuración Unificada Híbrida
 * Soporta modos: local, cloud, hybrid
 */

import dotenv from 'dotenv';

dotenv.config();

export const HYBRID_MODES = {
  LOCAL: 'local',      // Solo local, sin sync
  CLOUD: 'cloud',      // Solo nube (SaaS)
  HYBRID: 'hybrid',    // Local + Nube sincronizada
} as const;

export type HybridMode = typeof HYBRID_MODES[keyof typeof HYBRID_MODES];

export interface HybridConfig {
  mode: HybridMode;
  isMaster: boolean;   // true = servidor maestro de sync
  nodeRole: 'master' | 'slave' | 'standalone';
}

export const config = {
  // ============================================================================
  // APLICACIÓN
  // ============================================================================
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Violet ERP',
  appVersion: process.env.APP_VERSION || '2.0.0',

  // ============================================================================
  // SERVIDOR
  // ============================================================================
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',

  // ============================================================================
  // MODO HÍBRIDO
  // ============================================================================
  hybrid: {
    mode: (process.env.HYBRID_MODE || 'hybrid') as HybridMode,
    isMaster: process.env.HYBRID_IS_MASTER === 'true',
    nodeRole: (process.env.HYBRID_NODE_ROLE || 'standalone') as 'master' | 'slave' | 'standalone',
    
    // Sync configuration
    syncInterval: parseInt(process.env.HYBRID_SYNC_INTERVAL || '15000', 10),
    syncBatchSize: parseInt(process.env.HYBRID_SYNC_BATCH_SIZE || '20', 10),
    syncMaxRetries: parseInt(process.env.HYBRID_SYNC_MAX_RETRIES || '5', 10),
    
    // Cloud API endpoint (para modo híbrido)
    cloudApiUrl: process.env.HYBRID_CLOUD_API_URL || 'http://localhost:3000',
    cloudWsUrl: process.env.HYBRID_CLOUD_WS_URL || 'ws://localhost:3001',
    
    // Local API endpoint (para nodos slaves)
    localApiUrl: process.env.HYBRID_LOCAL_API_URL || 'http://localhost:3000',
  },

  // ============================================================================
  // FIREBIRD DATABASE
  // ============================================================================
  firebird: {
    host: process.env.FIREBIRD_HOST || 'localhost',
    port: parseInt(process.env.FIREBIRD_PORT || '3050', 10),
    database: process.env.FIREBIRD_DATABASE || './database/firebird/valery3.fdb',
    user: process.env.FIREBIRD_USER || 'SYSDBA',
    password: process.env.FIREBIRD_PASSWORD || 'masterkey',
    role: process.env.FIREBIRD_ROLE || 'RDB$ADMIN',
    pageSize: parseInt(process.env.FIREBIRD_PAGE_SIZE || '4096', 10),
    
    // Pool settings
    poolMin: parseInt(process.env.FIREBIRD_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.FIREBIRD_POOL_MAX || '10', 10),
    poolAcquireTimeout: parseInt(process.env.FIREBIRD_POOL_ACQUIRE_TIMEOUT || '5000', 10),
    poolIdleTimeout: parseInt(process.env.FIREBIRD_POOL_IDLE_TIMEOUT || '30000', 10),
  },

  // ============================================================================
  // SQLITE LOCAL (para caché y offline)
  // ============================================================================
  sqlite: {
    enabled: process.env.SQLITE_ENABLED !== 'false',
    path: process.env.SQLITE_PATH || './data/violet_local.db',
    journalMode: process.env.SQLITE_JOURNAL_MODE || 'WAL',
  },

  // ============================================================================
  // JWT & SEGURIDAD
  // ============================================================================
  jwt: {
    secret: process.env.JWT_SECRET || 'violet-erp-super-secret-jwt-key-change-in-production-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'violet-erp-super-secret-refresh-key-change-in-production-2026',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'violet-erp',
    audience: process.env.JWT_AUDIENCE || 'violet-erp-users',
  },

  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  // ============================================================================
  // WEBSOCKETS
  // ============================================================================
  ws: {
    enabled: process.env.WS_ENABLED !== 'false',
    port: parseInt(process.env.WS_PORT || '3001', 10),
    corsOrigin: process.env.WS_CORS_ORIGIN || '*',
  },

  // ============================================================================
  // LOGS
  // ============================================================================
  logs: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '30', 10),
    httpEnabled: process.env.LOG_HTTP_ENABLED === 'true',
  },

  // ============================================================================
  // ARCHIVOS
  // ============================================================================
  uploads: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10),
    allowedExtensions: process.env.UPLOAD_ALLOWED_EXTENSIONS || 'jpg,jpeg,png,pdf,xlsx,xls,csv,doc,docx,zip',
  },

  // ============================================================================
  // RATE LIMITING
  // ============================================================================
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000', 10),
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '10', 10),
  },

  // ============================================================================
  // CARACTERÍSTICAS
  // ============================================================================
  features: {
    emailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'true',
    twoFactorAuth: process.env.FEATURE_TWO_FACTOR_AUTH === 'true',
    socialLogin: process.env.FEATURE_SOCIAL_LOGIN === 'true',
    fileStorageLocal: process.env.FEATURE_FILE_STORAGE_LOCAL !== 'false',
    realtime: process.env.FEATURE_REALTIME !== 'false',
    auditLog: process.env.FEATURE_AUDIT_LOG !== 'false',
    offlineMode: process.env.FEATURE_OFFLINE_MODE !== 'false',
  },

  // ============================================================================
  // UTILS
  // ============================================================================
  get isDevelopment() {
    return this.nodeEnv === 'development';
  },

  get isProduction() {
    return this.nodeEnv === 'production';
  },

  get isHybrid() {
    return this.hybrid.mode === HYBRID_MODES.HYBRID;
  },

  get isCloudOnly() {
    return this.hybrid.mode === HYBRID_MODES.CLOUD;
  },

  get isLocalOnly() {
    return this.hybrid.mode === HYBRID_MODES.LOCAL;
  },

  get isMasterNode() {
    return this.hybrid.isMaster || this.hybrid.nodeRole === 'master';
  },
};

export default config;
