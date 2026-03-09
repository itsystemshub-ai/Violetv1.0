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
  const [photoImportModalOpen, setPhotoImportModalOpen] = useState(false);

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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <PremiumHUD active={true}>
      <div className="p-4 space-y-4 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Gestión de Productos
            </h2>
            <p className="text-muted-foreground">
              Catálogo completo de productos con control de stock e IA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
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

        <Tabs
          value={invLogic.statusFilter}
          onValueChange={invLogic.setStatusFilter}
          className="w-full space-y-4"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <input
              type="file"
              ref={invLogic.fileInputRef}
              onChange={invLogic.handleImport}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <input
              type="file"
              ref={invLogic.folderInputRef}
              onChange={invLogic.handlePhotoImport}
              draggable
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={invLogic.photoInputRef}
              onChange={invLogic.handleIndividualPhotoImport}
              accept="image/*"
              multiple
              className="hidden"
            />
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
              <TabsTrigger value="photos" className="flex items-center gap-1.5">
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
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                  <InventoryTable logic={invLogic} />
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
                <InventoryTable logic={invLogic} />
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
              desactiva este ítem. El producto pasará a la pestaña "Inactivos".
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

      {/* PHOTO IMPORT MODAL */}
      <Dialog
        open={photoImportModalOpen}
        onOpenChange={setPhotoImportModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Importar Fotos de Productos
            </DialogTitle>
            <DialogDescription>
              Selecciona el método de carga de imágenes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full h-auto py-6 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary transition-all"
              onClick={() => {
                invLogic.photoInputRef.current?.click();
                setPhotoImportModalOpen(false);
              }}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-base">Carga Individual</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo 3 fotos por producto
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto py-6 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary transition-all"
              onClick={() => {
                invLogic.folderInputRef.current?.click();
                setPhotoImportModalOpen(false);
              }}
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-base">Carga Masiva</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Importar carpeta completa de imágenes
                </p>
              </div>
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-semibold mb-1">💡 Consejo:</p>
            <p>
              Para carga masiva, nombra las imágenes con el código CAUPLAS del
              producto para asociarlas automáticamente.
            </p>
          </div>
        </DialogContent>
      </Dialog>

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
                        selectedProduct.precioFCA || selectedProduct.price || 0,
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
              El producto será guardado y estará disponible en Ventas, Facturas,
              Inventario y Compras
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
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
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

      {/* Progress Toast - Compact in Top Right */}
      {invLogic.importProgress.isActive && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right">
          <div className="bg-card p-4 rounded-lg border border-border shadow-lg max-w-sm w-80">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                {invLogic.importProgress.type === "photos" ? (
                  <Camera className="w-5 h-5 text-primary animate-pulse" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-primary animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold mb-1">
                  {invLogic.importProgress.type === "photos"
                    ? "Procesando Fotos"
                    : "Importando Inventario"}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {invLogic.importProgress.current} de{" "}
                  {invLogic.importProgress.total}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${(invLogic.importProgress.current / (invLogic.importProgress.total || 1)) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
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
            </div>
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
  );
}
