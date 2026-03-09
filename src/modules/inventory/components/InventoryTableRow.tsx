import React from "react";
import { History, Pencil, Trash2, Clock, TrendingDown } from "lucide-react";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/core/shared/utils/utils";
import { ProductImageCarousel } from "./ProductImageCarousel";
import type { InventoryLogic, Product } from "@/types/inventory";

interface InventoryTableRowProps {
  product: Product;
  index: number;
  logic: InventoryLogic;
  isPhotosTab: boolean;
}

// Helper functions moved from InventoryTable
const getVentasTotal = (product: Product): number => {
  if (product.historial != null && Number(product.historial) > 0) {
    return Number(product.historial);
  }
  if (product.ventasHistory) {
    const sum =
      (product.ventasHistory[2023] || 0) +
      (product.ventasHistory[2024] || 0) +
      (product.ventasHistory[2025] || 0);
    if (sum > 0) return sum;
  }
  return 0;
};

const getRanking = (product: Product): string => {
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

export const InventoryTableRow = React.memo(
  ({ product, index, logic, isPhotosTab }: InventoryTableRowProps) => {
    const forecast = (logic as any).forecasts?.[product.id];
    const suggestedQty = forecast?.suggestedReorderQty || 0;
    const days = forecast?.daysUntilDepletion;
    const isCritical = forecast?.isCritical;
    const hasSales = forecast?.velocity30Days > 0;

    return (
      <TableRow className="hover:bg-muted/30 transition-colors border-b border-border text-xs group">
        <TableCell className="w-[30px] text-center font-bold text-foreground/60 px-1 bg-muted/20 tabular-nums">
          {product.rowNumber ||
            (logic.currentPage - 1) * logic.itemsPerPage + index + 1}
        </TableCell>

        <TableCell className="w-[80px] text-center p-1">
          <ProductImageCarousel
            images={product.images || []}
            productName={product.descripcionManguera || product.name || ""}
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
            }).format(product.precioFCA || product.price || 0)}
          </TableCell>
        )}

        {!isPhotosTab && (
          <TableCell className="w-[70px] text-center px-1">
            <span
              className={cn(
                "px-2 py-1 rounded-md font-bold text-[10px]",
                product.stock <= (product.minStock || 0)
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
              {product.stock === 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-rose-500 font-bold text-[10px]">
                    AGOTADO
                  </span>
                  {suggestedQty > 0 && (
                    <div className="text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded-sm font-medium">
                      Comprar: {suggestedQty}
                    </div>
                  )}
                </div>
              ) : !forecast || (!hasSales && suggestedQty === 0) ? (
                <span className="text-muted-foreground text-[9px]">
                  Sin datos
                </span>
              ) : (
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
                    Venta: {forecast.velocity30Days} unid/m
                  </div>
                  {suggestedQty > 0 && (
                    <div className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-sm font-medium mt-0.5">
                      Sugerido: {suggestedQty} unid.
                    </div>
                  )}
                </div>
              )}
            </TableCell>
            <TableCell className="w-[70px] text-center sticky right-0 bg-background/95 p-0 group-hover:bg-muted/50 transition-colors">
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
                        confirm(`¿Eliminar ${product.name || product.cauplas}?`)
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
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to optimize re-renders
    // We only re-render if the product data, forecast, or relevant logic state changes
    return (
      prevProps.product === nextProps.product &&
      prevProps.isPhotosTab === nextProps.isPhotosTab &&
      (prevProps.logic as any).forecasts?.[prevProps.product.id] ===
        (nextProps.logic as any).forecasts?.[nextProps.product.id] &&
      prevProps.logic.currentPage === nextProps.logic.currentPage &&
      prevProps.logic.itemsPerPage === nextProps.logic.itemsPerPage
    );
  },
);

InventoryTableRow.displayName = "InventoryTableRow";
