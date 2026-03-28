import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import {
  FileSpreadsheet,
  ArrowDownToLine,
  BookOpen,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/index";
import { WithholdingService } from "@/modules/finance/services/withholding.service";

interface LibroManagerProps {
  logic: any;
}

export const LibroManager = ({ logic }: LibroManagerProps) => {
  const debitoFiscal = logic.invoices
    .filter(
      (i: any) => i.type === "venta" && i.date.startsWith(logic.selectedMonth),
    )
    .reduce((acc: number, i: any) => acc + (i.total - i.subtotal), 0);

  const creditoFiscal = logic.invoices
    .filter(
      (i: any) => i.type === "compra" && i.date.startsWith(logic.selectedMonth),
    )
    .reduce((acc: number, i: any) => acc + (i.total - i.subtotal), 0);

  return (
    <Card className="rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5 bg-card/50 backdrop-blur-sm">
      <CardHeader className="bg-muted/10 border-b border-border/40 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-black italic uppercase text-primary leading-none mb-1">
                Libros Legales (IVA)
              </CardTitle>
              <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                Generación de reportes probatorios para el SENIAT
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type="month"
                className="h-11 w-44 pl-9 rounded-xl border-border/50 bg-muted/5 font-bold text-xs uppercase"
                value={logic.selectedMonth}
                onChange={(e) => logic.setSelectedMonth(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={logic.handleExportLibroVentas}
                variant="outline"
                className="h-11 px-5 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-border/40 hover:bg-primary/5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Ventas
              </Button>
              <Button
                variant="outline"
                onClick={logic.handleExportLibroCompras}
                className="h-11 px-5 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-border/40 hover:bg-primary/5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-rose-500" /> Compras
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            {
              label: "Débito Fiscal (Ventas)",
              value: debitoFiscal,
              color: "text-emerald-500",
              bg: "bg-emerald-500/5",
              desc: "Soporte para Libros",
            },
            {
              label: "Crédito Fiscal (Compras)",
              value: creditoFiscal,
              color: "text-rose-500",
              bg: "bg-rose-500/5",
              desc: "Deducible de IVA",
            },
            {
              label: "Sujeto a Retención",
              value: 0,
              color: "text-amber-500",
              bg: "bg-amber-500/5",
              desc: "Estimado del mes",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`p-6 rounded-[1.5rem] border border-border/40 ${item.bg} relative overflow-hidden group hover:scale-[1.02] transition-all`}
            >
              <p className="text-[10px] font-black italic text-muted-foreground/40 uppercase tracking-widest relative z-10">
                {item.label}
              </p>
              <p
                className={`text-3xl font-black italic tabular-nums mt-1 relative z-10 ${item.color}`}
              >
                {formatCurrency(item.value, "USD")}
              </p>
              <p className="text-[8px] font-black uppercase text-muted-foreground/30 mt-1 relative z-10 px-2 py-0.5 rounded-full border border-border/20 inline-block">
                {item.desc}
              </p>
              <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <FileSpreadsheet className="w-16 h-16 -mr-4 -mb-4 rotate-12" />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-10 text-center flex flex-col items-center gap-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />

          <div className="relative z-10 p-5 bg-background rounded-[1.5rem] shadow-2xl ring-1 ring-border/5 group-hover:scale-110 transition-transform">
            <ArrowDownToLine className="w-10 h-10 text-primary" />
          </div>

          <div className="relative z-10 max-w-sm">
            <h4 className="text-xl font-black italic tracking-tighter uppercase text-primary leading-none mb-2">
              Generación de Archivo XML
            </h4>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
              Descarga el archivo de retenciones del período{" "}
              {logic.selectedMonth} para carga directa en el portal SENIAT
            </p>
          </div>

          <Button
            variant="default"
            className="relative z-10 h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            onClick={() =>
              WithholdingService.downloadIvaXML(
                logic.invoices,
                logic.tenant,
                logic.selectedMonth.replace("-", ""),
              )
            }
          >
            Descargar XML Providencia 0049
          </Button>

          <div className="absolute right-0 bottom-0 opacity-[0.02]">
            <FileSpreadsheet className="h-64 w-64 -mr-20 -mb-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
