/**
 * InventoryStats - Estadísticas detalladas del inventario
 */

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useInventoryLogic } from "@/modules/inventory/hooks/useInventoryLogic";
import { formatCurrency } from "@/lib";
import { Package, TrendingUp, Layers } from "lucide-react";

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export function InventoryStats() {
  const logic = useInventoryLogic();

  const stats = useMemo(() => {
    const products = logic.allFilteredProducts || [];
    
    // Distribución por categoría
    const categoryDistribution = products.reduce((acc: any, p: any) => {
      const cat = p.category || "Sin categoría";
      if (!acc[cat]) {
        acc[cat] = { name: cat, count: 0, value: 0 };
      }
      acc[cat].count++;
      acc[cat].value += p.stock * p.price;
      return acc;
    }, {});
    
    const categoryData = Object.values(categoryDistribution);
    
    // Distribución por estado
    const statusDistribution = [
      {
        name: "Disponible",
        value: products.filter((p: any) => p.stock > p.minStock).length,
      },
      {
        name: "Stock Bajo",
        value: products.filter((p: any) => p.stock <= p.minStock && p.stock > 0).length,
      },
      {
        name: "Agotado",
        value: products.filter((p: any) => p.stock === 0).length,
      },
    ];
    
    // Top 10 productos por valor
    const topProducts = [...products]
      .sort((a: any, b: any) => (b.stock * b.price) - (a.stock * a.price))
      .slice(0, 10)
      .map((p: any) => ({
        name: p.name?.substring(0, 30) || 'Sin nombre',
        value: p.stock * p.price,
      }));
    
    return {
      categoryData,
      statusDistribution,
      topProducts,
    };
  }, [logic.allFilteredProducts]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Estadísticas de Inventario</h2>
        <p className="text-muted-foreground">
          Análisis estadístico y distribución del inventario
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Categoría */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Distribución por Categoría</CardTitle>
                <CardDescription>Valor por categoría de producto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-bold text-sm mb-1">{payload[0].payload.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Valor: {formatCurrency(payload[0].value as number)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Productos: {payload[0].payload.count}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución por Estado */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Distribución por Estado</CardTitle>
                <CardDescription>Estado actual del inventario</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Productos por Valor */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Top 10 Productos por Valor</CardTitle>
              <CardDescription>Productos con mayor valor en inventario</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-bold text-sm mb-1">{payload[0].payload.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Valor: {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
