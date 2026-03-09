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
    <Card>
      <CardHeader>
        <CardTitle>Conciliación Bancaria</CardTitle>
        <CardDescription>
          Cargue su estado de cuenta (CSV) para cruzar con los registros del
          sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 p-6 border-2 border-dashed rounded-2xl bg-muted/20">
          <div className="p-4 bg-background rounded-full shadow-sm border">
            <ArrowDownToLine className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold">Importar Estado de Cuenta</h4>
            <p className="text-xs text-muted-foreground">
              Formatos soportados: CSV (Bancos Nacionales - Mercantil, Banesco,
              etc.)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".csv"
              onChange={logic.handleReconcileFile}
              className="hidden"
              id="bank-file-upload"
            />
            <Button asChild variant="outline">
              <label
                htmlFor="bank-file-upload"
                className="cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Seleccionar Archivo
              </label>
            </Button>
          </div>
        </div>

        {logic.isMatching && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="text-center">
              <p className="text-sm font-black">Analizando movimientos...</p>
              <p className="text-xs text-muted-foreground">
                Comparando registros bancarios con el Libro Mayor
              </p>
            </div>
          </div>
        )}

        {logic.reconciliationMatches.length > 0 && !logic.isMatching && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Resultados del Match
              </h3>
              <Badge variant="secondary" className="px-3">
                {logic.reconciliationMatches.length} registros analizados
              </Badge>
            </div>

            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción Banco</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Confianza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.reconciliationMatches.map((match: any, i: number) => (
                    <TableRow key={i} className="hover:bg-muted/20">
                      <TableCell className="text-xs font-medium">
                        {match.bankLine.date}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-[11px] font-mono">
                        {match.bankLine.description}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">
                        {formatCurrency(match.bankLine.amount, "VES")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            match.matchType === "exact"
                              ? "default"
                              : match.matchType === "partial"
                                ? "outline"
                                : "destructive"
                          }
                          className={cn(
                            "text-[10px] uppercase font-bold px-2",
                            match.matchType === "exact" &&
                              "bg-emerald-500 hover:bg-emerald-600 border-none",
                            match.matchType === "partial" &&
                              "border-amber-500 text-amber-600 hover:bg-amber-50",
                          )}
                        >
                          {match.matchType === "exact"
                            ? "Conciliado"
                            : match.matchType === "partial"
                              ? "Dudoso"
                              : "No Encontrado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold">
                            {(match.confidence * 100).toFixed(0)}%
                          </span>
                          <Progress
                            value={match.confidence * 100}
                            className="h-1 w-12"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-xl border flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                Se detectaron{" "}
                {
                  logic.reconciliationMatches.filter(
                    (m: any) => m.matchType === "exact",
                  ).length
                }{" "}
                coincidencias exactas automáticas.
              </div>
              <Button size="sm" className="font-bold">
                Aplicar Conciliación
              </Button>
            </div>
          </div>
        )}

        {logic.reconciliationMatches.length === 0 && !logic.isMatching && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <FileSearch className="w-16 h-16 mb-4" />
            <h4 className="font-bold">Sin resultados aún</h4>
            <p className="text-xs max-w-[240px]">
              Sube un archivo CSV de tu banco para iniciar el proceso de
              conciliación automática.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
