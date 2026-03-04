import { SyncService } from "@/core/sync/SyncService";
import { Product } from "@/lib";
import { NotificationPayload, notifications } from "../../core/notifications/NotificationService";
import { localDb } from "@/core/database/localDb";

/**
 * Microservicio de Inventario para Violet ERP.
 * 
 * Responsabilidades:
 * - Gestión de productos y stock
 * - Sincronización masiva con lógica de Upsert
 * - Notificaciones de stock bajo
 * - Health checks de inventario
 * - Deduplicación de productos
 * - Exportación de reportes
 * 
 * @class InventarioService
 * @singleton
 * 
 * @example
 * ```typescript
 * import { inventarioService } from '@/services/microservices/inventario/InventarioService';
 * 
 * // Obtener inventario
 * const products = await inventarioService.getInventory('tenant-id');
 * 
 * // Actualizar stock
 * await inventarioService.updateStock('product-id', 50, 'tenant-id');
 * 
 * // Sincronización masiva
 * await inventarioService.syncBulkProducts(arrayDeProductos, 'tenant-id');
 * 
 * // Health check
 * const health = await inventarioService.getInventoryHealthCheck('tenant-id');
 * console.log('Productos con stock negativo:', health.negativeStock.length);
 * ```
 * 
 * @architecture
 * - Patrón Singleton para instancia única
 * - Integración con SyncService para sincronización
 * - Integración con NotificationService para alertas
 * - Almacenamiento local con Dexie (IndexedDB)
 */
export class InventarioService {
  private static instance: InventarioService;

  private constructor() {}

  public static getInstance(): InventarioService {
    if (!InventarioService.instance) {
      InventarioService.instance = new InventarioService();
    }
    return InventarioService.instance;
  }

  /**
   * Obtiene el inventario completo de un tenant.
   * 
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<Product[]>} Lista de productos
   * 
   * @example
   * ```typescript
   * const products = await inventarioService.getInventory('tenant-123');
   * console.log(`Total de productos: ${products.length}`);
   * ```
   */
  public async getInventory(tenantId: string): Promise<Product[]> {
    return localDb.products
      .where('tenant_id').equals(tenantId)
      .toArray();
  }

  /**
   * Normaliza un string para comparaciones seguras (trim, lowercase, remover caracteres especiales básicos)
   */
  private normalizeKey(val: string | undefined): string {
    if (!val) return "";
    return val.toString().trim().toLowerCase();
  }

  /**
   * Sincronización masiva de productos con lógica de Upsert.
   * 
   * Evita duplicados validando por código 'cauplas':
   * - Si el producto existe (mismo cauplas), actualiza
   * - Si no existe, inserta nuevo
   * 
   * @param {Partial<Product>[]} newProducts - Array de productos a sincronizar
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * const productos = [
   *   { name: 'Producto 1', cauplas: 'CAU-001', price: 10, stock: 100 },
   *   { name: 'Producto 2', cauplas: 'CAU-002', price: 20, stock: 200 }
   * ];
   * 
   * await inventarioService.syncBulkProducts(productos, 'tenant-123');
   * ```
   * 
   * @performance
   * - Usa bulkPut para inserción masiva eficiente
   * - Normaliza claves para comparación segura
   * - Mantiene el ID existente si el producto ya existe
   */
  public async syncBulkProducts(newProducts: Partial<Product>[], tenantId: string): Promise<void> {
    const existingProducts = await localDb.products
      .where('tenant_id')
      .equals(tenantId)
      .toArray();

    const existingMap = new Map(existingProducts.map(p => [this.normalizeKey(p.cauplas), p.id]));

    const processedProducts = newProducts.map(p => {
      const normalizedCauplas = this.normalizeKey(p.cauplas);
      const existingId = normalizedCauplas ? existingMap.get(normalizedCauplas) : null;
      
      return {
        ...p,
        id: existingId || p.id || crypto.randomUUID(),
        tenant_id: tenantId,
        updated_at: new Date().toISOString()
      };
    }) as Product[];

    // Insertar o actualizar masivamente en la base de datos local
    await localDb.products.bulkPut(processedProducts);
    
    // Opcional: Notificar al SyncEngine para sincronización diferida con la nube
    // SyncService.notifyBulkUpdate('products', processedProducts);
  }

