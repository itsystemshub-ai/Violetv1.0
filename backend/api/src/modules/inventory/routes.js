/**
 * Violet ERP - Rutas de Inventario (Placeholder)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/stock', authorize('inventory:read'), (req, res) => {
  res.json({ success: true, data: { stock: [] } });
});
router.post('/movements', authorize('inventory:create'), (req, res) => {
  res.status(201).json({ success: true, data: { movement: {} } });
});

export { router as inventoryRoutes };
