import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import {
  TrendingUp,
  Download,
  Scale,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/index";

interface FinanceReportsProps {
  logic: any;
}

export const FinanceReports = ({ logic }: FinanceReportsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Estado de Resultados Preview */}
      <Card className="rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5 flex flex-col bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/10 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-black italic uppercase text-primary leading-none mb-1">
                  Estado de Resultados
                </CardTitle>
                <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Resumen operativo del periodo (P&L)
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-primary/10 text-primary transition-all"
              onClick={logic.handleExportReport}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 flex-1 flex flex-col justify-center">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest leading-none mb-1">
                  Ingresos Brutos
                </span>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-xl font-black italic text-emerald-600 tabular-nums">
                    {formatCurrency(logic.totalRevenue)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest leading-none mb-1">
                  Egresos Totales
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black italic text-red-500 tabular-nums">
                    {formatCurrency(logic.totalExpenses)}
                  </span>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                </div>
              </div>
            </div>

            <Separator className="bg-border/40" />

            <div className="flex justify-between items-center py-2 bg-primary/5 rounded-2xl px-6">
              <span className="text-xs font-black uppercase text-primary tracking-widest">
                Utilidad Neta
              </span>
              <div className="flex flex-col items-end">
                <span
                  className={`text-2xl font-black italic tabular-nums ${logic.netIncome >= 0 ? "text-primary" : "text-red-500"}`}
                >
                  {formatCurrency(logic.netIncome)}
                </span>
                <Badge
                  variant={logic.netIncome >= 0 ? "secondary" : "destructive"}
                  className="text-[8px] font-black uppercase tracking-tighter h-4 px-2 mt-1"
                >
                  {logic.netIncome >= 0 ? "Profit" : "Loss"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance General Preview */}
      <Card className="rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5 flex flex-col bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-500/10 rounded-2xl">
                <Scale className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-black italic uppercase text-primary leading-none mb-1">
                  Balance General
                </CardTitle>
                <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Situación patrimonial financiera
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-primary/10 text-primary transition-all"
              onClick={logic.handleExportReport}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">
                Total Activos
              </p>
              <p className="text-3xl font-black italic tracking-tighter text-primary tabular-nums">
                {formatCurrency(logic.totalAssets)}
              </p>
            </div>
            <div className="space-y-1 text-right border-l border-border/40 pl-8">
              <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">
                Pasivos + Patrimonio
              </p>
              <p className="text-3xl font-black italic tracking-tighter text-amber-600 tabular-nums">
                {formatCurrency(
                  logic.totalLiabilities +
                    (logic.totalAssets - logic.totalLiabilities),
                )}
              </p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-muted/20 border border-border/40 text-[10px] space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold uppercase text-muted-foreground/60 tracking-wider">
                Masa de Pasivos:
              </span>
              <span className="font-black italic text-xs text-foreground tabular-nums">
                {formatCurrency(logic.totalLiabilities)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold uppercase text-muted-foreground/60 tracking-wider">
                Capital / Patrimonio:
              </span>
              <span className="font-black italic text-xs text-foreground tabular-nums">
                {formatCurrency(logic.totalAssets - logic.totalLiabilities)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
