import { FileText, Download, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { toast } from "sonner";
import { HRLogic } from "@/features/hr/hooks/useHRLogic";

interface HRReportsProps {
  logic: HRLogic;
}

export function HRReports({ logic }: HRReportsProps) {
  const {
    employees,
    handleExportIVSS,
    handleExportFAOV,
    handleExportReport,
    handleExportPayrollReceipt,
    handleExportLiquidacion,
  } = logic;

  const handleAction = (
    action: (id: string) => void,
    errorMsg: string = "No hay empleados registrados.",
  ) => {
    if (employees.length > 0) {
      action(employees[0].id);
    } else {
      toast.error(errorMsg);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card
        className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
        onClick={handleExportIVSS}
      >
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 group-hover:bg-blue-500/20 transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">TXT IVSS (Tiuna)</h3>
              <p className="text-xs text-muted-foreground">
                Movimientos de ingresos y egresos para el Seguro Social
                Obligatorio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
        onClick={handleExportFAOV}
      >
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">TXT FAOV (BANAVIH)</h3>
              <p className="text-xs text-muted-foreground">
                Listado mensual de aportes de la Ley de Política Habitacional.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
        onClick={handleExportReport}
      >
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 group-hover:bg-purple-500/20 transition-colors">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Directorio PDF</h3>
              <p className="text-xs text-muted-foreground">
                Listado completo de empleados con cédula, RIF, cargo y salario.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
        onClick={() => handleAction(handleExportPayrollReceipt)}
      >
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 group-hover:bg-amber-500/20 transition-colors">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Recibo de Pago</h3>
              <p className="text-xs text-muted-foreground">
                Genera recibos individuales con desglose SSO, FAOV, RPE y
                Cestaticket.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
        onClick={() => handleAction(handleExportLiquidacion)}
      >
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-600 group-hover:bg-rose-500/20 transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Liquidación de Prestaciones</h3>
              <p className="text-xs text-muted-foreground">
                Documento Art. 142 LOTTT con cálculo dual y bono vacacional.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
