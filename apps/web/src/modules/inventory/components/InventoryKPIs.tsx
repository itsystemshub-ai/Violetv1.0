import { StandardKPICard } from "@/shared/components/common/StandardKPICard";
import { Package, AlertCircle, TrendingUp, Star } from "lucide-react";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";

interface InventoryKPIsProps {
  logic: any;
}

export const InventoryKPIs = ({ logic }: InventoryKPIsProps) => {
  const { formatMoney } = useCurrencyStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <StandardKPICard
        label="Total Productos"
        value={logic.products?.length || 0}
        icon={Package}
        change={(logic.products?.length || 0) > 0 ? 5.2 : 0}
        trend="up"
        accentColor="blue-400"
        glowColor="blue-500/50"
      />
      <StandardKPICard
        label="En Alerta (Stock Bajo)"
        value={logic.lowStockCount || 0}
        icon={AlertCircle}
        change={15}
        trend="down"
        accentColor="rose-400"
        glowColor="rose-500/50"
      />
      <StandardKPICard
        label="Valorización FCA"
        value={formatMoney(logic.totalInventoryValue || 0)}
        icon={TrendingUp}
        change={8.1}
        trend="up"
        accentColor="emerald-400"
        glowColor="emerald-500/50"
      />
      <StandardKPICard
        label="Items Nuevos (2025)"
        value={logic.products?.filter((p: any) => p && p.isNuevo).length || 0}
        icon={Star}
        change={10}
        trend="up"
        accentColor="amber-400"
        glowColor="amber-500/50"
      />
    </div>
  );
};
