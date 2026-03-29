/**
 * SuppliersManager - Organismo para gestión de Proveedores (Modular)
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
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  UserCheck,
  UserX,
  Star,
  Phone,
  Mail,
  Building,
  Package,
} from "lucide-react";
import { useSuppliers, Supplier } from "../../hooks/useSuppliers";
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

export const SuppliersManager: React.FC = () => {
  const {
    suppliers,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    deleteSupplier,
    suspendSupplier,
    activateSupplier,
  } = useSuppliers();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    null,
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  const kpiStats = [
    {
      label: "Total Proveedores",
      value: stats.totalSuppliers.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Activos",
      value: stats.activeSuppliers.toString(),
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Saldo Total",
      value: `$${stats.totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Rating Promedio",
      value: stats.avgRating,
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Activo", className: "bg-green-500 hover:bg-green-600" },
      inactive: {
        label: "Inactivo",
        className: "bg-gray-500 hover:bg-gray-600",
      },
      suspended: {
        label: "Suspendido",
        className: "bg-red-500 hover:bg-red-600",
      },
    };
    const config =
      variants[status as keyof typeof variants] || variants.inactive;
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const handleDelete = () => {
    if (selectedSupplierId) {
      deleteSupplier(selectedSupplierId);
      setDeleteDialogOpen(false);
      setSelectedSupplierId(null);
    }
  };

  const handleToggleSuspend = (id: string, currentStatus: string) => {
    if (currentStatus === "suspended") {
      activateSupplier(id);
    } else {
      suspendSupplier(id);
    }
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
                  Todos
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="rounded-lg px-4 font-bold text-xs"
                >
                  Activos
                </TabsTrigger>
                <TabsTrigger
                  value="suspended"
                  className="rounded-lg px-4 font-bold text-xs"
                >
                  Suspendidos
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar proveedores..."
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
                <Plus className="w-4 h-4" /> Nuevo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/20">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between p-5 hover:bg-primary/5 transition-all group gap-4 px-8"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm uppercase italic tracking-tight">
                        {supplier.name}
                      </p>
                      {supplier.category && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-black uppercase px-2 h-5 rounded-md border-primary/20 bg-primary/5"
                        >
                          {supplier.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1.5 ">
                        <Building className="w-3 h-3 opacity-40" />
                        {supplier.code}
                      </span>
                      {supplier.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 opacity-40" />
                          {supplier.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 lg:gap-10">
                  <div className="text-left lg:text-right">
                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">
                      Reputación
                    </p>
                    {getRatingStars(supplier.rating)}
                  </div>

                  <div className="text-left lg:text-right min-w-[100px]">
                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-0.5">
                      Saldo Pendiente
                    </p>
                    <p className="font-black text-base italic tabular-nums text-red-500">
                      ${supplier.balance.toLocaleString()}
                    </p>
                  </div>

                  <div className="hidden xl:block text-right">
                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-0.5">
                      Compras Totales
                    </p>
                    <p className="font-bold text-xs text-foreground/70 tracking-tight">
                      ${supplier.totalPurchases.toLocaleString()}
                    </p>
                  </div>

                  <div className="w-24">{getStatusBadge(supplier.status)}</div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => {
                        setSelectedSupplierId(supplier.id);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() =>
                        handleToggleSuspend(supplier.id, supplier.status)
                      }
                    >
                      {supplier.status === "suspended" ? (
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <UserX className="w-4 h-4 text-orange-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setSelectedSupplierId(supplier.id);
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
            <AlertDialogTitle className="font-black italic uppercase text-primary">
              ¿Eliminar proveedor?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-xs uppercase tracking-widest">
              Esta acción no se puede deshacer. El proveedor{" "}
              <span className="text-foreground">{selectedSupplier?.name}</span>{" "}
              será eliminado permanentemente de la base de datos de
              adquisiciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-destructive/20"
            >
              Eliminar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black italic uppercase text-primary text-xl tracking-tighter">
              Ficha del Proveedor
            </DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">
              Información corporativa y operativa de {selectedSupplier?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 mb-1">
                    Código
                  </p>
                  <p className="font-black text-sm italic">
                    {selectedSupplier.code}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 mb-1">
                    Estado
                  </p>
                  {getStatusBadge(selectedSupplier.status)}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 mb-1">
                    Categoría
                  </p>
                  <p className="font-black text-sm italic">
                    {selectedSupplier.category || "N/A"}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/40 pt-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">
                  Información de Contacto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Mail className="w-4 h-4 opacity-40" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-muted-foreground/60">
                        Email Corporativo
                      </p>
                      <p className="font-bold text-xs">
                        {selectedSupplier.email || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Phone className="w-4 h-4 opacity-40" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-muted-foreground/60">
                        Teléfono
                      </p>
                      <p className="font-bold text-xs">
                        {selectedSupplier.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40 pt-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">
                  Métricas Financieras
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2x border border-border/40 bg-muted/5">
                    <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">
                      Saldo Actual
                    </p>
                    <p className="font-black text-2xl italic tracking-tighter text-red-500">
                      ${selectedSupplier.balance.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border/40 bg-muted/5">
                    <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">
                      Total Compras
                    </p>
                    <p className="font-black text-2xl italic tracking-tighter text-foreground">
                      ${selectedSupplier.totalPurchases.toLocaleString()}
                    </p>
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
