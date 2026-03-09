import React, { useEffect } from "react";
import { NetworkService } from "@/services/LocalNetworkService";
import { toast } from "sonner";
import { ShieldAlert, Clock } from "lucide-react";

/**
 * Componente global que escucha alertas de mantenimiento vía Socket.io
 */
export const MaintenanceResponder: React.FC = () => {
  useEffect(() => {
    const socket = NetworkService.getSocket();

    if (!socket) {
      // Si el socket aún no está listo, intentamos reconectar
      NetworkService.connect();
    }

    const handleMaintenance = (data: {
      message: string;
      duration: number;
      timestamp: string;
    }) => {
      console.log("[System] Alerta de mantenimiento recibida:", data);

      toast.error(data.message, {
        duration: 20000, // 20 segundos visible
        important: true,
        icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
        description: `Duración estimada: ${data.duration} min. Publicado: ${new Date(data.timestamp).toLocaleTimeString()}`,
        dismissible: false,
        action: {
          label: "Entendido",
          onClick: () => console.log("Notificación cerrada por el usuario"),
        },
      });

      // También podríamos disparar un banner persistente en el header o forzar logout si fuera inmediato
    };

    const socketInstance = NetworkService.getSocket();
    if (socketInstance) {
      socketInstance.on("system:maintenance", handleMaintenance);
    }

    return () => {
      const s = NetworkService.getSocket();
      if (s) {
        s.off("system:maintenance", handleMaintenance);
      }
    };
  }, []);

  return null; // Este componente no renderiza nada visual, solo activa toasts
};
