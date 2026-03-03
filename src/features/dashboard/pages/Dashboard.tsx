import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { localDb } from "@/lib/localDb";
import { getCaraboboWeather } from "@/lib/weatherService";
import { fetchBCVRate } from "@/lib/bcvService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { springPresets } from "@/lib/motion";
import { AIChat } from "@/core/ai/components/AIChat";
import { ModuleAIAssistant } from "@/core/ai/components";
import { formatDate } from "@/lib";

// Lazy-loaded Organisms
const QuickAccessModules = lazy(
  () => import("@/components/Dashboard/Organisms/QuickAccessModules"),
);
const DashboardHeader = lazy(
  () => import("@/components/Dashboard/Organisms/DashboardHeader"),
);
const DashboardKPIs = lazy(
  () => import("@/components/Dashboard/Organisms/DashboardKPIs"),
);
const DashboardMainContent = lazy(
  () => import("@/components/Dashboard/Organisms/DashboardMainContent"),
);
const DashboardSidebar = lazy(
  () => import("@/components/Dashboard/Organisms/DashboardSidebar"),
);
const StockAlerts = lazy(
  () => import("@/components/Dashboard/StockAlerts").then(m => ({ default: m.StockAlerts })),
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12 w-full h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

interface DashboardData {
  finance: {
    totalAssets: number;
    totalExpenses: number;
    margin: number;
    pendingReceivables: number;
    pendingPayables: number;
  };
  sales: {
    totalSalesVolume: number;
  };
  inventory: {
    lowStockCount: number;
  };
  charts: {
    revenue: Array<{ month: string; value: number }>;
  };
}

interface InsightItem {
  label: string;
  value: string | number;
  status: string;
}

interface Insights {
  inventory: InsightItem[];
  finance: InsightItem[];
  hr: InsightItem[];
  sales: InsightItem[];
}

interface WeatherData {
  temperature?: number;
  condition?: string;
  humidity?: number;
}

const Dashboard: React.FC = () => {
  const { tenant } = useSystemConfig();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [insights, setInsights] = useState<Insights>({
    inventory: [],
    finance: [],
    hr: [],
    sales: [],
  });
  const [activeRange, setActiveRange] = useState<
    "today" | "week" | "month" | "year"
  >("month");
  const [rangeValue, setRangeValue] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Picker States
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!tenant.id || tenant.id === "none") return;
      try {
        // OPTIMIZACIÓN: Usar límites para evitar cargar todos los registros
        const LIMIT = 1000; // Límite razonable para dashboard
        
        const [invoicesData, accounts, products, employees] = await Promise.all(
          [
            // Limitar facturas a las más recientes
            localDb.invoices
              .where("tenant_id")
              .equals(tenant.id)
              .reverse()
              .limit(LIMIT)
              .toArray(),
            localDb.financial_accounts
              .where("tenant_id")
              .equals(tenant.id)
              .toArray(),
            // Limitar productos a los más relevantes
            localDb.products
              .where("tenant_id")
              .equals(tenant.id)
              .limit(LIMIT)
              .toArray(),
            localDb.employees
              .where("tenant_id")
              .equals(tenant.id)
              .toArray(),
          ],
        );

        let invoices = invoicesData;
        const now = new Date();
        if (activeRange === "today")
          invoices = invoicesData.filter((inv) =>
            inv.date.startsWith(now.toISOString().split("T")[0]),
          );
        else if (activeRange === "month")
          invoices = invoicesData.filter((inv) =>
            inv.date.startsWith(rangeValue.substring(0, 7)),
          );
        // (Add other range filters here if needed)

        const ventas = invoices.filter((inv) => inv.type === "venta");
        const compras = invoices.filter((inv) => inv.type === "compra");
        const totalSales = ventas.reduce((acc, inv) => acc + inv.total, 0);
        const totalExpenses = compras.reduce((acc, inv) => acc + inv.total, 0);
        const totalAssets = accounts
          .filter((acc) => acc.type === "activo")
          .reduce((acc, accnt) => acc + accnt.balance, 0);
        const pendingReceivables = ventas
          .filter((v) => v.status === "pendiente")
          .reduce((a, b) => a + b.total, 0);
        const pendingPayables = compras
          .filter((v) => v.status === "pendiente")
          .reduce((a, b) => a + b.total, 0);
        const lowStock = products.filter((p) => p.stock <= p.minStock);

        setDashboardData({
          finance: {
            totalAssets,
            totalExpenses,
            margin:
              totalSales > 0
                ? ((totalSales - totalExpenses) / totalSales) * 100
                : 0,
            pendingReceivables,
            pendingPayables,
          },
          sales: { totalSalesVolume: totalSales },
          inventory: { lowStockCount: lowStock.length },
          charts: { revenue: [] /* Mock logic preserved */ },
        });

        setInsights({
          inventory: lowStock
            .slice(0, 4)
            .map((p) => ({ label: p.name, value: p.stock, status: "danger" })),
          finance: [
            {
              label: "Cuentas x Cobrar",
              value: `$${pendingReceivables.toFixed(2)}`,
              status: "warning",
            },
          ],
          hr: [
            {
              label: "Nómina Activa",
              value: employees.length,
              status: "success",
            },
          ],
          sales: products
            .sort((a, b) => {
              const aCount = (a as { salesCount?: number }).salesCount || 0;
              const bCount = (b as { salesCount?: number }).salesCount || 0;
              return bCount - aCount;
            })
            .slice(0, 4)
            .map((p) => ({
              label: p.name,
              value: (p as { salesCount?: number }).salesCount || 0,
              status: "success",
            })),
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchDashboardData();
  }, [tenant.id, activeRange, rangeValue]);

  useEffect(() => {
    getCaraboboWeather().then(setWeather);
    fetchBCVRate().then((r) => r && setBcvRate(r.price));
  }, []);

  // OPTIMIZACIÓN: Memoizar el contexto del dashboard para evitar re-renders del chat
  const dashboardContext = useMemo(() => {
    return `Dashboard Status: ${formatDate(new Date())}. Sales: $${dashboardData?.sales?.totalSalesVolume || 0}. Finance: $${dashboardData?.finance?.totalAssets || 0}.`;
  }, [dashboardData]);

  // OPTIMIZACIÓN: Memoizar handlers para evitar re-renders
  const handleChatToggle = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  const handleRangeChange = useCallback((range: "today" | "week" | "month" | "year") => {
    setActiveRange(range);
  }, []);

  const handlePickerOpen = useCallback((type: string) => {
    if (type === "week") setIsWeekPickerOpen(true);
    // Month and year pickers can be added later if needed
  }, []);

  return (
    <div className="min-h-screen relative pb-12 animate-in fade-in duration-1000 overflow-hidden bg-background">
      {/* Animated Background - Only in Dark Mode */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-magenta-500/10 dark:bg-magenta-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />
      <div className="fixed top-1/2 left-1/2 w-96 h-96 bg-lime-500/5 dark:bg-lime-500/10 rounded-full blur-[120px] animate-pulse delay-500 -z-10" />
      
      <main className="container mx-auto px-6 pt-0 space-y-10 relative z-0">
        <Suspense fallback={<LoadingFallback />}>
          <QuickAccessModules />

          <DashboardHeader
            tenantName={tenant.name}
            activeRange={activeRange}
            onRangeChange={handleRangeChange}
            onPickerOpen={handlePickerOpen}
          />

          <DashboardKPIs data={dashboardData || undefined} />

          {/* AI Assistant */}
          <ModuleAIAssistant
            moduleName="Dashboard"
            moduleContext="Panel principal con métricas de ventas, finanzas, inventario y análisis general del negocio"
            contextData={{
              sales: dashboardData?.sales,
              finance: dashboardData?.finance,
              inventory: dashboardData?.inventory,
              insights: insights,
            }}
          />

          {/* Stock Alerts */}
          <StockAlerts />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <DashboardMainContent
              charts={dashboardData?.charts || { revenue: [] }}
              insights={insights}
            />
            <DashboardSidebar
              lowStockCount={dashboardData?.inventory?.lowStockCount || 0}
              weather={weather}
              bcvRate={bcvRate}
            />
          </div>
        </Suspense>

        {/* Floating AI Chat */}
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={springPresets.gentle}
                className="w-[320px] h-[450px] shadow-3xl rounded-[20px] overflow-hidden border-2 border-primary/20 bg-white"
              >
                <AIChat
                  contextData={dashboardContext}
                  onClose={() => setIsChatOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            onClick={handleChatToggle}
            className={cn(
              "w-16 h-16 rounded-full shadow-2xl transition-all duration-300 backdrop-blur-xl border-2",
              isChatOpen 
                ? "bg-slate-200 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 rotate-90" 
                : "bg-linear-to-br from-cyan-500 to-magenta-600 border-cyan-400/50 scale-110 shadow-cyan-500/50 shadow-2xl hover:shadow-cyan-500/70 hover:scale-125",
            )}
          >
            {isChatOpen ? (
              <ChevronRight className="w-8 h-8 text-slate-700 dark:text-white" />
            ) : (
              <Sparkles className="w-8 h-8 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            )}
          </Button>
        </div>

        {/* Simple Range Pickers preserved in main file for now */}
        <Dialog open={isWeekPickerOpen} onOpenChange={setIsWeekPickerOpen}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Seleccionar Semana</DialogTitle>
            </DialogHeader>
            <Input
              type="date"
              onChange={(e) => {
                setRangeValue(e.target.value);
                setActiveRange("week");
                setIsWeekPickerOpen(false);
              }}
              className="h-12 rounded-xl"
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Dashboard;
