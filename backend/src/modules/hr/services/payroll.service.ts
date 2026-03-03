import { Employee } from './index';

/**
 * PayrollService - Motor de Nómina Venezuela (LOTTT)
 * 
 * Implementa los cálculos de deducciones paralegales venezolanas:
 * - S.S.O. (Seguro Social Obligatorio) - 4% con tope de 5 Salarios Mínimos
 * - F.A.O.V. (Ley de Política Habitacional / BANAVIH) - 1% del salario integral
 * - R.P.E. (Régimen Prestacional de Empleo / Paro Forzoso) - 0.5%
 * - Cestaticket (Bono de Alimentación) - proporcional a días trabajados
 * 
 * Prestaciones Sociales (Art. 142 LOTTT):
 * - Garantía Trimestral: 15 días de salario integral cada trimestre
 * - Retroactividad: 30 días × años al último salario
 * - Intereses sobre prestaciones: tasa BCV mensual
 */
export const PayrollService = {

  // ═══════════════════════════════════════════
  // CONSTANTES DE LEY
  // ═══════════════════════════════════════════

  /** Porcentajes de retención del trabajador */
  DEDUCTIONS: {
    SSO: 0.04,    // 4% Seguro Social Obligatorio
    FAOV: 0.01,   // 1% Fondo de Ahorro Obligatorio para la Vivienda
    RPE: 0.005,   // 0.5% Régimen Prestacional de Empleo (Paro Forzoso)
  },

  /** Porcentajes del patrono (informativo, para reportes) */
  EMPLOYER_CONTRIBUTIONS: {
    SSO: 0.12,    // 12% Seguro Social (patrono)
    FAOV: 0.02,   // 2% FAOV (patrono)
    RPE: 0.02,    // 2% RPE (patrono)
    INCE: 0.02,   // 2% INCE (patrono)
  },

  /** Salario mínimo mensual (configurable, valor por defecto en USD) */
  SALARIO_MINIMO: 130,

  /** Valor del Cestaticket diario (en USD, según Gaceta Oficial vigente) */
  CESTATICKET_DIARIO: 2.5,

  /** Tasa BCV para intereses sobre prestaciones (anual, default) */
  TASA_BCV_ANUAL: 0.1494, // 14.94% anual (referencial)

  /** Días de utilidades anuales mínimas legales */
  DIAS_UTILIDADES: 30,

  /** Días de bono vacacional mínimos legales */
  DIAS_BONO_VACACIONAL: 15,

  /** Días de vacaciones base según LOTTT */
  DIAS_VACACIONES_BASE: 15,

  // ═══════════════════════════════════════════
  // CÁLCULOS DE SALARIO
  // ═══════════════════════════════════════════

  /**
   * Calcula el Salario Integral (Base + Alícuota Utilidades + Alícuota Bono Vacacional)
   * Usado para prestaciones sociales y SSO
   */
  calcularSalarioIntegral(salarioMensual: number, diasUtilidades: number = 30, diasBonoVacacional: number = 15): number {
    const salarioDiario = salarioMensual / 30;
    const alicuotaUtilidades = (salarioDiario * diasUtilidades) / 360;
    const alicuotaBonoVacacional = (salarioDiario * diasBonoVacacional) / 360;
    return parseFloat(((salarioDiario + alicuotaUtilidades + alicuotaBonoVacacional) * 30).toFixed(2));
  },

  // ═══════════════════════════════════════════
  // DEDUCCIONES DE LEY
  // ═══════════════════════════════════════════

  /**
   * Calcula la retención de SSO (4%) con tope de 5 Salarios Mínimos
   * Fórmula: (Sueldo × 12 / 52) × semanas_del_mes × 4%
   */
  calcularSSO(sueldoMensual: number, lunesDelMes: number = 4): number {
    const tope = this.SALARIO_MINIMO * 5;
    const sueldoBaseCalculo = Math.min(sueldoMensual, tope);

    // Fórmula semanal del IVSS
    const ssoSemanal = (sueldoBaseCalculo * 12) / 52;
    const retencion = (ssoSemanal * lunesDelMes) * this.DEDUCTIONS.SSO;

    return parseFloat(retencion.toFixed(2));
  },

  /**
   * Calcula FAOV / BANAVIH (1% del salario integral)
   */
  calcularFAOV(salarioIntegral: number): number {
    return parseFloat((salarioIntegral * this.DEDUCTIONS.FAOV).toFixed(2));
  },

  /**
   * Calcula RPE / Paro Forzoso (0.5% del salario)
   */
  calcularRPE(sueldoMensual: number): number {
    return parseFloat((sueldoMensual * this.DEDUCTIONS.RPE).toFixed(2));
  },

  /**
   * Calcula el Cestaticket (Bono de Alimentación)
   * Proporcional a los días efectivamente trabajados
   */
  calcularCestaticket(diasTrabajados: number = 22): number {
    return parseFloat((this.CESTATICKET_DIARIO * diasTrabajados).toFixed(2));
  },

  // ═══════════════════════════════════════════
  // PRESTACIONES SOCIALES (Art. 142 LOTTT)
  // ═══════════════════════════════════════════

  /**
   * Garantía Trimestral: 15 días de salario integral por trimestre
   * Se acumulan y depositan en un fideicomiso o contabilidad de la empresa
   */
  calcularGarantiaTrimestral(salarioIntegral: number): number {
    const salarioDiarioIntegral = salarioIntegral / 30;
    return parseFloat((salarioDiarioIntegral * 15).toFixed(2));
  },

  /**
   * Cálculo de Retroactividad: 30 días × años al último salario integral
   * Se compara con el acumulado de garantías trimestrales; se paga el MAYOR
   */
  calcularRetroactividad(anosServicio: number, ultimoSalarioIntegral: number): number {
    const salarioDiarioIntegral = ultimoSalarioIntegral / 30;
    return parseFloat((salarioDiarioIntegral * 30 * anosServicio).toFixed(2));
  },

  /**
   * Intereses sobre Prestaciones Sociales
   * Se calculan mensualmente sobre el acumulado al promedio de la tasa BCV
   */
  calcularInteresesPrestaciones(acumuladoPrestaciones: number, tasaAnual: number = 0.1494): number {
    const tasaMensual = tasaAnual / 12;
    return parseFloat((acumuladoPrestaciones * tasaMensual).toFixed(2));
  },

  /**
   * Obtiene los años de servicio de un empleado en formato decimal
   */
  getAnosServicio(fechaIngreso: string): number {
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diffMs = hoy.getTime() - ingreso.getTime();
    return parseFloat((diffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2));
  },

  /**
   * Calcula los trimestres completos de servicio
   */
  getTrimestresServicio(fechaIngreso: string): number {
    const anos = this.getAnosServicio(fechaIngreso);
    return Math.floor(anos * 4);
  },

  /**
   * Días de vacaciones acumulados según LOTTT:
   * Base: 15 días + 1 día adicional por cada año de servicio (máximo +15)
   */
  calcularDiasVacaciones(fechaIngreso: string): { base: number; adicionales: number; total: number; bonoVacacional: number } {
    const anos = Math.floor(this.getAnosServicio(fechaIngreso));
    const adicionales = Math.min(anos, 15);
    const base = this.DIAS_VACACIONES_BASE;
    const bonoVacacional = this.DIAS_BONO_VACACIONAL + Math.min(anos, 15);
    return { base, adicionales, total: base + adicionales, bonoVacacional };
  },

  // ═══════════════════════════════════════════
  // RECIBO DE PAGO COMPLETO (Quincenal)
  // ═══════════════════════════════════════════

  /**
   * Calcula el detalle completo del recibo de pago para un empleado.
   */
  calculatePayroll(employee: Employee, config?: { lunesDelMes?: number; diasTrabajados?: number }) {
    const baseSalary = employee.salary;
    const lunesDelMes = config?.lunesDelMes || 4;
    const diasTrabajados = config?.diasTrabajados || 22;

    // Salario integral para cálculos legales
    const salarioIntegral = this.calcularSalarioIntegral(baseSalary);

    // Deducciones de Ley
    const sso = this.calcularSSO(baseSalary, lunesDelMes);
    const faov = this.calcularFAOV(salarioIntegral);
    const rpe = this.calcularRPE(baseSalary);
    const totalDeductions = sso + faov + rpe;

    // Sueldo neto
    const netSalary = baseSalary - totalDeductions;

    // Beneficios no salariales
    const cestaTicket = this.calcularCestaticket(diasTrabajados);

    // Total a depositar
    const finalPayment = netSalary + cestaTicket;

    // Información de prestaciones
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

  // ═══════════════════════════════════════════
  // PROCESAMIENTO DE NÓMINA POR LOTE
  // ═══════════════════════════════════════════

  /**
   * Calcula el resumen de nómina para un lote de empleados.
   */
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
