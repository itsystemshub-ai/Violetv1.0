/**
 * AnalyticsPanel - Reportes y métricas de CRM con visualizaciones reales
 */

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  TrendingUp,
  Users,
  Target,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Globe,
} from "lucide-react";

const CHANNELS = [
  {
    name: "WhatsApp",
    icon: MessageSquare,
    value: 38,
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
  },
  {
    name: "Email",
    icon: Mail,
    value: 27,
    color: "bg-blue-500",
    textColor: "text-blue-600",
  },
  {
    name: "Teléfono",
    icon: Phone,
    value: 21,
    color: "bg-violet-500",
    textColor: "text-violet-600",
  },
  {
    name: "Web",
    icon: Globe,
    value: 14,
    color: "bg-amber-500",
    textColor: "text-amber-600",
  },
];

const STAGE_FUNNEL = [
  { stage: "Leads", count: 573, width: 100, color: "bg-slate-400" },
  { stage: "Contactados", count: 341, width: 60, color: "bg-blue-400" },
  { stage: "Calificados", count: 198, width: 35, color: "bg-violet-400" },
  { stage: "Propuesta", count: 89, width: 16, color: "bg-amber-400" },
  { stage: "Cerrados", count: 41, width: 8, color: "bg-emerald-500" },
];

const MONTHLY_LEADS = [
  { month: "OCT", count: 48 },
  { month: "NOV", count: 62 },
  { month: "DIC", count: 41 },
  { month: "ENE", count: 75 },
  { month: "FEB", count: 89 },
  { month: "MAR", count: 112 },
];

const maxLeads = Math.max(...MONTHLY_LEADS.map((m) => m.count));

export function AnalyticsPanel() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tasa de Conversión",
            value: "24.5%",
            sub: "+2% vs mes anterior",
            icon: Target,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
            trend: "up",
          },
          {
            label: "Nuevos Leads",
            value: "+573",
            sub: "+12% vs última semana",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-500/10",
            trend: "up",
          },
          {
            label: "Ciclo de Venta",
            value: "18 días",
            sub: "-3 días de mejora",
            icon: Clock,
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-500/10",
            trend: "up",
          },
          {
            label: "Revenue Proyectado",
            value: "$1.2M",
            sub: "+18% vs cuota",
            icon: TrendingUp,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-500/10",
            trend: "up",
          },
        ].map((kpi, i) => (
          <Card key={i} className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-black italic tracking-tighter">
                    {kpi.value}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground">
                    {kpi.sub}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${kpi.bg} shrink-0`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Embudo de Conversión */}
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black italic uppercase tracking-tight flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Embudo de Conversión
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
              De leads a clientes cerrados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {STAGE_FUNNEL.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {s.stage}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-black h-4 px-2"
                  >
                    {s.count}
                  </Badge>
                </div>
                <div className="h-5 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
                    style={{ width: `${s.width}%` }}
                  >
                    <span className="text-[9px] text-white font-black">
                      {s.width}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leads por Mes */}
        <Card className="rounded-2xl border-none shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black italic uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Captación de Leads — Últimos 6 Meses
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
              Nuevos leads por período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-3 px-2 mt-4">
              {MONTHLY_LEADS.map((m, i) => {
                const h = Math.max((m.count / maxLeads) * 100, 5);
                const isLast = i === MONTHLY_LEADS.length - 1;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <span
                      className={`text-[10px] font-black ${isLast ? "text-primary" : "text-muted-foreground/50"}`}
                    >
                      {m.count}
                    </span>
                    <div
                      className={`w-full max-w-[40px] rounded-t-xl transition-all duration-700 ${isLast ? "bg-primary" : "bg-primary/20 hover:bg-primary/40"}`}
                      style={{ height: `${h}%` }}
                    />
                    <span
                      className={`text-[10px] font-black ${isLast ? "text-primary" : "text-muted-foreground/60"}`}
                    >
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rendimiento por Canal */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-black italic uppercase tracking-tight flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Rendimiento por Canal de Captación
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
            Distribución porcentual de leads por canal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CHANNELS.map((ch, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-3 text-center"
              >
                {/* Circular progress simulation */}
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-muted/20"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      strokeWidth="3"
                      strokeDasharray={`${ch.value} 100`}
                      strokeLinecap="round"
                      className={ch.textColor}
                      stroke="currentColor"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-base font-black ${ch.textColor}`}>
                      {ch.value}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ch.icon className={`w-4 h-4 ${ch.textColor}`} />
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    {ch.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Also keep default export for backward compat
export default AnalyticsPanel;
