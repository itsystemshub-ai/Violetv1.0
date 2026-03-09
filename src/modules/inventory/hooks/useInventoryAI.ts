import { useState, useCallback, useMemo } from "react";
import { useAI } from "@/core/ai/hooks/useAI";
import { Product } from "@/lib";
import { useSalesStore } from "@/modules/sales/hooks/useSalesStore";
import { subDays, isAfter } from "date-fns";

export interface ForecastResult {
  velocity30Days: number;     // Unidades vendidas últimos 30 días
  dailyVelocity: number;      // Promedio de ventas diarias
  daysUntilDepletion: number; // Días estimados hasta stock 0
  depletionDate: Date | null; // Fecha estimada de agotamiento
  isCritical: boolean;        // Se agotará en < 7 días
  suggestedReorderQty: number;// Sugerencia de cuántas unidades comprar (para 45 días)
}

/**
 * Hook de IA para Inventario
 * Proporciona análisis inteligente, predicciones y optimizaciones
 */
export const useInventoryAI = () => {
  const { askViolet, analyzeNaturalLanguage, isLoading, error } = useAI();
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  /**
   * Analiza el inventario completo y proporciona insights
   */
  const analyzeInventory = useCallback(async (products: Product[]) => {
    if (!products || products.length === 0) {
      return "No hay productos para analizar.";
    }

    // Preparar contexto del inventario usando precioFCA
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.stock * (p.precioFCA || p.price || 0)), 0);
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);
    const outOfStockProducts = products.filter(p => p.stock === 0);
    const topCategories = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const context = `
Inventario actual:
- Total de productos: ${totalProducts}
- Valor total del inventario (Precio FCA Córdoba): $${totalValue.toLocaleString()}
- Productos con stock bajo: ${lowStockProducts.length}
- Productos agotados: ${outOfStockProducts.length}
- Categorías principales: ${Object.entries(topCategories).slice(0, 5).map(([cat, count]) => `${cat} (${count})`).join(", ")}
    `;

    const prompt = `
Analiza este inventario y proporciona:
1. Estado general del inventario (saludable, crítico, óptimo)
2. Productos que requieren atención inmediata
3. Recomendaciones para optimizar el stock
4. Oportunidades de mejora en la gestión

Sé específico y práctico. Responde en español con formato claro.
    `;

    const result = await analyzeNaturalLanguage(prompt, context);
    setAiInsights(result);
    return result;
  }, [analyzeNaturalLanguage]);

  /**
   * Sugiere cantidad óptima de reorden para un producto
   */
  const suggestReorderQuantity = useCallback(async (product: Product) => {
    const context = `
Producto: ${product.name}
Stock actual: ${product.stock}
Stock mínimo: ${product.minStock}
Precio FCA Córdoba: $${product.precioFCA || product.price || 0}
Categoría: ${product.category}
    `;

    const prompt = `
Basándote en estos datos, sugiere:
1. Cantidad óptima de reorden
2. Punto de reorden recomendado
3. Justificación de la recomendación

Considera factores como rotación, estacionalidad y costos de almacenamiento.
Responde en formato conciso y práctico.
    `;

    return await analyzeNaturalLanguage(prompt, context);
  }, [analyzeNaturalLanguage]);

  /**
   * Detecta anomalías en el inventario
   */
  const detectAnomalies = useCallback(async (products: Product[]) => {
    // Identificar productos con patrones inusuales
    const anomalies = products.filter(p => {
      const stockRatio = p.stock / (p.minStock || 1);
      const hasNoMovement = !p.ventasHistory || Object.values(p.ventasHistory).every(v => v === 0);
      const precioFCA = p.precioFCA || p.price || 0;
      const highValue = p.stock * precioFCA > 100000;
      
      return stockRatio > 10 || (hasNoMovement && highValue) || p.stock < 0;
    });

    if (anomalies.length === 0) {
      return "✅ No se detectaron anomalías en el inventario.";
    }

    const context = `
Productos con posibles anomalías detectadas: ${anomalies.length}

Ejemplos:
${anomalies.slice(0, 5).map(p => {
  const precioFCA = p.precioFCA || p.price || 0;
  return `- ${p.name}: Stock ${p.stock}, Valor FCA $${(p.stock * precioFCA).toLocaleString()}`;
}).join("\n")}
    `;

    const prompt = `
Analiza estas anomalías detectadas en el inventario:
1. ¿Son realmente problemáticas?
2. ¿Qué acciones correctivas recomiendas?
3. ¿Hay patrones que indiquen problemas sistémicos?

Sé específico y prioriza por urgencia.
    `;

    return await analyzeNaturalLanguage(prompt, context);
  }, [analyzeNaturalLanguage]);

  /**
   * Optimiza la categorización de productos
   */
  const optimizeCategories = useCallback(async (products: Product[]) => {
    const categories = products.reduce((acc, p) => {
      if (!acc[p.category]) {
        acc[p.category] = [];
      }
      acc[p.category].push(p.name);
      return acc;
    }, {} as Record<string, string[]>);

    const context = `
Categorías actuales y productos:
${Object.entries(categories).slice(0, 10).map(([cat, prods]) => `
${cat}: ${prods.length} productos
Ejemplos: ${prods.slice(0, 3).join(", ")}
`).join("")}
    `;

    const prompt = `
Analiza esta estructura de categorías y sugiere:
1. ¿Las categorías están bien organizadas?
2. ¿Hay productos mal categorizados?
3. ¿Deberían crearse nuevas categorías o fusionar existentes?
4. Propuesta de estructura optimizada

Enfócate en mejorar la búsqueda y gestión del inventario.
    `;

    return await analyzeNaturalLanguage(prompt, context);
  }, [analyzeNaturalLanguage]);

  /**
   * Genera descripción inteligente para un producto
   */
  const generateProductDescription = useCallback(async (productData: Partial<Product>) => {
    const context = `
Datos del producto:
- Código CAUPLAS: ${productData.cauplas || "N/A"}
- Código TORFLEX: ${productData.torflex || "N/A"}
- Código OEM: ${productData.oem || "N/A"}
- Categoría: ${productData.category || "N/A"}
- Aplicación: ${productData.aplicacion || "N/A"}
    `;

    const prompt = `
Genera una descripción profesional y técnica para este producto de mangueras automotrices.
La descripción debe:
1. Ser clara y técnica
2. Incluir aplicaciones principales
3. Mencionar compatibilidades si es relevante
4. Ser concisa (máximo 2-3 líneas)

Responde solo con la descripción, sin texto adicional.
    `;

    return await askViolet(prompt, context);
  }, [askViolet]);

  /**
   * Responde preguntas sobre el inventario en lenguaje natural
   */
  const askAboutInventory = useCallback(async (question: string, products: Product[]) => {
    const totalValue = products.reduce((sum, p) => sum + (p.stock * (p.precioFCA || p.price || 0)), 0);
    
    const context = `
Inventario disponible: ${products.length} productos
Valor total (Precio FCA Córdoba): $${totalValue.toLocaleString()}
Categorías: ${[...new Set(products.map(p => p.category))].join(", ")}
    `;

    return await askViolet(question, context);
  }, [askViolet]);

  /**
   * Analiza tendencias de ventas y sugiere acciones
   */
  const analyzeSalesTrends = useCallback(async (products: Product[]) => {
    const productsWithSales = products.filter(p => p.ventasHistory && Object.values(p.ventasHistory).some(v => v > 0));
    
    if (productsWithSales.length === 0) {
      return "No hay datos de ventas suficientes para analizar tendencias.";
    }

    const topSellers = productsWithSales
      .sort((a, b) => {
        const salesA = Object.values(a.ventasHistory || {}).reduce((sum, v) => sum + v, 0);
        const salesB = Object.values(b.ventasHistory || {}).reduce((sum, v) => sum + v, 0);
        return salesB - salesA;
      })
      .slice(0, 10);

    const context = `
Top 10 productos más vendidos:
${topSellers.map((p, i) => {
  const totalSales = Object.values(p.ventasHistory || {}).reduce((sum, v) => sum + v, 0);
  return `${i + 1}. ${p.name} - ${totalSales} unidades vendidas`;
}).join("\n")}

Datos por año disponibles: 2023, 2024, 2025
    `;

    const prompt = `
Analiza estas tendencias de ventas y proporciona:
1. Productos estrella que deben mantenerse siempre en stock
2. Tendencias de crecimiento o decrecimiento
3. Recomendaciones de compra para el próximo período
4. Productos que podrían estar en declive

Sé específico y orientado a la acción.
    `;

    return await analyzeNaturalLanguage(prompt, context);
  }, [analyzeNaturalLanguage]);

  return {
    // Estados
    isLoading,
    error,
    aiInsights,
    
    // Funciones de análisis
    analyzeInventory,
    suggestReorderQuantity,
    detectAnomalies,
    optimizeCategories,
    generateProductDescription,
    askAboutInventory,
    analyzeSalesTrends,
  };
};

