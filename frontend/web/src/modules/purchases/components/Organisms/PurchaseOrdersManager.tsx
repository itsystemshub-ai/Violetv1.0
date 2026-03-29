/**
 * PurchaseOrdersManager - Organismo para gestión de Órdenes de Compra (Modular)
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
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
} from "lucide-react";
import { usePurchaseOrders } from "../../hooks/usePurchaseOrders";
import { useInventoryAutoPurchase } from "@/modules/inventory/hooks/useInventoryAutoPurchase";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { NewOrderDialog } from "./NewOrderDialog";
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

export const PurchaseOrdersManager: React.FC = () => {
  const {
    orders,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    deleteOrder,
    approveOrder,
    receiveOrder,
  } = usePurchaseOrders();

  const { suggestions, approveAllSuggestions } = useInventoryAutoPurchase();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const kpiStats = [
    {
      label: "Total Órdenes",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Pendientes",
      value: stats.pendingOrders.toString(),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Aprobadas",
      value: stats.approvedOrders.toString(),
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      label: "Monto Total",
      value: `$${stats.totalAmount.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: "Borrador", className: "bg-slate-500" },
      pending: { label: "Pendiente", className: "bg-amber-500" },
      approved: { label: "Aprobada", className: "bg-emerald-500" },
      received: { label: "Recibida", className: "bg-blue-500" },
      cancelled: { label: "Cancelada", className: "bg-rose-500" },
    };
    const config = variants[status as keyof typeof variants] || variants.draft;
    return (
      <Badge
        className={`${config.className} text-white font-black text-[10px] uppercase h-5`}
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

      {/* AI Purchase Suggestions Section */}
      {suggestions.length > 0 && (
        <Card className="border-none shadow-xl bg-linear-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-600 rounded-xl shadow-lg shadow-violet-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black italic uppercase text-violet-600 leading-none">
                    Sugerencias Inteligentes de Compra
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-violet-500/60 mt-1">
                    Basado en velocidad de venta y stock crítico detectado por
                    la IA
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={approveAllSuggestions}
                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <Check className="w-3 h-3" />
                Aprobar Todas ({suggestions.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-violet-500/10 flex flex-col justify-between group hover:border-violet-500/40 transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant="outline"
                        className="text-[9px] font-black uppercase border-violet-500/20 text-violet-600"
                      >
                        {s.sku}
                      </Badge>
                      <span className="text-[9px] font-black uppercase text-rose-500 animate-pulse">
                        Agotamiento: {s.depletionDate}
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 mb-1">
                      {s.productName}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                      Stock: {s.currentStock} / Min: {s.minStock}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-violet-500/10">
                    <div>
                      <p className="text-[8px] font-black uppercase text-violet-500">
                        Sugerido
                      </p>
                      <p className="font-black text-lg italic text-violet-600">
                        +{s.suggestedQuantity}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors"
                    >
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  value="approved"
                  className="rounded-lg px-4 font-bold text-xs"
                >
                  Aprobadas
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar órdenes..."
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
              <Button
                className="rounded-xl gap-2 font-bold shadow-lg shadow-primary/20"
                onClick={() => setNewOrderOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Nueva Orden
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/20">
            {orders.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">
                  No se encontraron órdenes
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-5 hover:bg-primary/5 transition-all group gap-4 px-8"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                      <ShoppingCart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase italic tracking-tight">
                        {order.id}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground/70 mt-0.5 uppercase tracking-widest">
                        {order.supplier} • {order.warehouse}
                      </p>
                      <p className="text-[9px] font-black text-primary/60 uppercase tracking-tighter mt-1">
                        Estimado: {order.deliveryDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 lg:gap-10">
                    <div className="text-left lg:text-right">
                      <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-0.5 flex items-center gap-1 justify-end">
                        <Package className="w-2.5 h-2.5" />
                        Items
                      </p>
                      <p className="font-black text-sm italic">
                        {order.items.length}
                      </p>
                    </div>
                    <div className="text-left lg:text-right min-w-[100px]">
                      <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-0.5 italic">
                        Total Orden
                      </p>
                      <p className="font-black text-lg italic tracking-tight tabular-nums text-foreground">
                        ${order.total.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-24">{getStatusBadge(order.status)}</div>
                    <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {order.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-emerald-600"
                          onClick={() => approveOrder(order.id, "Gerente")}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {order.status === "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-blue-600"
                          onClick={() => receiveOrder(order.id)}
                        >
                          <Package className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-rose-500"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black italic uppercase text-primary">
              ¿Anular orden?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-xs uppercase tracking-widest">
              Esta acción no se puede deshacer. La orden{" "}
              <span className="text-foreground">{selectedOrderId}</span> será
              eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
              Regresar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedOrderId) {
                  deleteOrder(selectedOrderId);
                  setDeleteDialogOpen(false);
                  setSelectedOrderId(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black italic uppercase text-primary text-xl tracking-tighter">
              Detalles de Orden de Compra
            </DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">
              Información técnica de {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">
                    Proveedor
                  </p>
                  <p className="font-bold text-xs truncate">
                    {selectedOrder.supplier}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">
                    Estado
                  </p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">
                    Fecha Emisión
                  </p>
                  <p className="font-bold text-xs italic">
                    {selectedOrder.date}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">
                    Estimado Entrega
                  </p>
                  <p className="font-bold text-xs italic">
                    {selectedOrder.deliveryDate}
                  </p>
                </div>
              </div>
              <div className="border-t border-border/40 pt-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                  <Package className="w-3 h-3" />
                  Partidas de la Orden
                </h4>
                <div className="border border-border/40 rounded-2xl overflow-hidden bg-muted/5 shadow-inner">
                  <table className="w-full text-[10px]">
                    <thead className="bg-muted/30 border-b border-border/40">
                      <tr>
                        <th className="text-left p-3 font-black uppercase tracking-widest">
                          Producto / SKU
                        </th>
                        <th className="text-right p-3 font-black uppercase tracking-widest">
                          Cant.
                        </th>
                        <th className="text-right p-3 font-black uppercase tracking-widest">
                          Precio Unit.
                        </th>
                        <th className="text-right p-3 font-black uppercase tracking-widest">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-t border-border/20">
                          <td className="p-3">
                            <p className="font-black text-foreground/80">
                              {item.productName}
                            </p>
                            <p className="text-[9px] font-mono text-muted-foreground uppercase">
                              {item.sku}
                            </p>
                          </td>
                          <td className="p-3 text-right font-bold">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-right font-bold italic">
                            ${item.price.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-black italic">
                            ${item.subtotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end border-t border-border/40 pt-6">
                <div>
                  {selectedOrder.notes && (
                    <div className="p-4 rounded-2xl border border-border/40 bg-muted/5">
                      <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-2 italic">
                        Observaciones internas
                      </p>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">
                      Monto Imponible
                    </span>
                    <span className="font-bold text-sm italic">
                      ${selectedOrder.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">
                      Impuestos (IVA)
                    </span>
                    <span className="font-bold text-sm italic">
                      ${selectedOrder.tax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <span className="text-xs font-black uppercase text-primary tracking-widest">
                      Total Factura
                    </span>
                    <span className="font-black text-2xl italic tracking-tighter text-foreground">
                      ${selectedOrder.total.toLocaleString()}
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
