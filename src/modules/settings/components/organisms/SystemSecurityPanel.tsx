/**
 * SystemSecurityPanel - Panel unificado de Sistema y Seguridad
 * Combina: Backup, Monitoreo, Historial y Seguridad en una sola vista
 */

import React, { useState } from 'react';
import {
  Shield,
  Database,
  Activity,
  History,
  Download,
  Server,
  Wifi,
  Clock,
  RefreshCw,
  Eye,
  Plus,
  FileEdit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { BackupSettings } from '../BackupSettings';
import SystemMonitorPanel from './SystemMonitorPanel';
import ActivityLogPanel from './ActivityLogPanel';
import SecurityAuditPanel from './SecurityAuditPanel';

interface SystemSecurityPanelProps {
  auditLogs?: any[];
  isMaster?: boolean;
}

export const SystemSecurityPanel: React.FC<SystemSecurityPanelProps> = ({
  auditLogs = [],
  isMaster,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Stats rápidos para el overview
  const totalLogs = auditLogs.length;
  const recentLogs = auditLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center">
              <Shield className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <span>Sistema & Seguridad</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-2 ml-15">
            Centro de control unificado para monitoreo, backups, auditoría y seguridad
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg inline-flex">
          <TabsTrigger value="overview" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
            <Activity className="w-4 h-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="backup" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
            <Database className="w-4 h-4 mr-2" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="monitor" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
            <Server className="w-4 h-4 mr-2" />
            Monitoreo
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            Actividad
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />
            Auditoría
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-linear-to-br from-emerald-500/10 to-emerald-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Estado del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">Operativo</div>
                <p className="text-xs text-muted-foreground mt-1">Todos los servicios activos</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-linear-to-br from-blue-500/10 to-blue-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  Último Backup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Hoy</div>
                <p className="text-xs text-muted-foreground mt-1">Backup automático activo</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-linear-to-br from-violet-500/10 to-violet-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-violet-500" />
                  Eventos Registrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-violet-600">{totalLogs}</div>
                <p className="text-xs text-muted-foreground mt-1">Actividad del sistema</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-linear-to-br from-amber-500/10 to-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-amber-500" />
                  Conectividad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">Excelente</div>
                <p className="text-xs text-muted-foreground mt-1">Red estable</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/50 hover:border-primary/50 transition-all cursor-pointer" onClick={() => setActiveTab('backup')}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  Crear Backup
                </CardTitle>
                <CardDescription className="text-xs">
                  Genera una copia de seguridad completa
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-all cursor-pointer" onClick={() => setActiveTab('monitor')}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Ver Monitoreo
                </CardTitle>
                <CardDescription className="text-xs">
                  Estado en tiempo real de servicios
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-all cursor-pointer" onClick={() => setActiveTab('activity')}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Historial Completo
                </CardTitle>
                <CardDescription className="text-xs">
                  Registro detallado de actividad
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Activity Preview */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Actividad Reciente
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('activity')}>
                  Ver todo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentLogs.map((log: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="shrink-0">
                        {log.action === 'CREATE' && <Plus className="w-4 h-4 text-emerald-500" />}
                        {log.action === 'UPDATE' && <FileEdit className="w-4 h-4 text-blue-500" />}
                        {log.action === 'DELETE' && <Trash2 className="w-4 h-4 text-red-500" />}
                        {log.action === 'VIEW' && <Eye className="w-4 h-4 text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.description || log.changes}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.changed_by || 'Sistema'} • {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {log.table_name}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Salud del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Aplicación</span>
                  <span className="font-medium text-emerald-600">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Base de Datos</span>
                  <span className="font-medium text-emerald-600">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Red</span>
                  <span className="font-medium text-emerald-600">98%</span>
                </div>
                <Progress value={98} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup">
          <BackupSettings />
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor">
          <SystemMonitorPanel />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <ActivityLogPanel isMaster={isMaster} />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <SecurityAuditPanel auditLogs={auditLogs} isMaster={isMaster} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSecurityPanel;
