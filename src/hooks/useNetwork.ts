import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function useNetwork() {
  const { tenant } = useSystemConfig();
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(1);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [isMasterConnected] = useState(true);
  
  // OPTIMIZACIÓN: Usar ref para evitar re-suscripciones innecesarias
  const channelRef = useRef<any>(null);

  // OPTIMIZACIÓN: Memoizar configuración del canal
  const channelConfig = useMemo(() => ({
    config: { 
      presence: { 
        key: user?.id || `anon_${Math.random().toString(36).substr(2, 5)}` 
      } 
    }
  }), [user?.id]); // Solo depende de user.id

  // OPTIMIZACIÓN: Memoizar datos de tracking
  const trackingData = useMemo(() => ({
    userId: user?.id,
    userName: user?.name || 'Sistema',
    onlineAt: new Date().toISOString(),
    role: user?.role
  }), [user?.id, user?.name, user?.role]);

  useEffect(() => {
    if (!tenant.id || tenant.id === 'none' || tenant.id === 'neutral') return;

    // Limpiar canal anterior si existe
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase.channel(`presence:${tenant.id}`, channelConfig);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setOnlineCount(count > 0 ? count : 1);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          setIsCloudConnected(true);
          await channel.track(trackingData);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsCloudConnected(false);
        }
      });

    // Check internet connection
    const updateOnlineStatus = () => {
      setIsCloudConnected(window.navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [tenant.id, user?.id, channelConfig, trackingData]); // Dependencias optimizadas

  return {
    onlineCount,
    isCloudConnected,
    isMasterConnected,
    isHealthy: isCloudConnected && isMasterConnected
  };
}
