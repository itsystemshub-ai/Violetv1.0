/**
 * Violet ERP - Rutas de Contabilidad (Placeholder)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/journal-entries', authorize('accounting:read'), (req, res) => {
  res.json({ success: true, data: { entries: [] } });
});
router.get('/balance-sheet', authorize('accounting:read'), (req, res) => {
  res.json({ success: true, data: { balanceSheet: {} } });
});

export { router as accountingRoutes };
