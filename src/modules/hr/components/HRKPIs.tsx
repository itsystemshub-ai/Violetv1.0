import { StandardKPICard } from "@/shared/components/common/StandardKPICard";
import { HRLogic } from "@/modules/hr/hooks/useHRLogic";
import { Users, UserCheck, DollarSign, Wallet, Building2 } from "lucide-react";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

interface HRKPIsProps {
  logic: HRLogic;
}

export function HRKPIs({ logic }: HRKPIsProps) {
  const { stats, employees } = logic;
  const { formatMoney } = useCurrencyStore();

  // Calcular salarios por departamento
  const deptStats = employees.reduce((acc: any, emp) => {
    const dept = emp.department || "Sin Asignar";
    if (!acc[dept]) acc[dept] = { total: 0, count: 0 };
    acc[dept].total += emp.salary;
    acc[dept].count += 1;
    return acc;
  }, {});

  const departments = Object.entries(deptStats).map(([name, data]: [string, any]) => ({
    name,
    avg: data.total / data.count,
    count: data.count
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StandardKPICard
          label="Total Colaboradores"
          value={stats.total}
          change={stats.total > 0 ? 0 : 0}
          trend="up"
          icon={Users}
          accentColor="blue-400"
          glowColor="blue-500/50"
        />
        <StandardKPICard
          label="Personal Activo"
          value={stats.active}
          change={0}
          trend="up"
          icon={UserCheck}
          accentColor="emerald-400"
          glowColor="emerald-500/50"
        />
        <StandardKPICard
          label="Salario Promedio"
          value={formatMoney(stats.avgSalary)}
          change={0}
          trend="up"
          icon={DollarSign}
          accentColor="amber-400"
          glowColor="amber-500/50"
        />
        <StandardKPICard
          label="Prestaciones Acumuladas"
          value={formatMoney(stats.totalPrestaciones)}
          change={0}
          trend="up"
          icon={Wallet}
          accentColor="violet-400"
          glowColor="violet-500/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black italic uppercase flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Análisis por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departments.map((dept, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {dept.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm tracking-tight">{dept.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">{dept.count} Colaboradores</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black italic text-sm">{formatMoney(dept.avg)}</p>
                    <Badge variant="outline" className="text-[9px]">Promedio Salarial</Badge>
                  </div>
                </div>
              ))}
              {departments.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm italic">
                  No hay datos de departamentos disponibles.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-linear-to-br from-violet-600 to-indigo-700 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-black italic uppercase text-white/90">
              Estado de Nómina
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Total a Pagar</p>
              <p className="text-3xl font-black italic tracking-tighter">
                {formatMoney(logic.payrollSummary.totalToPay)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-[8px] font-black uppercase text-white/60">Asignaciones</p>
                <p className="font-black text-sm">{formatMoney(logic.payrollSummary.totalSalaries)}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <p className="text-[8px] font-black uppercase text-white/60">Deducciones</p>
                <p className="font-black text-sm">{formatMoney(logic.payrollSummary.totalDeductions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
