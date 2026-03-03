import { StandardKPICard } from "@/components/StandardKPICard";
import { Wallet, Scale, Receipt, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/index";

interface FinanceKPIsProps {
  logic: any;
}

export const FinanceKPIs = ({ logic }: FinanceKPIsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <StandardKPICard
        label="Activos Totales"
        value={formatCurrency(logic.financialSummary?.assets || 0, "USD")}
        change={5.2}
        trend="up"
        icon={Wallet}
        accentColor="emerald-400"
        glowColor="emerald-500/50"
      />
      <StandardKPICard
        label="Cuentas por Pagar"
        value={formatCurrency(logic.financialSummary?.liabilities || 0, "USD")}
        change={3.1}
        trend="down"
        icon={Scale}
        accentColor="rose-400"
        glowColor="rose-500/50"
      />
      <StandardKPICard
        label="Utilidad Neta"
        value={formatCurrency(logic.financialSummary?.netIncome || 0, "USD")}
        change={8.5}
        trend="up"
        icon={Receipt}
        accentColor="blue-400"
        glowColor="blue-500/50"
      />
      <StandardKPICard
        label="IGTF Mensual"
        value={formatCurrency(logic.igtfSummary?.totalIGTF || 0, "USD")}
        change={2.3}
        trend="up"
        icon={Zap}
        accentColor="amber-400"
        glowColor="amber-500/50"
      />
    </div>
  );
};
