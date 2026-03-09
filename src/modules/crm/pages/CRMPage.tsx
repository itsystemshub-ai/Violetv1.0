/**
 * CRMPage - Sistema Avanzado de Gestión de Relaciones con Clientes (Modular)
 */

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Users, Ticket, MessageSquare, TrendingUp, Zap } from "lucide-react";

import { useCRMStore } from "../hooks/useCRMStore";

// Import modular components
import {
  CustomersPanel,
  TicketsPanel,
  PipelinePanel,
  CommunicationsPanel,
  AnalyticsPanel,
  AutomationPanel,
  CRMDashboard,
} from "../components";

export default function CRMPage() {
  const { activeTab, setTab } = useCRMStore();

  // Set default tab to dashboard if not set or if it's new
  // We'll handle this in a useEffect to avoid render loop if necessary,
  // but for now let's just ensure dashboard exists in the store logic or here.

  return (
    <>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              CRM Avanzado
            </h1>
            <p className="text-muted-foreground mt-1">
              Sistema completo de gestión de clientes y ventas
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={
            activeTab === "pipeline" &&
            !localStorage.getItem("crm_dashboard_visited")
              ? "dashboard"
              : activeTab
          }
          onValueChange={(val) => {
            if (val === "dashboard")
              localStorage.setItem("crm_dashboard_visited", "true");
            setTab(val as any);
          }}
          className="space-y-6"
        >
          <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg overflow-x-auto max-w-full flex-nowrap">
            <TabsTrigger
              value="dashboard"
              className="rounded-full px-6 whitespace-nowrap"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="pipeline"
              className="rounded-full px-6 whitespace-nowrap"
            >
              <Zap className="w-4 h-4 mr-2" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger
              value="clientes"
              className="rounded-full px-6 whitespace-nowrap"
            >
              <Users className="w-4 h-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger
              value="tickets"
              className="rounded-full px-6 whitespace-nowrap"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger
              value="comunicaciones"
              className="rounded-full px-6 whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Comunicaciones
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-full px-6 whitespace-nowrap"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Análisis
            </TabsTrigger>
            <TabsTrigger
              value="automatizacion"
              className="rounded-full px-6 whitespace-nowrap"
            >
              <Zap className="w-4 h-4 mr-2" />
              Automatización
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="dashboard"
            className="m-0 focus-visible:outline-none"
          >
            <CRMDashboard />
          </TabsContent>

          <TabsContent
            value="pipeline"
            className="m-0 focus-visible:outline-none"
          >
            <PipelinePanel />
          </TabsContent>

          <TabsContent
            value="clientes"
            className="m-0 focus-visible:outline-none"
          >
            <CustomersPanel />
          </TabsContent>

          <TabsContent
            value="tickets"
            className="m-0 focus-visible:outline-none"
          >
            <TicketsPanel />
          </TabsContent>

          <TabsContent
            value="comunicaciones"
            className="m-0 focus-visible:outline-none"
          >
            <CommunicationsPanel />
          </TabsContent>

          <TabsContent
            value="analytics"
            className="m-0 focus-visible:outline-none"
          >
            <AnalyticsPanel />
          </TabsContent>

          <TabsContent
            value="automatizacion"
            className="m-0 focus-visible:outline-none"
          >
            <AutomationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
