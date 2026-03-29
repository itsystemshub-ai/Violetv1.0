/**
 * Violet ERP - Rutas de Productos (Placeholder)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('products:read'), (req, res) => {
  res.json({ success: true, data: { products: [], pagination: {} } });
});
router.get('/:id', authorize('products:read'), (req, res) => {
  res.json({ success: true, data: { product: {} } });
});
router.post('/', authorize('products:create'), (req, res) => {
  res.status(201).json({ success: true, data: { product: {} } });
});
router.put('/:id', authorize('products:update'), (req, res) => {
  res.json({ success: true, data: { product: {} } });
});
router.delete('/:id', authorize('products:delete'), (req, res) => {
  res.json({ success: true, data: { message: 'Product deleted' } });
});

export { router as productRoutes };
