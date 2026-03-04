import React, { Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useFinanceLogic } from "@/features/finance/hooks/useFinanceLogic";
import { ModuleAIAssistant } from "@/core/ai/components";

// Lazy-loaded Organisms
const FinanceHeader = lazy(() =>
  import("@/modules/finance/components/Organisms/FinanceHeader").then((m) => ({
    default: m.FinanceHeader,
  })),
);
const FinanceKPIs = lazy(() =>
  import("@/modules/finance/components/Organisms/FinanceKPIs").then((m) => ({
    default: m.FinanceKPIs,
  })),
);
const FinanceDashboard = lazy(() =>
  import("@/modules/finance/components/Organisms/FinanceDashboard").then((m) => ({
    default: m.FinanceDashboard,
  })),
);
const CxCManager = lazy(() =>
  import("@/modules/finance/components/Organisms/CxCManager").then((m) => ({
    default: m.CxCManager,
  })),
);
const LibroManager = lazy(() =>
  import("@/modules/finance/components/Organisms/LibroManager").then((m) => ({
    default: m.LibroManager,
  })),
);
const IGTFManager = lazy(() =>
  import("@/modules/finance/components/Organisms/IGTFManager").then((m) => ({
    default: m.IGTFManager,
  })),
);
const ReconciliationManager = lazy(() =>
  import("@/modules/finance/components/Organisms/ReconciliationManager").then((m) => ({
    default: m.ReconciliationManager,
  })),
);
const LedgerManager = lazy(() =>
  import("@/modules/finance/components/Organisms/LedgerManager").then((m) => ({
    default: m.LedgerManager,
  })),
);
const FinanceReports = lazy(() =>
  import("@/modules/finance/components/Organisms/FinanceReports").then((m) => ({
    default: m.FinanceReports,
  })),
);

const LoadingTab = () => (
  <div className="flex items-center justify-center p-12 h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export default function Finance() {
  const logic = useFinanceLogic();

  return (
    <div className="min-h-screen relative pb-12 animate-in fade-in duration-1000 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />
      
      <div className="p-2 sm:p-6 space-y-6 max-w-7xl mx-auto relative z-0">
        <Suspense fallback={<LoadingTab />}>
          <FinanceHeader logic={logic} />

          <Tabs defaultValue="dashboard" className="space-y-6">
            <div className="overflow-x-auto pb-1">
              <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg inline-flex">
                <TabsTrigger value="dashboard" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="cxc" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                  CxC
                </TabsTrigger>
                <TabsTrigger value="libros" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                  Libros
                </TabsTrigger>
                <TabsTrigger value="igtf" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                  IGTF
                </TabsTrigger>
                <TabsTrigger value="asientos" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                  Contabilidad
                </TabsTrigger>
                <TabsTrigger value="reconciliation" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                  Conciliación
                </TabsTrigger>
                <TabsTrigger value="reports" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                  Reportes
                </TabsTrigger>
              </TabsList>
            </div>

          <TabsContent value="dashboard" className="space-y-6">
            <FinanceKPIs logic={logic} />
            
            {/* AI Assistant */}
            <ModuleAIAssistant
              moduleName="Finanzas"
              moduleContext="Gestión financiera, contabilidad, cuentas por cobrar, libros contables, IGTF y conciliación bancaria"
              contextData={{
                totalAssets: logic.kpis.totalAssets,
                totalExpenses: logic.kpis.totalExpenses,
                pendingReceivables: logic.kpis.pendingReceivables,
                cashFlow: logic.kpis.cashFlow,
              }}
              compact
            />
            <FinanceDashboard logic={logic} />
          </TabsContent>

          <TabsContent value="libros" className="space-y-6">
            <LibroManager logic={logic} />
          </TabsContent>

          <TabsContent value="cxc">
            <CxCManager logic={logic} />
          </TabsContent>

          <TabsContent value="igtf">
            <IGTFManager logic={logic} />
          </TabsContent>

          <TabsContent value="reconciliation">
            <ReconciliationManager logic={logic} />
          </TabsContent>

          <TabsContent value="asientos">
            <LedgerManager logic={logic} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <FinanceReports logic={logic} />
          </TabsContent>
        </Tabs>
      </Suspense>
    </div>
    </div>
  );
}
