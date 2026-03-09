/**
 * Tenants Routes
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { db } from '../database/init.js';

export const tenantsRouter = Router();

tenantsRouter.use(authenticate);

// Get all tenants
tenantsRouter.get('/', authorize('tenants:read'), (req, res) => {
  const tenants = db.prepare(`
    SELECT * FROM tenants WHERE is_active = 1
  `).all();

  res.json(tenants);
});
