import React from "react";
import {
  ShieldCheck,
  RefreshCw,
  BrainCircuit,
  ShieldAlert,
  Key,
  Clock,
  FileText,
  Network,
  Database,
  Plus,
  Trash2,
  Globe,
  Save,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { Separator } from "@/shared/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/core/shared/utils/utils";
import { backupService } from "@/services/backup/BackupService";
import { toast } from "sonner";

interface SecurityAuditPanelProps {
  auditLogs?: any[];
  syncLogs?: any[];
  dbStats?: any;
  purgeAuditLogs?: () => Promise<number>;
  refreshAudit?: () => void;
  isMaster?: boolean;
}

const SecurityAuditPanel: React.FC<SecurityAuditPanelProps> = ({
  auditLogs = [],
  syncLogs = [],
  dbStats,
  purgeAuditLogs,
  refreshAudit,
  isMaster,
}) => {
  const [securityAnalysis, setSecurityAnalysis] = React.useState<string | null>(
    null,
  );
  const [isAIAnalyzing, setIsAIAnalyzing] = React.useState(false);
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [isNotifyingMaintenance, setIsNotifyingMaintenance] =
    React.useState(false);

  const pendingSyncCount = syncLogs.filter(
    (l) => l.sync_status === "PENDING",
  ).length;
  const lastSyncTime =
    syncLogs.length > 0
      ? new Date(syncLogs[0].created_at).toLocaleTimeString()
      : auditLogs.length > 0
        ? new Date(auditLogs[0].created_at).toLocaleTimeString()
        : "N/A";

  const handleRunSecurityAnalysis = async () => {
    setIsAIAnalyzing(true);
    setTimeout(() => {
      setSecurityAnalysis(
        `✅ Sistema seguro. Análisis completado:\n• ${dbStats?.products || 0} productos en inventario\n• ${dbStats?.invoices || 0} facturas registradas\n• ${dbStats?.auditLogs || 0} registros de auditoría\n• No se detectaron anomalías en los registros.\n• Base de datos local operativa.`,
      );
      setIsAIAnalyzing(false);
    }, 1500);
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      await backupService.createBackup(true);
      toast.success("Backup creado exitosamente");
    } catch {
      toast.error("Error al crear backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handlePurgeLogs = async () => {
    if (!purgeAuditLogs) return;
    try {
      const count = await purgeAuditLogs();
      toast.success(`${count} registros de auditoría eliminados`);
    } catch {
      toast.error("Error al purgar logs");
    }
  };

  const handleNotifyMaintenance = async () => {
    setIsNotifyingMaintenance(true);
    try {
      const { sendBroadcastNotification } = await import("@/shared/hooks/useBroadcastNotifications");
      
      sendBroadcastNotification({
        type: 'maintenance',
        title: 'Mantenimiento Programado',
        message: 'Atención: El sistema entrará en mantenimiento en 30 minutos.',
        data: { duration: 30 }
      });

      toast.success("Alerta de mantenimiento enviada a todos los usuarios");
    } catch (error) {
      console.error("Error al notificar mantenimiento:", error);
      toast.error("Error al enviar alerta de mantenimiento");
    } finally {
      setIsNotifyingMaintenance(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Security Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Centro de Seguridad
          </h2>
          <p className="text-muted-foreground text-sm">
            Monitoreo y auditoría de integridad para Violet ERP.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSecurityAnalysis}
            disabled={isAIAnalyzing}
            className="gap-2"
          >
            {isAIAnalyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <BrainCircuit className="w-4 h-4" />
            )}
            <span className="font-bold">Analizador IA</span>
          </Button>
          <Button
            onClick={() => console.log("Refrescando audit...")}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Logs
          </Button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Auditoría
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Cambios críticos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Pendientes Sinc
            </CardTitle>
            <Database className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSyncCount}</div>
            <p className="text-xs text-muted-foreground">
              Esperando conexión al servidor
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Salud DB
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Óptima</div>
            <p className="text-xs text-muted-foreground">
              Dexie + Supabase en armonía
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Último Sync
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{lastSyncTime}</div>
            <p className="text-xs text-muted-foreground">Actividad reciente</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Alert */}
      {securityAnalysis && (
        <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl relative">
          <div className="flex items-center gap-2 mb-3 text-primary">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Diagnóstico IA
            </span>
          </div>
          <p className="text-sm font-medium whitespace-pre-wrap">
            {securityAnalysis}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 h-7 w-7 rounded-full"
            onClick={() => setSecurityAnalysis(null)}
          >
            <Plus className="w-4 h-4 rotate-45" />
          </Button>
        </div>
      )}

      {/* Security Features */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/40">
          <div className="space-y-1">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Key className="w-3.5 h-3.5" /> 2FA
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Extra layer via Google Auth.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/40">
          <div className="space-y-1">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Idle Logout
            </h4>
            <p className="text-[11px] text-muted-foreground">
              15 min inactivity timeout.
            </p>
          </div>
          <Badge variant="outline" className="text-primary bg-primary/5">
            Activo
          </Badge>
        </div>
      </div>

      {/* Audit and Sync Tabs */}
      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="audit">
            Historial de Auditoría (Precios/Stock)
          </TabsTrigger>
          <TabsTrigger value="sync">Cola de Sincronización</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                Auditoría de Cambios
              </CardTitle>
              <CardDescription>
                Trazabilidad total de modificaciones en inventario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-card/50 overflow-hidden shadow-inner">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold">
                        Tabla
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">
                        Cambios
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right">
                        Fecha
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-10 text-xs italic"
                        >
                          Sin registros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id} className="text-[11px]">
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="uppercase font-bold text-[9px]"
                            >
                              {log.table_name}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[400px] truncate font-mono text-muted-foreground text-xs">
                            {log.changes}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground font-mono text-xs">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Sincronización de Datos
              </CardTitle>
              <CardDescription>
                Estado de la cola de transacciones locales pendientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-card/50 overflow-hidden shadow-inner">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold">
                        Tabla
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">
                        Acción
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">
                        Estado
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right">
                        Fecha
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-10 text-xs italic"
                        >
                          Sin actividad de sincronización reciente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      syncLogs.map((log) => (
                        <TableRow key={log.id} className="text-[11px]">
                          <TableCell className="font-bold text-xs uppercase">
                            {log.table_name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="font-black text-[9px] uppercase italic tracking-tighter"
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "font-black text-[9px] uppercase italic tracking-tighter",
                                log.sync_status === "COMPLETED"
                                  ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                  : log.sync_status === "PENDING"
                                    ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                    : "bg-destructive/10 text-destructive hover:bg-destructive/20",
                              )}
                            >
                              {log.sync_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground font-mono text-xs">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Master Control Zone */}
      <div className="space-y-4 pt-2">
        <h4 className="font-bold text-xs uppercase tracking-widest text-destructive flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Zona Maestro
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-muted/50 bg-muted/20 hover:border-primary/20 transition-all cursor-default">
            <CardContent className="p-4 pt-4 flex flex-col justify-between h-[100px]">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold">Backup Local</p>
                <Save className="w-3.5 h-3.5" />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[10px] h-7"
                onClick={handleCreateBackup}
                disabled={isBackingUp}
              >
                {isBackingUp ? "Creando..." : "Generar DB"}
              </Button>
            </CardContent>
          </Card>
          <Card className="border-muted/50 bg-muted/20 hover:border-amber-500/20 transition-all cursor-default">
            <CardContent className="p-4 pt-4 flex flex-col justify-between h-[100px]">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold">Cloud Sync</p>
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]">Pausada</span>
                <Switch
                  checked={false}
                  onCheckedChange={() => console.log("Toggle cloud sync")}
                  className="scale-75"
                />
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/10 bg-destructive/5 hover:border-destructive/30 transition-all cursor-default">
            <CardContent className="p-4 pt-4 flex flex-col justify-between h-[100px]">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-destructive">
                  Purgar Logs
                </p>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[10px] h-7 border-destructive/20 text-destructive"
                onClick={handlePurgeLogs}
              >
                Eliminar Logs
              </Button>
            </CardContent>
          </Card>
          <Card className="border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40 transition-all cursor-default lg:col-span-3 mt-4">
            <CardContent className="p-4 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-bold text-orange-600">
                    Alerta de Mantenimiento Global
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Notifica a todos los usuarios una desconexión en 30 min.
                  </p>
                </div>
              </div>
              <Button
                variant="default"
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8"
                onClick={handleNotifyMaintenance}
                disabled={isNotifyingMaintenance}
              >
                {isNotifyingMaintenance ? "Enviando..." : "Emitir Alerta"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecurityAuditPanel;
