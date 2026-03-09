import { localDb } from "@/core/database/localDb";
import { SyncService } from "@/core/sync/SyncService";
import { AccountingService } from '@/modules/finance/services/accounting.service';

/**
 * PurchasesService (Modular)
 */

export interface PurchaseItem {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario_usd: number;
  porcentaje_iva: number;
}

export interface PurchaseData {
  proveedor_id: string;
  num_factura: string;
  num_control: string;
  fecha_emision: string;
  tasa_bcv: number;
  items: Omit<PurchaseItem, 'id'>[];
  igtf_paid_usd?: number;
}

export const PurchasesService = {
  /**
   * Procesa una compra completa, actualizando inventario, contabilidad y retenciones.
   */
  async procesarCompra(data: PurchaseData, tenantId: string) {
    const compraId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Cálculos de Totales (Dual Currency)
    let subtotalUSD = 0;
    let ivaUSD = 0;
    
    const itemsProcesados = data.items.map(item => {
      const lineSubtotal = item.cantidad * item.precio_unitario_usd;
      const lineIva = lineSubtotal * (item.porcentaje_iva / 100);
      subtotalUSD += lineSubtotal;
      ivaUSD += lineIva;
      
      return {
        id: crypto.randomUUID(),
        compra_id: compraId,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario_usd: item.precio_unitario_usd,
        porcentaje_iva: item.porcentaje_iva,
        tenant_id: tenantId
      };
    });

    const totalUSD = subtotalUSD + ivaUSD;
    const totalBS = totalUSD * data.tasa_bcv;

    // 2. Guardar Maestro de Compra
    const compraMaestro = {
      id: compraId,
      proveedor_id: data.proveedor_id,
      num_factura: data.num_factura,
      num_control: data.num_control,
      fecha_emision: data.fecha_emision,
      tasa_bcv_aplicada: data.tasa_bcv,
      subtotal_usd: subtotalUSD,
      impuesto_iva_usd: ivaUSD,
      total_usd: totalUSD,
      monto_igtf_usd_paid: data.igtf_paid_usd || 0,
      estatus: 'PROCESADA',
      tenant_id: tenantId,
      created_at: now,
      updated_at: now,
      is_dirty: 1,
      version: 1
    };

    await localDb.compras_maestro.add(compraMaestro);
    await localDb.compras_detalle.bulkAdd(itemsProcesados);

    // 3. Actualizar Inventario (Stock y CPP en USD)
    for (const item of itemsProcesados) {
      await this.actualizarCostoInventario(item.producto_id, item.cantidad, item.precio_unitario_usd);
    }

    // 4. Registro Contable (AccountingService maneja la lógica dual)
    await AccountingService.postPurchase({
      id: compraId,
      number: data.num_factura,
      customerName: (await localDb.suppliers.get(data.proveedor_id))?.name || 'Proveedor Desconocido',
      subtotal: subtotalUSD,
      taxTotal: ivaUSD,
      total: totalUSD,
      date: data.fecha_emision,
      tenant_id: tenantId,
      tasa_bcv: data.tasa_bcv
    }, 0, 0);

    return {
      success: true,
      compraId,
      total_usd: totalUSD,
      total_bs: totalBS
    };
  },

  /**
   * Calcula y actualiza el Costo Promedio Ponderado (CPP) siempre en USD.
   */
  async actualizarCostoInventario(productoId: string, nuevaCantidad: number, nuevoPrecioUSD: number) {
    const producto = await localDb.products.get(productoId);
    if (!producto) return;

    const stockActual = producto.stock || 0;
    const costoActualUSD = producto.price || 0;

    const stockTotal = stockActual + nuevaCantidad;
    if (stockTotal <= 0) return;

    const nuevoCPP = ((stockActual * costoActualUSD) + (nuevaCantidad * nuevoPrecioUSD)) / stockTotal;

    await SyncService.mutate('products', 'UPDATE', {
      stock: stockTotal,
      price: nuevoCPP,
      updated_at: new Date().toISOString()
    }, productoId);
  },

  validarRIF(rif: string): boolean {
    const regex = /^[VJPGvjpg]-[0-9]{8}-[0-9]$/;
    return regex.test(rif);
  }
};
