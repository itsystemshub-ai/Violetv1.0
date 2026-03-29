import React, { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';

export const CloudToggle: React.FC = () => {
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleToggleCloud = async (enabled: boolean) => {
    try {
      setCloudEnabled(enabled);
      
      if (enabled) {
        toast.success('Cloud activado - Sincronización habilitada');
        // Aquí iría la lógica de activación de cloud
        await syncNow();
      } else {
        toast.info('Cloud desactivado - Modo local activado');
        // Aquí iría la lógica de desactivación de cloud
      }
    } catch (error) {
      toast.error('Error al cambiar modo Cloud');
      setCloudEnabled(!enabled);
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      // Simular sincronización
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSync(new Date());
      toast.success('Sincronización completada');
    } catch (error) {
      toast.error('Error en la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const getTimeSinceSync = () => {
    if (!lastSync) return 'Nunca';
    const minutes = Math.floor((Date.now() - lastSync.getTime()) / 60000);
    if (minutes < 1) return 'Hace menos de 1 minuto';
    if (minutes === 1) return 'Hace 1 minuto';
    if (minutes < 60) return `Hace ${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Hace 1 hora';
    return `Hace ${hours} horas`;
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {cloudEnabled ? (
              <Cloud className="w-6 h-6 text-blue-500" />
            ) : (
              <CloudOff className="w-6 h-6 text-muted-foreground" />
            )}
            <div>
              <CardTitle>Sincronización en la Nube</CardTitle>
              <CardDescription>
                {cloudEnabled 
                  ? 'Tus datos se sincronizan automáticamente' 
                  : 'Trabajando en modo local'}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={cloudEnabled}
            onCheckedChange={handleToggleCloud}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-sm font-medium">Modo actual</p>
            <p className="text-xs text-muted-foreground mt-1">
              {cloudEnabled ? 'Híbrido (Local + Cloud)' : 'Solo Local'}
            </p>
          </div>
          <Badge variant={cloudEnabled ? 'default' : 'secondary'}>
            {cloudEnabled ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {cloudEnabled && (
          <>
            {/* Última sincronización */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                {syncing ? (
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Última sincronización</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getTimeSinceSync()}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={syncNow}
                disabled={syncing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
            </div>

            {/* Configuración */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Configuración:</p>
              <div className="space-y-2 pl-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Sincronización automática</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Backup diario</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Cifrado de datos</span>
                </div>
              </div>
            </div>

            {/* Información */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium">Modo Híbrido Activo</p>
                <p className="mt-1">
                  Tus datos se guardan localmente y se sincronizan con la nube automáticamente.
                  Puedes trabajar sin internet y los cambios se sincronizarán cuando te conectes.
                </p>
              </div>
            </div>
          </>
        )}

        {!cloudEnabled && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">Modo Local</p>
              <p className="mt-1">
                Todos tus datos se guardan solo en este dispositivo.
                Activa Cloud para sincronizar con otros dispositivos y tener backups automáticos.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CloudToggle;
