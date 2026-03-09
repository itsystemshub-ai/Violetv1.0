import { Invoice } from './index';
import { WithholdingService } from './WithholdingService';

export interface LibroVentasRow {
  fecha: string;
  nroFactura: string;
  cliente: string;
  rif: string;
  baseImponible: number;
  baseExento: number;
  baseAlicuotaGeneral: number;   // 16%
  baseAlicuotaReducida: number;  // 8%
  baseAlicuotaAdicional: number; // 15% (lujo)
  alicuotaIVA: number;
  montoIVA: number;
  total: number;
  ivaRetenido: number;
  islrRetenido: number;
}

export class LibroGeneratorService {
  /**
   * Generates the "Libro de Ventas/Compras" row data from a list of invoices.
   */
  static generateLibroVentas(invoices: Invoice[]): LibroVentasRow[] {
    return invoices.map(inv => {
      const base = inv.subtotal || 0;
      const total = inv.total || 0;
      const montoIVA = total - base;
      const alicuotaIVA = base > 0 ? (montoIVA / base) * 100 : 16;

      // Determinar tipo de alícuota
      let baseExento = 0;
      let baseAlicuotaGeneral = 0;
      let baseAlicuotaReducida = 0;
      let baseAlicuotaAdicional = 0;

      if (Math.abs(alicuotaIVA) < 0.01) {
        baseExento = base;
      } else if (Math.abs(alicuotaIVA - 8) < 1) {
        baseAlicuotaReducida = base;
      } else if (Math.abs(alicuotaIVA - 15) < 1) {
        baseAlicuotaAdicional = base;
      } else {
        baseAlicuotaGeneral = base; // 16% default
      }

      const ivaRetenido = inv.ivaWithholdingPercentage
        ? montoIVA * (inv.ivaWithholdingPercentage / 100)
        : 0;

      const islrRetenido =
        inv.islrConceptCode && inv.islrConceptCode !== 'none'
          ? WithholdingService.calculateIslrWithholding(base, inv.islrConceptCode)
          : 0;

      return {
        fecha: inv.date ? inv.date.split('T')[0] : '',
        nroFactura: inv.number || '',
        cliente: inv.customerName || '',
        rif: inv.customerRif || '',
        baseImponible: base,
        baseExento,
        baseAlicuotaGeneral,
        baseAlicuotaReducida,
        baseAlicuotaAdicional,
        alicuotaIVA,
        montoIVA,
        total,
        ivaRetenido,
        islrRetenido,
      };
    });
  }

  /**
   * Exports a LibroVentasRow array to a CSV file and triggers download.
   */
  static exportToCSV(rows: LibroVentasRow[], filename: string): void {
    const headers = [
      'Fecha',
      'N° Factura',
      'Cliente/Proveedor',
      'RIF',
      'Base Exento',
      'Base Alícuota General (16%)',
      'Base Alícuota Reducida (8%)',
      'Base Alícuota Adicional (15%)',
      'Base Imponible Total',
      'Alícuota IVA (%)',
      'Monto IVA',
      'Total',
      'IVA Retenido',
      'ISLR Retenido',
    ];

    const escape = (val: string | number) => {
      const s = String(val);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csvRows = [
      headers.join(','),
      ...rows.map(r =>
        [
          escape(r.fecha),
          escape(r.nroFactura),
          escape(r.cliente),
          escape(r.rif),
          escape(r.baseExento.toFixed(2)),
          escape(r.baseAlicuotaGeneral.toFixed(2)),
          escape(r.baseAlicuotaReducida.toFixed(2)),
          escape(r.baseAlicuotaAdicional.toFixed(2)),
          escape(r.baseImponible.toFixed(2)),
          escape(r.alicuotaIVA.toFixed(2)),
          escape(r.montoIVA.toFixed(2)),
          escape(r.total.toFixed(2)),
          escape(r.ivaRetenido.toFixed(2)),
          escape(r.islrRetenido.toFixed(2)),
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Generates the "ARC" (Comprobante de Retención Acumulado)
   * A summary of all withholdings for a supplier in a year.
   */
  static generateARC(invoices: Invoice[], supplierName: string, year: number) {
    const filtered = invoices.filter(
      inv =>
        inv.customerName === supplierName &&
        new Date(inv.date).getFullYear() === year &&
        inv.type === 'compra'
    );

    const totalIvaWithheld = filtered.reduce((acc, inv) => {
      const tax = inv.total - inv.subtotal;
      return acc + (tax * (inv.ivaWithholdingPercentage || 0)) / 100;
    }, 0);

    const totalIslrWithheld = filtered.reduce((acc, inv) => {
      if (!inv.islrConceptCode || inv.islrConceptCode === 'none') return acc;
      return acc + WithholdingService.calculateIslrWithholding(inv.subtotal, inv.islrConceptCode);
    }, 0);

    return {
      supplier: supplierName,
      year,
      totalIvaWithheld,
      totalIslrWithheld,
      records: filtered.length,
      details: filtered.map(inv => ({
        date: inv.date.split('T')[0],
        invoice: inv.number,
        base: inv.subtotal,
        ivaWithheld:
          ((inv.total - inv.subtotal) * (inv.ivaWithholdingPercentage || 0)) / 100,
        islrWithheld: inv.islrConceptCode
          ? WithholdingService.calculateIslrWithholding(inv.subtotal, inv.islrConceptCode)
          : 0,
      })),
    };
  }
}
