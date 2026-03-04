import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Filter,
  FileUp,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Minus,
  Plus,
  X,
  ZoomIn,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Product, formatCurrency } from "@/lib/index";
import { IMAGES } from "@/assets/images";
import { useImageConverter } from "@/shared/hooks/useImageConverter";

// --- Internal Components ---

// Modal de Vista Previa de Imagen
const ImagePreviewModal = ({
  images,
  initialIndex,
  onClose,
  productName,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  productName: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const modalContent = (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all z-50 backdrop-blur-md border border-white/20 shadow-xl"
        title="Cerrar (ESC)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Contenedor de imagen - Centrado y con tamaño controlado */}
      <div className="relative max-w-4xl max-h-[70vh] w-full flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`${productName} - Foto ${currentIndex + 1}`}
          className="max-w-[90%] max-h-[90%] object-contain rounded-xl shadow-2xl"
        />

        {/* Indicador de cantidad */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full font-bold text-sm backdrop-blur-md border border-white/20 shadow-xl">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Botones de navegación */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md border border-white/20 shadow-xl"
              title="Foto anterior"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md border border-white/20 shadow-xl"
              title="Foto siguiente"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        {/* Nombre del producto */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-xl font-bold backdrop-blur-md border border-white/20 shadow-xl">
          {productName}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const ProductGalleryCard = ({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product, q: number) => void;
}) => {
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  // Convertir imágenes automáticamente
  const { images: convertedImages, isConverting } = useImageConverter(product.images);
  const images = convertedImages.length > 0 ? convertedImages : [IMAGES.AI_TECH_1];

  // Debug: verificar imágenes del producto
  useEffect(() => {
    if (product.images && product.images.length > 0) {
      console.log(`🖼️ ProductGalleryCard - ${product.name} (${product.cauplas}): ${convertedImages.length}/${product.images.length} foto(s) convertidas`);
    }
  }, [product.cauplas, product.images, product.name, convertedImages.length]);

  // Reset index si cambian las imágenes
  useEffect(() => {
    if (currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity((q) => q + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(product, quantity);
    setQuantity(1);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Card className="group relative flex flex-col h-full bg-card hover:shadow-2xl transition-all duration-500 border border-border/40 hover:border-primary/30 overflow-hidden rounded-4xl">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="px-5 pt-5 pb-2 flex flex-col gap-2 relative z-10">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-xl uppercase italic tracking-wider ring-1 ring-primary/20 shadow-sm">
            CAUPLAS: {product.cauplas}
          </span>
          <Badge
            variant="secondary"
            className="font-black italic text-[9px] bg-muted/50 border-none shadow-sm"
          >
            {product.category || "GENERAL"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 opacity-70">
          <span className="text-[9px] font-bold uppercase tracking-wide">
            TOR:{" "}
            <span className="text-foreground/80">
              {product.torflex || "N/A"}
            </span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wide">
            IND:{" "}
            <span className="text-foreground/80">
              {product.indomax || "N/A"}
            </span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wide">
            OEM:{" "}
            <span className="text-foreground/80">{product.oem || "N/D"}</span>
          </span>
        </div>
      </div>

      <div className="relative aspect-square w-full px-8 py-6 flex items-center justify-center bg-transparent group-hover:bg-primary/5 transition-colors text-center z-10">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        </div>
        <div 
          className="w-full h-full flex items-center justify-center relative z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
          title="Click para vista previa"
        >
          <img
            src={images[currentImageIndex]}
            alt={`${product.name} - Foto ${currentImageIndex + 1}`}
            className="max-h-full max-w-full object-contain group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500 drop-shadow-md"
            onLoad={() => {
              console.log(`✅ Imagen ${currentImageIndex + 1}/${images.length} cargada para ${product.name} (${product.cauplas})`);
            }}
            onError={() => {
              console.error(`❌ Error cargando imagen ${currentImageIndex + 1}/${images.length} para ${product.name} (${product.cauplas})`);
            }}
          />
          {/* Icono de zoom al hacer hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
            <ZoomIn className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </div>
        
        {/* Indicador de cantidad de fotos */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg z-30">
            {currentImageIndex + 1}/{images.length}
          </div>
        )}
        
        {/* Botones de navegación */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-30 shadow-lg"
              title="Foto anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-30 shadow-lg"
              title="Foto siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        
        {product.isNuevo && (
          <div className="absolute top-2 right-2 z-30">
            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none font-black text-[9px] px-2.5 py-0.5 shadow-lg animate-pulse ring-2 ring-emerald-500/20">
              NUEVO
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-5 pt-0 mt-auto relative z-10 bg-linear-to-t from-card via-card to-transparent border-t border-border/30">
        <div className="flex flex-col gap-3 mb-4 pt-4">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase opacity-50 tracking-widest leading-none mb-1.5">
                Precio Unit
              </span>
              <span className="text-2xl font-black text-[#ff4b2b] drop-shadow-sm italic tracking-tighter">
                {formatCurrency(product.precioFCA || product.price, "USD")}
              </span>
            </div>
            <div className="flex items-center bg-background/50 p-1.5 rounded-2xl border border-border/40 shadow-inner shrink-0 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl hover:bg-background hover:shadow-sm transition-all"
                onClick={handleDecrement}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-sm font-black italic">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl hover:bg-background hover:shadow-sm transition-all"
                onClick={handleIncrement}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <h3 className="font-black text-sm leading-tight text-foreground/90 line-clamp-2 uppercase italic">
            {product.descripcionManguera || product.name}
          </h3>
        </div>
        <Button
          className="w-full font-black gap-2 text-[11px] h-12 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/20 uppercase italic rounded-2xl transition-all active:scale-95 group-hover:shadow-primary/40"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          <ShoppingCart className="h-4 w-4" /> AÑADIR ORDEN
        </Button>
      </CardContent>
      
      {/* Modal de vista previa */}
      {showPreview && (
        <ImagePreviewModal
          images={images}
          initialIndex={currentImageIndex}
          onClose={() => setShowPreview(false)}
          productName={product.descripcionManguera || product.name}
        />
      )}
    </Card>
  );
};

const ProductListRow = ({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product, q: number) => void;
}) => {
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  // Convertir imágenes automáticamente
  const { images: convertedImages } = useImageConverter(product.images);
  const images = convertedImages.length > 0 ? convertedImages : [IMAGES.AI_TECH_1];

  // Debug: verificar imágenes del producto
  useEffect(() => {
    if (product.images && product.images.length > 0) {
      console.log(`🖼️ ProductListRow - ${product.name} (${product.cauplas}): ${convertedImages.length}/${product.images.length} foto(s) convertidas`);
    }
  }, [product.cauplas, product.images, product.name, convertedImages.length]);

  // Reset index si cambian las imágenes
  useEffect(() => {
    if (currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Card className="group overflow-hidden border border-border/40 hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 rounded-4xl bg-card/60 backdrop-blur-md relative">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex flex-col sm:flex-row items-center p-3 h-auto sm:h-28 gap-4">
        <div 
          className="w-full sm:w-24 h-24 bg-muted/10 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center relative border border-border/20 group-hover:border-primary/20 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
          title="Click para vista previa"
        >
          <img
            src={images[currentImageIndex]}
            alt={`${product.name} - Foto ${currentImageIndex + 1}`}
            className="w-full h-full object-contain mix-blend-multiply opacity-90 p-2 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm"
            onLoad={() => {
              console.log(`✅ Lista - Imagen ${currentImageIndex + 1}/${images.length} cargada para ${product.name} (${product.cauplas})`);
            }}
            onError={() => {
              console.error(`❌ Lista - Error cargando imagen ${currentImageIndex + 1}/${images.length} para ${product.name} (${product.cauplas})`);
            }}
          />
          
          {/* Icono de zoom al hacer hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl pointer-events-none">
            <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          
          {/* Indicador de cantidad de fotos */}
          {images.length > 1 && (
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-lg z-10">
              {currentImageIndex + 1}/{images.length}
            </div>
          )}
          
          {/* Botones de navegación */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-0 top-0 bottom-0 w-6 bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10"
                title="Foto anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-0 top-0 bottom-0 w-6 bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10"
                title="Foto siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex-1 px-2 sm:px-4 grid grid-cols-12 items-center gap-4 w-full">
          <div className="col-span-12">
            <div className="flex flex-wrap items-center gap-2 sm:gap-6 mb-2 text-[10px] font-black uppercase italic tracking-wider">
              <span className="text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/20 shadow-sm">
                CAUPLAS: {product.cauplas}
              </span>
              <span className="text-muted-foreground/60 border border-border/40 px-2 py-0.5 rounded-md bg-muted/10">
                TOR: {product.torflex || "N/A"}
              </span>
              <span className="text-muted-foreground/60 border border-border/40 px-2 py-0.5 rounded-md bg-muted/10">
                IND: {product.indomax || "N/A"}
              </span>
              <span className="text-muted-foreground/60 border border-border/40 px-2 py-0.5 rounded-md bg-muted/10">
                OEM: {product.oem || "N/D"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase h-6 px-3 bg-primary/5 text-primary border-primary/20 rounded-lg shadow-sm"
              >
                {product.category}
              </Badge>
              {product.isNuevo && (
                <Badge className="text-[9px] font-black uppercase h-6 px-3 bg-emerald-500 text-white rounded-lg shadow-md ring-1 ring-emerald-500/20">
                  NUEVO
                </Badge>
              )}
              <h4 className="flex-1 font-bold text-sm truncate uppercase text-foreground/90 leading-tight italic">
                {product.descripcionManguera || product.name}
              </h4>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-2 sm:px-6 sm:border-l border-border/30 w-full sm:w-auto">
          <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
            <span className="text-[9px] font-black text-muted-foreground uppercase opacity-50 tracking-widest leading-none mb-1.5">
              Precio Unit
            </span>
            <span className="text-2xl font-black text-[#ff4b2b] tracking-tighter italic">
              {formatCurrency(product.precioFCA || product.price, "USD")}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center bg-background p-1.5 rounded-2xl border border-border/40 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl hover:bg-muted"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-black text-sm italic">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl hover:bg-muted"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              className="h-12 px-8 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-2xl font-black uppercase italic tracking-widest gap-2 shadow-xl shadow-primary/20 transition-transform active:scale-95 group-hover:shadow-primary/40 shrink-0"
              onClick={() => onAdd(product, quantity)}
            >
              <ShoppingCart className="h-4 w-4" /> Añadir
            </Button>
          </div>
        </div>
      </div>
      
      {/* Modal de vista previa */}
      {showPreview && (
        <ImagePreviewModal
          images={images}
          initialIndex={currentImageIndex}
          onClose={() => setShowPreview(false)}
          productName={product.descripcionManguera || product.name}
        />
      )}
    </Card>
  );
};

// --- Main POS Tab Component ---

interface SalesPOSProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  products: Product[];
  allProducts: Product[];
  onAdd: (p: Product, q: number) => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  itemsPerPage: number;
}

export const SalesPOS = ({
  searchQuery,
  setSearchQuery,
  products,
  allProducts,
  onAdd,
  onImportExcel,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
}: SalesPOSProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-4 pt-0">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código Cauplas, OEM, aplicación o nombre..."
            className="pl-10 h-12 text-base shadow-sm border-border/60"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <div>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              id="pos-excel-upload"
              onChange={onImportExcel}
            />
            <label htmlFor="pos-excel-upload">
              <Button
                variant="outline"
                className="h-12 px-4 gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:hover:bg-emerald-900/50 cursor-pointer"
                asChild
              >
                <span>
                  <FileUp className="h-4 w-4" /> Importar Pedido
                </span>
              </Button>
            </label>
          </div>
          <Button variant="outline" className="h-12 px-6 gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl bg-card/80 border border-border p-2.5 px-4 rounded-xl shadow-lg mb-2">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background/50 px-3 py-1.5 rounded-lg border border-border/40 shadow-sm">
            Mostrando{" "}
            <span className="text-primary font-black">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, allProducts.length)}
            </span>{" "}
            de{" "}
            <span className="text-primary-foreground bg-primary px-1.5 rounded-sm">
              {allProducts.length}
            </span>{" "}
            productos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-background rounded-lg border border-border p-1 shadow-inner h-10 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-8 w-10 transition-all rounded-md ${viewMode === "grid" ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground/40"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-8 w-10 transition-all rounded-md ${viewMode === "list" ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground/40"}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Button
              variant="outline"
              className="h-10 px-4 text-[10px] font-black uppercase italic gap-2 border-border/60 hover:bg-background shadow-sm"
            >
              Orden por defecto <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {products.map((p) => (
            <ProductGalleryCard key={p.id} product={p} onAdd={onAdd} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {products.map((p) => (
            <ProductListRow key={p.id} product={p} onAdd={onAdd} />
          ))}
        </div>
      )}
      
      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 backdrop-blur-xl bg-card/80 border border-border rounded-2xl p-4 shadow-lg mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="h-9 px-3 rounded-xl"
          >
            Primera
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 px-3 rounded-xl"
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl">
            <span className="text-sm font-bold">
              {currentPage} / {totalPages}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 px-3 rounded-xl"
          >
            Siguiente
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="h-9 px-3 rounded-xl"
          >
            Última
          </Button>
        </div>
      )}
    </div>
  );
};
