/**
 * SalespeoplePage - Gestión de Vendedores
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
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  UserCog,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Award,
  Phone,
  Mail,
  Lock,
  Unlock,
  Percent,
  PieChart,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useSalespeople } from "../hooks/useSalespeople";
import { CodeGeneratorService } from "@/services/CodeGeneratorService";
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

export default function SalespeoplePage() {
  const {
    salespeople,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    createSalesperson,
    updateSalesperson,
    deleteSalesperson,
    activateSalesperson,
    deactivateSalesperson,
  } = useSalespeople();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<
    string | null
  >(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const selectedSalesperson = salespeople.find(
    (s) => s.id === selectedSalespersonId,
  );

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    email: "",
    phone: "",
    commissionRate: 0,
    status: "active" as const,
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      code: CodeGeneratorService.generateSalespersonCode(),
      name: "",
      email: "",
      phone: "",
      commissionRate: 0,
      status: "active",
      notes: "",
    });
    setEditMode(false);
    setSelectedSalespersonId(null);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (salesperson: any) => {
    setFormData({
      code: salesperson.code,
      name: salesperson.name,
      email: salesperson.email || "",
      phone: salesperson.phone || "",
      commissionRate: salesperson.commissionRate,
      status: salesperson.status,
      notes: salesperson.notes || "",
    });
    setSelectedSalespersonId(salesperson.id);
    setEditMode(true);
    setFormDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      alert("Por favor complete los campos obligatorios");
      return;
    }

    if (editMode && selectedSalespersonId) {
      updateSalesperson(selectedSalespersonId, formData);
    } else {
      createSalesperson(formData);
    }

    setFormDialogOpen(false);
    resetForm();
  };

  const kpiStats = [
    {
      label: "Total Vendedores",
      value: stats.totalSalespeople.toString(),
      icon: UserCog,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Promedio Comisión",
      value: `${stats.averageCommission}%`,
      icon: Percent,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Venta Total Vendedores",
      value: `$${stats.totalSales.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Top Vendedor",
      value: salespeople.length > 0 ? salespeople[0].name : "N/A",
      icon: Award,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Activo", className: "bg-green-500 hover:bg-green-600" },
      inactive: { label: "Inactivo", className: "bg-red-500 hover:bg-red-600" },
    };
    const config = variants[status as keyof typeof variants] || {
      label: status,
      className: "bg-gray-500",
    };
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const handleDelete = () => {
    if (selectedSalespersonId) {
      deleteSalesperson(selectedSalespersonId);
      setDeleteDialogOpen(false);
      setSelectedSalespersonId(null);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    if (currentStatus === "inactive") {
      activateSalesperson(id);
    } else {
      deactivateSalesperson(id);
    }
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
              <UserCog className="w-8 h-8 text-primary" />
              Vendedores
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión de equipo de ventas y comisiones
            </p>
          </div>
          <Button className="gap-2" onClick={handleOpenCreateDialog}>
            <Plus className="w-4 h-4" />
            Nuevo Vendedor
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
                Todos ({stats.totalSalespeople})
              </TabsTrigger>
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="inactive">Inactivos</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vendedores..."
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

        {/* Salespeople List */}
        <Card>
          <CardHeader>
            <CardTitle>Equipo de Ventas</CardTitle>
            <CardDescription>
              {salespeople.length}{" "}
              {salespeople.length === 1 ? "vendedor" : "vendedores"} en el
              sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salespeople.length === 0 ? (
              <div className="text-center py-12">
                <UserCog className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron vendedores
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salespeople.map((person) => (
                  <Card
                    key={person.id}
                    className="overflow-hidden hover:border-primary/50 transition-colors"
                  >
                    <div className="h-2 bg-primary/20" />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {person.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold">{person.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {person.code}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(person.status)}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Comisión:
                          </span>
                          <span className="font-medium">
                            {person.commissionRate}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <PieChart className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Ventas Totales:
                          </span>
                          <span className="font-medium">
                            ${person.totalSales.toLocaleString()}
                          </span>
                        </div>
                        {person.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground truncate">
                              {person.email}
                            </span>
                          </div>
                        )}
                        {person.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {person.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-1 mt-6 pt-4 border-t">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSalespersonId(person.id);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleToggleStatus(person.id, person.status)
                          }
                        >
                          {person.status === "inactive" ? (
                            <Unlock className="w-4 h-4 text-green-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-yellow-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDialog(person)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSalespersonId(person.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <ModuleAIAssistant
          moduleName="Vendedores"
          suggestions={[
            "Analizar rendimiento de vendedores",
            "Sugerir metas de ventas",
            "Calcular comisiones por pagar",
            "Identificar mejores estrategias de venta",
          ]}
        />
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vendedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro del vendedor será
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Vendedor</DialogTitle>
            <DialogDescription>
              Información completa y métricas de desempeño
            </DialogDescription>
          </DialogHeader>
          {selectedSalesperson && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {selectedSalesperson.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedSalesperson.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedSalesperson.code}
                  </p>
                </div>
                <div className="ml-auto">
                  {getStatusBadge(selectedSalesperson.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      Tasa de Comisión
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedSalesperson.commissionRate}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      Ventas Totales
                    </p>
                    <p className="text-2xl font-bold">
                      ${selectedSalesperson.totalSales.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      Comisiones Acumuladas
                    </p>
                    <p className="text-2xl font-bold">
                      $
                      {(
                        (selectedSalesperson.totalSales *
                          selectedSalesperson.commissionRate) /
                        100
                      ).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      Pedidos Atendidos
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedSalesperson.id.length * 7}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Información de Contacto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {selectedSalesperson.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">
                      {selectedSalesperson.phone || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Fecha de Registro
                    </p>
                    <p className="font-medium">
                      {selectedSalesperson.createdAt}
                    </p>
                  </div>
                </div>
              </div>

              {selectedSalesperson.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Notas / Observaciones</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedSalesperson.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Editar Vendedor" : "Nuevo Vendedor"}
            </DialogTitle>
            <DialogDescription>
              Completa los datos del equipo de ventas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium">
                  Código (Automático)
                </label>
                <Input value={formData.code} disabled className="bg-muted" />
              </div>
              <div>
                <label className="text-sm font-medium">Nombre Completo *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nombre del vendedor"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+52 55 1234 5678"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Tasa de Comisión (%) *
                </label>
                <Input
                  type="number"
                  value={formData.commissionRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commissionRate: Number(e.target.value),
                    })
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Input
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Observaciones adicionales"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editMode ? "Actualizar" : "Registrar"} Vendedor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ValeryLayout>
  );
}
