import { CalendarDays } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/index";
import { HRLogic } from "@/features/hr/hooks/useHRLogic";

interface VacacionesManagerProps {
  logic: HRLogic;
}

export function VacacionesManager({ logic }: VacacionesManagerProps) {
  const { prestacionesSummary } = logic;

  return (
    <Card className="border-none shadow-xl shadow-foreground/5 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          Libro de Vacaciones
        </CardTitle>
        <CardDescription>
          Según LOTTT: 15 días base + 1 día adicional por año de servicio. Bono
          vacacional: 15 días base + 1 por año.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead className="text-right">Antigüedad</TableHead>
              <TableHead className="text-right">Días Base</TableHead>
              <TableHead className="text-right">Adicionales</TableHead>
              <TableHead className="text-right font-bold">Total Días</TableHead>
              <TableHead className="text-right">Bono Vac. (días)</TableHead>
              <TableHead className="text-right">Bono Vac. ($)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prestacionesSummary.map((p) => {
              const salarioDiario = p.employee.salary / 30;
              return (
                <TableRow key={p.employee.id}>
                  <TableCell className="font-medium">
                    {p.employee.firstName} {p.employee.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.anosServicio.toFixed(1)} años
                  </TableCell>
                  <TableCell className="text-right">
                    {p.vacaciones.base}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    +{p.vacaciones.adicionales}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {p.vacaciones.total}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.vacaciones.bonoVacacional}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(
                      salarioDiario * p.vacaciones.bonoVacacional,
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
