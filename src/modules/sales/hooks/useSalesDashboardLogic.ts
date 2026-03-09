import { useState, useEffect, useMemo } from "react";
import { localDb } from "@/core/database/localDb";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { subMonths } from "date-fns";

export interface SalesDashboardStats {
  totalSales: number;
  totalQuantity: number;
  pendingAmount: number;
  ticketPromedio: number;
  revenueByPeriod: { name: string; value: number }[];
  topSellers: { name: string; amount: number; percentage: number }[];
  topCategories: { name: string; value: number }[];
}

export const useSalesDashboardLogic = () => {
  const { activeTenantId } = useSystemConfig();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!activeTenantId) return;
      setLoading(true);
      try {
        const [allDocs, allProducts, allSellers] = await Promise.all([
          localDb.invoices.where("tenant_id").equals(activeTenantId).toArray(),
          localDb.products.where("tenant_id").equals(activeTenantId).toArray(),
          localDb.sellers.where("tenant_id").equals(activeTenantId).toArray(),
        ]);

        setInvoices(allDocs.filter((d) => d.type === "venta"));
        setProducts(allProducts);
        setSellers(allSellers);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeTenantId]);

  const stats = useMemo((): SalesDashboardStats => {
    let totalSales = 0;
    let totalQuantity = 0;
    let pendingAmount = 0;
    
    // Revenue by period (last 6 months)
    const revenueMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const name = d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
      revenueMap.set(name, 0);
    }

    // Top Sellers map
    const sellersMap = new Map<string, number>();

    // Category Sales Map
    const categoryMap = new Map<string, number>();

    invoices.forEach((inv) => {
      const amount = Number(inv.total) || 0;
      
      // Totals
      if (inv.status === "pagada" || inv.status === "completada" || inv.status === "aprobado" || inv.status === "procesado") {
        totalSales += amount;
      } else if (inv.status === "pendiente" || inv.status === "por_cobrar") {
        pendingAmount += amount;
      }

      // Quantity & Categories
      (inv.items || []).forEach((item: any) => {
        totalQuantity += Number(item.quantity) || 0;
        
        // Find product category
        const prod = products.find(p => p.id === item.product_id);
        const cat = prod?.category || "Otros";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + (amount * (item.quantity / (inv.items.reduce((s:number, i:any) => s + i.quantity, 0) || 1))));
      });

      // Period Revenue
      const invDate = new Date(inv.date || inv.created_at);
      const monthName = invDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
      if (revenueMap.has(monthName)) {
        if (inv.status === "pagada" || inv.status === "completada" || inv.status === "aprobado" || inv.status === "procesado") {
          revenueMap.set(monthName, (revenueMap.get(monthName) || 0) + amount);
        }
      }

      // Sellers
      const sellerId = inv.seller_id || "Sin Asignar";
      sellersMap.set(sellerId, (sellersMap.get(sellerId) || 0) + amount);
    });

    // Formatting Maps to Arrays
    const revenueByPeriod = Array.from(revenueMap.entries()).map(([name, value]) => ({ name, value }));
    
    // Process top sellers with real names
    let sortedSellers = Array.from(sellersMap.entries())
      .map(([id, amount]) => {
        const seller = sellers.find(s => s.id === id);
        return { 
          name: seller ? seller.name : (id === "Sin Asignar" ? "Sin Asignar" : id.substring(0,8)), 
          amount, 
          percentage: totalSales > 0 ? (amount / totalSales) * 100 : 0 
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalSales,
      totalQuantity,
      pendingAmount,
      ticketPromedio: invoices.length > 0 ? totalSales / (invoices.filter(i => i.status !== 'anulada').length || 1) : 0,
      revenueByPeriod,
      topSellers: sortedSellers,
      topCategories
    };
  }, [invoices, products, sellers]);

  return {
    loading,
    stats,
  };
};
