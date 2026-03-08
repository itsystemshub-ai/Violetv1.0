import React from "react";
import { StandardKPICard } from "@/shared/components/common/StandardKPICard";
import { TrendingUp, CreditCard, DollarSign, Users } from "lucide-react";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";

const PurchasesStats: React.FC = () => {
  const { formatMoney, exchangeRate } = useCurrencyStore();

  // Self-contained stats with default values
  const stats = {
    totalUSD: 0,
    pendingUSD: 0,
    supplierCount: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <StandardKPICard
        label="Total Adquisiciones"
        value={formatMoney(stats.totalUSD)}
        change={0}
        trend="up"
        icon={TrendingUp}
        accentColor="violet-400"
        glowColor="violet-500/50"
      />
      <StandardKPICard
        label="Cuentas por Pagar"
        value={formatMoney(stats.pendingUSD)}
        icon={CreditCard}
        change={0}
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
        label="Proveedores"
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
