import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Download, Scale, FileSpreadsheet } from "lucide-react";
import { formatCurrency } from "@/lib/index";

interface FinanceReportsProps {
  logic: any;
}

export const FinanceReports = ({ logic }: FinanceReportsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Estado de Resultados Preview */}
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 border-b">
          <div className="p-2 bg-emerald-500/10 rounded-full">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <CardTitle>Estado de Resultados (P&L)</CardTitle>
            <CardDescription>Resumen operativo del periodo</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logic.handleExportReport}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6 flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ingresos Operativos</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(logic.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Egresos Operativos</span>
              <span className="font-bold text-destructive">
                ({formatCurrency(logic.totalExpenses)})
              </span>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-base font-black">Utilidad Neta</span>
            <Badge
              variant={logic.netIncome >= 0 ? "default" : "destructive"}
              className="text-sm px-3 py-1"
            >
              {formatCurrency(logic.netIncome)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Balance General Preview */}
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 border-b">
          <div className="p-2 bg-blue-500/10 rounded-full">
            <Scale className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle>Balance General</CardTitle>
            <CardDescription>Situación patrimonial actual</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logic.handleExportReport}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6 flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Activos
              </p>
              <p className="text-xl font-black text-primary">
                {formatCurrency(logic.totalAssets)}
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Pasivos + Patrimonio
              </p>
              <p className="text-xl font-black text-amber-600">
                {formatCurrency(
                  logic.totalLiabilities +
                    (logic.totalAssets - logic.totalLiabilities),
                )}
              </p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border text-[10px] space-y-1">
            <div className="flex justify-between">
              <span>Total Pasivos:</span>
              <span>{formatCurrency(logic.totalLiabilities)}</span>
            </div>
            <div className="flex justify-between">
              <span>Capital/Patrimonio:</span>
              <span>
                {formatCurrency(logic.totalAssets - logic.totalLiabilities)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className="hover:border-primary/50 transition-colors cursor-pointer group"
        onClick={logic.handleExportLibroVentas}
      >
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-2 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 transition-colors">
            <FileSpreadsheet className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-base">
              Libro de Ventas y Compras
            </CardTitle>
            <CardDescription className="text-xs">
              Reporte fiscal detallado para IVA (Seniat).
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};
