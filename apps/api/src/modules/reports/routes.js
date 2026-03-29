/**
 * Violet ERP - Rutas de Reportes (Placeholder)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/sales', authorize('reports:read'), (req, res) => {
  res.json({ success: true, data: { report: {} } });
});
router.get('/inventory', authorize('reports:read'), (req, res) => {
  res.json({ success: true, data: { report: {} } });
});
router.get('/financial', authorize('reports:read'), (req, res) => {
  res.json({ success: true, data: { report: {} } });
});

export { router as reportRoutes };
