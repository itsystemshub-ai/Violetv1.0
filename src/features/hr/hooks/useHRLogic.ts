import { useState, useMemo, useEffect, useCallback } from "react";
import { Employee, formatCurrency } from "@/lib/index";
import { SyncService } from "@/core/sync/SyncService";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { localDb } from "@/core/database/localDb";
import { generatePDFReport } from "@/infrastructure/pdf/pdf-utils";
import { PayrollService } from "@/modules/hr/services/payroll.service";
import { AccountingService } from "@/modules/finance/services/accounting.service";
import { useNotificationStore } from "@/shared/hooks/useNotificationStore";

export function useHRLogic() {
  const { user } = useAuth();
  const { tenant } = useSystemConfig();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosingPayroll, setIsClosingPayroll] = useState(false);

  const isMaster = user?.isSuperAdmin;
  const canManageHR =
    isMaster ||
    user?.department === "Recursos Humanos" ||
    user?.department === "Administración / IT" ||
    user?.role === "admin";

  const fetchEmployees = useCallback(async () => {
    if (!tenant.id || tenant.id === "none") return;

    try {
      const localEmps = await localDb.employees
        .where("tenant_id")
        .equals(tenant.id)
        .toArray();
      if (localEmps.length > 0) {
        setEmployees(localEmps);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const payrollSummary = useMemo(() => {
    return PayrollService.calculateBatch(employees);
  }, [employees]);

  const prestacionesSummary = useMemo(() => {
    return employees
      .filter((e) => e.status === "activo")
      .map((emp) => {
        const calc = PayrollService.calculatePayroll(emp);
        const anosServicio = PayrollService.getAnosServicio(emp.joinDate);
        const trimestres = PayrollService.getTrimestresServicio(emp.joinDate);
        const garantiaTotal =
          PayrollService.calcularGarantiaTrimestral(calc.salarioIntegral) *
          trimestres;
        const retroactividad = PayrollService.calcularRetroactividad(
          anosServicio,
          calc.salarioIntegral,
        );
        const intereses =
          PayrollService.calcularInteresesPrestaciones(garantiaTotal);
        const vacaciones = PayrollService.calcularDiasVacaciones(emp.joinDate);

        return {
          employee: emp,
          anosServicio,
          trimestres,
          salarioIntegral: calc.salarioIntegral,
          garantiaTotal,
          retroactividad,
          mayorPrestacion: Math.max(garantiaTotal, retroactividad),
          interesesMensuales: intereses,
          vacaciones,
        };
      });
  }, [employees]);

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.status === "activo").length;
    const avgSalary =
      employees.length > 0
        ? employees.reduce((acc, curr) => acc + curr.salary, 0) /
          employees.length
        : 0;
    const totalPrestaciones = prestacionesSummary.reduce(
      (acc, p) => acc + p.mayorPrestacion,
      0,
    );

    return { total: employees.length, active, avgSalary, totalPrestaciones };
  }, [employees, prestacionesSummary]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        `${emp.firstName} ${emp.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        emp.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.rif || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [employees, searchTerm]);

  const handleAddEmployee = async (data: Partial<Employee>) => {
    if (!tenant.id || tenant.id === "none") return;

    try {
      const tempId = crypto.randomUUID();
      const dbPayload = {
        id: tempId,
        tenant_id: tenant.id,
        first_name: data.firstName,
        last_name: data.lastName,
        dni: data.dni,
        rif: data.rif || "",
        military_registration: data.militaryRegistration || "",
        cargas_familiares: data.cargasFamiliares || 0,
        centro_costos: data.centroCostos || "Administración",
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        salary: data.salary,
        join_date: data.joinDate || new Date().toISOString().split("T")[0],
        status: "activo",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await SyncService.mutate(
        "employees",
        "INSERT",
        dbPayload,
        tempId,
      );

      if (error) throw error;

      const newEmp: Employee = {
        id: dbPayload.id,
        tenant_id: dbPayload.tenant_id,
        firstName: dbPayload.first_name || "",
        lastName: dbPayload.last_name || "",
        dni: dbPayload.dni || "",
        rif: dbPayload.rif,
        militaryRegistration: dbPayload.military_registration,
        cargasFamiliares: dbPayload.cargas_familiares,
        centroCostos: dbPayload.centro_costos,
        email: dbPayload.email || "",
        phone: dbPayload.phone || "",
        position: dbPayload.position || "",
        department: dbPayload.department || "",
        salary: Number(dbPayload.salary) || 0,
        joinDate: dbPayload.join_date || "",
        status: dbPayload.status as any,
      };

      setEmployees((prev) => [...prev, newEmp]);
      await localDb.employees.put(newEmp);

      toast.success("Colaborador registrado exitosamente.");
      setIsAddDialogOpen(false);

      useNotificationStore.getState().addNotification({
        module: "RRHH",
        type: "success",
        title: "Nuevo Ingreso",
        message: `Se ha registrado a ${newEmp.firstName} ${newEmp.lastName} como ${newEmp.position}.`,
      });
    } catch (error) {
      console.error("Error al agregar empleado:", error);
      toast.error("Error al registrar el colaborador.");
    }
  };

  const handleClosePayroll = async () => {
    if (!tenant.id || tenant.id === "none") return;
    if (payrollSummary.count === 0) {
      toast.error("No hay empleados activos para procesar la nómina.");
      return;
    }

    setIsClosingPayroll(true);
    try {
      const periodDate = new Date().toISOString().split("T")[0];
      const batchId = crypto.randomUUID();

      const payRecords = payrollSummary.details.map((d) => ({
        id: crypto.randomUUID(),
        tenant_id: tenant.id,
        employee_id: d.employeeId,
        period_date: periodDate,
        base_salary: d.baseSalary,
        deductions_total: d.deductions.total,
        deductions_sso: d.deductions.sso,
        deductions_faov: d.deductions.faov,
        deductions_rpe: d.deductions.rpe,
        benefits_total: d.benefits.cestaTicket,
        net_payment: d.finalPayment,
        batch_id: batchId,
        created_at: new Date().toISOString(),
      }));

      await localDb.payroll_records.bulkPut(payRecords);

      for (const emp of employees.filter((e) => e.status === "activo")) {
        const calc = PayrollService.calculatePayroll(emp);
        await localDb.salary_history.put({
          id: crypto.randomUUID(),
          employee_id: emp.id,
          tenant_id: tenant.id,
          monto: emp.salary,
          salario_integral: calc.salarioIntegral,
          fecha_desde: periodDate,
          tipo: "base",
        });
      }

      await AccountingService.postTransaction({
        tenantId: tenant.id,
        description: `Cierre de Nómina Periodo: ${periodDate}`,
        referenceId: batchId,
        entries: [
          {
            accountCode: "5.1.01.01",
            type: "debe",
            amount:
              payrollSummary.totalSalaries + payrollSummary.totalCestaTicket,
          },
          {
            accountCode: "2.1.03.01",
            type: "haber",
            amount: payrollSummary.totalToPay,
          },
          {
            accountCode: "2.1.02.01",
            type: "haber",
            amount: payrollSummary.totalDeductions,
          },
        ],
      });

      toast.success(
        "Nómina cerrada con éxito. Se generaron los asientos contables.",
      );

      useNotificationStore.getState().addNotification({
        module: "RRHH",
        type: "success",
        title: "Nómina Procesada",
        message: `Se ha cerrado la nómina para ${payrollSummary.count} empleados. Total a pagar: ${formatCurrency(payrollSummary.totalToPay)}.`,
      });
    } catch (error) {
      console.error("Error al cerrar nómina:", error);
      toast.error("Error al procesar el cierre de nómina.");
    } finally {
      setIsClosingPayroll(false);
    }
  };

  const handleExportReport = () => {
    generatePDFReport({
      title: "Nómina y Directorio",
      subtitle: `Empresa: ${tenant.name} | Listado Oficial de Colaboradores`,
      filename: `nomina_${new Date().toISOString().split("T")[0]}.pdf`,
      columns: [
        { header: "Nombre", dataKey: "name" },
        { header: "Cédula", dataKey: "dni" },
        { header: "RIF", dataKey: "rif" },
        { header: "Cargo", dataKey: "position" },
        { header: "Centro de Costos", dataKey: "centroCostos" },
        { header: "Salario", dataKey: "salary" },
      ],
      data: employees.map((emp) => ({
        name: `${emp.firstName} ${emp.lastName}`,
        dni: emp.dni,
        rif: emp.rif || "-",
        position: emp.position,
        centroCostos: emp.centroCostos || "-",
        salary: formatCurrency(emp.salary, "USD"),
      })),
    });
    toast.success("Directorio exportado exitosamente.");
  };

  const handleExportPayrollReceipt = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    const calc = PayrollService.calculatePayroll(emp);

    generatePDFReport({
      title: "RECIBO DE PAGO",
      subtitle: `Empresa: ${tenant.name}\nRIF: ${tenant.rif || "-"}\nEmpleado: ${emp.firstName} ${emp.lastName} | C.I.: ${emp.dni}\nPeriodo: ${new Date().toLocaleDateString("es-VE", { month: "long", year: "numeric" })}`,
      filename: `recibo_${emp.dni}_${new Date().toISOString().split("T")[0]}.pdf`,
      columns: [
        { header: "Concepto", dataKey: "concept" },
        { header: "Asignación", dataKey: "assigned" },
        { header: "Deducción", dataKey: "deduction" },
      ],
      data: [
        {
          concept: "Sueldo Base",
          assigned: formatCurrency(calc.baseSalary),
          deduction: "",
        },
        {
          concept: "Bono Alimentación (Cestaticket)",
          assigned: formatCurrency(calc.benefits.cestaTicket),
          deduction: "",
        },
        {
          concept: "S.S.O. (IVSS 4%)",
          assigned: "",
          deduction: formatCurrency(calc.deductions.sso),
        },
        {
          concept: "F.A.O.V. (BANAVIH 1%)",
          assigned: "",
          deduction: formatCurrency(calc.deductions.faov),
        },
        {
          concept: "R.P.E. (Paro Forzoso 0.5%)",
          assigned: "",
          deduction: formatCurrency(calc.deductions.rpe),
        },
        { concept: "", assigned: "", deduction: "" },
        {
          concept: "TOTAL NETO A PAGAR",
          assigned: formatCurrency(calc.finalPayment),
          deduction: "",
        },
      ],
    });
    toast.success(`Recibo generado para ${emp.firstName}.`);
  };

  const handleExportIVSS = () => {
    const lines = employees
      .filter((e) => e.status === "activo")
      .map((emp) => {
        return `${emp.dni.replace(/\D/g, "")}\t${emp.lastName}\t${emp.firstName}\t${emp.salary.toFixed(2)}\t${emp.joinDate}`;
      });
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ivss_tiuna_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Archivo TXT para IVSS (Tiuna) generado.");
  };

  const handleExportFAOV = () => {
    const lines = employees
      .filter((e) => e.status === "activo")
      .map((emp) => {
        const faov = PayrollService.calcularFAOV(
          PayrollService.calcularSalarioIntegral(emp.salary),
        );
        return `${emp.dni.replace(/\D/g, "")}\t${emp.lastName} ${emp.firstName}\t${emp.salary.toFixed(2)}\t${faov.toFixed(2)}`;
      });
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faov_banavih_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Archivo TXT para FAOV (BANAVIH) generado.");
  };

  const handleExportLiquidacion = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const p = prestacionesSummary.find((ps) => ps.employee.id === empId);
    if (!p) return;

    const salarioDiario = emp.salary / 30;
    const bonoVacacionalMonto = salarioDiario * p.vacaciones.bonoVacacional;

    generatePDFReport({
      title: "LIQUIDACIÓN DE PRESTACIONES SOCIALES",
      subtitle: `Empresa: ${tenant.name}\nEmpleado: ${emp.firstName} ${emp.lastName} | C.I.: ${emp.dni}\nFecha Ingreso: ${emp.joinDate} | Antigüedad: ${p.anosServicio.toFixed(1)} años`,
      filename: `liquidacion_${emp.dni}_${new Date().toISOString().split("T")[0]}.pdf`,
      columns: [
        { header: "Concepto", dataKey: "concept" },
        { header: "Monto", dataKey: "amount" },
      ],
      data: [
        {
          concept: "Garantía Trimestral Acumulada (Art. 142a)",
          amount: formatCurrency(p.garantiaTotal),
        },
        {
          concept: `Retroactividad: 30 días × ${p.anosServicio.toFixed(1)} años (Art. 142b)`,
          amount: formatCurrency(p.retroactividad),
        },
        {
          concept: "→ SE PAGA EL MAYOR",
          amount: formatCurrency(p.mayorPrestacion),
        },
        { concept: "", amount: "" },
        {
          concept: `Intereses Sobre Prestaciones (mensual estimado)`,
          amount: formatCurrency(p.interesesMensuales),
        },
        {
          concept: `Vacaciones fraccionadas (${p.vacaciones.total} días)`,
          amount: formatCurrency(salarioDiario * p.vacaciones.total),
        },
        {
          concept: `Bono Vacacional (${p.vacaciones.bonoVacacional} días)`,
          amount: formatCurrency(bonoVacacionalMonto),
        },
        { concept: "", amount: "" },
        {
          concept: "TOTAL LIQUIDACIÓN ESTIMADA",
          amount: formatCurrency(
            p.mayorPrestacion +
              salarioDiario * p.vacaciones.total +
              bonoVacacionalMonto,
          ),
        },
      ],
    });
    toast.success(`Liquidación generada para ${emp.firstName}.`);
  };

  return {
    tenant,
    employees,
    searchTerm,
    setSearchTerm,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isLoading,
    isClosingPayroll,
    canManageHR,
    payrollSummary,
    prestacionesSummary,
    stats,
    filteredEmployees,
    handleAddEmployee,
    handleClosePayroll,
    handleExportReport,
    handleExportPayrollReceipt,
    handleExportIVSS,
    handleExportFAOV,
    handleExportLiquidacion,
  };
}

export type HRLogic = ReturnType<typeof useHRLogic>;
