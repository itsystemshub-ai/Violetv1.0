import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  History,
  Pencil,
  ImageIcon,
  Brain,
  TrendingDown,
  Clock,
} from "lucide-react";
import { ProductImageCarousel } from "./ProductImageCarousel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { cn } from "@/core/shared/utils/utils";
import { ProductForm } from "@/shared/components/common/Forms";
import type { InventoryLogic, Product, SortField } from "@/types/inventory";
import { useImageConverter } from "@/shared/hooks/useImageConverter";

// Local ProductImageCarousel and ImagePreviewModal removed to use shared component

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
      const sum =
        (product.ventasHistory[2023] || 0) +
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

      if (ranking2025 != null && Number(ranking2025) > 0)
        return String(ranking2025);
      if (ranking2024 != null && Number(ranking2024) > 0)
        return String(ranking2024);
      if (ranking2023 != null && Number(ranking2023) > 0)
        return String(ranking2023);
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
  const endItem = Math.min(
    logic.currentPage * logic.itemsPerPage,
    logic.allFilteredProducts?.length || 0,
  );
  const totalItems = logic.allFilteredProducts?.length || 0;
  const isPhotosTab = logic.statusFilter === "photos";

  return (
    <div className="w-full space-y-4">
      {/* Información de paginación y controles */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl bg-card/80 border border-border rounded-2xl p-4 shadow-lg">
        <div className="text-sm text-muted-foreground">
          Mostrando{" "}
          <span className="font-bold text-foreground">{startItem}</span> a{" "}
          <span className="font-bold text-foreground">{endItem}</span> de{" "}
          <span className="font-bold text-foreground">{totalItems}</span>{" "}
          productos
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
                  {logic.tableHeaders?.inventory?.description ||
                    "DESCRIPCION DEL PRODUCTO"}
                  <SortIcon field="name" />
                </TableHead>
                <TableHead
                  className="w-[90px] text-left font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group"
                  onClick={() => logic.handleSort("category")}
                >
                  {logic.tableHeaders?.inventory?.category || "CATEGORIA"}
                  <SortIcon field="category" />
                </TableHead>
                {!isPhotosTab && (
                  <TableHead
                    className="w-[80px] text-left font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group whitespace-normal leading-tight"
                    onClick={() => logic.handleSort("aplicacionesDiesel")}
                  >
                    {logic.tableHeaders?.inventory?.fuel ||
                      "TIPO DE COMBUSTIBLE"}
                    <SortIcon field="aplicacionesDiesel" />
                  </TableHead>
                )}
                <TableHead
                  className="w-[80px] text-center font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group whitespace-normal leading-tight"
                  onClick={() => logic.handleSort("isNuevo")}
                >
                  {logic.tableHeaders?.inventory?.new || "NUEVOS ITEMS"}
                  <SortIcon field="isNuevo" />
                </TableHead>
                {!isPhotosTab && (
                  <>
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
                  </>
                )}
                {!isPhotosTab && (
                  <TableHead
                    className="w-[80px] text-right font-bold text-foreground text-[11px] uppercase tracking-wider px-3 cursor-pointer hover:bg-muted/50 select-none group whitespace-normal leading-tight"
                    onClick={() => logic.handleSort("price")}
                  >
                    {logic.tableHeaders?.inventory?.price ||
                      "PRECIO FCA CÓRDOBA $"}
                    <SortIcon field="price" />
                  </TableHead>
                )}
                {!isPhotosTab && (
                  <TableHead
                    className="w-[70px] text-center font-bold text-foreground text-[11px] uppercase tracking-wider px-2 cursor-pointer hover:bg-muted/50 select-none group"
                    onClick={() => logic.handleSort("stock")}
                  >
                    {logic.tableHeaders?.inventory?.stock || "CANTIDAD"}
                    <SortIcon field="stock" />
                  </TableHead>
                )}
                {!isPhotosTab && (
                  <>
                    <TableHead className="w-[60px] text-center font-bold text-cyan-600 dark:text-cyan-400 text-[11px] uppercase tracking-wider px-2 bg-cyan-500/5 border-x border-cyan-500/10">
                      <div className="flex items-center justify-center gap-1">
                        <Brain size={12} />
                        PREDICCIÓN IA
                      </div>
                    </TableHead>
                    <TableHead className="w-[70px] text-center font-bold text-foreground text-[11px] uppercase tracking-wider sticky right-0 bg-muted/95 backdrop-blur-md px-2">
                      ACCIONES
                    </TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!logic.filteredProducts ||
              logic.filteredProducts.length === 0 ? (
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
                          {logic.products?.length > 0 &&
                            "Intenta ajustar los filtros o la búsqueda"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logic.filteredProducts.map(
                  (product: Product, index: number) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-muted/30 transition-colors border-b border-border text-xs group"
                    >
                      <TableCell className="w-[30px] text-center font-bold text-foreground/60 px-1 bg-muted/20 tabular-nums">
                        {product.rowNumber ||
                          (logic.currentPage - 1) * logic.itemsPerPage +
                            index +
                            1}
                      </TableCell>
                      {/* AI Forecast Helper Variables */}
                      {(() => {
                        const forecast = (logic as any).forecasts?.[product.id];
                        const hasSales = forecast?.velocity30Days > 0;
                        const isCritical = forecast?.isCritical;

                        return (
                          <>
                            <TableCell className="w-[80px] text-center p-1">
                              <ProductImageCarousel
                                images={product.images || []}
                                productName={
                                  product.descripcionManguera || product.name
                                }
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
                                {product.descripcionManguera ||
                                  product.name ||
                                  product.aplicacion ||
                                  "-"}
                              </span>
                            </TableCell>
                            <TableCell className="w-[90px] px-3 font-medium whitespace-normal wrap-break-word">
                              {product.category}
                            </TableCell>
                            {!isPhotosTab && (
                              <TableCell className="w-[80px] px-3 text-amber-700 font-medium whitespace-normal wrap-break-word">
                                {product.aplicacionesDiesel || "-"}
                              </TableCell>
                            )}

                            <TableCell className="w-[80px] text-center px-2 font-semibold text-[10px] text-foreground/80">
                              {typeof product.isNuevo === "string"
                                ? product.isNuevo
                                : product.isNuevo
                                  ? "NUEVO"
                                  : "-"}
                            </TableCell>

                            {!isPhotosTab && (
                              <>
                                <TableCell className="w-[50px] text-center bg-primary/5 px-1 font-bold text-primary text-[10px]">
                                  {getVentasTotal(product)}
                                </TableCell>

                                <TableCell className="w-[50px] text-center bg-amber-500/5 px-1 font-bold text-amber-600 text-[10px]">
                                  {getRanking(product)}
                                </TableCell>
                              </>
                            )}

                            {!isPhotosTab && (
                              <TableCell className="w-[80px] text-right font-bold text-foreground px-3 tabular-nums">
                                {new Intl.NumberFormat("es-VE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(
                                  product.precioFCA || product.price || 0,
                                )}
                              </TableCell>
                            )}
                            {!isPhotosTab && (
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
                            )}
                            {!isPhotosTab && (
                              <>
                                <TableCell className="w-[60px] text-center bg-cyan-500/5 border-x border-cyan-500/10 px-2">
                                  {(() => {
                                    const forecast =
                                      logic.forecasts?.[product.id];
                                    if (!forecast) return "-";

                                    const days = forecast.daysUntilDepletion;
                                    const isCritical = forecast.isCritical;
                                    const hasSales =
                                      forecast.velocity30Days > 0;
                                    const suggestedQty =
                                      forecast.suggestedReorderQty || 0;

                                    if (product.stock === 0) {
                                      return (
                                        <div className="flex flex-col items-center gap-1">
                                          <span className="text-rose-500 font-bold text-[10px]">
                                            AGOTADO
                                          </span>
                                          {suggestedQty > 0 && (
                                            <div
                                              className="text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded-sm font-medium"
                                              title="Sugerencia de compra AI"
                                            >
                                              Comprar: {suggestedQty}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }

                                    if (!hasSales && suggestedQty === 0) {
                                      return (
                                        <span className="text-muted-foreground text-[9px]">
                                          Sin datos
                                        </span>
                                      );
                                    }

                                    return (
                                      <div className="flex flex-col gap-1 items-center">
                                        <div
                                          className={cn(
                                            "flex items-center gap-1 font-bold text-[10px]",
                                            isCritical
                                              ? "text-rose-600 animate-pulse"
                                              : "text-cyan-600",
                                          )}
                                        >
                                          <Clock size={10} />
                                          {days === Infinity
                                            ? "Sin fin"
                                            : days < 1
                                              ? "< 1 día"
                                              : `${Math.round(days)} días`}
                                        </div>
                                        <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                                          <TrendingDown size={9} />
                                          Venta: {forecast.velocity30Days}{" "}
                                          unid/m
                                        </div>
                                        {suggestedQty > 0 && (
                                          <div
                                            className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-sm font-medium mt-0.5"
                                            title="Sugerencia de compra AI (para 45 días)"
                                          >
                                            Sugerido: {suggestedQty} unid.
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
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
                                          if (
                                            confirm(
                                              `¿Eliminar ${product.name}?`,
                                            )
                                          )
                                            logic.deleteProduct(product.id);
                                        }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </TableRow>
                  ),
                )
              )}
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
