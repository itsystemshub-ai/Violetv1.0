/**
 * Violet ERP - Rutas de Proveedores (Placeholder)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('suppliers:read'), (req, res) => {
  res.json({ success: true, data: { suppliers: [], pagination: {} } });
});
router.post('/', authorize('suppliers:create'), (req, res) => {
  res.status(201).json({ success: true, data: { supplier: {} } });
});

export { router as supplierRoutes };
