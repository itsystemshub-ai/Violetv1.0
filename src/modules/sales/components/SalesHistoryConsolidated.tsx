import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { 
  Search, 
  TrendingUp, 
  TrendingDown,
  Package,
  DollarSign,
  BarChart3,
  Download,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { localDb } from "@/core/database/localDb";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type TimeFilter = "month" | "quarter" | "year" | "all";
type SortField = "name" | "total" | "trend" | "lastSale";
type SortOrder = "asc" | "desc";

export const SalesHistoryConsolidated = () => {
  const { activeTenantId } = useSystemConfig();
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("year");
  const [sortField, setSortField] = useState<SortField>("total");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTenantId]);

  const loadData = async () => {
    if (!activeTenantId) return;

    setIsLoading(true);
    try {
      const [productsData, movementsData] = await Promise.all([
        localDb.products.where("tenant_id").equals(activeTenantId).toArray(),
        localDb.inventory_movements
          .where("tenant_id")
          .equals(activeTenantId)
          .and((m) => m.type === "sale")
          .toArray(),
      ]);

      setProducts(productsData);
      setMovements(movementsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estadísticas por producto
  const productStats = useMemo(() => {
    return products.map((product) => {
      const productMovements = movements.filter((m) => m.product_id === product.id);
      
      // Calcular ventas por período
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentQuarter = Math.floor(currentMonth / 3);

      // Ventas del período actual según filtro
      let currentPeriodSales = 0;
      let previousPeriodSales = 0;

      if (timeFilter === "month") {
        // Mes actual vs mes anterior
        currentPeriodSales = productMovements
          .filter((m) => {
            const date = new Date(m.created_at);
            return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
          })
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

        previousPeriodSales = productMovements
          .filter((m) => {
            const date = new Date(m.created_at);
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return date.getFullYear() === prevYear && date.getMonth() === prevMonth;
          })
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      } else if (timeFilter === "quarter") {
        // Trimestre actual vs trimestre anterior
        currentPeriodSales = productMovements
          .filter((m) => {
            const date = new Date(m.created_at);
            const quarter = Math.floor(date.getMonth() / 3);
            return date.getFullYear() === currentYear && quarter === currentQuarter;
          })
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

        previousPeriodSales = productMovements
          .filter((m) => {
            const date = new Date(m.created_at);
            const quarter = Math.floor(date.getMonth() / 3);
            const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
            const prevYear = currentQuarter === 0 ? currentYear - 1 : currentYear;
            return date.getFullYear() === prevYear && quarter === prevQuarter;
          })
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      } else if (timeFilter === "year") {
        // Año actual vs año anterior
        currentPeriodSales = productMovements
          .filter((m) => new Date(m.created_at).getFullYear() === currentYear)
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

        previousPeriodSales = productMovements
          .filter((m) => new Date(m.created_at).getFullYear() === currentYear - 1)
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      } else {
        // Todo el tiempo
        currentPeriodSales = productMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      }

      // Calcular tendencia
      const trend = previousPeriodSales > 0
        ? ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100
        : currentPeriodSales > 0 ? 100 : 0;

      // Última venta
      const lastSale = productMovements.length > 0
        ? new Date(productMovements[productMovements.length - 1].created_at)
        : null;

      // Ventas por año (histórico)
      // Primero intentar obtener de movimientos
      let salesByYear = {
        2023: productMovements
          .filter((m) => new Date(m.created_at).getFullYear() === 2023)
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
        2024: productMovements
          .filter((m) => new Date(m.created_at).getFullYear() === 2024)
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
        2025: productMovements
          .filter((m) => new Date(m.created_at).getFullYear() === 2025)
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
        2026: productMovements
          .filter((m) => new Date(m.created_at).getFullYear() === 2026)
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
      };

      // NUEVO: Si no hay movimientos, usar datos históricos de inventario
      // La columna "VENTAS" en inventario suma 2023+2024+2025
      // Dividir ese total entre 3 y cargar en cada año
      const historicalSalesTotal = (product.ventasHistory?.[2023] || 0) + 
                                   (product.ventasHistory?.[2024] || 0) + 
                                   (product.ventasHistory?.[2025] || 0);
      
      const historicalAverage = historicalSalesTotal > 0 ? Math.round(historicalSalesTotal / 3) : 0;

      // Si no hay movimientos registrados, dividir el total histórico entre 3
      if (productMovements.length === 0 && historicalSalesTotal > 0) {
        salesByYear[2023] = historicalAverage;
        salesByYear[2024] = historicalAverage;
        salesByYear[2025] = historicalAverage;
        
        // Si estamos en filtro "all", usar el total histórico
        if (timeFilter === "all") {
          currentPeriodSales = historicalSalesTotal;
        }
      }

      const totalSales = currentPeriodSales;
      const totalRevenue = totalSales * (product.precioFCA || product.price || 0);

      return {
        ...product,
        currentPeriodSales,
        previousPeriodSales,
        trend,
        lastSale,
        salesByYear,
        totalSales,
        totalRevenue,
        historicalAverage, // Promedio de los 3 años
        historicalSalesTotal, // Total de los 3 años
      };
    });
  }, [products, movements, timeFilter]);

  // Filtrar y ordenar productos
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = productStats;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.cauplas?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.torflex?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.indomax?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "total":
          comparison = a.totalSales - b.totalSales;
          break;
        case "trend":
          comparison = a.trend - b.trend;
          break;
        case "lastSale":
          const aDate = a.lastSale ? a.lastSale.getTime() : 0;
          const bDate = b.lastSale ? b.lastSale.getTime() : 0;
          comparison = aDate - bDate;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [productStats, searchQuery, sortField, sortOrder]);

  // Estadísticas generales
  const overallStats = useMemo(() => {
    const totalProducts = filteredAndSortedProducts.length;
    const totalSales = filteredAndSortedProducts.reduce((sum, p) => sum + p.totalSales, 0);
    const totalRevenue = filteredAndSortedProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
    const productsWithSales = filteredAndSortedProducts.filter((p) => p.totalSales > 0).length;
    const productsWithoutSales = totalProducts - productsWithSales;
    const avgSalesPerProduct = totalProducts > 0 ? totalSales / totalProducts : 0;

    return {
      totalProducts,
      totalSales,
      totalRevenue,
      productsWithSales,
      productsWithoutSales,
      avgSalesPerProduct,
    };
  }, [filteredAndSortedProducts]);

  // Calcular ventas por período
  const calculateSales = (productId: string, filter: TimeFilter) => {
    const now = new Date();
    const productMovements = movements.filter((m) => m.product_id === productId);

    switch (filter) {
      case "day": {
        // Últimos 365 días
        const days = Array.from({ length: 365 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          return date.toISOString().split("T")[0];
        });

        return days.map((day) => {
          const sales = productMovements
            .filter((m) => m.created_at.startsWith(day))
            .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
          return { period: day, sales };
        });
      }

      case "week": {
        // Últimas 52 semanas
        const weeks = Array.from({ length: 52 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - i * 7);
          const weekNum = getWeekNumber(date);
          return { year: date.getFullYear(), week: weekNum };
        });

        return weeks.map(({ year, week }) => {
          const sales = productMovements
            .filter((m) => {
              const mDate = new Date(m.created_at);
              return (
                mDate.getFullYear() === year && getWeekNumber(mDate) === week
              );
            })
            .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
          return { period: `${year}-S${week}`, sales };
        });
      }

      case "month": {
        // Últimos 12 meses
        const months = Array.from({ length: 12 }, (_, i) => {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
          };
        });

        return months.map(({ year, month }) => {
          const sales = productMovements
            .filter((m) => {
              const mDate = new Date(m.created_at);
              return (
                mDate.getFullYear() === year && mDate.getMonth() + 1 === month
              );
            })
            .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
          return {
            period: `${year}-${String(month).padStart(2, "0")}`,
            sales,
          };
        });
      }

      case "year": {
        // Por año (2023, 2024, 2025)
        const years = [2023, 2024, 2025, 2026];
        return years.map((year) => {
          const sales = productMovements
            .filter((m) => new Date(m.created_at).getFullYear() === year)
            .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
          return { period: year.toString(), sales };
        });
      }

      default:
        return [];
    }
  };

  const getWeekNumber = (date: Date): number => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const getFilterLabel = (filter: TimeFilter) => {
    switch (filter) {
      case "month":
        return "Mes Actual";
      case "quarter":
        return "Trimestre Actual";
      case "year":
        return "Año Actual";
      case "all":
        return "Histórico Completo";
      default:
        return "";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "---";
    return new Intl.DateTimeFormat("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-xl bg-card rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Total Productos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black italic">{overallStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallStats.productsWithSales} con ventas
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Unidades Vendidas
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black italic text-emerald-500">
              {overallStats.totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getFilterLabel(timeFilter)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black italic text-blue-500">
              {formatCurrency(overallStats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getFilterLabel(timeFilter)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Promedio por Producto
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black italic">
              {overallStats.avgSalesPerProduct.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              unidades/producto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card className="border-none shadow-xl bg-card rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto, código CAUPLAS, Torflex o Indomax..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-2xl"
              />
            </div>
            <div className="flex gap-2">
              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mes Actual</SelectItem>
                  <SelectItem value="quarter">Trimestre Actual</SelectItem>
                  <SelectItem value="year">Año Actual</SelectItem>
                  <SelectItem value="all">Histórico Completo</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="rounded-2xl h-12 px-6 gap-2"
                onClick={() => {/* TODO: Exportar */}}
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Análisis */}
      <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black italic tracking-tighter uppercase text-primary">
                Análisis de Ventas por Producto
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase text-muted-foreground/60 tracking-wider">
                {getFilterLabel(timeFilter)} - {filteredAndSortedProducts.length} productos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="px-6 h-14 uppercase text-[10px] font-black w-[300px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => toggleSort("name")}
                      >
                        Producto
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center h-14 uppercase text-[10px] font-black">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => toggleSort("total")}
                      >
                        Ventas {getFilterLabel(timeFilter)}
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center h-14 uppercase text-[10px] font-black">
                      Ingresos
                    </TableHead>
                    <TableHead className="text-center h-14 uppercase text-[10px] font-black">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => toggleSort("trend")}
                      >
                        Tendencia
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center h-14 bg-blue-500/5 uppercase text-[10px] font-black">
                      2023
                    </TableHead>
                    <TableHead className="text-center h-14 bg-amber-500/5 uppercase text-[10px] font-black">
                      2024
                    </TableHead>
                    <TableHead className="text-center h-14 bg-emerald-500/5 uppercase text-[10px] font-black">
                      2025
                    </TableHead>
                    <TableHead className="text-center h-14 bg-purple-500/5 uppercase text-[10px] font-black">
                      2026
                    </TableHead>
                    <TableHead className="text-center h-14 bg-primary/10 uppercase text-[10px] font-black">
                      TOTAL
                    </TableHead>
                    <TableHead className="text-center h-14 bg-slate-500/5 uppercase text-[10px] font-black">
                      Promedio Histórico
                    </TableHead>
                    <TableHead className="text-center h-14 uppercase text-[10px] font-black">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => toggleSort("lastSale")}
                      >
                        Última Venta
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm font-bold text-muted-foreground">
                          No se encontraron productos
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black italic text-primary uppercase">
                              {product.cauplas || product.id}
                            </span>
                            <span className="text-[11px] font-bold uppercase line-clamp-1">
                              {product.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              Stock: {product.stock} | Min: {product.minStock}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-black italic text-emerald-600">
                              {product.totalSales}
                            </span>
                            {product.previousPeriodSales > 0 && (
                              <span className="text-[9px] text-muted-foreground">
                                vs {product.previousPeriodSales} anterior
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-bold text-blue-600">
                            {formatCurrency(product.totalRevenue)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {product.trend > 0 ? (
                              <>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-black text-emerald-500">
                                  +{product.trend.toFixed(1)}%
                                </span>
                              </>
                            ) : product.trend < 0 ? (
                              <>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-black text-red-500">
                                  {product.trend.toFixed(1)}%
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">
                                ---
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-black italic text-xs bg-blue-500/5 text-blue-600">
                          {product.salesByYear[2023]}
                        </TableCell>
                        <TableCell className="text-center font-black italic text-xs bg-amber-500/5 text-amber-600">
                          {product.salesByYear[2024]}
                        </TableCell>
                        <TableCell className="text-center font-black italic text-xs bg-emerald-500/5 text-emerald-600">
                          {product.salesByYear[2025]}
                        </TableCell>
                        <TableCell className="text-center font-black italic text-xs bg-purple-500/5 text-purple-600">
                          {product.salesByYear[2026]}
                        </TableCell>
                        <TableCell className="text-center bg-primary/10">
                          <span className="text-lg font-black italic text-primary">
                            {product.salesByYear[2023] + 
                             product.salesByYear[2024] + 
                             product.salesByYear[2025] + 
                             product.salesByYear[2026]}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black italic text-slate-600">
                              {product.historicalAverage}
                            </span>
                            {product.historicalSalesTotal > 0 && (
                              <span className="text-[9px] text-muted-foreground">
                                3 años: {product.historicalSalesTotal}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {formatDate(product.lastSale)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
