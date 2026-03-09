import React from "react";
import { StandardKPICard } from "@/shared/components/common/StandardKPICard";
import { TrendingUp, CreditCard, DollarSign, Users } from "lucide-react";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";
import { usePurchaseOrders } from "../../hooks/usePurchaseOrders";
import { useSuppliers } from "../../hooks/useSuppliers";

const PurchasesStats: React.FC = () => {
  const { formatMoney, exchangeRate } = useCurrencyStore();
  const { stats: orderStats, loading: ordersLoading } = usePurchaseOrders();
  const { stats: supplierStats, loading: suppliersLoading } = useSuppliers();

  if (ordersLoading || suppliersLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <StandardKPICard
        label="Total Adquisiciones"
        value={formatMoney(orderStats.totalAmount)}
        change={orderStats.thisMonthCount}
        trend="up"
        icon={TrendingUp}
        accentColor="violet-400"
        glowColor="violet-500/50"
      />
      <StandardKPICard
        label="Cuentas por Pagar"
        value={formatMoney(supplierStats.totalBalance)}
        icon={CreditCard}
        change={orderStats.pendingOrders}
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
        label="Proveedores Activos"
        value={supplierStats.activeSuppliers}
        icon={Users}
        change={supplierStats.totalSuppliers - supplierStats.activeSuppliers}
        trend="up"
        accentColor="blue-400"
        glowColor="blue-500/50"
      />
    </div>
  );
};

export default PurchasesStats;
