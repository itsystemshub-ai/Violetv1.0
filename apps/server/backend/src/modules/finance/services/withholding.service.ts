import { Invoice } from './index';
import { generatePDFReport } from './pdfUtils';
import { useSystemConfig } from "@/hooks/useSystemConfig";

export class WithholdingService {
  /**
   * Calculates IVA withholding based on a purchase invoice.
   * Standard rates are 75% or 100% of the VAT amount.
   */
  static calculateIvaWithholding(invoice: Invoice, rate: number = 0.75): number {
    const totalTax = invoice.total - invoice.subtotal;
    return totalTax * rate;
  }

  /**
   * Generates a "Comprobante de Retención de IVA" PDF.
   * Following the SENIAT Providencia 0049 or equivalent.
   */
  static generateIvaWithholdingCertificate(invoice: Invoice, withholdingAmount: number, tenant: any) {
    generatePDFReport({
      title: "COMPROBANTE DE RETENCIÓN DE IMPUESTO AL VALOR AGREGADO",
      subtitle: `Agente de Retención: ${tenant.name} - RIF: ${tenant.rif}\nN° de Control Factura: ${invoice.controlNumber || 'S/N'}`,
      filename: `comprobante_iva_${invoice.number}.pdf`,
      columns: [
        { header: "Fecha", dataKey: "fecha" },
        { header: "Factura", dataKey: "factura" },
        { header: "Control", dataKey: "control" },
        { header: "Total", dataKey: "total" },
        { header: "Base", dataKey: "base" },
        { header: "IVA", dataKey: "iva" },
        { header: "Retenido", dataKey: "retenido" }
      ],
      data: [{
        fecha: invoice.date.split('T')[0],
        factura: invoice.number,
        control: invoice.controlNumber || 'N/A',
        total: invoice.total.toFixed(2),
        base: invoice.subtotal.toFixed(2),
        iva: (invoice.total - invoice.subtotal).toFixed(2),
        retenido: withholdingAmount.toFixed(2)
      }]
    });
  }

  /**
   * Implementation of ISLR (Income Tax) withholdings.
   * Based on the 130+ concepts from Decree 1808.
   */
  static getIslrConcepts() {
    return [
      { code: '001', name: 'Honorarios Profesionales (PN Residente)', rate: 3, sustraendoFactor: 0 },
      { code: '003', name: 'Comisiones (PN Residente)', rate: 3, sustraendoFactor: 0 },
      { code: '009', name: 'Comisiones Mercantiles (PJ Residente)', rate: 5, sustraendoFactor: 0 },
      { code: '011', name: 'Fletamento de Vehículos y Carga', rate: 3, sustraendoFactor: 0 },
      { code: '012', name: 'Publicidad y Propaganda', rate: 5, sustraendoFactor: 0 },
      { code: '022', name: 'Transporte Terrestre de Mercancías', rate: 1, sustraendoFactor: 0 },
      { code: '034', name: 'Ejecución de Obras y Servicios', rate: 2, sustraendoFactor: 0 },
      { code: '041', name: 'Arrendatario de Bienes Inmuebles', rate: 3, sustraendoFactor: 0 },
      { code: '051', name: 'Pagos Tecnológicos', rate: 2, sustraendoFactor: 0 },
    ];
  }

  /**
   * Calculates ISLR withholding based on base amount and category.
   * Includes sustraendo (UT conversion) logic for corporate/natural suppliers.
   */
  static calculateIslrWithholding(baseAmount: number, conceptId: string): number {
    const concept = this.getIslrConcepts().find(c => c.code === conceptId);
    if (!concept) return 0;
    
    // Unidad Tributaria (UT) - Valor dinámico desde la configuración del sistema
    const UT_VALUE = useSystemConfig.getState().taxes.utValue || 90.00;
    const factorSustraendo = (concept as any).sustraendoFactor || 0;
    const sustraendo = factorSustraendo * UT_VALUE;
    
    // Formula: (Base * Rate) - Sustraendo
    const amount = (baseAmount * (concept.rate / 100)) - sustraendo;
    return Math.max(0, amount);
  }

  /**
   * Generates a "Comprobante de Retención de ISLR" PDF.
   * Following the SENIAT standards for Income Tax certificates.
   */
  static generateIslrWithholdingCertificate(invoice: Invoice, withholdingAmount: number, concept: any, tenant: any) {
    generatePDFReport({
      title: "COMPROBANTE DE RETENCIÓN DE IMPUESTO SOBRE LA RENTA (ISLR)",
      subtitle: `Agente de Retención: ${tenant.name} - RIF: ${tenant.rif}\nConcepto: ${concept.code} - ${concept.name}`,
      filename: `comprobante_islr_${invoice.number}.pdf`,
      columns: [
        { header: "Fecha", dataKey: "fecha" },
        { header: "Factura", dataKey: "factura" },
        { header: "Base Imponible", dataKey: "base" },
        { header: "% Ret", dataKey: "rate" },
        { header: "Total Retenido", dataKey: "retenido" }
      ],
      data: [{
        fecha: invoice.date.split('T')[0],
        factura: invoice.number,
        base: invoice.subtotal.toFixed(2),
        rate: `${concept.rate}%`,
        retenido: withholdingAmount.toFixed(2)
      }]
    });
  }

  /**
   * Generates XML file for SENIAT IVA withholding declaration.
   * Format follows Providencia 0049 / Portal Fiscal SENIAT.
   */
  static generateIvaXML(
    invoices: Invoice[],
    tenant: { rif: string; name: string },
    periodo: string // Format: AAAAMM (e.g., "202602")
  ): string {
    const retenciones = invoices
      .filter(inv => inv.ivaWithholdingPercentage && inv.ivaWithholdingPercentage > 0)
      .map((inv, index) => {
        const tax = inv.total - inv.subtotal;
        const retenido = tax * ((inv.ivaWithholdingPercentage || 0) / 100);
        const nroComprobante = `${periodo}${String(index + 1).padStart(6, '0')}`;
        
        return `    <DetalleRetencion>
      <RifRetenido>${inv.customerRif || 'S/N'}</RifRetenido>
      <NumeroFactura>${inv.number}</NumeroFactura>
      <NumeroControl>${inv.controlNumber || '00-000000'}</NumeroControl>
      <FechaOperacion>${inv.date.split('T')[0]}</FechaOperacion>
      <MontoFacturado>${inv.total.toFixed(2)}</MontoFacturado>
      <BaseImponible>${inv.subtotal.toFixed(2)}</BaseImponible>
      <MontoIva>${tax.toFixed(2)}</MontoIva>
      <MontoRetenido>${retenido.toFixed(2)}</MontoRetenido>
      <NumeroComprobante>${nroComprobante}</NumeroComprobante>
    </DetalleRetencion>`;
      });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<RelacionRetencionesIVA>
  <RifAgenteRetencion>${tenant.rif}</RifAgenteRetencion>
  <Periodo>${periodo}</Periodo>
  ${retenciones.join('\n  ')}
</RelacionRetencionesIVA>`;

    return xml;
  }

  /**
   * Downloads the generated XML as a file.
   */
  static downloadIvaXML(
    invoices: Invoice[],
    tenant: { rif: string; name: string },
    periodo: string
  ): void {
    const xml = this.generateIvaXML(invoices, tenant, periodo);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retenciones_iva_${periodo}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
