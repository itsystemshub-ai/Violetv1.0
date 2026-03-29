/**
 * Violet ERP - FinanceService
 * Gestión financiera: Cuentas por cobrar, pagar, bancos
 */

import { v4 as uuidv4 } from 'uuid';
import { firebirdPool } from '../database/firebird-pool.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('FinanceService');

export class FinanceService {
  /**
   * Cuentas por Cobrar (CXC)
   */

  async getCXC({ customerId = '', status = '', limit = 50 }) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (customerId) {
        whereClause += ' AND c.cliente_codigo = ?';
        params.push(customerId);
      }

      if (status === 'pending') {
        whereClause += ' AND c.saldo_actual > 0';
      } else if (status === 'paid') {
        whereClause += ' AND c.saldo_actual = 0';
      }

      const query = `
        SELECT c.*, cl.nombre as cliente_nombre
        FROM cxc c
        LEFT JOIN clientes cl ON c.cliente_codigo = cl.codigo
        ${whereClause}
        ORDER BY c.fecha_vencimiento ASC
        ROWS ?
      `;

      const records = await firebirdPool.executeQuery(query, [...params, limit]);
      return records || [];
    } catch (error) {
      logger.error('Error getting CXC:', error);
      throw error;
    }
  }

  async registerPaymentCXC(customerId, amount, paymentMethod, options = {}) {
    const transaction = [];
    const id = uuidv4();

    try {
      // Insertar pago
      transaction.push({
        sql: `INSERT INTO cxc_pagos (
          id, cliente_codigo, monto, metodo_pago, documento_referencia,
          fecha_pago, usuario_codigo, creado_en
        ) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, ?, CURRENT_TIMESTAMP)`,
        params: [
          id,
          customerId,
          amount,
          paymentMethod,
          options.documentoReferencia,
          options.usuarioCodigo,
        ],
      });

      // Actualizar saldos de facturas pendientes
      let remainingAmount = amount;
      
      const pendingInvoices = await firebirdPool.executeQuery(
        `SELECT FIRST 100 correlativo, saldo_actual
         FROM cxc
         WHERE cliente_codigo = ? AND saldo_actual > 0
         ORDER BY fecha_vencimiento ASC`,
        [customerId]
      );

      for (const invoice of pendingInvoices) {
        if (remainingAmount <= 0) break;

        const applyAmount = Math.min(remainingAmount, invoice.SALDO_ACTUAL);
        
        transaction.push({
          sql: `UPDATE cxc SET 
            saldo_actual = saldo_actual - ?,
            ultimo_pago = CURRENT_DATE
          WHERE correlativo = ?`,
          params: [applyAmount, invoice.CORRELATIVO],
        });

        remainingAmount -= applyAmount;
      }

      // Registrar en caja
      transaction.push({
        sql: `INSERT INTO caja (
          id, tipo_movimiento, concepto, fecha, hora,
          moneda_codigo, debe, haber, saldo, usuario_codigo,
          documento_referencia, creado_en
        ) VALUES (?, 'I', ?, CURRENT_DATE, CURRENT_TIME, ?, ?, 0, 0, ?, ?, CURRENT_TIMESTAMP)`,
        params: [
          uuidv4(),
          options.concepto || `Pago recibido - ${paymentMethod}`,
          options.monedaCodigo || 'DOP',
          amount,
          options.usuarioCodigo,
          id,
        ],
      });

      await firebirdPool.executeTransaction(transaction);

      logger.info(`CXC payment registered: ${id}`);

      return {
        id,
        customerId,
        amount,
        applied: amount - remainingAmount,
        remaining: remainingAmount,
      };
    } catch (error) {
      logger.error('Error registering CXC payment:', error);
      throw error;
    }
  }

  /**
   * Cuentas por Pagar (CXP)
   */

  async getCXP({ supplierId = '', status = '', limit = 50 }) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (supplierId) {
        whereClause += ' AND c.proveedor_codigo = ?';
        params.push(supplierId);
      }

      if (status === 'pending') {
        whereClause += ' AND c.saldo_actual > 0';
      } else if (status === 'paid') {
        whereClause += ' AND c.saldo_actual = 0';
      }

      const query = `
        SELECT c.*, p.nombre as proveedor_nombre
        FROM cxp c
        LEFT JOIN proveedores p ON c.proveedor_codigo = p.codigo
        ${whereClause}
        ORDER BY c.fecha_vencimiento ASC
        ROWS ?
      `;

      const records = await firebirdPool.executeQuery(query, [...params, limit]);
      return records || [];
    } catch (error) {
      logger.error('Error getting CXP:', error);
      throw error;
    }
  }

  async registerPaymentCXP(supplierId, amount, paymentMethod, options = {}) {
    const transaction = [];
    const id = uuidv4();

    try {
      // Insertar pago
      transaction.push({
        sql: `INSERT INTO cxp_pagos (
          id, proveedor_codigo, monto, metodo_pago, documento_referencia,
          fecha_pago, usuario_codigo, creado_en
        ) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, ?, CURRENT_TIMESTAMP)`,
        params: [
          id,
          supplierId,
          amount,
          paymentMethod,
          options.documentoReferencia,
          options.usuarioCodigo,
        ],
      });

      // Actualizar saldos
      let remainingAmount = amount;
      
      const pendingInvoices = await firebirdPool.executeQuery(
        `SELECT FIRST 100 correlativo, saldo_actual
         FROM cxp
         WHERE proveedor_codigo = ? AND saldo_actual > 0
         ORDER BY fecha_vencimiento ASC`,
        [supplierId]
      );

      for (const invoice of pendingInvoices) {
        if (remainingAmount <= 0) break;

        const applyAmount = Math.min(remainingAmount, invoice.SALDO_ACTUAL);
        
        transaction.push({
          sql: `UPDATE cxp SET 
            saldo_actual = saldo_actual - ?,
            ultimo_pago = CURRENT_DATE
          WHERE correlativo = ?`,
          params: [applyAmount, invoice.CORRELATIVO],
        });

        remainingAmount -= applyAmount;
      }

      // Registrar en caja
      transaction.push({
        sql: `INSERT INTO caja (
          id, tipo_movimiento, concepto, fecha, hora,
          moneda_codigo, debe, haber, saldo, usuario_codigo,
          documento_referencia, creado_en
        ) VALUES (?, 'E', ?, CURRENT_DATE, CURRENT_TIME, ?, 0, ?, 0, ?, ?, CURRENT_TIMESTAMP)`,
        params: [
          uuidv4(),
          options.concepto || `Pago realizado - ${paymentMethod}`,
          options.monedaCodigo || 'DOP',
          amount,
          options.usuarioCodigo,
          id,
        ],
      });

      await firebirdPool.executeTransaction(transaction);

      logger.info(`CXP payment registered: ${id}`);

      return {
        id,
        supplierId,
        amount,
        applied: amount - remainingAmount,
        remaining: remainingAmount,
      };
    } catch (error) {
      logger.error('Error registering CXP payment:', error);
      throw error;
    }
  }

  /**
   * Bancos
   */

  async getBanks() {
    try {
      const banks = await firebirdPool.executeQuery(
        `SELECT b.*, m.nombre as moneda_nombre
         FROM bancos b
         LEFT JOIN moneda m ON b.moneda_codigo = m.codigo
         WHERE b.activo = 'S'
         ORDER BY b.nombre`
      );
      return banks || [];
    } catch (error) {
      logger.error('Error getting banks:', error);
      throw error;
    }
  }

  async getBankTransactions(bankId, { dateFrom = '', dateTo = '', limit = 100 }) {
    try {
      let whereClause = 'WHERE m.banco_codigo = ?';
      const params = [bankId];

      if (dateFrom) {
        whereClause += ' AND m.fecha >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND m.fecha <= ?';
        params.push(dateTo);
      }

      const query = `
        SELECT m.*, u.nombre as usuario_nombre
        FROM movimientos_bancarios m
        LEFT JOIN usuarios u ON m.usuario_codigo = u.codigo
        ${whereClause}
        ORDER BY m.fecha DESC, m.correlativo DESC
        ROWS ?
      `;

      const transactions = await firebirdPool.executeQuery(query, [...params, limit]);
      return transactions || [];
    } catch (error) {
      logger.error('Error getting bank transactions:', error);
      throw error;
    }
  }

  async registerBankTransaction(bankId, data, userId) {
    const transaction = [];
    const id = uuidv4();

    try {
      // Insertar movimiento
      transaction.push({
        sql: `INSERT INTO movimientos_bancarios (
          id, banco_codigo, tipo_movimiento, concepto, fecha,
          numero_cheque, moneda_codigo, factor_cambio,
          debe, haber, saldo, usuario_codigo,
          documento_referencia, creado_en
        ) VALUES (?, ?, ?, ?, CURRENT_DATE, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        params: [
          id,
          bankId,
          data.tipoMovimiento, // 'D' = Débito, 'C' = Crédito
          data.concepto,
          data.numeroCheque,
          data.monedaCodigo || 'DOP',
          data.factorCambio || 1,
          data.debe || 0,
          data.haber || 0,
          0, // Saldo se calcula después
          userId,
          data.documentoReferencia,
        ],
      });

      // Actualizar saldo del banco
      const balanceQuery = data.tipoMovimiento === 'D' 
        ? `UPDATE bancos SET saldo_actual = saldo_actual - ? WHERE codigo = ?`
        : `UPDATE bancos SET saldo_actual = saldo_actual + ? WHERE codigo = ?`;

      transaction.push({
        sql: balanceQuery,
        params: [data.debe || data.haber || 0, bankId],
      });

      await firebirdPool.executeTransaction(transaction);

      logger.info(`Bank transaction registered: ${id}`);

      return { id, bankId, ...data };
    } catch (error) {
      logger.error('Error registering bank transaction:', error);
      throw error;
    }
  }

  /**
   * Reportes Financieros
   */

  async getFinancialSummary() {
    try {
      const [cxcTotal, cxpTotal, banks] = await Promise.all([
        firebirdPool.executeQuery(`SELECT SUM(saldo_actual) as total FROM cxc WHERE saldo_actual > 0`),
        firebirdPool.executeQuery(`SELECT SUM(saldo_actual) as total FROM cxp WHERE saldo_actual > 0`),
        firebirdPool.executeQuery(`SELECT SUM(saldo_actual) as total FROM bancos WHERE activo = 'S'`),
      ]);

      return {
        cxc: cxcTotal[0]?.TOTAL || 0,
        cxp: cxpTotal[0]?.TOTAL || 0,
        bancos: banks[0]?.TOTAL || 0,
        capitalTrabajo: (banks[0]?.TOTAL || 0) + (cxcTotal[0]?.TOTAL || 0) - (cxpTotal[0]?.TOTAL || 0),
      };
    } catch (error) {
      logger.error('Error getting financial summary:', error);
      throw error;
    }
  }

  async getAgingReport(type = 'cxc', customerId = '') {
    try {
      const table = type === 'cxc' ? 'cxc' : 'cxp';
      const codeField = type === 'cxc' ? 'cliente_codigo' : 'proveedor_codigo';
      
      let whereClause = `WHERE saldo_actual > 0`;
      const params = [];

      if (customerId) {
        whereClause += ` AND ${codeField} = ?`;
        params.push(customerId);
      }

      const query = `
        SELECT 
          ${codeField} as codigo,
          COUNT(*) as cantidad_documentos,
          SUM(saldo_actual) as saldo_total,
          SUM(CASE WHEN fecha_vencimiento < CURRENT_DATE THEN saldo_actual ELSE 0 END) as vencido,
          SUM(CASE WHEN fecha_vencimiento >= CURRENT_DATE THEN saldo_actual ELSE 0 END) as por_vencer
        FROM ${table}
        ${whereClause}
        GROUP BY ${codeField}
        ORDER BY saldo_total DESC
      `;

      const result = await firebirdPool.executeQuery(query, params);
      return result || [];
    } catch (error) {
      logger.error('Error getting aging report:', error);
      throw error;
    }
  }
}

export const financeService = new FinanceService();
export default financeService;
