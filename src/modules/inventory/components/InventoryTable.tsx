import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  History,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ZoomIn,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/core/shared/utils/utils";
import type { InventoryLogic, Product, SortField } from "@/types/inventory";
import { useImageConverter } from "@/shared/hooks/useImageConverter";

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

      {/* Contenedor de imagen */}
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

const ProductImageCarousel = ({ images, productName }: { images: string[]; productName?: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Convertir imágenes automáticamente
  const { images: convertedImages } = useImageConverter(images);
  const displayImages = convertedImages.length > 0 ? convertedImages : [];

  // Debug: verificar si las imágenes llegan
  useEffect(() => {
    if (images && images.length > 0) {
      console.log(`ProductImageCarousel - ${convertedImages.length}/${images.length} imágenes convertidas`);
    }
  }, [images, convertedImages.length]);

  // Reset index si cambian las imágenes
  useEffect(() => {
    if (currentIndex >= displayImages.length) {
      setCurrentIndex(0);
    }
  }, [displayImages.length, currentIndex]);

  if (!displayImages || displayImages.length === 0) {
    return (
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto">
        <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
      </div>
    );
  }

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    setImageError(false);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    setImageError(false);
  };

  return (
    <>
      <div 
        className="relative w-14 h-14 rounded-xl overflow-hidden group mx-auto border border-border/50 shadow-sm bg-muted/20 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setShowPreview(true);
        }}
        title="Click para vista previa"
      >
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
          </div>
        ) : (
          <img
            src={displayImages[currentIndex]}
            alt={`Foto ${currentIndex + 1} de ${displayImages.length}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => {
              console.error(`Error cargando imagen ${currentIndex + 1}/${displayImages.length}`);
              setImageError(true);
            }}
          />
        )}
        
        {/* Icono de zoom al hacer hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl pointer-events-none">
          <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
        </div>
        
        {/* Indicador de cantidad de fotos */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold z-10">
            {currentIndex + 1}/{displayImages.length}
          </div>
        )}
        
        {displayImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-0 top-0 bottom-0 w-5 bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/50 z-10"
              title="Foto anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-0 top-0 bottom-0 w-5 bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/50 z-10"
              title="Foto siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      
      {/* Modal de vista previa */}
      {showPreview && (
        <ImagePreviewModal
          images={displayImages}
          initialIndex={currentIndex}
          onClose={() => setShowPreview(false)}
          productName={productName || "Producto"}
        />
      )}
    </>
  );
};

interface InventoryTableProps {
  logic: InventoryLogic;
}

export const InventoryTable = ({ logic }: InventoryTableProps) => {
  // Helper function para obtener ventas totales de manera robusta
  const getVentasTotal = (product: Product): number => {
    // Prioridad 1: Campo historial (valor directo del Excel)
    if (product.historial != null && Number(product.historial) > 0) {
      return Number(product.historial);
    }
    
    // Prioridad 2: Suma de ventasHistory
    if (product.ventasHistory) {
      const sum = (product.ventasHistory[2023] || 0) + 
                  (product.ventasHistory[2024] || 0) + 
                  (product.ventasHistory[2025] || 0);
      if (sum > 0) return sum;
    }
    
    return 0;
  };

  // Helper function para obtener ranking de manera robusta
  const getRanking = (product: Product): string => {
    // Prioridad 1: Buscar en rankingHistory (cualquier año con valor)
    if (product.rankingHistory) {
      const ranking2025 = product.rankingHistory[2025];
      const ranking2024 = product.rankingHistory[2024];
      const ranking2023 = product.rankingHistory[2023];
      
      if (ranking2025 != null && Number(ranking2025) > 0) return String(ranking2025);
      if (ranking2024 != null && Number(ranking2024) > 0) return String(ranking2024);
      if (ranking2023 != null && Number(ranking2023) > 0) return String(ranking2023);
    }
    
    return "-";
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (logic.sortBy !== field)
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20 inline-block" />;
    return logic.sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />
    );
  };

  const startItem = (logic.currentPage - 1) * logic.itemsPerPage + 1;
  const endItem = Math.min(logic.currentPage * logic.itemsPerPage, logic.allFilteredProducts?.length || 0);
  const totalItems = logic.allFilteredProducts?.length || 0;

  return (
    <div className="w-full space-y-4">
      {/* Información de paginación y controles */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl bg-card/80 border border-border rounded-2xl p-4 shadow-lg">
        <div className="text-sm text-muted-foreground">
          Mostrando <span className="font-bold text-foreground">{startItem}</span> a{" "}
          <span className="font-bold text-foreground">{endItem}</span> de{" "}
          <span className="font-bold text-foreground">{totalItems}</span> productos
          {logic.products?.length !== totalItems && (
            <span className="ml-2 text-xs">
              (Total en inventario: {logic.products?.length || 0})
            </span>
          )}
        </div>
        
        {logic.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logic.setCurrentPage(1)}
              disabled={logic.currentPage === 1}
              className="h-9 px-3 rounded-xl"
            >
              Primera
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logic.setCurrentPage(logic.currentPage - 1)}
              disabled={logic.currentPage === 1}
              className="h-9 px-3 rounded-xl"
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-2 px-3">
              <span className="text-sm font-medium">
                Página {logic.currentPage} de {logic.totalPages}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => logic.setCurrentPage(logic.currentPage + 1)}
              disabled={logic.currentPage === logic.totalPages}
              className="h-9 px-3 rounded-xl"
            >
              Siguiente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logic.setCurrentPage(logic.totalPages)}
              disabled={logic.currentPage === logic.totalPages}
              className="h-9 px-3 rounded-xl"
            >
              Última
            </Button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-xl shadow-lg p-4">
        <Table className="min-w-[820px] border-collapse table-fixed">
          <TableHeader className="bg-muted/80 sticky top-0 z-20 backdrop-blur-md">
            <TableRow className="hover:bg-transparent border-b border-border h-16">
              <TableHead 
                className="w-[30px] text-center font-bold text-foreground text-[11px] uppercase tracking-wider px-1 bg-muted/95 cursor-pointer hover:bg-muted select-none group"
                onClick={() => logic.handleSort("rowNumber")}
              >
                N°
                <SortIcon field="rowNumber" />
              </TableHead>
              <TableHead className="w-[80px] text-center font-bold text-foreground text-[11px] uppercase tracking-wider px-2">
                FOTO
              </TableHead>
              <TableHead
                className="w-[100px] text-left font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group"
                onClick={() => logic.handleSort("cauplas")}
              >
                {logic.tableHeaders?.inventory?.cauplas || "CAUPLAS"}
                <SortIcon field="cauplas" />
              </TableHead>
              <TableHead
                className="w-[60px] text-left font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group"
                onClick={() => logic.handleSort("torflex")}
              >
                {logic.tableHeaders?.inventory?.torflex || "TORFLEX"}
                <SortIcon field="torflex" />
              </TableHead>
              <TableHead
                className="w-[60px] text-left font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group"
                onClick={() => logic.handleSort("indomax")}
              >
                {logic.tableHeaders?.inventory?.indomax || "INDOMAX"}
                <SortIcon field="indomax" />
              </TableHead>
              <TableHead
                className="w-[60px] text-left font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group"
                onClick={() => logic.handleSort("oem")}
              >
                {logic.tableHeaders?.inventory?.oem || "OEM"}
                <SortIcon field="oem" />
              </TableHead>
              <TableHead
                className="w-[250px] text-left font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group whitespace-normal leading-tight"
                onClick={() => logic.handleSort("name")}
              >
                {logic.tableHeaders?.inventory?.description || "DESCRIPCION DEL PRODUCTO"}
                <SortIcon field="name" />
              </TableHead>
              <TableHead
                className="w-[90px] text-left font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group"
                onClick={() => logic.handleSort("category")}
              >
                {logic.tableHeaders?.inventory?.category || "CATEGORIA"}
                <SortIcon field="category" />
              </TableHead>
              <TableHead 
                className="w-[80px] text-left font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group whitespace-normal leading-tight"
                onClick={() => logic.handleSort("aplicacionesDiesel")}
              >
                {logic.tableHeaders?.inventory?.fuel || "TIPO DE COMBUSTIBLE"}
                <SortIcon field="aplicacionesDiesel" />
              </TableHead>
              <TableHead 
                className="w-[80px] text-center font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group whitespace-normal leading-tight"
                onClick={() => logic.handleSort("isNuevo")}
              >
                {logic.tableHeaders?.inventory?.new || "NUEVOS ITEMS"}
                <SortIcon field="isNuevo" />
              </TableHead>
              <TableHead 
                className="w-[50px] text-center font-bold text-primary text-[10px] uppercase tracking-tighter bg-primary/5 px-0.5 border-x border-primary/10 whitespace-normal leading-tight cursor-pointer hover:bg-primary/10 select-none group"
                onClick={() => logic.handleSort("ventasTotal")}
              >
                VENTAS 23 24 25
                <SortIcon field="ventasTotal" />
              </TableHead>
              <TableHead 
                className="w-[50px] text-center font-bold text-amber-600 text-[10px] uppercase tracking-tighter bg-amber-500/5 px-0.5 border-x border-amber-500/10 whitespace-normal leading-tight cursor-pointer hover:bg-amber-500/10 select-none group"
                onClick={() => logic.handleSort("ranking")}
              >
                RANKING 23 24 25
                <SortIcon field="ranking" />
              </TableHead>
              <TableHead
                className="w-[80px] text-right font-bold text-foreground text-[11px] uppercase tracking-wider px-3 cursor-pointer hover:bg-muted/50 select-none group whitespace-normal leading-tight"
                onClick={() => logic.handleSort("price")}
              >
                {logic.tableHeaders?.inventory?.price || "PRECIO FCA CÓRDOBA $"}
                <SortIcon field="price" />
              </TableHead>
              <TableHead
                className="w-[70px] text-center font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group"
                onClick={() => logic.handleSort("stock")}
              >
                {logic.tableHeaders?.inventory?.stock || "CANTIDAD"}
                <SortIcon field="stock" />
              </TableHead>
              <TableHead className="w-[70px] text-center font-bold text-foreground text-[11px] uppercase tracking-wider sticky right-0 bg-muted/95 backdrop-blur-md px-2">
                ACCIONES
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!logic.filteredProducts || logic.filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <ImageIcon className="w-16 h-16 text-muted-foreground/40" />
                    <div>
                      <p className="text-lg font-semibold text-muted-foreground mb-2">
                        {logic.products?.length > 0 
                          ? "No se encontraron productos con los filtros aplicados" 
                          : "No hay productos en el inventario"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {logic.products?.length > 0 && "Intenta ajustar los filtros o la búsqueda"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logic.filteredProducts.map((product: Product, index: number) => (
              <TableRow
                key={product.id}
                className="hover:bg-muted/30 transition-colors border-b border-border text-xs group"
              >
                <TableCell className="w-[30px] text-center font-bold text-foreground/60 px-1 bg-muted/20 tabular-nums">
                  {product.rowNumber || ((logic.currentPage - 1) * logic.itemsPerPage + index + 1)}
                </TableCell>
                <TableCell className="w-[80px] text-center p-2">
                  <ProductImageCarousel 
                    images={product.images || []} 
                    productName={product.descripcionManguera || product.name}
                  />
                </TableCell>
                <TableCell className="w-[100px] px-2 font-semibold text-primary break-all leading-tight">
                  {product.cauplas || "-"}
                </TableCell>
                <TableCell className="w-[60px] px-2 text-muted-foreground break-all leading-tight">
                  {product.torflex || "-"}
                </TableCell>
                <TableCell className="w-[60px] px-2 text-muted-foreground break-all leading-tight">
                  {product.indomax || "-"}
                </TableCell>
                <TableCell className="w-[60px] px-2 font-mono text-[10px] break-all leading-tight">
                  {product.oem || "-"}
                </TableCell>

                <TableCell className="w-[250px] px-3 leading-tight whitespace-normal wrap-break-word">
                  <span className="font-bold text-foreground text-[11px] leading-snug">
                    {product.descripcionManguera || product.name || product.aplicacion || "-"}
                  </span>
                </TableCell>
                <TableCell className="w-[90px] px-3 font-medium whitespace-normal wrap-break-word">
                  {product.category}
                </TableCell>
                <TableCell className="w-[80px] px-3 text-amber-700 font-medium whitespace-normal wrap-break-word">
                  {product.aplicacionesDiesel || "-"}
                </TableCell>

                <TableCell className="w-[80px] text-center px-2 font-semibold text-[10px] text-foreground/80">
                  {typeof product.isNuevo === 'string' ? product.isNuevo : (product.isNuevo ? 'NUEVO' : '-')}
                </TableCell>

                <TableCell className="w-[50px] text-center bg-primary/5 px-1 font-bold text-primary text-[10px]">
                  {getVentasTotal(product)}
                </TableCell>

                <TableCell className="w-[50px] text-center bg-amber-500/5 px-1 font-bold text-amber-600 text-[10px]">
                  {getRanking(product)}
                </TableCell>

                <TableCell className="w-[80px] text-right font-bold text-foreground px-3 tabular-nums">
                  {new Intl.NumberFormat("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(product.precioFCA || product.price || 0)}
                </TableCell>
                <TableCell className="w-[70px] text-center px-1">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-md font-bold text-[10px]",
                      product.stock <= product.minStock
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell className="w-[70px] text-center sticky right-0 bg-background/95 p-0">
                  <div className="flex items-center justify-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-primary"
                      onClick={() => {
                        logic.setAuditProduct(product);
                        logic.setIsAuditOpen(true);
                      }}
                    >
                      <History className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-amber-600"
                      onClick={() => {
                        logic.setSelectedProduct(product);
                        logic.setIsFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {logic.canManageInventory && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive/40 hover:text-destructive"
                        onClick={() => {
                          if (confirm(`¿Eliminar ${product.name}?`))
                            logic.deleteProduct(product.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>
      </div>
      
      {/* Controles de paginación inferiores */}
      {logic.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 backdrop-blur-xl bg-card/80 border border-border rounded-2xl p-4 shadow-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => logic.setCurrentPage(1)}
            disabled={logic.currentPage === 1}
            className="h-9 px-3 rounded-xl"
          >
            Primera
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logic.setCurrentPage(logic.currentPage - 1)}
            disabled={logic.currentPage === 1}
            className="h-9 px-3 rounded-xl"
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl">
            <span className="text-sm font-bold">
              {logic.currentPage} / {logic.totalPages}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => logic.setCurrentPage(logic.currentPage + 1)}
            disabled={logic.currentPage === logic.totalPages}
            className="h-9 px-3 rounded-xl"
          >
            Siguiente
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logic.setCurrentPage(logic.totalPages)}
            disabled={logic.currentPage === logic.totalPages}
            className="h-9 px-3 rounded-xl"
          >
            Última
          </Button>
        </div>
      )}
    </div>
  );
};
