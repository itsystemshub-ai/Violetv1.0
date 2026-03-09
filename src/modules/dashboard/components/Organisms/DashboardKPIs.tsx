import React from "react";
import { StandardKPICard } from "@/shared/components/common/StandardKPICard";
import {
  Activity,
  TrendingUp,
  Zap,
  Landmark,
  CreditCard,
  Download,
} from "lucide-react";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";

interface DashboardKPIsProps {
  data?: {
    sales: { totalSalesVolume: number };
    finance: {
      totalExpenses: number;
      margin: number;
      totalAssets: number;
      pendingPayables: number;
      pendingReceivables: number;
    };
  };
  currency?: "USD" | "BS";
  exchangeRate?: number;
}

const DashboardKPIs: React.FC<DashboardKPIsProps> = ({ data }) => {
  if (!data) return null;
  const { formatMoney } = useCurrencyStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
      <StandardKPICard
        label="Volumen de Ventas"
        value={formatMoney(data.sales.totalSalesVolume || 0)}
        change={8.2}
        trend="up"
        icon={Activity}
        accentColor="cyan-400"
        glowColor="cyan-500/50"
      />
      <StandardKPICard
        label="Egresos Totales"
        value={formatMoney(data.finance.totalExpenses || 0)}
        change={5.4}
        trend="down"
        icon={TrendingUp}
        accentColor="rose-400"
        glowColor="rose-500/50"
      />
      <StandardKPICard
        label="Margen de Ganancia"
        value={`${data.finance.margin?.toFixed(1) || 0}%`}
        change={1.5}
        trend="up"
        icon={Zap}
        accentColor="magenta-400"
        glowColor="magenta-500/50"
      />
      <StandardKPICard
        label="Liquidez (Activos)"
        value={formatMoney(data.finance.totalAssets || 0)}
        change={2.1}
        trend="up"
        icon={Landmark}
        accentColor="lime-400"
        glowColor="lime-500/50"
      />
      <StandardKPICard
        label="Cuentas x Pagar"
        value={formatMoney(data.finance.pendingPayables || 0)}
        change={15}
        trend="down"
        icon={CreditCard}
        accentColor="amber-400"
        glowColor="amber-500/50"
      />
      <StandardKPICard
        label="Cuentas x Cobrar"
        value={formatMoney(data.finance.pendingReceivables || 0)}
        change={4.2}
        trend="up"
        icon={Download}
        accentColor="blue-400"
        glowColor="blue-500/50"
      />
    </div>
  );
};

export default DashboardKPIs;
