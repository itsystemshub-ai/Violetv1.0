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
} from "lucide-react";
import { cn } from "@core/shared/utils/utils";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { formatCurrency } from "@/lib";
import { ModuleAIAssistant } from "@/core/ai/components";
import { usePOS } from "../hooks/usePOS";
import { useExchangeRates } from "@/hooks/useExchangeRates";
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

  const simulateScan = () => {
    const allProducts = products || [];
    if (allProducts.length === 0) return;
    const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
    if (randomProduct) {
      addToCart(randomProduct);
    }
  };


  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 200;

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
  };

  const handleProcessSale = () => {
    if (cart.length === 0) return;
    const sale = processSale();
    setLastSale(sale);
    setShowReceiptDialog(true);
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
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </ValeryLayout>
    );
  }

  // Mobile Terminal Layer
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden font-sans z-[100]">
        {/* Mobile Header / Scanner Preview */}
        <div
          className={cn(
            "relative transition-all duration-500 overflow-hidden shrink-0",
            isScanning ? "h-64" : "h-16"
          )}
        >
          {isScanning ? (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
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
                <Button
                  className="w-full h-12 bg-primary/80 backdrop-blur-md rounded-2xl font-black uppercase tracking-tighter"
                  onClick={simulateScan}
                >
                  Simular Escaneo (Auto-Match)
                </Button>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Escaneando Código de Barras...
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full px-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-b border-white/5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-sm font-black tracking-widest uppercase italic">
                PUNTO DE VENTA <span className="text-primary tracking-tighter ml-1">V.3</span>
              </h1>
              <Button variant="ghost" size="icon" onClick={toggleScanner}>
                <Camera className="w-6 h-6 text-primary" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Search Bar */}
        <div className="p-4 bg-slate-900/30 shrink-0">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white/5 border-none rounded-2xl text-lg focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600 !text-white"
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
                addToCart(p);
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
                  <ShoppingCart className="w-8 h-8 text-white" />
                  <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 text-white">
                    Total del Carrito
                  </p>
                  <p className="text-2xl font-black italic tracking-tighter text-white">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <p className="text-xs font-black uppercase text-white tracking-widest">PAGAR</p>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-green-500/10 dark:bg-green-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

      <div className="h-full p-4 md:p-6 relative z-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-2">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-bold text-primary tracking-tighter uppercase">
                Sistema en Linea
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
              PUNTO DE VENTA{" "}
              <span className="text-primary font-light">V.3</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Terminal de ventas rápido y optimizado para gestión de inventario.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 mr-4">
              {/* Importar Excel Button */}
              <div>
                <input
                  type="file"
                  id="excel-upload-pos"
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportExcel}
                />
                <Button
                  variant="outline"
                  className="h-12 rounded-[1rem] border-primary/20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md font-bold text-primary hover:bg-primary/10 transition-all shadow-sm flex items-center justify-center gap-2"
                  onClick={() =>
                    document.getElementById("excel-upload-pos")?.click()
                  }
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  IMPORTAR EXCEL
                </Button>
              </div>

              {/* Cart Button Header */}
              <Button
                size="lg"
                className="h-12 px-6 rounded-[1rem] shadow-[0_10px_30px_rgba(139,61,255,0.3)] hover:shadow-[0_10px_30px_rgba(139,61,255,0.5)] transition-all duration-500 bg-[#8b3dff] hover:bg-[#7a2ff0] hover:scale-105 active:scale-95 group"
                onClick={() => setShowCartModal(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 text-white group-hover:rotate-12 transition-transform" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />
                    )}
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-sm font-black text-white">
                      {itemCount} items
                    </span>
                    <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest">
                      Ver Carrito
                    </span>
                  </div>
                </div>
              </Button>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Estado del Almacén
              </span>
              <div className="flex gap-2">
                {(lowStockProducts || []).length > 0 && (
                  <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/30 transition-all cursor-help px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold shadow-sm shadow-red-500/5">
                    <AlertCircle className="h-4 w-4" />
                    {(lowStockProducts || []).length}{" "}
                    <span className="hidden sm:inline">ALERTA STOCK</span>
                  </Badge>
                )}
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/30 transition-all px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold shadow-sm shadow-primary/5">
                  <Package className="h-4 w-4" />
                  {(products || []).length}{" "}
                  <span className="hidden sm:inline">PRODUCTOS</span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Integration */}
        <div className="mb-8 relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-primary to-emerald-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
          <div className="relative">
            <ModuleAIAssistant
              moduleName="Punto de Venta"
              moduleContext="Sistema POS con interfaz táctil, recomendaciones de productos y análisis de ventas en tiempo real"
              contextData={{
                itemsEnCarrito: itemCount,
                totalVenta: total,
                metodoPago: paymentMethod,
              }}
              compact
            />
          </div>
        </div>

        <div className="space-y-6 h-[calc(100vh-210px)]">
          {/* Enhanced Search and Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-primary to-emerald-400 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-300" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Escriba para buscar por nombre, código o categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base rounded-2xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex gap-1.5 p-1.5 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl h-14 ring-1 ring-slate-300/50 dark:ring-slate-700/50">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  className={cn(
                    "flex-1 md:w-16 h-full rounded-xl transition-all duration-300",
                    viewMode === "grid"
                      ? "shadow-lg shadow-primary/30"
                      : "text-slate-500 hover:text-primary hover:bg-white/50 dark:hover:bg-slate-700/50",
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  className={cn(
                    "flex-1 md:w-16 h-full rounded-xl transition-all duration-300",
                    viewMode === "list"
                      ? "shadow-lg shadow-primary/30"
                      : "text-slate-500 hover:text-primary hover:bg-white/50 dark:hover:bg-slate-700/50",
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Grid/Lista de Productos */}
          {viewMode === "grid" ? (
            // Vista Cuadrada (Catálogo)
            <div className="overflow-y-auto h-[calc(100%-80px)] pr-2">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {currentProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800"
                  >
                    {/* Decorative Gradient Overlay */}
                    <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Imagen del Producto */}
                    <div className="relative w-full aspect-[4/3] bg-slate-50/50 dark:bg-slate-800/20 p-5">
                      <div className="w-full h-full bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105 p-2">
                        <ProductImageCarousel
                          images={
                            product.images?.length
                              ? product.images
                              : product.imagen
                                ? [product.imagen]
                                : []
                          }
                          productName={product.nombre}
                          size="lg"
                          className="w-full h-full border-none shadow-none bg-transparent"
                        />
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-7 right-7 flex flex-col gap-1 z-10">
                        {product.stock < 10 && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-2 py-0.5 shadow-lg backdrop-blur-md bg-red-500/80 animate-pulse"
                          >
                            Stock Bajo
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-primary/20"
                        >
                          {product.codigo}
                        </Badge>
                      </div>
                    </div>

                    {/* Info del Producto */}
                    <CardContent className="p-4 relative space-y-3">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                          {product.categoria}
                        </p>
                        <h3 className="font-bold text-sm line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                          {product.nombre}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between items-end">
                        <div className="space-y-0.5">
                          <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {formatCurrency(product.precio)}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            Disponibles:{" "}
                            <span
                              className={cn(
                                "font-bold",
                                product.stock < 10
                                  ? "text-red-500"
                                  : "text-green-600",
                              )}
                            >
                              {product.stock}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Quick Quantity Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden h-9 ring-1 ring-slate-200 dark:ring-slate-700">
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
                          <input
                            type="number"
                            value={getQuantity(product.id)}
                            className="w-full text-center font-bold text-xs bg-transparent focus:outline-none"
                            readOnly
                          />
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
                        <Button
                          size="sm"
                          className="h-9 rounded-lg font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                          LISTO
                        </Button>
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
            // Vista Lista (Tabla)
            <div className="overflow-y-auto h-[calc(100%-80px)] pr-2">
              <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
                {/* Header de la Tabla */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-100/80 dark:bg-slate-800/80 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                  <div className="col-span-1 text-center">FOTO</div>
                  <div className="col-span-2">CÓDIGO</div>
                  <div className="col-span-4">PRODUCTO / CATEGORÍA</div>
                  <div className="col-span-2 text-right">PRECIO UNIT.</div>
                  <div className="col-span-1 text-center">STOCK</div>
                  <div className="col-span-2 text-center">ACCIONES</div>
                </div>

                {/* Filas de Productos */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 shadow-inner">
                  {currentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="grid grid-cols-12 gap-4 p-4 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all cursor-pointer group animate-in fade-in slide-in-from-left-2 duration-300"
                      onClick={() => addToCart(product)}
                    >
                      {/* Imagen */}
                      <div className="col-span-1 flex items-center justify-center">
                        <div className="h-14 w-14 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 group-hover:scale-110 transition-transform shadow-sm p-1 flex items-center justify-center">
                          <ProductImageCarousel
                            images={
                              product.images?.length
                                ? product.images
                                : product.imagen
                                  ? [product.imagen]
                                  : []
                            }
                            productName={product.nombre}
                            size="sm"
                            className="w-[90%] h-[90%] border-none shadow-none bg-transparent"
                          />
                        </div>
                      </div>

                      {/* Código */}
                      <div className="col-span-2 flex items-center">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        >
                          {product.codigo}
                        </Badge>
                      </div>

                      {/* Producto */}
                      <div className="col-span-4 flex flex-col justify-center">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-primary transition-colors">
                          {product.nombre}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          {product.categoria}
                        </span>
                      </div>

                      {/* Precio */}
                      <div className="col-span-2 flex items-center justify-end">
                        <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                          {formatCurrency(product.precio)}
                        </span>
                      </div>

                      {/* Stock */}
                      <div className="col-span-1 flex items-center justify-center">
                        <Badge
                          variant={
                            product.stock < 10 ? "destructive" : "outline"
                          }
                          className={cn(
                            "font-bold text-xs ring-2 ring-transparent transition-all",
                            product.stock < 10 ? "animate-pulse" : "",
                          )}
                        >
                          {product.stock}
                        </Badge>
                      </div>

                      {/* Acción */}
                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden h-9 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-full w-8 rounded-none hover:bg-primary/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuantity(
                                product.id,
                                Math.max(1, getQuantity(product.id) - 1),
                              );
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-bold">
                            {getQuantity(product.id)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-full w-8 rounded-none hover:bg-primary/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuantity(
                                product.id,
                                Math.min(
                                  product.stock,
                                  getQuantity(product.id) + 1,
                                ),
                              );
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          className="h-10 w-10 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 py-6 mt-2">
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
                    <span className="text-xs font-black text-primary tracking-widest uppercase">
                      {(products || []).length} ITEMS EN TOTAL
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
                          className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#8b3dff]/30 hover:shadow-xl transition-all duration-300"
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
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#8b3dff] transition-colors">
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
                              className="h-6 text-[10px] font-bold text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-md mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                              ? "bg-[#8b3dff] border-[#8b3dff] shadow-lg shadow-[#8b3dff]/20"
                              : "hover:border-[#8b3dff]/30 text-slate-500",
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
                        variant={
                          invoiceCurrency === "USD" ? "default" : "ghost"
                        }
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
                        variant={
                          invoiceCurrency === "VES" ? "default" : "ghost"
                        }
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
                <span className="text-3xl font-black text-slate-300 ml-1">
                  %
                </span>
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

            <div className="bg-white dark:bg-slate-900 m-4 rounded-[2rem] p-8 shadow-inner">
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
                    className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black shadow-xl transition-all active:scale-95"
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
      </div>
    </ValeryLayout>
  );
};

export default POSPage;
