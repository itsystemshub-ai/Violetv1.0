/**
 * Invoices Routes
 */

import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { db } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

export const invoicesRouter = Router();

invoicesRouter.use(authenticate);

// Get all invoices
invoicesRouter.get('/', authorize('sales:read'), (req: AuthRequest, res) => {
  const tenantId = req.query.tenantId || req.user!.tenantId;
  
  const invoices = db.prepare(`
    SELECT * FROM invoices WHERE tenant_id = ?
    ORDER BY created_at DESC
  `).all(tenantId);

  res.json(invoices);
});

// Create invoice
invoicesRouter.post('/', authorize('sales:create'), (req: AuthRequest, res) => {
  const id = uuidv4();
  const tenantId = req.body.tenantId || req.user!.tenantId;

  db.prepare(`
    INSERT INTO invoices (
      id, tenant_id, invoice_number, type, customer_name, customer_rif,
      customer_email, customer_phone, items, subtotal, tax, discount,
      total, status, payment_method, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, tenantId, req.body.invoiceNumber, req.body.type, req.body.customerName,
    req.body.customerRif, req.body.customerEmail, req.body.customerPhone,
    JSON.stringify(req.body.items), req.body.subtotal, req.body.tax,
    req.body.discount || 0, req.body.total, req.body.status || 'pending',
    req.body.paymentMethod, req.body.notes, req.user!.id
  );

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  res.status(201).json(invoice);
});

// Update invoice
invoicesRouter.put('/:id', authorize('sales:update'), (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  db.prepare(`
    UPDATE invoices SET
      status = ?, payment_method = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.body.status, req.body.paymentMethod, req.body.notes, id);

  const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  res.json(updated);
});

// Delete invoice
invoicesRouter.delete('/:id', authorize('sales:delete'), (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  res.json({ message: 'Invoice deleted successfully' });
});
