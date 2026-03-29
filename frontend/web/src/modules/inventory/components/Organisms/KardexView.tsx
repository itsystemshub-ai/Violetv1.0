import React, { useState, useMemo } from "react";
import { useKardex } from "@/modules/inventory/hooks/useKardex";
import { useInventoryLogic } from "@/modules/inventory/hooks/useInventoryLogic";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Download,
  BookOpen,
  Eye,
  PackageSearch,
  Clock,
  Calculator,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export const KardexView: React.FC = () => {
  const { products } = useInventoryLogic();
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [datePeriod, setDatePeriod] = useState("all");
  const [selectedMovement, setSelectedMovement] = useState<any>(null);

  // Calcular el rango de fechas basado en el periodo
  const dateRange = useMemo(() => {
    if (datePeriod === "all") return undefined;
    const now = new Date();
    const start = new Date();
    if (datePeriod === "today") start.setHours(0, 0, 0, 0);
    if (datePeriod === "week") start.setDate(now.getDate() - 7);
    if (datePeriod === "month") start.setMonth(now.getMonth(), 1);

    return { start: start.toISOString(), end: now.toISOString() };
  }, [datePeriod]);

  const { movements, loading, stats } = useKardex(selectedProductId, dateRange);

  // Opciones de productos para el filtro
  const productOptions = useMemo(() => {
    return products.map((p) => ({
      id: p.id,
      name: p.name || p.descripcionManguera || "Sin Nombre",
      cauplas: p.cauplas || "S/N",
    }));
  }, [products]);

  if (loading && movements.length === 0) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Kardex de Inventario
          </h2>
          <p className="text-sm text-muted-foreground">
            Historial de movimientos y saldos por producto.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {selectedProductId !== "all" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                Saldo Inicial
              </p>
              <p className="text-2xl font-black text-slate-600">
                {stats.initialBalance}
              </p>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-900">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-green-600 uppercase mb-1">
                (+) Ingresos
              </p>
              <p className="text-2xl font-black text-green-600">
                {stats.entries}
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-red-600 uppercase mb-1">
                (-) Egresos
              </p>
              <p className="text-2xl font-black text-red-600">{stats.exits}</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-primary uppercase mb-1">
                Saldo Final
              </p>
              <p className="text-2xl font-black text-primary">
                {stats.finalBalance}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
              <Select value={datePeriod} onValueChange={setDatePeriod}>
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
          {movements.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <PackageSearch className="w-12 h-12 text-primary/40" />
              </div>
              <p className="text-xl font-medium text-foreground">
                No hay movimientos registrados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                      Fecha / Hora
                    </th>
                    <th className="text-left py-3 px-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                      Concepto / Motivo
                    </th>
                    <th className="text-left py-3 px-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                      Referencia
                    </th>
                    <th className="text-right py-3 px-3 font-bold text-green-600 text-xs uppercase tracking-wider bg-green-50 dark:bg-green-950/20">
                      Entradas
                    </th>
                    <th className="text-right py-3 px-3 font-bold text-red-600 text-xs uppercase tracking-wider bg-red-50 dark:bg-red-950/20">
                      Salidas
                    </th>
                    <th className="text-right py-3 px-4 font-bold text-primary text-xs uppercase tracking-wider bg-primary/5">
                      Saldo Stock
                    </th>
                    <th className="text-center py-3 px-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {movements.map((m, idx) => {
                    const isEntry = m.quantity > 0;
                    const isExit = m.quantity < 0;
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
                          <Badge
                            variant={
                              isEntry
                                ? "default"
                                : isExit
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0"
                          >
                            {m.reason || m.type}
                          </Badge>
                          {selectedProductId === "all" && (
                            <span className="block text-[10px] text-muted-foreground font-bold mt-0.5">
                              {m.cauplas}
                            </span>
                          )}
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
                        <td className="py-3 px-4 text-right font-black text-[15px] bg-primary/5 text-primary">
                          {m.runningBalance}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => setSelectedMovement(m)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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

      <Dialog
        open={!!selectedMovement}
        onOpenChange={() => setSelectedMovement(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Detalle de Operación
            </DialogTitle>
          </DialogHeader>

          {selectedMovement && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    Producto
                  </p>
                  <p className="font-black text-primary">
                    {selectedMovement.cauplas}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    Fecha
                  </p>
                  <p className="font-medium">
                    {new Date(selectedMovement.date).toLocaleString("es-VE")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    Tipo
                  </p>
                  <Badge variant="outline" className="uppercase text-[10px]">
                    {selectedMovement.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    Impacto
                  </p>
                  <p
                    className={`font-black ${selectedMovement.quantity > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {selectedMovement.quantity > 0 ? "+" : ""}
                    {selectedMovement.quantity}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
