import React, { Suspense, lazy } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { PremiumHUD } from "@/shared/components/stitch/PremiumHUD";
import { BookOpen, ClipboardList, History } from "lucide-react";

// Lazy-loaded Views
const KardexView = lazy(() =>
  import("../components/organisms/KardexView").then((m) => ({
    default: m.KardexView,
  })),
);
const AdjustmentsView = lazy(() =>
  import("../components/organisms/AdjustmentsView").then((m) => ({
    default: m.AdjustmentsView,
  })),
);
const InventoryMovements = lazy(() => import("./InventoryMovements"));

const LoadingTab = () => (
  <div className="flex items-center justify-center p-12 h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export default function MovementsControlPage() {
  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <PremiumHUD>
        <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto relative z-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                <History className="w-8 h-8 text-primary" />
                Movimientos y Ajustes
              </h1>
              <p className="text-muted-foreground mt-1">
                Control total de entradas, salidas y auditorías de inventario.
              </p>
            </div>
          </div>

          <Tabs defaultValue="kardex" className="space-y-6">
            <TabsList className="backdrop-blur-xl bg-white/50 dark:bg-black/20 border border-border p-1 rounded-full w-fit shadow-lg">
              <TabsTrigger
                value="kardex"
                className="rounded-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <BookOpen className="w-4 h-4" />
                Kardex
              </TabsTrigger>
              <TabsTrigger
                value="adjustments"
                className="rounded-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <ClipboardList className="w-4 h-4" />
                Ajustes
              </TabsTrigger>
              <TabsTrigger
                value="log"
                className="rounded-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <History className="w-4 h-4" />
                Log de Movimientos
              </TabsTrigger>
            </TabsList>

            <Suspense fallback={<LoadingTab />}>
              <TabsContent
                value="kardex"
                className="mt-0 border-none p-0 outline-none"
              >
                <KardexView />
              </TabsContent>

              <TabsContent
                value="adjustments"
                className="mt-0 border-none p-0 outline-none"
              >
                <AdjustmentsView />
              </TabsContent>

              <TabsContent
                value="log"
                className="mt-0 border-none p-0 outline-none"
              >
                <InventoryMovements />
              </TabsContent>
            </Suspense>
          </Tabs>
        </div>
      </PremiumHUD>
    </ValeryLayout>
  );
}
