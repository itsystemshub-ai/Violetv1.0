import { Employee } from '@/lib';

/**
 * PayrollService - Motor de Nómina Venezuela (LOTTT)
 */
export const PayrollService = {
  DEDUCTIONS: {
    SSO: 0.04,
    FAOV: 0.01,
    RPE: 0.005,
  },

  EMPLOYER_CONTRIBUTIONS: {
    SSO: 0.12,
    FAOV: 0.02,
    RPE: 0.02,
    INCE: 0.02,
  },

  SALARIO_MINIMO: 130,
  CESTATICKET_DIARIO: 2.5,
  TASA_BCV_ANUAL: 0.1494,
  DIAS_UTILIDADES: 30,
  DIAS_BONO_VACACIONAL: 15,
  DIAS_VACACIONES_BASE: 15,

  calcularSalarioIntegral(salarioMensual: number, diasUtilidades: number = 30, diasBonoVacacional: number = 15): number {
    const salarioDiario = salarioMensual / 30;
    const alicuotaUtilidades = (salarioDiario * diasUtilidades) / 360;
    const alicuotaBonoVacacional = (salarioDiario * diasBonoVacacional) / 360;
    return parseFloat(((salarioDiario + alicuotaUtilidades + alicuotaBonoVacacional) * 30).toFixed(2));
  },

  calcularSSO(sueldoMensual: number, lunesDelMes: number = 4): number {
    const tope = this.SALARIO_MINIMO * 5;
    const sueldoBaseCalculo = Math.min(sueldoMensual, tope);
    const ssoSemanal = (sueldoBaseCalculo * 12) / 52;
    const retencion = (ssoSemanal * lunesDelMes) * this.DEDUCTIONS.SSO;
    return parseFloat(retencion.toFixed(2));
  },

  calcularFAOV(salarioIntegral: number): number {
    return parseFloat((salarioIntegral * this.DEDUCTIONS.FAOV).toFixed(2));
  },

  calcularRPE(sueldoMensual: number): number {
    return parseFloat((sueldoMensual * this.DEDUCTIONS.RPE).toFixed(2));
  },

  calcularCestaticket(diasTrabajados: number = 22): number {
    return parseFloat((this.CESTATICKET_DIARIO * diasTrabajados).toFixed(2));
  },

  calcularGarantiaTrimestral(salarioIntegral: number): number {
    const salarioDiarioIntegral = salarioIntegral / 30;
    return parseFloat((salarioDiarioIntegral * 15).toFixed(2));
  },

  calcularRetroactividad(anosServicio: number, ultimoSalarioIntegral: number): number {
    const salarioDiarioIntegral = ultimoSalarioIntegral / 30;
    return parseFloat((salarioDiarioIntegral * 30 * anosServicio).toFixed(2));
  },

  calcularInteresesPrestaciones(acumuladoPrestaciones: number, tasaAnual: number = 0.1494): number {
    const tasaMensual = tasaAnual / 12;
    return parseFloat((acumuladoPrestaciones * tasaMensual).toFixed(2));
  },

  getAnosServicio(fechaIngreso: string): number {
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diffMs = hoy.getTime() - ingreso.getTime();
    return parseFloat((diffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2));
  },

  getTrimestresServicio(fechaIngreso: string): number {
    const anos = this.getAnosServicio(fechaIngreso);
    return Math.floor(anos * 4);
  },

  calcularDiasVacaciones(fechaIngreso: string) {
    const anos = Math.floor(this.getAnosServicio(fechaIngreso));
    const adicionales = Math.min(anos, 15);
    const base = this.DIAS_VACACIONES_BASE;
    const bonoVacacional = this.DIAS_BONO_VACACIONAL + Math.min(anos, 15);
    return { base, adicionales, total: base + adicionales, bonoVacacional };
  },

  calculatePayroll(employee: Employee, config?: { lunesDelMes?: number; diasTrabajados?: number }) {
    const baseSalary = employee.salary;
    const lunesDelMes = config?.lunesDelMes || 4;
    const diasTrabajados = config?.diasTrabajados || 22;

    const salarioIntegral = this.calcularSalarioIntegral(baseSalary);

    const sso = this.calcularSSO(baseSalary, lunesDelMes);
    const faov = this.calcularFAOV(salarioIntegral);
    const rpe = this.calcularRPE(baseSalary);
    const totalDeductions = sso + faov + rpe;

    const netSalary = baseSalary - totalDeductions;
    const cestaTicket = this.calcularCestaticket(diasTrabajados);
    const finalPayment = netSalary + cestaTicket;

    const anosServicio = this.getAnosServicio(employee.joinDate);
    const garantiaTrimestral = this.calcularGarantiaTrimestral(salarioIntegral);

    return {
      baseSalary,
      salarioIntegral,
      deductions: {
        sso,
        faov,
        rpe,
        total: totalDeductions
      },
      netSalary,
      benefits: {
        cestaTicket
      },
      finalPayment,
      prestaciones: {
        anosServicio,
        garantiaTrimestral,
        retroactividad: this.calcularRetroactividad(anosServicio, salarioIntegral),
      },
      currency: "USD"
    };
  },

  calculateBatch(employees: Employee[], config?: { lunesDelMes?: number; diasTrabajados?: number }) {
    const activeEmployees = employees.filter(e => e.status === 'activo');

    let totalSalaries = 0;
    let totalDeductions = 0;
    let totalCestaTicket = 0;
    let totalToPay = 0;
    let totalSSO = 0;
    let totalFAOV = 0;
    let totalRPE = 0;

    const details = activeEmployees.map(emp => {
      const calc = this.calculatePayroll(emp, config);
      totalSalaries += calc.baseSalary;
      totalDeductions += calc.deductions.total;
      totalCestaTicket += calc.benefits.cestaTicket;
      totalToPay += calc.finalPayment;
      totalSSO += calc.deductions.sso;
      totalFAOV += calc.deductions.faov;
      totalRPE += calc.deductions.rpe;

      return {
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        dni: emp.dni,
        centroCostos: emp.centroCostos || 'General',
        ...calc
      };
    });

    return {
      count: activeEmployees.length,
      totalSalaries,
      totalDeductions,
      totalCestaTicket,
      totalToPay,
      totalSSO,
      totalFAOV,
      totalRPE,
      details
    };
  }
};
