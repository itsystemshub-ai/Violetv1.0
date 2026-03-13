/**
 * InventoryERPService - Servicio de Inventario integrado con el ERP Core
 * 
 * Este servicio adapta el módulo de inventario para usar el Transaction Engine
 * del ERP, manejando movimientos de stock y ajustes integrados.
 * 
 * @module modules/inventory/services/InventoryERPService
 */

import { transactionEngine, ERP_EVENTS } from '@/core/erp';
import { accountingBridge } from '@/core/erp/accounting-bridge/AccountingBridge';
import { auditLog } from '@/core/erp/audit-log/AuditLogService';
import { localDb } from '@/core/database/localDb';

export type InventoryMovementType = 
  | 'IN'      // Entrada
  | 'OUT'     // Salida
  | 'ADJUST'  // Ajuste
  | 'TRANSFER'; // Transferencia entre almacenes

export interface InventoryMovement {
  id?: string;
  productId: string;
  productName: string;
  productCode?: string;
  warehouseId?: string;
  warehouseName?: string;
  type: InventoryMovementType;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reference?: string;
  referenceType?: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'TRANSFER';
  reason?: string;
  date: string;
  createdBy?: string;
}

export interface InventoryAdjustment {
  id?: string;
  productId: string;
  productName: string;
  currentStock: number;
  newStock: number;
  difference: number;
  reason: string;
  type: 'INCREASE' | 'DECREASE';
  date: string;
  approvedBy?: string;
  createdBy?: string;
}

export interface InventoryERPResult {
  success: boolean;
  movement?: InventoryMovement;
  adjustment?: InventoryAdjustment;
  transactionId?: string;
  error?: string;
}

/**
 * InventoryERPService - Servicio para integrar inventario con el ERP
 */
class InventoryERPServiceClass {
  private static instance: InventoryERPServiceClass;

  private constructor() {
    console.log('[InventoryERP] Servicio inicializado');
    
    // Escuchar eventos de compra received para incrementar stock
    this.setupEventListeners();
  }

  static getInstance(): InventoryERPServiceClass {
    if (!InventoryERPServiceClass.instance) {
      InventoryERPServiceClass.instance = new InventoryERPServiceClass();
    }
    return InventoryERPServiceClass.instance;
  }

  /**
   * Configurar listeners de eventos
   */
  private async setupEventListeners() {
    const { eventBus } = await import('@/core/erp/event-bus/EventBus');
    
    // Cuando se recibe una compra, incrementar inventario
    eventBus.on(ERP_EVENTS.PURCHASE_ORDER_RECEIVED, async (event) => {
      console.log('[InventoryERP] Receiving purchase order:', event.payload);
      // Lositems vienen en el payload
    }, 'InventoryERP');
  }

