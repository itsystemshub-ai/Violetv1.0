/**
 * Violet ERP - SalesService
 * Gestión completa de ventas con Firebird
 */

import { v4 as uuidv4 } from 'uuid';
import { firebirdPool } from '../database/firebird-pool.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SalesService');

export class SalesService {
  /**
   * Obtener todas las ventas con paginación
   */
  async findAll({ page = 1, limit = 10, customerId = '', status = '', dateFrom = '', dateTo = '' }) {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (customerId) {
        whereClause += ' AND v.cliente_codigo = ?';
        params.push(customerId);
      }

      if (status) {
        whereClause += ' AND v.estado = ?';
        params.push(status);
      }

      if (dateFrom) {
        whereClause += ' AND v.fecha_emision >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND v.fecha_emision <= ?';
        params.push(dateTo);
      }

      // Obtener total
      const countQuery = `SELECT COUNT(*) as total FROM ventas v ${whereClause}`;
      const countResult = await firebirdPool.executeQuery(countQuery, params);
      const total = countResult[0]?.TOTAL || 0;

      // Obtener ventas
      const query = `
        SELECT v.*, c.nombre as cliente_nombre
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_codigo = c.codigo
        ${whereClause}
        ORDER BY v.fecha_emision DESC, v.correlativo DESC
        ROWS ? OFFSET ?
      `;

      const sales = await firebirdPool.executeQuery(query, [...params, limit, offset]);

      return {
        sales: sales || [],
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
      logger.error('Error finding sales:', error);
      throw error;
    }
  }

  /**
   * Obtener venta por ID
   */
  async findById(correlativo) {
    try {
      const sales = await firebirdPool.executeQuery(
        `SELECT v.*, c.nombre as cliente_nombre, c.rif, c.direccion
         FROM ventas v
         LEFT JOIN clientes c ON v.cliente_codigo = c.codigo
         WHERE v.correlativo = ?`,
        [correlativo]
      );

      if (!sales || sales.length === 0) {
        throw new Error('Venta no encontrada');
      }

      const sale = sales[0];

      // Obtener items
      const items = await firebirdPool.executeQuery(
        `SELECT vd.*, p.nombre as producto_nombre
         FROM ventas_desglose vd
         LEFT JOIN productos p ON vd.producto_codigo = p.codigo
         WHERE vd.correlativo = ?
         ORDER BY vd.linea`,
        [correlativo]
      );

      return {
        ...sale,
        items: items || [],
      };
    } catch (error) {
      logger.error(`Error finding sale ${correlativo}:`, error);
      throw error;
    }
  }

  /**
   * Crear venta
   */
  async create(data, userId) {
    const transaction = [];
    const correlativo = await this.getNextCorrelativo(data.depositoCodigo);
    const documento = this.generateDocumento(correlativo);

    try {
      // Insertar venta
      transaction.push({
        sql: `INSERT INTO ventas (
          correlativo, documento, tipo_documento, cliente_codigo,
          cliente_nombre, cliente_rif, moneda_codigo, factor_cambio,
          fecha_emision, hora_emision, dias_vencimiento, fecha_vencimiento,
          deposito_codigo, vendedor_codigo, total_bruto_lineas,
          total_descuento_lineas, total_neto_lineas, total_impuesto_lineas,
          total_lineas, descuento_1, porc_descuento_1, flete, porc_flete,
          total_neto, impuesto, porc_impuesto, total_operacion,
          total_base_imponible, total_impuesto_fiscal, total_exento,
          total_costo, usuario_codigo, temporal, fecha_hora_registro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, CURRENT_TIME, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        params: [
          correlativo,
          documento,
          data.tipoDocumento || 'FAC',
          data.clienteCodigo,
          data.clienteNombre,
          data.clienteRif,
          data.monedaCodigo || 'DOP',
          data.factorCambio || 1,
          data.diasVencimiento || 0,
          data.fechaVencimiento,
          data.depositoCodigo,
          data.vendedorCodigo,
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
          data.temporal ? 'S' : 'N',
        ],
      });

      // Insertar items
      if (data.items && data.items.length > 0) {
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          transaction.push({
            sql: `INSERT INTO ventas_desglose (
              correlativo, linea, producto_codigo, producto_nombre,
              cantidad, precio_unitario, precio_total, descuento,
              impuesto, total, costo_unitario, costo_total, deposito_codigo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
              correlativo,
              i + 1,
              item.productoCodigo,
              item.productoNombre,
              item.cantidad,
              item.precioUnitario,
              item.precioTotal,
              item.descuento || 0,
              item.impuesto || 0,
              item.total,
              item.costoUnitario || 0,
              item.costoTotal || 0,
              data.depositoCodigo,
            ],
          });

          // Actualizar inventario
          transaction.push({
            sql: `UPDATE productos SET existencia_actual = existencia_actual - ? WHERE codigo = ?`,
            params: [item.cantidad, item.productoCodigo],
          });
        }
      }

      await firebirdPool.executeTransaction(transaction);

      logger.info(`Sale created: ${documento}`);

      return await this.findById(correlativo);
    } catch (error) {
      logger.error('Error creating sale:', error);
      throw error;
    }
  }

  /**
   * Anular venta
   */
  async cancel(correlativo, userId, motivo) {
    try {
      await firebirdPool.executeQuery(
        `UPDATE ventas SET 
          anulada = 'S', 
          fecha_anulacion = CURRENT_DATE,
          usuario_anula_codigo = ?,
          motivo_anulacion = ?
         WHERE correlativo = ?`,
        [userId, motivo, correlativo]
      );

      logger.info(`Sale cancelled: ${correlativo}`);
    } catch (error) {
      logger.error(`Error cancelling sale ${correlativo}:`, error);
      throw error;
    }
  }

  /**
   * Generar siguiente correlativo
   */
  async getNextCorrelativo(depositoCodigo) {
    try {
      const result = await firebirdPool.executeQuery(
        `SELECT GEN_ID(gen_ventas_correlativo, 1) as next_val FROM rdb$database`
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
    return `FAC-${String(correlativo).padStart(8, '0')}`;
  }

  /**
   * Obtener ventas por cliente
   */
  async findByCustomer(customerId, limit = 50) {
    try {
      const sales = await firebirdPool.executeQuery(
        `SELECT FIRST ? v.*
         FROM ventas v
         WHERE v.cliente_codigo = ?
         ORDER BY v.fecha_emision DESC`,
        [limit, customerId]
      );

      return sales || [];
    } catch (error) {
      logger.error(`Error finding sales for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener total de ventas por período
   */
  async getTotalByPeriod(dateFrom, dateTo) {
    try {
      const result = await firebirdPool.executeQuery(
        `SELECT 
          COUNT(*) as total_ventas,
          SUM(total_operacion) as monto_total,
          AVG(total_operacion) as promedio_venta
         FROM ventas
         WHERE fecha_emision BETWEEN ? AND ?
         AND anulada = 'N'`,
        [dateFrom, dateTo]
      );

      return result[0] || { total_ventas: 0, monto_total: 0, promedio_venta: 0 };
    } catch (error) {
      logger.error('Error getting total by period:', error);
      throw error;
    }
  }
}

export const salesService = new SalesService();
export default salesService;
