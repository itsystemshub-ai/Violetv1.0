/**
 * ProductsPage - Gestión de Productos con formulario de creación
 * Los productos se guardan en localDb y se comparten con todos los módulos
 */

import { useState, useEffect, useMemo } from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import { InventoryTable } from "@/modules/inventory/components/InventoryTable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import {
  X,
  Layers,
  Upload,
  ImageIcon,
  Box,
  FileSpreadsheet,
  FileJson,
  FileText,
  Package,
  AlertTriangle,
  XCircle,
  DollarSign,
  Search,
  Plus,
  Download,
  Edit,
  Trash,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Archive,
  Filter,
  Barcode,
  CheckCircle,
  AlertCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  Brain,
  Clock,
  TrendingDown,
  Camera,
  BadgeCheck,
  BadgeAlert,
  BadgeX,
  Sparkles,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";
import { useInventoryLogic } from "@/modules/inventory/hooks/useInventoryLogic";
import { cn } from "@/core/shared/utils/utils";
import { ProductForm as RawProductForm } from "@/shared/components/common/Forms";
import { ProductImageCarousel } from "@/modules/inventory/components/ProductImageCarousel";
import { PremiumHUD } from "@/shared/components/stitch/PremiumHUD";
import { automationHub } from "@/core/infrastructure/automation/AutomationHub";
import { useTenant } from "@/shared/hooks/useTenant";
import { toast } from "sonner";

const CATEGORIES_BASE = ["General"];

const UNITS = [
  "Unidad",
  "Kg",
  "Lt",
  "Mt",
  "Caja",
  "Paquete",
  "Par",
  "Juego",
  "Rollo",
  "Galón",
];

interface ProductForm {
  descripcionManguera: string;
  description: string;
  category: string;
  precioFCA: number;
  cost: number;
  stock: number;
  minStock: number;
  barcode: string;
  supplier: string;
  cauplas?: string;
  torflex?: string;
  indomax?: string;
  oem?: string;
  aplicacionesDiesel?: string;
  isNuevo?: string | boolean;
  margen?: number;
  images?: string[];
}

const emptyForm: ProductForm = {
  descripcionManguera: "",
  description: "",
  category: "General",
  precioFCA: 0,
  cost: 0,
  stock: 0,
  minStock: 5,
  barcode: "",
  supplier: "",
  cauplas: "",
  torflex: "",
  indomax: "",
  oem: "",
  aplicacionesDiesel: "",
  isNuevo: "",
  margen: 30,
  images: [],
};

// Local ProductImageCarousel removed to use shared component

