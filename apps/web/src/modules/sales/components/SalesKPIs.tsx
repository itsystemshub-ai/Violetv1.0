import { StandardKPICard } from "@/shared/components/common/StandardKPICard";
import { DollarSign, FileText, TrendingUp, Target } from "lucide-react";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";

export const SalesKPIs = ({
  data,
  formatCurrency,
}: {
  data: any;
  formatCurrency: any;
}) => {
  const { formatMoney } = useCurrencyStore();

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <StandardKPICard
        label="Ventas Totales"
        value={formatMoney(data?.sales?.totalSalesVolume || 0)}
        change={12.5}
        trend="up"
        icon={DollarSign}
        accentColor="emerald-400"
        glowColor="emerald-500/50"
      />
      <StandardKPICard
        label="Facturas Pendientes"
        value={data?.sales?.pendingCount || 0}
        change={5}
        trend="down"
        icon={FileText}
        accentColor="rose-400"
        glowColor="rose-500/50"
      />
      <StandardKPICard
        label="Ticket Promedio"
        value={formatMoney(
          data?.sales?.totalSalesVolume && data?.sales?.totalSalesCount
            ? data.sales.totalSalesVolume / data.sales.totalSalesCount
            : 0,
        )}
        change={2.1}
        trend="up"
        icon={TrendingUp}
        accentColor="blue-400"
        glowColor="blue-500/50"
      />
      <StandardKPICard
        label="Conversión"
        value={
          data?.inventory?.lowStockCount
            ? `${data.inventory.lowStockCount}%`
            : "0%"
        }
        change={4.2}
        trend="up"
        icon={Target}
        accentColor="violet-400"
        glowColor="violet-500/50"
      />
    </div>
  );
};
