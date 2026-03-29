/**
 * Products Routes
 */

import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { db } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

export const productsRouter = Router();

productsRouter.use(authenticate);

// Get all products
productsRouter.get('/', authorize('inventory:read'), (req: AuthRequest, res) => {
  const tenantId = req.query.tenantId || req.user!.tenantId;
  
  const products = db.prepare(`
    SELECT * FROM products WHERE tenant_id = ? AND is_active = 1
  `).all(tenantId);

  res.json(products);
});

// Create product
productsRouter.post('/', authorize('inventory:create'), (req: AuthRequest, res) => {
  const id = uuidv4();
  const tenantId = req.body.tenantId || req.user!.tenantId;

  db.prepare(`
    INSERT INTO products (
      id, tenant_id, code, name, description, category, price, cost,
      stock, min_stock, unit, barcode, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, tenantId, req.body.code, req.body.name, req.body.description,
    req.body.category, req.body.price, req.body.cost, req.body.stock || 0,
    req.body.minStock || 0, req.body.unit || 'unidad', req.body.barcode,
    req.body.imageUrl
  );

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json(product);
});

// Update product
productsRouter.put('/:id', authorize('inventory:update'), (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.prepare(`
    UPDATE products SET
      code = ?, name = ?, description = ?, category = ?, price = ?,
      cost = ?, stock = ?, min_stock = ?, unit = ?, barcode = ?,
      image_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    req.body.code, req.body.name, req.body.description, req.body.category,
    req.body.price, req.body.cost, req.body.stock, req.body.minStock,
    req.body.unit, req.body.barcode, req.body.imageUrl, id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(updated);
});

// Delete product
productsRouter.delete('/:id', authorize('inventory:delete'), (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
  res.json({ message: 'Product deleted successfully' });
});
