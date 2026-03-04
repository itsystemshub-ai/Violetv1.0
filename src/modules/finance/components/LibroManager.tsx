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
import { FileSpreadsheet, ArrowDownToLine } from "lucide-react";
import { formatCurrency } from "@/lib/index";
import { WithholdingService } from "@/lib/WithholdingService";

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
    <Card className="rounded-2xl shadow-sm border-none bg-background/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-black">
              Libros Legales (IVA)
            </CardTitle>
            <CardDescription>
              Generación de reportes probatorios para el SENIAT
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid gap-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                Mes Fiscal
              </Label>
              <Input
                type="month"
                className="h-10 w-40"
                value={logic.selectedMonth}
                onChange={(e) => logic.setSelectedMonth(e.target.value)}
              />
            </div>
            <Button
              onClick={logic.handleExportLibroVentas}
              className="h-10 gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> Exportar Libro Ventas
            </Button>
            <Button
              variant="outline"
              onClick={logic.handleExportLibroCompras}
              className="h-10 gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> Exportar Libro Compras
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 rounded-xl border bg-primary/5 border-primary/10">
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">
              Débito Fiscal (Ventas)
            </p>
            <p className="text-2xl font-black text-primary">
              {formatCurrency(debitoFiscal, "USD")}
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Soporte para Libros
            </p>
          </div>
          <div className="p-4 rounded-xl border bg-rose-500/5 border-rose-500/10">
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">
              Crédito Fiscal (Compras)
            </p>
            <p className="text-2xl font-black text-rose-600">
              {formatCurrency(creditoFiscal, "USD")}
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Deducible de IVA
            </p>
          </div>
          <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/10">
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">
              Sujeto a Retención
            </p>
            <p className="text-2xl font-black text-amber-600">
              {formatCurrency(0, "USD")}
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Estimado del mes
            </p>
          </div>
        </div>

        <div className="bg-muted/10 border rounded-2xl p-8 text-center flex flex-col items-center gap-4">
          <div className="p-4 bg-background rounded-full shadow-sm border">
            <ArrowDownToLine className="w-8 h-8 text-primary" />
          </div>
          <div className="max-w-md">
            <h4 className="text-lg font-black italic">
              Generación de Archivo XML (.xml)
            </h4>
            <p className="text-sm text-muted-foreground mt-2">
              Haz clic para descargar el archivo de retenciones del período
              mensual {logic.selectedMonth} para su carga directa en el portal
              SENIAT.
            </p>
          </div>
          <Button
            variant="secondary"
            className="px-8 font-bold"
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
        </div>
      </CardContent>
    </Card>
  );
};
