import React, { Suspense, lazy } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useFinanceLogic } from "../hooks/useFinanceLogic";
import { ModuleAIAssistant } from "@/core/ai/components";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { PremiumHUD } from "@/shared/components/stitch/PremiumHUD";
import { BiometricScanner } from "@/shared/components/stitch/BiometricScanner";
import { automationHub } from "@/core/infrastructure/automation/AutomationHub";
import { useTenant } from "@/shared/hooks/useTenant";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

// Lazy-loaded Organisms from modular structure
const FinanceHeader = lazy(() =>
  import("../components/organisms/FinanceHeader").then((m) => ({
    default: m.FinanceHeader,
  })),
);
const ChartOfAccountsManager = lazy(() =>
  import("../components/organisms/ChartOfAccountsManager").then((m) => ({
    default: m.ChartOfAccountsManager,
  })),
);
const JournalManager = lazy(() =>
  import("../components/organisms/JournalManager").then((m) => ({
    default: m.JournalManager,
  })),
);
const FinanceKPIs = lazy(() =>
  import("../components/organisms/FinanceKPIs").then((m) => ({
    default: m.FinanceKPIs,
  })),
);
const FinanceDashboard = lazy(() =>
  import("../components/organisms/FinanceDashboard").then((m) => ({
    default: m.FinanceDashboard,
  })),
);
const CxCManager = lazy(() =>
  import("../components/organisms/CxCManager").then((m) => ({
    default: m.CxCManager,
  })),
);
const CxPManager = lazy(() =>
  import("../components/organisms/CxPManager").then((m) => ({
    default: m.CxPManager,
  })),
);
const LibroManager = lazy(() =>
  import("../components/organisms/LibroManager").then((m) => ({
    default: m.LibroManager,
  })),
);
const IGTFManager = lazy(() =>
  import("../components/organisms/IGTFManager").then((m) => ({
    default: m.IGTFManager,
  })),
);
const ReconciliationManager = lazy(() =>
  import("../components/organisms/ReconciliationManager").then((m) => ({
    default: m.ReconciliationManager,
  })),
);
const LedgerManager = lazy(() =>
  import("../components/organisms/LedgerManager").then((m) => ({
    default: m.LedgerManager,
  })),
);
const FinanceReports = lazy(() =>
  import("../components/organisms/FinanceReports").then((m) => ({
    default: m.FinanceReports,
  })),
);
const PaymentQueueManager = lazy(() =>
  import("../components/PaymentQueueManager").then((m) => ({
    default: m.PaymentQueueManager,
  })),
);

const LoadingTab = () => (
  <div className="flex items-center justify-center p-12 h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export default function FinancePage() {
  const logic = useFinanceLogic();
  const { tenant } = useTenant();

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <PremiumHUD>
        <BiometricScanner scanning={false} />
        {/* Animated Background */}
        <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
        <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

        <div className="p-2 sm:p-6 space-y-6 max-w-7xl mx-auto relative z-0">
          <Suspense fallback={<LoadingTab />}>
            <FinanceHeader logic={logic} />

            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                className="rounded-full shadow-sm gap-2 border-violet-500/30 bg-violet-500/5 text-violet-600 hover:bg-violet-500/10 h-10 px-6"
                onClick={() => {
                  automationHub.trigger("/finance/bank/sync", {
                    tenantId: tenant?.id,
                    timestamp: new Date().toISOString(),
                    action: "reconciliation_scan",
                  });
                  toast.success(
                    "Escaneo de conciliación bancaria enviado a n8n",
                  );
                }}
              >
                <Sparkles className="w-4 h-4" />
                Sincronizar Bancos IA
              </Button>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-6">
              <div className="overflow-x-auto pb-1">
                <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg inline-flex">
                  <TabsTrigger
                    value="dashboard"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="cxc"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    CxC
                  </TabsTrigger>
                  <TabsTrigger
                    value="cxp"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    CxP
                  </TabsTrigger>
                  <TabsTrigger
                    value="libros"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Libros
                  </TabsTrigger>
                  <TabsTrigger
                    value="igtf"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    IGTF
                  </TabsTrigger>
                  <TabsTrigger
                    value="cuentas"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Cuentas
                  </TabsTrigger>
                  <TabsTrigger
                    value="asientos"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Asientos
                  </TabsTrigger>
                  <TabsTrigger
                    value="mayor"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Libro Mayor
                  </TabsTrigger>
                  <TabsTrigger
                    value="reconciliation"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Conciliación
                  </TabsTrigger>
                  <TabsTrigger
                    value="reports"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Reportes
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment-queue"
                    className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white"
                  >
                    Cola de Pagos
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

              <TabsContent value="cxp">
                <CxPManager logic={logic} />
              </TabsContent>

              <TabsContent value="igtf">
                <IGTFManager logic={logic} />
              </TabsContent>

              <TabsContent value="cuentas">
                <ChartOfAccountsManager logic={logic} />
              </TabsContent>

              <TabsContent value="asientos">
                <JournalManager logic={logic} />
              </TabsContent>

              <TabsContent value="mayor">
                <LedgerManager logic={logic} />
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <FinanceReports logic={logic} />
              </TabsContent>

              <TabsContent value="payment-queue" className="space-y-6">
                <PaymentQueueManager
                  reportedPayments={logic.reportedPayments}
                  onApprove={logic.handleApproveReportedPayment}
                  onReject={logic.handleRejectReportedPayment}
                />
              </TabsContent>
            </Tabs>
          </Suspense>
        </div>
      </PremiumHUD>
    </ValeryLayout>
  );
}
