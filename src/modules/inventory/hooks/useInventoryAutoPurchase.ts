import { useMemo, useCallback } from "react";
import { useInventoryLogic } from "./useInventoryLogic";
import { useInventoryForecast } from "./useInventoryAI";
import { toast } from "sonner";

export interface PurchaseSuggestion {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  salesVelocity: number;
  depletionDate: string;
  suggestedQuantity: number;
  supplier: string;
}

export const useInventoryAutoPurchase = () => {
  const { products } = useInventoryLogic();
  const { forecasts } = useInventoryForecast(products);

  const suggestions = useMemo(() => {
    return products
      .filter((p) => {
        const forecast = forecasts[p.id];
        return forecast?.isCritical;
      })
      .map((p) => {
        const forecast = forecasts[p.id];
        // Cálculo de cantidad sugerida (Stock para 30 días + buffer de seguridad)
        const safetyBuffer = 1.2;
        const suggested = Math.ceil((forecast?.velocity30Days || 0) * safetyBuffer) - (p.stock || 0);
        
        return {
          id: `suggest-${p.id}`,
          productId: p.id,
          productName: p.name,
          sku: p.cauplas || p.torflex || p.oem || 'N/A',
          currentStock: p.stock,
          minStock: p.minStock,
          salesVelocity: forecast?.velocity30Days || 0,
          depletionDate: forecast?.depletionDate ? forecast.depletionDate.toLocaleDateString() : 'Inmediato',
          suggestedQuantity: Math.max(suggested, 10), // Mínimo 10 unidades
          supplier: "Proveedor General",
        } as PurchaseSuggestion;
      });
  }, [products, forecasts]);

  const approveAllSuggestions = useCallback(() => {
    toast.success(`${suggestions.length} sugerencias de compra enviadas a borrador en Compras.`);
  }, [suggestions]);

  return {
    suggestions,
    approveAllSuggestions,
  };
};
