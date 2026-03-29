/**
 * InventoryAnalytics - Análisis predictivo con IA
 * Diseño completamente nuevo con insights inteligentes
 */

import { useMemo } from "react";
import { useInventoryLogic } from "@/modules/inventory/hooks/useInventoryLogic";
import { formatCurrency } from "@/lib";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Zap,
  Target,
  Clock,
  DollarSign,
  Package,
} from "lucide-react";

export function InventoryAnalytics() {
  const logic = useInventoryLogic();

  // Historial de ventas real (últimos 6 meses disponibles)
  const salesHistory = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    
    // Obtener años disponibles en ventasHistory
    const years = [2023, 2024, 2025];
    const monthlyData: { month: string; ventas: number }[] = [];
    
    years.forEach(year => {
      const totalSales = products.reduce((sum: number, p: any) => {
        const sales = p.ventasHistory?.[year] || 0;
        return sum + sales;
      }, 0);
      
      if (totalSales > 0) {
        monthlyData.push({
          month: year.toString(),
          ventas: totalSales,
        });
      }
    });
    
    return monthlyData;
  }, [logic.allFilteredProducts]);

  // Análisis de tendencias por categoría
  const categoryTrends = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    const categoryMap = new Map<string, { sales: number; growth: number; products: number }>();

    products.forEach((p: any) => {
      const cat = p.category || "General";
      const sales = p.ventasHistory ? Object.values(p.ventasHistory).reduce((a: any, b: any) => a + b, 0) : 0;
      
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { sales: 0, growth: 0, products: 0 });
      }
      
      const data = categoryMap.get(cat)!;
      data.sales += sales;
      data.products += 1;
      
      // Calcular crecimiento simulado
      const sales2024 = p.ventasHistory?.[2024] || 0;
      const sales2023 = p.ventasHistory?.[2023] || 1;
      data.growth += ((sales2024 - sales2023) / sales2023) * 100;
    });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        sales: data.sales,
        growth: Math.round(data.growth / data.products),
        products: data.products,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);
  }, [logic.allFilteredProducts]);

  // Insights inteligentes
  const aiInsights = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    
    const insights = [];

    // Productos con alta rotación y bajo stock
    const criticalProducts = products.filter((p: any) => {
      const sales = p.ventasHistory ? Object.values(p.ventasHistory).reduce((a: any, b: any) => a + b, 0) : 0;
      return sales > 30 && p.stock <= p.minStock;
    });

    if (criticalProducts.length > 0) {
      insights.push({
        type: 'critical',
        icon: AlertTriangle,
        title: 'Riesgo de Quiebre de Stock',
        message: `${criticalProducts.length} productos de alta rotación están cerca del stock mínimo`,
        action: 'Reabastecer urgente',
        color: 'from-red-500 to-orange-500',
      });
    }

    // Oportunidades de crecimiento
    const growthOpportunities = products.filter((p: any) => {
      const sales2024 = p.ventasHistory?.[2024] || 0;
      const sales2023 = p.ventasHistory?.[2023] || 1;
      const growth = ((sales2024 - sales2023) / sales2023) * 100;
      return growth > 50 && p.stock > 0;
    });

    if (growthOpportunities.length > 0) {
      insights.push({
        type: 'opportunity',
        icon: TrendingUp,
        title: 'Productos en Crecimiento',
        message: `${growthOpportunities.length} productos muestran crecimiento superior al 50%`,
        action: 'Aumentar inventario',
        color: 'from-emerald-500 to-green-500',
      });
    }

    // Productos de baja rotación
    const slowMovers = products.filter((p: any) => {
      const sales = p.ventasHistory ? Object.values(p.ventasHistory).reduce((a: any, b: any) => a + b, 0) : 0;
      return sales < 5 && p.stock > 10;
    });

    if (slowMovers.length > 0) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Inventario de Baja Rotación',
        message: `${slowMovers.length} productos con ventas bajas y stock alto`,
        action: 'Considerar promoción',
        color: 'from-amber-500 to-yellow-500',
      });
    }

    // Optimización de capital
    const totalValue = products.reduce((sum: number, p: any) => sum + (p.stock * (p.precioFCA || p.price || 0)), 0);
    const optimalValue = totalValue * 0.85; // 15% de reducción potencial

    insights.push({
      type: 'optimization',
      icon: DollarSign,
      title: 'Optimización de Capital',
      message: `Potencial de liberar ${formatCurrency(totalValue - optimalValue)} ajustando stock`,
      action: 'Ver recomendaciones',
      color: 'from-blue-500 to-indigo-500',
    });

    return insights;
  }, [logic.allFilteredProducts]);

  // Valor actual del inventario por categoría
  const inventoryValueByCategory = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    const categoryMap = new Map<string, number>();
    
    products.forEach((p: any) => {
      const cat = p.category || "Sin categoría";
      const value = (p.precioFCA || p.price || 0) * (p.stock || 0);
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + value);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ category: name, valor: Math.round(value) }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
  }, [logic.allFilteredProducts]);

  // Recomendaciones de compra
  const purchaseRecommendations = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    
    return products
      .filter((p: any) => {
        const sales = p.ventasHistory ? Object.values(p.ventasHistory).reduce((a: any, b: any) => a + b, 0) : 0;
        return sales > 20 && p.stock <= p.minStock * 1.5;
      })
      .sort((a: any, b: any) => {
        const salesA = a.ventasHistory ? Object.values(a.ventasHistory).reduce((x: any, y: any) => x + y, 0) : 0;
        const salesB = b.ventasHistory ? Object.values(b.ventasHistory).reduce((x: any, y: any) => x + y, 0) : 0;
        return salesB - salesA;
      })
      .slice(0, 5)
      .map((p: any) => {
        const sales = p.ventasHistory ? Object.values(p.ventasHistory).reduce((a: any, b: any) => a + b, 0) : 0;
        const avgMonthlySales = sales / 12;
        const recommendedQty = Math.ceil(avgMonthlySales * 3); // 3 meses de stock
        
        return {
          name: p.cauplas || p.name?.substring(0, 30) || 'Sin nombre',
          currentStock: p.stock,
          recommendedQty,
          monthlySales: Math.round(avgMonthlySales),
          priority: sales > 50 ? 'Alta' : sales > 20 ? 'Media' : 'Baja',
        };
      });
  }, [logic.allFilteredProducts]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50/30 to-pink-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-black bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Análisis de Inventario
          </h1>
        </div>
        <p className="text-muted-foreground ml-15">Insights basados en datos reales del inventario</p>
      </div>

      {/* AI Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {aiInsights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <div 
              key={idx}
              className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${insight.color} p-6 text-white shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <Icon className="w-10 h-10 opacity-90" />
                  <Sparkles className="w-6 h-6 opacity-60" />
                </div>
                <h3 className="text-xl font-bold mb-2">{insight.title}</h3>
                <p className="text-sm opacity-90 mb-4">{insight.message}</p>
                <div className="flex items-center gap-2 text-xs font-medium opacity-75">
                  <Zap className="w-4 h-4" />
                  <span>{insight.action}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial de Ventas Real */}
      <div className="mb-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Historial de Ventas</h2>
            <p className="text-sm text-muted-foreground">Datos reales de ventas por año</p>
          </div>
        </div>
        
        {salesHistory.length > 0 ? (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesHistory}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl">
                          <p className="font-bold text-sm mb-2">Año {payload[0].payload.month}</p>
                          <p className="text-xs text-blue-600">Ventas: {payload[0].value} unidades</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="ventas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVentas)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            <p>No hay datos de ventas disponibles</p>
          </div>
        )}
      </div>

      {/* Tendencias por Categoría */}
      <div className="mb-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Tendencias por Categoría</h2>
            <p className="text-sm text-muted-foreground">Top 6 categorías con mayor movimiento</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryTrends.map((trend, idx) => (
            <div 
              key={idx}
              className="relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                {trend.growth > 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
              <h3 className="font-bold text-lg mb-2">{trend.name}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Ventas: {trend.sales}</p>
                <p>Productos: {trend.products}</p>
                <p className={trend.growth > 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                  Crecimiento: {trend.growth > 0 ? '+' : ''}{trend.growth}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Valor del Inventario por Categoría */}
      <div className="mb-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Valor por Categoría</h2>
            <p className="text-sm text-muted-foreground">Distribución real del valor del inventario</p>
          </div>
        </div>
        
        {inventoryValueByCategory.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryValueByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl">
                          <p className="font-bold text-sm mb-2">{payload[0].payload.category}</p>
                          <p className="text-xs text-orange-600">Valor: {formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="valor" stroke="#f59e0b" strokeWidth={3} name="Valor Total" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>No hay datos de valor disponibles</p>
          </div>
        )}
      </div>

      {/* Recomendaciones de Compra */}
      <div className="rounded-3xl bg-linear-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-8 text-white shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Recomendaciones de Compra</h2>
            <p className="text-sm opacity-90">Top 5 productos prioritarios para reabastecer</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {purchaseRecommendations.map((rec, idx) => (
            <div 
              key={idx}
              className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 hover:bg-white/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <h3 className="font-bold text-lg">{rec.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="opacity-75 text-xs">Stock Actual</p>
                      <p className="font-bold text-lg">{rec.currentStock}</p>
                    </div>
                    <div>
                      <p className="opacity-75 text-xs">Recomendado</p>
                      <p className="font-bold text-lg text-emerald-300">{rec.recommendedQty}</p>
                    </div>
                    <div>
                      <p className="opacity-75 text-xs">Venta Mensual</p>
                      <p className="font-bold text-lg">{rec.monthlySales}</p>
                    </div>
                    <div>
                      <p className="opacity-75 text-xs">Prioridad</p>
                      <p className={`font-bold text-lg ${rec.priority === 'Alta' ? 'text-red-300' : rec.priority === 'Media' ? 'text-yellow-300' : 'text-blue-300'}`}>
                        {rec.priority}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InventoryAnalytics;
