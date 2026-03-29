/**
 * Violet ERP - Sentry Configuration (Disabled)
 * Sentry está deshabilitado por defecto
 * Para habilitar: instalar @sentry/react y configurar DSN
 */

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    return;
  }

  console.log('[Sentry] Configured but not initialized - package not installed');
  console.log('[Sentry] To enable: npm install @sentry/react');
}
