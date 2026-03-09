/**
 * AdjustmentsPage - Gestión de Ajustes de Inventario
 */

import { useState } from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  DollarSign,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useAdjustments } from "@/modules/inventory/hooks/useAdjustments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export default function AdjustmentsPage() {
  const {
    adjustments,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    stats,
    deleteAdjustment,
    approveAdjustment,
    rejectAdjustment,
  } = useAdjustments();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdjustmentId, setSelectedAdjustmentId] = useState<
    string | null
  >(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const selectedAdjustment = adjustments.find(
    (a) => a.id === selectedAdjustmentId,
  );

  const kpiStats = [
    {
      label: "Total Ajustes",
      value: stats.totalAdjustments.toString(),
      icon: ClipboardList,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Pendientes",
      value: stats.pendingAdjustments.toString(),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      label: "Este Mes",
      value: stats.thisMonthCount.toString(),
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Valor Ajustado",
      value: `$${stats.totalValueAdjusted.toLocaleString()}`,
      icon: DollarSign,
      color: stats.totalValueAdjusted >= 0 ? "text-green-600" : "text-red-600",
      bgColor:
        stats.totalValueAdjusted >= 0
          ? "bg-green-50 dark:bg-green-950"
          : "bg-red-50 dark:bg-red-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: "Borrador", className: "bg-gray-500 hover:bg-gray-600" },
      pending: {
        label: "Pendiente",
        className: "bg-yellow-500 hover:bg-yellow-600",
      },
      approved: {
        label: "Aprobado",
        className: "bg-green-500 hover:bg-green-600",
      },
      rejected: {
        label: "Rechazado",
        className: "bg-red-500 hover:bg-red-600",
      },
    };
    const config = variants[status as keyof typeof variants];
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      increase: {
        label: "Entrada",
        icon: TrendingUp,
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      decrease: {
        label: "Salida",
        icon: TrendingDown,
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      correction: {
        label: "Corrección",
        icon: AlertCircle,
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
    };
    const config = variants[type as keyof typeof variants];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleDelete = () => {
    if (selectedAdjustmentId) {
      deleteAdjustment(selectedAdjustmentId);
      setDeleteDialogOpen(false);
      setSelectedAdjustmentId(null);
    }
  };

  const handleApprove = (id: string) => {
    approveAdjustment(id, "Usuario Actual");
  };

  const handleReject = (id: string) => {
    rejectAdjustment(id);
  };

  const handleView = (id: string) => {
    setSelectedAdjustmentId(id);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <ValeryLayout sidebar={<ValerySidebar />}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </ValeryLayout>
    );
  }

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-primary" />
              Ajustes de Inventario
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión de ajustes y correcciones de stock
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Ajuste
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="flex-1"
          >
            <TabsList className="w-fit">
              <TabsTrigger value="all">
                Todos ({stats.totalAdjustments})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes ({stats.pendingAdjustments})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprobados ({stats.approvedAdjustments})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="increase">Entrada</SelectItem>
                <SelectItem value="decrease">Salida</SelectItem>
                <SelectItem value="correction">Corrección</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ajustes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Adjustments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Ajustes</CardTitle>
            <CardDescription>
              {adjustments.length}{" "}
              {adjustments.length === 1
                ? "ajuste encontrado"
                : "ajustes encontrados"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {adjustments.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron ajustes
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Fecha</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Almacén</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Motivo</th>
                      <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Items</th>
                      <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Valor</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Creado por</th>
                      <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Estado</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {adjustments.map((adjustment) => (
                      <tr key={adjustment.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-xs whitespace-nowrap">{adjustment.id}</td>
                        <td className="py-3 px-3">{getTypeBadge(adjustment.type)}</td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{adjustment.date}</td>
                        <td className="py-3 px-3">{adjustment.warehouse}</td>
                        <td className="py-3 px-3 max-w-[200px] break-words">{adjustment.reason}</td>
                        <td className="py-3 px-3 text-right font-bold">{adjustment.totalItems}</td>
                        <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${adjustment.totalValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${Math.abs(adjustment.totalValue).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 max-w-[120px] break-words text-sm">{adjustment.createdBy}</td>
                        <td className="py-3 px-3 text-center">{getStatusBadge(adjustment.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleView(adjustment.id)}
                              title="Ver detalles"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {adjustment.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleApprove(adjustment.id)}
                                  title="Aprobar"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleReject(adjustment.id)}
                                  title="Rechazar"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                                </Button>
                              </>
                            )}
                            {adjustment.status === "draft" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar">
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedAdjustmentId(adjustment.id);
                                setDeleteDialogOpen(true);
                              }}
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <ModuleAIAssistant
          moduleName="Ajustes de Inventario"
          suggestions={[
            "Analizar patrones de ajustes",
            "Identificar productos con ajustes frecuentes",
            "Sugerir mejoras en control de inventario",
            "Detectar posibles pérdidas",
          ]}
        />
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ajuste?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El ajuste{" "}
              {selectedAdjustment?.id} será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles del Ajuste</DialogTitle>
            <DialogDescription>
              Información completa del ajuste {selectedAdjustment?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedAdjustment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{selectedAdjustment.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedAdjustment.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  {getTypeBadge(selectedAdjustment.type)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Almacén</p>
                  <p className="font-medium">{selectedAdjustment.warehouse}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Motivo</p>
                  <p className="font-medium">{selectedAdjustment.reason}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Productos Ajustados</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 text-sm">Producto</th>
                        <th className="text-right p-2 text-sm">Stock Actual</th>
                        <th className="text-right p-2 text-sm">Ajuste</th>
                        <th className="text-right p-2 text-sm">Nuevo Stock</th>
                        <th className="text-right p-2 text-sm">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAdjustment.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2 text-sm">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.cauplas}
                            </p>
                          </td>
                          <td className="p-2 text-sm text-right">
                            {item.currentStock}
                          </td>
                          <td
                            className={`p-2 text-sm text-right font-medium ${item.adjustedQuantity >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {item.adjustedQuantity >= 0 ? "+" : ""}
                            {item.adjustedQuantity}
                          </td>
                          <td className="p-2 text-sm text-right font-medium">
                            {item.newStock}
                          </td>
                          <td
                            className={`p-2 text-sm text-right font-medium ${item.totalValue >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            ${Math.abs(item.totalValue).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Valor Total:</span>
                  <span
                    className={
                      selectedAdjustment.totalValue >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    ${Math.abs(selectedAdjustment.totalValue).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Información Adicional</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Creado por</p>
                    <p className="font-medium">
                      {selectedAdjustment.createdBy}
                    </p>
                  </div>
                  {selectedAdjustment.approvedBy && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Aprobado por
                        </p>
                        <p className="font-medium">
                          {selectedAdjustment.approvedBy}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Fecha de Aprobación
                        </p>
                        <p className="font-medium">
                          {selectedAdjustment.approvedDate}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {selectedAdjustment.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedAdjustment.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ValeryLayout>
  );
}
