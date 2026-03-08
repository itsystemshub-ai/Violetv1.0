/**
 * ClientsPage - Gestión de Clientes
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
  Star,
  Phone,
  Mail,
  Building,
  Lock,
  Unlock,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useClients } from "../hooks/useClients";
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

export default function ClientsPage() {
  const {
    clients,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    stats,
    createClient,
    updateClient,
    deleteClient,
    blockClient,
    unblockClient,
  } = useClients();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "México",
    taxId: "",
    contactPerson: "",
    creditLimit: 0,
    balance: 0,
    status: "active" as const,
    type: "retail" as const,
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      code: CodeGeneratorService.generateClientCode(),
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "México",
      taxId: "",
      contactPerson: "",
      creditLimit: 0,
      balance: 0,
      status: "active",
      type: "retail",
      notes: "",
    });
    setEditMode(false);
    setSelectedClientId(null);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (client: any) => {
    setFormData({
      code: client.code,
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      country: client.country || "México",
      taxId: client.taxId || "",
      contactPerson: client.contactPerson || "",
      creditLimit: client.creditLimit,
      balance: client.balance,
      status: client.status,
      type: client.type,
      notes: client.notes || "",
    });
    setSelectedClientId(client.id);
    setEditMode(true);
    setFormDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      alert("Por favor complete los campos obligatorios");
      return;
    }

    if (editMode && selectedClientId) {
      updateClient(selectedClientId, formData);
    } else {
      createClient(formData);
    }

    setFormDialogOpen(false);
    resetForm();
  };

  const kpiStats = [
    {
      label: "Total Clientes",
      value: stats.totalClients.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Clientes Activos",
      value: stats.activeClients.toString(),
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Saldo Total",
      value: `$${stats.totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      label: "Clientes VIP",
      value: stats.vipClients.toString(),
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
      blocked: { label: "Bloqueado", className: "bg-red-500 hover:bg-red-600" },
    };
    const config = variants[status as keyof typeof variants];
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      retail: {
        label: "Minorista",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      wholesale: {
        label: "Mayorista",
        className:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      },
      vip: {
        label: "VIP",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
    };
    const config = variants[type as keyof typeof variants];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleDelete = () => {
    if (selectedClientId) {
      deleteClient(selectedClientId);
      setDeleteDialogOpen(false);
      setSelectedClientId(null);
    }
  };

  const handleToggleBlock = (id: string, currentStatus: string) => {
    if (currentStatus === "blocked") {
      unblockClient(id);
    } else {
      blockClient(id);
    }
  };

  const handleView = (id: string) => {
    setSelectedClientId(id);
    setViewDialogOpen(true);
  };

  const getCreditStatus = (balance: number, creditLimit: number) => {
    const percentage = (balance / creditLimit) * 100;
    if (percentage >= 100)
      return { color: "text-red-600", label: "Límite excedido" };
    if (percentage >= 80)
      return { color: "text-yellow-600", label: "Cerca del límite" };
    return { color: "text-green-600", label: "Crédito disponible" };
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
              <Users className="w-8 h-8 text-primary" />
              Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión completa de clientes y cartera
            </p>
          </div>
          <Button className="gap-2" onClick={handleOpenCreateDialog}>
            <Plus className="w-4 h-4" />
            Nuevo Cliente
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
                Todos ({stats.totalClients})
              </TabsTrigger>
              <TabsTrigger value="active">
                Activos ({stats.activeClients})
              </TabsTrigger>
              <TabsTrigger value="blocked">
                Bloqueados ({stats.blockedClients})
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
                <SelectItem value="retail">Minorista</SelectItem>
                <SelectItem value="wholesale">Mayorista</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
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

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {clients.length}{" "}
              {clients.length === 1 ? "cliente encontrado" : "clientes encontrados"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron clientes</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Código</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Nombre</th>
                      <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Email</th>
                      <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Saldo</th>
                      <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Límite</th>
                      <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Total Compras</th>
                      <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Estado</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {clients.map((client) => {
                      const creditStatus = getCreditStatus(client.balance, client.creditLimit);
                      return (
                        <tr key={client.id} className="hover:bg-accent/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">{client.code}</td>
                          <td className="py-3 px-3 font-semibold max-w-[180px] break-words">{client.name}</td>
                          <td className="py-3 px-3 text-center">{getTypeBadge(client.type)}</td>
                          <td className="py-3 px-3 text-xs max-w-[160px] break-words">{client.email || '—'}</td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="font-bold">${client.balance.toLocaleString()}</span>
                            <p className={`text-xs ${creditStatus.color}`}>{creditStatus.label}</p>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">${client.creditLimit.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">${client.totalPurchases.toLocaleString()}</td>
                          <td className="py-3 px-3 text-center">{getStatusBadge(client.status)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(client.id)} title="Ver"><Eye className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleBlock(client.id, client.status)} title={client.status === "blocked" ? "Desbloquear" : "Bloquear"}>
                                {client.status === "blocked" ? <Unlock className="w-3.5 h-3.5 text-green-600" /> : <Lock className="w-3.5 h-3.5 text-yellow-600" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditDialog(client)} title="Editar"><Edit className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedClientId(client.id); setDeleteDialogOpen(true); }} title="Eliminar"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <ModuleAIAssistant
          moduleName="Clientes"
          suggestions={[
            "Analizar cartera de clientes",
            "Identificar clientes morosos",
            "Segmentar clientes por tipo",
            "Predecir riesgo de impago",
          ]}
        />
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente{" "}
              {selectedClient?.name} será eliminado permanentemente.
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
            <DialogTitle>Detalles del Cliente</DialogTitle>
            <DialogDescription>
              Información completa de {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-medium">{selectedClient.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedClient.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  {getTypeBadge(selectedClient.type)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RFC/Tax ID</p>
                  <p className="font-medium">{selectedClient.taxId || "N/A"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Información de Contacto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {selectedClient.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">
                      {selectedClient.phone || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">
                      {selectedClient.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ciudad</p>
                    <p className="font-medium">
                      {selectedClient.city || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">País</p>
                    <p className="font-medium">
                      {selectedClient.country || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Persona de Contacto
                    </p>
                    <p className="font-medium">
                      {selectedClient.contactPerson || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Información Financiera</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Límite de Crédito
                    </p>
                    <p className="font-bold text-lg">
                      ${selectedClient.creditLimit.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Saldo Actual
                    </p>
                    <p className="font-bold text-lg">
                      ${selectedClient.balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Crédito Disponible
                    </p>
                    <p className="font-bold text-lg text-green-600">
                      $
                      {(
                        selectedClient.creditLimit - selectedClient.balance
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Compras
                    </p>
                    <p className="font-bold text-lg">
                      ${selectedClient.totalPurchases.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Historial</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Cliente Desde
                    </p>
                    <p className="font-medium">{selectedClient.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Última Compra
                    </p>
                    <p className="font-medium">
                      {selectedClient.lastPurchase || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedClient.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialog (Create/Edit) */}
      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Actualiza la información del cliente"
                : "Completa los datos del nuevo cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  Código (Automático)
                </label>
                <Input value={formData.code} disabled className="bg-muted" />
              </div>
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="text-sm font-medium">Dirección</label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Calle, número, colonia"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ciudad</label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <label className="text-sm font-medium">País</label>
                <Input
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  placeholder="País"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">RFC/Tax ID</label>
                <Input
                  value={formData.taxId}
                  onChange={(e) =>
                    setFormData({ ...formData, taxId: e.target.value })
                  }
                  placeholder="ABC123456789"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Persona de Contacto
                </label>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder="Nombre del contacto"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Límite de Crédito</label>
                <Input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creditLimit: Number(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Saldo Inicial</label>
                <Input
                  type="number"
                  value={formData.balance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      balance: Number(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo de Cliente</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Minorista</SelectItem>
                    <SelectItem value="wholesale">Mayorista</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notas</label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Notas adicionales sobre el cliente"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editMode ? "Actualizar" : "Crear"} Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ValeryLayout>
  );
}
