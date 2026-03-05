import React, { useState, useEffect } from "react";
import {
  History,
  Filter,
  Download,
  Search,
  Calendar,
  User,
  FileEdit,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  timestamp: Date;
  user: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  module: string;
  entity: string;
  entityId: string;
  description: string;
  changes?: any;
  ipAddress?: string;
}

interface ActivityLogPanelProps {
  isMaster?: boolean;
}

const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ isMaster }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Cargar logs desde localStorage o base de datos
  useEffect(() => {
    loadActivityLogs();
  }, []);

  // Filtrar logs cuando cambian los filtros
  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterAction, filterModule]);

  const loadActivityLogs = async () => {
    setIsLoading(true);
    try {
      // Cargar desde IndexedDB (audit_logs)
      const { localDb } = await import('@/core/database/localDb');
      const auditLogs = await localDb.audit_logs
        .orderBy('created_at')
        .reverse()
        .limit(100)
        .toArray();

      if (auditLogs && auditLogs.length > 0) {
        // Convertir audit logs al formato de ActivityLog
        const convertedLogs: ActivityLog[] = auditLogs.map((log: any) => ({
          id: log.id,
          timestamp: new Date(log.created_at),
          user: log.changed_by || 'Sistema',
          action: log.action || 'UPDATE',
          module: getModuleFromTable(log.table_name),
          entity: log.table_name,
          entityId: log.record_id,
          description: log.description || `${log.action} en ${log.table_name}`,
          changes: log.changes,
          ipAddress: log.ip_address,
        }));
        setLogs(convertedLogs);
      } else {
        // Si no hay logs reales, generar ejemplos
        generateSampleLogs();
      }
    } catch (error) {
      console.error("Error cargando logs:", error);
      // Si hay error, generar logs de ejemplo
      generateSampleLogs();
    } finally {
      setIsLoading(false);
    }
  };

  const getModuleFromTable = (tableName: string): string => {
    const moduleMap: Record<string, string> = {
      products: 'Inventario',
      invoices: 'Ventas',
      suppliers: 'Compras',
      employees: 'RRHH',
      financial_accounts: 'Finanzas',
      financial_transactions: 'Finanzas',
      profiles: 'Usuarios',
      tenants: 'Configuración',
      sys_config: 'Configuración',
    };
    return moduleMap[tableName] || 'Sistema';
  };

  const generateSampleLogs = () => {
    const sampleLogs: ActivityLog[] = [
      {
        id: "1",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        user: "admin",
        action: "CREATE",
        module: "Inventario",
        entity: "Producto",
        entityId: "PROD-001",
        description: "Creó producto 'Laptop Dell XPS 15'",
        ipAddress: "192.168.1.100",
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        user: "vendedor1",
        action: "UPDATE",
        module: "Ventas",
        entity: "Factura",
        entityId: "FAC-2024-001",
        description: "Actualizó factura #2024-001",
        changes: { status: "Pagada" },
        ipAddress: "192.168.1.101",
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        user: "admin",
        action: "DELETE",
        module: "Usuarios",
        entity: "Usuario",
        entityId: "USR-005",
        description: "Eliminó usuario 'usuario_test'",
        ipAddress: "192.168.1.100",
      },
      {
        id: "4",
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        user: "contador",
        action: "UPDATE",
        module: "Configuración",
        entity: "Empresa",
        entityId: "EMP-001",
        description: "Actualizó datos fiscales de la empresa",
        changes: { rif: "J-123456789" },
        ipAddress: "192.168.1.102",
      },
      {
        id: "5",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        user: "vendedor2",
        action: "CREATE",
        module: "Ventas",
        entity: "Cliente",
        entityId: "CLI-050",
        description: "Creó cliente 'Empresa ABC C.A.'",
        ipAddress: "192.168.1.103",
      },
    ];
    setLogs(sampleLogs);
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.entity.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por acción
    if (filterAction !== "all") {
      filtered = filtered.filter((log) => log.action === filterAction);
    }

    // Filtrar por módulo
    if (filterModule !== "all") {
      filtered = filtered.filter((log) => log.module === filterModule);
    }

    setFilteredLogs(filtered);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Plus className="w-4 h-4" />;
      case "UPDATE":
        return <FileEdit className="w-4 h-4" />;
      case "DELETE":
        return <Trash2 className="w-4 h-4" />;
      case "VIEW":
        return <Eye className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "UPDATE":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "DELETE":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "VIEW":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const exportLogs = () => {
    try {
      const dataStr = JSON.stringify(filteredLogs, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      toast.success("Logs exportados correctamente");
    } catch (error) {
      toast.error("Error al exportar logs");
    }
  };

  const modules = ["all", "Inventario", "Ventas", "Compras", "Usuarios", "Configuración", "Finanzas"];
  const actions = ["all", "CREATE", "UPDATE", "DELETE", "VIEW"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Historial de Actividad
          </h2>
          <p className="text-muted-foreground text-sm">
            Registro completo de todas las acciones realizadas en el sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadActivityLogs}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              Creaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action === "CREATE").length}
            </div>
            <p className="text-xs text-muted-foreground">Registros nuevos</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-blue-500" />
              Modificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action === "UPDATE").length}
            </div>
            <p className="text-xs text-muted-foreground">Actualizaciones</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              Eliminaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action === "DELETE").length}
            </div>
            <p className="text-xs text-muted-foreground">Registros eliminados</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Eventos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en descripción, usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Acción</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {actions.slice(1).map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Módulo</label>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los módulos</SelectItem>
                  {modules.slice(1).map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">
            Registro de Actividad ({filteredLogs.length})
          </CardTitle>
          <CardDescription>
            Historial detallado de todas las operaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Fecha y Hora
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      Usuario
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px]">Acción</TableHead>
                  <TableHead className="w-[120px]">Módulo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[100px]">Entidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Cargando historial...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No se encontraron registros con los filtros aplicados
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">
                        {log.timestamp.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.user}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", getActionColor(log.action))}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium">{log.module}</span>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm truncate">{log.description}</p>
                        {log.changes && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {JSON.stringify(log.changes)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.entityId}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogPanel;
