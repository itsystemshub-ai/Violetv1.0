/**
 * Violet ERP - ReportService
 * Sistema avanzado de reportes y analytics
 */

import { firebirdPool } from '../database/firebird-pool.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ReportService');

export class ReportService {
  /**
   * Dashboard - Métricas principales
   */
  async getDashboardMetrics(options = {}) {
    try {
      const { dateFrom, dateTo, warehouseId } = options;

      const [
        salesTotal,
        purchasesTotal,
        productsCount,
        customersCount,
        lowStockProducts,
        pendingCXC,
        pendingCXP,
      ] = await Promise.all([
        // Ventas del período
        firebirdPool.executeQuery(
          `SELECT COUNT(*) as total, SUM(total_operacion) as monto
           FROM ventas
           WHERE fecha_emision BETWEEN ? AND ? AND anulada = 'N'`,
          [dateFrom || new Date().toISOString().split('T')[0], dateTo || new Date().toISOString().split('T')[0]]
        ),
        // Compras del período
        firebirdPool.executeQuery(
          `SELECT COUNT(*) as total, SUM(total_operacion) as monto
           FROM compras
           WHERE fecha_emision BETWEEN ? AND ? AND estado != 'ANULADO'`,
          [dateFrom || new Date().toISOString().split('T')[0], dateTo || new Date().toISOString().split('T')[0]]
        ),
        // Total productos
        firebirdPool.executeQuery(`SELECT COUNT(*) as total FROM productos WHERE activo = 'S'`),
        // Total clientes
        firebirdPool.executeQuery(`SELECT COUNT(*) as total FROM clientes WHERE activo = 'S'`),
        // Productos con stock bajo
        firebirdPool.executeQuery(
          `SELECT COUNT(*) as total
           FROM inventario i
           JOIN productos p ON i.producto_codigo = p.codigo
           WHERE i.cantidad <= p.existencia_minima`
        ),
        // CXC pendiente
        firebirdPool.executeQuery(`SELECT SUM(saldo_actual) as total FROM cxc WHERE saldo_actual > 0`),
        // CXP pendiente
        firebirdPool.executeQuery(`SELECT SUM(saldo_actual) as total FROM cxp WHERE saldo_actual > 0`),
      ]);

      return {
        ventas: {
          total: salesTotal[0]?.TOTAL || 0,
          monto: salesTotal[0]?.MONTO || 0,
        },
        compras: {
          total: purchasesTotal[0]?.TOTAL || 0,
          monto: purchasesTotal[0]?.MONTO || 0,
        },
        productos: {
          total: productsCount[0]?.TOTAL || 0,
        },
        clientes: {
          total: customersCount[0]?.TOTAL || 0,
        },
        alertas: {
          stockBajo: lowStockProducts[0]?.TOTAL || 0,
          cxcPendiente: pendingCXC[0]?.TOTAL || 0,
          cxpPendiente: pendingCXP[0]?.TOTAL || 0,
        },
      };
    } catch (error) {
      logger.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Ventas por período (diario, semanal, mensual, anual)
   */
  async getSalesByPeriod(period = 'daily', dateFrom, dateTo) {
    try {
      let groupBy = 'fecha_emision';
      let dateFormat = 'YYYY-MM-DD';

      switch (period) {
        case 'daily':
          groupBy = 'EXTRACT(DAY FROM fecha_emision)';
          dateFormat = 'DD';
          break;
        case 'weekly':
          groupBy = 'EXTRACT(WEEK FROM fecha_emision)';
          dateFormat = 'WW';
          break;
        case 'monthly':
          groupBy = 'EXTRACT(MONTH FROM fecha_emision)';
          dateFormat = 'MM';
          break;
        case 'yearly':
          groupBy = 'EXTRACT(YEAR FROM fecha_emision)';
          dateFormat = 'YYYY';
          break;
      }

      const query = `
        SELECT
          ${groupBy} as periodo,
          COUNT(*) as total_ventas,
          SUM(total_operacion) as total_monto,
          AVG(total_operacion) as promedio,
          SUM(total_costo) as total_costo,
          SUM(total_operacion) - SUM(total_costo) as utilidad
        FROM ventas
        WHERE anulada = 'N'
        AND fecha_emision BETWEEN ? AND ?
        GROUP BY ${groupBy}
        ORDER BY periodo
      `;

      const result = await firebirdPool.executeQuery(query, [dateFrom, dateTo]);
      return result || [];
    } catch (error) {
      logger.error('Error getting sales by period:', error);
      throw error;
    }
  }

  /**
   * Productos más vendidos
   */
  async getTopSoldProducts(limit = 20, dateFrom, dateTo) {
    try {
      const query = `
        SELECT FIRST ?
          vd.producto_codigo,
          p.nombre as producto_nombre,
          p.categoria,
          SUM(vd.cantidad) as cantidad_vendida,
          SUM(vd.total) as monto_total,
          SUM(vd.total - vd.costo_total) as utilidad,
          COUNT(DISTINCT vd.correlativo) as veces_vendido
        FROM ventas_desglose vd
        JOIN productos p ON vd.producto_codigo = p.codigo
        JOIN ventas v ON vd.correlativo = v.correlativo
        WHERE v.anulada = 'N'
        AND v.fecha_emision BETWEEN ? AND ?
        GROUP BY vd.producto_codigo, p.nombre, p.categoria
        ORDER BY cantidad_vendida DESC
      `;

      const result = await firebirdPool.executeQuery(query, [
        limit,
        dateFrom || new Date().toISOString().split('T')[0],
        dateTo || new Date().toISOString().split('T')[0],
      ]);

      return result || [];
    } catch (error) {
      logger.error('Error getting top sold products:', error);
      throw error;
    }
  }

  /**
   * Clientes más activos
   */
  async getTopCustomers(limit = 20, dateFrom, dateTo) {
    try {
      const query = `
        SELECT FIRST ?
          c.codigo,
          c.nombre,
          c.rif,
          COUNT(v.correlativo) as total_compras,
          SUM(v.total_operacion) as monto_total,
          AVG(v.total_operacion) as promedio_compra,
          MAX(v.fecha_emision) as ultima_compra
        FROM clientes c
        JOIN ventas v ON c.codigo = v.cliente_codigo
        WHERE v.anulada = 'N'
        AND v.fecha_emision BETWEEN ? AND ?
        GROUP BY c.codigo, c.nombre, c.rif
        ORDER BY monto_total DESC
      `;

      const result = await firebirdPool.executeQuery(query, [
        limit,
        dateFrom || new Date().toISOString().split('T')[0],
        dateTo || new Date().toISOString().split('T')[0],
      ]);

      return result || [];
    } catch (error) {
      logger.error('Error getting top customers:', error);
      throw error;
    }
  }

  /**
   * Inventario valorizado
   */
  async getInventoryValuation(warehouseId) {
    try {
      let whereClause = '';
      const params = [];

      if (warehouseId) {
        whereClause = 'WHERE i.deposito_codigo = ?';
        params.push(warehouseId);
      }

      const query = `
        SELECT
          p.codigo,
          p.nombre,
          p.categoria,
          p.unidad_medida,
          p.costo_actual,
          p.precio_venta,
          COALESCE(i.cantidad, 0) as cantidad,
          COALESCE(i.cantidad, 0) * p.costo_actual as valor_costo,
          COALESCE(i.cantidad, 0) * p.precio_venta as valor_venta,
          (COALESCE(i.cantidad, 0) * p.precio_venta) - (COALESCE(i.cantidad, 0) * p.costo_actual) as utilidad_potencial
        FROM productos p
        LEFT JOIN inventario i ON p.codigo = i.producto_codigo
        ${whereClause}
        ORDER BY valor_costo DESC
      `;

      const result = await firebirdPool.executeQuery(query, params);

      const totals = result.reduce(
        (acc, row) => ({
          totalProductos: acc.totalProductos + 1,
          totalUnidades: acc.totalUnidades + (row.CANTIDAD || 0),
          totalValorCosto: acc.totalValorCosto + (row.VALOR_COSTO || 0),
          totalValorVenta: acc.totalValorVenta + (row.VALOR_VENTA || 0),
          totalUtilidadPotencial: acc.totalUtilidadPotencial + (row.UTILIDAD_POTENCIAL || 0),
        }),
        {
          totalProductos: 0,
          totalUnidades: 0,
          totalValorCosto: 0,
          totalValorVenta: 0,
          totalUtilidadPotencial: 0,
        }
      );

      return {
        products: result || [],
        totals,
      };
    } catch (error) {
      logger.error('Error getting inventory valuation:', error);
      throw error;
    }
  }

  /**
   * Rotación de inventario
   */
  async getInventoryTurnover(dateFrom, dateTo, warehouseId) {
    try {
      let whereClause = '';
      const params = [dateFrom, dateTo];

      if (warehouseId) {
        whereClause = 'AND i.deposito_codigo = ?';
        params.push(warehouseId);
      }

      const query = `
        SELECT
          p.codigo,
          p.nombre,
          COALESCE(i.cantidad, 0) as stock_actual,
          COALESCE(v.cantidad_vendida, 0) as cantidad_vendida,
          CASE
            WHEN COALESCE(i.cantidad, 0) > 0 THEN
              COALESCE(v.cantidad_vendida, 0) / COALESCE(i.cantidad, 0)
            ELSE 0
          END as rotacion,
          CASE
            WHEN COALESCE(v.cantidad_vendida, 0) > 0 THEN
              (? - ? + 1) / (COALESCE(v.cantidad_vendida, 0) / COALESCE(i.cantidad, 0))
            ELSE 999
          END as dias_rotacion
        FROM productos p
        LEFT JOIN inventario i ON p.codigo = i.producto_codigo
        LEFT JOIN (
          SELECT vd.producto_codigo, SUM(vd.cantidad) as cantidad_vendida
          FROM ventas_desglose vd
          JOIN ventas v ON vd.correlativo = v.correlativo
          WHERE v.anulada = 'N'
          AND v.fecha_emision BETWEEN ? AND ?
          ${warehouseId ? 'AND v.deposito_codigo = ?' : ''}
          GROUP BY vd.producto_codigo
        ) v ON p.codigo = v.producto_codigo
        WHERE p.activo = 'S'
        ${whereClause}
        ORDER BY rotacion DESC
      `;

      const result = await firebirdPool.executeQuery(query, params);
      return result || [];
    } catch (error) {
      logger.error('Error getting inventory turnover:', error);
      throw error;
    }
  }

  /**
   * Estado de resultados (P&L)
   */
  async getIncomeStatement(dateFrom, dateTo) {
    try {
      // Ingresos por ventas
      const salesResult = await firebirdPool.executeQuery(
        `SELECT
          SUM(total_operacion) as ingresos,
          SUM(total_costo) as costo_ventas,
          SUM(total_impuesto) as impuestos
         FROM ventas
         WHERE anulada = 'N'
         AND fecha_emision BETWEEN ? AND ?`,
        [dateFrom, dateTo]
      );

      // Gastos operativos (simplificado)
      const expensesResult = await firebirdPool.executeQuery(
        `SELECT
          SUM(monto) as gastos
         FROM caja
         WHERE tipo_movimiento = 'E'
         AND fecha BETWEEN ? AND ?`,
        [dateFrom, dateTo]
      );

      const ingresos = salesResult[0]?.INGRESOS || 0;
      const costoVentas = salesResult[0]?.COSTO_VENTAS || 0;
      const gastos = expensesResult[0]?.GASTOS || 0;

      const utilidadBruta = ingresos - costoVentas;
      const utilidadOperativa = utilidadBruta - gastos;
      const impuestos = salesResult[0]?.IMPUESTOS || 0;
      const utilidadNeta = utilidadOperativa - impuestos;

      return {
        periodo: { dateFrom, dateTo },
        ingresos: {
          ventas: ingresos,
          costoVentas,
          utilidadBruta,
          margenBruto: ingresos > 0 ? (utilidadBruta / ingresos) * 100 : 0,
        },
        gastos: {
          operativos: gastos,
        },
        resultados: {
          utilidadOperativa,
          impuestos,
          utilidadNeta,
          margenNeto: ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0,
        },
      };
    } catch (error) {
      logger.error('Error getting income statement:', error);
      throw error;
    }
  }

  /**
   * Flujo de caja
   */
  async getCashFlow(dateFrom, dateTo) {
    try {
      const query = `
        SELECT
          tipo_movimiento,
          COUNT(*) as cantidad,
          SUM(debe) as total_entradas,
          SUM(haber) as total_salidas,
          SUM(debe) - SUM(haber) as neto
        FROM caja
        WHERE fecha BETWEEN ? AND ?
        GROUP BY tipo_movimiento
        ORDER BY tipo_movimiento
      `;

      const result = await firebirdPool.executeQuery(query, [dateFrom, dateTo]);

      const entradas = result.find(r => r.TIPO_MOVIMIENTO === 'I') || { TOTAL_ENTRADAS: 0 };
      const salidas = result.find(r => r.TIPO_MOVIMIENTO === 'E') || { TOTAL_SALIDAS: 0 };

      return {
        periodo: { dateFrom, dateTo },
        entradas: entradas.TOTAL_ENTRADAS || 0,
        salidas: salidas.TOTAL_SALIDAS || 0,
        neto: (entradas.TOTAL_ENTRADAS || 0) - (salidas.TOTAL_SALIDAS || 0),
        detalle: result || [],
      };
    } catch (error) {
      logger.error('Error getting cash flow:', error);
      throw error;
    }
  }

  /**
   * Reporte de auditoría
   */
  async getAuditLog(options = {}) {
    try {
      const { table, recordId, userId, dateFrom, dateTo, limit = 100 } = options;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (table) {
        whereClause += ' AND tabla_afectada = ?';
        params.push(table);
      }

      if (recordId) {
        whereClause += ' AND registro_afectado = ?';
        params.push(recordId);
      }

      if (userId) {
        whereClause += ' AND usuario_codigo = ?';
        params.push(userId);
      }

      if (dateFrom) {
        whereClause += ' AND fecha_hora >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND fecha_hora <= ?';
        params.push(dateTo);
      }

      const query = `
        SELECT a.*, u.nombre as usuario_nombre
        FROM auditoria a
        LEFT JOIN usuarios u ON a.usuario_codigo = u.codigo
        ${whereClause}
        ORDER BY a.fecha_hora DESC
        ROWS ?
      `;

      const result = await firebirdPool.executeQuery(query, [...params, limit]);
      return result || [];
    } catch (error) {
      logger.error('Error getting audit log:', error);
      throw error;
    }
  }

  /**
   * Exportar datos a formato JSON
   */
  async exportToJson(query, params = []) {
    try {
      const result = await firebirdPool.executeQuery(query, params);
      return {
        success: true,
        data: result || [],
        total: result?.length || 0,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error exporting to JSON:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
export default reportService;
