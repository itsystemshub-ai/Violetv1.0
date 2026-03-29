/**
 * Violet ERP - Rutas de Clientes (Placeholder)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('customers:read'), (req, res) => {
  res.json({ success: true, data: { customers: [], pagination: {} } });
});
router.post('/', authorize('customers:create'), (req, res) => {
  res.status(201).json({ success: true, data: { customer: {} } });
});

export { router as customerRoutes };
