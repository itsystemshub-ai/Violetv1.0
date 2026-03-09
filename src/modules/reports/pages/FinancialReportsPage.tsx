/**
 * FinancialReportsPage - Reportes y Análisis Financieros (Modular)
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
  DollarSign,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Wallet,
  CreditCard,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useFinancialReports } from "@/modules/reports/hooks/useFinancialReports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export const FinancialReportsPage = () => {
  const {
    report,
    loading,
    periodFilter,
    setPeriodFilter,
    exportReport,
    compareWithPreviousPeriod,
    calculateFinancialRatios,
  } = useFinancialReports();

  const comparison = compareWithPreviousPeriod();
  const ratios = calculateFinancialRatios();

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
      label: "Gastos Totales",
      value: `$${report.totalExpenses.toLocaleString()}`,
      icon: CreditCard,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
      growth: comparison.expensesGrowth,
    },
    {
      label: "Utilidad Neta",
      value: `$${report.netProfit.toLocaleString()}`,
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      growth: comparison.profitGrowth,
    },
    {
      label: "Margen de Utilidad",
      value: `${report.profitMargin}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      growth: comparison.marginImprovement,
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
              <PieChart className="w-8 h-8 text-primary" />
              Reportes Financieros
            </h1>
            <p className="text-muted-foreground mt-1">
              Análisis y métricas de rendimiento financiero
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

        {/* Financial Ratios */}
        {ratios && (
          <Card>
            <CardHeader>
              <CardTitle>Ratios Financieros</CardTitle>
              <CardDescription>
                Indicadores clave de salud financiera
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Razón Corriente
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {ratios.currentRatio}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Razón Rápida</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {ratios.quickRatio}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Deuda/Capital</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {ratios.debtToEquity}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">ROA</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {ratios.returnOnAssets}%
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">ROE</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {ratios.returnOnEquity}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Flujo de Efectivo</CardTitle>
            <CardDescription>
              Movimientos de entrada y salida del período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.cashFlow.map((flow, index) => {
                const maxAmount = Math.max(
                  ...report.cashFlow.map((f: any) =>
                    Math.max(f.income, f.expenses),
                  ),
                );
                const incomePercentage = (flow.income / maxAmount) * 100;
                const expensesPercentage = (flow.expenses / maxAmount) * 100;

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{flow.date}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-green-600">
                          +${flow.income.toLocaleString()}
                        </span>
                        <span className="text-red-600">
                          -${flow.expenses.toLocaleString()}
                        </span>
                        <span
                          className={`font-bold ${flow.netFlow >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          ${flow.netFlow.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 rounded-full h-2 transition-all"
                            style={{ width: `${incomePercentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-red-500 rounded-full h-2 transition-all"
                            style={{ width: `${expensesPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Profit & Loss */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Resultados</CardTitle>
              <CardDescription>Ingresos y gastos del período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600 flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4" />
                    Ingresos
                  </h4>
                  {report.profitLoss
                    .filter((item: any) => item.type === "income")
                    .map((item: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">
                              ${item.amount.toLocaleString()}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 dark:bg-green-950"
                            >
                              {item.percentage}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 rounded-full h-2 transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-red-600 flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4" />
                    Gastos
                  </h4>
                  {report.profitLoss
                    .filter((item: any) => item.type === "expense")
                    .map((item: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600">
                              ${item.amount.toLocaleString()}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 dark:bg-red-950"
                            >
                              {item.percentage}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-red-500 rounded-full h-2 transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Balance General</CardTitle>
              <CardDescription>
                Comparación con período anterior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.balanceSheet.map((item: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.category}</span>
                      <div className="flex items-center gap-2">
                        {item.changePercentage > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : item.changePercentage < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-gray-600" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            item.changePercentage > 0
                              ? "text-green-600"
                              : item.changePercentage < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {item.changePercentage > 0 ? "+" : ""}
                          {item.changePercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">Actual</p>
                        <p className="font-bold text-lg">
                          ${item.current.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Anterior</p>
                        <p className="font-medium">
                          ${item.previous.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Expenses Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por Fuente</CardTitle>
              <CardDescription>Distribución de ingresos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.revenueBySource.map((source: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{source.source}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">
                          ${source.amount.toLocaleString()}
                        </span>
                        <Badge variant="outline">{source.percentage}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 rounded-full h-2 transition-all"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoría</CardTitle>
              <CardDescription>Distribución de gastos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.expensesByCategory.map(
                  (expense: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{expense.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600">
                            ${expense.amount.toLocaleString()}
                          </span>
                          <Badge variant="outline">
                            {expense.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-red-500 rounded-full h-2 transition-all"
                          style={{ width: `${expense.percentage}%` }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant */}
        <ModuleAIAssistant
          moduleName="Reportes Financieros"
          suggestions={[
            "Analizar tendencias de rentabilidad",
            "Identificar áreas de reducción de costos",
            "Proyectar flujo de efectivo futuro",
            "Sugerir estrategias de optimización financiera",
          ]}
        />
      </div>
    </ValeryLayout>
  );
};

export default FinancialReportsPage;
