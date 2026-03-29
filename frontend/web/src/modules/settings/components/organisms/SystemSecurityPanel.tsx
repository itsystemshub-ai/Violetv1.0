import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  Database,
  Server,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { BackupSettings } from '../BackupSettings';

interface SystemSecurityPanelProps {
  isMaster?: boolean;
}

export const SystemSecurityPanel: React.FC<SystemSecurityPanelProps> = ({
  isMaster = false,
}) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState(false);
  const [auditLogging, setAuditLogging] = useState(true);

  return (
    <div className="space-y-6">
      {/* Security Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-linear-to-br from-emerald-500/10 to-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Seguro</div>
            <p className="text-xs text-muted-foreground mt-1">Todas las medidas activas</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-linear-to-br from-blue-500/10 to-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Nivel de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Alto</div>
            <p className="text-xs text-muted-foreground mt-1">Configuración recomendada</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-linear-to-br from-violet-500/10 to-violet-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-violet-500" />
              Última Verificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">Hoy</div>
            <p className="text-xs text-muted-foreground mt-1">Sistema verificado</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configuración de Seguridad
          </CardTitle>
          <CardDescription>
            Administra las medidas de seguridad del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="2fa" className="text-base font-medium">
                Autenticación de Dos Factores
              </Label>
              <p className="text-sm text-muted-foreground">
                Requiere código adicional al iniciar sesión
              </p>
            </div>
            <Switch
              id="2fa"
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="session" className="text-base font-medium">
                Timeout de Sesión
              </Label>
              <p className="text-sm text-muted-foreground">
                Cierra sesión automáticamente después de inactividad
              </p>
            </div>
            <Switch
              id="session"
              checked={sessionTimeout}
              onCheckedChange={setSessionTimeout}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="whitelist" className="text-base font-medium">
                Lista Blanca de IPs
              </Label>
              <p className="text-sm text-muted-foreground">
                Restringe acceso solo a IPs autorizadas
              </p>
            </div>
            <Switch
              id="whitelist"
              checked={ipWhitelist}
              onCheckedChange={setIpWhitelist}
              disabled={!isMaster}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="audit" className="text-base font-medium">
                Registro de Auditoría
              </Label>
              <p className="text-sm text-muted-foreground">
                Registra todas las acciones del sistema
              </p>
            </div>
            <Switch
              id="audit"
              checked={auditLogging}
              onCheckedChange={setAuditLogging}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Respaldo y Recuperación
          </CardTitle>
          <CardDescription>
            Configura copias de seguridad automáticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BackupSettings />
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="border-border/50 bg-linear-to-br from-amber-500/5 to-amber-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Recomendaciones de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Contraseñas Fuertes</p>
                <p className="text-sm text-muted-foreground">
                  Usa contraseñas de al menos 12 caracteres con mayúsculas, minúsculas, números y símbolos
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Actualizaciones Regulares</p>
                <p className="text-sm text-muted-foreground">
                  Mantén el sistema actualizado con los últimos parches de seguridad
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Backups Automáticos</p>
                <p className="text-sm text-muted-foreground">
                  Configura respaldos automáticos diarios de la base de datos
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Revisa los Logs Regularmente</p>
                <p className="text-sm text-muted-foreground">
                  Verifica la pestaña de Auditoría para detectar actividad sospechosa
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSecurityPanel;
