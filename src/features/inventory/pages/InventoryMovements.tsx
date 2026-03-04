import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  ShoppingCart,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib";
import { localDb } from "@/lib/localDb";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const InventoryMovements: React.FC = () => {
  const { activeTenantId } = useSystemConfig();
  const [movements, setMovements] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sale" | "purchase" | "return" | "adjustment">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMovements();
  }, [activeTenantId]);

  const loadMovements = async () => {
    if (!activeTenantId) return;

    setIsLoading(true);
    try {
      const data = await localDb.inventory_movements
        .where("tenant_id")
        .equals(activeTenantId)
        .reverse()
        .limit(500)
        .toArray();

      setMovements(data);
    } catch (error) {
      toast.error("Error al cargar movimientos");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const sales = movements.filter((m) => m.type === "sale");
    const purchases = movements.filter((m) => m.type === "purchase");
    const returns = movements.filter((m) => m.type === "return");
    const adjustments = movements.filter((m) => m.type === "adjustment");

    return {
      totalMovements: movements.length,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      returnsCount: returns.length,
      adjustmentsCount: adjustments.length,
      totalSold: sales.reduce((sum, m) => sum + Math.abs(m.quantity), 0),
      totalPurchased: purchases.reduce((sum, m) => sum + m.quantity, 0),
    };
  }, [movements]);

  const filteredMovements = useMemo(() => {
    let filtered = movements;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.reference_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (filterType !== "all") {
      filtered = filtered.filter((m) => m.type === filterType);
    }

    return filtered;
  }, [movements, searchTerm, filterType]);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      case "purchase":
        return <ArrowUpCircle className="h-5 w-5 text-emerald-500" />;
      case "return":
        return <RotateCcw className="h-5 w-5 text-blue-500" />;
      case "adjustment":
        return <RefreshCw className="h-5 w-5 text-amber-500" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case "sale":
        return (
          <Badge variant="destructive" className="gap-1">
            <ShoppingCart className="h-3 w-3" />
            Venta
          </Badge>
        );
      case "purchase":
        return (
          <Badge variant="default" className="bg-emerald-500 gap-1">
            <TrendingUp className="h-3 w-3" />
            Compra
          </Badge>
        );
      case "return":
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white gap-1">
            <RotateCcw className="h-3 w-3" />
            Devolución
          </Badge>
        );
      case "adjustment":
        return (
          <Badge variant="secondary" className="bg-amber-500 text-white gap-1">
            <RefreshCw className="h-3 w-3" />
            Ajuste
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative pb-12 animate-in fade-in duration-1000">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

      <div className="space-y-8 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/30">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground drop-shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              Movimientos de Inventario
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Historial completo de entradas y salidas de stock
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl h-12 px-6 font-black uppercase italic tracking-widest text-xs gap-2"
              onClick={() => toast.info("Exportación en desarrollo")}
            >
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-xl bg-card rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Total Movimientos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black italic">{stats.totalMovements}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 500 registros
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Ventas
              </CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black italic text-red-500">
                {stats.totalSold}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.salesCount} movimientos
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Compras
              </CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black italic text-emerald-500">
                {stats.totalPurchased}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.purchasesCount} movimientos
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Devoluciones
              </CardTitle>
              <RotateCcw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black italic text-blue-500">
                {stats.returnsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Facturas eliminadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-xl bg-card rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por producto o referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-2xl"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  className="rounded-xl"
                >
                  Todos
                </Button>
                <Button
                  variant={filterType === "sale" ? "default" : "outline"}
                  onClick={() => setFilterType("sale")}
                  className="rounded-xl"
                >
                  Ventas
                </Button>
                <Button
                  variant={filterType === "purchase" ? "default" : "outline"}
                  onClick={() => setFilterType("purchase")}
                  className="rounded-xl"
                >
                  Compras
                </Button>
                <Button
                  variant={filterType === "return" ? "default" : "outline"}
                  onClick={() => setFilterType("return")}
                  className="rounded-xl"
                >
                  Devoluciones
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Movements List */}
        <Card className="border-none shadow-xl bg-card rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-black italic tracking-tighter uppercase">
              Historial de Movimientos
            </CardTitle>
            <CardDescription>
              {filteredMovements.length} movimiento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredMovements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-bold text-muted-foreground">
                      No se encontraron movimientos
                    </p>
                  </div>
                ) : (
                  filteredMovements.map((movement) => (
                    <Card
                      key={movement.id}
                      className="border-2 border-border/40 transition-all hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              {getMovementIcon(movement.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-black">
                                  {movement.product_name}
                                </h3>
                                {getMovementBadge(movement.type)}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  <FileText className="h-3 w-3 inline mr-1" />
                                  {movement.reference_id || "---"}
                                </span>
                                <span>{formatDate(movement.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={cn(
                                "text-2xl font-black italic",
                                movement.quantity > 0
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              )}
                            >
                              {movement.quantity > 0 ? "+" : ""}
                              {movement.quantity}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {movement.previous_stock} → {movement.new_stock}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryMovements;
