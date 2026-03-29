import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Filter,
  Download,
  Calendar,
  Package,
  ArrowUpDown,
  TrendingUp,
  History,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { localDb } from "@/core/database/localDb";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type TimeRange = "day" | "week" | "month" | "year";

export const ProductSalesHistoryTab = () => {
  const { activeTenantId } = useSystemConfig();
  const { formatMoney } = useCurrencyStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!activeTenantId) return;
      setIsLoading(true);
      try {
        const data = await localDb.invoices
          .where("tenant_id")
          .equals(activeTenantId)
          .and((inv) => inv.type === "venta")
          .toArray();
        setInvoices(data);
      } catch (err) {
        console.error("Error loading sales history:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [activeTenantId]);

  // Lógica de Agregación Profesional
  const productStats = useMemo(() => {
    const stats: Record<string, any> = {};
    const now = new Date();

    invoices.forEach((inv) => {
      const invDate = new Date(inv.date);
      let isInRange = false;

      // Filtrar por tiempo
      if (timeRange === "day") {
        isInRange = format(invDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
      } else if (timeRange === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        isInRange = invDate >= oneWeekAgo;
      } else if (timeRange === "month") {
        isInRange =
          invDate.getMonth() === now.getMonth() &&
          invDate.getFullYear() === now.getFullYear();
      } else if (timeRange === "year") {
        isInRange = invDate.getFullYear() === now.getFullYear();
      }

      if (isInRange) {
        inv.items?.forEach((item: any) => {
          const key = item.product_id || item.id;
          if (!stats[key]) {
            stats[key] = {
              id: key,
              name: item.name || "Producto Desconocido",
              sku: item.sku || "N/A",
              quantity: 0,
              totalAmount: 0,
              lastSale: inv.date,
            };
          }
          stats[key].quantity += Number(item.quantity) || 0;
          stats[key].totalAmount +=
            Number(item.total) ||
            Number(item.price) * Number(item.quantity) ||
            0;
          if (new Date(inv.date) > new Date(stats[key].lastSale)) {
            stats[key].lastSale = inv.date;
          }
        });
      }
    });

    return Object.values(stats)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [invoices, timeRange, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters Header */}
      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-2xl bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-white/10 shadow-inner"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Select
                value={timeRange}
                onValueChange={(v) => setTimeRange(v as TimeRange)}
              >
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-white/10 overflow-hidden">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/20">
                  <SelectItem value="day">Hoy</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Mes en Curso</SelectItem>
                  <SelectItem value="year">Año Actual</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="h-12 w-12 rounded-2xl bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-white/10 shrink-0 shadow-sm"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border border-white/10">
        <CardHeader className="px-8 py-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black italic uppercase tracking-tight text-primary flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de Ventas Detallado
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Resumen de salida de productos en el periodo seleccionado
              </CardDescription>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-3 py-1">
              {productStats.length} Productos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="border-b border-white/5">
                  <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest h-14">
                    Producto
                  </TableHead>
                  <TableHead className="text-center font-black uppercase text-[10px] tracking-widest h-14">
                    Cantidad
                  </TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest h-14">
                    Total Monto
                  </TableHead>
                  <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest h-14">
                    Última Salida
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell
                        colSpan={4}
                        className="h-16 px-8 bg-muted/10"
                      />
                    </TableRow>
                  ))
                ) : productStats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-48 text-center bg-muted/5"
                    >
                      <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Sin movimientos reportados
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  productStats.map((stat) => (
                    <TableRow
                      key={stat.id}
                      className="hover:bg-primary/5 transition-all group"
                    >
                      <TableCell className="px-8 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-black italic text-sm text-foreground/90 uppercase">
                            {stat.name}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase">
                            SKU: {stat.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="font-black text-xs italic bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3"
                        >
                          {stat.quantity} unds
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-black text-base italic text-primary tracking-tight tabular-nums">
                          {formatMoney(stat.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          {format(new Date(stat.lastSale), "dd MMM, yyyy", {
                            locale: es,
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Bottom KPIs Summary for current view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">
            Monto Total Periodo
          </p>
          <p className="text-2xl font-black italic text-primary">
            {formatMoney(
              productStats.reduce((sum, p) => sum + p.totalAmount, 0),
            )}
          </p>
        </div>
        <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">
            Unidades Vendidas
          </p>
          <p className="text-2xl font-black italic text-emerald-600">
            {productStats.reduce((sum, p) => sum + p.quantity, 0)}
          </p>
        </div>
        <div className="bg-amber-500/5 p-6 rounded-3xl border border-amber-500/10 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/60 mb-1">
            Items con Movimiento
          </p>
          <p className="text-2xl font-black italic text-amber-600">
            {productStats.length}
          </p>
        </div>
      </div>
    </div>
  );
};
