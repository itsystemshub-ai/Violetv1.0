/**
 * PurchasesAnalytics - Análisis avanzado del módulo de compras
 * Muestra tendencias de gasto, distribución por proveedor y eficiencia de procura
 */

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Users,
  DollarSign,
  Package,
} from "lucide-react";
import { usePurchaseOrders } from "../../hooks/usePurchaseOrders";
import { useSuppliers } from "../../hooks/useSuppliers";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS_HEX = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e"];

export const PurchasesAnalytics: React.FC = () => {
  const { allOrders } = usePurchaseOrders();
  const { suppliers } = useSuppliers();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Gasto por mes (últimos 6 meses)
  const spendingByMonth = useMemo(() => {
    const months: { name: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d
        .toLocaleDateString("es-VE", { month: "short" })
        .toUpperCase();
      const total = allOrders
        .filter((o) => {
          if (o.status === "cancelled") return false;
          const od = new Date(o.date);
          return (
            od.getMonth() === d.getMonth() &&
            od.getFullYear() === d.getFullYear()
          );
        })
        .reduce((sum, o) => sum + o.total, 0);
      months.push({ name: label, total });
    }
    return months;
  }, [allOrders]);

  // Gasto por proveedor (top 5)
  const spendingBySupplier = useMemo(() => {
    const map: Record<string, number> = {};
    allOrders
      .filter((o) => o.status !== "cancelled")
      .forEach((o) => {
        map[o.supplier] = (map[o.supplier] || 0) + o.total;
      });
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({
        name,
        amount,
        pct: Math.round((amount / total) * 100),
      }));
  }, [allOrders]);

  // Distribución por estatus
  const statusDist = useMemo(() => {
    const total = allOrders.length || 1;
    return [
      {
        label: "Aprobadas",
        icon: CheckCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        count: allOrders.filter((o) => o.status === "approved").length,
      },
      {
        label: "Pendientes",
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        count: allOrders.filter((o) => o.status === "pending").length,
      },
      {
        label: "Recibidas",
        icon: Package,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-500/10",
        count: allOrders.filter((o) => o.status === "received").length,
      },
      {
        label: "Canceladas",
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50 dark:bg-rose-500/10",
        count: allOrders.filter((o) => o.status === "cancelled").length,
      },
    ].map((s) => ({ ...s, pct: Math.round((s.count / total) * 100) }));
  }, [allOrders]);

  const totalSpend = allOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);

  const avgOrderValue =
    allOrders.length > 0 ? totalSpend / allOrders.length : 0;

  const prevMonthSpend = spendingByMonth[4]?.total || 0;
  const currentMonthSpend = spendingByMonth[5]?.total || 0;
  const monthTrend =
    prevMonthSpend > 0
      ? ((currentMonthSpend - prevMonthSpend) / prevMonthSpend) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Gasto Total",
            value: formatCurrency(totalSpend),
            sub: `${allOrders.length} órdenes`,
            icon: DollarSign,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-500/10",
          },
          {
            label: "Ticket Promedio",
            value: formatCurrency(avgOrderValue),
            sub: "por orden de compra",
            icon: ShoppingCart,
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-500/10",
          },
          {
            label: "Proveedores Activos",
            value: String(new Set(allOrders.map((o) => o.supplier)).size),
            sub: `de ${suppliers.length} registrados`,
            icon: Users,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
          },
          {
            label: "Este Mes",
            value: formatCurrency(currentMonthSpend),
            sub:
              monthTrend >= 0
                ? `▲ ${monthTrend.toFixed(0)}% vs mes ant.`
                : `▼ ${Math.abs(monthTrend).toFixed(0)}% vs mes ant.`,
            icon: monthTrend >= 0 ? TrendingUp : TrendingDown,
            color: monthTrend >= 0 ? "text-rose-600" : "text-emerald-600",
            bg:
              monthTrend >= 0
                ? "bg-rose-50 dark:bg-rose-500/10"
                : "bg-emerald-50 dark:bg-emerald-500/10",
          },
        ].map((kpi, idx) => (
          <Card key={idx} className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-black italic tracking-tighter">
                    {kpi.value}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground">
                    {kpi.sub}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${kpi.bg} shrink-0`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tendencia de Gasto Mensual */}
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-base font-black italic uppercase tracking-tight">
                  Tendencia de Gasto — Últimos 6 Meses
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                  Órdenes de compra aprobadas y recibidas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  />
                  <YAxis hide />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="hsl(var(--primary))" 
                    radius={[10, 10, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Proveedores */}
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-base font-black italic uppercase tracking-tight">
                  Top Proveedores
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                  Por volumen de gasto total
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] space-y-4">
            {spendingBySupplier.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-8">
                Sin datos de proveedores aún.
              </p>
            ) : (
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingBySupplier}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {spendingBySupplier.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_HEX[index % COLORS_HEX.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {spendingBySupplier.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                       <div className="flex items-center gap-1.5 ">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS_HEX[i] }} />
                          <span className="truncate max-w-[100px] uppercase italic text-muted-foreground">{s.name}</span>
                       </div>
                       <span>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribución por Estatus */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-black italic uppercase tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Distribución por Estatus de Orden
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
            Estado de todas las órdenes de compra registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusDist.map((s, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl ${s.bg} flex flex-col gap-2`}
              >
                <div className="flex items-center justify-between">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <span className={`text-2xl font-black italic ${s.color}`}>
                    {s.count}
                  </span>
                </div>
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${s.color}`}
                >
                  {s.label}
                </p>
                <div className="h-1.5 bg-white/40 dark:bg-black/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color.replace("text-", "bg-")} rounded-full transition-all duration-700`}
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-muted-foreground">
                  {s.pct}% del total
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
