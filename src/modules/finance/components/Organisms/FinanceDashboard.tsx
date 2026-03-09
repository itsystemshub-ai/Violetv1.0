import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { formatCurrency } from "@/lib/index";
import { WithholdingService } from "@/modules/finance/services/withholding.service";
import { FileText, FileSpreadsheet, Download, Calendar, ArrowUpRight, ArrowDownLeft, Landmark } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";

interface FinanceDashboardProps {
  logic: any;
}

export const FinanceDashboard = ({ logic }: FinanceDashboardProps) => {
  const { kpis } = logic;

  const ageingItems = [
    {
      label: "Al día (0-30d)",
      value: logic.ageingData.current,
      color: "bg-emerald-500",
    },
    {
      label: "Vencido (31-60d)",
      value: logic.ageingData.pastDue30,
      color: "bg-amber-500",
    },
    {
      label: "Crítico (90d+)",
      value: logic.ageingData.pastDue90,
      color: "bg-rose-500",
    },
  ];

  const maxVal = Math.max(...ageingItems.map((i) => i.value), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cartera */}
        <Card className="rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black italic uppercase text-primary leading-none mb-1">
                  Cuentas por Cobrar
                </CardTitle>
                <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Análisis de vencimiento de cartera
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {ageingItems.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60">
                      {item.label}
                    </span>
                    <span className="font-black italic text-sm tabular-nums text-foreground">
                      {formatCurrency(item.value, "USD")}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${item.color}`}
                      style={{ width: `${(item.value / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-dashed border-border/60 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-primary">
                  Total Cartera:
                </span>
                <span className="text-lg font-black italic text-primary tabular-nums">
                  {formatCurrency(logic.ageingData.total, "USD")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transacciones Recientes */}
        <Card className="lg:col-span-2 rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
            <CardTitle className="text-lg font-black italic uppercase text-primary leading-none mb-1">
              Últimos Movimientos
            </CardTitle>
            <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              Actividad financiera reciente
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-muted/5 border-b border-border/40">
                    <th className="px-4 py-3 text-left font-black uppercase text-muted-foreground/60">Descripción</th>
                    <th className="px-4 py-3 text-left font-black uppercase text-muted-foreground/60">Tipo</th>
                    <th className="px-4 py-3 text-right font-black uppercase text-muted-foreground/60">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {logic.igtfRecords?.slice(0, 5).map((record: any) => (
                    <tr key={record.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {record.metodo_pago.toUpperCase()} - Pago Factura
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Ingreso
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-600">
                        + {formatCurrency(record.monto_base + record.monto_igtf, "USD")}
                      </td>
                    </tr>
                  ))}
                  {(!logic.igtfRecords || logic.igtfRecords.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground italic">
                        No hay movimientos recientes registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bancos y Cuentas */}
        <Card className="rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
            <CardTitle className="text-lg font-black italic uppercase text-primary leading-none mb-1">
              Estado de Cuentas
            </CardTitle>
            <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              Balances bancarios y efectivo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {logic.accounts?.filter((acc: any) => acc.type === "activo").slice(0, 4).map((acc: any) => (
                <div key={acc.id} className="p-4 rounded-2xl bg-muted/10 border border-border/40 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground/60 leading-tight">
                      {acc.name}
                    </p>
                    <p className="text-sm font-black italic tabular-nums">
                      {formatCurrency(acc.balance, acc.currency || "USD")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones y Reportes */}
        <Card className="rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
            <CardTitle className="text-lg font-black italic uppercase text-primary leading-none mb-1">
              Acciones y Reportes
            </CardTitle>
            <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              Generación de documentos fiscales
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                className="h-20 rounded-2xl flex-col items-start p-4 hover:bg-primary/5 border border-border/40 group relative overflow-hidden"
                onClick={logic.handleExportLibroVentas}
              >
                <div className="p-2 rounded-xl bg-primary/5 mb-1 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                  Libro Ventas
                </span>
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <FileSpreadsheet className="h-12 w-12 -mr-2 -mb-2" />
                </div>
              </Button>
              <Button
                variant="ghost"
                className="h-20 rounded-2xl flex-col items-start p-4 hover:bg-primary/5 border border-border/40 group relative overflow-hidden"
                onClick={logic.handleExportLibroCompras}
              >
                <div className="p-2 rounded-xl bg-primary/5 mb-1 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                  Libro Compras
                </span>
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <FileSpreadsheet className="h-12 w-12 -mr-2 -mb-2" />
                </div>
              </Button>
              <Button
                variant="ghost"
                className="h-20 rounded-2xl flex-col items-start p-4 hover:bg-emerald-500/5 border border-border/40 group relative overflow-hidden"
                onClick={() =>
                  WithholdingService.downloadIvaXML(
                    logic.invoices,
                    logic.tenant,
                    logic.selectedMonth,
                  )
                }
              >
                <div className="p-2 rounded-xl bg-emerald-500/5 mb-1 group-hover:scale-110 transition-transform">
                  <Download className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">
                  XML Retenciones
                </span>
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Download className="h-12 w-12 -mr-2 -mb-2" />
                </div>
              </Button>
              <Button
                variant="ghost"
                className="h-20 rounded-2xl flex-col items-start p-4 hover:bg-amber-500/5 border border-border/40 group relative overflow-hidden"
                onClick={logic.handleExportARC}
              >
                <div className="p-2 rounded-xl bg-amber-500/5 mb-1 group-hover:scale-110 transition-transform">
                  <Calendar className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/80">
                  ARC Anual
                </span>
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Calendar className="h-12 w-12 -mr-2 -mb-2" />
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
