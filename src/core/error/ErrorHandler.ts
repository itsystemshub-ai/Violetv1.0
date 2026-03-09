/**
 * Sistema centralizado de manejo de errores
 * Incluye: logging, monitoreo, recovery y reporting
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  DATABASE = 'database',
  VALIDATION = 'validation',
  SECURITY = 'security',
  UI = 'ui',
  BUSINESS_LOGIC = 'business_logic',
  THIRD_PARTY = 'third_party',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  userId?: string;
  tenantId?: string;
  module?: string;
  component?: string;
  action?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
  [key: string]: any;
}

export interface AppError extends Error {
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  originalError?: Error;
  recoverable: boolean;
  timestamp: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: AppError) => void> = [];
  private errorBuffer: AppError[] = [];
  private maxBufferSize = 100;
  private isReportingEnabled = false;

  private constructor() {
    // Configurar captura global de errores
    this.setupGlobalErrorHandling();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandling(): void {
    // Capturar errores no manejados de Promise
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason,
        ErrorSeverity.HIGH,
        ErrorCategory.UNKNOWN,
        {
          module: 'global',
          component: 'promise',
          action: 'unhandled_rejection'
        }
      );
    });

    // Capturar errores de runtime
    window.addEventListener('error', (event) => {
      this.handleError(
        event.error || new Error(event.message),
        ErrorSeverity.HIGH,
        ErrorCategory.UI,
        {
          module: 'global',
          component: 'runtime',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });

    // Capturar errores de console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.handleError(
        new Error(args.map(arg => String(arg)).join(' ')),
        ErrorSeverity.MEDIUM,
        ErrorCategory.UNKNOWN,
        {
          module: 'console',
          component: 'error',
          originalArgs: args
        }
      );
      originalConsoleError.apply(console, args);
    };
  }

  public handleError(
    error: Error | string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context: Partial<ErrorContext> = {}
  ): AppError {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const appError: AppError = {
      ...errorObj,
      name: errorObj.name || 'AppError',
      severity,
      category,
      context: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      },
      recoverable: severity !== ErrorSeverity.CRITICAL,
      timestamp: Date.now()
    };

    // Agregar al buffer
    this.errorBuffer.push(appError);
    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer.shift();
    }

    // Notificar a los listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(appError);
      } catch (listenerError) {
        // Evitar loops infinitos
        console.warn('Error en listener de errores:', listenerError);
      }
    });

    // Loggear según severidad
    this.logError(appError);

    // Intentar recovery si es recuperable
    if (appError.recoverable) {
      this.attemptRecovery(appError);
    }

    return appError;
  }

  private logError(error: AppError): void {
    const logEntry = {
      timestamp: new Date(error.timestamp).toISOString(),
      severity: error.severity,
      category: error.category,
      message: error.message,
      stack: error.stack,
      context: error.context
    };

    // Loggear en consola según severidad
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🔴 CRITICAL ERROR:', logEntry);
        break;
      case ErrorSeverity.HIGH:
        console.error('🟠 HIGH ERROR:', logEntry);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('🟡 MEDIUM ERROR:', logEntry);
        break;
      case ErrorSeverity.LOW:
        console.info('🔵 LOW ERROR:', logEntry);
        break;
    }

    // Guardar en localStorage para debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('violet-error-log') || '[]');
      errorLog.push(logEntry);
      
      // Mantener solo los últimos 50 errores
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      
      localStorage.setItem('violet-error-log', JSON.stringify(errorLog));
    } catch (storageError) {
      console.warn('No se pudo guardar error en localStorage:', storageError);
    }
  }

  private attemptRecovery(error: AppError): void {
    // Estrategias de recovery según categoría
    switch (error.category) {
      case ErrorCategory.NETWORK:
        this.recoverFromNetworkError(error);
        break;
      case ErrorCategory.DATABASE:
        this.recoverFromDatabaseError(error);
        break;
      case ErrorCategory.VALIDATION:
        this.recoverFromValidationError(error);
        break;
      default:
        // Recovery genérico
        setTimeout(() => {
          // Intentar recargar datos después de 5 segundos
          window.dispatchEvent(new CustomEvent('violet:recovery-attempt', {
            detail: { error }
          }));
        }, 5000);
    }
  }

  private recoverFromNetworkError(error: AppError): void {
    // Intentar reconexión después de delay exponencial
    const maxAttempts = 3;
    let attempts = 0;

    const attemptReconnect = () => {
      if (attempts >= maxAttempts) {
        console.warn('Máximo de intentos de reconexión alcanzado');
        return;
      }

      attempts++;
      const delay = Math.min(1000 * Math.pow(2, attempts), 10000); // Exponential backoff

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('violet:network-reconnect', {
          detail: { attempt: attempts, maxAttempts }
        }));
      }, delay);
    };

    attemptReconnect();
  }

  private recoverFromDatabaseError(error: AppError): void {
    // Limpiar caché y reintentar
    try {
      localStorage.removeItem('violet-db-cache');
      window.dispatchEvent(new CustomEvent('violet:db-recovery'));
    } catch (e) {
      console.warn('No se pudo limpiar caché de DB:', e);
    }
  }

  private recoverFromValidationError(error: AppError): void {
    // Mostrar mensaje al usuario y resetear formularios
    window.dispatchEvent(new CustomEvent('violet:validation-error', {
      detail: { 
        message: 'Error de validación detectado. Por favor, verifica los datos.',
        error 
      }
    }));
  }

  // API pública
  public addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  public getErrorBuffer(): AppError[] {
    return [...this.errorBuffer];
  }

  public clearErrorBuffer(): void {
    this.errorBuffer = [];
  }

  public getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    last24Hours: number;
  } {
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

    const errorsLast24Hours = this.errorBuffer.filter(
      error => error.timestamp >= twentyFourHoursAgo
    );

    const bySeverity = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    const byCategory = {
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.DATABASE]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.SECURITY]: 0,
      [ErrorCategory.UI]: 0,
      [ErrorCategory.BUSINESS_LOGIC]: 0,
      [ErrorCategory.THIRD_PARTY]: 0,
      [ErrorCategory.UNKNOWN]: 0
    };

    this.errorBuffer.forEach(error => {
      bySeverity[error.severity]++;
      byCategory[error.category]++;
    });

    return {
      total: this.errorBuffer.length,
      bySeverity,
      byCategory,
      last24Hours: errorsLast24Hours.length
    };
  }

  public enableErrorReporting(): void {
    this.isReportingEnabled = true;
    console.info('Error reporting enabled');
  }

  public disableErrorReporting(): void {
    this.isReportingEnabled = false;
    console.info('Error reporting disabled');
  }
}

// Instancia global
export const errorHandler = ErrorHandler.getInstance();

// Helper functions
export function createError(
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  context: Partial<ErrorContext> = {}
): AppError {
  return errorHandler.handleError(
    new Error(message),
    severity,
    category,
    context
  );
}

export function wrapPromise<T>(
  promise: Promise<T>,
  context: Partial<ErrorContext> = {}
): Promise<T> {
  return promise.catch(error => {
    errorHandler.handleError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN,
      context
    );
    throw error;
  });
}