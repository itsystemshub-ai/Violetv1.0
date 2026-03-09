/**
 * EmployeesPage - Gestión de Empleados
 */

import { useState } from "react";
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
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  DollarSign,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useEmployees } from "../hooks/useEmployees";
import { PremiumHUD } from "@/shared/components/stitch/PremiumHUD";
import { automationHub } from "@/core/infrastructure/automation/AutomationHub";
import { useTenant } from "@/shared/hooks/useTenant";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export default function EmployeesPage() {
  const {
    employees,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    stats,
    deleteEmployee,
    activateEmployee,
    deactivateEmployee,
    setOnLeave,
  } = useEmployees();
  const { tenant } = useTenant();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const kpiStats = [
    {
      label: "Total Empleados",
      value: stats.totalEmployees.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Empleados Activos",
      value: stats.activeEmployees.toString(),
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Nómina Total",
      value: `$${stats.totalPayroll.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Departamentos",
      value: stats.departments.toString(),
      icon: Briefcase,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Activo", className: "bg-green-500 hover:bg-green-600" },
      inactive: {
        label: "Inactivo",
        className: "bg-gray-500 hover:bg-gray-600",
      },
      on_leave: {
        label: "De Permiso",
        className: "bg-yellow-500 hover:bg-yellow-600",
      },
      terminated: {
        label: "Terminado",
        className: "bg-red-500 hover:bg-red-600",
      },
    };
    const config = variants[status as keyof typeof variants];
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const handleDelete = () => {
    if (selectedEmployeeId) {
      deleteEmployee(selectedEmployeeId);
      setDeleteDialogOpen(false);
      setSelectedEmployeeId(null);
    }
  };

  const handleView = (id: string) => {
    setSelectedEmployeeId(id);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <PremiumHUD active={true}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Empleados
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión completa de recursos humanos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full shadow-sm gap-2 border-violet-500/30 bg-violet-500/5 text-violet-600 hover:bg-violet-500/10 h-10 px-6"
              onClick={() => {
                automationHub.trigger("/hr/payroll/orchestrate", {
                  tenantId: tenant?.id,
                  employeeCount: employees.length,
                  timestamp: new Date().toISOString(),
                });
                toast.success("Orquestación de nómina enviada a n8n");
              }}
            >
              <Sparkles className="w-4 h-4" />
              Procesar Nómina IA
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Empleado
            </Button>
          </div>
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

        <div className="flex flex-col lg:flex-row gap-4">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="flex-1"
          >
            <TabsList className="w-fit">
              <TabsTrigger value="all">
                Todos ({stats.totalEmployees})
              </TabsTrigger>
              <TabsTrigger value="active">
                Activos ({stats.activeEmployees})
              </TabsTrigger>
              <TabsTrigger value="on_leave">
                De Permiso ({stats.onLeaveEmployees})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="DEPT-001">Ventas</SelectItem>
                <SelectItem value="DEPT-002">Finanzas</SelectItem>
                <SelectItem value="DEPT-003">Tecnología</SelectItem>
                <SelectItem value="DEPT-004">Administración</SelectItem>
                <SelectItem value="DEPT-005">Operaciones</SelectItem>
                <SelectItem value="DEPT-006">RRHH</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empleados..."
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

        <Card>
          <CardHeader>
            <CardTitle>Lista de Empleados</CardTitle>
            <CardDescription>
              {employees.length}{" "}
              {employees.length === 1
                ? "empleado encontrado"
                : "empleados encontrados"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {employees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron empleados
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Código
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">
                        Nombre
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">
                        Puesto
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">
                        Departamento
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">
                        Email
                      </th>
                      <th className="text-right py-3 px-3 font-semibold text-muted-foreground">
                        Salario
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">
                        Ingreso
                      </th>
                      <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                        Estado
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {employees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="hover:bg-accent/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-xs">
                          {employee.code}
                        </td>
                        <td className="py-3 px-3 font-semibold max-w-[160px] break-words">
                          {employee.fullName}
                        </td>
                        <td className="py-3 px-3 max-w-[140px] break-words">
                          {employee.position}
                        </td>
                        <td className="py-3 px-3">{employee.department}</td>
                        <td className="py-3 px-3 text-xs max-w-[160px] break-words">
                          {employee.email}
                        </td>
                        <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                          ${employee.salary.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                          {employee.hireDate}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {getStatusBadge(employee.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleView(employee.id)}
                              title="Ver"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {employee.status === "active" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setOnLeave(employee.id)}
                                title="Permiso"
                              >
                                <UserX className="w-3.5 h-3.5 text-yellow-600" />
                              </Button>
                            )}
                            {employee.status === "inactive" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => activateEmployee(employee.id)}
                                title="Activar"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedEmployeeId(employee.id);
                                setDeleteDialogOpen(true);
                              }}
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
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

        <ModuleAIAssistant
          moduleName="Empleados"
          suggestions={[
            "Analizar rotación de personal",
            "Identificar necesidades de capacitación",
            "Optimizar estructura organizacional",
            "Predecir necesidades de contratación",
          ]}
        />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El empleado{" "}
              {selectedEmployee?.fullName} será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
            <DialogTitle>Detalles del Empleado</DialogTitle>
            <DialogDescription>
              Información completa de {selectedEmployee?.fullName}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-medium">{selectedEmployee.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedEmployee.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Puesto</p>
                  <p className="font-medium">{selectedEmployee.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departamento</p>
                  <p className="font-medium">{selectedEmployee.department}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Información Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{selectedEmployee.phone}</p>
                  </div>
                  {selectedEmployee.birthDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Fecha de Nacimiento
                      </p>
                      <p className="font-medium">
                        {selectedEmployee.birthDate}
                      </p>
                    </div>
                  )}
                  {selectedEmployee.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">{selectedEmployee.address}</p>
                    </div>
                  )}
                  {selectedEmployee.city && (
                    <div>
                      <p className="text-sm text-muted-foreground">Ciudad</p>
                      <p className="font-medium">{selectedEmployee.city}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Información Laboral</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fecha de Ingreso
                    </p>
                    <p className="font-medium">{selectedEmployee.hireDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Salario</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${selectedEmployee.salary.toLocaleString()}
                    </p>
                  </div>
                  {selectedEmployee.taxId && (
                    <div>
                      <p className="text-sm text-muted-foreground">RFC</p>
                      <p className="font-medium">{selectedEmployee.taxId}</p>
                    </div>
                  )}
                  {selectedEmployee.bankAccount && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Cuenta Bancaria
                      </p>
                      <p className="font-medium font-mono">
                        {selectedEmployee.bankAccount}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {(selectedEmployee.emergencyContact ||
                selectedEmployee.emergencyPhone) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Contacto de Emergencia</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEmployee.emergencyContact && (
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre</p>
                        <p className="font-medium">
                          {selectedEmployee.emergencyContact}
                        </p>
                      </div>
                    )}
                    {selectedEmployee.emergencyPhone && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Teléfono
                        </p>
                        <p className="font-medium">
                          {selectedEmployee.emergencyPhone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PremiumHUD>
  );
}
