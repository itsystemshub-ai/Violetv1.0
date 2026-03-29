/**
 * Violet ERP - InventoryService
 * Gestión de inventario con múltiples almacenes
 */

import { v4 as uuidv4 } from 'uuid';
import { firebirdPool } from '../database/firebird-pool.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('InventoryService');

export class InventoryService {
  /**
   * Obtener inventario por almacén
   */
  async findByWarehouse(warehouseId, { search = '', category = '', lowStock = false }) {
    try {
      let whereClause = 'WHERE i.deposito_codigo = ?';
      const params = [warehouseId];

      if (search) {
        whereClause += ' AND (p.nombre LIKE ? OR p.codigo LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (category) {
        whereClause += ' AND p.categoria = ?';
        params.push(category);
      }

      if (lowStock) {
        whereClause += ' AND i.cantidad <= p.existencia_minima';
      }

      const query = `
        SELECT p.*, i.cantidad as stock_actual, i.deposito_codigo
        FROM productos p
        LEFT JOIN inventario i ON p.codigo = i.producto_codigo AND i.deposito_codigo = ?
        ${whereClause}
        ORDER BY p.nombre
      `;

      const products = await firebirdPool.executeQuery(query, [warehouseId, ...params]);

      return {
        products: products || [],
        total: products?.length || 0,
      };
    } catch (error) {
      logger.error('Error finding inventory:', error);
      throw error;
    }
  }

  /**
   * Obtener stock de un producto
   */
  async getStock(productId, warehouseId) {
    try {
      const result = await firebirdPool.executeQuery(
        `SELECT i.*, p.existencia_minima, p.existencia_maxima
         FROM inventario i
         JOIN productos p ON i.producto_codigo = p.codigo
         WHERE i.producto_codigo = ? AND i.deposito_codigo = ?`,
        [productId, warehouseId]
      );

      if (!result || result.length === 0) {
        return {
          productId,
          warehouseId,
          cantidad: 0,
          reservado: 0,
          disponible: 0,
        };
      }

      const inv = result[0];
      return {
        productId,
        warehouseId,
        cantidad: inv.CANTIDAD || 0,
        reservado: inv.RESERVADO || 0,
        disponible: (inv.CANTIDAD || 0) - (inv.RESERVADO || 0),
        minimo: inv.EXISTENCIA_MINIMA || 0,
        maximo: inv.EXISTENCIA_MAXIMA || 0,
      };
    } catch (error) {
      logger.error(`Error getting stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar stock
   */
  async updateStock(productId, warehouseId, quantity, type, userId, options = {}) {
    const transaction = [];

    try {
      // Obtener stock actual
      const currentStock = await this.getStock(productId, warehouseId);
      const newQty = type === 'in' 
        ? currentStock.cantidad + quantity 
        : currentStock.cantidad - quantity;

      // Verificar stock suficiente para salidas
      if (type === 'out' && newQty < 0) {
        throw new Error(`Stock insuficiente. Actual: ${currentStock.cantidad}, Requerido: ${quantity}`);
      }

      // Actualizar o crear registro de inventario
      const existing = currentStock.cantidad > 0;

      if (existing) {
        transaction.push({
          sql: `UPDATE inventario SET 
            cantidad = ?, 
            reservado = ?,
            disponible = ?,
            ultima_actualizacion = CURRENT_TIMESTAMP
          WHERE producto_codigo = ? AND deposito_codigo = ?`,
          params: [newQty, currentStock.reservado, newQty - currentStock.reservado, productId, warehouseId],
        });
      } else {
        transaction.push({
          sql: `INSERT INTO inventario (
            id, producto_codigo, deposito_codigo, cantidad, reservado, disponible,
            creado_en
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          params: [uuidv4(), productId, warehouseId, newQty, 0, newQty],
        });
      }

      // Registrar movimiento
      transaction.push({
        sql: `INSERT INTO movimientos_inventario (
          id, producto_codigo, deposito_codigo, tipo, cantidad,
          stock_anterior, stock_nuevo, referencia_tipo, referencia_id,
          motivo, usuario_codigo, creado_en
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        params: [
          uuidv4(),
          productId,
          warehouseId,
          type,
          quantity,
          currentStock.cantidad,
          newQty,
          options.referenceType || null,
          options.referenceId || null,
          options.reason || null,
          userId,
        ],
      });

      // Actualizar producto
      transaction.push({
        sql: `UPDATE productos SET existencia_actual = ? WHERE codigo = ?`,
        params: [newQty, productId],
      });

      await firebirdPool.executeTransaction(transaction);

      logger.info(`Stock updated: ${productId} (${type}: ${quantity})`);

      return {
        productId,
        warehouseId,
        previousStock: currentStock.cantidad,
        newStock: newQty,
        change: type === 'in' ? quantity : -quantity,
      };
    } catch (error) {
      logger.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Transferir stock entre almacenes
   */
  async transfer(productId, fromWarehouseId, toWarehouseId, quantity, userId, reason = '') {
    const transaction = [];

    try {
      // Verificar stock en origen
      const fromStock = await this.getStock(productId, fromWarehouseId);
      
      if (fromStock.cantidad < quantity) {
        throw new Error(`Stock insuficiente en almacén origen. Actual: ${fromStock.cantidad}`);
      }

      // Restar del origen
      transaction.push({
        sql: `UPDATE inventario SET cantidad = cantidad - ? 
              WHERE producto_codigo = ? AND deposito_codigo = ?`,
        params: [quantity, productId, fromWarehouseId],
      });

      // Sumar al destino
      transaction.push({
        sql: `UPDATE inventario SET cantidad = cantidad + ? 
              WHERE producto_codigo = ? AND deposito_codigo = ?`,
        params: [quantity, productId, toWarehouseId],
      });

      // Registrar transferencia
      transaction.push({
        sql: `INSERT INTO transferencias_inventario (
          id, producto_codigo, deposito_origen, deposito_destino,
          cantidad, motivo, usuario_codigo, creado_en
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        params: [uuidv4(), productId, fromWarehouseId, toWarehouseId, quantity, reason, userId],
      });

      await firebirdPool.executeTransaction(transaction);

      logger.info(`Stock transferred: ${productId} from ${fromWarehouseId} to ${toWarehouseId}`);

      return {
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
      };
    } catch (error) {
      logger.error('Error transferring stock:', error);
      throw error;
    }
  }

