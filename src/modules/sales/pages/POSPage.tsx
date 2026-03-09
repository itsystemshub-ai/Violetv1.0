/**
 * POSPage - Punto de Venta Mejorado
 * Interfaz táctil optimizada para ventas rápidas
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  Calculator,
  Percent,
  Receipt,
  AlertCircle,
  Grid3x3,
  List,
  Package,
  DollarSign,
  Landmark,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Camera,
  X,
  ScanLine,
  Eye,
} from "lucide-react";
import { hapticFeedback } from "@/shared/utils/haptics";
import { PremiumHUD } from "@/shared/components/stitch/PremiumHUD";
import { automationHub } from "@/core/infrastructure/automation/AutomationHub";
import { cn } from "@core/shared/utils/utils";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { formatCurrency } from "@/lib";
import { usePOS } from "../hooks/usePOS";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useTenant } from "@/shared/hooks/useTenant";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { ProductImageCarousel } from "@/modules/inventory/components/ProductImageCarousel";

const POSPage: React.FC = () => {
  const { tenant } = useTenant();
  const {
    products,
    cart,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    categories,
    paymentMethod,
    setPaymentMethod,
    loading,
    discountPercentage,
    subtotal,
    totalDiscount,
    tax,
    total,
    itemCount,
    taxRate,
    exchangeRate,
    rates, // Usar las tasas del hook usePOS
    allProducts,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyDiscount,
    processSale,
    getLowStockProducts,
  } = usePOS();

  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [tempDiscount, setTempDiscount] = useState("0");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCartModal, setShowCartModal] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedRate, setSelectedRate] = useState<
    "bcv" | "bcvEuro" | "binance" | "promedio"
  >("bcv");
  const [invoiceCurrency, setInvoiceCurrency] = useState<"USD" | "VES">("USD"); // Moneda de facturación

  // Mobile POS Integration
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
      setIsScanning(true);
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
    }
  };

  const toggleScanner = () => {
    if (isScanning) stopScanner();
    else startScanner();
  };

  // Función eliminada: simulateScan (usaba Math.random para seleccionar productos)
  // Si necesitas esta funcionalidad, implementa una búsqueda por código de barras real

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 40;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  const totalPages = Math.ceil((products || []).length / ITEMS_PER_PAGE);
  const currentProducts = (products || []).slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const lowStockProducts = getLowStockProducts();

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const setQuantity = (productId: string, qty: number) => {
    if (qty < 1) qty = 1;
    const product = products.find((p) => p.id === productId);
    if (product && qty > product.stock) qty = product.stock;
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  const handleAddToCart = (product: any) => {
    const qty = getQuantity(product.id);
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));

    // Trigger n8n for real-time upsell suggestion
    automationHub.trigger("/events/pos-upsell", {
      productId: product.id,
      productName: product.nombre,
      cartValue:
        cart.reduce((acc, item) => acc + item.price * item.quantity, 0) +
        product.precio * qty,
      tenantId: tenant?.id,
    });

    toast.success(`${product.nombre} añadido al carrito`);
  };

  const handleProcessSale = () => {
    if (cart.length === 0) return;
    const sale = processSale();
    setLastSale(sale);
    setShowReceiptDialog(true);

    // Trigger n8n for sale completion
    automationHub.trigger("/events/pos-sale-completed", {
      saleId: sale.id,
      totalAmount: sale.total,
      paymentMethod: sale.paymentMethod,
      items: sale.items.map((item: any) => ({
        productId: item.id,
        productName: item.nombre,
        quantity: item.quantity,
        price: item.precio,
      })),
      tenantId: tenant?.id,
    });
  };

  const handleApplyDiscount = () => {
    const discount = parseFloat(tempDiscount) || 0;
    applyDiscount(discount);
    setShowDiscountDialog(false);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Simulando importación del archivo Excel: ${file.name}`);
      // Lógica futura para leer Excel
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <ValeryLayout sidebar={!isMobile ? <ValerySidebar /> : null}>
        <PremiumHUD>
          <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </PremiumHUD>
      </ValeryLayout>
    );
  }

  // Mobile Terminal Layer
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-background text-foreground flex flex-col overflow-hidden font-sans z-[100]">
        {/* Mobile Header / Scanner Preview */}
        <div
          className={cn(
            "relative transition-all duration-500 overflow-hidden shrink-0",
            isScanning ? "h-64" : "h-16",
          )}
        >
          {isScanning ? (
            <div className="absolute inset-0 bg-slate-100 dark:bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 border-2 border-primary/50 m-12 rounded-3xl animate-pulse flex items-center justify-center">
                <ScanLine className="w-12 h-12 text-primary opacity-50" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full"
                onClick={toggleScanner}
              >
                <X className="w-6 h-6" />
              </Button>
              <div className="absolute bottom-4 left-0 right-0 text-center px-4 space-y-3">
                {/* Botón de escaneo eliminado - usaba datos aleatorios */}
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Escaneando Código de Barras...
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full px-4 flex items-center justify-between bg-primary/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-white/10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-sm font-black tracking-widest uppercase italic">
                PUNTO DE VENTA{" "}
                <span className="text-primary tracking-tighter ml-1">V.3</span>
              </h1>
              <Button variant="ghost" size="icon" onClick={toggleScanner}>
                <Camera className="w-6 h-6 text-primary" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Search Bar */}
        <div className="p-4 bg-primary/5 dark:bg-slate-900/30 shrink-0">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Buscar por Cauplas, OEM, TOR, IND..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-slate-100 dark:bg-white/5 border-none rounded-2xl text-lg focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground text-foreground dark:text-white"
            />
          </div>
        </div>

        {/* Mobile Product List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
          {currentProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white/5 border border-white/5 p-4 rounded-3xl flex items-center justify-between active:scale-95 transition-transform"
              onClick={() => {
                handleAddToCart(p);
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="text-[8px] border-primary/30 text-primary font-black uppercase tracking-tighter"
                  >
                    {p.codigo}
                  </Badge>
                  {p.stock < 10 && (
                    <span className="text-[8px] font-bold text-rose-500 uppercase animate-pulse">
                      Bajo Stock
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-100 line-clamp-1">
                  {p.nombre}
                </h3>
                <p className="text-lg font-black text-primary mt-1">
                  {formatCurrency(p.precio)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                <Plus className="w-6 h-6 text-primary" />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Floating Cart Indicator */}
        {itemCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-slate-950 via-slate-950 to-transparent">
            <Button
              className="w-full h-20 rounded-[2rem] bg-primary hover:bg-primary/90 shadow-[0_20px_40px_rgba(139,61,255,0.4)] flex items-center justify-between px-8 relative overflow-hidden group"
              onClick={() => setShowCartModal(true)}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ShoppingCart className="w-8 h-8 text-primary-foreground" />
                  <span className="absolute -top-1 -right-1 bg-background text-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 text-primary-foreground">
                    Total del Carrito
                  </p>
                  <p className="text-2xl font-black italic tracking-tighter text-primary-foreground">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>
              <div className="h-10 w-px bg-primary-foreground/20" />
              <p className="text-xs font-black uppercase text-primary-foreground tracking-widest">
                PAGAR
              </p>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="flex flex-col gap-5 mb-8 mt-2 max-w-[1100px] mx-auto px-4 w-full">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-black text-primary tracking-widest uppercase">
                Sistema en Línea
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
              Punto de <span className="text-primary italic">Venta</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md">
              Terminal de ventas inteligente optimizado para alta velocidad y
              gestión de inventario.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Status Badges */}
              <div className="hidden sm:flex gap-2 mr-2">
                {getLowStockProducts().length > 0 && (
                  <Badge className="bg-red-500/10 text-red-600 border-red-500/30 px-3 py-1.5 rounded-xl font-bold">
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    {getLowStockProducts().length} Alerta
                  </Badge>
                )}
                <Badge className="bg-primary/10 text-primary border-primary/30 px-3 py-1.5 rounded-xl font-bold">
                  <Package className="h-4 w-4 mr-1.5" />
                  {allProducts.length} Items
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="excel-upload-pos"
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportExcel}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl border-primary/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-primary hover:bg-primary/10 transition-all shadow-sm"
                  onClick={() =>
                    document.getElementById("excel-upload-pos")?.click()
                  }
                  title="Importar Excel"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                </Button>

                <Button
                  size="lg"
                  className="h-12 px-6 rounded-xl shadow-[0_10px_30px_rgba(139,61,255,0.3)] hover:shadow-[0_10px_30px_rgba(139,61,255,0.5)] transition-all duration-300 bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
                  onClick={() => setShowCartModal(true)}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="relative">
                      <ShoppingCart className="h-5 w-5 text-white group-hover:rotate-12 transition-transform" />
                      {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-primary" />
                      )}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-sm font-black text-white">
                        {itemCount} items
                      </span>
                      <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest">
                        Total {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            className={cn(
              "rounded-full px-6 transition-all shrink-0 h-10 font-bold",
              categoryFilter === "all"
                ? "shadow-lg shadow-primary/30"
                : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-primary/50",
            )}
            onClick={() => setCategoryFilter("all")}
          >
            Todos los Productos
          </Button>
          {(categories || []).map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              className={cn(
                "rounded-full px-6 transition-all shrink-0 h-10 font-bold",
                categoryFilter === cat
                  ? "shadow-lg shadow-primary/30"
                  : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-primary/50",
              )}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-6 h-[calc(100vh-210px)]">
        {/* Search and View Controls Control Panel */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-100/30 dark:bg-slate-800/20 p-3 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 backdrop-blur-sm">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Buscar por nombre, código o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-sm rounded-xl border-none bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-1 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-10 px-4 rounded-lg transition-all",
                viewMode === "grid"
                  ? "shadow-md shadow-primary/20"
                  : "text-slate-500",
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              <span className="text-xs font-bold">Cuadrícula</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-10 px-4 rounded-lg transition-all",
                viewMode === "list"
                  ? "shadow-md shadow-primary/20"
                  : "text-slate-500",
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-2" />
              <span className="text-xs font-bold">Lista</span>
            </Button>
          </div>
        </div>

        {/* Grid/Lista de Productos */}
        {viewMode === "grid" ? (
          <div className="overflow-y-auto h-[calc(100%-120px)] pr-2 -mx-2 px-2 scrollbar-thin">
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
              {currentProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-none bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-primary/50 cursor-pointer"
                >
                  {/* Image Area */}
                  <div
                    className="relative aspect-square bg-slate-100/50 dark:bg-slate-800/30 overflow-hidden"
                    onClick={() => handleAddToCart(product)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <ProductImageCarousel
                        images={
                          product.images?.length
                            ? product.images
                            : (product as any).imagen
                              ? [(product as any).imagen]
                              : []
                        }
                        productName={product.nombre}
                        size="md"
                        className="w-full h-full border-none shadow-none bg-transparent transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    {/* Stock & Code Tag */}
                    <div className="absolute top-2 right-2 z-10">
                      <Badge
                        variant={
                          product.stock < 10 ? "destructive" : "secondary"
                        }
                        className={cn(
                          "px-2 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-tighter shadow-sm backdrop-blur-md border-white/20",
                          product.stock >= 10 &&
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        )}
                      >
                        {product.stock} DISPO
                      </Badge>
                    </div>

                    <div className="absolute top-2 left-2 z-10 flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-md bg-black/40 hover:bg-primary text-white backdrop-blur-sm border border-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <span className="text-[8px] font-mono text-white/90 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10 uppercase tracking-widest">
                        {product.codigo}
                      </span>
                    </div>
                  </div>

                  {/* Info del Producto */}
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded-md">
                        {product.categoria}
                      </span>
                      <h3 className="font-bold text-xs line-clamp-2 leading-tight h-8 text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                        {product.nombre}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-primary tracking-tighter">
                          {formatCurrency(product.precio)}
                        </span>
                      </div>

                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Quantity Control Overlay (Hover only) */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            Cantidad
                          </span>
                          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden h-8 ring-1 ring-slate-200 dark:ring-slate-700">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-full w-8 rounded-none hover:bg-primary/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuantity(
                                  product.id,
                                  getQuantity(product.id) - 1,
                                );
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="w-8 text-center font-black text-xs">
                              {getQuantity(product.id)}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-full w-8 rounded-none hover:bg-primary/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuantity(
                                  product.id,
                                  getQuantity(product.id) + 1,
                                );
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <Button
                          className="w-full h-10 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          Añadir{" "}
                          {getQuantity(product.id) > 1
                            ? `(${getQuantity(product.id)})`
                            : ""}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 py-8 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-700 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-500">
                    Página{" "}
                    <span className="text-slate-900 dark:text-white text-lg mx-1">
                      {currentPage}
                    </span>{" "}
                    de {totalPages}
                  </span>
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-black">
                    {(products || []).length} ITEMS EN TOTAL
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-700 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-y-auto h-[calc(100%-120px)] pr-2 -mx-2 px-2">
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800">
              {/* Header de la Tabla */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-slate-100/50 dark:bg-slate-800/50 font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <div className="col-span-1 text-center">Item</div>
                <div className="col-span-2">Identificación</div>
                <div className="col-span-4">Descripción / Clase</div>
                <div className="col-span-2 text-right">Valor Unitario</div>
                <div className="col-span-1 text-center">Existencia</div>
                <div className="col-span-2 text-center">Operación</div>
              </div>

              {/* Filas de Productos */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {(currentProducts || []).map((product) => (
                  <div
                    key={product.id}
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all cursor-pointer group"
                    onClick={() => handleAddToCart(product)}
                  >
                    {/* Imagen */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white/80 dark:bg-slate-800/80 group-hover:scale-110 transition-transform shadow-sm p-1.5 flex items-center justify-center">
                        <ProductImageCarousel
                          images={
                            product.images?.length
                              ? product.images
                              : (product as any).imagen
                                ? [(product as any).imagen]
                                : []
                          }
                          productName={product.nombre}
                          size="xs"
                          className="w-full h-full border-none shadow-none bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Código */}
                    <div className="col-span-2 flex items-center">
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {product.codigo}
                      </span>
                    </div>

                    {/* Producto */}
                    <div className="col-span-4 flex flex-col justify-center">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-primary transition-colors">
                        {product.nombre}
                      </span>
                      <span className="text-[9px] text-primary/70 font-black uppercase tracking-widest">
                        {product.categoria}
                      </span>
                    </div>

                    {/* Precio */}
                    <div className="col-span-2 flex items-center justify-end">
                      <span className="text-base font-black tracking-tighter text-primary">
                        {formatCurrency(product.precio)}
                      </span>
                    </div>

                    {/* Stock */}
                    <div className="col-span-1 flex items-center justify-center">
                      <Badge
                        variant={product.stock < 10 ? "destructive" : "outline"}
                        className={cn(
                          "font-black text-[10px] px-2 py-0.5 rounded-lg",
                          product.stock >= 10 &&
                            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                        )}
                      >
                        {product.stock}
                      </Badge>
                    </div>

                    {/* Acción */}
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 rounded-full hover:bg-primary hover:text-white transition-all overflow-hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 py-8 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-700 hover:bg-primary/10 hover:text-primary transition-colors bg-white/50 dark:bg-slate-900/50 backdrop-blur-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200 dark:border-slate-800">
                  <span className="text-sm font-bold text-slate-500">
                    Página{" "}
                    <span className="text-slate-900 dark:text-white text-lg mx-1">
                      {currentPage}
                    </span>{" "}
                    de {totalPages}
                  </span>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-700"></div>
                  <span className="text-[10px] font-black text-primary tracking-widest uppercase">
                    {(products || []).length} items
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-700 hover:bg-primary/10 hover:text-primary transition-colors bg-white/50 dark:bg-slate-900/50 backdrop-blur-md"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Premium Sales Terminal Modal (Phase 3 & 4) */}
      <Dialog open={showCartModal} onOpenChange={setShowCartModal}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden rounded-[2rem] border-none shadow-[0_0_100px_rgba(0,0,0,0.2)] bg-slate-50 dark:bg-slate-950 flex flex-col">
          {/* Modal Header/Top Bar */}
          <div className="bg-white dark:bg-slate-900 px-8 py-6 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#8b3dff]/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-[#8b3dff]" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                  Terminal de Pago
                </h2>
                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                  Orden de Venta en Proceso
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Total de Items
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                  {itemCount}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-red-500/10 hover:text-red-500"
                onClick={() => setShowCartModal(false)}
              >
                <Trash2 className="w-6 h-6" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Cart Items List */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="space-y-4">
                {(cart || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-6 animate-pulse">
                      <ShoppingCart className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 tracking-tight">
                      CARRITO VACÍO
                    </h3>
                    <p className="text-sm text-slate-500">
                      Agrega productos al terminal para facturar
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {(cart || []).map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1.5">
                          <ProductImageCarousel
                            images={item.imagen ? [item.imagen] : []}
                            productName={item.nombre}
                            size="sm"
                            className="w-full h-full border-none shadow-none bg-transparent"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                            {item.nombre}
                          </h4>
                          <p className="text-xs font-bold text-slate-400 tracking-wider font-mono">
                            {item.codigo} • {formatCurrency(item.precio)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-black text-sm">
                            {item.cantidad}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right min-w-[100px]">
                          <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                            {formatCurrency(item.subtotal)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] font-bold text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-md mt-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0"
                            onClick={() => removeFromCart(item.id)}
                          >
                            ELIMINAR
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Payment & Checkout Summary */}
            <div className="w-[380px] bg-white dark:bg-slate-900 border-l p-8 flex flex-col gap-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Payment Methods Grid */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                    Método de Pago
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "efectivo", label: "Efectivo", icon: Banknote },
                      { id: "tarjeta", label: "Tarjeta", icon: CreditCard },
                      {
                        id: "transferencia",
                        label: "Transf.",
                        icon: Landmark,
                      },
                      { id: "binance", label: "Binance", icon: Smartphone },
                      { id: "zelle", label: "Zelle", icon: DollarSign },
                      { id: "paypal", label: "PayPal", icon: CreditCard },
                    ].map((method) => (
                      <Button
                        key={method.id}
                        variant={
                          paymentMethod === method.id ? "default" : "outline"
                        }
                        className={cn(
                          "h-14 flex-col gap-1 rounded-2xl border-2 transition-all duration-300",
                          paymentMethod === method.id
                            ? "bg-primary border-primary shadow-lg shadow-primary/20"
                            : "hover:border-primary/30 text-slate-500",
                        )}
                        onClick={() => setPaymentMethod(method.id as any)}
                      >
                        <method.icon className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase">
                          {method.label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rate Control */}
                <div className="space-y-4 pt-4 border-t border-dashed">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                    Moneda y Tasa
                  </h3>
                  <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <Button
                      variant={invoiceCurrency === "USD" ? "default" : "ghost"}
                      className={cn(
                        "flex-1 rounded-xl h-10 font-bold text-xs",
                        invoiceCurrency === "USD"
                          ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                          : "text-slate-500",
                      )}
                      onClick={() => setInvoiceCurrency("USD")}
                    >
                      DÓLARES
                    </Button>
                    <Button
                      variant={invoiceCurrency === "VES" ? "default" : "ghost"}
                      className={cn(
                        "flex-1 rounded-xl h-10 font-bold text-xs",
                        invoiceCurrency === "VES"
                          ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                          : "text-slate-500",
                      )}
                      onClick={() => setInvoiceCurrency("VES")}
                    >
                      BOLÍVARES
                    </Button>
                  </div>

                  <Select
                    value={selectedRate}
                    onValueChange={(v: any) => setSelectedRate(v)}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-2 font-bold text-xs">
                      <SelectValue placeholder="Tasa de Cambio" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="bcv" className="font-bold py-3">
                        🏦 BCV: {rates.bcv.toFixed(2)} Bs
                      </SelectItem>
                      <SelectItem value="binance" className="font-bold py-3">
                        ₿ BINANCE: {rates.binance.toFixed(2)} Bs
                      </SelectItem>
                      <SelectItem value="promedio" className="font-bold py-3">
                        📊 PROMEDIO: {rates.promedio.toFixed(2)} Bs
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Totals Section */}
              <div className="mt-auto space-y-4 pt-6 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>SUBTOTAL</span>
                    <span className="text-slate-900 dark:text-white">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-orange-500">
                      <span>DESCUENTO ({discountPercentage}%)</span>
                      <span>-{formatCurrency(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>IMPUESTOS</span>
                    <span className="text-slate-900 dark:text-white">
                      {formatCurrency(tax)}
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#8b3dff]/5 border-2 border-[#8b3dff]/20 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-black text-[#8b3dff] uppercase tracking-widest">
                      Total a Pagar
                    </span>
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {invoiceCurrency === "USD"
                        ? formatCurrency(total)
                        : `Bs ${(total * (rates?.[selectedRate] || 0)).toLocaleString("es-VE")}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#8b3dff]/10">
                    <span className="text-[10px] font-bold text-slate-500">
                      CONVERSIÓN
                    </span>
                    <span className="text-sm font-black text-[#8b3dff]">
                      {invoiceCurrency === "USD"
                        ? `Bs ${(total * (rates?.[selectedRate] || 0)).toLocaleString("es-VE")}`
                        : formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-16 rounded-[1.25rem] bg-[#8b3dff] hover:bg-[#7a2ff0] text-xl font-black shadow-xl shadow-[#8b3dff]/30 active:scale-95 transition-all"
                  onClick={() => {
                    handleProcessSale();
                    setShowCartModal(false);
                  }}
                  disabled={(cart || []).length === 0}
                >
                  COBRAR AHORA
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="max-w-sm rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-orange-500" />
              </div>
              DESCUENTO
            </DialogTitle>
            <DialogDescription className="font-medium">
              Aplicar descuento global a la orden
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center">
            <div className="relative inline-block">
              <input
                type="number"
                value={tempDiscount}
                onChange={(e) => setTempDiscount(e.target.value)}
                className="text-7xl font-black bg-transparent w-40 text-center focus:outline-none focus:ring-0"
                autoFocus
              />
              <span className="text-3xl font-black text-slate-300 ml-1">%</span>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">
              Ahorro:{" "}
              {formatCurrency(
                (subtotal * parseFloat(tempDiscount || "0")) / 100,
              )}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDiscountDialog(false)}
              className="flex-1 rounded-2xl h-12 font-bold"
            >
              CANCELAR
            </Button>
            <Button
              onClick={handleApplyDiscount}
              className="flex-1 bg-primary rounded-2xl h-12 font-black shadow-lg shadow-primary/20"
            >
              APLICAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Receipt Dialog (Phase 4) */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-indigo-900 border-none p-0 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]">
          <div className="p-8 text-center bg-linear-to-b from-emerald-500/20 to-transparent">
            <div className="h-20 w-20 rounded-full bg-emerald-500 mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/50 scale-110 animate-in zoom-in duration-500">
              <Receipt className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">
              ¡Venta Exitosa!
            </h2>
            <p className="text-emerald-300 font-bold tracking-widest text-[10px] uppercase mt-2 opacity-80">
              Comprobante de Pago #{lastSale?.id}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 m-4 rounded-[2rem] p-8 shadow-inner">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-6 border-b border-dashed">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Monto Cobrado
                  </p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white mt-1">
                    {invoiceCurrency === "USD"
                      ? formatCurrency(lastSale?.total || 0)
                      : `Bs ${(lastSale?.total || 0 * (rates?.[selectedRate] || 0)).toLocaleString("es-VE")}`}
                  </p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black h-10 px-4 rounded-xl">
                  LIQUIDADO
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>MÉTODO DE PAGO</span>
                  <span className="text-slate-900 dark:text-white uppercase">
                    {lastSale?.metodoPago}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>FECHA Y HORA</span>
                  <span className="text-slate-900 dark:text-white uppercase">
                    {lastSale?.fecha} - {lastSale?.hora}
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-dashed">
                <Button
                  onClick={() => setShowReceiptDialog(false)}
                  className="w-full h-14 rounded-2xl bg-primary dark:bg-primary text-primary-foreground font-black shadow-xl transition-all active:scale-95 hover:bg-primary/90"
                >
                  LISTO PARA NUEVA VENTA
                </Button>
                <Button
                  variant="ghost"
                  className="w-full mt-2 font-bold text-xs text-slate-400 hover:text-primary"
                >
                  DESCARGAR PDF
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW DIALOG */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-950">
          <div className="bg-primary p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                  Detalles del Producto
                </h2>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
                  Ficha Técnica de Inventario
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {selectedProduct && (
            <div className="p-8 space-y-6">
              <div className="flex gap-6">
                <div className="w-48 h-48 rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  <ProductImageCarousel
                    images={
                      selectedProduct.images?.length
                        ? selectedProduct.images
                        : (selectedProduct as any).imagen
                          ? [(selectedProduct as any).imagen]
                          : []
                    }
                    productName={selectedProduct.nombre}
                    size="lg"
                    className="w-full h-full border-none shadow-none bg-transparent"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-2 font-black uppercase text-[10px]">
                      {selectedProduct.categoria}
                    </Badge>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {selectedProduct.nombre}
                    </h3>
                    <p className="text-primary text-2xl font-black mt-2">
                      {formatCurrency(selectedProduct.precio)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                        Stock Actual
                      </p>
                      <p
                        className={cn(
                          "text-lg font-black",
                          selectedProduct.stock < 10
                            ? "text-red-500"
                            : "text-emerald-500",
                        )}
                      >
                        {selectedProduct.stock} unidades
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                        Código ID
                      </p>
                      <p className="text-lg font-black text-slate-700 dark:text-slate-300 font-mono">
                        {selectedProduct.codigo}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Equivalencias de Marca
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.cauplas && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono"
                      >
                        CP: {selectedProduct.cauplas}
                      </Badge>
                    )}
                    {selectedProduct.torflex && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono"
                      >
                        TF: {selectedProduct.torflex}
                      </Badge>
                    )}
                    {selectedProduct.indomax && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono"
                      >
                        IM: {selectedProduct.indomax}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Estado de Sistema
                  </p>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black">
                    ACTIVO EN CATÁLOGO
                  </Badge>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  setViewDialogOpen(false);
                }}
              >
                AÑADIR AL TERMINAL DE VENTA
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ValeryLayout>
  );
};

export default POSPage;
