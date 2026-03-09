import { localDb } from "./localDb";
import { Product } from "./index";

export interface ForecastResult {
  productId: string;
  dailyVelocity: number; // Avg units sold per day
  estimatedStockOutDate: string | null;
  recommendation: "normal" | "buy_soon" | "urgent" | "none";
}

export const ForecastingService = {
  /**
   * Calculates sales velocity and predicts stock-out for a specific product
   */
  async getForecastForProduct(product: Product, tenantId: string): Promise<ForecastResult> {
    const historicalInvoices = await localDb.invoices
      .where("tenant_id")
      .equals(tenantId)
      .and(inv => inv.type === "venta" && inv.status === "pagada")
      .toArray();

    // Sum quantities sold of this specific product (Recent Invoices - Last 30 days)
    let totalSoldInvoice = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    historicalInvoices.forEach(inv => {
      const invDate = new Date(inv.date);
      if (invDate >= thirtyDaysAgo) {
        inv.items.forEach(item => {
          if (item.productId === product.id) {
            totalSoldInvoice += item.quantity;
          }
        });
      }
    });

    let dailyVelocity = totalSoldInvoice / 30;

    // Use 3-year historical average (2023, 2024, 2025) as a stable baseline or fallback
    // This provides a more accurate projection for products with seasonal or long-term trends
    const h23 = product.ventasHistory?.[2023] || 0;
    const h24 = product.ventasHistory?.[2024] || 0;
    const h25 = product.ventasHistory?.[2025] || 0;
    
    const totalHistoricalSales = h23 + h24 + h25;
    
    if (totalHistoricalSales > 0) {
      // Calculation based on "12 months each year" for 3 years
      const startOf2023 = new Date(2023, 0, 1);
      const totalDays = Math.max(1, Math.floor((now.getTime() - startOf2023.getTime()) / (1000 * 60 * 60 * 24)));
      const historicalDailyVelocity = totalHistoricalSales / totalDays;
      
      // If system has very little recent invoice data, prioritize the long-term average
      if (totalSoldInvoice < 5) {
         dailyVelocity = historicalDailyVelocity;
      } else {
         // Weighted average: 70% recent trend, 30% long-term historical average
         dailyVelocity = (dailyVelocity * 0.7) + (historicalDailyVelocity * 0.3);
      }
    }

    let estimatedStockOutDate = null;
    let recommendation: ForecastResult["recommendation"] = "none";

    if (dailyVelocity > 0) {
      const daysRemaining = (product.stock || 0) / dailyVelocity;
      const stockOutDate = new Date(now.getTime() + (daysRemaining * 24 * 60 * 60 * 1000));
      estimatedStockOutDate = stockOutDate.toISOString();

      if (daysRemaining <= 7) recommendation = "urgent";
      else if (daysRemaining <= 15) recommendation = "buy_soon";
      else recommendation = "normal";
    }

    return {
      productId: product.id,
      dailyVelocity,
      estimatedStockOutDate,
      recommendation
    };
  },

  /**
   * Generates reorder recommendations for all products in a tenant
   */
  async getAllRecommendations(products: Product[], tenantId: string): Promise<ForecastResult[]> {
    const results = await Promise.all(
      products.map(p => this.getForecastForProduct(p, tenantId))
    );
    return results.sort((a, b) => {
      if (!a.estimatedStockOutDate) return 1;
      if (!b.estimatedStockOutDate) return -1;
      return new Date(a.estimatedStockOutDate).getTime() - new Date(b.estimatedStockOutDate).getTime();
    });
  }
};
