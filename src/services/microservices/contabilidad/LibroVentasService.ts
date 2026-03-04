/**
 * MS Contabilidad - Libro de Ventas SENIAT
 * Gestiona el registro cronológico de facturas para cumplimiento fiscal en Venezuela
 */
import { localDb } from "@/core/database/localDb";
import { toast } from "sonner";

export interface LibroVentasEntry {
  id: string;
  tenant_id: string;
  fecha_factura: string;
  numero_factura: string;
  numero_control: string;
  tipo_transaccion: 'venta' | 'nota_credito' | 'nota_debito';
  rif_cliente: string;
  nombre_cliente: string;
  base_imponible: number;
  iva_porcentaje: number;
  iva_monto: number;
  igtf_monto: number;
  total_factura: number;
  numero_comprobante?: string;
  tipo_venta: 'contado' | 'credito';
  exento: boolean;
  exportacion: boolean;
  created_at: string;
  periodo_fiscal: string; // YYYY-MM
}

export interface LibroVentasResumen {
  periodo: string;
  total_ventas: number;
  total_base_imponible: number;
  total_iva: number;
  total_igtf: number;
  total_exento: number;
  total_exportacion: number;
  cantidad_facturas: number;
}

export class LibroVentasService {
  private static instance: LibroVentasService;

  private constructor() {}

  public static getInstance(): LibroVentasService {
    if (!LibroVentasService.instance) {
      LibroVentasService.instance = new LibroVentasService();
    }
    return LibroVentasService.instance;
  }