  /**
   * Registrar movimiento de inventario
   */
  async registerMovement(
    movement: Omit<InventoryMovement, 'id'>, 
    userId?: string
  ): Promise<InventoryERPResult> {
    try {
      // 1. Crear transacción
      const transactionType = movement.type === 'IN' 
        ? 'PURCHASE_RECEIPT' 
        : movement.type === 'OUT' 
          ? 'SALE' 
          : 'INVENTORY_ADJUSTMENT';

      const transactionResult = await transactionEngine.createTransaction(
        transactionType,
        'inventory',
        {
          status: 'COMPLETED',
          createdBy: userId,
          metadata: {
            productId: movement.productId,
            quantity: movement.quantity,
            type: movement.type,
          },
        }
      );

      if (!transactionResult.success || !transactionResult.transaction) {
        return {
          success: false,
          error: transactionResult.error?.message || 'Error creando transacción',
        };
      }

      const transactionId = transactionResult.transaction.id;

      // 2. Guardar movimiento
      const movementId = `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const now = new Date().toISOString();

      const movementRecord: any = {
        id: movementId,
        product_id: movement.productId,
        product_name: movement.productName,
        product_code: movement.productCode,
        warehouse_id: movement.warehouseId,
        warehouse_name: movement.warehouseName,
        type: movement.type,
        quantity: movement.quantity,
        unit_cost: movement.unitCost || 0,
        total_cost: movement.totalCost || 0,
        reference: movement.reference,
        reference_type: movement.referenceType,
        reason: movement.reason,
        date: movement.date,
        tenant_id: transactionResult.transaction.companyId,
        transaction_id: transactionId,
        created_at: now,
        is_dirty: true,
      };

      await localDb.inventory_movements?.put(movementRecord);

      // 3. Actualizar stock del producto
      await this.updateProductStock(
        movement.productId,
        movement.type === 'IN' || movement.type === 'ADJUST' && movement.quantity > 0
          ? movement.quantity 
          : -movement.quantity,
        transactionResult.transaction.companyId
      );

      // 4. Emitir evento
      const { eventBus } = await import('@/core/erp/event-bus/EventBus');
      eventBus.emit(
        movement.type === 'IN' ? ERP_EVENTS.INVENTORY_INCREASED : ERP_EVENTS.INVENTORY_DECREASED,
        {
          productId: movement.productId,
          quantity: movement.quantity,
          type: movement.type,
        },
        {
          sourceModule: 'InventoryERP',
          transactionId,
          companyId: transactionResult.transaction.companyId,
        }
      );

      // 5. Auditoría
      await auditLog.log({
        entityType: 'PRODUCT',
        entityId: movement.productId,
        action: movement.type === 'IN' ? 'CREATE' : 'UPDATE',
        description: `Movimiento de inventario: ${movement.type} - ${movement.quantity} unidades`,
        transactionId,
        userId,
        newValue: movementRecord,
      });

      console.log(`[InventoryERP] ✅ Movimiento registrado: ${movementId}`, { 
        type: movement.type, 
        quantity: movement.quantity 
      });

      return {
        success: true,
        movement: { ...movement, id: movementId },
        transactionId,
      };
    } catch (error) {
      console.error('[InventoryERP] Error registrando movimiento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Registrar ajuste de inventario
   */
  async registerAdjustment(
    adjustment: Omit<InventoryAdjustment, 'id'>,
    userId?: string
  ): Promise<InventoryERPResult> {
    try {
      // Validar que el ajuste tenga sentido
      if (adjustment.difference === 0) {
        return { success: false, error: 'La diferencia no puede ser 0' };
      }

      // Crear transacción
      const transactionResult = await transactionEngine.createTransaction(
        'INVENTORY_ADJUSTMENT',
        'inventory',
        {
          status: 'PENDING',
          createdBy: userId,
          metadata: {
            productId: adjustment.productId,
            currentStock: adjustment.currentStock,
            newStock: adjustment.newStock,
            difference: adjustment.difference,
          },
        }
      );

      if (!transactionResult.success || !transactionResult.transaction) {
        return {
          success: false,
          error: transactionResult.error?.message || 'Error creando transacción',
        };
      }

      const transactionId = transactionResult.transaction.id;
      const adjustmentId = `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const now = new Date().toISOString();

      // Guardar ajuste
      const adjustmentRecord: any = {
        id: adjustmentId,
        product_id: adjustment.productId,
        product_name: adjustment.productName,
        current_stock: adjustment.currentStock,
        new_stock: adjustment.newStock,
        difference: adjustment.difference,
        reason: adjustment.reason,
        type: adjustment.type,
        date: adjustment.date,
        approved_by: adjustment.approvedBy,
        tenant_id: transactionResult.transaction.companyId,
        transaction_id: transactionId,
        status: 'pending',
        created_at: now,
        created_by: userId,
        is_dirty: true,
      };

      await localDb.inventory_adjustments?.put(adjustmentRecord);

      // Si está aprobado, ejecutar el ajuste
      if (adjustment.approvedBy) {
        await this.applyAdjustment(adjustmentId, adjustment, transactionResult.transaction.companyId, userId);
      }

      // Emitir evento
      const { eventBus } = await import('@/core/erp/event-bus/EventBus');
      eventBus.emit(ERP_EVENTS.INVENTORY_ADJUSTED, {
        adjustmentId,
        productId: adjustment.productId,
        difference: adjustment.difference,
      }, {
        sourceModule: 'InventoryERP',
        transactionId,
        companyId: transactionResult.transaction.companyId,
      });

      // Auditoría
      await auditLog.log({
        entityType: 'PRODUCT',
        entityId: adjustment.productId,
        action: 'UPDATE',
        description: `Ajuste de inventario: ${adjustment.type} - Diferencia: ${adjustment.difference}`,
        transactionId,
        userId,
        newValue: adjustmentRecord,
      });

      return {
        success: true,
        adjustment: { ...adjustment, id: adjustmentId },
        transactionId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Aprobar y aplicar un ajuste de inventario
   */
  async approveAdjustment(
    adjustmentId: string,
    approverId: string
  ): Promise<InventoryERPResult> {
    try {
      const adjustment: any = await localDb.inventory_adjustments?.get(adjustmentId);
      if (!adjustment) {
        return { success: false, error: 'Ajuste no encontrado' };
      }

      // Aplicar el ajuste
      await this.applyAdjustment(
        adjustmentId, 
        adjustment as any, 
        adjustment.tenant_id, 
        approverId
      );

      // Actualizar estado
      await localDb.inventory_adjustments?.update(adjustmentId, {
        status: 'approved' as any,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        is_dirty: true as any,
      });

      // Completar transacción
      await transactionEngine.updateTransactionStatus(
        adjustment.transaction_id, 
        'COMPLETED'
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtener movimientos de inventario por producto
   */
  async getMovementsByProduct(productId: string): Promise<InventoryMovement[]> {
    const movements: any[] = await localDb.inventory_movements
      ?.where('product_id')
      .equals(productId)
      .toArray() || [];

    return movements.map(m => ({
      id: m.id,
      productId: m.product_id,
      productName: m.product_name,
      productCode: m.product_code,
      warehouseId: m.warehouse_id,
      warehouseName: m.warehouse_name,
      type: m.type,
      quantity: m.quantity,
      unitCost: m.unit_cost,
      totalCost: m.total_cost,
      reference: m.reference,
      referenceType: m.reference_type,
      reason: m.reason,
      date: m.date,
    }));
  }

  /**
   * Obtener ajustes de inventario por empresa
   */
  async getAdjustmentsByCompany(companyId: string): Promise<InventoryAdjustment[]> {
    const adjustments: any[] = await localDb.inventory_adjustments
      ?.where('tenant_id')
      .equals(companyId)
      .toArray() || [];

    return adjustments.map(a => ({
      id: a.id,
      productId: a.product_id,
      productName: a.product_name,
      currentStock: a.current_stock,
      newStock: a.new_stock,
      difference: a.difference,
      reason: a.reason,
      type: a.type,
      date: a.date,
      approvedBy: a.approved_by,
    }));
  }

  // Métodos privados

  private async updateProductStock(
    productId: string, 
    quantityChange: number,
    companyId: string
  ): Promise<void> {
    try {
      const product = await localDb.products?.get(productId);
      if (product) {
        const newStock = (product.stock || 0) + quantityChange;
        await localDb.products?.update(productId, {
          stock: newStock,
          updated_at: new Date().toISOString(),
          is_dirty: true as any,
        });
        
        // Verificar stock bajo
        const minStock = (product as any).stock_minimo || 10;
        if (newStock < minStock) {
          const { eventBus } = await import('@/core/erp/event-bus/EventBus');
          eventBus.emit(ERP_EVENTS.STOCK_LOW, {
            productId,
            productName: (product as any).name,
            currentStock: newStock,
            minimumStock: minStock,
          }, {
            sourceModule: 'InventoryERP',
            companyId,
          });
        }
      }
    } catch (error) {
      console.error('[InventoryERP] Error actualizando stock:', error);
    }
  }

  private async applyAdjustment(
    adjustmentId: string,
    adjustment: InventoryAdjustment,
    companyId: string,
    userId?: string
  ): Promise<void> {
    // Actualizar el stock del producto
    await this.updateProductStock(
      adjustment.productId,
      adjustment.difference,
      companyId
    );

    // Registrar movimiento de ajuste
    await this.registerMovement({
      productId: adjustment.productId,
      productName: adjustment.productName,
      type: 'ADJUST',
      quantity: adjustment.difference,
      reason: adjustment.reason,
      reference: adjustmentId,
      referenceType: 'ADJUSTMENT',
      date: adjustment.date,
      createdBy: userId,
    }, userId);
  }
}

export const inventoryERPService = InventoryERPServiceClass.getInstance();
export default inventoryERPService;