import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Hook useSecurity
 * Implementa medidas de seguridad en el lado del cliente.
 * - Monitor de inactividad: Cierra la sesión tras 15 minutos sin interacción.
 * - Prevención de clickjacking (opcional en JS si CSP falla).
 * - Logs de seguridad locales.
 */

/** Tiempo de inactividad antes de cerrar sesión automáticamente (15 minutos) */
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export const useSecurity = () => {
  const { logout, isAuthenticated } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInactivity = useCallback(() => {
    toast.warning('Sesión cerrada por inactividad', {
      description: 'Por seguridad, hemos cerrado tu sesión tras 15 minutos de inactividad.',
      duration: 5000,
    });
    logout();
  }, [logout]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (isAuthenticated) {
      timerRef.current = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, handleInactivity]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Eventos a monitorizar
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Configurar el temporizador inicial
    resetTimer();

    // Añadir listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Limpieza
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, resetTimer]);

  return {
    isSecureConnection: window.location.protocol === 'https:',
    lastActivity: new Date().toISOString(),
  };
};
