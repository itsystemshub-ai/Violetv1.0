/**
 * TransfersPage - Gestión de Transferencias de Inventario
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
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  MapPin,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useTransfers } from "@/modules/inventory/hooks/useTransfers";
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

export default function TransfersPage() {
  const {
    transfers,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    deleteTransfer,
    shipTransfer,
    receiveTransfer,
    cancelTransfer,
  } = useTransfers();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(
    null,
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const selectedTransfer = transfers.find((t) => t.id === selectedTransferId);

  const kpiStats = [
    {
      label: "Total Transferencias",
      value: stats.totalTransfers.toString(),
      icon: ArrowRightLeft,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "En Tránsito",
      value: stats.inTransitTransfers.toString(),
      icon: Truck,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      label: "Completadas",
      value: stats.receivedTransfers.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Valor en Tránsito",
      value: `$${stats.totalValueInTransit.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: {
        label: "Pendiente",
        className: "bg-gray-500 hover:bg-gray-600",
      },
      in_transit: {
        label: "En Tránsito",
        className: "bg-yellow-500 hover:bg-yellow-600",
      },
      received: {
        label: "Recibida",
        className: "bg-green-500 hover:bg-green-600",
      },
      cancelled: {
        label: "Cancelada",
        className: "bg-red-500 hover:bg-red-600",
      },
    };
    const config = variants[status as keyof typeof variants];
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const handleDelete = () => {
    if (selectedTransferId) {
      deleteTransfer(selectedTransferId);
      setDeleteDialogOpen(false);
      setSelectedTransferId(null);
    }
  };

  const handleShip = (id: string) => {
    const trackingNumber = `TRK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
    shipTransfer(id, trackingNumber);
  };

  const handleReceive = (id: string) => {
    receiveTransfer(id, "Usuario Actual");
  };

  const handleCancel = (id: string) => {
    cancelTransfer(id);
  };

  const handleView = (id: string) => {
    setSelectedTransferId(id);
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
              <ArrowRightLeft className="w-8 h-8 text-primary" />
              Transferencias de Inventario
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión de transferencias entre almacenes
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Transferencia
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

        {/* Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <TabsList className="w-fit">
              <TabsTrigger value="all">
                Todas ({stats.totalTransfers})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes ({stats.pendingTransfers})
              </TabsTrigger>
              <TabsTrigger value="in_transit">
                En Tránsito ({stats.inTransitTransfers})
              </TabsTrigger>
              <TabsTrigger value="received">
                Recibidas ({stats.receivedTransfers})
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transferencias..."
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

          <TabsContent value={statusFilter}>
            <Card>
              <CardHeader>
                <CardTitle>Lista de Transferencias</CardTitle>
                <CardDescription>
                  {transfers.length}{" "}
                  {transfers.length === 1
                    ? "transferencia encontrada"
                    : "transferencias encontradas"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {transfers.length === 0 ? (
                  <div className="text-center py-12">
                    <ArrowRightLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No se encontraron transferencias
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ID</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Tracking</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Fecha</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Origen</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Destino</th>
                          <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Items</th>
                          <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Unidades</th>
                          <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Valor</th>
                          <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Estado</th>
                          <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {transfers.map((transfer) => (
                          <tr key={transfer.id} className="hover:bg-accent/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-xs whitespace-nowrap">{transfer.id}</td>
                            <td className="py-3 px-3">
                              {transfer.trackingNumber ? (
                                <Badge variant="outline" className="text-xs font-mono">{transfer.trackingNumber}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{transfer.date}</td>
                            <td className="py-3 px-3 max-w-[140px] break-words">{transfer.fromWarehouse}</td>
                            <td className="py-3 px-3 max-w-[140px] break-words">{transfer.toWarehouse}</td>
                            <td className="py-3 px-3 text-right font-bold">{transfer.totalItems}</td>
                            <td className="py-3 px-3 text-right">{transfer.totalQuantity}</td>
                            <td className="py-3 px-3 text-right font-bold whitespace-nowrap">${transfer.totalValue.toLocaleString()}</td>
                            <td className="py-3 px-3 text-center">{getStatusBadge(transfer.status)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleView(transfer.id)}
                                  title="Ver detalles"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                {transfer.status === "pending" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleShip(transfer.id)}
                                      title="Enviar"
                                    >
                                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      title="Editar"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                                {transfer.status === "in_transit" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleReceive(transfer.id)}
                                    title="Marcar como recibida"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                  </Button>
                                )}
                                {(transfer.status === "pending" ||
                                  transfer.status === "in_transit") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleCancel(transfer.id)}
                                    title="Cancelar"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setSelectedTransferId(transfer.id);
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
          </TabsContent>
        </Tabs>

        {/* AI Assistant */}
        <ModuleAIAssistant
          moduleName="Transferencias"
          suggestions={[
            "Optimizar rutas de transferencia",
            "Analizar tiempos de tránsito",
            "Predecir necesidades de transferencia",
            "Identificar cuellos de botella",
          ]}
        />
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar transferencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La transferencia{" "}
              {selectedTransfer?.id} será eliminada permanentemente.
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
            <DialogTitle>Detalles de la Transferencia</DialogTitle>
            <DialogDescription>
              Información completa de la transferencia {selectedTransfer?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{selectedTransfer.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedTransfer.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Origen</p>
                  <p className="font-medium">
                    {selectedTransfer.fromWarehouse}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Destino</p>
                  <p className="font-medium">{selectedTransfer.toWarehouse}</p>
                </div>
                {selectedTransfer.trackingNumber && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Número de Tracking
                    </p>
                    <p className="font-medium font-mono">
                      {selectedTransfer.trackingNumber}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Productos Transferidos</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 text-sm">Producto</th>
                        <th className="text-right p-2 text-sm">Cantidad</th>
                        <th className="text-right p-2 text-sm">Costo Unit.</th>
                        <th className="text-right p-2 text-sm">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTransfer.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2 text-sm">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.cauplas}
                            </p>
                          </td>
                          <td className="p-2 text-sm text-right">
                            {item.quantity}
                          </td>
                          <td className="p-2 text-sm text-right">
                            ${item.cost.toLocaleString()}
                          </td>
                          <td className="p-2 text-sm text-right font-medium">
                            ${item.totalValue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">
                      {selectedTransfer.totalItems}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Unidades
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedTransfer.totalQuantity}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${selectedTransfer.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Información de Envío</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Creado por</p>
                    <p className="font-medium">{selectedTransfer.createdBy}</p>
                  </div>
                  {selectedTransfer.shippedDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Fecha de Envío
                      </p>
                      <p className="font-medium">
                        {selectedTransfer.shippedDate}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.receivedDate && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Fecha de Recepción
                        </p>
                        <p className="font-medium">
                          {selectedTransfer.receivedDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Recibido por
                        </p>
                        <p className="font-medium">
                          {selectedTransfer.receivedBy}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedTransfer.estimatedArrival &&
                    selectedTransfer.status !== "received" && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Llegada Estimada
                        </p>
                        <p className="font-medium">
                          {selectedTransfer.estimatedArrival}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {selectedTransfer.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedTransfer.notes}
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
