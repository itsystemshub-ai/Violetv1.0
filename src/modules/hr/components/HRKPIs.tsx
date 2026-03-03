import { StandardKPICard } from "@/components/StandardKPICard";
import { formatCurrency } from "@/lib/index";
import { HRLogic } from "@/features/hr/hooks/useHRLogic";
import { Users, UserCheck, DollarSign, Wallet } from "lucide-react";

interface HRKPIsProps {
  logic: HRLogic;
}

export function HRKPIs({ logic }: HRKPIsProps) {
  const { stats } = logic;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <StandardKPICard
        label="Total Colaboradores"
        value={stats.total}
        change={5.2}
        trend="up"
        icon={Users}
        accentColor="blue-400"
        glowColor="blue-500/50"
      />
      <StandardKPICard
        label="Personal Activo"
        value={stats.active}
        change={2.1}
        trend="up"
        icon={UserCheck}
        accentColor="emerald-400"
        glowColor="emerald-500/50"
      />
      <StandardKPICard
        label="Salario Promedio"
        value={formatCurrency(stats.avgSalary)}
        change={1.5}
        trend="up"
        icon={DollarSign}
        accentColor="amber-400"
        glowColor="amber-500/50"
      />
      <StandardKPICard
        label="Prestaciones Acumuladas"
        value={formatCurrency(stats.totalPrestaciones)}
        change={0}
        trend="up"
        icon={Wallet}
        accentColor="violet-400"
        glowColor="violet-500/50"
      />
    </div>
  );
}
