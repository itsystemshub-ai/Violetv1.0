import { Download } from "lucide-react";
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
import { HRLogic } from "@/features/hr/hooks/useHRLogic";

interface PayrollManagerProps {
  logic: HRLogic;
}

export function PayrollManager({ logic }: PayrollManagerProps) {
  const {
    payrollSummary,
    handleClosePayroll,
    isClosingPayroll,
    handleExportPayrollReceipt,
  } = logic;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Sueldos Brutos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(payrollSummary.totalSalaries)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              SSO + FAOV + RPE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(payrollSummary.totalDeductions)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Cestaticket Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(payrollSummary.totalCestaTicket)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Neto a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(payrollSummary.totalToPay)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl shadow-foreground/5 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">
              Pre-Cálculo de Nómina Quincenal
            </CardTitle>
            <CardDescription>
              Desglose de deducciones paralegales por colaborador.
            </CardDescription>
          </div>
          <Button
            variant="default"
            onClick={handleClosePayroll}
            disabled={isClosingPayroll || payrollSummary.count === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isClosingPayroll ? "Procesando..." : "Realizar Cierre de Nómina"}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead className="text-right">Sueldo Base</TableHead>
                <TableHead className="text-right">SSO 4%</TableHead>
                <TableHead className="text-right">FAOV 1%</TableHead>
                <TableHead className="text-right">RPE 0.5%</TableHead>
                <TableHead className="text-right">Cestaticket</TableHead>
                <TableHead className="text-right font-bold">Neto</TableHead>
                <TableHead className="text-right">Recibo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollSummary.details.map((row) => (
                <TableRow key={row.employeeId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{row.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.centroCostos}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.baseSalary)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    -{formatCurrency(row.deductions.sso)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    -{formatCurrency(row.deductions.faov)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    -{formatCurrency(row.deductions.rpe)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    +{formatCurrency(row.benefits.cestaTicket)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(row.finalPayment)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportPayrollReceipt(row.employeeId)}
                    >
                      <Download className="h-4 w-4" />
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
