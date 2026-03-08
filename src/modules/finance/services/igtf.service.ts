/**
 * IGTFService - Impuesto a las Grandes Transacciones Financieras
 */

export const IGTFService = {
  TASA_IGTF: 0.03, // 3%

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

  procesarPago(montoBase: number, metodoPagoId: string) {
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

  getMetodosPago() {
    return this.METODOS_PAGO_DIVISA;
  },

  isMetodoDivisa(metodoPagoId: string): boolean {
    const metodo = this.METODOS_PAGO_DIVISA.find(m => m.id === metodoPagoId);
    return metodo?.generaIGTF || false;
  },

  generarResumenIGTF(records: any[]) {
    return {
      totalMontoBase: records.reduce((acc, r) => acc + (r.monto_base || 0), 0),
      totalMontoIGTF: records.reduce((acc, r) => acc + (r.monto_igtf || 0), 0),
      count: records.length,
    };
  }
};
