/**
 * Violet ERP - Configuración Híbrida del Frontend
 */

export type HybridMode = 'local' | 'cloud' | 'hybrid';

export interface AppConfig {
  // Identidad
  appName: string;
  appVersion: string;
  
  // Modo híbrido
  hybridMode: HybridMode;
  
  // API
  apiUrl: string;
  wsUrl: string;
  
  // Sincronización
  syncInterval: number;
  autoSync: boolean;
  maxRetries: number;
  
  // Características
  features: {
    offlineMode: boolean;
    realtime: boolean;
    notifications: boolean;
    auditLog: boolean;
    darkMode: boolean;
  };
  
  // UI
  locale: string;
  timezone: string;
}

/**
 * Configuración por defecto
 */
export const defaultConfig: AppConfig = {
  appName: 'Violet ERP',
  appVersion: '2.0.0',
  
  hybridMode: 'hybrid',
  
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  
  syncInterval: 15000,
  autoSync: true,
  maxRetries: 5,
  
  features: {
    offlineMode: true,
    realtime: true,
    notifications: true,
    auditLog: true,
    darkMode: true,
  },
  
  locale: 'es-DO',
  timezone: 'America/Santo_Domingo',
};

/**
 * Configuración actual
 */
let currentConfig: AppConfig = { ...defaultConfig };

/**
 * Cargar configuración desde variables de entorno
 */
export function loadConfig(): AppConfig {
  currentConfig = {
    appName: import.meta.env.VITE_APP_NAME || defaultConfig.appName,
    appVersion: import.meta.env.VITE_APP_VERSION || defaultConfig.appVersion,
    
    hybridMode: (import.meta.env.VITE_HYBRID_MODE as HybridMode) || defaultConfig.hybridMode,
    
    apiUrl: import.meta.env.VITE_API_URL || defaultConfig.apiUrl,
    wsUrl: import.meta.env.VITE_WS_URL || defaultConfig.wsUrl,
    
    syncInterval: parseInt(import.meta.env.VITE_SYNC_INTERVAL || '15000'),
    autoSync: import.meta.env.VITE_AUTO_SYNC !== 'false',
    maxRetries: parseInt(import.meta.env.VITE_SYNC_MAX_RETRIES || '5'),
    
    features: {
      offlineMode: import.meta.env.VITE_FEATURE_OFFLINE_MODE !== 'false',
      realtime: import.meta.env.VITE_FEATURE_REALTIME !== 'false',
      notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS !== 'false',
      auditLog: import.meta.env.VITE_FEATURE_AUDIT_LOG !== 'false',
      darkMode: import.meta.env.VITE_FEATURE_DARK_MODE !== 'false',
    },
    
    locale: import.meta.env.VITE_APP_LOCALE || defaultConfig.locale,
    timezone: import.meta.env.VITE_APP_TIMEZONE || defaultConfig.timezone,
  };
  
  console.log('[Config] Configuración cargada:', currentConfig);
  return currentConfig;
}

/**
 * Obtener configuración actual
 */
export function getConfig(): AppConfig {
  return { ...currentConfig };
}

/**
 * Actualizar configuración
 */
export function updateConfig(updates: Partial<AppConfig>): void {
  currentConfig = { ...currentConfig, ...updates };
  console.log('[Config] Configuración actualizada:', currentConfig);
}

/**
 * Verificar si está en modo híbrido
 */
export function isHybridMode(): boolean {
  return currentConfig.hybridMode === 'hybrid';
}

/**
 * Verificar si está en modo local
 */
export function isLocalMode(): boolean {
  return currentConfig.hybridMode === 'local';
}

/**
 * Verificar si está en modo cloud
 */
export function isCloudMode(): boolean {
  return currentConfig.hybridMode === 'cloud';
}

/**
 * Obtener estado online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Obtener estado offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}
