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
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { FileSpreadsheet } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/index";

interface LedgerManagerProps {
  logic: any;
}

export const LedgerManager = ({ logic }: LedgerManagerProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Libro Mayor</CardTitle>
        <CardDescription>
          Movimientos detallados por cuenta y fecha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="w-full max-w-sm">
            <Label>Seleccionar Cuenta</Label>
            <Select onValueChange={logic.handleSelectLedgerAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Busque una cuenta..." />
              </SelectTrigger>
              <SelectContent>
                {logic.accounts.map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!logic.selectedLedgerAccount ? (
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50">
              <div className="text-center space-y-2">
                <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Seleccione una cuenta para ver el detalle de movimientos.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.ledgerTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No hay movimientos registrados para esta cuenta.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logic.ledgerTransactions.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs">
                          {formatDate(tx.created_at || tx.date)}
                        </TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono ${tx.type === "debe" ? "text-primary" : "text-destructive"}`}
                        >
                          {tx.type === "debe" ? "+" : "-"}{" "}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
