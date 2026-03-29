/**
 * Products Routes - Simplified
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

export const productsRouter = Router();

productsRouter.use(authenticate);

// Demo products
const demoProducts = [
  { id: '1', codigo: 'PROD-001', nombre: 'Producto 1', precioVenta: 100, existencia: 50 },
  { id: '2', codigo: 'PROD-002', nombre: 'Producto 2', precioVenta: 200, existencia: 30 },
  { id: '3', codigo: 'PROD-003', nombre: 'Producto 3', precioVenta: 150, existencia: 75 },
];

// Get all products
productsRouter.get('/', authorize('products:read'), (req, res) => {
  res.json({
    success: true,
    data: {
      products: demoProducts,
      pagination: {
        total: demoProducts.length,
        page: 1,
        limit: 10,
      },
    },
  });
});

// Get product by ID
productsRouter.get('/:id', authorize('products:read'), (req, res) => {
  const product = demoProducts.find((p) => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Product not found',
      },
    });
  }

  res.json({
    success: true,
    data: { product },
  });
});

// Create product
productsRouter.post('/', authorize('products:create'), (req, res) => {
  const newProduct = {
    id: String(demoProducts.length + 1),
    ...req.body,
  };
  
  res.status(201).json({
    success: true,
    data: { product: newProduct },
    message: 'Product created successfully',
  });
});

// Update product
productsRouter.put('/:id', authorize('products:update'), (req, res) => {
  res.json({
    success: true,
    data: {
      product: {
        id: req.params.id,
        ...req.body,
      },
    },
    message: 'Product updated successfully',
  });
});

// Delete product
productsRouter.delete('/:id', authorize('products:delete'), (req, res) => {
  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

export default productsRouter;
