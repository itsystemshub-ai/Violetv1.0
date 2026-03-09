/**
 * InventoryDashboard - Dashboard moderno con vista de mapa de calor
 */

import { useMemo } from "react";
import { useInventoryLogic } from "@/modules/inventory/hooks/useInventoryLogic";
import { formatCurrency } from "@/lib";
import { 
  Boxes, 
  Flame, 
  Snowflake, 
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from "lucide-react";

export function InventoryDashboard() {
  const logic = useInventoryLogic();

  const analysis = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    
    // Análisis de rotación
    const highRotation = products.filter((p: any) => {
      const sales = p.ventasHistory ? Object.values(p.ventasHistory).reduce((a: any, b: any) => a + b, 0) : 0;
      return sales > 50;
    });
    
    const mediumRotation = products.filter((p: any) => {
      const sales = p.ventasHistory ? Object.values(p.ventasHistory).reduce((a: any, b: any) => a + b, 0) : 0;
      return sales > 10 && sales <= 50;
    });
    
    const lowRotation = products.filter((p: any) => {
      const sales = p.ventasHistory ? Object.values(p.ventasHistory).reduce((a: any, b: any) => a + b, 0) : 0;
      return sales <= 10;
    });
    
    // Análisis de valor
    const totalValue = products.reduce((sum: number, p: any) => sum + (p.stock * p.price), 0);
    const avgValue = totalValue / (products.length || 1);
    
    // Productos críticos
    const critical = products.filter((p: any) => p.stock === 0);
    const warning = products.filter((p: any) => p.stock > 0 && p.stock <= p.minStock);
    const healthy = products.filter((p: any) => p.stock > p.minStock);
    
    return {
      highRotation,
      mediumRotation,
      lowRotation,
      totalValue,
      avgValue,
      critical,
      warning,
      healthy,
      total: products.length,
    };
  }, [logic.allFilteredProducts]);

  const healthScore = useMemo(() => {
    const total = analysis.total || 1;
    const score = (
      (analysis.healthy.length / total) * 60 +
      (analysis.warning.length / total) * 30 +
      (analysis.highRotation.length / total) * 10
    );
    return Math.round(score);
  }, [analysis]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Control de Inventario
            </h1>
            <p className="text-muted-foreground mt-1">Vista ejecutiva en tiempo real</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-orange-600">{healthScore}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Salud del Sistema</div>
          </div>
        </div>
      </div>

      {/* Mapa de Calor de Rotación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 p-6 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <Flame className="w-12 h-12 mb-4 opacity-90" />
          <div className="text-5xl font-black mb-2">{analysis.highRotation.length}</div>
          <div className="text-sm font-medium opacity-90">Alta Rotación</div>
          <div className="text-xs opacity-75 mt-1">Productos estrella</div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>+{Math.round((analysis.highRotation.length / analysis.total) * 100)}% del catálogo</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-yellow-500 p-6 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <Zap className="w-12 h-12 mb-4 opacity-90" />
          <div className="text-5xl font-black mb-2">{analysis.mediumRotation.length}</div>
          <div className="text-sm font-medium opacity-90">Rotación Media</div>
          <div className="text-xs opacity-75 mt-1">Productos estables</div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <Minus className="w-4 h-4" />
            <span>{Math.round((analysis.mediumRotation.length / analysis.total) * 100)}% del catálogo</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <Snowflake className="w-12 h-12 mb-4 opacity-90" />
          <div className="text-5xl font-black mb-2">{analysis.lowRotation.length}</div>
          <div className="text-sm font-medium opacity-90">Baja Rotación</div>
          <div className="text-xs opacity-75 mt-1">Requieren atención</div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <TrendingDown className="w-4 h-4" />
            <span>{Math.round((analysis.lowRotation.length / analysis.total) * 100)}% del catálogo</span>
          </div>
        </div>
      </div>

      {/* Estado del Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Boxes className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600">{analysis.healthy.length}</div>
          </div>
          <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Stock Saludable</div>
          <div className="text-xs text-muted-foreground mt-1">Por encima del mínimo</div>
          <div className="mt-4 h-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
              style={{ width: `${(analysis.healthy.length / analysis.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-orange-200 dark:border-orange-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Boxes className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-3xl font-black text-orange-600">{analysis.warning.length}</div>
          </div>
          <div className="text-sm font-bold text-orange-900 dark:text-orange-100">Stock Bajo</div>
          <div className="text-xs text-muted-foreground mt-1">Requiere reabastecimiento</div>
          <div className="mt-4 h-2 bg-orange-100 dark:bg-orange-900/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
              style={{ width: `${(analysis.warning.length / analysis.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Boxes className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-3xl font-black text-red-600">{analysis.critical.length}</div>
          </div>
          <div className="text-sm font-bold text-red-900 dark:text-red-100">Sin Stock</div>
          <div className="text-xs text-muted-foreground mt-1">Acción inmediata</div>
          <div className="mt-4 h-2 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
              style={{ width: `${(analysis.critical.length / analysis.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Valor del Inventario */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-90 mb-2">Valor Total del Inventario</div>
            <div className="text-6xl font-black mb-2">{formatCurrency(analysis.totalValue)}</div>
            <div className="text-sm opacity-75">Promedio por producto: {formatCurrency(analysis.avgValue)}</div>
          </div>
          <div className="text-right">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
              <TrendingUp className="w-12 h-12" />
            </div>
            <div className="text-xs opacity-75">Actualizado ahora</div>
          </div>
        </div>
      </div>
    </div>
  );
}
