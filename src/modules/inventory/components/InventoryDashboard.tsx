import React from "react";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  Clock,
  History,
  Activity,
  Box,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useInventoryLogic } from "../hooks/useInventoryLogic";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";

export const InventoryDashboard: React.FC = () => {
  const { products, whStats, lowStockCount, totalInventoryValue } =
    useInventoryLogic();
  const { formatMoney } = useCurrencyStore();

  const stats = [
    {
      label: "Total Productos",
      value: products.length.toString(),
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      trend: "+4.5%",
    },
    {
      label: "Stock Bajo",
      value: lowStockCount.toString(),
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      trend: "-2 hoy",
    },
    {
      label: "Valor Total",
      value: formatMoney(totalInventoryValue),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      trend: "+12.2k",
    },
    {
      label: "Categorías",
      value: Array.from(
        new Set(products.map((p) => p.category)),
      ).length.toString(),
      icon: Layers,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-500/10",
      trend: "Estable",
    },
  ];

  // Sample data for charts
  const categoryData = Array.from(new Set(products.map((p) => p.category)))
    .slice(0, 5)
    .map((cat) => ({
      name: cat || "General",
      value: products.filter((p) => p.category === cat).length,
    }));

  const stockHistory = [
    { name: "Lun", value: 400 },
    { name: "Mar", value: 300 },
    { name: "Mie", value: 600 },
    { name: "Jue", value: 800 },
    { name: "Vie", value: 500 },
    { name: "Sab", value: 200 },
    { name: "Dom", value: 300 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="rounded-3xl border-none shadow-premium hover:scale-[1.02] transition-all bg-card/40 backdrop-blur-xl"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black tracking-tighter text-foreground">
                    {stat.value}
                  </p>
                  <Badge
                    variant="outline"
                    className="rounded-full text-[10px] font-bold bg-white/50 dark:bg-black/20 border-border/40"
                  >
                    <TrendingUp className="w-3 h-3 mr-1 text-primary" />
                    {stat.trend}
                  </Badge>
                </div>
                <div className={stat.bg + " p-3 rounded-2xl"}>
                  <stat.icon className={stat.color + " w-6 h-6"} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distritbution */}
        <Card className="rounded-[2.5rem] border-none shadow-premium bg-card/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              DISTRIBUCIÓN POR CATEGORÍA
            </CardTitle>
            <CardDescription className="italic font-medium">
              Análisis de volumen por familia de producto
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fontWeight: 700,
                    fill: "var(--muted-foreground)",
                  }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ fill: "rgba(var(--primary-rgb), 0.05)" }}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[12, 12, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Movements History */}
        <Card className="rounded-[2.5rem] border-none shadow-premium bg-card/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <History className="w-6 h-6 text-indigo-500" />
              FLUJO DE STOCK
            </CardTitle>
            <CardDescription className="italic font-medium">
              Movimientos detectados en los últimos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockHistory}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fontWeight: 700,
                    fill: "var(--muted-foreground)",
                  }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={4}
                  dot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Alerts / Critical Items */}
      <Card className="rounded-[2.5rem] border-none shadow-premium bg-linear-to-br from-rose-500/5 to-amber-500/5 backdrop-blur-xl border border-rose-500/10">
        <CardHeader>
          <CardTitle className="text-xl font-black flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-rose-500" />
            ALERTAS Y RECOMENDACIONES DE IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lowStockCount > 0 ? (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-rose-500/20">
              <div className="p-3 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold">Stock Crítico Detectado</p>
                <p className="text-xs text-muted-foreground">
                  {lowStockCount} mangueras están por debajo del mínimo de
                  seguridad.
                </p>
              </div>
              <Badge className="bg-rose-500">Urgente</Badge>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-emerald-500/20">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Sparkles className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold">Niveles de Stock Óptimos</p>
                <p className="text-xs text-muted-foreground">
                  La IA no detecta quiebres de stock inminentes.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-blue-500/20">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Predicción de Demanda</p>
              <p className="text-xs text-muted-foreground">
                Se estima un incremento del 15% en la categoría Cauplas para el
                próximo mes.
              </p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Info
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
