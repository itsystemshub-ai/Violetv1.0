/**
 * Violet ERP - ProductService
 * Gestión de productos con Firebird
 */

import { v4 as uuidv4 } from 'uuid';
import { firebirdPool } from '../database/firebird-pool.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ProductService');

export class ProductService {
  /**
   * Obtener todos los productos con paginación
   */
  async findAll({ page = 1, limit = 10, search = '', category = '', active = true }) {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (category) {
        whereClause += ' AND p.category_id = ?';
        params.push(category);
      }

      if (active !== null) {
        whereClause += active ? ' AND p.is_active = 1' : ' AND p.is_active = 0';
      }

      // Obtener total
      const countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
      const countResult = await firebirdPool.executeQuery(countQuery, params);
      const total = countResult[0]?.TOTAL || 0;

      // Obtener productos
      const query = `
        SELECT p.*, c.name as category_name, u.symbol as unit_symbol
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN units u ON p.unit_id = u.id
        ${whereClause}
        ORDER BY p.name
        ROWS ? OFFSET ?
      `;

      const products = await firebirdPool.executeQuery(query, [...params, limit, offset]);

      return {
        products: products || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error finding products:', error);
      throw error;
    }
  }

  /**
   * Obtener producto por ID
   */
  async findById(id) {
    try {
      const products = await firebirdPool.executeQuery(
        `SELECT p.*, c.name as category_name, u.symbol as unit_symbol
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN units u ON p.unit_id = u.id
         WHERE p.id = ?`,
        [id]
      );

      if (!products || products.length === 0) {
        throw new Error('Product not found');
      }

      return products[0];
    } catch (error) {
      logger.error(`Error finding product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crear producto
   */
  async create(data) {
    const transaction = [
      {
        sql: `INSERT INTO products (
          id, code, name, description, category_id, brand_id, unit_id,
          cost_price, sale_price, min_stock, max_stock, current_stock,
          reserved_stock, available_stock, barcode, is_active, is_taxable,
          tax_rate, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        params: [
          uuidv4(),
          data.code,
          data.name,
          data.description,
          data.categoryId,
          data.brandId,
          data.unitId,
          data.costPrice,
          data.salePrice,
          data.minStock,
          data.maxStock,
          data.currentStock || 0,
          data.reservedStock || 0,
          data.availableStock || 0,
          data.barcode,
          data.isTaxable ? 1 : 0,
          data.taxRate || 0,
        ],
      },
    ];

    try {
      await firebirdPool.executeTransaction(transaction);
      logger.info(`Product created: ${data.code}`);
      
      // Obtener producto creado
      const products = await firebirdPool.executeQuery(
        `SELECT * FROM products WHERE code = ?`,
        [data.code]
      );
      
      return products[0];
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Actualizar producto
   */
  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description);
    }
    if (data.categoryId !== undefined) {
      fields.push('category_id = ?');
      params.push(data.categoryId);
    }
    if (data.costPrice !== undefined) {
      fields.push('cost_price = ?');
      params.push(data.costPrice);
    }
    if (data.salePrice !== undefined) {
      fields.push('sale_price = ?');
      params.push(data.salePrice);
    }
    if (data.minStock !== undefined) {
      fields.push('min_stock = ?');
      params.push(data.minStock);
    }
    if (data.maxStock !== undefined) {
      fields.push('max_stock = ?');
      params.push(data.maxStock);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    try {
      await firebirdPool.executeQuery(
        `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
        params
      );

      logger.info(`Product updated: ${id}`);
      
      return await this.findById(id);
    } catch (error) {
      logger.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar producto
   */
  async delete(id) {
    try {
      // Soft delete - actualizar is_active
      await firebirdPool.executeQuery(
        `UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      );

      logger.info(`Product deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar stock
   */
  async updateStock(productId, warehouseId, quantity, type = 'adjustment', userId, reference = {}) {
    const transaction = [];

    try {
      // Obtener stock actual
      const inventory = await firebirdPool.executeQuery(
        `SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ?`,
        [productId, warehouseId]
      );

      let currentQty = 0;
      if (inventory && inventory.length > 0) {
        currentQty = inventory[0].quantity || 0;
      }

      const newQty = type === 'in' ? currentQty + quantity : currentQty - quantity;

      if (inventory && inventory.length > 0) {
        // Actualizar inventario existente
        transaction.push({
          sql: `UPDATE inventory SET quantity = ?, available = ?, updated_at = CURRENT_TIMESTAMP
                WHERE product_id = ? AND warehouse_id = ?`,
          params: [newQty, newQty, productId, warehouseId],
        });
      } else {
        // Crear nuevo registro de inventario
        transaction.push({
          sql: `INSERT INTO inventory (id, product_id, warehouse_id, quantity, available, created_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          params: [uuidv4(), productId, warehouseId, newQty, newQty],
        });
      }

      // Registrar movimiento
      transaction.push({
        sql: `INSERT INTO stock_movements (
          id, product_id, warehouse_id, type, quantity, previous_stock, new_stock,
          reference_type, reference_id, reason, user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        params: [
          uuidv4(),
          productId,
          warehouseId,
          type,
          quantity,
          currentQty,
          newQty,
          reference.type || null,
          reference.id || null,
          reference.reason || null,
          userId,
        ],
      });

      await firebirdPool.executeTransaction(transaction);

      logger.info(`Stock updated: ${productId} (${type}: ${quantity})`);

      return { previousStock: currentQty, newStock: newQty };
    } catch (error) {
      logger.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Obtener productos con stock bajo
   */
  async getLowStock(warehouseId, threshold = null) {
    try {
      const query = `
        SELECT p.*, i.quantity, i.min_stock
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        WHERE i.warehouse_id = ? AND i.quantity <= COALESCE(?, p.min_stock)
        ORDER BY i.quantity ASC
      `;

      const products = await firebirdPool.executeQuery(query, [warehouseId, threshold]);
      return products || [];
    } catch (error) {
      logger.error('Error getting low stock products:', error);
      throw error;
    }
  }
}

export const productService = new ProductService();
export default productService;
