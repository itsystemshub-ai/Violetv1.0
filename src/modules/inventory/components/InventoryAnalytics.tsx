import { StandardKPICard } from "@/shared/components/common/StandardKPICard";
import { InventoryChart, GenericBarChart } from "@/shared/components/common/Charts";
import { formatCurrency } from "@/lib/index";
import { TrendingUp, AlertCircle, Package, Layers } from "lucide-react";

interface InventoryAnalyticsProps {
  logic: any;
}

export const InventoryAnalytics = ({ logic }: InventoryAnalyticsProps) => {
  return (
    <div className="space-y-8 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StandardKPICard
          label="Valorización Total FCA"
          value={formatCurrency(logic.totalInventoryValue)}
          icon={TrendingUp}
          change={12.5}
          trend="up"
          accentColor="emerald-400"
          glowColor="emerald-500/50"
        />
        <StandardKPICard
          label="Items en Alerta"
          value={logic.lowStockCount}
          icon={AlertCircle}
          change={5.2}
          trend="down"
          accentColor="amber-400"
          glowColor="amber-500/50"
        />
        <StandardKPICard
          label="Unidades Globales"
          value={logic.products
            .reduce((acc: any, p: any) => acc + (p.stock || 0), 0)
            .toLocaleString()}
          icon={Package}
          change={8}
          trend="up"
          accentColor="blue-400"
          glowColor="blue-500/50"
        />
        <StandardKPICard
          label="Categorías Activas"
          value={logic.categories.length}
          icon={Layers}
          change={2}
          trend="up"
          accentColor="violet-400"
          glowColor="violet-500/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InventoryChart
          data={logic.inventoryChartData}
          title="Distribución por Categorías"
          description="Segmentación del stock total por familia de productos"
          className="lg:col-span-2 h-full rounded-3xl shadow-sm border-border/60"
        />
        <GenericBarChart
          data={logic.brandChartData}
          title="Distribución por Marca"
          description="TX, MGM y Cauplas"
          className="lg:col-span-1 h-full rounded-3xl shadow-sm border-border/60"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GenericBarChart
          data={logic.fuelChartData}
          title="Tipo de Combustible"
          description="Análisis Diesel vs Gasolina"
          className="rounded-3xl shadow-sm border-border/60"
        />
        <InventoryChart
          data={logic.vehicleBrandChartData}
          title="Distribución de Vehículos"
          description="Segmentación del stock por marca de vehículo"
          className="h-full rounded-3xl shadow-sm border-border/60"
        />
      </div>
    </div>
  );
};
