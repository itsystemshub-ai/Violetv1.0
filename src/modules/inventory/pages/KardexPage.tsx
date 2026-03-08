import React, { useState, useMemo } from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { useMovements } from "@/modules/inventory/hooks/useMovements";
import { useInventoryLogic } from "@/modules/inventory/hooks/useInventoryLogic";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Search,
  Filter,
  Download,
  BookOpen,
  Clock,
  FileText,
  PackageSearch,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { formatCurrency } from "@/lib/index";

export default function KardexPage() {
  const { movements, loading } = useMovements();
  const { products } = useInventoryLogic();

  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Opciones de productos para el filtro
  const productOptions = useMemo(() => {
    return products.map((p) => ({
      id: p.id,
      name: p.name || p.descripcionManguera || "Sin Nombre",
      cauplas: p.cauplas || "S/N",
    }));
  }, [products]);

  const filteredMovements = useMemo(() => {
    let filtered = [...movements];

    // Filtrar por producto
    if (selectedProductId !== "all") {
      filtered = filtered.filter((m) => {
        // Find the product selected
        const p = products.find((prod) => prod.id === selectedProductId);
        return (
          p &&
          (m.productName === p.name ||
            m.productName === p.descripcionManguera ||
            m.cauplas === p.cauplas)
        );
      });
    }

    // Filtrar por fecha
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((m) => {
        const d = new Date(m.date);
        if (dateFilter === "today")
          return d.toDateString() === now.toDateString();
        if (dateFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return d >= weekAgo;
        }
        if (dateFilter === "month") {
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        }
        return true;
      });
    }

    // Ordenar cronológicamente ascendente para poder calcular el saldo arrastrado
    return filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [movements, selectedProductId, dateFilter, products]);

  // Si hay un producto seleccionado, podemos calcular el saldo transaccional
  // partiendo del stock actual y retrocediendo (o partiendo de 0 si se prefiere un Kardex estricto).
  // Para un Kardex real: Saldo Inicial + Entradas - Salidas = Saldo Final.
  // Vamos a mostrar el historial tal cual y sumar progresivamente asumiendo saldo inicial 0 por simplicidad,
  // o buscaríamos el stock inicial real en DB.
  let runningBalance = 0;

  const movementsWithBalance = filteredMovements.map((m) => {
    if (m.type === "entry" || m.quantity > 0) {
      runningBalance += Math.abs(m.quantity);
    } else if (m.type === "exit" || m.quantity < 0) {
      runningBalance -= Math.abs(m.quantity);
    } else if (m.type === "adjustment") {
      runningBalance += m.quantity; // adjustment is net change
    }
    return { ...m, runningBalance };
  });

  // Re-ordenar descendente para la tabla (más reciente primero)
  movementsWithBalance.reverse();

  if (loading) {
    return (
      <ValeryLayout sidebar={<ValerySidebar />}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </ValeryLayout>
    );
  }

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Kardex (Libro Mayor)
            </h1>
            <p className="text-muted-foreground mt-1">
              Registro inmutable de entradas, salidas y ajustes por cada
              producto.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Exportar Ficha
            </Button>
          </div>
        </div>

        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-4 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:w-1/3">
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione un producto..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    <SelectItem value="all">
                      🔍 Todos los productos (Resumen Global)
                    </SelectItem>
                    {productOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.cauplas} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-1/4">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🗓️ Todo el historial</SelectItem>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="week">Últimos 7 días</SelectItem>
                    <SelectItem value="month">Este Mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {movementsWithBalance.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <PackageSearch className="w-12 h-12 text-primary/40" />
                </div>
                <p className="text-xl font-medium text-foreground">
                  No hay movimientos registrados
                </p>
                <p className="text-muted-foreground">
                  Seleccione otro producto o cambie el rango de fechas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="text-left py-3 px-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                        Producto (Cauplas)
                      </th>
                      <th className="text-left py-3 px-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                        Tipo (Concepto)
                      </th>
                      <th className="text-left py-3 px-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                        Referencia
                      </th>
                      <th className="text-right py-3 px-3 font-bold text-green-600 dark:text-green-500 text-xs uppercase tracking-wider bg-green-50 dark:bg-green-950/20">
                        Entradas
                      </th>
                      <th className="text-right py-3 px-3 font-bold text-red-600 dark:text-red-500 text-xs uppercase tracking-wider bg-red-50 dark:bg-red-950/20">
                        Salidas
                      </th>
                      {selectedProductId !== "all" && (
                        <th className="text-right py-3 px-4 font-bold text-primary text-xs uppercase tracking-wider bg-primary/5">
                          Saldo
                        </th>
                      )}
                      <th className="text-right py-3 px-4 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                        Precio / Valor neto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {movementsWithBalance.map((m, idx) => {
                      const isEntry = m.type === "entry" || m.quantity > 0;
                      const isExit = m.type === "exit" || m.quantity < 0;

                      const qtyAbs = Math.abs(m.quantity);

                      return (
                        <tr
                          key={`${m.id}-${idx}`}
                          className="hover:bg-accent/30 transition-colors"
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Clock className="w-3 h-3" />
                              {new Date(m.date).toLocaleString("es-VE", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-primary">
                              {m.cauplas}
                            </span>
                            <span
                              className="block text-xs text-muted-foreground truncate w-32"
                              title={m.productName}
                            >
                              {m.productName}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                isEntry
                                  ? "default"
                                  : isExit
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-[10px] uppercase font-bold tracking-wider"
                            >
                              {m.reason || m.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-xs font-mono text-muted-foreground">
                            {m.reference || "-"}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-green-600 bg-green-50/50 dark:bg-green-950/10">
                            {isEntry ? `+${qtyAbs}` : "-"}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-red-600 bg-red-50/50 dark:bg-red-950/10">
                            {isExit ? `-${qtyAbs}` : "-"}
                          </td>
                          {selectedProductId !== "all" && (
                            <td className="py-3 px-4 text-right font-black text-[15px] bg-primary/5 text-primary">
                              {m.runningBalance}
                            </td>
                          )}
                          <td className="py-3 px-4 text-right font-medium text-muted-foreground">
                            {formatCurrency(Math.abs(m.totalValue), "USD")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ValeryLayout>
  );
}
