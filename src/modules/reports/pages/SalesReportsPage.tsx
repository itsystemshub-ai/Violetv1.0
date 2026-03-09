/**
 * SalesReportsPage - Reportes y Análisis de Ventas (Modular)
 */

import { useState } from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  FileText,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useSalesReports } from "@/modules/reports/hooks/useSalesReports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export const SalesReportsPage = () => {
  const {
    report,
    loading,
    periodFilter,
    setPeriodFilter,
    exportReport,
    compareWithPreviousPeriod,
  } = useSalesReports();

  const comparison = compareWithPreviousPeriod();

  if (loading || !report) {
    return (
      <ValeryLayout sidebar={<ValerySidebar />}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </ValeryLayout>
    );
  }

  const kpiStats = [
    {
      label: "Ingresos Totales",
      value: `$${report.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      growth: comparison.revenueGrowth,
    },
    {
      label: "Órdenes",
      value: report.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      growth: comparison.ordersGrowth,
    },
    {
      label: "Ticket Promedio",
      value: `$${report.averageOrderValue.toLocaleString()}`,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Margen de Ganancia",
      value: `${report.profitMargin}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      growth: comparison.profitGrowth,
    },
  ];

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Reportes de Ventas
            </h1>
            <p className="text-muted-foreground mt-1">
              Análisis y métricas de rendimiento de ventas
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
                <SelectItem value="year">Este Año</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => exportReport("pdf")}
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => exportReport("excel")}
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    {stat.growth && (
                      <div className="flex items-center gap-1 mt-2">
                        {stat.growth > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span
                          className={`text-sm font-medium ${stat.growth > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {stat.growth > 0 ? "+" : ""}
                          {stat.growth}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          vs período anterior
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center shrink-0`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ventas</CardTitle>
              <CardDescription>Ingresos diarios del período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.salesByDay.map((day: any, index: number) => {
                  const maxRevenue = Math.max(
                    ...report.salesByDay.map((d: any) => d.revenue),
                  );
                  const percentage = (day.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {day.date}
                        </span>
                        <span className="font-medium">
                          ${day.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sales by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Categoría</CardTitle>
              <CardDescription>Distribución de ingresos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.salesByCategory.map((cat: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          ${cat.revenue.toLocaleString()}
                        </span>
                        <Badge variant="outline">
                          {cat.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2 transition-all"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>Top 5 productos por ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.topProducts.map((product: any, index: number) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{product.productName}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <Badge variant="outline">{product.category}</Badge>
                        <span>{product.unitsSold} unidades</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-600">
                      ${product.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ganancia: ${product.profit.toLocaleString()} (
                      {product.profitMargin}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Mejores Clientes</CardTitle>
            <CardDescription>Top 5 clientes por ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.topCustomers.map((customer: any, index: number) => (
                <div
                  key={customer.customerId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{customer.customerName}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{customer.totalOrders} órdenes</span>
                        <span>•</span>
                        <span>Última compra: {customer.lastPurchase}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-600">
                      ${customer.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Promedio: ${customer.averageOrderValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
            <CardDescription>Distribución por forma de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.salesByPaymentMethod.map((method: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{method.method}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        ${method.amount.toLocaleString()}
                      </span>
                      <Badge variant="outline">{method.percentage}%</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 rounded-full h-2 transition-all"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <ModuleAIAssistant
          moduleName="Reportes de Ventas"
          suggestions={[
            "Analizar tendencias de ventas",
            "Identificar productos con bajo rendimiento",
            "Sugerir estrategias para aumentar ventas",
            "Predecir ventas del próximo mes",
          ]}
        />
      </div>
    </ValeryLayout>
  );
};

export default SalesReportsPage;
