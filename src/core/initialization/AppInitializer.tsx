/**
 * AppInitializer - Maneja la inicialización de la aplicación
 *
 * Arquitectura: Initialization Pattern
 * - Separa la lógica de inicialización del componente App
 * - Maneja estados de carga y error
 * - Implementa retry logic
 * - Incluye: seguridad, manejo de errores, validaciones, configuración de desarrollo
 */

import React, { useEffect, useState, useCallback } from "react";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { NetworkService } from "@/services/LocalNetworkService";
import { backupService } from "@/services/backup/BackupService";
import { errorHandler, ErrorSeverity, ErrorCategory } from "@/core/error/ErrorHandler";
import { devConfig, initializeDevConfig } from "@/core/config/DevConfig";
import { securityService } from "@/core/security/SecurityService";
import { defaultValidator } from "@/modules/inventory/utils/validation";

interface AppInitializerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface InitializationState {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Loading Fallback Component
 */
const DefaultLoadingFallback: React.FC = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
      <div className="absolute top-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div className="text-center space-y-2">
      <p className="text-lg font-semibold text-foreground">
        Inicializando Violet ERP
      </p>
      <p className="text-sm text-muted-foreground animate-pulse">
        Configurando servicios...
      </p>
    </div>
  </div>
);

/**
 * Error Fallback Component
 */
const ErrorFallback: React.FC<{ error: Error; onRetry: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-6 p-6">
    <div className="max-w-md w-full bg-destructive/10 border border-destructive/20 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Error de Inicialización
          </h2>
          <p className="text-sm text-muted-foreground">
            No se pudo inicializar la aplicación
          </p>
        </div>
      </div>

      <div className="bg-background/50 rounded p-3">
        <p className="text-sm text-destructive font-mono">{error.message}</p>
      </div>

      <button
        onClick={onRetry}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 font-medium transition-colors"
      >
        Reintentar
      </button>
    </div>
  </div>
);

/**
 * AppInitializer Component
 */
