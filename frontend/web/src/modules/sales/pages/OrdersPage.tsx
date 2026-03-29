/**
 * OrdersPage - Gestión de Pedidos
 */

import { useState } from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  ShoppingBag,
  Plus,
  Search,
  Package,
  Truck,
  CheckCircle,
  User,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Hash,
  Download,
  Calendar,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useOrders } from "../hooks/useOrders";
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

export default function OrdersPage() {
  const {
    orders,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    deleteOrder,
    processOrder,
    shipOrder,
    deliverOrder,
  } = useOrders();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const kpiStats = [
    {
      label: "Total Pedidos",
      value: `$${stats.totalAmount.toLocaleString()}`,
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "En Proceso",
      value: stats.processing.toString(),
      icon: Package,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      label: "Enviados",
      value: stats.shipped.toString(),
      icon: Truck,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Entregados",
      value: stats.delivered.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: {
        label: "Pendiente",
        className: "bg-gray-500 hover:bg-gray-600",
      },
      processing: {
        label: "En Proceso",
        className: "bg-yellow-500 hover:bg-yellow-600",
      },
      shipped: {
        label: "Enviado",
        className: "bg-purple-500 hover:bg-purple-600",
      },
      delivered: {
        label: "Entregado",
        className: "bg-green-500 hover:bg-green-600",
      },
      cancelled: {
        label: "Cancelado",
        className: "bg-red-500 hover:bg-red-600",
      },
    };
    const config = variants[status as keyof typeof variants];
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const handleDelete = () => {
    if (selectedOrderId) {
      deleteOrder(selectedOrderId);
      setDeleteDialogOpen(false);
      setSelectedOrderId(null);
    }
  };

  const handleProcess = (id: string) => {
    processOrder(id);
  };

  const handleShip = async (id: string) => {
    // Generar tracking number secuencial basado en timestamp
    const now = new Date();
    const year = now.getFullYear();
    const timestamp = now.getTime().toString().slice(-6);
    const trackingNumber = `TRK-${year}-${timestamp}`;
    shipOrder(id, trackingNumber);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-primary" />
              Pedidos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión de pedidos y entregas
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </Button>
        </div>

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

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <TabsList className="w-fit">
              <TabsTrigger value="all">Todos ({stats.totalOrders})</TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="processing">
                En Proceso ({stats.processing})
              </TabsTrigger>
              <TabsTrigger value="shipped">
                Enviados ({stats.shipped})
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Entregados ({stats.delivered})
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedidos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value={statusFilter}>
            <Card>
              <CardHeader>
                <CardTitle>Lista de Pedidos</CardTitle>
                <CardDescription>
                  {orders.length}{" "}
                  {orders.length === 1
                    ? "pedido encontrado"
                    : "pedidos encontrados"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron pedidos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ID</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Cliente</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Fecha Entrega</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Tracking</th>
                          <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Monto</th>
                          <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Estado</th>
                          <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-accent/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-xs whitespace-nowrap">{order.id}</td>
                            <td className="py-3 px-3 max-w-[180px] break-words">{order.client}</td>
                            <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{order.deliveryDate}</td>
                            <td className="py-3 px-3 font-mono text-xs">{order.trackingNumber || '—'}</td>
                            <td className="py-3 px-3 text-right font-bold whitespace-nowrap">${order.total.toLocaleString()}</td>
                            <td className="py-3 px-3 text-center">{getStatusBadge(order.status)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-0.5">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedOrderId(order.id); setViewDialogOpen(true); }} title="Ver"><Eye className="w-3.5 h-3.5" /></Button>
                                {order.status === "pending" && (<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleProcess(order.id)} title="Procesar"><Package className="w-3.5 h-3.5 text-yellow-600" /></Button>)}
                                {order.status === "processing" && (<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleShip(order.id)} title="Enviar"><Truck className="w-3.5 h-3.5 text-purple-600" /></Button>)}
                                {order.status === "shipped" && (<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deliverOrder(order.id)} title="Entregado"><CheckCircle className="w-3.5 h-3.5 text-green-600" /></Button>)}
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar"><Edit className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedOrderId(order.id); setDeleteDialogOpen(true); }} title="Eliminar"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
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
          </TabsContent>
        </Tabs>

        <ModuleAIAssistant
          moduleName="Pedidos"
          suggestions={[
            "Optimizar rutas de entrega",
            "Predecir demanda de productos",
            "Analizar tiempos de entrega",
            "Sugerir mejores transportistas",
          ]}
        />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pedido {selectedOrderId} será
              eliminado permanentemente.
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Pedido</DialogTitle>
            <DialogDescription>
              Información completa del pedido {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.client}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Fecha de Pedido
                  </p>
                  <p className="font-medium">{selectedOrder.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Fecha de Entrega
                  </p>
                  <p className="font-medium">{selectedOrder.deliveryDate}</p>
                </div>
                {selectedOrder.trackingNumber && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Número de Tracking
                    </p>
                    <p className="font-medium">
                      {selectedOrder.trackingNumber}
                    </p>
                  </div>
                )}
                {selectedOrder.shippingAddress && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Dirección de Envío
                    </p>
                    <p className="font-medium">
                      {selectedOrder.shippingAddress}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 text-sm">Producto</th>
                        <th className="text-right p-2 text-sm">Cant.</th>
                        <th className="text-right p-2 text-sm">Precio</th>
                        <th className="text-right p-2 text-sm">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2 text-sm">{item.productName}</td>
                          <td className="p-2 text-sm text-right">
                            {item.quantity}
                          </td>
                          <td className="p-2 text-sm text-right">
                            ${item.price.toLocaleString()}
                          </td>
                          <td className="p-2 text-sm text-right font-medium">
                            ${item.subtotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal:</span>
                  <span className="font-medium">
                    ${selectedOrder.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">IVA (16%):</span>
                  <span className="font-medium">
                    ${selectedOrder.tax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="text-sm mt-1">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ValeryLayout>
  );
}
