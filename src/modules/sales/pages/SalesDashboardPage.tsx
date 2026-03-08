import React from "react";
import {
  Download,
  BarChart3,
  ShoppingCart,
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  History,
} from "lucide-react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ProductSalesHistoryTab } from "../components/ProductSalesHistoryTab";
import { useSalesDashboardLogic } from "../hooks/useSalesDashboardLogic";

const SalesDashboardPage = () => {
  const { stats, loading } = useSalesDashboardLogic();

  const formatCurrencyLocal = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <ValeryLayout sidebar={<ValerySidebar />}>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </ValeryLayout>
    );
  }

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-slate-950" />

      <main className="container mx-auto p-4 md:p-8 space-y-8 relative h-full overflow-y-auto">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 rounded-3xl">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-2xl">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Dashboard de Ventas
              </h1>
              <Badge
                variant="outline"
                className="h-6 gap-1.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 px-3 rounded-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  En Tiempo Real
                </span>
              </Badge>
            </div>
            <p className="text-slate-500 text-sm">
              Métricas financieras y rendimiento comercial centralizado
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl gap-2 shadow-sm"
            >
              <Download className="h-4 w-4" />
              Exportar Reporte
            </Button>
            <Button
              className="h-10 px-6 rounded-xl gap-2 shadow-sm"
              onClick={() => (window.location.href = "#/sales/pos")}
            >
              <ShoppingCart className="h-4 w-4" />
              Nuevo Pedido / POS
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
            <TabsTrigger
              value="overview"
              className="rounded-xl px-6 py-2.5 font-bold uppercase text-xs tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Resumen Ejecutivo
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl px-6 py-2.5 font-bold uppercase text-xs tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex gap-2"
            >
              <History className="w-4 h-4" />
              Historial de Productos
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Ventas Totales
                      </p>
                      <p className="text-3xl font-black text-slate-900 dark:text-white">
                        {formatCurrencyLocal(stats.totalSales)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <span className="text-slate-900 dark:text-white font-medium">
                      {stats.totalQuantity}
                    </span>{" "}
                    unidades vendidas en total
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Cuentas por Cobrar
                      </p>
                      <p className="text-3xl font-black text-rose-600 dark:text-rose-400">
                        {formatCurrencyLocal(stats.pendingAmount)}
                      </p>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
                      <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    Monto bloqueado en facturas pendientes de pago
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Ticket Promedio
                      </p>
                      <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrencyLocal(stats.ticketPromedio)}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                      <LayoutDashboard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    Gasto promedio por cada factura emitida
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de Barras: Rendimiento Mensual */}
              <Card className="lg:col-span-2 rounded-2xl shadow-sm border-none">
                <CardHeader>
                  <CardTitle>
                    Ingresos de los últimos 6 periodos operativos
                  </CardTitle>
                  <CardDescription>
                    Rendimiento histórico basado en facturas pagadas y
                    completadas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between gap-4 mt-8 px-4">
                    {stats.revenueByPeriod.map((item, index) => {
                      const maxVal = Math.max(
                        ...stats.revenueByPeriod.map((i) => i.value),
                        1000,
                      );
                      const heightPercent = Math.max(
                        (item.value / maxVal) * 100,
                        2,
                      );

                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center gap-3"
                        >
                          <div className="w-full flex justify-center">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                              {formatCurrencyLocal(item.value)}
                            </span>
                          </div>
                          <div
                            className="w-full max-w-[60px] bg-primary/20 hover:bg-primary/40 rounded-t-xl transition-all duration-500 relative group cursor-pointer"
                            style={{ height: `${heightPercent}%` }}
                          >
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground uppercase">
                            {item.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Lista: Top Vendedores */}
              <Card className="rounded-2xl shadow-sm border-none">
                <CardHeader>
                  <CardTitle>Top Vendedores Activos</CardTitle>
                  <CardDescription>
                    Clasificación por volumen de ventas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {stats.topSellers.map((seller, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                          ${
                            index === 0
                              ? "bg-amber-100 text-amber-700"
                              : index === 1
                                ? "bg-slate-200 text-slate-700"
                                : index === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-primary/10 text-primary"
                          }
                        `}
                        >
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-sm capitalize">
                              {seller.name}
                            </span>
                            <span className="text-sm font-bold">
                              {formatCurrencyLocal(seller.amount)}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-1000"
                              style={{ width: `${seller.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {stats.topSellers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay suficientes datos de vendedores.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lista: Top Categorías */}
              <Card className="lg:col-span-3 rounded-2xl shadow-sm border-none">
                <CardHeader>
                  <CardTitle>Top Categorías de Productos</CardTitle>
                  <CardDescription>
                    Categorías que generan mayor volumen de ingresos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    {stats.topCategories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"
                      >
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                          {cat.name}
                        </p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">
                          {formatCurrencyLocal(cat.value)}
                        </p>
                      </div>
                    ))}
                    {stats.topCategories.length === 0 && (
                      <div className="col-span-full py-4 text-center text-muted-foreground">
                        Aún no hay categorías con ventas registradas.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="history"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <ProductSalesHistoryTab />
          </TabsContent>
        </Tabs>
      </main>
    </ValeryLayout>
  );
};

export default SalesDashboardPage;