export const AppInitializer: React.FC<AppInitializerProps> = ({
  children,
  fallback = <DefaultLoadingFallback />,
}) => {
  const { fetchAllTenants } = useSystemConfig();
  const [state, setState] = useState<InitializationState>({
    isInitialized: false,
    isLoading: true,
    error: null,
    retryCount: 0,
  });

  /**
   * Initialize application services
   */
  const initialize = useCallback(async () => {
    try {
      console.log("[AppInitializer] 🚀 Iniciando servicios...");

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // 0. Configuración de desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log("[AppInitializer] 🔧 Configurando modo desarrollo...");
        devConfig.logDevelopmentInfo();
        initializeDevConfig();
      }

      // 1. Inicializar sistema de manejo de errores
      console.log("[AppInitializer] 🛡️  Inicializando manejo de errores...");
      errorHandler.enableErrorReporting();
      
      // Configurar listener global de errores
      errorHandler.addErrorListener((error) => {
        console.error('[AppInitializer] Error capturado:', error);
        
        // Mostrar notificación para errores críticos
        if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
          // Puedes integrar con tu sistema de notificaciones aquí
          console.error('Error crítico detectado:', error.message);
        }
      });

      // 2. Inicializar seguridad
      console.log("[AppInitializer] 🔐 Inicializando seguridad...");
      try {
        await securityService.initializeEncryption();
        console.log("[AppInitializer] ✅ Seguridad inicializada");
      } catch (securityError) {
        console.warn("[AppInitializer] ⚠️  Error inicializando seguridad:", securityError);
        // Continuar sin seguridad en modo desarrollo
        if (process.env.NODE_ENV === 'production') {
          throw securityError;
        }
      }

      // 3. Inicializar validaciones
      console.log("[AppInitializer] 📋 Inicializando sistema de validaciones...");
      // El validador ya está inicializado como singleton

      // 4. Fetch tenants configuration
      console.log("[AppInitializer] 📦 Cargando configuración de tenants...");
      await fetchAllTenants();

      // 5. Initialize network service
      console.log("[AppInitializer] 🌐 Inicializando servicio de red...");
      const configuredIp = localStorage.getItem("master_ip") || "localhost";
      NetworkService.connect(configuredIp);

      // 6. Initialize backup service
      console.log("[AppInitializer] 💾 Inicializando servicio de backup...");
      backupService.getConfig();

      // 7. Verificar compatibilidad del navegador
      console.log("[AppInitializer] 🌍 Verificando compatibilidad del navegador...");
      checkBrowserCompatibility();

      console.log("[AppInitializer] ✅ Servicios inicializados correctamente");

      setState({
        isInitialized: true,
        isLoading: false,
        error: null,
        retryCount: 0,
      });
    } catch (error) {
      console.error("[AppInitializer] ❌ Error al inicializar:", error);

      const err =
        error instanceof Error ? error : new Error("Error desconocido");

      // Registrar error en el sistema de manejo de errores
      errorHandler.handleError(
        err,
        ErrorSeverity.CRITICAL,
        ErrorCategory.UNKNOWN,
        { module: 'app', component: 'initialization', retryCount: state.retryCount }
      );

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err,
        retryCount: prev.retryCount + 1,
      }));

      // Auto-retry if under max retries
      if (state.retryCount < MAX_RETRIES) {
        console.log(
          `[AppInitializer] 🔄 Reintentando en ${RETRY_DELAY}ms... (${state.retryCount + 1}/${MAX_RETRIES})`,
        );
        setTimeout(() => {
          initialize();
        }, RETRY_DELAY);
      }
    }
  }, [fetchAllTenants, state.retryCount]);

  /**
   * Initialize on mount
   */
  /**
   * Check browser compatibility
   */
  const checkBrowserCompatibility = () => {
    const compatibilityIssues: string[] = [];

    // Verificar Web Crypto API (necesaria para seguridad)
    if (!window.crypto || !window.crypto.subtle) {
      compatibilityIssues.push('Web Crypto API no disponible. La seguridad estará limitada.');
    }

    // Verificar localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch {
      compatibilityIssues.push('localStorage no disponible. Algunas funciones no estarán disponibles.');
    }

    // Verificar IndexedDB
    if (!window.indexedDB) {
      compatibilityIssues.push('IndexedDB no disponible. La base de datos local no funcionará.');
    }

    // Verificar características modernas
    if (!window.Promise) {
      compatibilityIssues.push('Promises no disponibles. La aplicación no funcionará correctamente.');
    }

    if (!window.fetch) {
      compatibilityIssues.push('Fetch API no disponible. Las peticiones de red no funcionarán.');
    }

    if (compatibilityIssues.length > 0) {
      console.warn('[AppInitializer] ⚠️  Problemas de compatibilidad detectados:');
      compatibilityIssues.forEach(issue => console.warn(`  • ${issue}`));
      
      errorHandler.handleError(
        new Error('Problemas de compatibilidad del navegador'),
        ErrorSeverity.MEDIUM,
        ErrorCategory.UI,
        { issues: compatibilityIssues }
      );
    }
  };

  /**
   * Initialize on mount & Handle Branding
   */
  useEffect(() => {
    initialize();

    // Setup branding subscription
    const unsubscribe = useSystemConfig.subscribe(
      (state) => state.tenant,
      (tenant) => {
        const root = document.documentElement;
        if (!tenant) return;

        const color = tenant.primaryColor || "#7c3aed";
        root.style.setProperty("--primary", color);
        root.style.setProperty("--ring", color);

        document.title =
          tenant.id === "none" ? "Violet ERP" : `${tenant.name} | Violet ERP`;
        console.log(
          `[Branding] Aplicando identidad: ${tenant.name} (${color})`,
        );
      },
      { fireImmediately: true },
    );

    return () => unsubscribe();
  }, [initialize]);

  /**
   * Handle retry
   */
  const handleRetry = useCallback(() => {
    setState((prev) => ({ ...prev, retryCount: 0 }));
    initialize();
  }, [initialize]);

  // Show error state
  if (state.error && state.retryCount >= MAX_RETRIES) {
    return <ErrorFallback error={state.error} onRetry={handleRetry} />;
  }

  // Show loading state
  if (state.isLoading || !state.isInitialized) {
    return <>{fallback}</>;
  }

  // Show children when initialized
  return <>{children}</>;
};

export default AppInitializer;
