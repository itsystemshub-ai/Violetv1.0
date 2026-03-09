/**
 * PayrollPage - Gestión de Nómina
 */

import { useState } from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Calculator,
  TrendingUp,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { usePayroll } from "../hooks/usePayroll";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export default function PayrollPage() {
  const {
    payrolls,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    deletePayroll,
    calculatePayroll,
    approvePayroll,
    payPayroll,
  } = usePayroll();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(
    null,
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const selectedPayroll = payrolls.find((p) => p.id === selectedPayrollId);

  const kpiStats = [
    {
      label: "Total Nóminas",
      value: stats.totalPayrolls.toString(),
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Pendientes",
      value: stats.pendingPayrolls.toString(),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      label: "Pagado Este Mes",
      value: `$${stats.totalPaidThisMonth.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Promedio Nómina",
      value: `$${stats.avgPayroll.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: "Borrador", className: "bg-gray-500" },
      calculated: { label: "Calculada", className: "bg-blue-500" },
      approved: { label: "Aprobada", className: "bg-yellow-500" },
      paid: { label: "Pagada", className: "bg-green-500" },
    };
    const config = variants[status as keyof typeof variants];
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  if (loading) {
    return (
      <ValeryLayout sidebar={<ValerySidebar />}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </ValeryLayout>
    );
  }

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="w-8 h-8 text-primary" />
              Nómina
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión de pagos y nómina de empleados
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Nómina
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <TabsList className="w-fit">
              <TabsTrigger value="all">
                Todas ({stats.totalPayrolls})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes ({stats.pendingPayrolls})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Pagadas ({stats.paidPayrolls})
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nóminas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value={statusFilter}>
            <Card>
              <CardHeader>
                <CardTitle>Lista de Nóminas</CardTitle>
                <CardDescription>
                  {payrolls.length}{" "}
                  {payrolls.length === 1
                    ? "nómina encontrada"
                    : "nóminas encontradas"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {payrolls.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron nóminas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ID</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Período</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Inicio</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Fin</th>
                          <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Fecha Pago</th>
                          <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Empleados</th>
                          <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Total Neto</th>
                          <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Estado</th>
                          <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {payrolls.map((payroll) => (
                          <tr key={payroll.id} className="hover:bg-accent/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-xs whitespace-nowrap">{payroll.id}</td>
                            <td className="py-3 px-3"><Badge variant="outline" className="text-xs">{payroll.period}</Badge></td>
                            <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{payroll.startDate}</td>
                            <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{payroll.endDate}</td>
                            <td className="py-3 px-3 whitespace-nowrap">{payroll.paymentDate}</td>
                            <td className="py-3 px-3 text-right font-bold">{payroll.totalEmployees}</td>
                            <td className="py-3 px-3 text-right font-bold text-green-600 whitespace-nowrap">${payroll.totalNetSalary.toLocaleString()}</td>
                            <td className="py-3 px-3 text-center">{getStatusBadge(payroll.status)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-0.5">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedPayrollId(payroll.id); setViewDialogOpen(true); }} title="Ver"><Eye className="w-3.5 h-3.5" /></Button>
                                {payroll.status === "draft" && (<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => calculatePayroll(payroll.id)} title="Calcular"><Calculator className="w-3.5 h-3.5 text-blue-600" /></Button>)}
                                {payroll.status === "calculated" && (<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => approvePayroll(payroll.id, "Director")} title="Aprobar"><CheckCircle className="w-3.5 h-3.5 text-green-600" /></Button>)}
                                {payroll.status === "approved" && (<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => payPayroll(payroll.id)} title="Pagar"><DollarSign className="w-3.5 h-3.5 text-green-600" /></Button>)}
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar"><Edit className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedPayrollId(payroll.id); setDeleteDialogOpen(true); }} title="Eliminar"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ModuleAIAssistant
          moduleName="Nómina"
          suggestions={[
            "Analizar costos de nómina",
            "Optimizar deducciones",
            "Predecir gastos futuros",
            "Identificar anomalías",
          ]}
        />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar nómina?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La nómina {selectedPayroll?.id}{" "}
              será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPayrollId) {
                  deletePayroll(selectedPayrollId);
                  setDeleteDialogOpen(false);
                  setSelectedPayrollId(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Nómina</DialogTitle>
            <DialogDescription>
              Información completa de la nómina {selectedPayroll?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-medium">{selectedPayroll.period}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedPayroll.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Pago</p>
                  <p className="font-medium">{selectedPayroll.paymentDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Empleados
                  </p>
                  <p className="font-bold text-2xl">
                    {selectedPayroll.totalEmployees}
                  </p>
                </div>
              </div>
              {selectedPayroll.items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Detalle por Empleado</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 text-sm">Empleado</th>
                          <th className="text-right p-2 text-sm">
                            Salario Base
                          </th>
                          <th className="text-right p-2 text-sm">Bonos</th>
                          <th className="text-right p-2 text-sm">
                            Deducciones
                          </th>
                          <th className="text-right p-2 text-sm">Neto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPayroll.items.map((item) => (
                          <tr key={item.employeeId} className="border-t">
                            <td className="p-2 text-sm">
                              <p className="font-medium">{item.employeeName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.position}
                              </p>
                            </td>
                            <td className="p-2 text-sm text-right">
                              ${item.baseSalary.toLocaleString()}
                            </td>
                            <td className="p-2 text-sm text-right text-green-600">
                              ${item.bonuses.toLocaleString()}
                            </td>
                            <td className="p-2 text-sm text-right text-red-600">
                              -${item.deductions.toLocaleString()}
                            </td>
                            <td className="p-2 text-sm text-right font-bold">
                              ${item.netSalary.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Salario Base:</span>
                  <span className="font-medium">
                    ${selectedPayroll.totalBaseSalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">
                    Total Bonificaciones:
                  </span>
                  <span className="font-medium text-green-600">
                    +${selectedPayroll.totalBonuses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-600">
                    Total Deducciones:
                  </span>
                  <span className="font-medium text-red-600">
                    -${selectedPayroll.totalDeductions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Neto:</span>
                  <span className="text-green-600">
                    ${selectedPayroll.totalNetSalary.toLocaleString()}
                  </span>
                </div>
              </div>
              {selectedPayroll.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPayroll.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ValeryLayout>
  );
}
