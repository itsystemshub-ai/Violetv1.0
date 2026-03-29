import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { formatCurrency } from "@/lib/index";
import { WithholdingService } from "@/modules/finance/services/withholding.service";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Landmark,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

interface FinanceDashboardProps {
  logic: any;
}

export const FinanceDashboard = ({ logic }: FinanceDashboardProps) => {
  const { kpis } = logic;

  const ageingItems = [
    {
      label: "Al día (0-30d)",
      value: logic.ageingData.current,
      color: "#10b981", // emerald-500
    },
    {
      label: "Vencido (31-60d)",
      value: logic.ageingData.pastDue30,
      color: "#f59e0b", // amber-500
    },
    {
      label: "Crítico (90d+)",
      value: logic.ageingData.pastDue90,
      color: "#f43f5e", // rose-500
    },
  ];

  const cashFlowData = [
    {
      name: "Ingresos",
      value: logic.kpis.totalAssets || 4500,
      color: "#10b981",
    },
    {
      name: "Egresos",
      value: logic.kpis.totalExpenses || 2100,
      color: "#f43f5e",
    },
  ];

  const maxVal = Math.max(...ageingItems.map((i) => i.value), 1);

  return (
    <div className="space-y-6">
      {/* Visual KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-none shadow-sm bg-linear-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-badge text-emerald-600/70 mb-1">
                Disponibilidad
              </p>
              <p className="text-numeric-large text-2xl text-emerald-700">
                {formatCurrency(logic.kpis.cashFlow, "USD")}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-sm bg-linear-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-badge text-blue-600/70 mb-1">Total Activos</p>
              <p className="text-numeric-large text-2xl text-blue-700">
                {formatCurrency(logic.kpis.totalAssets, "USD")}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cartera (Advanced Visual) */}
        <Card className="rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5 bg-white/50 backdrop-blur-md">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
            <div>
              <CardTitle className="text-card-title text-primary mb-1">
                Cuentas por Cobrar
              </CardTitle>
              <CardDescription className="text-caption text-muted-foreground/60">
                Distribución de vencimientos
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[200px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageingItems}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ageingItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {ageingItems.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-badge text-muted-foreground/60">
                      {item.label}
                    </span>
                    <span className="text-numeric">
                      {formatCurrency(item.value, "USD")}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${(item.value / maxVal) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transacciones Recientes */}
        <Card className="lg:col-span-2 rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-card-title text-primary mb-1">
                  Últimos Movimientos
                </CardTitle>
                <CardDescription className="text-caption text-muted-foreground/60">
                  Actividad financiera reciente
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-primary/20 text-primary"
              >
                Real-time
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-table-cell">
                <thead>
                  <tr className="bg-muted/5 border-b border-border/40">
                    <th className="px-4 py-3 text-left text-table-header text-muted-foreground/60">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-table-header text-muted-foreground/60">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-table-header text-muted-foreground/60">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {logic.igtfRecords?.slice(0, 8).map((record: any) => (
                    <tr
                      key={record.id}
                      className="hover:bg-muted/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-body font-medium">
                        {record.metodo_pago.toUpperCase()} - Pago Factura
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="text-badge bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        >
                          Ingreso
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-numeric text-emerald-600">
                        +{" "}
                        {formatCurrency(
                          record.monto_base + record.monto_igtf,
                          "USD",
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!logic.igtfRecords || logic.igtfRecords.length === 0) && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-10 text-center text-muted-foreground italic"
                      >
                        No hay movimientos recientes registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bancos y Cuentas */}
        <Card className="rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
            <CardTitle className="text-card-title text-primary mb-1">
              Estado de Cuentas
            </CardTitle>
            <CardDescription className="text-caption text-muted-foreground/60">
              Balances bancarios y efectivo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {logic.accounts
                ?.filter((acc: any) => acc.type === "activo")
                .slice(0, 4)
                .map((acc: any) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-3xl bg-muted/10 border border-border/40 flex items-center gap-4 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-badge text-muted-foreground/60 leading-tight">
                        {acc.name}
                      </p>
                      <p className="text-numeric-large">
                        {formatCurrency(acc.balance, acc.currency || "USD")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones y Reportes */}
        <Card className="rounded-4xl shadow-xl overflow-hidden border-none ring-1 ring-border/5">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
            <CardTitle className="text-card-title text-primary mb-1">
              Centro Fiscal
            </CardTitle>
            <CardDescription className="text-caption text-muted-foreground/60">
              Generación de documentos y exportaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                className="h-24 rounded-3xl flex-col items-start p-5 hover:bg-primary/5 border border-border/40 group relative overflow-hidden transition-all shadow-sm"
                onClick={logic.handleExportLibroVentas}
              >
                <div className="p-2.5 rounded-2xl bg-primary/5 mb-1 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <span className="text-badge text-primary/80">Ventas</span>
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <FileSpreadsheet className="h-16 w-16 -mr-4 -mb-4" />
                </div>
              </Button>
              <Button
                variant="ghost"
                className="h-24 rounded-3xl flex-col items-start p-5 hover:bg-primary/5 border border-border/40 group relative overflow-hidden transition-all shadow-sm"
                onClick={logic.handleExportLibroCompras}
              >
                <div className="p-2.5 rounded-2xl bg-primary/5 mb-1 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <span className="text-badge text-primary/80">Compras</span>
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <FileSpreadsheet className="h-16 w-16 -mr-4 -mb-4" />
                </div>
              </Button>
              <Button
                variant="ghost"
                className="h-24 rounded-3xl flex-col items-start p-5 hover:bg-emerald-500/5 border border-border/40 group relative overflow-hidden transition-all shadow-sm"
                onClick={() =>
                  WithholdingService.downloadIvaXML(
                    logic.invoices,
                    logic.tenant,
                    logic.selectedMonth,
                  )
                }
              >
                <div className="p-2.5 rounded-2xl bg-emerald-500/5 mb-1 group-hover:scale-110 transition-transform">
                  <Download className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-badge text-emerald-600/80">XML Ret.</span>
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Download className="h-16 w-16 -mr-4 -mb-4" />
                </div>
              </Button>
              <Button
                variant="ghost"
                className="h-24 rounded-3xl flex-col items-start p-5 hover:bg-amber-500/5 border border-border/40 group relative overflow-hidden transition-all shadow-sm"
                onClick={logic.handleExportARC}
              >
                <div className="p-2.5 rounded-2xl bg-amber-500/5 mb-1 group-hover:scale-110 transition-transform">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-badge text-amber-600/80">ARC Anual</span>
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Calendar className="h-16 w-16 -mr-4 -mb-4" />
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