  /**
   * Registra una factura en el Libro de Ventas
   */
  public async registrarFactura(
    invoiceId: string,
    numeroFactura: string,
    numeroControl: string,
    fechaFactura: string,
    rifCliente: string,
    nombreCliente: string,
    baseImponible: number,
    ivaPorcentaje: number,
    ivaMonto: number,
    igtfMonto: number,
    totalFactura: number,
    tipoVenta: 'contado' | 'credito',
    tenantId: string,
    exento: boolean = false,
    exportacion: boolean = false
  ): Promise<void> {
    try {
      const fecha = new Date(fechaFactura);
      const periodoFiscal = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      const entry: LibroVentasEntry = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        fecha_factura: fechaFactura,
        numero_factura: numeroFactura,
        numero_control: numeroControl,
        tipo_transaccion: 'venta',
        rif_cliente: rifCliente,
        nombre_cliente: nombreCliente,
        base_imponible: baseImponible,
        iva_porcentaje: ivaPorcentaje,
        iva_monto: ivaMonto,
        igtf_monto: igtfMonto,
        total_factura: totalFactura,
        tipo_venta: tipoVenta,
        exento,
        exportacion,
        created_at: new Date().toISOString(),
        periodo_fiscal: periodoFiscal,
      };

      await localDb.libro_ventas.add(entry);
    } catch (error) {
      console.error('[LibroVentas] Error al registrar factura:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las entradas del Libro de Ventas de un tenant
   */
  public async getLibroVentas(tenantId: string, periodoFiscal?: string): Promise<LibroVentasEntry[]> {
    let query = localDb.libro_ventas.where('tenant_id').equals(tenantId);
    
    const entries = await query.toArray();
    
    if (periodoFiscal) {
      return entries.filter(e => e.periodo_fiscal === periodoFiscal);
    }
    
    return entries.sort((a, b) => new Date(a.fecha_factura).getTime() - new Date(b.fecha_factura).getTime());
  }

  /**
   * Obtiene el resumen del Libro de Ventas por período
   */
  public async getResumenPorPeriodo(tenantId: string, periodoFiscal: string): Promise<LibroVentasResumen> {
    const entries = await this.getLibroVentas(tenantId, periodoFiscal);
    
    return {
      periodo: periodoFiscal,
      total_ventas: entries.reduce((sum, e) => sum + e.total_factura, 0),
      total_base_imponible: entries.reduce((sum, e) => sum + e.base_imponible, 0),
      total_iva: entries.reduce((sum, e) => sum + e.iva_monto, 0),
      total_igtf: entries.reduce((sum, e) => sum + e.igtf_monto, 0),
      total_exento: entries.filter(e => e.exento).reduce((sum, e) => sum + e.total_factura, 0),
      total_exportacion: entries.filter(e => e.exportacion).reduce((sum, e) => sum + e.total_factura, 0),
      cantidad_facturas: entries.length,
    };
  }

  /**
   * Exporta el Libro de Ventas en formato SENIAT (TXT)
   */
  public async exportarFormatoSENIAT(tenantId: string, periodoFiscal: string): Promise<string> {
    const entries = await this.getLibroVentas(tenantId, periodoFiscal);
    
    // Formato SENIAT: campos separados por tabulador
    let contenido = 'FECHA\tNRO_FACTURA\tNRO_CONTROL\tRIF_CLIENTE\tNOMBRE_CLIENTE\tBASE_IMPONIBLE\tIVA\tIGTF\tTOTAL\tTIPO_VENTA\n';
    
    entries.forEach(entry => {
      const linea = [
        entry.fecha_factura.split('T')[0],
        entry.numero_factura,
        entry.numero_control,
        entry.rif_cliente,
        entry.nombre_cliente,
        entry.base_imponible.toFixed(2),
        entry.iva_monto.toFixed(2),
        entry.igtf_monto.toFixed(2),
        entry.total_factura.toFixed(2),
        entry.tipo_venta.toUpperCase(),
      ].join('\t');
      
      contenido += linea + '\n';
    });
    
    return contenido;
  }

  /**
   * Exporta el Libro de Ventas en formato Excel
   */
  public async exportarExcel(tenantId: string, periodoFiscal: string): Promise<any[]> {
    const entries = await this.getLibroVentas(tenantId, periodoFiscal);
    
    return entries.map(entry => ({
      'Fecha': entry.fecha_factura.split('T')[0],
      'Nro. Factura': entry.numero_factura,
      'Nro. Control': entry.numero_control,
      'RIF Cliente': entry.rif_cliente,
      'Nombre Cliente': entry.nombre_cliente,
      'Base Imponible': entry.base_imponible,
      'IVA %': entry.iva_porcentaje,
      'IVA Monto': entry.iva_monto,
      'IGTF': entry.igtf_monto,
      'Total': entry.total_factura,
      'Tipo Venta': entry.tipo_venta,
      'Exento': entry.exento ? 'SÍ' : 'NO',
      'Exportación': entry.exportacion ? 'SÍ' : 'NO',
    }));
  }

  /**
   * Obtiene estadísticas del Libro de Ventas
   */
  public async getEstadisticas(tenantId: string, año: number): Promise<{
    por_mes: { mes: string; total: number; iva: number }[];
    total_anual: number;
    iva_anual: number;
    igtf_anual: number;
  }> {
    const entries = await localDb.libro_ventas
      .where('tenant_id')
      .equals(tenantId)
      .toArray();
    
    const entriesDelAño = entries.filter(e => {
      const fecha = new Date(e.fecha_factura);
      return fecha.getFullYear() === año;
    });
    
    // Agrupar por mes
    const porMes = Array.from({ length: 12 }, (_, i) => {
      const mes = String(i + 1).padStart(2, '0');
      const entriesMes = entriesDelAño.filter(e => e.periodo_fiscal === `${año}-${mes}`);
      
      return {
        mes: `${año}-${mes}`,
        total: entriesMes.reduce((sum, e) => sum + e.total_factura, 0),
        iva: entriesMes.reduce((sum, e) => sum + e.iva_monto, 0),
      };
    });
    
    return {
      por_mes: porMes,
      total_anual: entriesDelAño.reduce((sum, e) => sum + e.total_factura, 0),
      iva_anual: entriesDelAño.reduce((sum, e) => sum + e.iva_monto, 0),
      igtf_anual: entriesDelAño.reduce((sum, e) => sum + e.igtf_monto, 0),
    };
  }

  /**
   * Verifica si una factura ya está registrada en el Libro de Ventas
   */
  public async facturaYaRegistrada(numeroFactura: string, tenantId: string): Promise<boolean> {
    const existing = await localDb.libro_ventas
      .where('tenant_id')
      .equals(tenantId)
      .and(e => e.numero_factura === numeroFactura)
      .first();
    
    return !!existing;
  }

  /**
   * Registra una nota de crédito en el Libro de Ventas
   */
  public async registrarNotaCredito(
    numeroNota: string,
    numeroFacturaOriginal: string,
    fechaNota: string,
    rifCliente: string,
    nombreCliente: string,
    monto: number,
    ivaMonto: number,
    tenantId: string
  ): Promise<void> {
    try {
      const fecha = new Date(fechaNota);
      const periodoFiscal = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      const entry: LibroVentasEntry = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        fecha_factura: fechaNota,
        numero_factura: numeroNota,
        numero_control: numeroFacturaOriginal,
        tipo_transaccion: 'nota_credito',
        rif_cliente: rifCliente,
        nombre_cliente: nombreCliente,
        base_imponible: -monto, // Negativo para nota de crédito
        iva_porcentaje: 16,
        iva_monto: -ivaMonto,
        igtf_monto: 0,
        total_factura: -(monto + ivaMonto),
        tipo_venta: 'contado',
        exento: false,
        exportacion: false,
        created_at: new Date().toISOString(),
        periodo_fiscal: periodoFiscal,
      };

      await localDb.libro_ventas.add(entry);
      toast.success('Nota de crédito registrada en Libro de Ventas');
    } catch (error) {
      console.error('[LibroVentas] Error al registrar nota de crédito:', error);
      throw error;
    }
  }
}

export const libroVentasService = LibroVentasService.getInstance();
