/**
 * AttendancePage - Gestión de Asistencia de Empleados
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
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  LogIn,
  LogOut,
} from "lucide-react";
import { ModuleAIAssistant } from "@/core/ai/components";
import { useAttendance } from "../hooks/useAttendance";
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

export default function AttendancePage() {
  const {
    attendance,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    stats,
    deleteAttendance,
  } = useAttendance();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const selectedRecord = attendance.find((a) => a.id === selectedRecordId);

  const kpiStats = [
    {
      label: "Presentes Hoy",
      value: stats.presentToday.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Ausentes Hoy",
      value: stats.absentToday.toString(),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "Tasa de Asistencia",
      value: `${stats.attendanceRate}%`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Horas Trabajadas",
      value: stats.totalHoursToday.toFixed(1),
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      present: {
        label: "Presente",
        className: "bg-green-500 hover:bg-green-600",
        icon: CheckCircle,
      },
      absent: {
        label: "Ausente",
        className: "bg-red-500 hover:bg-red-600",
        icon: XCircle,
      },
      late: {
        label: "Tarde",
        className: "bg-yellow-500 hover:bg-yellow-600",
        icon: Clock,
      },
      half_day: {
        label: "Medio Día",
        className: "bg-blue-500 hover:bg-blue-600",
        icon: Clock,
      },
      on_leave: {
        label: "Permiso",
        className: "bg-purple-500 hover:bg-purple-600",
        icon: Calendar,
      },
    };
    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;
    return (
      <Badge
        className={`${config.className} text-white flex items-center gap-1 w-fit`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getLeaveTypeBadge = (leaveType?: string) => {
    if (!leaveType) return null;
    const variants = {
      sick: {
        label: "Enfermedad",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      vacation: {
        label: "Vacaciones",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      personal: {
        label: "Personal",
        className:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      },
      unpaid: {
        label: "Sin Goce",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      },
    };
    const config = variants[leaveType as keyof typeof variants];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleDelete = () => {
    if (selectedRecordId) {
      deleteAttendance(selectedRecordId);
      setDeleteDialogOpen(false);
      setSelectedRecordId(null);
    }
  };

  const handleView = (id: string) => {
    setSelectedRecordId(id);
    setViewDialogOpen(true);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              Asistencia de Empleados
            </h1>
            <p className="text-muted-foreground mt-1">
              Control y registro de asistencia diaria
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <LogIn className="w-4 h-4" />
              Check In
            </Button>
            <Button variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              Check Out
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Registrar Asistencia
            </Button>
          </div>
        </div>

        {/* KPIs */}
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

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="flex-1"
          >
            <TabsList className="w-fit">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="present">
                Presentes ({stats.presentToday})
              </TabsTrigger>
              <TabsTrigger value="absent">
                Ausentes ({stats.absentToday})
              </TabsTrigger>
              <TabsTrigger value="late">Tarde ({stats.lateToday})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mes</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empleado..."
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
            <CardTitle>Registros de Asistencia</CardTitle>
            <CardDescription>
              {attendance.length}{" "}
              {attendance.length === 1 ? "registro encontrado" : "registros encontrados"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {attendance.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron registros</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Empleado</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Departamento</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Fecha</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Entrada</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Salida</th>
                      <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Horas</th>
                      <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Extras</th>
                      <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Estado</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendance.map((record) => (
                      <tr key={record.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">{record.employeeId}</td>
                        <td className="py-3 px-3 font-semibold max-w-[160px] break-words">{record.employeeName}</td>
                        <td className="py-3 px-3">{record.department}</td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{record.date}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{record.checkIn || '—'}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{record.checkOut || '—'}</td>
                        <td className="py-3 px-3 text-right">{record.hoursWorked ? `${record.hoursWorked.toFixed(1)}h` : '—'}</td>
                        <td className="py-3 px-3 text-right text-orange-600">{record.overtimeHours && record.overtimeHours > 0 ? `+${record.overtimeHours.toFixed(1)}h` : '—'}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {getStatusBadge(record.status)}
                            {record.leaveType && getLeaveTypeBadge(record.leaveType)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(record.id)} title="Ver"><Eye className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedRecordId(record.id); setDeleteDialogOpen(true); }} title="Eliminar"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
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

        {/* AI Assistant */}
        <ModuleAIAssistant
          moduleName="Asistencia"
          suggestions={[
            "Analizar patrones de ausentismo",
            "Identificar empleados con llegadas tarde frecuentes",
            "Calcular horas extras del mes",
            "Generar reporte de asistencia",
          ]}
        />
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro {selectedRecord?.id}{" "}
              será eliminado permanentemente.
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Registro</DialogTitle>
            <DialogDescription>
              Información completa del registro {selectedRecord?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Empleado</p>
                  <p className="font-medium">{selectedRecord.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-medium">{selectedRecord.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departamento</p>
                  <p className="font-medium">{selectedRecord.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{selectedRecord.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedRecord.status)}
                </div>
                {selectedRecord.leaveType && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tipo de Permiso
                    </p>
                    {getLeaveTypeBadge(selectedRecord.leaveType)}
                  </div>
                )}
              </div>

              {(selectedRecord.checkIn || selectedRecord.checkOut) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Horario</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRecord.checkIn && (
                      <div>
                        <p className="text-sm text-muted-foreground">Entrada</p>
                        <p className="font-medium text-lg">
                          {selectedRecord.checkIn}
                        </p>
                      </div>
                    )}
                    {selectedRecord.checkOut && (
                      <div>
                        <p className="text-sm text-muted-foreground">Salida</p>
                        <p className="font-medium text-lg">
                          {selectedRecord.checkOut}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(selectedRecord.hoursWorked || selectedRecord.overtimeHours) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Horas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRecord.hoursWorked && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Horas Trabajadas
                        </p>
                        <p className="font-medium text-lg">
                          {selectedRecord.hoursWorked.toFixed(2)}h
                        </p>
                      </div>
                    )}
                    {selectedRecord.overtimeHours &&
                      selectedRecord.overtimeHours > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Horas Extras
                          </p>
                          <p className="font-medium text-lg text-orange-600">
                            +{selectedRecord.overtimeHours.toFixed(2)}h
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {selectedRecord.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecord.notes}
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
