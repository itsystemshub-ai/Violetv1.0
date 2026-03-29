import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Progress } from "@/shared/components/ui/progress";
import {
  Download,
  CheckCircle2,
  FileSearch,
  ArrowDownToLine,
  RefreshCw,
  Search,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/core/shared/utils/utils";
import { formatCurrency } from "@/lib/index";

interface ReconciliationManagerProps {
  logic: any;
}

export const ReconciliationManager = ({
  logic,
}: ReconciliationManagerProps) => {
  return (
    <Card className="rounded-[2.5rem] shadow-2xl overflow-hidden border-none ring-1 ring-border/5 bg-background/50 backdrop-blur-sm">
      <CardHeader className="bg-muted/10 border-b border-border/40 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <RefreshCw className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-black italic uppercase text-primary leading-none mb-1">
                Conciliación Bancaria
              </CardTitle>
              <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                Cruces automáticos con estados de cuenta bancarios
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-6 p-8 border-2 border-dashed rounded-4xl bg-muted/5 border-border/30 group hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
            <Download className="h-32 w-32 -mr-10 -mt-10" />
          </div>

          <div className="p-5 bg-background rounded-[1.5rem] shadow-xl border border-border/40 group-hover:scale-110 transition-transform relative z-10">
            <ArrowDownToLine className="w-10 h-10 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left relative z-10">
            <h4 className="text-lg font-black italic uppercase text-primary leading-none mb-2">
              Importar Estado de Cuenta
            </h4>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Soporta archivos CSV de Mercantil, Banesco y otros bancos
              nacionales
            </p>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <Input
              type="file"
              accept=".csv"
              onChange={logic.handleReconcileFile}
              className="hidden"
              id="bank-file-upload"
            />
            <Button
              asChild
              className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
            >
              <label
                htmlFor="bank-file-upload"
                className="cursor-pointer flex items-center gap-2"
              >
                <Search className="w-4 h-4" /> Seleccionar CSV
              </label>
            </Button>
          </div>
        </div>

        {logic.isMatching && (
          <div className="flex flex-col items-center justify-center py-16 gap-6 animate-pulse">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="bg-primary/10 p-6 rounded-full relative z-10">
                <RefreshCw className="h-12 w-12 text-primary animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-black italic uppercase text-primary mb-1">
                Analizando movimientos...
              </p>
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40">
                Comparando registros bancarios con el Libro Mayor
              </p>
            </div>
          </div>
        )}

        {logic.reconciliationMatches.length > 0 && !logic.isMatching && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <h3 className="text-lg font-black italic uppercase text-foreground">
                  Resultados del Análisis
                </h3>
              </div>
              <Badge
                variant="secondary"
                className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest"
              >
                {logic.reconciliationMatches.length} registros detectados
              </Badge>
            </div>

            <div className="rounded-[1.5rem] border border-border/40 overflow-hidden shadow-sm bg-card">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">
                      Fecha
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">
                      Referencia Bancaria
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12 text-right">
                      Monto
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12 text-center">
                      Precisión
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12 text-right">
                      Confianza
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.reconciliationMatches.map((match: any, i: number) => (
                    <TableRow
                      key={i}
                      className="border-border/40 hover:bg-muted/10 transition-colors h-16 group"
                    >
                      <TableCell className="px-8 py-4 text-[10px] font-black text-muted-foreground italic tabular-nums">
                        {match.bankLine.date}
                      </TableCell>
                      <TableCell className="px-8 py-4">
                        <div className="flex flex-col max-w-[250px]">
                          <span className="text-[11px] font-black italic uppercase text-foreground/80 truncate mb-1">
                            {match.bankLine.description}
                          </span>
                          <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">
                            Ref: B-REG-{i + 1000}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-4 text-right">
                        <span className="text-sm font-black italic tabular-nums text-foreground">
                          {formatCurrency(match.bankLine.amount, "VES")}
                        </span>
                      </TableCell>
                      <TableCell className="px-8 py-4 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase font-black px-3 py-0.5 rounded-full border-2 h-6",
                            match.matchType === "exact" &&
                              "border-emerald-500/20 bg-emerald-500/5 text-emerald-600",
                            match.matchType === "partial" &&
                              "border-amber-500/20 bg-amber-500/5 text-amber-600",
                            match.matchType === "none" &&
                              "border-rose-500/20 bg-rose-500/5 text-rose-500",
                          )}
                        >
                          {match.matchType === "exact"
                            ? "Correcto"
                            : match.matchType === "partial"
                              ? "Revisar"
                              : "No Encontrado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`text-[10px] font-black tabular-nums ${match.confidence > 0.8 ? "text-primary" : "text-muted-foreground/60"}`}
                          >
                            {(match.confidence * 100).toFixed(0)}%
                          </span>
                          <div className="w-16 bg-muted/30 rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ${match.confidence > 0.8 ? "bg-primary" : "bg-muted-foreground/30"}`}
                              style={{ width: `${match.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-8 p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <CheckSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs font-black uppercase tracking-widest text-primary/70">
                  Se detectaron{" "}
                  <span className="text-primary font-black italic text-sm tabular-nums underline decoration-2">
                    {
                      logic.reconciliationMatches.filter(
                        (m: any) => m.matchType === "exact",
                      ).length
                    }
                  </span>{" "}
                  coincidencias automáticas.
                </div>
              </div>
              <Button className="h-12 px-10 rounded-[1.2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                Aplicar Conciliación
              </Button>
            </div>
          </div>
        )}

        {logic.reconciliationMatches.length === 0 && !logic.isMatching && (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-30 group hover:opacity-50 transition-opacity">
            <div className="p-8 bg-muted/10 rounded-full mb-6 border border-border/40 group-hover:scale-110 transition-transform">
              <FileSearch className="w-20 h-20 text-muted-foreground" />
            </div>
            <h4 className="text-xl font-black italic uppercase tracking-tighter text-foreground mb-2">
              Sin información para conciliar
            </h4>
            <p className="text-[10px] font-black uppercase tracking-widest max-w-[280px] leading-relaxed">
              Carga un estado de cuenta en formato CSV para que la IA inicie el
              proceso de cruce de movimientos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
