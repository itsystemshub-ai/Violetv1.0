import React, { Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Calculator,
  Shield,
  CalendarDays,
  FileText,
} from "lucide-react";
import { useHRLogic } from "@/features/hr/hooks/useHRLogic";

// Lazy-loaded components
const HRHeader = lazy(() =>
  import("@/components/HR/HRHeader").then((m) => ({ default: m.HRHeader })),
);
const HRKPIs = lazy(() =>
  import("@/components/HR/HRKPIs").then((m) => ({ default: m.HRKPIs })),
);
const EmployeeDirectory = lazy(() =>
  import("@/components/HR/EmployeeDirectory").then((m) => ({
    default: m.EmployeeDirectory,
  })),
);
const PayrollManager = lazy(() =>
  import("@/components/HR/PayrollManager").then((m) => ({
    default: m.PayrollManager,
  })),
);
const PrestacionesManager = lazy(() =>
  import("@/components/HR/PrestacionesManager").then((m) => ({
    default: m.PrestacionesManager,
  })),
);
const VacacionesManager = lazy(() =>
  import("@/components/HR/VacacionesManager").then((m) => ({
    default: m.VacacionesManager,
  })),
);
const HRReports = lazy(() =>
  import("@/components/HR/HRReports").then((m) => ({ default: m.HRReports })),
);

const LoadingTab = () => (
  <div className="flex items-center justify-center p-12 h-[300px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export default function HR() {
  const logic = useHRLogic();

  return (
    <div className="min-h-screen relative pb-12 animate-in fade-in duration-1000 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 dark:bg-pink-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />
      
      <div className="flex flex-col gap-8 p-4 md:p-8 relative z-0">
        <Suspense fallback={<LoadingTab />}>
          <HRHeader logic={logic} />

          <Tabs defaultValue="dashboard" className="w-full">
          <div className="overflow-x-auto pb-1">
            <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg inline-flex">
              <TabsTrigger value="dashboard" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="directorio" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                Directorio
              </TabsTrigger>
              <TabsTrigger value="nomina" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                Nómina
              </TabsTrigger>
              <TabsTrigger value="prestaciones" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                Prestaciones
              </TabsTrigger>
              <TabsTrigger value="vacaciones" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                Vacaciones
              </TabsTrigger>
              <TabsTrigger value="reportes" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                Reportes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="mt-6">
            <HRKPIs logic={logic} />
          </TabsContent>

          <TabsContent value="directorio" className="mt-6">
            <EmployeeDirectory logic={logic} />
          </TabsContent>

          <TabsContent value="nomina" className="mt-6">
            <PayrollManager logic={logic} />
          </TabsContent>

          <TabsContent value="prestaciones" className="mt-6">
            <PrestacionesManager logic={logic} />
          </TabsContent>

          <TabsContent value="vacaciones" className="mt-6">
            <VacacionesManager logic={logic} />
          </TabsContent>

          <TabsContent value="reportes" className="mt-6">
            <HRReports logic={logic} />
          </TabsContent>
          </Tabs>
        </Suspense>
      </div>
    </div>
  );
}
