/**
 * DashboardPage - Dashboard principal con datos REALES del sistema
 * Conecta con useSalesStore, useInventoryStore y localDb
 */

import React, { useEffect, useState, useMemo } from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import DashboardKPIs from "../components/organisms/DashboardKPIs";
import DashboardMainContent from "../components/organisms/DashboardMainContent";
import DashboardSidebar from "../components/organisms/DashboardSidebar";
import { useSalesStore } from "@/modules/sales/hooks/useSalesStore";
import { useInventoryStore } from "@/modules/inventory/hooks/useInventoryStore";
import { useInventoryForecast } from "@/modules/inventory/hooks/useInventoryAI";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useTenant } from "@/shared/hooks/useTenant";
import { localDb } from "@/core/database/localDb";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { DateRange } from "@/core/services/DataAggregationService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { PremiumHUD } from "@/shared/components/stitch/PremiumHUD";
import { automationHub } from "@/core/infrastructure/automation/AutomationHub";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  parseISO,
  isAfter,
} from "date-fns";

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

    // Notificar a n8n sobre el acceso al dashboard (Advanced Monitoring)
    automationHub.trigger("/events/dashboard-access", {
      userId: user.id,
      tenantId,
      action: "view_dashboard",
    });

    // Cargar cuentas financieras
    localDb.financial_accounts
      .where("tenant_id")
      .equals(tenantId)
      .toArray()
      .then((accs) => setAccounts(accs))
      .catch((err) => console.error("Error loading accounts:", err));
  }, [tenant?.id, user?.id]);

  const [dateRange, setDateRange] = useState<DateRange>("all_time");
  const { stats, isLoading: isStatsLoading } = useDashboardStats(
    tenant?.id || "",
    dateRange,
  );

  // Filtro de Invoices basado en Date Range (para gráficos locales por ahora)
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
      return (
        isAfter(invDate, startDate) || invDate.getTime() === startDate.getTime()
      );
    });
  }, [invoices, dateRange]);

  const [weather, setWeather] = useState({
    temp: "24°C",
    condition: "Despejado",
  });

  useEffect(() => {
    if (!navigator.onLine) return;
    fetch(
      "https://wttr.in?format=%7B%22t%22%3A%22%25t%22%2C%22c%22%3A%22%25C%22%7D",
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.t) {
          setWeather({
            temp: data.t.replace("+", ""),
            condition: data.c,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Adaptar stats a la interfaz esperada por los componentes
  const realData = useMemo(() => {
    if (!stats) return null;
    return {
      sales: {
        totalSalesVolume: stats.sales.totalVolume,
      },
      finance: {
        totalExpenses: stats.purchases.totalVolume,
        margin: stats.finance.margin,
        totalAssets: stats.finance.totalAssets,
        pendingPayables: stats.finance.pendingPayables,
        pendingReceivables: stats.finance.pendingReceivables,
      },
    };
  }, [stats]);

  // Insights combinados reales
  const realInsights = useMemo(() => {
    if (!stats) return { sales: [], finance: [], inventory: [], hr: [] };

    // Top 3 productos (localmente de facturas)
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

    return {
      sales:
        topProducts.length > 0
          ? topProducts
          : [{ label: "Sin ventas", value: "0", status: "warning" }],
      finance: [
        {
          label: "Utilidad Neta",
          value: `$${stats.finance.netWorth.toLocaleString()}`,
          status: stats.finance.netWorth >= 0 ? "success" : "danger",
        },
        {
          label: "Margen Bruto",
          value: `${stats.finance.margin.toFixed(1)}%`,
          status: "success",
        },
        {
          label: "Cuentas x Cobrar",
          value: `$${stats.finance.pendingReceivables.toLocaleString()}`,
          status: "warning",
        },
      ],
      inventory: [
        {
          label: "Stock Crítico",
          value: `${stats.inventory.lowStockCount} items`,
          status: stats.inventory.lowStockCount > 0 ? "danger" : "success",
        },
        {
          label: "Total Catálogo",
          value: `${stats.inventory.totalProducts} ref`,
          status: "success",
        },
      ],
      hr: [
        {
          label: "Nómina Activa",
          value: `${stats.hr.activeEmployees} pers.`,
          status: "success",
        },
        {
          label: "Atención CRM",
          value: `${stats.crm.totalChats} chats`,
          status: "success",
        },
        {
          label: "Chats Pendientes",
          value: `${stats.crm.unreadChats}`,
          status: stats.crm.unreadChats > 0 ? "danger" : "success",
        },
      ],
    };
  }, [stats, filteredInvoices]);

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

  // AI Forecasts
  const { suggestedPurchases } = useInventoryForecast(products);

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const pendingOrders = filteredInvoices.filter(
    (inv) => inv.type === "venta" && inv.status === "pendiente",
  ).length;

  if (!user) return null;

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <PremiumHUD>
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
                    <SelectItem
                      value="hoy"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Hoy
                    </SelectItem>
                    <SelectItem
                      value="esta_semana"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Esta Semana
                    </SelectItem>
                    <SelectItem
                      value="este_mes"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Este Mes
                    </SelectItem>
                    <SelectItem
                      value="este_ano"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Este Año
                    </SelectItem>
                    <SelectItem
                      value="all_time"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Histórico (Todo)
                    </SelectItem>
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
                weather={{
                  temp: parseInt(weather.temp) || 24,
                  condition: weather.condition,
                  icon: "🌤️",
                }}
                pendingOrders={pendingOrders}
              />
            </div>
          </div>
        </div>
      </PremiumHUD>
    </ValeryLayout>
  );
}
