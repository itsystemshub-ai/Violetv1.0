/**
 * AutomationPanel - Workflows y automatización de CRM
 * Interface avanzada con estadísticas, activaciones y métricas de ejecución
 */

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { Badge } from "@/shared/components/ui/badge";
import {
  Zap,
  Mail,
  Bell,
  Users,
  Plus,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  BarChart3,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface Workflow {
  id: string;
  name: string;
  type: "Email" | "Notificación" | "Asignación" | "Tarea";
  status: boolean;
  triggers: string;
  actions: string;
  runs: number;
  lastRun: string;
  successRate: number;
}

const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: "1",
    name: "Bienvenida a Nuevos Leads",
    type: "Email",
    status: true,
    triggers: "Lead creado",
    actions: "Enviar email de bienvenida",
    runs: 341,
    lastRun: "Hace 12 min",
    successRate: 98,
  },
  {
    id: "2",
    name: "Recordatorio de Propuesta",
    type: "Notificación",
    status: true,
    triggers: "Propuesta enviada > 3 días",
    actions: "Avisar a vendedor asignado",
    runs: 127,
    lastRun: "Hace 2 hs",
    successRate: 100,
  },
  {
    id: "3",
    name: "Asignación Automática Round-Robin",
    type: "Asignación",
    status: false,
    triggers: "Nuevo lead calificado",
    actions: "Rotación round-robin entre agentes",
    runs: 89,
    lastRun: "Ayer 15:32",
    successRate: 94,
  },
  {
    id: "4",
    name: "Tarea de Seguimiento Post-Venta",
    type: "Tarea",
    status: true,
    triggers: "Oportunidad → Ganada",
    actions: "Crear tarea de onboarding a los 3 días",
    runs: 56,
    lastRun: "Hace 1 día",
    successRate: 100,
  },
];

const TYPE_CONFIG = {
  Email: {
    icon: Mail,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  },
  Notificación: {
    icon: Bell,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  },
  Asignación: {
    icon: Users,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  },
  Tarea: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
};

export function AutomationPanel() {
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);

  const toggleWorkflow = (id: string) => {
    setWorkflows((wfs) =>
      wfs.map((wf) => (wf.id === id ? { ...wf, status: !wf.status } : wf)),
    );
    const wf = workflows.find((w) => w.id === id);
    if (wf) {
      toast.success(`${wf.name} ${wf.status ? "desactivado" : "activado"}.`);
    }
  };

  const runNow = (id: string) => {
    const wf = workflows.find((w) => w.id === id);
    if (!wf) return;
    if (!wf.status) {
      toast.error("Activa el workflow primero antes de ejecutarlo.");
      return;
    }
    setWorkflows((wfs) =>
      wfs.map((w) =>
        w.id === id ? { ...w, runs: w.runs + 1, lastRun: "Justo ahora" } : w,
      ),
    );
    toast.success(`▶ "${wf.name}" ejecutado manualmente.`);
  };

  const activeCount = workflows.filter((w) => w.status).length;
  const totalRuns = workflows.reduce((s, w) => s + w.runs, 0);
  const avgSuccess = Math.round(
    workflows.reduce((s, w) => s + w.successRate, 0) / workflows.length,
  );

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">
            Workflows de Automatización
          </h3>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Gestiona tus procesos automáticos de ventas y soporte
          </p>
        </div>
        <Button
          className="rounded-xl gap-2 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
          onClick={() => toast.info("Editor de workflows — Próximamente")}
        >
          <Plus className="w-4 h-4" />
          Nuevo Workflow
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Activos",
            value: activeCount,
            icon: PlayCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
          },
          {
            label: "Inactivos",
            value: workflows.length - activeCount,
            icon: PauseCircle,
            color: "text-muted-foreground",
            bg: "bg-muted/30",
          },
          {
            label: "Ejecuciones",
            value: totalRuns,
            icon: BarChart3,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-500/10",
          },
        ].map((k, i) => (
          <Card key={i} className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${k.bg}`}>
                <k.icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {k.label}
                </p>
                <p className="text-xl font-black italic">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Cards */}
      <div className="space-y-3">
        {workflows.map((wf) => {
          const cfg = TYPE_CONFIG[wf.type];
          const Icon = cfg.icon;
          return (
            <Card
              key={wf.id}
              className={`rounded-2xl border-none shadow-sm transition-all ${!wf.status ? "opacity-60" : ""}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-2.5 rounded-xl ${cfg.bg} shrink-0 mt-0.5`}
                    >
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h4 className="font-black text-sm text-foreground">
                          {wf.name}
                        </h4>
                        <Badge
                          className={`${cfg.badge} text-[9px] font-black border-0 rounded-full px-2`}
                        >
                          {wf.type}
                        </Badge>
                        {wf.status && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] font-black border-0 rounded-full px-2 gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            ACTIVO
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {wf.triggers}
                        </span>
                        <span>→</span>
                        <span>{wf.actions}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {wf.runs} ejecuciones
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {wf.lastRun}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] font-black text-emerald-600">
                            {wf.successRate}% éxito
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <Switch
                      checked={wf.status}
                      onCheckedChange={() => toggleWorkflow(wf.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl h-7 gap-1.5 text-[10px] font-black uppercase tracking-widest"
                      onClick={() => runNow(wf.id)}
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Ejecutar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer stat */}
      <Card className="rounded-2xl border-none shadow-sm bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest text-foreground">
              Tasa de éxito global de todos los workflows
            </span>
          </div>
          <span className="text-xl font-black italic text-primary">
            {avgSuccess}%
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

export default AutomationPanel;
