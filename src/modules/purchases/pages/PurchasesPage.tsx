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
} from "lucide-react";

// Lazy-loaded legacy-turned-modular-components (if we decide to split them)
// For now, we consolidate the main logic here or import from organisms

// These 4 use export default
const PurchasesHeader = lazy(
  () => import("../components/Organisms/PurchasesHeader"),
);
const PurchasesStats = lazy(
  () => import("../components/Organisms/PurchasesStats"),
);
const PurchasesInsights = lazy(
  () => import("../components/Organisms/PurchasesInsights"),
);
const PurchasesHistoryTable = lazy(
  () => import("../components/Organisms/PurchasesHistoryTable"),
);
// These 4 use named exports
const PurchaseOrdersManager = lazy(() =>
  import("../components/Organisms/PurchaseOrdersManager").then((m) => ({
    default: m.PurchaseOrdersManager,
  })),
);
const ReceiptsManager = lazy(() =>
  import("../components/Organisms/ReceiptsManager").then((m) => ({
    default: m.ReceiptsManager,
  })),
);
const SuppliersManager = lazy(() =>
  import("../components/Organisms/SuppliersManager").then((m) => ({
    default: m.SuppliersManager,
  })),
);
const PurchasesAnalytics = lazy(() =>
  import("../components/Organisms/PurchasesAnalytics").then((m) => ({
    default: m.PurchasesAnalytics,
  })),
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12 w-full h-[300px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export default function PurchasesPage() {
  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
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
              <TabsTrigger value="receipts" className="rounded-full px-6 gap-2">
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
    </ValeryLayout>
  );
}
