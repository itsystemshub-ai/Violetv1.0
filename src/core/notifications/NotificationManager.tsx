/**
 * NotificationManager - Maneja notificaciones globales
 * 
 * Arquitectura: Observer Pattern
 * - Centraliza la gestión de notificaciones
 * - Separa UI de lógica de notificaciones
 * - Facilita testing
 */

import React from 'react';
import { Toaster } from '@/shared/components/ui/toaster';
import { Toaster as Sonner } from '@/shared/components/ui/sonner';
import { useBroadcastNotifications } from '@/shared/hooks/useBroadcastNotifications';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';

/**
 * NotificationManager Component
 * 
 * Maneja:
 * - Toast notifications (shadcn/ui)
 * - Sonner notifications (toast alternativo)
 * - Broadcast notifications (multi-tab)
 */
export const NotificationManager: React.FC = () => {
  const { user } = useAuth();
  const { activeTenantId } = useSystemConfig();

  // Initialize broadcast notifications
  useBroadcastNotifications(user?.id, activeTenantId || undefined);

  return (
    <>
      <Toaster />
      <Sonner 
        position="top-right" 
        expand={false} 
        richColors 
        closeButton
        duration={4000}
      />
    </>
  );
};

export default NotificationManager;
