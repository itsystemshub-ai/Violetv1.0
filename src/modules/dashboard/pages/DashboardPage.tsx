/**
 * DashboardPage - Dashboard principal con datos REALES del sistema
 * Conecta con useSalesStore, useInventoryStore y localDb
 */

import React, { useEffect, useState, useMemo } from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import DashboardKPIs from "../components/Organisms/DashboardKPIs";
import DashboardMainContent from "../components/Organisms/DashboardMainContent";
import DashboardSidebar from "../components/Organisms/DashboardSidebar";
import { useSalesStore } from "@/modules/sales/hooks/useSalesStore";
import { useInventoryStore } from "@/modules/inventory/hooks/useInventoryStore";
import { useInventoryForecast } from "@/modules/inventory/hooks/useInventoryAI";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useTenant } from "@/shared/hooks/useTenant";
import { localDb } from "@/core/database/localDb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO, isAfter } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { invoices, fetchInvoices } = useSalesStore();
  const { products, fetchProducts } = useInventoryStore();

  const [accounts, setAccounts] = useState<any[]>([]);

  // Cargar datos reales al montar
  useEffect(() => {
    const tenantId = tenant?.id;
    if (!tenantId || tenantId === "none") return;

    fetchInvoices(tenantId);
    fetchProducts(tenantId);

    // Cargar cuentas financieras
    localDb.financial_accounts
      .where("tenant_id")
      .equals(tenantId)
      .toArray()
      .then((accs) => setAccounts(accs))
      .catch((err) => console.error("Error loading accounts:", err));
  }, [tenant?.id]);

  const [dateRange, setDateRange] = useState("all_time");

  // Filtro de Invoices basado en Date Range
  const filteredInvoices = useMemo(() => {
    if (dateRange === "all_time") return invoices;
    
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "hoy":
        startDate = startOfDay(now);
        break;
      case "esta_semana":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case "este_mes":
        startDate = startOfMonth(now);
        break;
      case "este_ano":
        startDate = startOfYear(now);
        break;
      default:
        return invoices;
    }

    return invoices.filter((inv) => {
      if (!inv.date) return false;
      const invDate = new Date(inv.date);
      return isAfter(invDate, startDate) || invDate.getTime() === startDate.getTime();
    });
  }, [invoices, dateRange]);

  // Calcular métricas REALES
  const realData = useMemo(() => {
    // VENTAS: suma de invoices tipo "venta" con status pagada/pendiente
    const salesInvoices = filteredInvoices.filter(
      (inv) => inv.type === "venta" && inv.status !== "anulada",
    );
    const totalSalesVolume = salesInvoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0,
    );

    // COMPRAS: suma de invoices tipo "compra"
    const purchaseInvoices = filteredInvoices.filter(
      (inv) => inv.type === "compra" && inv.status !== "anulada",
    );
    const totalPurchases = purchaseInvoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0,
    );

    // FINANZAS desde cuentas contables
    const totalAssets = accounts
      .filter((a) => a.type === "activo")
      .reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalLiabilities = accounts
      .filter((a) => a.type === "pasivo")
      .reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalRevenue = accounts
      .filter((a) => a.type === "ingreso")
      .reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalExpenses = accounts
      .filter((a) => a.type === "egreso")
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    // Cuentas por cobrar: facturas de venta pendientes
    const pendingReceivables = filteredInvoices
      .filter((inv) => inv.type === "venta" && inv.status === "pendiente")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Cuentas por pagar: facturas de compra pendientes
    const pendingPayables = filteredInvoices
      .filter((inv) => inv.type === "compra" && inv.status === "pendiente")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Margen: Si hay ventas, calcular margen real
    const margin =
      totalSalesVolume > 0
        ? ((totalSalesVolume - totalPurchases) / totalSalesVolume) * 100
        : 0;

    return {
      sales: {
        totalSalesVolume,
      },
      finance: {
        totalExpenses: totalPurchases || totalExpenses,
        margin: Math.max(0, margin),
        totalAssets: totalAssets || totalSalesVolume,
        pendingPayables,
        pendingReceivables,
      },
    };
  }, [filteredInvoices, accounts]);

  // Datos para gráficos basados en invoices reales (últimos 6 meses)

  const realCharts = useMemo(() => {
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const now = new Date();
    const chartData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = months[d.getMonth()];

      const ingresos = (invoices || [])
        .filter(
          (inv) =>
            inv.type === "venta" &&
            inv.status !== "anulada" &&
            inv.date?.startsWith(monthKey),
        )
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      const egresos = (invoices || [])
        .filter(
          (inv) =>
            inv.type === "compra" &&
            inv.status !== "anulada" &&
            inv.date?.startsWith(monthKey),
        )
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      chartData.push({ month: monthLabel, ingresos, egresos });
    }

    return { revenue: chartData };
  }, [invoices]);

  // Insights reales
  const realInsights = useMemo(() => {
    // Top 3 productos más vendidos (por nombre en facturas)
    const productSales: Record<string, number> = {};
    (filteredInvoices || [])
      .filter((inv) => inv.type === "venta" && inv.status !== "anulada")
      .forEach((inv) => {
        inv.items?.forEach((item) => {
          productSales[item.name] =
            (productSales[item.name] || 0) + (item.quantity || 0);
        });
      });
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, qty]) => ({
        label,
        value: `${qty} unidades`,
        status: "success",
      }));

    // Finanzas reales
    const totalSales = realData.sales.totalSalesVolume;
    const totalExp = realData.finance.totalExpenses;
    const netProfit = totalSales - totalExp;

    const finance = [
      {
        label: "Ingresos Totales",
        value: `$${totalSales.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`,
        status: "success",
      },
      {
        label: "Gastos/Compras",
        value: `$${totalExp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`,
        status: totalExp > totalSales ? "danger" : "warning",
      },
      {
        label: "Utilidad Neta",
        value: `$${netProfit.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`,
        status: netProfit >= 0 ? "success" : "danger",
      },
    ];

    // Inventario bajo stock
    const lowStock = (products || [])
      .filter((p) => p.stock <= p.minStock && p.stock > 0)
      .slice(0, 3)
      .map((p) => ({
        label: p.name,
        value: `${p.stock} unidades`,
        status: p.stock <= 5 ? "danger" : "warning",
      }));

    // RRHH placeholder
    const hr = [
      { label: "Datos del ERP", value: "En vivo", status: "success" },
      {
        label: "Productos Registrados",
        value: `${products.length}`,
        status: "success",
      },
      {
        label: "Facturas Totales",
        value: `${filteredInvoices.length}`,
        status: "success",
      },
    ];

    return {
      sales:
        topProducts.length > 0
          ? topProducts
          : [
              {
                label: "Sin ventas registradas",
                value: "0",
                status: "warning",
              },
            ],
      finance,
      inventory:
        lowStock.length > 0
          ? lowStock
          : [
              {
                label: "Inventario OK",
                value: "Sin alertas",
                status: "success",
              },
            ],
      hr: [], // Changed to empty array as per instruction
    };
  }, [filteredInvoices, products, realData]);

  // AI Forecasts
  const { suggestedPurchases } = useInventoryForecast(products);

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const pendingOrders = filteredInvoices.filter(
    (inv) => inv.type === "venta" && inv.status === "pendiente",
  ).length;

  if (!user) return null;

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header */}
          <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Panel de control con métricas operativas en tiempo real
              </p>
            </div>
            
            {/* Global Date Filter */}
            <div className="flex items-center gap-3 bg-card p-2 rounded-2xl shadow-sm border border-border/50">
              <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap px-2">
                Periodo:
              </span>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[160px] border-none bg-muted/50 focus:ring-0 font-bold rounded-xl h-10">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="hoy" className="rounded-lg font-medium cursor-pointer">Hoy</SelectItem>
                  <SelectItem value="esta_semana" className="rounded-lg font-medium cursor-pointer">Esta Semana</SelectItem>
                  <SelectItem value="este_mes" className="rounded-lg font-medium cursor-pointer">Este Mes</SelectItem>
                  <SelectItem value="este_ano" className="rounded-lg font-medium cursor-pointer">Este Año</SelectItem>
                  <SelectItem value="all_time" className="rounded-lg font-medium cursor-pointer">Histórico (Todo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KPIs con datos REALES */}
          <DashboardKPIs data={realData} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - gráficos y insights reales */}
            <DashboardMainContent
              charts={realCharts}
              insights={realInsights}
              suggestedPurchases={suggestedPurchases}
            />

            {/* Sidebar */}
            <DashboardSidebar
              lowStockCount={lowStockCount}
              weather={{ temp: 28, condition: "Soleado", icon: "☀️" }}
              pendingOrders={pendingOrders}
            />
          </div>
        </div>
      </div>
    </ValeryLayout>
  );
}
