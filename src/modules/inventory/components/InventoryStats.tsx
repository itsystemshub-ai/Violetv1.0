/**
 * InventoryStats - Visualización innovadora con Treemap y Radar Chart
 * Diseño completamente nuevo con visualizaciones avanzadas
 */

import { useMemo } from "react";
import { useInventoryLogic } from "@/modules/inventory/hooks/useInventoryLogic";
import { formatCurrency } from "@/lib";
import { 
  Treemap,
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Cell,
} from "recharts";
import {
  Network,
  Layers,
  Zap,
  Target,
  Activity,
} from "lucide-react";

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];

export function InventoryStats() {
  const logic = useInventoryLogic();

  // Treemap Data - Valor por categoría con jerarquía
  const treemapData = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    const categoryMap = new Map<string, { name: string; value: number; children: any[] }>();

    products.forEach((p: any) => {
      const cat = p.category || "Sin categoría";
      const value = (p.precioFCA || p.price || 0) * (p.stock || 0);
      
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { name: cat, value: 0, children: [] });
      }
      
      const catData = categoryMap.get(cat)!;
      catData.value += value;
      
      if (catData.children.length < 10) {
        catData.children.push({
          name: p.cauplas || p.name?.substring(0, 20) || 'Sin nombre',
          value: value,
          size: p.stock,
        });
      }
    });

    return {
      name: "Inventario",
      children: Array.from(categoryMap.values()).sort((a, b) => b.value - a.value),
    };
  }, [logic.allFilteredProducts]);

  // Radar Chart - Análisis multidimensional
  const radarData = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    
    const metrics = {
      rotacion: 0,
      valor: 0,
      disponibilidad: 0,
      diversidad: 0,
      eficiencia: 0,
    };

    // Rotación (ventas promedio)
    const avgSales = products.reduce((sum: number, p: any) => {
      const sales = p.ventasHistory ? Object.values(p.ventasHistory).reduce((a: any, b: any) => a + b, 0) : 0;
      return sum + sales;
    }, 0) / (products.length || 1);
    metrics.rotacion = Math.min(100, (avgSales / 50) * 100);

    // Valor (valor total normalizado)
    const totalValue = products.reduce((sum: number, p: any) => sum + (p.stock * (p.precioFCA || p.price || 0)), 0);
    metrics.valor = Math.min(100, (totalValue / 1000000) * 100);

    // Disponibilidad (% productos con stock)
    const inStock = products.filter((p: any) => p.stock > 0).length;
    metrics.disponibilidad = (inStock / (products.length || 1)) * 100;

    // Diversidad (número de categorías)
    const categories = new Set(products.map((p: any) => p.category));
    metrics.diversidad = Math.min(100, (categories.size / 20) * 100);

    // Eficiencia (% productos sobre stock mínimo)
    const efficient = products.filter((p: any) => p.stock > p.minStock).length;
    metrics.eficiencia = (efficient / (products.length || 1)) * 100;

    return [
      { metric: 'Rotación', value: Math.round(metrics.rotacion), fullMark: 100 },
      { metric: 'Valor', value: Math.round(metrics.valor), fullMark: 100 },
      { metric: 'Disponibilidad', value: Math.round(metrics.disponibilidad), fullMark: 100 },
      { metric: 'Diversidad', value: Math.round(metrics.diversidad), fullMark: 100 },
      { metric: 'Eficiencia', value: Math.round(metrics.eficiencia), fullMark: 100 },
    ];
  }, [logic.allFilteredProducts]);

  // Scatter Plot - Relación Precio vs Stock
  const scatterData = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    return products.slice(0, 100).map((p: any) => ({
      x: p.stock || 0,
      y: p.precioFCA || p.price || 0,
      z: (p.stock || 0) * (p.precioFCA || p.price || 0),
      name: p.cauplas || p.name?.substring(0, 15) || 'Sin nombre',
      category: p.category,
    }));
  }, [logic.allFilteredProducts]);

  // Network Stats - Conexiones entre categorías y marcas
  const networkStats = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    const connections = new Map<string, number>();

    products.forEach((p: any) => {
      const cat = p.category || "General";
      const brand = p.cauplas ? "Cauplas" : p.torflex ? "Torflex" : p.indomax ? "Indomax" : "OEM";
      const key = `${cat}-${brand}`;
      connections.set(key, (connections.get(key) || 0) + 1);
    });

    return Array.from(connections.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, value]) => {
        const [cat, brand] = key.split('-');
        return { category: cat, brand, connections: value };
      });
  }, [logic.allFilteredProducts]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Estadísticas Avanzadas
        </h1>
        <p className="text-muted-foreground">Visualizaciones innovadoras del inventario</p>
      </div>

      {/* Radar Chart - Análisis Multidimensional */}
      <div className="mb-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Análisis Multidimensional</h2>
            <p className="text-sm text-muted-foreground">Métricas clave del inventario</p>
          </div>
        </div>
        
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 14, fontWeight: 600 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Radar 
                name="Métricas" 
                dataKey="value" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.6}
                strokeWidth={3}
              />
              <Tooltip 
                content={({ payload }) => {
                  if (payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl">
                        <p className="font-bold text-sm mb-1">{payload[0].payload.metric}</p>
                        <p className="text-2xl font-black text-purple-600">{payload[0].value}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Treemap - Distribución de Valor */}
      <div className="mb-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mapa de Valor por Categoría</h2>
            <p className="text-sm text-muted-foreground">Distribución jerárquica del inventario</p>
          </div>
        </div>
        
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData.children}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
            >
              <Tooltip 
                content={({ payload }) => {
                  if (payload && payload.length && payload[0].payload) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl">
                        <p className="font-bold text-sm mb-2">{data.name}</p>
                        <p className="text-xs text-muted-foreground">Valor: {formatCurrency(data.value)}</p>
                        {data.children && (
                          <p className="text-xs text-muted-foreground mt-1">Productos: {data.children.length}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {treemapData.children.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scatter Plot - Precio vs Stock */}
      <div className="mb-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Relación Precio vs Stock</h2>
            <p className="text-sm text-muted-foreground">Análisis de dispersión (top 100 productos)</p>
          </div>
        </div>
        
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Stock" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: 'Stock', position: 'insideBottom', offset: -10, fill: '#64748b' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Precio" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: 'Precio', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <ZAxis type="number" dataKey="z" range={[50, 400]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl">
                        <p className="font-bold text-sm mb-2">{data.name}</p>
                        <p className="text-xs text-muted-foreground">Stock: {data.x}</p>
                        <p className="text-xs text-muted-foreground">Precio: {formatCurrency(data.y)}</p>
                        <p className="text-xs text-muted-foreground">Valor Total: {formatCurrency(data.z)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Productos" data={scatterData} fill="#f59e0b">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Network Stats - Conexiones Categoría-Marca */}
      <div className="rounded-3xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Network className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Red de Conexiones</h2>
            <p className="text-sm opacity-90">Top 8 relaciones Categoría-Marca</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {networkStats.map((stat, idx) => (
            <div 
              key={idx}
              className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="text-4xl font-black mb-2">{stat.connections}</div>
                <div className="text-sm font-medium opacity-90">{stat.category}</div>
                <div className="text-xs opacity-75 mt-1">{stat.brand}</div>
              </div>
              <Zap className="absolute bottom-2 right-2 w-8 h-8 opacity-10 group-hover:opacity-30 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InventoryStats;
