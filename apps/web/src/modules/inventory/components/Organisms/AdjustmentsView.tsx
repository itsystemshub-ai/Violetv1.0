import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
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
  Eye,
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
import { formatCurrency } from "@/lib/index";

export const AdjustmentsView: React.FC = () => {
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
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: "Pendientes",
      value: stats.pendingAdjustments.toString(),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      label: "Incrementos",
      value: stats.increasesCount.toString(),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      label: "Valor Total",
      value: formatCurrency(stats.totalValueAdjusted, "USD"),
      icon: DollarSign,
      color: stats.totalValueAdjusted >= 0 ? "text-green-600" : "text-red-600",
      bgColor:
        stats.totalValueAdjusted >= 0 ? "bg-green-50/10" : "bg-red-50/10",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge
            variant="secondary"
            className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase text-[10px]"
          >
            Borrador
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 text-white uppercase text-[10px]">
            Pendiente
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-600 text-white uppercase text-[10px]">
            Aprobado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="uppercase text-[10px]">
            Rechazado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === "increase")
      return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
    if (type === "decrease")
      return <TrendingDown className="w-3.5 h-3.5 text-red-600" />;
    return <AlertCircle className="w-3.5 h-3.5 text-blue-600" />;
  };

  const handleDelete = () => {
    if (selectedAdjustmentId) {
      deleteAdjustment(selectedAdjustmentId);
      setDeleteDialogOpen(false);
      setSelectedAdjustmentId(null);
    }
  };

  const handleApprove = (id: string) => {
    approveAdjustment(id, "Admin Actual");
  };

  const handleReject = (id: string) => {
    rejectAdjustment(id);
  };

  const handleView = (id: string) => {
    setSelectedAdjustmentId(id);
    setViewDialogOpen(true);
  };

  if (loading && adjustments.length === 0) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Gestión de Ajustes
          </h2>
          <p className="text-sm text-muted-foreground">
            Auditorías y correcciones de stock.
          </p>
        </div>
        <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          Nuevo Ajuste
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiStats.map((stat, index) => (
          <Card key={index} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-black mt-1">{stat.value}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="flex-1"
        >
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all" className="text-xs font-bold">
              TODOS
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs font-bold">
              PENDIENTES
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs font-bold">
              APROBADOS
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 bg-white/50 dark:bg-black/20">
              <SelectValue placeholder="Filtrar Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ver Todos</SelectItem>
              <SelectItem value="increase">Entradas (+)</SelectItem>
              <SelectItem value="decrease">Salidas (-)</SelectItem>
              <SelectItem value="correction">Correcciones</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ajuste o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/50 dark:bg-black/20"
            />
          </div>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white/70 dark:bg-black/20 backdrop-blur-sm">
        <CardContent className="p-0">
          {adjustments.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-xl font-bold text-muted-foreground">
                No se encontraron ajustes
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-border/50">
                  <tr>
                    <th className="text-left py-4 px-4 font-bold text-muted-foreground text-xs uppercase">
                      Documento
                    </th>
                    <th className="text-left py-4 px-3 font-bold text-muted-foreground text-xs uppercase">
                      Fecha
                    </th>
                    <th className="text-left py-4 px-3 font-bold text-muted-foreground text-xs uppercase">
                      Concepto
                    </th>
                    <th className="text-right py-4 px-3 font-bold text-muted-foreground text-xs uppercase">
                      Items
                    </th>
                    <th className="text-right py-4 px-3 font-bold text-muted-foreground text-xs uppercase">
                      Valor Neto
                    </th>
                    <th className="text-center py-4 px-3 font-bold text-muted-foreground text-xs uppercase">
                      Estado
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-muted-foreground text-xs uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {adjustments.map((adjustment) => (
                    <tr
                      key={adjustment.id}
                      className="hover:bg-primary/5 transition-colors group"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(adjustment.type)}
                          <span className="font-black font-mono text-xs">
                            {adjustment.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-muted-foreground whitespace-nowrap text-xs">
                        <Clock className="w-3 h-3 inline mr-1 opacity-40" />
                        {adjustment.date}
                      </td>
                      <td className="py-4 px-3">
                        <p
                          className="font-bold text-xs truncate max-w-[200px]"
                          title={adjustment.reason}
                        >
                          {adjustment.reason}
                        </p>
                      </td>
                      <td className="py-4 px-3 text-right font-black">
                        <Badge variant="outline" className="font-black">
                          {adjustment.totalItems}
                        </Badge>
                      </td>
                      <td
                        className={`py-4 px-3 text-right font-black ${adjustment.totalValue >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(adjustment.totalValue, "USD")}
                      </td>
                      <td className="py-4 px-3 text-center">
                        {getStatusBadge(adjustment.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-slate-800"
                            onClick={() => handleView(adjustment.id)}
                          >
                            <Eye className="w-4 h-4 text-primary" />
                          </Button>
                          {adjustment.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-green-100"
                                onClick={() => handleApprove(adjustment.id)}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-red-100"
                                onClick={() => handleReject(adjustment.id)}
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-red-50 text-destructive"
                            onClick={() => {
                              setSelectedAdjustmentId(adjustment.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-card-title flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Auditoría de Ajuste
            </DialogTitle>
          </DialogHeader>
          {selectedAdjustment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Documento
                  </p>
                  <p className="font-black text-xs font-mono">
                    {selectedAdjustment.id}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Estado
                  </p>
                  {getStatusBadge(selectedAdjustment.status)}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Valor Fiscal
                  </p>
                  <p className="font-black text-xs">
                    {formatCurrency(selectedAdjustment.totalValue, "USD")}
                  </p>
                </div>
              </div>

              <div className="border border-border/50 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-bold uppercase">
                        Producto
                      </th>
                      <th className="text-right p-3 font-bold uppercase">
                        Ajuste
                      </th>
                      <th className="text-right p-3 font-bold uppercase">
                        Impacto $
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {selectedAdjustment.items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/10">
                        <td className="p-3">
                          <p className="font-black text-primary">
                            {item.cauplas}
                          </p>
                          <p className="text-[10px] uppercase opacity-60 truncate max-w-[200px]">
                            {item.productName}
                          </p>
                        </td>
                        <td
                          className={`p-3 text-right font-black ${item.adjustedQuantity >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {item.adjustedQuantity >= 0 ? "+" : ""}
                          {item.adjustedQuantity}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {formatCurrency(item.totalValue, "USD")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Confirmar eliminación del registro?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-red-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
