/**
 * Violet ERP - PurchaseService
 * Gestión completa de compras y órdenes de compra
 */

import { v4 as uuidv4 } from 'uuid';
import { firebirdPool } from '../database/firebird-pool.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('PurchaseService');

export class PurchaseService {
  /**
   * Obtener todas las compras con paginación
   */
  async findAll({ page = 1, limit = 10, supplierId = '', status = '', dateFrom = '', dateTo = '' }) {
    try {
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (supplierId) {
        whereClause += ' AND c.proveedor_codigo = ?';
        params.push(supplierId);
      }

      if (status) {
        whereClause += ' AND c.estado = ?';
        params.push(status);
      }

      if (dateFrom) {
        whereClause += ' AND c.fecha_emision >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND c.fecha_emision <= ?';
        params.push(dateTo);
      }

      const countQuery = `SELECT COUNT(*) as total FROM compras c ${whereClause}`;
      const countResult = await firebirdPool.executeQuery(countQuery, params);
      const total = countResult[0]?.TOTAL || 0;

      const query = `
        SELECT c.*, p.nombre as proveedor_nombre
        FROM compras c
        LEFT JOIN proveedores p ON c.proveedor_codigo = p.codigo
        ${whereClause}
        ORDER BY c.fecha_emision DESC, c.correlativo DESC
        ROWS ? OFFSET ?
      `;

      const purchases = await firebirdPool.executeQuery(query, [...params, limit, offset]);

      return {
        purchases: purchases || [],
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
      logger.error('Error finding purchases:', error);
      throw error;
    }
  }

  /**
   * Obtener compra por ID
   */
  async findById(correlativo) {
    try {
      const purchases = await firebirdPool.executeQuery(
        `SELECT c.*, p.nombre as proveedor_nombre, p.rif, p.direccion
         FROM compras c
         LEFT JOIN proveedores p ON c.proveedor_codigo = p.codigo
         WHERE c.correlativo = ?`,
        [correlativo]
      );

      if (!purchases || purchases.length === 0) {
        throw new Error('Compra no encontrada');
      }

      const purchase = purchases[0];

      const items = await firebirdPool.executeQuery(
        `SELECT cd.*, pr.nombre as producto_nombre
         FROM compras_desglose cd
         LEFT JOIN productos pr ON cd.producto_codigo = pr.codigo
         WHERE cd.correlativo = ?
         ORDER BY cd.linea`,
        [correlativo]
      );

      return {
        ...purchase,
        items: items || [],
      };
    } catch (error) {
      logger.error(`Error finding purchase ${correlativo}:`, error);
      throw error;
    }
  }

  /**
   * Crear compra
   */
  async create(data, userId) {
    const transaction = [];
    const correlativo = await this.getNextCorrelativo();
    const documento = this.generateDocumento(correlativo);

    try {
      transaction.push({
        sql: `INSERT INTO compras (
          correlativo, documento, tipo_documento, proveedor_codigo,
          proveedor_nombre, proveedor_rif, moneda_codigo, factor_cambio,
          fecha_emision, fecha_registro, deposito_codigo,
          total_bruto_lineas, total_descuento_lineas, total_neto_lineas,
          total_impuesto_lineas, total_lineas, descuento_1, porc_descuento_1,
          flete, porc_flete, total_neto, impuesto, porc_impuesto,
          total_operacion, total_base_imponible, total_impuesto_fiscal,
          total_exento, total_costo, usuario_codigo, estado,
          fecha_hora_registro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, CURRENT_DATE, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        params: [
          correlativo,
          documento,
          data.tipoDocumento || 'ORD',
          data.proveedorCodigo,
          data.proveedorNombre,
          data.proveedorRif,
          data.monedaCodigo || 'DOP',
          data.factorCambio || 1,
          data.depositoCodigo,
          data.totalBrutoLineas || 0,
          data.totalDescuentoLineas || 0,
          data.totalNetoLineas || 0,
          data.totalImpuestoLineas || 0,
          data.totalLineas || 0,
          data.descuento1 || 0,
          data.porcDescuento1 || 0,
          data.flete || 0,
          data.porcFlete || 0,
          data.totalNeto || 0,
          data.impuesto || 0,
          data.porcImpuesto || 0,
          data.totalOperacion || 0,
          data.totalBaseImponible || 0,
          data.totalImpuestoFiscal || 0,
          data.totalExento || 0,
          data.totalCosto || 0,
          userId,
          data.estado || 'PENDIENTE',
        ],
      });

      if (data.items && data.items.length > 0) {
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          transaction.push({
            sql: `INSERT INTO compras_desglose (
              correlativo, linea, producto_codigo, producto_nombre,
              cantidad, costo_unitario, precio_total, descuento,
              impuesto, total, deposito_codigo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
              correlativo,
              i + 1,
              item.productoCodigo,
              item.productoNombre,
              item.cantidad,
              item.costoUnitario,
              item.precioTotal,
              item.descuento || 0,
              item.impuesto || 0,
              item.total,
              data.depositoCodigo,
            ],
          });
        }
      }

      await firebirdPool.executeTransaction(transaction);

      logger.info(`Purchase created: ${documento}`);

      return await this.findById(correlativo);
    } catch (error) {
      logger.error('Error creating purchase:', error);
      throw error;
    }
  }

  /**
   * Recepcionar compra (actualizar inventario)
   */
  async receive(correlativo, userId, options = {}) {
    const transaction = [];

    try {
      const purchase = await this.findById(correlativo);

      if (!purchase) {
        throw new Error('Compra no encontrada');
      }

      if (purchase.ESTADO === 'RECIBIDO') {
        throw new Error('Compra ya recepcionada');
      }

      // Actualizar estado
      transaction.push({
        sql: `UPDATE compras SET estado = 'RECIBIDO', fecha_recepcion = CURRENT_DATE
              WHERE correlativo = ?`,
        params: [correlativo],
      });

      // Actualizar inventario
      for (const item of purchase.ITEMS || []) {
        const currentStock = await firebirdPool.executeQuery(
          `SELECT cantidad FROM inventario 
           WHERE producto_codigo = ? AND deposito_codigo = ?`,
          [item.PRODUCTO_CODIGO, purchase.DEPOSITO_CODIGO]
        );

        const exists = currentStock && currentStock.length > 0;
        const currentQty = exists ? currentStock[0].CANTIDAD : 0;
        const newQty = currentQty + (item.CANTIDAD || 0);

        if (exists) {
          transaction.push({
            sql: `UPDATE inventario SET cantidad = ?, ultima_actualizacion = CURRENT_TIMESTAMP
                  WHERE producto_codigo = ? AND deposito_codigo = ?`,
            params: [newQty, item.PRODUCTO_CODIGO, purchase.DEPOSITO_CODIGO],
          });
        } else {
          transaction.push({
            sql: `INSERT INTO inventario (id, producto_codigo, deposito_codigo, cantidad, creado_en)
                  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            params: [uuidv4(), item.PRODUCTO_CODIGO, purchase.DEPOSITO_CODIGO, newQty],
          });
        }

        // Actualizar producto
        transaction.push({
          sql: `UPDATE productos SET existencia_actual = ?, costo_actual = ?
                WHERE codigo = ?`,
          params: [newQty, item.COSTO_UNITARIO || 0, item.PRODUCTO_CODIGO],
        });

        // Registrar movimiento
        transaction.push({
          sql: `INSERT INTO movimientos_inventario (
            id, producto_codigo, deposito_codigo, tipo, cantidad,
            stock_anterior, stock_nuevo, referencia_tipo, referencia_id,
            motivo, usuario_codigo, creado_en
          ) VALUES (?, ?, ?, 'in', ?, ?, ?, 'COMPRA', ?, ?, ?, CURRENT_TIMESTAMP)`,
          params: [
            uuidv4(),
            item.PRODUCTO_CODIGO,
            purchase.DEPOSITO_CODIGO,
            item.CANTIDAD,
            currentQty,
            newQty,
            correlativo,
            options.motivo || 'Recepción de compra',
            userId,
          ],
        });
      }

      await firebirdPool.executeTransaction(transaction);

      logger.info(`Purchase received: ${correlativo}`);

      return await this.findById(correlativo);
    } catch (error) {
      logger.error('Error receiving purchase:', error);
      throw error;
    }
  }

  /**
   * Anular compra
   */
  async cancel(correlativo, userId, motivo) {
    try {
      await firebirdPool.executeQuery(
        `UPDATE compras SET
          estado = 'ANULADO',
          fecha_anulacion = CURRENT_DATE,
          usuario_anula_codigo = ?,
          motivo_anulacion = ?
         WHERE correlativo = ?`,
        [userId, motivo, correlativo]
      );

      logger.info(`Purchase cancelled: ${correlativo}`);
    } catch (error) {
      logger.error(`Error cancelling purchase ${correlativo}:`, error);
      throw error;
    }
  }

  /**
   * Generar siguiente correlativo
   */
  async getNextCorrelativo() {
    try {
      const result = await firebirdPool.executeQuery(
        `SELECT GEN_ID(gen_compras_correlativo, 1) as next_val FROM rdb$database`
      );
      return result[0]?.NEXT_VAL || 1;
    } catch (error) {
      logger.error('Error getting next correlativo:', error);
      throw error;
    }
  }

  /**
   * Generar documento
   */
  generateDocumento(correlativo) {
    return `ORD-${String(correlativo).padStart(8, '0')}`;
  }

  /**
   * Obtener compras por proveedor
   */
  async findBySupplier(supplierId, limit = 50) {
    try {
      const purchases = await firebirdPool.executeQuery(
        `SELECT FIRST ? c.*
         FROM compras c
         WHERE c.proveedor_codigo = ?
         ORDER BY c.fecha_emision DESC`,
        [limit, supplierId]
      );

      return purchases || [];
    } catch (error) {
      logger.error(`Error finding purchases for supplier ${supplierId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener total de compras por período
   */
  async getTotalByPeriod(dateFrom, dateTo) {
    try {
      const result = await firebirdPool.executeQuery(
        `SELECT
          COUNT(*) as total_compras,
          SUM(total_operacion) as monto_total,
          AVG(total_operacion) as promedio_compra
         FROM compras
         WHERE fecha_emision BETWEEN ? AND ?
         AND estado != 'ANULADO'`,
        [dateFrom, dateTo]
      );

      return result[0] || { total_compras: 0, monto_total: 0, promedio_compra: 0 };
    } catch (error) {
      logger.error('Error getting total by period:', error);
      throw error;
    }
  }

  /**
   * Obtener productos más comprados
   */
  async getTopProducts(limit = 20) {
    try {
      const result = await firebirdPool.executeQuery(
        `SELECT FIRST ?
          cd.producto_codigo,
          p.nombre as producto_nombre,
          SUM(cd.cantidad) as cantidad_total,
          SUM(cd.total) as monto_total,
          COUNT(DISTINCT cd.correlativo) as veces_comprado
         FROM compras_desglose cd
         JOIN productos p ON cd.producto_codigo = p.codigo
         JOIN compras c ON cd.correlativo = c.correlativo
         WHERE c.estado != 'ANULADO'
         GROUP BY cd.producto_codigo, p.nombre
         ORDER BY cantidad_total DESC`,
        [limit]
      );

      return result || [];
    } catch (error) {
      logger.error('Error getting top products:', error);
      throw error;
    }
  }
}

export const purchaseService = new PurchaseService();
export default purchaseService;
