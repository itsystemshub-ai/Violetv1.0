/**
 * ReceiptsManager - Organismo para gestión de Recepciones (Modular)
 */

import React, { useState } from "react";
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
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Truck,
  FileText,
  Trash2,
} from "lucide-react";
import { useReceipts } from "../../hooks/useReceipts";
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

export const ReceiptsManager: React.FC = () => {
  const {
    receipts,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    deleteReceipt,
    verifyReceipt,
    completeReceipt,
    rejectReceipt,
  } = useReceipts();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null,
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const selectedReceipt = receipts.find((r) => r.id === selectedReceiptId);

  const handleDelete = async () => {
    if (selectedReceiptId) {
      await deleteReceipt(selectedReceiptId);
      setDeleteDialogOpen(false);
      setSelectedReceiptId(null);
    }
  };

  const kpiStats = [
    {
      label: "Total Recepciones",
      value: stats.totalReceipts.toString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Pendientes",
      value: stats.pendingReceipts.toString(),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Discrepancias",
      value: stats.withDiscrepancies.toString(),
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      label: "Valor Recibido",
      value: `$${stats.totalValueReceived.toLocaleString()}`,
      icon: Truck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pendiente", className: "bg-amber-500" },
      partial: { label: "Parcial", className: "bg-orange-500" },
      completed: { label: "Completado", className: "bg-emerald-500" },
      rejected: { label: "Rechazado", className: "bg-rose-500" },
    };
    const config =
      variants[status as keyof typeof variants] || variants.pending;
    return (
      <Badge
        className={`${config.className} text-white font-black text-[10px] uppercase h-5`}
      >
        {config.label}
      </Badge>
    );
  };

  const getQualityBadge = (quality: string) => {
    const variants = {
      good: {
        label: "Bueno",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
      damaged: {
        label: "Dañado",
        className: "bg-orange-100 text-orange-800 border-orange-200",
      },
      defective: {
        label: "Defectuoso",
        className: "bg-rose-100 text-rose-800 border-rose-200",
      },
    };
    const config = variants[quality as keyof typeof variants] || variants.good;
    return (
      <Badge
        variant="outline"
        className={`${config.className} text-[9px] font-black uppercase h-4 px-1.5`}
      >
        {config.label}
      </Badge>
    );
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat, index) => (
          <Card
            key={index}
            className="border-none shadow-md bg-card/50 backdrop-blur-sm"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {stat.label}
                  </p>
                  <p className="text-xl font-black mt-0.5 italic tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-sm`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/60 backdrop-blur-md">
        <CardHeader className="bg-muted/10 border-b pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-fit"
            >
              <TabsList className="bg-background/50 rounded-xl p-1">
                <TabsTrigger
                  value="all"
                  className="rounded-lg px-4 font-bold text-xs"
                >
                  Todas
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="rounded-lg px-4 font-bold text-xs"
                >
                  Pendientes
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="rounded-lg px-4 font-bold text-xs"
                >
                  Completadas
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar recepciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-border/50 h-10 bg-background/50"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-border/40"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button className="rounded-xl gap-2 font-bold shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Nueva Recepción
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/20">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between p-5 hover:bg-primary/5 transition-all group gap-4 px-8"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm uppercase italic tracking-tight">
                        {receipt.id}
                      </p>
                      {receipt.hasDiscrepancies && (
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1.5 ">
                        <FileText className="w-3 h-3 opacity-40" />
                        {receipt.purchaseOrderId}
                      </span>
                      <span>{receipt.date}</span>
                      <span>{receipt.supplier}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 lg:gap-10">
                  <div className="text-left lg:text-right">
                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-0.5">
                      Items
                    </p>
                    <p className="font-black text-sm italic">
                      {receipt.totalItems}
                    </p>
                  </div>

                  <div className="text-left lg:text-right min-w-[100px]">
                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-0.5">
                      Valor Neto
                    </p>
                    <p className="font-black text-base italic tabular-nums text-emerald-600">
                      ${receipt.totalValue.toLocaleString()}
                    </p>
                  </div>

                  <div className="w-24">{getStatusBadge(receipt.status)}</div>

                  <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => {
                        setSelectedReceiptId(receipt.id);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {receipt.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-emerald-600"
                        onClick={() => completeReceipt(receipt.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-rose-500"
                      onClick={() => {
                        setSelectedReceiptId(receipt.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black italic uppercase text-primary text-xl">
              ¿Eliminar recepción?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-xs uppercase tracking-widest">
              Esta acción no se puede deshacer. La recepción{" "}
              <span className="text-foreground">{selectedReceipt?.id}</span>{" "}
              será eliminada permanentemente del historial de almacén.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
              Regresar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black italic uppercase text-primary text-xl tracking-tighter">
              Resumen de Recepción de Mercancía
            </DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">
              Auditoría técnica de ingreso para {selectedReceipt?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">
                    Fecha Ingreso
                  </p>
                  <p className="font-bold text-xs italic">
                    {selectedReceipt.date}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">
                    Estado
                  </p>
                  {getStatusBadge(selectedReceipt.status)}
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">
                    Orden Ref.
                  </p>
                  <p className="font-black text-xs italic">
                    {selectedReceipt.purchaseOrderId}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">
                    Proveedor
                  </p>
                  <p className="font-bold text-xs truncate">
                    {selectedReceipt.supplier}
                  </p>
                </div>
              </div>

              {selectedReceipt.hasDiscrepancies && (
                <div className="border border-orange-200/50 rounded-2xl p-4 bg-orange-500/5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <h4 className="font-black text-[10px] uppercase tracking-widest text-orange-900 dark:text-orange-100">
                      Discrepancias en Verificación
                    </h4>
                  </div>
                  <p className="text-xs font-bold text-orange-800 dark:text-orange-200 opacity-80">
                    {selectedReceipt.discrepancyNotes}
                  </p>
                </div>
              )}

              <div className="border-t border-border/40 pt-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                  <Package className="w-3 h-3" />
                  Conteo de Mercancía
                </h4>
                <div className="border border-border/40 rounded-2xl overflow-hidden bg-muted/5 shadow-inner">
                  <table className="w-full text-[10px]">
                    <thead className="bg-muted/30 border-b border-border/40">
                      <tr>
                        <th className="text-left p-3 font-black uppercase tracking-widest">
                          Producto
                        </th>
                        <th className="text-right p-3 font-black uppercase tracking-widest">
                          Ord.
                        </th>
                        <th className="text-right p-3 font-black uppercase tracking-widest text-emerald-600">
                          Rec.
                        </th>
                        <th className="text-right p-3 font-black uppercase tracking-widest text-rose-500">
                          Pend.
                        </th>
                        <th className="text-center p-3 font-black uppercase tracking-widest">
                          Estado
                        </th>
                        <th className="text-right p-3 font-black uppercase tracking-widest">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReceipt.items.map((item) => (
                        <tr key={item.id} className="border-t border-border/20">
                          <td className="p-3">
                            <p className="font-black text-foreground/80">
                              {item.productName}
                            </p>
                            <p className="text-[9px] font-mono text-muted-foreground uppercase">
                              {item.sku}
                            </p>
                          </td>
                          <td className="p-3 text-right font-bold opacity-60">
                            {item.orderedQuantity}
                          </td>
                          <td className="p-3 text-right font-black text-emerald-600">
                            {item.receivedQuantity}
                          </td>
                          <td className="p-3 text-right font-black text-rose-500">
                            {item.pendingQuantity}
                          </td>
                          <td className="p-3 text-center">
                            {getQualityBadge(item.quality)}
                          </td>
                          <td className="p-3 text-right font-black italic">
                            ${item.totalCost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start border-t border-border/40 pt-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">
                    Trazabilidad
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-muted/20 border border-border/40">
                      <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                        Recibido por
                      </span>
                      <span className="font-bold text-[10px] italic">
                        {selectedReceipt.receivedBy}
                      </span>
                    </div>
                    {selectedReceipt.trackingNumber && (
                      <div className="flex justify-between items-center p-3 rounded-xl bg-muted/20 border border-border/40">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest truncate max-w-[80px]">
                          Guía Tracking
                        </span>
                        <span className="font-bold text-[10px] italic">
                          {selectedReceipt.trackingNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4 py-2 border-b border-border/20 mt-4">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">
                      Carga de Ítems
                    </span>
                    <span className="font-bold text-xs italic">
                      {selectedReceipt.totalItems} unidades
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-sm">
                    <span className="text-xs font-black uppercase text-emerald-600 tracking-widest">
                      Valorización Ingreso
                    </span>
                    <span className="font-black text-2xl italic tracking-tighter text-emerald-600">
                      ${selectedReceipt.totalValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
