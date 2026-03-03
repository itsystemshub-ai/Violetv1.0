import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

/**
 * Banner que aparece cuando el usuario pierde la conexión a internet.
 * Crítico para detectar pérdida de conectividad con Supabase en la app de escritorio.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "10px 20px",
        background: "linear-gradient(90deg, #7f1d1d, #991b1b)",
        color: "white",
        fontSize: "13px",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <WifiOff size={16} />
      <span>
        <strong>Sin conexión a internet.</strong> Violet ERP requiere conexión
        para sincronizar datos con Supabase. Verifica tu red.
      </span>
    </div>
  );
}
