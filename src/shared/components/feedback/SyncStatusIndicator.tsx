import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { localDb } from '@/lib/localDb';
import { SyncEngine } from '@/lib/SyncEngine';

interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  hasErrors: boolean;
}

export const SyncStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    lastSyncTime: null,
    isSyncing: false,
    hasErrors: false,
  });

  const updateStatus = async () => {
    try {
      const pending = await localDb.sync_logs
        .where('sync_status')
        .equals('PENDING')
        .count();

      const failed = await localDb.sync_logs
        .where('sync_status')
        .equals('FAILED')
        .count();

      const lastCompleted = await localDb.sync_logs
        .where('sync_status')
        .equals('COMPLETED')
        .reverse()
        .first();

      setStatus((prev) => ({
        ...prev,
        pendingCount: pending,
        hasErrors: failed > 0,
        lastSyncTime: lastCompleted ? new Date(lastCompleted.created_at) : null,
      }));
    } catch (error) {
      console.error('[SyncStatusIndicator] Error updating status:', error);
    }
  };

  const handleSync = async () => {
    if (!status.isOnline || status.isSyncing) return;

    setStatus((prev) => ({ ...prev, isSyncing: true }));
    
    try {
      await SyncEngine.syncPending();
      await updateStatus();
    } catch (error) {
      console.error('[SyncStatusIndicator] Sync error:', error);
    } finally {
      setStatus((prev) => ({ ...prev, isSyncing: false }));
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      handleSync();
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update status every 30 seconds
    const interval = setInterval(updateStatus, 30000);
    updateStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="w-3.5 h-3.5" />;
    }
    if (status.isSyncing) {
      return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
    }
    if (status.hasErrors) {
      return <AlertCircle className="w-3.5 h-3.5" />;
    }
    if (status.pendingCount > 0) {
      return <Cloud className="w-3.5 h-3.5" />;
    }
    return <CheckCircle2 className="w-3.5 h-3.5" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Sin conexión';
    if (status.isSyncing) return 'Sincronizando...';
    if (status.hasErrors) return 'Errores de sincronización';
    if (status.pendingCount > 0) return `${status.pendingCount} pendientes`;
    return 'Sincronizado';
  };

  const getStatusVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!status.isOnline) return 'secondary';
    if (status.hasErrors) return 'destructive';
    if (status.pendingCount > 0) return 'outline';
    return 'default';
  };

  const getTooltipContent = () => {
    const parts = [];
    
    if (!status.isOnline) {
      parts.push('Modo offline - Los cambios se guardan localmente');
    } else {
      parts.push('Conexión activa');
    }

    if (status.pendingCount > 0) {
      parts.push(`${status.pendingCount} cambios esperando sincronización`);
    }

    if (status.lastSyncTime) {
      const timeAgo = Math.floor((Date.now() - status.lastSyncTime.getTime()) / 1000);
      if (timeAgo < 60) {
        parts.push(`Última sincronización: hace ${timeAgo}s`);
      } else if (timeAgo < 3600) {
        parts.push(`Última sincronización: hace ${Math.floor(timeAgo / 60)}m`);
      } else {
        parts.push(`Última sincronización: hace ${Math.floor(timeAgo / 3600)}h`);
      }
    }

    return parts.join(' • ');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge
              variant={getStatusVariant()}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 cursor-pointer transition-all',
                status.isOnline && !status.isSyncing && 'hover:opacity-80'
              )}
              onClick={status.isOnline && !status.isSyncing ? handleSync : undefined}
            >
              {getStatusIcon()}
              <span className="text-xs font-medium">{getStatusText()}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getTooltipContent()}</p>
          {status.isOnline && status.pendingCount > 0 && !status.isSyncing && (
            <p className="text-xs text-muted-foreground mt-1">
              Click para sincronizar ahora
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
