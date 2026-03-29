/**
 * InventoryReportsPage - Reportes y Análisis de Inventario (Modular)
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
  Package,
  Download,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Boxes,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useInventoryReports } from "@/modules/reports/hooks/useInventoryReports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export const InventoryReportsPage = () => {
  const {
    report,
    loading,
    periodFilter,
    setPeriodFilter,
    exportReport,
    getStockAlerts,
  } = useInventoryReports();

  const stockAlerts = getStockAlerts();

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
      label: "Valor Total",
      value: `$${report.totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Total Productos",
      value: report.totalProducts.toString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Stock Bajo/Crítico",
      value: `${report.lowStockItems + report.criticalStockItems}`,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "Rotación de Stock",
      value: `${report.stockTurnoverRate}x`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      optimal: {
        label: "Óptimo",
        className: "bg-green-500 hover:bg-green-600",
      },
      low: { label: "Bajo", className: "bg-yellow-500 hover:bg-yellow-600" },
      critical: { label: "Crítico", className: "bg-red-500 hover:bg-red-600" },
      overstock: {
        label: "Exceso",
        className: "bg-blue-500 hover:bg-blue-600",
      },
    };
    const config = variants[status as keyof typeof variants];
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Boxes className="w-8 h-8 text-primary" />
              Reportes de Inventario
            </h1>
            <p className="text-muted-foreground mt-1">
              Análisis y métricas de stock y movimientos
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
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stock Alerts */}
        {stockAlerts.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Alertas de Stock
              </CardTitle>
              <CardDescription>
                Productos que requieren atención inmediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockAlerts.map((item: any) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20"
                  >
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                      <div>
                        <p className="font-semibold">{item.productName}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <Badge variant="outline">{item.category}</Badge>
                          <span>Stock actual: {item.currentStock}</span>
                          <span>Mínimo: {item.minStock}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(item.status)}
                      <p className="text-sm text-muted-foreground mt-1">
                        Valor: ${item.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Movimientos de Stock</CardTitle>
              <CardDescription>Entradas y salidas del período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.stockMovements.map((movement: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {movement.type === "in" ? (
                        <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
                          <ArrowUpCircle className="w-5 h-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
                          <ArrowDownCircle className="w-5 h-5 text-red-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {movement.type === "in" ? "Entrada" : "Salida"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {movement.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${movement.type === "in" ? "text-green-600" : "text-red-600"}`}
                      >
                        {movement.type === "in" ? "+" : "-"}
                        {movement.quantity} unidades
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${movement.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Value by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Valor por Categoría</CardTitle>
              <CardDescription>Distribución del inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.valueByCategory.map((cat: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          ${cat.value.toLocaleString()}
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

        {/* Stock Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Niveles de Stock</CardTitle>
            <CardDescription>Estado actual del inventario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.stockLevels.map((item: any) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <Badge variant="outline">{item.category}</Badge>
                        <span>Min: {item.minStock}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Stock Actual
                      </p>
                      <p className="font-bold text-lg">{item.currentStock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-bold text-lg text-green-600">
                        ${item.value.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-24">{getStatusBadge(item.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Moving Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Productos de Mayor Movimiento</CardTitle>
              <CardDescription>Top 5 productos más activos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.topMovingProducts.map((product: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
                        <span className="font-bold text-green-600">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.movements} movimientos
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-green-600">
                      ${product.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos de Lento Movimiento</CardTitle>
              <CardDescription>
                Productos con mayor tiempo en stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.slowMovingProducts.map(
                  (product: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.daysInStock} días en stock
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-orange-600">
                        ${product.value.toLocaleString()}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant */}
        <ModuleAIAssistant
          moduleName="Reportes de Inventario"
          suggestions={[
            "Analizar productos con bajo movimiento",
            "Sugerir cantidades de reorden",
            "Identificar productos obsoletos",
            "Optimizar niveles de stock",
          ]}
        />
      </div>
    </ValeryLayout>
  );
};

export default InventoryReportsPage;
