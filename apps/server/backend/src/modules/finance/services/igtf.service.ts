/**
 * IGTFService - Impuesto a las Grandes Transacciones Financieras
 * 
 * Calcula y gestiona el IGTF (3%) aplicable a pagos realizados en divisas
 * o criptoactivos fuera del sistema bancario nacional venezolano.
 * 
 * Base Legal: Ley de IGTF (Gaceta Oficial)
 */
export const IGTFService = {

  /** Tasa vigente del IGTF (configurable) */
  TASA_IGTF: 0.03, // 3%

  /** Métodos de pago que generan IGTF automáticamente */
  METODOS_PAGO_DIVISA: [
    { id: 'efectivo_usd', nombre: 'Efectivo USD', generaIGTF: true },
    { id: 'zelle', nombre: 'Zelle', generaIGTF: true },
    { id: 'crypto', nombre: 'Criptomonedas', generaIGTF: true },
    { id: 'paypal', nombre: 'PayPal', generaIGTF: true },
    { id: 'transferencia_ext', nombre: 'Transferencia Internacional', generaIGTF: true },
    { id: 'pago_movil', nombre: 'Pago Móvil (Bs)', generaIGTF: false },
    { id: 'transferencia_bs', nombre: 'Transferencia Bancaria (Bs)', generaIGTF: false },
    { id: 'punto_venta', nombre: 'Punto de Venta (Bs)', generaIGTF: false },
    { id: 'efectivo_bs', nombre: 'Efectivo Bs', generaIGTF: false },
  ],

  /**
   * Calcula el monto total incluyendo IGTF si el pago es en divisas.
   */
  procesarPago(montoBase: number, metodoPagoId: string): {
    subtotal: number;
    igtf: number;
    total: number;
    metodoPago: string;
    generaIGTF: boolean;
  } {
    const metodo = this.METODOS_PAGO_DIVISA.find(m => m.id === metodoPagoId);
    const generaIGTF = metodo?.generaIGTF || false;
    const igtf = generaIGTF ? parseFloat((montoBase * this.TASA_IGTF).toFixed(2)) : 0;

    return {
      subtotal: montoBase,
      igtf,
      total: parseFloat((montoBase + igtf).toFixed(2)),
      metodoPago: metodo?.nombre || 'Desconocido',
      generaIGTF,
    };
  },

  /**
   * Obtiene la lista de métodos de pago configurados.
   */
  getMetodosPago() {
    return this.METODOS_PAGO_DIVISA;
  },

  /**
   * Verifica si un método de pago genera IGTF.
   */
  isMetodoDivisa(metodoPagoId: string): boolean {
    const metodo = this.METODOS_PAGO_DIVISA.find(m => m.id === metodoPagoId);
    return metodo?.generaIGTF || false;
  },

  /**
   * Calcula el diferencial cambiario entre la emisión y el cobro de una factura.
   * 
   * Si la tasa sube entre emisión y cobro → Ganancia cambiaria
   * Si la tasa baja entre emisión y cobro → Pérdida cambiaria
   */
  calcularDiferencialCambiario(
    montoUSD: number,
    tasaEmision: number,
    tasaCobro: number
  ): {
    montoBsEmision: number;
    montoBsCobro: number;
    diferencial: number;
    tipo: 'ganancia' | 'perdida' | 'neutro';
  } {
    const montoBsEmision = parseFloat((montoUSD * tasaEmision).toFixed(2));
    const montoBsCobro = parseFloat((montoUSD * tasaCobro).toFixed(2));
    const diferencial = parseFloat((montoBsCobro - montoBsEmision).toFixed(2));

    let tipo: 'ganancia' | 'perdida' | 'neutro' = 'neutro';
    if (diferencial > 0.01) tipo = 'ganancia';
    else if (diferencial < -0.01) tipo = 'perdida';

    return { montoBsEmision, montoBsCobro, diferencial, tipo };
  },

  /**
   * Convierte un monto USD a Bolívares usando la tasa BCV.
   */
  convertirABs(montoUSD: number, tasaBCV: number): number {
    return parseFloat((montoUSD * tasaBCV).toFixed(2));
  },

  /**
   * Genera un resumen mensual de IGTF para reportes.
   */
  generarResumenIGTF(registros: Array<{
    monto_base: number;
    monto_igtf: number;
    metodo_pago: string;
    created_at: string;
  }>) {
    const totalBase = registros.reduce((acc, r) => acc + r.monto_base, 0);
    const totalIGTF = registros.reduce((acc, r) => acc + r.monto_igtf, 0);

    // Agrupar por método de pago
    const porMetodo: Record<string, { base: number; igtf: number; count: number }> = {};
    registros.forEach(r => {
      if (!porMetodo[r.metodo_pago]) {
        porMetodo[r.metodo_pago] = { base: 0, igtf: 0, count: 0 };
      }
      porMetodo[r.metodo_pago].base += r.monto_base;
      porMetodo[r.metodo_pago].igtf += r.monto_igtf;
      porMetodo[r.metodo_pago].count += 1;
    });

    return {
      totalBase: parseFloat(totalBase.toFixed(2)),
      totalIGTF: parseFloat(totalIGTF.toFixed(2)),
      totalConIGTF: parseFloat((totalBase + totalIGTF).toFixed(2)),
      transacciones: registros.length,
      desglosePorMetodo: porMetodo,
    };
  },
};
