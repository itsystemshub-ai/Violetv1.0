/**
 * Violet ERP - Rutas de Finanzas (Placeholder)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/accounts', authorize('finance:read'), (req, res) => {
  res.json({ success: true, data: { accounts: [] } });
});
router.get('/payments', authorize('finance:read'), (req, res) => {
  res.json({ success: true, data: { payments: [] } });
});

export { router as financeRoutes };