export default function ProductsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const invLogic = useInventoryLogic();
  const { formatMoney } = useCurrencyStore();
  const { tenant } = useTenant();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [productToDeactivate, setProductToDeactivate] = useState<any>(null);

  // Build dynamic categories from existing products + base list
  const CATEGORIES = useMemo(() => {
    const productCats = new Set(
      invLogic.products.map((p) => p.category).filter(Boolean),
    );
    const all = new Set([...CATEGORIES_BASE, ...productCats]);
    return Array.from(all).sort();
  }, [invLogic.products]);

  const kpiStats = [
    {
      label: "Total Productos",
      value: invLogic.whStats.brands.cauplas.count.toString(), // Simplified for the example, better use whStats
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Stock Bajo",
      value: invLogic.lowStockCount.toString(),
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      label: "Sin Stock",
      value: invLogic.products.filter((p) => !p.stock).length.toString(),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "Valor Inventario",
      value: formatMoney(invLogic.totalInventoryValue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
  ];

  const selectedProduct = invLogic.products.find(
    (p) => p.id === selectedProductId,
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Activo", className: "bg-green-500 hover:bg-green-600" },
      inactive: {
        label: "Inactivo",
        className: "bg-gray-500 hover:bg-gray-600",
      },
      discontinued: {
        label: "Descontinuado",
        className: "bg-red-500 hover:bg-red-600",
      },
    };
    const config = variants[status as keyof typeof variants] || variants.active;
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const getStockBadge = (stock: number, minStock: number) => {
    if (stock === 0)
      return <Badge className="bg-red-500 text-white">Sin Stock</Badge>;
    if (stock <= minStock)
      return <Badge className="bg-yellow-500 text-white">Stock Bajo</Badge>;
    return <Badge className="bg-green-500 text-white">Stock OK</Badge>;
  };

  const getVentasTotal = (product: any): number => {
    if (product.historial && product.historial > 0) return product.historial;
    if (product.ventasHistory) {
      const sum =
        (product.ventasHistory[2023] || 0) +
        (product.ventasHistory[2024] || 0) +
        (product.ventasHistory[2025] || 0);
      if (sum > 0) return sum;
    }
    return 0;
  };

  const getRanking = (product: any): string => {
    if (product.rankingHistory) {
      const ranking2025 = product.rankingHistory[2025];
      const ranking2024 = product.rankingHistory[2024];
      const ranking2023 = product.rankingHistory[2023];
      if (ranking2025 && ranking2025 > 0) return String(ranking2025);
      if (ranking2024 && ranking2024 > 0) return String(ranking2024);
      if (ranking2023 && ranking2023 > 0) return String(ranking2023);
    }
    return "-";
  };

  const handleDelete = () => {
    if (selectedProductId) {
      invLogic.deleteProduct(selectedProductId);
      setDeleteDialogOpen(false);
      setSelectedProductId(null);
    }
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      await invLogic.addProduct({
        ...form,
        id: crypto.randomUUID(),
        warehouseId: "default",
        status: "active",
        images: [],
      });
      setCreateDialogOpen(false);
      setForm({ ...emptyForm });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProductId) return;
    setIsSaving(true);
    try {
      await invLogic.updateProduct(selectedProductId, {
        ...form,
      });
      setEditDialogOpen(false);
      setSelectedProductId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormChange = (key: keyof ProductForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCostChange = (val: number) => {
    const cost = val || 0;
    const margin = form.margen ?? 30;
    const price = cost * (1 + margin / 100);
    setForm((prev) => ({ ...prev, cost, price, precioFCA: price }));
  };

  const handleMarginChange = (val: number) => {
    const margin = val || 0;
    const cost = form.cost || 0;
    const price = cost * (1 + margin / 100);
    setForm((prev) => ({ ...prev, margen: margin, price, precioFCA: price }));
  };

  const handlePriceChange = (val: number) => {
    const price = val || 0;
    const cost = form.cost || 0;
    const margin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
    setForm((prev) => ({
      ...prev,
      price,
      precioFCA: price,
      margen: Math.round(margin * 100) / 100,
    }));
  };

  const ProductFormFields = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cauplas" className="text-sm font-semibold">
            CAUPLAS
          </Label>
          <Input
            id="cauplas"
            placeholder="SKU principal"
            value={form.cauplas || ""}
            onChange={(e) => handleFormChange("cauplas", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="torflex" className="text-sm font-semibold">
            TORFLEX
          </Label>
          <Input
            id="torflex"
            value={form.torflex || ""}
            onChange={(e) => handleFormChange("torflex", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="indomax" className="text-sm font-semibold">
            INDOMAX
          </Label>
          <Input
            id="indomax"
            value={form.indomax || ""}
            onChange={(e) => handleFormChange("indomax", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="oem" className="text-sm font-semibold">
            OEM
          </Label>
          <Input
            id="oem"
            value={form.oem || ""}
            onChange={(e) => handleFormChange("oem", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  if (invLogic.isLoading) {
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
      <PremiumHUD>
        <div className="p-6 space-y-6">
          <div className="bg-card/50 dark:bg-slate-900/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black flex items-center gap-4 text-foreground tracking-tight">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  Productos
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Catálogo central de productos — se conectan con Ventas,
                  Facturas, Compras e Inventario
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={invLogic.fileInputRef}
                  onChange={invLogic.handleImport}
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                />
                <input
                  type="file"
                  ref={invLogic.photoInputRef}
                  onChange={(e) =>
                    e.target.files && invLogic.processPhotos(e.target.files)
                  }
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                <input
                  type="file"
                  ref={invLogic.folderInputRef}
                  onChange={(e) =>
                    e.target.files && invLogic.processPhotos(e.target.files)
                  }
                  className="hidden"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                />
                {invLogic.statusFilter === "all" && (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-full shadow-sm gap-2"
                      onClick={() => invLogic.fileInputRef.current?.click()}
                      disabled={invLogic.isImporting}
                    >
                      <Upload
                        className={cn(
                          "w-4 h-4 text-primary",
                          invLogic.isImporting && "animate-pulse",
                        )}
                      />
                      {invLogic.isImporting
                        ? "Procesando..."
                        : "Importar Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full shadow-sm gap-2 border-violet-500/30 bg-violet-500/5 text-violet-600 hover:bg-violet-500/10"
                      onClick={() => {
                        automationHub.trigger("/inventory/sync", {
                          tenantId: tenant?.id,
                          productCount: invLogic.products.length,
                          timestamp: new Date().toISOString(),
                        });
                        toast.success("Sincronización masiva enviada a n8n");
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Sincronizar IA
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Reiniciar Inventario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            ¿Estás completamente seguro?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará todos los productos
                            permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={invLogic.handleClear}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                          >
                            Eliminar Todo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                      className="gap-2 ml-2"
                      onClick={() => {
                        setForm({ ...emptyForm });
                        setCreateDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      NUEVO PRODUCTO
                    </Button>
                  </>
                )}
                {invLogic.statusFilter === "photos" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-full shadow-sm gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                        disabled={invLogic.isImporting}
                      >
                        <Camera
                          className={cn(
                            "w-4 h-4",
                            invLogic.isImporting && "animate-pulse",
                          )}
                        />
                        {invLogic.isImporting
                          ? "Procesando..."
                          : "Importar Fotos"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => invLogic.photoInputRef.current?.click()}
                        className="cursor-pointer font-medium"
                      >
                        Carga Individual (Max 3/item)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => invLogic.folderInputRef.current?.click()}
                        className="cursor-pointer font-medium"
                      >
                        Carga Masiva (Carpeta)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
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
          </div>

          <Tabs
            value={invLogic.statusFilter}
            onValueChange={invLogic.setStatusFilter}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <TabsList className="w-fit">
                <TabsTrigger value="all">
                  Todos ({invLogic.products.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  Activos (
                  {
                    invLogic.products.filter(
                      (p) => p.status !== "inactive" && p.stock > 0,
                    ).length
                  }
                  )
                </TabsTrigger>
                <TabsTrigger value="agotado">
                  Agotados (
                  {
                    invLogic.products.filter(
                      (p) => p.status !== "inactive" && p.stock === 0,
                    ).length
                  }
                  )
                </TabsTrigger>
                <TabsTrigger value="inactive">
                  Inactivos (
                  {
                    invLogic.products.filter((p) => p.status === "inactive")
                      .length
                  }
                  )
                </TabsTrigger>
                <TabsTrigger
                  value="photos"
                  className="flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Auditoría Fotos
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <div className="relative w-full lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={invLogic.searchQuery}
                    onChange={(e) => invLogic.setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
                <Dialog
                  open={invLogic.isExportOpen}
                  onOpenChange={invLogic.setIsExportOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Download className="w-4 h-4 text-emerald-500" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Exportar Inventario</DialogTitle>
                      <DialogDescription>
                        Selecciona el formato de exportación.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-4">
                      <Button
                        variant="ghost"
                        className="flex flex-col h-24 gap-2"
                        onClick={() => invLogic.handleExport("xlsx")}
                      >
                        <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                        <span className="text-xs font-bold">EXCEL</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex flex-col h-24 gap-2"
                        onClick={() => invLogic.handleExport("csv")}
                      >
                        <FileText className="w-8 h-8 text-blue-600" />
                        <span className="text-xs font-bold">CSV</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex flex-col h-24 gap-2"
                        onClick={() => invLogic.handleExport("json")}
                      >
                        <FileJson className="w-8 h-8 text-amber-600" />
                        <span className="text-xs font-bold">JSON</span>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {invLogic.statusFilter !== "photos" && (
              <TabsContent value={invLogic.statusFilter}>
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Productos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {invLogic.filteredProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold mb-2">
                          No hay productos registrados
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Agrega tu primer producto para empezar a gestionar tu
                          inventario
                        </p>
                        <Button
                          onClick={() => {
                            setForm({ ...emptyForm });
                            setCreateDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Primer Producto
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {invLogic.filteredProducts.map(
                          (product: any, index: number) => (
                            <div
                              key={product.id}
                              className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <ProductImageCarousel
                                  images={product.images || []}
                                  productName={
                                    product.descripcionManguera || product.name
                                  }
                                />
                                {/* Códigos (Izquierda) */}
                                <div
                                  className={cn(
                                    "flex flex-col gap-1 text-muted-foreground shrink-0",
                                    invLogic.statusFilter === "inactive"
                                      ? "text-[10px] w-[110px]"
                                      : "text-[11px] w-[130px]",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "font-medium text-foreground mb-0.5",
                                      invLogic.statusFilter === "inactive"
                                        ? "text-[11px]"
                                        : "text-[12px]",
                                    )}
                                  >
                                    N°:{" "}
                                    {product.rowNumber ||
                                      invLogic.products.findIndex(
                                        (p: any) => p.id === product.id,
                                      ) + 1}
                                  </span>
                                  <span>
                                    CAUPLAS:{" "}
                                    <span className="font-medium text-primary">
                                      {product.cauplas || "-"}
                                    </span>
                                  </span>
                                  <span>
                                    TORFLEX:{" "}
                                    <span className="font-medium">
                                      {product.torflex || "-"}
                                    </span>
                                  </span>
                                  <span>
                                    INDOMAX:{" "}
                                    <span className="font-medium">
                                      {product.indomax || "-"}
                                    </span>
                                  </span>
                                  <span>
                                    OEM:{" "}
                                    <span
                                      className={
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[9px]"
                                          : "text-[10px]"
                                      }
                                    >
                                      {product.oem || "-"}
                                    </span>
                                  </span>
                                </div>

                                {/* Descripción (Medio) */}
                                <div
                                  className={cn(
                                    "flex-1 border-l border-border/40 pl-2.5 py-1 mr-1.5",
                                    invLogic.statusFilter === "inactive"
                                      ? "min-w-[140px]"
                                      : "min-w-[180px]",
                                  )}
                                >
                                  <p
                                    className={cn(
                                      "uppercase text-muted-foreground tracking-wider font-bold mb-0.5",
                                      invLogic.statusFilter === "inactive"
                                        ? "text-[8px]"
                                        : "text-[9px]",
                                    )}
                                  >
                                    DESCRIPCIÓN DEL PRODUCTO
                                  </p>
                                  <p
                                    className={cn(
                                      "font-bold leading-tight text-foreground/90 uppercase pr-1.5 break-words",
                                      invLogic.statusFilter === "inactive"
                                        ? "text-[11px]"
                                        : "text-[13px]",
                                    )}
                                  >
                                    {product.descripcionManguera ||
                                      product.name ||
                                      product.aplicacion ||
                                      "-"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 justify-end">
                                {/* Atributos agrupados verticalmente: Categoría, Combustible, Nuevos */}
                                <div
                                  className={cn(
                                    "flex flex-col gap-1 shrink-0 border-l pl-2.5 pr-2.5 border-border/40 border-r",
                                    invLogic.statusFilter === "inactive"
                                      ? "w-[100px]"
                                      : "w-[120px]",
                                  )}
                                >
                                  <div className="text-center border-b border-border/30 pb-0.5">
                                    <p
                                      className={cn(
                                        "uppercase text-muted-foreground tracking-wider font-bold mb-0.5",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[8px]"
                                          : "text-[9px]",
                                      )}
                                    >
                                      Categoría
                                    </p>
                                    <p
                                      className={cn(
                                        "font-bold leading-tight uppercase text-foreground/90 break-words",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[9px]"
                                          : "text-[11px]",
                                      )}
                                    >
                                      {product.category || "-"}
                                    </p>
                                  </div>
                                  <div className="text-center border-b border-border/30 pb-0.5">
                                    <p
                                      className={cn(
                                        "uppercase text-muted-foreground tracking-wider font-bold mb-0.5",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[8px]"
                                          : "text-[9px]",
                                      )}
                                    >
                                      Combustible
                                    </p>
                                    <p
                                      className={cn(
                                        "font-bold leading-tight uppercase text-foreground/90 break-words",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[9px]"
                                          : "text-[11px]",
                                      )}
                                    >
                                      {product.aplicacionesDiesel || "-"}
                                    </p>
                                  </div>
                                  <div className="text-center mt-0.5">
                                    <p
                                      className={cn(
                                        "uppercase text-muted-foreground tracking-wider font-bold mb-0.5",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[8px]"
                                          : "text-[9px]",
                                      )}
                                    >
                                      Nuevos
                                    </p>
                                    <p
                                      className={cn(
                                        "font-bold leading-tight uppercase text-foreground/90 break-words",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[9px]"
                                          : "text-[11px]",
                                      )}
                                    >
                                      {typeof product.isNuevo === "string"
                                        ? product.isNuevo || "-"
                                        : product.isNuevo
                                          ? "NUEVO"
                                          : "-"}
                                    </p>
                                  </div>
                                </div>

                                {/* Atributos agrupados verticalmente: Ventas y Ranking */}
                                <div
                                  className={cn(
                                    "flex flex-col gap-1 shrink-0 px-1 border-r border-border/40",
                                    invLogic.statusFilter === "inactive"
                                      ? "w-[80px]"
                                      : "w-[95px]",
                                  )}
                                >
                                  <div className="flex flex-col items-center justify-center bg-violet-50/50 dark:bg-violet-950/20 px-1 py-1 rounded-lg border border-violet-100 dark:border-violet-900/30">
                                    <p
                                      className={cn(
                                        "text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wide mb-0.5 text-center",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[8px]"
                                          : "text-[9px]",
                                      )}
                                    >
                                      Ventas
                                    </p>
                                    <p
                                      className={cn(
                                        "font-black text-violet-600 dark:text-violet-400 leading-none",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[12px]"
                                          : "text-[14px]",
                                      )}
                                    >
                                      {getVentasTotal(product) || "-"}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-center justify-center bg-orange-50/50 dark:bg-orange-950/20 px-1 py-1 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                    <p
                                      className={cn(
                                        "text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wide mb-0.5 text-center",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[8px]"
                                          : "text-[9px]",
                                      )}
                                    >
                                      Ranking
                                    </p>
                                    <p
                                      className={cn(
                                        "font-black text-orange-600 dark:text-orange-400 leading-none",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[12px]"
                                          : "text-[14px]",
                                      )}
                                    >
                                      {getRanking(product) || "-"}
                                    </p>
                                  </div>
                                </div>

                                {/* AI Forecast (PREDICCIÓN) */}
                                <div
                                  className={cn(
                                    "flex flex-col gap-1 shrink-0 bg-cyan-50/50 dark:bg-cyan-950/20 px-2.5 py-1.5 rounded-lg border border-cyan-100 dark:border-cyan-900/30",
                                    invLogic.statusFilter === "inactive"
                                      ? "w-[100px]"
                                      : "w-[120px]",
                                  )}
                                >
                                  <p
                                    className={cn(
                                      "text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wide mb-1 flex items-center justify-center gap-1",
                                      invLogic.statusFilter === "inactive"
                                        ? "text-[8px]"
                                        : "text-[9px]",
                                    )}
                                  >
                                    <Brain className="w-2.5 h-2.5" />
                                    Predicción
                                  </p>
                                  {(() => {
                                    const forecast = (invLogic as any)
                                      .forecasts?.[product.id];
                                    if (!forecast || product.stock === 0) {
                                      return (
                                        <p className="text-center font-bold text-rose-500 text-[10px]">
                                          {product.stock === 0
                                            ? "AGOTADO"
                                            : "-"}
                                        </p>
                                      );
                                    }
                                    const hasSales =
                                      forecast.velocity30Days > 0;
                                    if (!hasSales)
                                      return (
                                        <p className="text-center text-muted-foreground text-[9px] leading-tight mt-0.5">
                                          Sin rotación
                                        </p>
                                      );

                                    return (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <div
                                          className={cn(
                                            "font-black flex items-center gap-1",
                                            forecast.isCritical
                                              ? "text-rose-600 animate-pulse"
                                              : "text-cyan-700 dark:text-cyan-300",
                                            invLogic.statusFilter === "inactive"
                                              ? "text-[10px]"
                                              : "text-[12px]",
                                          )}
                                        >
                                          <Clock className="w-2.5 h-2.5" />
                                          {forecast.daysUntilDepletion ===
                                          Infinity
                                            ? "∞"
                                            : `${Math.round(forecast.daysUntilDepletion)} d`}
                                        </div>
                                        <div className="flex items-center gap-1 text-[8px] text-muted-foreground font-medium">
                                          <TrendingDown className="w-2 h-2" />
                                          {forecast.velocity30Days} unid/mes
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Atributos agrupados verticalmente: Precio y Cantidad */}
                                <div
                                  className={cn(
                                    "flex flex-col gap-1 shrink-0 text-center px-1 border-r border-border/40",
                                    invLogic.statusFilter === "inactive"
                                      ? "w-[90px]"
                                      : "w-[105px]",
                                  )}
                                >
                                  <div className="border-b border-border/30 pb-0.5">
                                    <p
                                      className={cn(
                                        "uppercase text-muted-foreground tracking-wide font-bold mb-0.5",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[8px]"
                                          : "text-[9px]",
                                      )}
                                    >
                                      Precio
                                    </p>
                                    <p
                                      className={cn(
                                        "font-black leading-none tabular-nums text-foreground",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[12px]"
                                          : "text-[15px]",
                                      )}
                                    >
                                      $
                                      {new Intl.NumberFormat("es-VE", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }).format(
                                        product.precioFCA || product.price || 0,
                                      )}
                                    </p>
                                  </div>
                                  <div className="pt-0.5 flex flex-col items-center">
                                    <p
                                      className={cn(
                                        "uppercase text-muted-foreground tracking-wide font-bold mb-0.5",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[8px]"
                                          : "text-[9px]",
                                      )}
                                    >
                                      Cant.
                                    </p>
                                    <p
                                      className={cn(
                                        "font-black leading-tight tabular-nums mb-0.5",
                                        invLogic.statusFilter === "inactive"
                                          ? "text-[11px]"
                                          : "text-[12px]",
                                      )}
                                    >
                                      {product.stock}
                                    </p>
                                    <div
                                      className={cn(
                                        "origin-top",
                                        invLogic.statusFilter === "inactive"
                                          ? "scale-[0.6]"
                                          : "scale-[0.75]",
                                      )}
                                    >
                                      {getStockBadge(
                                        product.stock,
                                        product.minStock,
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Observaciones (Solo para pestaña Inactivos) */}
                                {invLogic.statusFilter === "inactive" && (
                                  <div className="w-[140px] shrink-0 border-l border-amber-200/50 pl-2.5 py-1 bg-amber-50/20 dark:bg-amber-950/10 rounded-lg">
                                    <p className="text-[8px] uppercase text-amber-600 dark:text-amber-400 tracking-wider font-bold mb-0.5 flex items-center gap-1">
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      Motivo
                                    </p>
                                    <p className="text-[9px] leading-snug text-foreground/80 italic break-words whitespace-normal line-clamp-2">
                                      {product.deactivationReason ||
                                        "Sin observaciones"}
                                    </p>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-x-2 gap-y-2 ml-4 w-[72px] shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted"
                                    onClick={() => {
                                      setSelectedProductId(product.id);
                                      setViewDialogOpen(true);
                                    }}
                                    title="VER DETALLE"
                                  >
                                    <Eye className="w-[18px] h-[18px] text-slate-500" />
                                  </Button>
                                  {product.status === "active" ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-muted"
                                      onClick={() => {
                                        setProductToDeactivate(product);
                                        setDeactivateReason("");
                                        setDeactivateDialogOpen(true);
                                      }}
                                      title="Desactivar"
                                    >
                                      <Archive className="w-[18px] h-[18px] text-amber-500" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-muted"
                                      onClick={() =>
                                        invLogic.updateProduct(product.id, {
                                          status: "active",
                                        })
                                      }
                                      title="Activar"
                                    >
                                      <CheckCircle className="w-[18px] h-[18px] text-emerald-500" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted"
                                    title="EDITAR PRODUCTO"
                                    onClick={() => {
                                      setForm({
                                        descripcionManguera:
                                          product.descripcionManguera ||
                                          product.name ||
                                          "",
                                        description: product.description || "",
                                        category: product.category || "General",
                                        precioFCA:
                                          product.precioFCA ||
                                          product.price ||
                                          0,
                                        cost: product.cost || 0,
                                        stock: product.stock || 0,
                                        minStock: product.minStock || 5,
                                        barcode: product.oem || "",
                                        supplier: "",
                                        cauplas: product.cauplas || "",
                                        torflex: product.torflex || "",
                                        indomax: product.indomax || "",
                                        oem: product.oem || "",
                                        aplicacionesDiesel:
                                          product.aplicacionesDiesel || "",
                                        isNuevo: product.isNuevo || "",
                                        margen: product.margen || 30,
                                        images: product.images || [],
                                      });
                                      setSelectedProductId(product.id);
                                      setEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-[18px] h-[18px] text-slate-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => {
                                      setSelectedProductId(product.id);
                                      setDeleteDialogOpen(true);
                                    }}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-[18px] h-[18px] text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    {invLogic.totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
                        <p className="text-sm font-medium text-muted-foreground text-center sm:text-left">
                          Página {invLogic.currentPage} de {invLogic.totalPages}{" "}
                          ({invLogic.allFilteredProducts.length} items en total)
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={invLogic.currentPage === 1}
                            onClick={() =>
                              invLogic.setCurrentPage(invLogic.currentPage - 1)
                            }
                            className="font-bold border-2"
                          >
                            Atrás
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              invLogic.currentPage === invLogic.totalPages
                            }
                            onClick={() =>
                              invLogic.setCurrentPage(invLogic.currentPage + 1)
                            }
                            className="font-bold border-2"
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="photos" className="space-y-6">
              <div className="backdrop-blur-xl bg-card/80 border border-border rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent uppercase">
                      Gestión de Fotos
                    </h2>
                    <p className="text-muted-foreground mt-1 text-lg">
                      Auditoría de integridad visual de productos
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="px-6 py-3 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
                      <div className="p-2 bg-primary/20 rounded-xl">
                        <Camera className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary/60 uppercase tracking-widest leading-none mb-1">
                          Total con Fotos
                        </p>
                        <p className="text-2xl font-black text-primary leading-none">
                          {invLogic.products?.filter(
                            (p) => (p.images?.length || 0) > 0,
                          ).length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 py-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
                      <div className="p-2 bg-rose-500/20 rounded-xl">
                        <BadgeX className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-rose-500/60 uppercase tracking-widest leading-none mb-1">
                          Sin Fotos
                        </p>
                        <p className="text-2xl font-black text-rose-500 leading-none">
                          {invLogic.products?.filter(
                            (p) => (p.images?.length || 0) === 0,
                          ).length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border overflow-hidden bg-background/50">
                  <InventoryTable
                    logic={{
                      ...invLogic,
                      filteredProducts: [...invLogic.products].sort(
                        (a, b) =>
                          (a.images?.length || 0) - (b.images?.length || 0),
                      ),
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <ModuleAIAssistant
            moduleName="Productos"
            moduleContext="Gestión de productos, catálogo, precios y stock"
            contextData={{
              totalProducts: invLogic.products.length,
              lowStock: invLogic.lowStockCount,
              outOfStock: invLogic.products.filter((p) => !p.stock).length,
            }}
            compact
          />
        </div>

        {/* DELETE DIALOG */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El producto será eliminado
                permanentemente de la base de datos.
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

        {/* DEACTIVATE DIALOG */}
        <AlertDialog
          open={deactivateDialogOpen}
          onOpenChange={setDeactivateDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Desactivar Producto?</AlertDialogTitle>
              <AlertDialogDescription>
                Por favor, indique un motivo u observación por la cual se
                desactiva este ítem. El producto pasará a la pestaña
                "Inactivos".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label className="text-sm font-semibold mb-1 block">
                Motivo u observación
              </Label>
              <Input
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Ej: Producto descontinuado, dañado..."
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeactivateReason("")}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={!deactivateReason.trim()}
                onClick={() => {
                  if (productToDeactivate) {
                    invLogic.updateProduct(productToDeactivate.id, {
                      status: "inactive",
                      deactivationReason: deactivateReason,
                    });
                  }
                  setDeactivateReason("");
                  setDeactivateDialogOpen(false);
                  setProductToDeactivate(null);
                }}
              >
                Confirmar Desactivación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* VIEW DIALOG */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>DETALLES DEL PRODUCTO</DialogTitle>
              <DialogDescription>
                Información completa del producto {selectedProduct?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold text-primary">
                      CAUPLAS
                    </p>
                    <p className="text-sm font-bold">
                      {selectedProduct.cauplas || "-"}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      TORFLEX
                    </p>
                    <p className="text-sm font-bold">
                      {selectedProduct.torflex || "-"}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      INDOMAX
                    </p>
                    <p className="text-sm font-bold">
                      {selectedProduct.indomax || "-"}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      OEM
                    </p>
                    <p className="text-sm font-bold">
                      {selectedProduct.oem || "-"}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      Estado
                    </p>
                    {getStatusBadge(selectedProduct.status)}
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      Categoría
                    </p>
                    <p className="text-sm font-bold">
                      {selectedProduct.category}
                    </p>
                  </div>

                  {selectedProduct.barcode && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        Código de Barras
                      </p>
                      <p className="text-sm font-bold">
                        {selectedProduct.barcode}
                      </p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      DESCRIPCIÓN DEL PRODUCTO
                    </p>
                    <p className="font-medium">
                      {selectedProduct.descripcionManguera ||
                        selectedProduct.name ||
                        "-"}
                    </p>
                  </div>
                  {selectedProduct.description && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        NOTAS ADICIONALES
                      </p>
                      <p className="text-sm italic">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Precios y Costos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Precio de Venta
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {formatMoney(
                          selectedProduct.precioFCA ||
                            selectedProduct.price ||
                            0,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Costo</p>
                      <p className="text-xl font-bold">
                        {formatMoney(selectedProduct.cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Margen</p>
                      <p className="text-xl font-bold text-blue-600">
                        {(selectedProduct.precioFCA ||
                          selectedProduct.price ||
                          0) > 0
                          ? Math.round(
                              (((selectedProduct.precioFCA ||
                                selectedProduct.price ||
                                0) -
                                selectedProduct.cost) /
                                (selectedProduct.precioFCA ||
                                  selectedProduct.price ||
                                  1)) *
                                100,
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Ganancia por Unidad
                      </p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatMoney(
                          (selectedProduct.precioFCA ||
                            selectedProduct.price ||
                            0) - selectedProduct.cost,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Inventario</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Stock Actual
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedProduct.stock}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Stock Mínimo
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {selectedProduct.minStock}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Valor en Inventario
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatMoney(
                        (selectedProduct.precioFCA ||
                          selectedProduct.price ||
                          0) * selectedProduct.stock,
                      )}
                    </p>
                  </div>
                </div>

                {selectedProduct.supplier && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">Proveedor</p>
                    <p className="font-medium">{selectedProduct.supplier}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* CREATE DIALOG */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                NUEVO PRODUCTO
              </DialogTitle>
              <DialogDescription>
                El producto será guardado y estará disponible en Ventas,
                Facturas, Inventario y Compras
              </DialogDescription>
            </DialogHeader>
            <ProductFormFields />
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!form.descripcionManguera?.trim() || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Producto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* EDIT DIALOG */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                EDITAR PRODUCTO
              </DialogTitle>
              <DialogDescription>
                Los cambios se reflejarán en todos los módulos del sistema
              </DialogDescription>
            </DialogHeader>
            <ProductFormFields />
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={!form.descripcionManguera?.trim() || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Guardando..." : "Actualizar Producto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Progress Overlay for Imports */}
        {invLogic.importProgress.isActive && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl max-w-md w-full mx-4 space-y-6 relative overflow-hidden group">
              {/* Animated Striped Background effect */}
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(45deg,currentColor_25%,transparent_25%,transparent_50%,currentColor_50%,currentColor_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]" />

              <div className="text-center space-y-2 relative">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                  {invLogic.importProgress.type === "photos" ? (
                    <Camera className="w-8 h-8 text-primary" />
                  ) : (
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                  )}
                </div>
                <h3 className="text-2xl font-black tracking-tight uppercase">
                  {invLogic.importProgress.type === "photos"
                    ? "Procesando Fotos..."
                    : "Importando Inventario..."}
                </h3>
                <p className="text-muted-foreground font-medium">
                  {invLogic.importProgress.current} de{" "}
                  {invLogic.importProgress.total} items procesados
                </p>
              </div>

              <div className="space-y-3 relative">
                <div className="h-4 bg-muted rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary transition-all duration-300 relative"
                    style={{
                      width: `${(invLogic.importProgress.current / (invLogic.importProgress.total || 1)) * 100}%`,
                    }}
                  >
                    <div className="absolute inset-0 opacity-30 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-stripe_1s_linear_infinite]" />
                  </div>
                </div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <span>
                    {Math.round(
                      (invLogic.importProgress.current /
                        (invLogic.importProgress.total || 1)) *
                        100,
                    )}
                    %
                  </span>
                  <span>
                    Faltan:{" "}
                    {invLogic.importProgress.total -
                      invLogic.importProgress.current}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-[0.2em] font-bold">
                Favor no cerrar la ventana hasta finalizar el proceso
              </p>
            </div>
          </div>
        )}

        <style>{`
        @keyframes progress-stripe {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}</style>
      </PremiumHUD>
    </ValeryLayout>
  );
}
