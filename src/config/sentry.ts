import * as Sentry from '@sentry/react';

/**
 * Inicializa Sentry para logging y monitoreo de errores en producción.
 * 
 * @example
 * ```typescript
 * // En main.tsx
 * import { initSentry } from '@/lib/sentry';
 * initSentry();
 * ```
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
  const enableSentry = import.meta.env.VITE_ENABLE_SENTRY === 'true';

  // Solo inicializar en producción o staging
  if (!enableSentry || !dsn) {
    console.log('[Sentry] Disabled or DSN not configured');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        // Rastreo de navegación
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.violeterp\.com/,
        ],
      }),
      new Sentry.Replay({
        // Replay de sesiones para debugging
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Release tracking
    release: `violet-erp@${import.meta.env.VITE_APP_VERSION || '0.0.1'}`,

    // Filtros de errores
    beforeSend(event, hint) {
      // No enviar errores de desarrollo
      if (environment === 'development') {
        return null;
      }

      // Filtrar errores conocidos que no son críticos
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignorar errores de red temporales
        if (error.message.includes('NetworkError') || 
            error.message.includes('Failed to fetch')) {
          return null;
        }

        // Ignorar errores de extensiones del navegador
        if (error.stack?.includes('chrome-extension://') ||
            error.stack?.includes('moz-extension://')) {
          return null;
        }
      }

      return event;
    },

    // Configuración de privacidad
    beforeBreadcrumb(breadcrumb) {
      // No capturar datos sensibles en breadcrumbs
      if (breadcrumb.category === 'console') {
        return null;
      }
      
      // Sanitizar URLs con tokens
      if (breadcrumb.data?.url) {
        breadcrumb.data.url = breadcrumb.data.url.replace(/token=[^&]+/, 'token=***');
      }

      return breadcrumb;
    },
  });

  console.log(`[Sentry] Initialized for ${environment}`);
}

/**
 * Captura un error manualmente en Sentry.
 * 
 * @param error - Error a capturar
 * @param context - Contexto adicional
 * 
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureError(error, {
 *     module: 'sales',
 *     operation: 'processSale',
 *     userId: user.id
 *   });
 * }
 * ```
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.VITE_ENABLE_SENTRY !== 'true') {
    console.error('[Sentry] Error captured (disabled):', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Captura un mensaje informativo en Sentry.
 * 
 * @param message - Mensaje a capturar
 * @param level - Nivel de severidad
 * @param context - Contexto adicional
 * 
 * @example
 * ```typescript
 * captureMessage('Usuario completó onboarding', 'info', {
 *   userId: user.id,
 *   tenantId: tenant.id
 * });
 * ```
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  if (import.meta.env.VITE_ENABLE_SENTRY !== 'true') {
    console.log(`[Sentry] Message captured (disabled) [${level}]:`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Establece el contexto del usuario para Sentry.
 * 
 * @param user - Información del usuario
 * 
 * @example
 * ```typescript
 * setUserContext({
 *   id: user.id,
 *   email: user.email,
 *   username: user.username,
 *   tenantId: user.tenantId
 * });
 * ```
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  tenantId?: string;
}) {
  if (import.meta.env.VITE_ENABLE_SENTRY !== 'true') {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    tenant_id: user.tenantId,
  });
}

/**
 * Limpia el contexto del usuario (al hacer logout).
 * 
 * @example
 * ```typescript
 * // En logout
 * clearUserContext();
 * ```
 */
export function clearUserContext() {
  if (import.meta.env.VITE_ENABLE_SENTRY !== 'true') {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Agrega contexto adicional a los eventos de Sentry.
 * 
 * @param key - Clave del contexto
 * @param data - Datos del contexto
 * 
 * @example
 * ```typescript
 * setContext('tenant', {
 *   id: tenant.id,
 *   name: tenant.name,
 *   plan: tenant.plan
 * });
 * ```
 */
export function setContext(key: string, data: Record<string, any>) {
  if (import.meta.env.VITE_ENABLE_SENTRY !== 'true') {
    return;
  }

  Sentry.setContext(key, data);
}

/**
 * Inicia una transacción de performance.
 * 
 * @param name - Nombre de la transacción
 * @param op - Operación
 * @returns Transacción de Sentry
 * 
 * @example
 * ```typescript
 * const transaction = startTransaction('load-dashboard', 'pageload');
 * // ... operaciones
 * transaction.finish();
 * ```
 */
export function startTransaction(name: string, op: string) {
  if (import.meta.env.VITE_ENABLE_SENTRY !== 'true') {
    return {
      finish: () => {},
      setStatus: () => {},
    };
  }

  return Sentry.startTransaction({
    name,
    op,
  });
}
