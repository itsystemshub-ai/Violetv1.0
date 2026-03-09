import React, { Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import {
  ShoppingCart,
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { automationHub } from "@/core/infrastructure/automation/AutomationHub";
import { useTenant } from "@/shared/hooks/useTenant";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";

// Lazy-loaded components
const PurchasesStats = lazy(
  () => import("../components/organisms/PurchasesStats"),
);
const PurchasesInsights = lazy(
  () => import("../components/organisms/PurchasesInsights"),
);
const PurchasesHistoryTable = lazy(
  () => import("../components/organisms/PurchasesHistoryTable"),
);
const PurchaseOrdersManager = lazy(() =>
  import("../components/organisms/PurchaseOrdersManager").then((m) => ({
    default: m.PurchaseOrdersManager,
  })),
);
const ReceiptsManager = lazy(() =>
  import("../components/organisms/ReceiptsManager").then((m) => ({
    default: m.ReceiptsManager,
  })),
);
const SuppliersManager = lazy(() =>
  import("../components/organisms/SuppliersManager").then((m) => ({
    default: m.SuppliersManager,
  })),
);
const PurchasesAnalytics = lazy(() =>
  import("../components/organisms/PurchasesAnalytics").then((m) => ({
    default: m.PurchasesAnalytics,
  })),
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12 w-full h-[300px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export default function PurchasesPage() {
  const { tenant } = useTenant();
  const location = useLocation();
  const currentPath = location.pathname;

  const renderContent = () => {
    if (currentPath === "/purchases/orders") return <PurchaseOrdersManager />;
    if (currentPath === "/purchases/receipts") return <ReceiptsManager />;
    if (currentPath === "/purchases/suppliers") return <SuppliersManager />;
    if (currentPath === "/purchases/analytics") return <PurchasesAnalytics />;
    
    // Default dashboard
    return (
      <div className="space-y-6">
        <PurchasesStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PurchasesHistoryTable />
          </div>
          <div>
            <PurchasesInsights />
          </div>
        </div>
      </div>
    );
  };

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

      <div className="flex flex-col gap-8 p-4 md:p-8 max-w-[1600px] mx-auto w-full relative z-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm p-6 rounded-3xl backdrop-blur-md">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-2xl">
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Centro de Compras
                </h1>
                <p className="text-slate-500 text-sm">
                  Gestión centralizada de adquisiciones y proveedores
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="rounded-xl shadow-sm gap-2 border-violet-500/30 bg-violet-500/5 text-violet-600 hover:bg-violet-500/10 h-10 px-6"
              onClick={() => {
                automationHub.trigger("/purchases/analyze", {
                  tenantId: tenant?.id,
                  timestamp: new Date().toISOString(),
                  requestType: "supplier_optimization",
                });
                toast.success("Análisis de optimización enviado a n8n");
              }}
            >
              <Sparkles className="w-4 h-4" />
              Solicitar Análisis IA
            </Button>
          </div>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          {renderContent()}
        </Suspense>
      </div>
    </ValeryLayout>
  );
}
