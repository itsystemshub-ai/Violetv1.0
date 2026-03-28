import { Invoice } from '@/lib';
import { WithholdingService } from './withholding.service';

export interface LibroVentasRow {
  fecha: string;
  nroFactura: string;
  cliente: string;
  rif: string;
  baseImponible: number;
  baseExento: number;
  baseAlicuotaGeneral: number;
  baseAlicuotaReducida: number;
  baseAlicuotaAdicional: number;
  alicuotaIVA: number;
  montoIVA: number;
  total: number;
  ivaRetenido: number;
  islrRetenido: number;
}

export class LibroGeneratorService {
  static generateLibroVentas(invoices: Invoice[]): LibroVentasRow[] {
    return invoices.map(inv => {
      const base = inv.subtotal || 0;
      const total = inv.total || 0;
      const montoIVA = total - base;
      const alicuotaIVA = base > 0 ? (montoIVA / base) * 100 : 16;

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
        baseAlicuotaGeneral = base;
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

  static generateARC(invoices: Invoice[], supplierRif: string, year: number) {
    const details = invoices
      .filter(inv => inv.customerRif === supplierRif && inv.date && inv.date.startsWith(year.toString()))
      .map(inv => ({
        date: inv.date.split('T')[0],
        invoice: inv.number,
        base: inv.subtotal,
        ivaWithheld: (inv.total - inv.subtotal) * ((inv.ivaWithholdingPercentage || 0) / 100),
        islrWithheld: 0, 
      }));

    return {
      supplier: supplierRif,
      year,
      details,
    };
  }
}
