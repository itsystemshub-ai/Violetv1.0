/**
 * Violet ERP - Rutas de Compras (Placeholder)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('purchases:read'), (req, res) => {
  res.json({ success: true, data: { purchases: [], pagination: {} } });
});
router.post('/', authorize('purchases:create'), (req, res) => {
  res.status(201).json({ success: true, data: { purchase: {} } });
});

export { router as purchaseRoutes };
