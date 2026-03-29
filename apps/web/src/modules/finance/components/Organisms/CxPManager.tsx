/**
 * CxPManager - Organismo para gestión de Cuentas por Pagar (Modular)
 */

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Plus,
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { ValeryTable } from "@/components/tables/ValeryTable";
import { formatCurrency } from "@/lib";
import { useAccountsPayable } from "@/modules/accounts-payable/hooks/useAccountsPayable";

interface CxPManagerProps {
  logic: any;
}

export const CxPManager: React.FC<CxPManagerProps> = ({ logic }) => {
  const {
    accounts = [],
    stats = {
      totalPayable: 0,
      overdueCount: 0,
      pendingCount: 0,
      dueThisWeek: 0,
    },
    priorityPayments = [],
  } = useAccountsPayable();

  const columns = [
    { key: "billNumber", label: "Número", width: "120px" },
    { key: "supplierName", label: "Proveedor" },
    {
      key: "billDate",
      label: "Fecha",
      width: "120px",
      render: (value: string) => new Date(value).toLocaleDateString("es-VE"),
    },
    {
      key: "dueDate",
      label: "Vencimiento",
      width: "120px",
      render: (value: string) => new Date(value).toLocaleDateString("es-VE"),
    },
    {
      key: "totalAmount",
      label: "Total",
      width: "120px",
      align: "right" as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "balance",
      label: "Saldo",
      width: "120px",
      align: "right" as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "status",
      label: "Estado",
      width: "120px",
      align: "center" as const,
      render: (value: string) => {
        const variants: Record<
          string,
          "default" | "destructive" | "secondary" | "outline"
        > = {
          pending: "default",
          overdue: "destructive",
          paid: "secondary",
          partial: "outline",
        };
        return (
          <Badge variant={variants[value] || "default"}>
            {value.toUpperCase()}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs específicos de CxP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-red-500/10 bg-linear-to-br from-white to-red-50/30 dark:from-slate-900 dark:to-red-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total por Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalPayable)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500/10 bg-linear-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-orange-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Facturas Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.overdueCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/10 bg-linear-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-500/10 bg-linear-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Vence esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.dueThisWeek)}
            </div>
          </CardContent>
        </Card>
      </div>

      <ValeryTable
        title="Facturas por Pagar"
        columns={columns}
        data={accounts}
        actions={[
          {
            label: "Registrar Pago",
            onClick: (row) => console.log("Pagar", row),
            show: (row) => row.status !== "paid",
          },
          {
            label: "Ver Detalles",
            onClick: (row) => console.log("Ver", row),
          },
        ]}
        searchPlaceholder="Buscar por proveedor o número..."
        headerActions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura de Compra
          </Button>
        }
      />

      {/* Pagos Prioritarios */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 h-5 text-orange-500" />
            Pagos Prioritarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorityPayments.length > 0 ? (
              priorityPayments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-xl bg-card hover:shadow-md transition-all"
                >
                  <div>
                    <div className="font-bold text-sm">
                      {payment.supplierName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {payment.invoiceNumber} • Vence:{" "}
                      {new Date(payment.dueDate).toLocaleDateString("es-VE")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-destructive">
                      {formatCurrency(payment.balance)}
                    </div>
                    <Badge variant="destructive" className="text-[10px] h-4">
                      ALTA
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-muted-foreground italic">
                No hay pagos críticos programados para hoy
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
