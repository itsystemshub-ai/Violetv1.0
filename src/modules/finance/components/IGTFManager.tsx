import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatCurrency } from "@/lib/index";

interface IGTFManagerProps {
  logic: any;
}

export const IGTFManager = ({ logic }: IGTFManagerProps) => {
  return (
    <Card className="p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Base (USD)</TableHead>
            <TableHead>IGTF (3%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logic.igtfRecords.map((rec: any) => (
            <TableRow key={rec.id}>
              <TableCell>{rec.created_at.split("T")[0]}</TableCell>
              <TableCell>
                <Badge variant="outline">{rec.metodo_pago}</Badge>
              </TableCell>
              <TableCell>{formatCurrency(rec.monto_base, "USD")}</TableCell>
              <TableCell className="font-bold text-amber-600">
                {formatCurrency(rec.monto_igtf, "USD")}
              </TableCell>
            </TableRow>
          ))}
          {logic.igtfRecords.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-8 text-muted-foreground"
              >
                No hay registros de IGTF para el período seleccionado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
