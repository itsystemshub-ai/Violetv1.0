/**
 * SystemSecurityPanel - Panel unificado de Sistema y Seguridad
 * Combina: Backup, Monitoreo, Historial y Seguridad en una sola vista simplificada
 */

import React, { useState } from 'react';
import {
  Shield,
  Database,
  Activity,
  History,
  Server,
  CheckCircle2,
  Eye,
  Plus,
  FileEdit,
  Trash2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
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
  const totalLogs = auditLogs.length;
  const recentLogs = auditLogs.slice(0, 5);

  return (
    <div className="space-y-6">
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

        {/* Overview Tab - Resumen rápido */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-linear-to-br from-emerald-500/10 to-emerald-500/5 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">Operativo</div>
                <p className="text-xs text-muted-foreground mt-1">Todos los servicios activos</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-linear-to-br from-blue-500/10 to-blue-500/5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('backup')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  Último Backup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Hoy</div>
                <p className="text-xs text-muted-foreground mt-1">Click para configurar</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-linear-to-br from-violet-500/10 to-violet-500/5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('activity')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-violet-500" />
                  Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-violet-600">{totalLogs}</div>
                <p className="text-xs text-muted-foreground mt-1">Click para ver historial</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-linear-to-br from-amber-500/10 to-amber-500/5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('monitor')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-500" />
                  Monitoreo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">100%</div>
                <p className="text-xs text-muted-foreground mt-1">Click para detalles</p>
              </CardContent>
            </Card>
          </div>

          {/* Actividad Reciente */}
          {recentLogs.length > 0 && (
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
                <div className="space-y-2">
                  {recentLogs.map((log: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
              </CardContent>
            </Card>
          )}
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
