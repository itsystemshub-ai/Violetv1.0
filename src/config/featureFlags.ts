/**
 * Sistema de Feature Flags para Violet ERP.
 * Permite habilitar/deshabilitar funcionalidades sin deployar código nuevo.
 */

export interface FeatureFlags {
  // Funcionalidades principales
  enableOfflineMode: boolean;
  enableSyncEngine: boolean;
  enableMultiTenant: boolean;
  
  // Módulos
  enableInventoryModule: boolean;
  enableSalesModule: boolean;
  enableAccountingModule: boolean;
  enableHRModule: boolean;
  enableReportsModule: boolean;
  
  // Características experimentales
  enableAIAssistant: boolean;
  enableAdvancedReports: boolean;
  enableBulkOperations: boolean;
  enableExcelImport: boolean;
  
  // Integraciones
  enableSupabaseSync: boolean;
  enableEmailNotifications: boolean;
  enableWhatsAppIntegration: boolean;
  
  // Debugging
  enableDebugMode: boolean;
  enablePerformanceMonitoring: boolean;
}

/**
 * Configuración por defecto de feature flags.
 */
const defaultFlags: FeatureFlags = {
  // Funcionalidades principales
  enableOfflineMode: true,
  enableSyncEngine: false, // Pendiente de implementación
  enableMultiTenant: true,
  
  // Módulos
  enableInventoryModule: true,
  enableSalesModule: true,
  enableAccountingModule: true,
  enableHRModule: true,
  enableReportsModule: true,
  
  // Características experimentales
  enableAIAssistant: false,
  enableAdvancedReports: false,
  enableBulkOperations: true,
  enableExcelImport: true,
  
  // Integraciones
  enableSupabaseSync: false, // Pendiente de implementación
  enableEmailNotifications: false,
  enableWhatsAppIntegration: false,
  
  // Debugging
  enableDebugMode: import.meta.env.DEV,
  enablePerformanceMonitoring: import.meta.env.PROD,
};

/**
 * Feature flags por entorno.
 */
const environmentFlags: Record<string, Partial<FeatureFlags>> = {
  development: {
    enableDebugMode: true,
    enablePerformanceMonitoring: false,
    enableAIAssistant: true, // Habilitar en dev para testing
  },
  
  staging: {
    enableDebugMode: true,
    enablePerformanceMonitoring: true,
    enableAIAssistant: true,
    enableAdvancedReports: true,
  },
  
  production: {
    enableDebugMode: false,
    enablePerformanceMonitoring: true,
    enableAIAssistant: false, // Deshabilitar hasta que esté listo
    enableAdvancedReports: false,
  },
};

class FeatureFlagManager {
  private flags: FeatureFlags;
  private environment: string;

  constructor() {
    this.environment = import.meta.env.VITE_APP_ENV || 'development';
    this.flags = this.loadFlags();
  }

  /**
   * Carga los feature flags desde múltiples fuentes.
   */
  private loadFlags(): FeatureFlags {
    // 1. Empezar con defaults
    let flags = { ...defaultFlags };

    // 2. Aplicar configuración por entorno
    const envFlags = environmentFlags[this.environment] || {};
    flags = { ...flags, ...envFlags };

    // 3. Aplicar overrides desde localStorage (para testing)
    if (typeof window !== 'undefined') {
      const localOverrides = this.loadLocalOverrides();
      flags = { ...flags, ...localOverrides };
    }

    // 4. Aplicar overrides desde variables de entorno
    const envOverrides = this.loadEnvOverrides();
    flags = { ...flags, ...envOverrides };

    return flags;
  }

  /**
   * Carga overrides desde localStorage.
   */
  private loadLocalOverrides(): Partial<FeatureFlags> {
    try {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[FeatureFlags] Error loading local overrides:', error);
    }
    return {};
  }

  /**
   * Carga overrides desde variables de entorno.
   */
  private loadEnvOverrides(): Partial<FeatureFlags> {
    const overrides: Partial<FeatureFlags> = {};

    // Mapear variables de entorno a feature flags
    const envMappings: Record<string, keyof FeatureFlags> = {
      VITE_ENABLE_OFFLINE_MODE: 'enableOfflineMode',
      VITE_ENABLE_SYNC_ENGINE: 'enableSyncEngine',
      VITE_ENABLE_AI_ASSISTANT: 'enableAIAssistant',
      VITE_ENABLE_DEBUG_MODE: 'enableDebugMode',
    };

    Object.entries(envMappings).forEach(([envVar, flagKey]) => {
      const value = import.meta.env[envVar];
      if (value !== undefined) {
        overrides[flagKey] = value === 'true' || value === true;
      }
    });

    return overrides;
  }

  /**
   * Verifica si un feature flag está habilitado.
   * 
   * @param flag - Nombre del feature flag
   * @returns true si está habilitado
   * 
   * @example
   * ```typescript
   * if (featureFlags.isEnabled('enableAIAssistant')) {
   *   // Mostrar asistente AI
   * }
   * ```
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] === true;
  }

  /**
   * Obtiene el valor de un feature flag.
   * 
   * @param flag - Nombre del feature flag
   * @returns Valor del flag
   */
  get(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  /**
   * Obtiene todos los feature flags.
   * 
   * @returns Objeto con todos los flags
   */
  getAll(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Establece un override local (solo para testing).
   * 
   * @param flag - Nombre del feature flag
   * @param value - Valor a establecer
   * 
   * @example
   * ```typescript
   * // En consola del navegador para testing
   * featureFlags.setLocal('enableAIAssistant', true);
   * ```
   */
  setLocal(flag: keyof FeatureFlags, value: boolean) {
    if (this.environment === 'production') {
      console.warn('[FeatureFlags] Cannot set local overrides in production');
      return;
    }

    const overrides = this.loadLocalOverrides();
    overrides[flag] = value;
    
    try {
      localStorage.setItem('featureFlags', JSON.stringify(overrides));
      this.flags[flag] = value;
      console.log(`[FeatureFlags] Set ${flag} = ${value}`);
    } catch (error) {
      console.error('[FeatureFlags] Error saving local override:', error);
    }
  }

  /**
   * Limpia todos los overrides locales.
   * 
   * @example
   * ```typescript
   * featureFlags.clearLocal();
   * ```
   */
  clearLocal() {
    try {
      localStorage.removeItem('featureFlags');
      this.flags = this.loadFlags();
      console.log('[FeatureFlags] Local overrides cleared');
    } catch (error) {
      console.error('[FeatureFlags] Error clearing local overrides:', error);
    }
  }

  /**
   * Imprime el estado actual de todos los flags.
   */
  debug() {
    console.group('[FeatureFlags] Current State');
    console.log('Environment:', this.environment);
    console.table(this.flags);
    console.groupEnd();
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

/**
 * Hook de React para usar feature flags.
 * 
 * @param flag - Nombre del feature flag
 * @returns true si el flag está habilitado
 * 
 * @example
 * ```typescript
 * function AIAssistant() {
 *   const isEnabled = useFeatureFlag('enableAIAssistant');
 *   
 *   if (!isEnabled) {
 *     return null;
 *   }
 *   
 *   return <AIAssistantComponent />;
 * }
 * ```
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  return featureFlags.isEnabled(flag);
}

/**
 * Componente para renderizado condicional basado en feature flags.
 * 
 * @example
 * ```typescript
 * <FeatureGate flag="enableAIAssistant">
 *   <AIAssistantComponent />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  flag,
  children,
  fallback = null,
}: {
  flag: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Exponer en window para debugging (solo en dev)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).featureFlags = featureFlags;
}
