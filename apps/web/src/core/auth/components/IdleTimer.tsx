import React, { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { toast } from "sonner";

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_TIMEOUT = 30 * 1000; // 30 seconds before logout

export const IdleTimer: React.FC = () => {
  const { logout, isAuthenticated } = useAuth();
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(() => {
    toast.error("Sesión cerrada por inactividad", {
      description: "Por seguridad, tu sesión se ha cerrado automáticamente.",
    });
    logout();
  }, [logout]);

  const showWarning = useCallback(() => {
    toast.warning("Tu sesión está por expirar", {
      description: "Se cerrará en 30 segundos debido a la inactividad.",
      duration: WARNING_TIMEOUT,
    });
  }, []);

  const resetTimers = useCallback(() => {
    if (!isAuthenticated) return;

    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    // Set warning timer
    warningTimerRef.current = setTimeout(showWarning, IDLE_TIMEOUT - WARNING_TIMEOUT);
    
    // Set logout timer
    logoutTimerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
  }, [isAuthenticated, handleLogout, showWarning]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click"
    ];

    const handleEvent = () => resetTimers();

    events.forEach((event) => {
      window.addEventListener(event, handleEvent);
    });

    // Initial start
    resetTimers();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleEvent);
      });
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isAuthenticated, resetTimers]);

  return null;
};
