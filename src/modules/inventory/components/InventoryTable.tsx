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
import { InventoryTableRow } from "./InventoryTableRow";
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
                    <InventoryTableRow
                      key={product.id}
                      product={product}
                      index={index}
                      logic={logic}
                      isPhotosTab={isPhotosTab}
                    />
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
