/**
 * Calculadora de IVA (Impuesto al Valor Agregado)
 * Venezuela: Alícuota general 16%, reducida 8%, lujo 31%
 */

export interface IVAConfig {
  baseImponible: number;
  alicuota?: number;
  esExento?: boolean;
}

export interface IVAResult {
  baseImponible: number;
  alicuota: number;
  montoIVA: number;
  total: number;
  esExento: boolean;
}

/**
 * Calcula el IVA de una operación
 */
export function calcularIVA(config: IVAConfig): IVAResult {
  const { baseImponible, alicuota = 16, esExento = false } = config;

  if (esExento) {
    return {
      baseImponible,
      alicuota: 0,
      montoIVA: 0,
      total: baseImponible,
      esExento: true,
    };
  }

  const montoIVA = baseImponible * (alicuota / 100);
  
  return {
    baseImponible,
    alicuota,
    montoIVA,
    total: baseImponible + montoIVA,
    esExento: false,
  };
}

/**
 * Calcula el IVA desglosado por alícuotas
 */
export interface DesgloseIVA {
  alicuota: number;
  baseImponible: number;
  montoIVA: number;
  total: number;
}

export function calcularDesgloseIVA(operaciones: IVAConfig[]): {
  desglose: DesgloseIVA[];
  totalBaseImponible: number;
  totalIVA: number;
  totalOperacion: number;
} {
  const desglose: DesgloseIVA[] = [];
  let totalBaseImponible = 0;
  let totalIVA = 0;
  let totalOperacion = 0;

  for (const op of operaciones) {
    const result = calcularIVA(op);
    desglose.push({
      alicuota: result.alicuota,
      baseImponible: result.baseImponible,
      montoIVA: result.montoIVA,
      total: result.total,
    });
    totalBaseImponible += result.baseImponible;
    totalIVA += result.montoIVA;
    totalOperacion += result.total;
  }

  return {
    desglose,
    totalBaseImponible,
    totalIVA,
    totalOperacion,
  };
}

/**
 * Extrae el IVA de un monto total
 */
export function extraerIVA(montoTotal: number, alicuota: number = 16): IVAResult {
  const baseImponible = montoTotal / (1 + alicuota / 100);
  const montoIVA = montoTotal - baseImponible;

  return {
    baseImponible,
    alicuota,
    montoIVA,
    total: montoTotal,
    esExento: false,
  };
}
