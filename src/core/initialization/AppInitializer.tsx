/**
 * AppInitializer - Maneja la inicialización de la aplicación
 * 
 * Arquitectura: Initialization Pattern
 * - Separa la lógica de inicialización del componente App
 * - Maneja estados de carga y error
 * - Implementa retry logic
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { NetworkService } from '@/services/LocalNetworkService';
import { backupService } from '@/services/backup/BackupService';

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
const ErrorFallback: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => (
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
        <p className="text-sm text-destructive font-mono">
          {error.message}
        </p>
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
  fallback = <DefaultLoadingFallback /> 
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
      console.log('[AppInitializer] 🚀 Iniciando servicios...');
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. Fetch tenants configuration
      console.log('[AppInitializer] 📦 Cargando configuración de tenants...');
      await fetchAllTenants();

      // 2. Initialize network service
      console.log('[AppInitializer] 🌐 Inicializando servicio de red...');
      const configuredIp = localStorage.getItem('master_ip') || 'localhost';
      NetworkService.connect(configuredIp);

      // 3. Initialize backup service
      console.log('[AppInitializer] 💾 Inicializando servicio de backup...');
      backupService.getConfig();

      console.log('[AppInitializer] ✅ Servicios inicializados correctamente');
      
      setState({
        isInitialized: true,
        isLoading: false,
        error: null,
        retryCount: 0,
      });
    } catch (error) {
      console.error('[AppInitializer] ❌ Error al inicializar:', error);
      
      const err = error instanceof Error ? error : new Error('Error desconocido');
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err,
        retryCount: prev.retryCount + 1,
      }));

      // Auto-retry if under max retries
      if (state.retryCount < MAX_RETRIES) {
        console.log(`[AppInitializer] 🔄 Reintentando en ${RETRY_DELAY}ms... (${state.retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          initialize();
        }, RETRY_DELAY);
      }
    }
  }, [fetchAllTenants, state.retryCount]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initialize();
  }, []); // Only run once on mount

  /**
   * Handle retry
   */
  const handleRetry = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }));
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
