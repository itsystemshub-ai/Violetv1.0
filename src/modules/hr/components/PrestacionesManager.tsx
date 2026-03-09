import { Shield, FileText } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatCurrency } from "@/lib/index";
import { HRLogic } from "@/modules/hr/hooks/useHRLogic";

interface PrestacionesManagerProps {
  logic: HRLogic;
}

export function PrestacionesManager({ logic }: PrestacionesManagerProps) {
  const { prestacionesSummary, handleExportLiquidacion } = logic;

  return (
    <div className="space-y-6">
      <Card className="bg-linear-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold">Art. 142 LOTTT — Doble Cálculo</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Se comparan dos métodos: <strong>Garantía Trimestral</strong>{" "}
                (15 días de salario integral × trimestres) vs{" "}
                <strong>Retroactividad</strong> (30 días × años al último
                salario). Se paga el <strong>mayor</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl shadow-foreground/5 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            Prestaciones Sociales por Colaborador
          </CardTitle>
          <CardDescription>
            Cálculo comparativo Art. 142 LOTTT con salario integral.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead className="text-right">Años</TableHead>
                <TableHead className="text-right">Sal. Integral</TableHead>
                <TableHead className="text-right">Garantía Trim.</TableHead>
                <TableHead className="text-right">Retroactividad</TableHead>
                <TableHead className="text-right font-bold">
                  Mayor (a pagar)
                </TableHead>
                <TableHead className="text-right">Int. BCV/mes</TableHead>
                <TableHead className="text-right">Liquidación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestacionesSummary.map((p) => (
                <TableRow key={p.employee.id}>
                  <TableCell className="font-medium">
                    {p.employee.firstName} {p.employee.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.anosServicio.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(p.salarioIntegral)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        p.garantiaTotal >= p.retroactividad
                          ? "font-bold text-emerald-600"
                          : ""
                      }
                    >
                      {formatCurrency(p.garantiaTotal)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        p.retroactividad > p.garantiaTotal
                          ? "font-bold text-emerald-600"
                          : ""
                      }
                    >
                      {formatCurrency(p.retroactividad)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(p.mayorPrestacion)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(p.interesesMensuales)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportLiquidacion(p.employee.id)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
