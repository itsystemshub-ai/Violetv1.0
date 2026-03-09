/**
 * HRDashboard - Panel analítico avanzado para RRHH (v1)
 */

import React from "react";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  CalendarDays, 
  DollarSign, 
  Briefcase,
  PieChart,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { HRLogic } from "../hooks/useHRLogic";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";
import { StandardKPICard } from "@/shared/components/common/StandardKPICard";

interface HRDashboardProps {
  logic: HRLogic;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ logic }) => {
  const { stats, employees, payrollSummary } = logic;
  const { formatMoney } = useCurrencyStore();

  // Departamento distribution
  const deptStats = employees.reduce((acc: any, emp) => {
    const dept = emp.department || "Sin Asignar";
    if (!acc[dept]) acc[dept] = { total: 0, count: 0 };
    acc[dept].total += emp.salary;
    acc[dept].count += 1;
    return acc;
  }, {});

  const departments = Object.entries(deptStats).map(([name, data]: [string, any]) => ({
    name,
    count: data.count,
    totalSalary: data.total
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StandardKPICard
          label="Colaboradores"
          value={stats.total}
          icon={Users}
          accentColor="rose-400"
          glowColor="rose-500/30"
        />
        <StandardKPICard
          label="Nómina Mensual"
          value={formatMoney(payrollSummary.totalToPay)}
          icon={DollarSign}
          accentColor="rose-500"
          glowColor="rose-600/30"
        />
        <StandardKPICard
          label="Salario Promedio"
          value={formatMoney(stats.avgSalary)}
          icon={TrendingUp}
          accentColor="pink-400"
          glowColor="pink-500/30"
        />
        <StandardKPICard
          label="Departamentos"
          value={departments.length}
          icon={Building2}
          accentColor="rose-600"
          glowColor="rose-700/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black italic uppercase text-primary flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Distribución de Fuerza Laboral
                </CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                  Colaboradores por departamento y costo mensual
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              {departments.map((dept, i) => {
                const percentage = (dept.count / stats.total) * 100;
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-bold">
                          {i + 1}
                        </Badge>
                        <span className="text-sm font-black tracking-tight text-slate-700 dark:text-slate-300">
                          {dept.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-muted-foreground/60 mr-2">
                          {dept.count} Colaboradores
                        </span>
                        <span className="text-sm font-black italic text-primary">
                          {formatMoney(dept.totalSalary)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-linear-to-r from-rose-500 to-pink-500 transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {departments.length === 0 && (
                <div className="text-center py-20 text-muted-foreground italic text-sm font-medium">
                  No hay datos registrados para mostrar la distribución.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Card */}
        <Card className="rounded-3xl border-none shadow-xl bg-linear-to-br from-rose-600 to-pink-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="w-48 h-48 -mr-16 -mt-16" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl font-black italic uppercase text-white/90">
              Análisis Proyectado
            </CardTitle>
            <CardDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
              Impacto financiero de nómina
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
             <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Impacto Anual Est.</p>
                <p className="text-4xl font-black italic tracking-tighter">
                  {formatMoney(payrollSummary.totalToPay * 12)}
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                   <p className="text-[8px] font-black uppercase text-white/40 mb-1">Promedio Salarial</p>
                   <p className="text-xl font-black italic">{formatMoney(stats.avgSalary)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                   <p className="text-[8px] font-black uppercase text-white/40 mb-1">Carga Social Est.</p>
                   <p className="text-xl font-black italic">{formatMoney(payrollSummary.totalDeductions)}</p>
                </div>
             </div>

             <div className="pt-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Sistema en Tiempo Real</span>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions / Recent Activity Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="rounded-3xl border-none shadow-lg bg-white/40 dark:bg-slate-900/40">
            <CardHeader className="pb-3 px-6">
               <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Próximas Vacaciones
               </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
               <div className="text-center py-6 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-muted-foreground italic font-medium">Buscando cronograma en base de datos...</p>
               </div>
            </CardContent>
         </Card>

         <Card className="rounded-3xl border-none shadow-lg bg-white/40 dark:bg-slate-900/40">
            <CardHeader className="pb-3 px-6">
               <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Cargos Críticos
               </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
               <div className="text-center py-6 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-muted-foreground italic font-medium">Analizando estructura organizacional...</p>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};
