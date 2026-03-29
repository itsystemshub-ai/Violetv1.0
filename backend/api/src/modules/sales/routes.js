/**
 * Violet ERP - Rutas de Ventas (Placeholder)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('sales:read'), (req, res) => {
  res.json({ success: true, data: { sales: [], pagination: {} } });
});
router.get('/:id', authorize('sales:read'), (req, res) => {
  res.json({ success: true, data: { sale: {} } });
});
router.post('/', authorize('sales:create'), (req, res) => {
  res.status(201).json({ success: true, data: { sale: {} } });
});

export { router as saleRoutes };
