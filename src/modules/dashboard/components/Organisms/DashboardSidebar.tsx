import React from "react";
import { Sparkles, Zap, ChevronRight, Activity } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  lowStockCount: number;
  weather: any;
  bcvRate: number | null;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  lowStockCount,
  weather,
  bcvRate,
}) => {
  return (
    <div className="space-y-8">
      {/* AI Insight Card */}
      <div className="relative rounded-3xl p-6 backdrop-blur-xl bg-linear-to-br from-magenta-100/80 to-card/80 dark:from-magenta-900/40 dark:to-slate-900/40 border border-magenta-400/30 shadow-2xl hover:shadow-magenta-500/50 transition-all duration-500 group overflow-hidden">
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-linear-to-br from-magenta-500/20 to-transparent" />
        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
          <Sparkles className="w-12 h-12 text-magenta-500 dark:text-magenta-400" />
        </div>
        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-foreground">
          <Zap className="w-5 h-5 text-magenta-500 dark:text-magenta-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" /> IA Insight
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-magenta-400/50 pl-4">
          "El volumen de ventas ha crecido un 8.2% este periodo. Sin embargo,
          hay {lowStockCount} alertas de stock que podrían impactar el
          cumplimiento de pedidos."
        </p>
        <Button className="w-full mt-6 bg-linear-to-r from-magenta-500 to-cyan-500 hover:from-magenta-600 hover:to-cyan-600 text-white font-black uppercase text-[10px] tracking-widest gap-2 h-11 rounded-xl shadow-lg shadow-magenta-500/50 transition-all duration-300 hover:shadow-magenta-500/70 hover:scale-105">
          Ver Reporte Detallado <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* API Performance */}
      <div className="rounded-3xl p-5 backdrop-blur-xl bg-card/80 border border-lime-400/30 shadow-lg hover:shadow-lime-500/50 transition-all duration-500 group relative">
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-linear-to-br from-lime-500/20 to-transparent" />
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Activity className="w-3 h-3 text-lime-500 dark:text-lime-400" /> Rendimiento API
          </h4>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="w-1 h-3 bg-lime-500/40 dark:bg-lime-400/40 rounded-full group-hover:bg-lime-500 dark:group-hover:bg-lime-400 transition-colors animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Violet Server responde en{" "}
          <span className="text-lime-600 dark:text-lime-400 font-bold font-mono drop-shadow-[0_0_4px_rgba(132,204,22,0.4)]">24ms</span>.
          Clusters operando con redundancia total.
        </p>
      </div>

      {/* Weather Widget */}
      <div
        className={cn(
          "rounded-3xl p-5 backdrop-blur-xl border transition-all duration-500 hover:shadow-2xl",
          weather?.rainExpectedToday 
            ? "bg-blue-100/80 dark:bg-blue-900/40 border-blue-400/30 hover:shadow-blue-500/50" 
            : "bg-amber-100/80 dark:bg-amber-900/40 border-amber-400/30 hover:shadow-amber-500/50"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Activity className="w-3 h-3 text-blue-500 dark:text-blue-400" /> Clima · Valencia
          </h4>
          {weather?.rainExpectedToday && (
            <Badge className="bg-blue-500/80 backdrop-blur-sm text-white text-[8px] font-bold uppercase px-1.5 h-4 border border-blue-400/30">
              Lluvia
            </Badge>
          )}
        </div>
        {weather ? (
          <div className="space-y-1">
            <p className="text-3xl font-black text-foreground drop-shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              {weather.temperature}°C
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              Viento {weather.windspeed} km/h{" "}
              {weather.rainExpectedToday
                ? `· ${weather.precipitationMm.toFixed(1)}mm`
                : "· Despejado"}
            </p>
            {weather.rainExpectedToday && (
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-2 flex items-center gap-1">
                🚚 Precaución en despachos
              </p>
            )}
          </div>
        ) : (
          <div className="h-12 flex items-center text-[10px] text-muted-foreground italic">
            Actualizando clima...
          </div>
        )}
      </div>

      {/* BCV Rate */}
      {bcvRate && (
        <div className="rounded-3xl p-5 backdrop-blur-xl bg-lime-100/80 dark:bg-lime-900/40 border border-lime-400/30 shadow-lg hover:shadow-lime-500/50 transition-all duration-500 group relative">
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-linear-to-br from-lime-500/20 to-transparent" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Tasa BCV Oficial
          </p>
          <p className="text-3xl font-black text-lime-600 dark:text-lime-400 drop-shadow-[0_0_10px_rgba(132,204,22,0.3)]">
            Bs. {bcvRate.toFixed(2)}
          </p>
          <p className="text-[10px] text-lime-600/60 dark:text-lime-400/60 font-medium uppercase tracking-tighter">
            por 1 USD — actualizado hoy
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardSidebar;
