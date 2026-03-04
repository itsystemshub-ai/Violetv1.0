import React from "react";
import { Landmark, Activity, Archive, Users, TrendingUp } from "lucide-react";
import { RevenueChart } from "@/shared/components/common/Charts";
import { cn } from "@/core/shared/utils/utils";

interface DashboardMainContentProps {
  charts: { revenue: any[] };
  insights: {
    sales: any[];
    finance: any[];
    inventory: any[];
    hr: any[];
  };
}

interface InsightCardProps {
  title: string;
  icon: React.ReactNode;
  items: any[];
  accentColor: string;
  glowColor: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, icon, items, accentColor, glowColor }) => {
  return (
    <div className={cn(
      "group relative rounded-3xl p-6 backdrop-blur-xl bg-card/80 border transition-all duration-500",
      "hover:shadow-2xl hover:-translate-y-1",
      `border-${accentColor}/30 hover:border-${accentColor}/60 hover:shadow-${glowColor}`
    )}>
      {/* Glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10",
        `bg-linear-to-br from-${accentColor}/20 to-transparent`
      )} />
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          `bg-linear-to-br from-${accentColor}/20 to-${accentColor}/5 border border-${accentColor}/30`
        )}>
          <div className={`text-${accentColor}`}>
            {icon}
          </div>
        </div>
        <h3 className="text-lg font-black text-foreground tracking-tight">
          {title}
        </h3>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
            <span className="text-sm text-muted-foreground font-medium">{item.label}</span>
            <span className={cn(
              "text-sm font-bold",
              item.status === "success" && "text-lime-500 dark:text-lime-400",
              item.status === "warning" && "text-amber-500 dark:text-amber-400",
              item.status === "danger" && "text-rose-500 dark:text-rose-400"
            )}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardMainContent: React.FC<DashboardMainContentProps> = ({
  charts,
  insights,
}) => {
  return (
    <div className="lg:col-span-2 space-y-8">
      {/* Revenue Chart */}
      <div className="relative rounded-3xl p-8 backdrop-blur-xl bg-card/80 border border-cyan-400/30 shadow-2xl hover:shadow-cyan-500/50 transition-all duration-500 overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 scale-150 transition-transform group-hover:rotate-12 opacity-[0.03] pointer-events-none text-cyan-500 dark:text-cyan-400">
          <Landmark size={120} />
        </div>
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-linear-to-br from-cyan-500/20 to-transparent" />
        <RevenueChart
          data={charts?.revenue || []}
          title="Flujo Operativo Mensual"
          description="Comparativa de Ingresos vs Egresos consolidados."
        />
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InsightCard
          title="Top Productos (Ventas)"
          icon={<Activity className="w-5 h-5" />}
          items={insights.sales}
          accentColor="lime-400"
          glowColor="lime-500/50"
        />
        <InsightCard
          title="Balance Financiero"
          icon={<Landmark className="w-5 h-5" />}
          items={insights.finance}
          accentColor="rose-400"
          glowColor="rose-500/50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <InsightCard
          title="Stock Crítico"
          icon={<Archive className="w-5 h-5" />}
          items={insights.inventory}
          accentColor="amber-400"
          glowColor="amber-500/50"
        />
        <InsightCard
          title="Talento Humano"
          icon={<Users className="w-5 h-5" />}
          items={insights.hr}
          accentColor="blue-400"
          glowColor="blue-500/50"
        />
      </div>
    </div>
  );
};

export default DashboardMainContent;
