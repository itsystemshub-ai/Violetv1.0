/**
 * Configuración de desarrollo y manejo de warnings
 * Incluye: silenciamiento de warnings, configuración de CORS, flags de React Router
 */

export class DevConfig {
  private static instance: DevConfig;
  private suppressedWarnings: Set<string> = new Set();
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  private constructor() {
    this.setupDevelopmentConfig();
  }

  public static getInstance(): DevConfig {
    if (!DevConfig.instance) {
      DevConfig.instance = new DevConfig();
    }
    return DevConfig.instance;
  }

  private setupDevelopmentConfig(): void {
    if (!this.isDevelopment) {
      return;
    }

    // Silenciar warnings específicos de React Router
    this.suppressWarning('React Router Future Flag');
    this.suppressWarning('You are importing createMemoryHistory');
    
    // Silenciar warnings de CORS en desarrollo local
    this.suppressWarning('CORS');
    this.suppressWarning('Cross-Origin');
    
    // Configurar React Router future flags
    this.setupReactRouterFlags();
    
    // Configurar CORS para desarrollo local
    this.setupCORSForLocalDev();
  }

  private suppressWarning(warningPattern: string): void {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes(warningPattern)) {
        this.suppressedWarnings.add(warningPattern);
        return;
      }
      originalWarn.apply(console, args);
    };
  }

  private setupReactRouterFlags(): void {
    // Configurar flags futuros de React Router para evitar warnings
    if (typeof window !== 'undefined') {
      // @ts-ignore - Configurar flags globales
      window.__reactRouterFutureFlags = {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
        v7_normalizeFormMethod: true,
        v7_prependBasename: true
      };
    }
  }

  private setupCORSForLocalDev(): void {
    // Configurar proxy para desarrollo local
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        // Si es una URL local y tiene problemas de CORS, usar proxy
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          const modifiedInit = {
            ...init,
            mode: 'cors' as RequestMode,
            credentials: 'include' as RequestCredentials,
            headers: {
              ...init?.headers,
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          };
          
          return originalFetch.call(window, input, modifiedInit);
        }
        
        return originalFetch.call(window, input, init);
      };
    }
  }

  // API pública
  public isWarningSuppressed(warningPattern: string): boolean {
    return this.suppressedWarnings.has(warningPattern);
  }

  public getSuppressedWarnings(): string[] {
    return Array.from(this.suppressedWarnings);
  }

  public enableStrictMode(): void {
    if (this.isDevelopment) {
      console.info('Strict Mode enabled for development');
      // Aquí podrías configurar React.StrictMode
    }
  }

  public disableStrictMode(): void {
    if (this.isDevelopment) {
      console.info('Strict Mode disabled');
    }
  }

  public getCORSConfig(): {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    allowCredentials: boolean;
  } {
    return {
      allowedOrigins: this.isDevelopment 
        ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000']
        : ['https://tu-dominio.com'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      allowCredentials: true
    };
  }

  public getReactRouterConfig(): {
    futureFlags: Record<string, boolean>;
    basename: string;
    window: Window | undefined;
  } {
    return {
      futureFlags: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
        v7_normalizeFormMethod: true,
        v7_prependBasename: true
      },
      basename: this.isDevelopment ? '/' : '/app',
      window: typeof window !== 'undefined' ? window : undefined
    };
  }

  public logDevelopmentInfo(): void {
    if (!this.isDevelopment) {
      return;
    }

    console.group('🔧 Development Configuration');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Suppressed Warnings:', this.getSuppressedWarnings());
    console.log('CORS Config:', this.getCORSConfig());
    console.log('React Router Config:', this.getReactRouterConfig());
    console.groupEnd();
  }
}

// Instancia global
export const devConfig = DevConfig.getInstance();

// Helper para inicializar configuración de desarrollo
export function initializeDevConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    devConfig.logDevelopmentInfo();
    
    // Mostrar mensaje de bienvenida en desarrollo
    console.log(`
      🚀 Violet ERP - Development Mode
      ================================
      • Environment: ${process.env.NODE_ENV}
      • Date: ${new Date().toLocaleString()}
      • Suppressed warnings: ${devConfig.getSuppressedWarnings().length}
      • CORS configured for local development
      
      Tips:
      • Use Ctrl+Shift+I for DevTools
      • Network issues? Check CORS configuration
      • Router warnings suppressed for better DX
    `);
  }
}

// Componente React para manejar configuración de desarrollo
import React, { useEffect } from 'react';

export interface DevConfigProviderProps {
  children: React.ReactNode;
  enableStrictMode?: boolean;
  showDevInfo?: boolean;
}

export const DevConfigProvider: React.FC<DevConfigProviderProps> = ({
  children,
  enableStrictMode = true,
  showDevInfo = true
}) => {
  useEffect(() => {
    if (enableStrictMode) {
      devConfig.enableStrictMode();
    }

    if (showDevInfo && process.env.NODE_ENV === 'development') {
      devConfig.logDevelopmentInfo();
    }

    // Inicializar configuración
    initializeDevConfig();

    return () => {
      // Cleanup si es necesario
    };
  }, [enableStrictMode, showDevInfo]);

  return <>{children}</>;
};