  /**
   * Obtener productos con stock bajo
   */
  async getLowStock(warehouseId, threshold = null) {
    try {
      const query = `
        SELECT p.*, i.cantidad, i.deposito_codigo
        FROM productos p
        JOIN inventario i ON p.codigo = i.producto_codigo
        WHERE i.deposito_codigo = ? 
        AND i.cantidad <= COALESCE(?, p.existencia_minima, 10)
        ORDER BY i.cantidad ASC
      `;

      const products = await firebirdPool.executeQuery(query, [warehouseId, threshold]);
      return products || [];
    } catch (error) {
      logger.error('Error getting low stock products:', error);
      throw error;
    }
  }

  /**
   * Ajuste de inventario (inventario físico)
   */
  async adjust(productId, warehouseId, actualQuantity, userId, reason = '') {
    try {
      const currentStock = await this.getStock(productId, warehouseId);
      const difference = actualQuantity - currentStock.cantidad;
      const type = difference >= 0 ? 'in' : 'out';

      await this.updateStock(productId, warehouseId, Math.abs(difference), type, userId, {
        reason: reason || 'Ajuste de inventario',
        referenceType: 'ADJUSTMENT',
      });

      logger.info(`Inventory adjusted: ${productId} (difference: ${difference})`);

      return {
        productId,
        warehouseId,
        previousStock: currentStock.cantidad,
        newStock: actualQuantity,
        difference,
      };
    } catch (error) {
      logger.error('Error adjusting inventory:', error);
      throw error;
    }
  }

  /**
   * Obtener valor del inventario
   */
  async getInventoryValue(warehouseId) {
    try {
      const result = await firebirdPool.executeQuery(
        `SELECT 
          COUNT(DISTINCT p.codigo) as total_productos,
          SUM(i.cantidad) as total_unidades,
          SUM(i.cantidad * p.costo_actual) as valor_total
         FROM productos p
         JOIN inventario i ON p.codigo = i.producto_codigo
         WHERE i.deposito_codigo = ?
         AND i.cantidad > 0`,
        [warehouseId]
      );

      return result[0] || {
        total_productos: 0,
        total_unidades: 0,
        valor_total: 0,
      };
    } catch (error) {
      logger.error('Error getting inventory value:', error);
      throw error;
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
