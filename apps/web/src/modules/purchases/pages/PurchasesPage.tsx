import React, { Suspense, lazy } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import {
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  History,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { PremiumHUD } from "@/shared/components/stitch/PremiumHUD";
import { BiometricScanner } from "@/shared/components/stitch/BiometricScanner";
import { automationHub } from "@/core/infrastructure/automation/AutomationHub";
import { useTenant } from "@/shared/hooks/useTenant";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";

// Lazy-loaded legacy-turned-modular-components (if we decide to split them)
// For now, we consolidate the main logic here or import from organisms

// These 4 use export default
const PurchasesHeader = lazy(
  () => import("../components/organisms/PurchasesHeader"),
);
const PurchasesStats = lazy(
  () => import("../components/organisms/PurchasesStats"),
);
const PurchasesInsights = lazy(
  () => import("../components/organisms/PurchasesInsights"),
);
const PurchasesHistoryTable = lazy(
  () => import("../components/organisms/PurchasesHistoryTable"),
);
// These 4 use named exports
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

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <PremiumHUD>
        <BiometricScanner scanning={false} />
        {/* Animated Background */}
        <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
        <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

        <div className="flex flex-col gap-8 p-4 md:p-8 max-w-[1600px] mx-auto w-full relative z-0">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
              <ShoppingCart className="w-10 h-10 text-primary" />
              Centro de Compras
            </h1>
            <p className="text-muted-foreground text-lg">
              Gestión centralizada de adquisiciones, proveedores y control de
              stock.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="rounded-full shadow-sm gap-2 border-violet-500/30 bg-violet-500/5 text-violet-600 hover:bg-violet-500/10 h-10 px-6"
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

          <Tabs defaultValue="dashboard" className="space-y-6">
            <div className="overflow-x-auto pb-1">
              <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg inline-flex">
                <TabsTrigger
                  value="dashboard"
                  className="rounded-full px-6 gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="orders" className="rounded-full px-6 gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Órdenes
                </TabsTrigger>
                <TabsTrigger
                  value="receipts"
                  className="rounded-full px-6 gap-2"
                >
                  <Package className="w-4 h-4" />
                  Recepciones
                </TabsTrigger>
                <TabsTrigger
                  value="suppliers"
                  className="rounded-full px-6 gap-2"
                >
                  <Users className="w-4 h-4" />
                  Proveedores
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="rounded-full px-6 gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Análisis
                </TabsTrigger>
              </TabsList>
            </div>

            <Suspense fallback={<LoadingFallback />}>
              <TabsContent value="dashboard" className="space-y-6">
                <PurchasesStats />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <PurchasesHistoryTable />
                  </div>
                  <div>
                    <PurchasesInsights />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders">
                <PurchaseOrdersManager />
              </TabsContent>

              <TabsContent value="receipts">
                <ReceiptsManager />
              </TabsContent>

              <TabsContent value="suppliers">
                <SuppliersManager />
              </TabsContent>

              <TabsContent value="analytics">
                <PurchasesAnalytics />
              </TabsContent>
            </Suspense>
          </Tabs>
        </div>
      </PremiumHUD>
    </ValeryLayout>
  );
}