  /**
   * Actualiza el stock de un producto y dispara notificaciones si es necesario.
   * 
   * @param {string} productId - ID del producto
   * @param {number} newStock - Nuevo valor de stock
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * // Actualizar stock después de una venta
   * await inventarioService.updateStock('prod-123', 45, 'tenant-123');
   * ```
   * 
   * @notifications
   * - Dispara notificación HIGH si stock < 5
   * - Notifica al WarehouseManager
   * - Integración con NotificationService
   */
  public async updateStock(productId: string, newStock: number, tenantId: string): Promise<void> {
    await SyncService.mutate('products', 'UPDATE', {
      id: productId,
      stock: newStock,
      tenant_id: tenantId,
      updated_at: new Date().toISOString()
    }, productId);

    // Check for low stock and trigger notification microservice rules
    if (newStock < 5) {
      const payload: NotificationPayload = {
        channel: "IN_APP",
        priority: "HIGH",
        recipient: "WarehouseManager",
        body: `Stock crítico para el producto ${productId}: quedan ${newStock} unidades.`,
      };
      await notifications.dispatch(payload);
    }
  }

  /**
   * Calcula métricas de valor de inventario y margen.
   */
  /**
   * Realiza un health check del inventario identificando inconsistencias.
   * 
   * Identifica:
   * - Stock negativo (error crítico)
   * - Productos sin categoría
   * - Stock bajo (menor o igual al mínimo)
   * - Productos sin códigos (cauplas ni OEM)
   * 
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<Object>} Objeto con arrays de productos problemáticos
   * 
   * @example
   * ```typescript
   * const health = await inventarioService.getInventoryHealthCheck('tenant-123');
   * 
   * if (health.negativeStock.length > 0) {
   *   console.error('¡Stock negativo detectado!', health.negativeStock);
   * }
   * 
   * if (health.lowStock.length > 0) {
   *   console.warn('Productos con stock bajo:', health.lowStock);
   * }
   * ```
   */
  public async getInventoryHealthCheck(tenantId: string) {
    const products = await this.getInventory(tenantId);
    
    return {
      negativeStock: products.filter(p => p.stock < 0),
      missingCategory: products.filter(p => !p.category || p.category === 'Importación'),
      lowStock: products.filter(p => p.stock <= p.minStock),
      missingCodes: products.filter(p => !p.cauplas && !p.oem)
    };
  }

  /**
   * Genera un reporte resumido de stock para exportación rápida.
   */
  public async exportStockSummary(tenantId: string): Promise<string> {
    const products = await this.getInventory(tenantId);
    const headers = "ID,Nombre,Cauplas,Stock,Precio\n";
    const rows = products.map(p => 
      `${p.id},"${p.name}",${p.cauplas || ""},${p.stock},${p.price}`
    ).join("\n");
    
    return headers + rows;
  }

  /**
   * Limpia y unifica el inventario eliminando duplicados.
   * 
   * Estrategia de deduplicación:
   * 1. Ordena por fecha de actualización (más reciente primero)
   * 2. Agrupa por clave: cauplas > OEM > nombre
   * 3. Mantiene el registro más reciente
   * 4. Elimina los duplicados más antiguos
   * 
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<{before: number, after: number}>} Conteo antes y después
   * 
   * @example
   * ```typescript
   * const result = await inventarioService.deduplicateInventory('tenant-123');
   * console.log(`Productos antes: ${result.before}`);
   * console.log(`Productos después: ${result.after}`);
   * console.log(`Duplicados eliminados: ${result.before - result.after}`);
   * ```
   * 
   * @warning
   * - Esta operación es irreversible
   * - Se recomienda hacer backup antes de ejecutar
   * - Los productos eliminados no se pueden recuperar
   */
  public async deduplicateInventory(tenantId: string): Promise<{ before: number, after: number }> {
    const products = await this.getInventory(tenantId);
    const beforeCount = products.length;
    
    // Mapa para unificar: llave -> producto
    const unifiedMap = new Map<string, Product>();
    const idsToDelete: string[] = [];

    // Ordenamos por fecha de actualización descendente para que el más nuevo "gane" al iterar
    const sortedProducts = [...products].sort((a, b) => 
      new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    );

    sortedProducts.forEach(p => {
      const key = this.normalizeKey(p.cauplas) || this.normalizeKey(p.oem) || this.normalizeKey(p.name);
      if (!key) return;

      if (unifiedMap.has(key)) {
        // Si ya existe en el mapa, este (que es más viejo por el sort) se marca para borrar
        idsToDelete.push(p.id);
      } else {
        unifiedMap.set(key, p);
      }
    });

    if (idsToDelete.length > 0) {
      await localDb.products.bulkDelete(idsToDelete);
    }

    return { before: beforeCount, after: unifiedMap.size };
  }

  /**
   * Borra todo el inventario de un tenant (Reset)
   */
  public async clearInventory(tenantId: string): Promise<void> {
    await localDb.products.where('tenant_id').equals(tenantId).delete();
  }
}

export const inventarioService = InventarioService.getInstance();
