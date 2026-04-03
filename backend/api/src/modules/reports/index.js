/**
 * Violet ERP - Rutas de Reportes
 * Endpoints para generación de reportes avanzados
 */

import { Router } from 'express';
import { reportService } from '../../services/report.service.js';
import { auditService } from '../../services/audit.service.js';
import { securityService } from '../../services/security.service.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

/**
 * GET /api/reports/dashboard
 * Obtener métricas del dashboard
 */
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const { dateFrom, dateTo, warehouseId } = req.query;

    const metrics = await reportService.getDashboardMetrics({
      dateFrom,
      dateTo,
      warehouseId,
    });

    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/sales-by-period
 * Ventas por período
 */
router.get('/sales-by-period', requireAuth, async (req, res) => {
  try {
    const { period = 'daily', dateFrom, dateTo } = req.query;

    const result = await reportService.getSalesByPeriod(period, dateFrom, dateTo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/top-products
 * Productos más vendidos
 */
router.get('/top-products', requireAuth, async (req, res) => {
  try {
    const { limit = 20, dateFrom, dateTo } = req.query;

    const result = await reportService.getTopSoldProducts(parseInt(limit), dateFrom, dateTo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/top-customers
 * Clientes más activos
 */
router.get('/top-customers', requireAuth, async (req, res) => {
  try {
    const { limit = 20, dateFrom, dateTo } = req.query;

    const result = await reportService.getTopCustomers(parseInt(limit), dateFrom, dateTo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/inventory-valuation
 * Inventario valorizado
 */
router.get('/inventory-valuation', requireAuth, async (req, res) => {
  try {
    const { warehouseId } = req.query;

    const result = await reportService.getInventoryValuation(warehouseId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/inventory-turnover
 * Rotación de inventario
 */
router.get('/inventory-turnover', requireAuth, async (req, res) => {
  try {
    const { dateFrom, dateTo, warehouseId } = req.query;

    const result = await reportService.getInventoryTurnover(dateFrom, dateTo, warehouseId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/income-statement
 * Estado de resultados (P&L)
 */
router.get('/income-statement', requireAuth, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const result = await reportService.getIncomeStatement(dateFrom, dateTo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/cash-flow
 * Flujo de caja
 */
router.get('/cash-flow', requireAuth, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const result = await reportService.getCashFlow(dateFrom, dateTo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/audit-logs
 * Logs de auditoría
 */
router.get('/audit-logs', requireAuth, async (req, res) => {
  try {
    const options = {
      table: req.query.table,
      recordId: req.query.recordId,
      userId: req.query.userId,
      action: req.query.action,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      module: req.query.module,
      severity: req.query.severity,
      limit: parseInt(req.query.limit) || 100,
    };

    const result = await auditService.getAuditLogs(options);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/record-history/:table/:recordId
 * Historial de cambios de un registro
 */
router.get('/record-history/:table/:recordId', requireAuth, async (req, res) => {
  try {
    const { table, recordId } = req.params;
    const { limit = 50 } = req.query;

    const result = await auditService.getRecordHistory(table, recordId, parseInt(limit));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/audit-stats
 * Estadísticas de auditoría
 */
router.get('/audit-stats', requireAuth, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const result = await auditService.getAuditStats(dateFrom, dateTo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/security-stats
 * Estadísticas de seguridad
 */
router.get('/security-stats', requireAuth, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const result = await securityService.getSecurityStats(dateFrom, dateTo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reports/export
 * Exportar reporte a JSON/CSV
 */
router.post('/export', requireAuth, async (req, res) => {
  try {
    const { query, params = [], format = 'json' } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query requerida' });
    }

    const result = await reportService.exportToJson(query, params);

    if (format === 'csv' && Array.isArray(result.data)) {
      const headers = Object.keys(result.data[0] || {}).join(',');
      const rows = result.data.map(row => Object.values(row).join(','));
      result.csv = [headers, ...rows].join('\n');
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/suspicious-activity
 * Detectar actividades sospechosas
 */
router.get('/suspicious-activity', requireAuth, async (req, res) => {
  try {
    const options = {
      maxFailedLogins: parseInt(req.query.maxFailedLogins) || 5,
      timeWindowMinutes: parseInt(req.query.timeWindowMinutes) || 30,
      maxDeletesPerHour: parseInt(req.query.maxDeletesPerHour) || 50,
    };

    const result = await auditService.detectSuspiciousActivity(options);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
