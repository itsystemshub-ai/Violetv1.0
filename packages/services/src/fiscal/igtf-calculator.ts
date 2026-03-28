/**
 * Calculadora de IGTF (Impuesto a las Grandes Transacciones Financieras)
 * Venezuela: 3% sobre pagos en divisas
 */

export interface IGTFConfig {
  totalOperacion: number;
  tasa?: number;
  esPagoEnDivisas?: boolean;
}

export interface IGTFResult {
  baseImponible: number;
  tasa: number;
  montoIGTF: number;
  total: number;
  esPagoEnDivisas: boolean;
}

/**
 * Calcula el IGTF de una operación
 * Solo aplica para pagos en divisas
 */
export function calcularIGTF(config: IGTFConfig): IGTFResult {
  const { totalOperacion, tasa = 3, esPagoEnDivisas = true } = config;

  if (!esPagoEnDivisas) {
    return {
      baseImponible: totalOperacion,
      tasa: 0,
      montoIGTF: 0,
      total: totalOperacion,
      esPagoEnDivisas: false,
    };
  }

  const montoIGTF = totalOperacion * (tasa / 100);

  return {
    baseImponible: totalOperacion,
    tasa,
    montoIGTF,
    total: totalOperacion + montoIGTF,
    esPagoEnDivisas: true,
  };
}

/**
 * Calcula el IGTF junto con IVA
 */
export interface OperacionCompletaResult {
  subtotal: number;
  iva: {
    baseImponible: number;
    alicuota: number;
    monto: number;
  };
  igtf: {
    baseImponible: number;
    tasa: number;
    monto: number;
  };
  total: number;
  desglose: {
    concepto: string;
    monto: number;
  }[];
}

export function calcularOperacionCompleta(
  subtotal: number,
  alicuotaIVA: number = 16,
  esPagoEnDivisas: boolean = false,
  tasaIGTF: number = 3
): OperacionCompletaResult {
  // Calcular IVA
  const montoIVA = subtotal * (alicuotaIVA / 100);
  const totalConIVA = subtotal + montoIVA;

  // Calcular IGTF (solo si es en divisas)
  const montoIGTF = esPagoEnDivisas ? totalConIVA * (tasaIGTF / 100) : 0;
  const totalFinal = totalConIVA + montoIGTF;

  return {
    subtotal,
    iva: {
      baseImponible: subtotal,
      alicuota: alicuotaIVA,
      monto: montoIVA,
    },
    igtf: {
      baseImponible: totalConIVA,
      tasa: esPagoEnDivisas ? tasaIGTF : 0,
      monto: montoIGTF,
    },
    total: totalFinal,
    desglose: [
      { concepto: 'Subtotal', monto: subtotal },
      { concepto: `IVA (${alicuotaIVA}%)`, monto: montoIVA },
      ...(esPagoEnDivisas ? [{ concepto: `IGTF (${tasaIGTF}%)`, monto: montoIGTF }] : []),
    ],
  };
}