/**
 * Hook para proyecciones matemáticas y de velocidad de ventas
 * Calcula fechas de agotamiento basadas en los últimos 30 días de Invoices.
 */
export const useInventoryForecast = (products: Product[]) => {
  const { invoices } = useSalesStore();

  const forecasts = useMemo(() => {
    const result: Record<string, ForecastResult> = {};
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    // Filtrar facturas válidas de los últimos 30 días
    const recentSales = (invoices || []).filter((inv) => {
      if (inv.type !== "venta" || inv.status === "anulada" || !inv.date) return false;
      return isAfter(new Date(inv.date), thirtyDaysAgo);
    });

    // Crear mapa de búsqueda rápida de productos por nombre e ID
    const productLookup = new Map<string, Product>();
    (products || []).forEach(p => {
      productLookup.set(p.id, p);
      if (p.name) productLookup.set(p.name, p);
    });

    // Crear mapa de unidades vendidas por producto en los últimos 30 días
    const unitsSold30d: Record<string, number> = {};
    
    (recentSales || []).forEach((invoice) => {
      invoice.items?.forEach((item) => {
        const productData = item.productId ? productLookup.get(item.productId) : (item.name ? productLookup.get(item.name) : null);
        if (productData) {
          unitsSold30d[productData.id] = (unitsSold30d[productData.id] || 0) + (item.quantity || 0);
        }
      });
    });

    // Calcular proyecciones para todos los productos proporcionados
    (products || []).forEach((product) => {
      const sold30d = unitsSold30d[product.id] || 0;
      const dailyVelocity = sold30d / 30; // promedio diario
      
      const currentStock = product.stock || 0;
      let daysUntilDepletion = Infinity;
      let depletionDate: Date | null = null;
      let isCritical = false;
      let suggestedReorderQty = 0;

      if (dailyVelocity > 0) {
        daysUntilDepletion = currentStock / dailyVelocity;
        
        // Cobertura deseada: 45 días (1.5 meses). Sugerencia: (velocidad diaria * 45) - stock actual
        suggestedReorderQty = Math.max(0, Math.ceil((dailyVelocity * 45) - currentStock));

        // Limitar a un máximo razonable (ej. 5 años) para evitar desbordamiento de fecha
        if (daysUntilDepletion < 1825) { 
          depletionDate = new Date(now.getTime() + daysUntilDepletion * 24 * 60 * 60 * 1000);
          isCritical = currentStock <= (product.minStock || 0) || daysUntilDepletion <= 7;
        }
      } else if (currentStock <= (product.minStock || 0) && currentStock > 0) {
        isCritical = true; // Crítico si está en stock mínimo incluso sin ventas recientes
        suggestedReorderQty = Math.max(0, (product.minStock || 5) * 2 - currentStock); // Sugerir el doble del mínimo
      } else if (currentStock === 0) {
        daysUntilDepletion = 0;
        depletionDate = now;
        isCritical = true;
        suggestedReorderQty = Math.max(5, (product.minStock || 5) * 2); // Base mínima si está agotado
      }

      result[product.id] = {
        velocity30Days: sold30d,
        dailyVelocity,
        daysUntilDepletion,
        depletionDate,
        isCritical,
        suggestedReorderQty,
      };
    });

    return result;
  }, [invoices, products]);

  /**
   * Devuelve un array ordenado de productos críticos que necesitan reabastecimiento
   */
  const suggestedPurchases = useMemo(() => {
    return (products || [])
      .filter((p) => forecasts[p.id]?.isCritical)
      .sort((a, b) => {
        const da = forecasts[a.id]?.daysUntilDepletion || 0;
        const db = forecasts[b.id]?.daysUntilDepletion || 0;
        return da - db; // ordenar por el más urgente
      });
  }, [products, forecasts]);

  return { 
    forecasts,
    suggestedPurchases 
  };
};
