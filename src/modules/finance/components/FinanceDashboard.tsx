import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { formatCurrency } from "@/lib/index";
import { WithholdingService } from "@/lib/WithholdingService";

interface FinanceDashboardProps {
  logic: any;
}

export const FinanceDashboard = ({ logic }: FinanceDashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">
            Cuentas por Cobrar (Vencimiento)
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Al día (0-30d)</span>
              <span className="font-bold">
                {formatCurrency(logic.ageingData.current, "USD")}
              </span>
            </div>
            <div className="flex justify-between items-center text-amber-600">
              <span>Vencido (31-60d)</span>
              <span className="font-bold">
                {formatCurrency(logic.ageingData.pastDue30, "USD")}
              </span>
            </div>
            <div className="flex justify-between items-center text-rose-600">
              <span>Crítico (90d+)</span>
              <span className="font-bold">
                {formatCurrency(logic.ageingData.pastDue90, "USD")}
              </span>
            </div>
            <div className="pt-4 border-t flex justify-between items-center font-black">
              <span>Total Cartera:</span>
              <span>{formatCurrency(logic.ageingData.total, "USD")}</span>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Acciones de Reporte</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={logic.handleExportLibroVentas}>
              Libro Ventas
            </Button>
            <Button variant="outline" onClick={logic.handleExportLibroCompras}>
              Libro Compras
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                WithholdingService.downloadIvaXML(
                  logic.invoices,
                  logic.tenant,
                  logic.selectedMonth,
                )
              }
            >
              XML Retenciones
            </Button>
            <Button variant="outline" onClick={logic.handleExportARC}>
              ARC Anual
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
