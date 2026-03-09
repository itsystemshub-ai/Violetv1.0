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

const COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

const COLOR_TEXT = [
  "text-blue-600",
  "text-violet-600",
  "text-emerald-600",
  "text-amber-600",
  "text-rose-600",
];

const COLOR_BG = [
  "bg-blue-50 dark:bg-blue-500/10",
  "bg-violet-50 dark:bg-violet-500/10",
  "bg-emerald-50 dark:bg-emerald-500/10",
  "bg-amber-50 dark:bg-amber-500/10",
  "bg-rose-50 dark:bg-rose-500/10",
];

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

  const maxMonthSpend = Math.max(...spendingByMonth.map((m) => m.total), 1);

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
            <div className="h-[220px] flex items-end justify-between gap-3 px-2 mt-4">
              {spendingByMonth.map((m, i) => {
                const h = Math.max((m.total / maxMonthSpend) * 100, 3);
                const isLast = i === spendingByMonth.length - 1;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <span
                      className={`text-[10px] font-black ${isLast ? "text-primary" : "text-muted-foreground/50"}`}
                    >
                      {m.total > 0 ? formatCurrency(m.total) : "—"}
                    </span>
                    <div
                      className={`w-full max-w-[48px] rounded-t-xl transition-all duration-700 ${isLast ? "bg-primary" : "bg-primary/20 hover:bg-primary/40"}`}
                      style={{ height: `${h}%` }}
                    />
                    <span
                      className={`text-[10px] font-black uppercase ${isLast ? "text-primary" : "text-muted-foreground/60"}`}
                    >
                      {m.name}
                    </span>
                  </div>
                );
              })}
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
          <CardContent className="space-y-4">
            {spendingBySupplier.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-8">
                Sin datos de proveedores aún.
              </p>
            ) : (
              spendingBySupplier.map((s, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${COLORS[i % 5]}`}
                      />
                      <span
                        className={`text-[11px] font-black truncate max-w-[110px] ${COLOR_TEXT[i % 5]}`}
                      >
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${COLOR_BG[i % 5]} ${COLOR_TEXT[i % 5]} border-0 text-[9px] font-black`}
                      >
                        {s.pct}%
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {formatCurrency(s.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${COLORS[i % 5]} rounded-full transition-all duration-700`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))
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
