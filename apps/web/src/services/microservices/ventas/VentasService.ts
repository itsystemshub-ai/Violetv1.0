/**
 * MS Ventas/CRM
 * Encompasses POS, Invoicing, Clients, and interaction with Inventory.
 */
import { SyncService } from "@/core/sync/SyncService";
import { Invoice } from "@/lib";
import { localDb } from "@/core/database/localDb";
import { toast } from "sonner";
import { cuentasPorCobrarService } from "@/services/microservices/tesoreria/CuentasPorCobrarService";


export class VentasService {
  private static instance: VentasService;

  private constructor() {}

  public static getInstance(): VentasService {
    if (!VentasService.instance) {
      VentasService.instance = new VentasService();
    }
    return VentasService.instance;
  }

  public async getSales(tenantId: string): Promise<Invoice[]> {
    return SyncService.getQuery('invoices')
      .where('tenant_id').equals(tenantId)
      .toArray();
  }

  public async getClients(tenantId: string): Promise<any[]> {
    return SyncService.getQuery('profiles') // Clientes are in profiles table
      .where('tenant_id').equals(tenantId)
      .toArray();
  }

  /**
   * Procesa una venta con descuento automático de stock
   * @param payload Datos de la factura
   * @param tenantId ID del tenant
   * @returns Promise<void>
   * @throws Error si no hay stock suficiente
   */
  public async processSale(payload: Partial<Invoice>, tenantId: string): Promise<void> {
    const saleId = crypto.randomUUID();
    
    // 1. VALIDAR STOCK DISPONIBLE antes de procesar
    if (payload.items && payload.items.length > 0) {
      const stockValidation = await this.validateStock(payload.items, tenantId);
      
      if (!stockValidation.valid) {
        throw new Error(`Stock insuficiente: ${stockValidation.errors.join(', ')}`);
      }
    }

    // 2. DESCONTAR STOCK (operación atómica)
    try {
      if (payload.items && payload.items.length > 0) {
        await this.decreaseStock(payload.items, tenantId, saleId);
      }
    } catch (error) {
      console.error('[VentasService] Error al descontar stock:', error);
      throw new Error('Error al descontar stock del inventario');
    }

    // 3. CREAR FACTURA
    await SyncService.mutate('invoices', 'INSERT', {
      ...payload,
      id: saleId,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
    }, saleId);

    // 4. VERIFICAR PUNTOS DE REORDEN
    await this.checkReorderPoints(payload.items || [], tenantId);
  }

  /**
   * Valida que haya stock suficiente para todos los productos
   */
  private async validateStock(
    items: any[],
    tenantId: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const item of items) {
      const product = await localDb.products.get(item.product_id);
      
      if (!product) {
        errors.push(`Producto ${item.name} no encontrado`);
        continue;
      }

      if (product.stock < item.quantity) {
        errors.push(
          `${item.name}: Stock insuficiente (Disponible: ${product.stock}, Solicitado: ${item.quantity})`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Descuenta el stock de los productos vendidos
   */
  private async decreaseStock(
    items: any[],
    tenantId: string,
    saleId: string
  ): Promise<void> {
    const currentYear = new Date().getFullYear();

    for (const item of items) {
      const product = await localDb.products.get(item.product_id);
      
      if (!product) {
        throw new Error(`Producto ${item.name} no encontrado`);
      }

      // Descontar stock
      const newStock = product.stock - item.quantity;
      
      // Actualizar historial de ventas por año
      const ventasHistory = product.ventasHistory || { 2023: 0, 2024: 0, 2025: 0 };
      if (!ventasHistory[currentYear]) {
        ventasHistory[currentYear] = 0;
      }
      ventasHistory[currentYear] += item.quantity;
      
      await localDb.products.update(item.product_id, {
        stock: newStock,
        ventasHistory: ventasHistory,
        updated_at: new Date().toISOString(),
        is_dirty: 1 // Marcar para sincronización
      });

      // Registrar movimiento de inventario
      await this.recordInventoryMovement({
        product_id: item.product_id,
        product_name: item.name,
        quantity: -item.quantity, // Negativo para salida
        type: 'sale',
        reference_id: saleId,
        reference_type: 'invoice',
        previous_stock: product.stock,
        new_stock: newStock,
        tenant_id: tenantId,
        created_at: new Date().toISOString()
      });
    }
  }

  /**
   * Registra un movimiento de inventario
   */
  private async recordInventoryMovement(movement: any): Promise<void> {
    try {
      await localDb.inventory_movements.add({
        id: crypto.randomUUID(),
        ...movement
      });
    } catch (error) {
      console.error('[VentasService] Error al registrar movimiento:', error);
      // No bloqueamos la venta si falla el registro del movimiento
    }
  }

  /**
   * Verifica si algún producto llegó al punto de reorden
   */
  private async checkReorderPoints(items: any[], tenantId: string): Promise<void> {
    for (const item of items) {
      const product = await localDb.products.get(item.product_id);
      
      if (!product) continue;

      // Verificar si llegó al punto de reorden
      if (product.stock <= product.minStock) {
        // Crear notificación de reorden
        await localDb.notifications.add({
          id: crypto.randomUUID(),
          type: 'low_stock',
          title: 'Stock Bajo - Punto de Reorden',
          message: `${product.name} (${product.cauplas || product.id}): Stock actual ${product.stock}, mínimo ${product.minStock}`,
          timestamp: new Date().toISOString(),
          tenantId: tenantId,
          read: false,
          data: {
            productId: product.id,
            productName: product.name,
            currentStock: product.stock,
            minStock: product.minStock,
            reorderQuantity: product.minStock * 2 // Sugerencia de reorden
          }
        });

        // Mostrar toast si el stock es crítico (menos del 50% del mínimo)
        if (product.stock < product.minStock * 0.5) {
          toast.error(
            `⚠️ STOCK CRÍTICO: ${product.name} - Solo quedan ${product.stock} unidades`,
            { duration: 10000 }
          );
        } else {
          toast.warning(
            `📦 Stock bajo: ${product.name} - ${product.stock} unidades disponibles`,
            { duration: 7000 }
          );
        }
      }
    }
  }
}

export const ventasService = VentasService.getInstance();
