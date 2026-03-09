/**
 * DatabasePage - Visor de Base de Datos Local (IndexedDB)
 * Muestra todas las tablas, conteo de registros y permite explorar datos
 */

import React, { useEffect, useState } from "react";
import {
  Database,
  Table2,
  RefreshCw,
  Search,
  Download,
  Trash2,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Eye,
  FileJson,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { toast } from "sonner";
import { localDb } from "@/core/database/localDb";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { BackupSettings } from "@/modules/settings/components/BackupSettings";

interface TableInfo {
  name: string;
  count: number;
  label: string;
  icon: string;
}

const TABLE_LABELS: Record<string, { label: string; icon: string }> = {
  products: { label: "Productos", icon: "📦" },
  invoices: { label: "Facturas / Documentos", icon: "🧾" },
  tenants: { label: "Empresas (Tenants)", icon: "🏢" },
  profiles: { label: "Perfiles de Usuario", icon: "👤" },
  employees: { label: "Empleados", icon: "👥" },
  financial_accounts: { label: "Cuentas Contables", icon: "🏦" },
  financial_transactions: { label: "Transacciones Financieras", icon: "💰" },
  payroll_records: { label: "Registros de Nómina", icon: "💵" },
  requisitions: { label: "Requisiciones", icon: "📋" },
  sys_config: { label: "Configuración del Sistema", icon: "⚙️" },
  audit_logs: { label: "Logs de Auditoría", icon: "📝" },
  sync_logs: { label: "Logs de Sincronización", icon: "🔄" },
  sellers: { label: "Vendedores", icon: "🧑‍💼" },
  salary_history: { label: "Historial de Salarios", icon: "📊" },
  prestaciones_acumuladas: { label: "Prestaciones Acumuladas", icon: "🏛️" },
  igtf_records: { label: "Registros IGTF", icon: "🧮" },
  compras_maestro: { label: "Compras (Maestro)", icon: "🛒" },
  compras_detalle: { label: "Compras (Detalle)", icon: "📄" },
  suppliers: { label: "Proveedores", icon: "🚚" },
  notifications: { label: "Notificaciones", icon: "🔔" },
  inventory_movements: { label: "Movimientos de Inventario", icon: "📦" },
  accounts_receivable: { label: "Cuentas por Cobrar", icon: "💳" },
  payments: { label: "Pagos", icon: "💸" },
  cash_register: { label: "Caja Registradora", icon: "🏧" },
  libro_ventas: { label: "Libro de Ventas", icon: "📕" },
  exchange_differences: { label: "Diferencial Cambiario", icon: "💱" },
};

export default function DatabasePage() {
  const [activeTab, setActiveTab] = useState("explorer");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalSize, setTotalSize] = useState<string>("Calculando...");
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 200;
  const [duplicateAnalysis, setDuplicateAnalysis] = useState<{
    total: number;
    duplicates: number;
    unique: number;
    duplicateGroups: Array<{ cauplas: string; count: number }>;
  } | null>(null);

  // Unificar productos duplicados por CAUPLAS (automático)
  const unifyDuplicates = async (allProducts: any[]) => {
    try {
      console.log("🔍 Iniciando unificación automática de duplicados...");
      console.log("📊 Total productos a analizar:", allProducts.length);

      // Agrupar por CAUPLAS
      const cauplasMap = new Map<string, any[]>();
      allProducts.forEach((product) => {
        const cauplas = String(product.cauplas || "")
          .trim()
          .toUpperCase();
        if (cauplas && cauplas !== "-" && cauplas !== "") {
          if (!cauplasMap.has(cauplas)) {
            cauplasMap.set(cauplas, []);
          }
          cauplasMap.get(cauplas)!.push(product);
        }
      });

      console.log("📋 Códigos CAUPLAS únicos encontrados:", cauplasMap.size);

      // Identificar duplicados y mantener el más reciente
      const idsToDelete: string[] = [];
      let duplicateGroupsCount = 0;

      cauplasMap.forEach((products, cauplas) => {
        if (products.length > 1) {
          duplicateGroupsCount++;
          console.log(
            `⚠️ CAUPLAS duplicado: ${cauplas} (${products.length} registros)`,
          );

          // Ordenar por fecha de actualización (más reciente primero)
          products.sort(
            (a, b) =>
              new Date(b.updated_at || 0).getTime() -
              new Date(a.updated_at || 0).getTime(),
          );

          // Mantener el primero (más reciente), eliminar el resto
          for (let i = 1; i < products.length; i++) {
            idsToDelete.push(products[i].id);
          }
        }
      });

      console.log(`🗑️ Total de duplicados a eliminar: ${idsToDelete.length}`);
      console.log(
        `📦 Grupos de duplicados encontrados: ${duplicateGroupsCount}`,
      );

      // Eliminar duplicados
      if (idsToDelete.length > 0) {
        console.log("🔄 Eliminando duplicados de la base de datos...");
        await localDb.products.bulkDelete(idsToDelete);
        console.log("✅ Duplicados eliminados exitosamente");

        toast.success(
          `✅ Unificación automática: ${idsToDelete.length} duplicados eliminados`,
        );

        // Recargar datos
        console.log("🔄 Recargando información de tablas...");
        await loadTableInfo();

        console.log("🔄 Recargando datos de productos...");
        const updatedData = (await localDb.products.toArray()) || [];
        console.log(
          "📊 Total productos después de unificación:",
          updatedData.length,
        );

        setTableData(updatedData.slice(0, 100));

        // Actualizar análisis
        const newAnalysis = analyzeDuplicates(updatedData);
        setDuplicateAnalysis(newAnalysis);
        console.log("📈 Análisis actualizado:", newAnalysis);
      } else {
        console.log("✅ No se encontraron duplicados para eliminar");
      }
    } catch (err) {
      console.error("❌ Error unificando duplicados:", err);
      toast.error("Error al unificar duplicados");
    }
  };

  // Analizar duplicados por CAUPLAS
  const analyzeDuplicates = (data: any[]) => {
    const cauplasMap = new Map<string, number>();
    let totalWithCauplas = 0;

    data.forEach((product) => {
      const cauplas = String(product.cauplas || "")
        .trim()
        .toUpperCase();
      if (cauplas && cauplas !== "-" && cauplas !== "") {
        totalWithCauplas++;
        cauplasMap.set(cauplas, (cauplasMap.get(cauplas) || 0) + 1);
      }
    });

    const duplicateGroups: Array<{ cauplas: string; count: number }> = [];
    let duplicateCount = 0;

    cauplasMap.forEach((count, cauplas) => {
      if (count > 1) {
        duplicateGroups.push({ cauplas, count });
        duplicateCount += count;
      }
    });

    duplicateGroups.sort((a, b) => b.count - a.count);

    return {
      total: data.length,
      duplicates: duplicateCount,
      unique: data.length - duplicateCount + duplicateGroups.length,
      duplicateGroups: duplicateGroups.slice(0, 10), // Top 10
    };
  };

  // Cargar info de todas las tablas
  const loadTableInfo = async () => {
    setIsLoading(true);
    try {
      const tableNames = localDb.tables.map((t) => t.name);
      const tableInfos: TableInfo[] = [];

      for (const name of tableNames) {
        try {
          const count = (await (localDb as any)[name]?.count?.()) || 0;
          const meta = TABLE_LABELS[name] || { label: name, icon: "📁" };
          tableInfos.push({
            name,
            count,
            label: meta.label,
            icon: meta.icon,
          });
        } catch {
          tableInfos.push({
            name,
            count: 0,
            label: name,
            icon: "📁",
          });
        }
      }

      tableInfos.sort((a, b) => b.count - a.count);
      setTables(tableInfos);

      // Estimar tamaño
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        const usageMB = ((est.usage || 0) / (1024 * 1024)).toFixed(2);
        const quotaMB = ((est.quota || 0) / (1024 * 1024)).toFixed(0);
        setTotalSize(`${usageMB} MB / ${quotaMB} MB`);
      }
    } catch (err) {
      console.error("Error loading table info:", err);
      toast.error("Error al cargar información de la base de datos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTableInfo();
  }, []);

  // Cargar datos de una tabla específica
  const loadTableData = async (tableName: string) => {
    setSelectedTable(tableName);
    setExpandedRecord(null);
    setSearchTerm("");
    setDuplicateAnalysis(null);
    setCurrentPage(1); // Reset a página 1
    try {
      console.log(`📂 Cargando tabla: ${tableName}`);
      const data = (await (localDb as any)[tableName]?.toArray()) || [];
      console.log(`📊 Total registros en ${tableName}:`, data.length);

      setTableData(data); // Guardar todos los datos

      // Si es la tabla de productos, analizar y unificar duplicados por CAUPLAS
      if (tableName === "products") {
        console.log("🔍 Analizando duplicados en productos...");
        const analysis = analyzeDuplicates(data);
        console.log("📈 Resultado del análisis:", analysis);
        setDuplicateAnalysis(analysis);

        // Si hay duplicados, unificarlos automáticamente
        if (analysis.duplicates > 0) {
          console.log(
            "⚠️ Duplicados detectados, iniciando unificación automática...",
          );
          await unifyDuplicates(data);
        } else {
          console.log("✅ No se detectaron duplicados");
        }
      }
    } catch (err) {
      console.error("❌ Error loading table data:", err);
      setTableData([]);
    }
  };

  // Exportar tabla como JSON
  const exportTable = async (tableName: string) => {
    try {
      const data = (await (localDb as any)[tableName]?.toArray()) || [];
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `violet_${tableName}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        `Tabla "${tableName}" exportada (${data.length} registros)`,
      );
    } catch (err) {
      toast.error("Error al exportar");
    }
  };

  // Exportar TODA la base de datos
  const exportAllDB = async () => {
    try {
      const allData: Record<string, any[]> = {};
      for (const table of tables) {
        allData[table.name] =
          (await (localDb as any)[table.name]?.toArray()) || [];
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `violet_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Base de datos completa exportada");
    } catch (err) {
      toast.error("Error al exportar base de datos");
    }
  };

  const totalRecords = tables.reduce((sum, t) => sum + t.count, 0);

  // Filtrar registros mostrados
  const filteredData = tableData.filter((record) => {
    if (!searchTerm) return true;
    return JSON.stringify(record)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Obtener las columnas del primer registro
  const columns =
    paginatedData.length > 0 ? Object.keys(paginatedData[0]).slice(0, 8) : [];

  return (
    <>
      <div className="min-h-full relative pb-12 animate-in fade-in duration-700 overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
        <div className="fixed top-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
        <div className="fixed bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

        <div className="space-y-6 relative z-0 p-4 sm:p-6">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/30">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tighter text-foreground">
                    Base de Datos
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    Explorador de base de datos local (IndexedDB) •{" "}
                    {tables.length} tablas • {totalRecords.toLocaleString()}{" "}
                    registros • {totalSize}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="bg-muted/50 p-1 rounded-full border"
              >
                <TabsList className="bg-transparent border-none">
                  <TabsTrigger
                    value="explorer"
                    className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Explorador
                  </TabsTrigger>
                  <TabsTrigger
                    value="backup"
                    className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Backup
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="h-10 w-[1px] bg-border/50 mx-2" />

              <Button
                variant="outline"
                size="sm"
                onClick={loadTableInfo}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Actualizar
              </Button>
              <Button variant="outline" size="sm" onClick={exportAllDB}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Todo
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="explorer" className="mt-0">
              {/* MAIN GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* LEFT - Table List */}
                <div className="lg:col-span-1 space-y-2">
                  <Card className="backdrop-blur-xl bg-card/80 border shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Table2 className="h-5 w-5 text-blue-500" />
                        Tablas ({tables.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {tables.map((table) => (
                        <button
                          key={table.name}
                          onClick={() => loadTableData(table.name)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all hover:bg-muted/50 ${
                            selectedTable === table.name
                              ? "bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400"
                              : "border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">
                              {table.icon}
                            </span>
                            <span className="text-xs font-medium truncate">
                              {table.label}
                            </span>
                          </div>
                          <Badge
                            variant={table.count > 0 ? "default" : "outline"}
                            className="text-[10px] h-5 shrink-0 ml-1"
                          >
                            {table.count}
                          </Badge>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT - Data Viewer */}
                <div className="lg:col-span-3">
                  {selectedTable ? (
                    <Card className="backdrop-blur-xl bg-card/80 border shadow-lg">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <Eye className="h-5 w-5 text-blue-500" />
                              {TABLE_LABELS[selectedTable]?.icon}{" "}
                              {TABLE_LABELS[selectedTable]?.label ||
                                selectedTable}
                            </CardTitle>
                            <CardDescription>
                              {filteredData.length} registros totales •
                              Mostrando {startIndex + 1}-
                              {Math.min(endIndex, filteredData.length)} • Página{" "}
                              {currentPage} de {totalPages}
                            </CardDescription>

                            {/* Análisis de Duplicados para Productos */}
                            {duplicateAnalysis && (
                              <div className="mt-3 p-3 rounded-lg border bg-muted/30">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle
                                    className={`h-5 w-5 mt-0.5 ${duplicateAnalysis.duplicates > 0 ? "text-orange-500" : "text-green-500"}`}
                                  />
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">
                                          Total:
                                        </span>
                                        <span className="ml-2 font-bold">
                                          {duplicateAnalysis.total.toLocaleString()}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">
                                          Duplicados:
                                        </span>
                                        <span
                                          className={`ml-2 font-bold ${duplicateAnalysis.duplicates > 0 ? "text-orange-600" : "text-green-600"}`}
                                        >
                                          {duplicateAnalysis.duplicates.toLocaleString()}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">
                                          Únicos:
                                        </span>
                                        <span className="ml-2 font-bold text-green-600">
                                          {duplicateAnalysis.unique.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>

                                    {duplicateAnalysis.duplicates > 0 ? (
                                      <div className="text-xs space-y-1">
                                        <p className="font-semibold text-orange-600">
                                          ⚠️ Se detectaron{" "}
                                          {
                                            duplicateAnalysis.duplicateGroups
                                              .length
                                          }{" "}
                                          códigos CAUPLAS duplicados
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {duplicateAnalysis.duplicateGroups.map(
                                            (group) => (
                                              <Badge
                                                key={group.cauplas}
                                                variant="destructive"
                                                className="text-[10px]"
                                              >
                                                {group.cauplas} ({group.count}x)
                                              </Badge>
                                            ),
                                          )}
                                        </div>
                                        <p className="text-muted-foreground mt-2">
                                          💡 Unificación automática en
                                          proceso...
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-green-600 font-medium">
                                        ✅ No se detectaron duplicados por
                                        CAUPLAS. Todos los productos son únicos.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar..."
                                className="pl-10 w-48 h-8 text-xs"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => exportTable(selectedTable)}
                            >
                              <FileJson className="h-4 w-4 mr-1" />
                              JSON
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {paginatedData.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                            <HardDrive className="h-12 w-12 opacity-20" />
                            <p className="text-sm font-medium">
                              {searchTerm
                                ? "Sin resultados para la búsqueda"
                                : "Tabla vacía — no hay registros"}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto">
                            {/* Table Header */}
                            <div
                              className="grid gap-2 p-2 bg-muted/50 rounded-lg text-xs font-bold text-muted-foreground sticky top-0 z-10"
                              style={{
                                gridTemplateColumns: `40px repeat(${Math.min(columns.length, 6)}, 1fr) 40px`,
                              }}
                            >
                              <span>#</span>
                              {columns.slice(0, 6).map((col) => (
                                <span key={col} className="truncate">
                                  {col}
                                </span>
                              ))}
                              <span></span>
                            </div>

                            {/* Table Rows */}
                            {paginatedData.map((record, idx) => (
                              <div key={idx}>
                                <div
                                  className="grid gap-2 p-2 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer text-xs"
                                  style={{
                                    gridTemplateColumns: `40px repeat(${Math.min(columns.length, 6)}, 1fr) 40px`,
                                  }}
                                  onClick={() =>
                                    setExpandedRecord(
                                      expandedRecord === startIndex + idx
                                        ? null
                                        : startIndex + idx,
                                    )
                                  }
                                >
                                  <span className="text-muted-foreground font-mono">
                                    {startIndex + idx + 1}
                                  </span>
                                  {columns.slice(0, 6).map((col) => (
                                    <span
                                      key={col}
                                      className="truncate"
                                      title={String(record[col] ?? "")}
                                    >
                                      {typeof record[col] === "object"
                                        ? JSON.stringify(
                                            record[col],
                                          )?.substring(0, 30) + "..."
                                        : String(record[col] ?? "—")}
                                    </span>
                                  ))}
                                  <span>
                                    {expandedRecord === idx ? (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                  </span>
                                </div>
                                {expandedRecord === idx && (
                                  <div className="ml-10 p-3 rounded-lg bg-muted/20 border border-dashed text-xs animate-in slide-in-from-top-2 duration-200">
                                    <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-muted-foreground max-h-60 overflow-auto">
                                      {JSON.stringify(record, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Paginación */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Mostrando {startIndex + 1}-
                              {Math.min(endIndex, filteredData.length)} de{" "}
                              {filteredData.length} registros
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                              >
                                Primera
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.max(1, prev - 1),
                                  )
                                }
                                disabled={currentPage === 1}
                              >
                                Anterior
                              </Button>
                              <span className="text-sm px-3">
                                Página {currentPage} de {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.min(totalPages, prev + 1),
                                  )
                                }
                                disabled={currentPage === totalPages}
                              >
                                Siguiente
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                              >
                                Última
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="backdrop-blur-xl bg-card/80 border shadow-lg">
                      <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                        <Database className="h-16 w-16 opacity-15" />
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-foreground mb-1">
                            Selecciona una tabla
                          </h3>
                          <p className="text-sm">
                            Haz clic en cualquier tabla de la lista para
                            explorar sus registros
                          </p>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-xl mt-4">
                          {tables
                            .filter((t) => t.count > 0)
                            .slice(0, 6)
                            .map((t) => (
                              <button
                                key={t.name}
                                onClick={() => loadTableData(t.name)}
                                className="flex items-center gap-2 p-3 rounded-xl border bg-card/50 hover:bg-muted/50 hover:border-blue-500/30 transition-all text-left"
                              >
                                <span className="text-xl">{t.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate">
                                    {t.label}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {t.count} registros
                                  </p>
                                </div>
                              </button>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="backup" className="mt-0">
              <div className="max-w-4xl mx-auto">
                <BackupSettings />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
