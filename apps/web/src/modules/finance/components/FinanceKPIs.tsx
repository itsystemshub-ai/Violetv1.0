import { Wallet, Scale, Receipt, Zap } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { formatCurrency } from "@/lib/index";

interface FinanceKPIsProps {
  logic: any;
}

export const FinanceKPIs = ({ logic }: FinanceKPIsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium">Activos Totales</span>
        </div>
        <p className="text-2xl font-bold mt-2">
          {formatCurrency(logic.financialSummary?.assets || 0, "USD")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          ≈ {formatCurrency(logic.financialSummary?.assets_bs || 0, "VES")}
        </p>
      </Card>
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-rose-600" />
          <span className="text-sm font-medium">Cuentas por Pagar</span>
        </div>
        <p className="text-2xl font-bold mt-2 text-rose-600">
          {formatCurrency(logic.financialSummary?.liabilities || 0, "USD")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          ≈ {formatCurrency(logic.financialSummary?.liabilities_bs || 0, "VES")}
        </p>
      </Card>
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">Utilidad Neta</span>
        </div>
        <p className="text-2xl font-bold mt-2">
          {formatCurrency(logic.financialSummary?.netIncome || 0, "USD")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          ≈ {formatCurrency(logic.financialSummary?.netIncome_bs || 0, "VES")}
        </p>
      </Card>
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium">IGTF Mensual</span>
        </div>
        <p className="text-2xl font-bold mt-2 text-amber-600">
          {formatCurrency(logic.igtfSummary?.totalIGTF || 0, "USD")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {logic.igtfSummary?.transacciones || 0} operaciones
        </p>
      </Card>
    </div>
  );
};
