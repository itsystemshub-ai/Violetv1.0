import { useState, useCallback } from "react";
import { useAI } from "@/core/ai/hooks/useAI";
import { Product } from "@/lib";

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
