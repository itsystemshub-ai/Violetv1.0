import React from "react";
import { StandardKPICard } from "@/components/StandardKPICard";
import { formatCurrency } from "@/lib/index";
import { TrendingUp, CreditCard, DollarSign, Users } from "lucide-react";

interface PurchasesStatsProps {
  stats: {
    totalUSD: number;
    totalBS: number;
    pendingUSD: number;
    supplierCount: number;
    purchaseCount: number;
  };
  exchangeRate: number;
}

const PurchasesStats: React.FC<PurchasesStatsProps> = ({
  stats,
  exchangeRate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <StandardKPICard
        label="Total Adquisiciones"
        value={formatCurrency(stats.totalUSD, "USD")}
        change={12.5}
        trend="up"
        icon={TrendingUp}
        accentColor="violet-400"
        glowColor="violet-500/50"
      />
      <StandardKPICard
        label="Cuentas por Pagar"
        value={formatCurrency(stats.pendingUSD, "USD")}
        icon={CreditCard}
        change={3.2}
        trend="down"
        accentColor="amber-400"
        glowColor="amber-500/50"
      />
      <StandardKPICard
        label="Tasa Aplicada (BCV)"
        value={`${exchangeRate} Bs/$`}
        icon={DollarSign}
        change={0}
        trend="up"
        accentColor="emerald-400"
        glowColor="emerald-500/50"
      />
      <StandardKPICard
        label="Suministros"
        value={stats.supplierCount}
        icon={Users}
        change={0}
        trend="up"
        accentColor="blue-400"
        glowColor="blue-500/50"
      />
    </div>
  );
};

export default PurchasesStats;
