/**
 * Schemas de validación para facturas usando Zod
 */

import { z } from 'zod';

/**
 * Schema para item de factura
 */
export const invoiceItemSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  productName: z.string().min(1, 'El nombre del producto es requerido'),
  quantity: z.number()
    .positive('La cantidad debe ser mayor a 0')
    .int('La cantidad debe ser un número entero'),
  price: z.number().positive('El precio debe ser mayor a 0'),
  discount: z.number()
    .nonnegative('El descuento no puede ser negativo')
    .max(100, 'El descuento no puede ser mayor a 100%')
    .default(0),
  tax: z.number()
    .nonnegative('El impuesto no puede ser negativo')
    .max(100, 'El impuesto no puede ser mayor a 100%')
    .default(16),
  subtotal: z.number().nonnegative(),
});

/**
 * Schema para crear una factura
 */
export const createInvoiceSchema = z.object({
  type: z.enum(['venta', 'compra'], {
    errorMap: () => ({ message: 'El tipo debe ser "venta" o "compra"' }),
  }),
  
  clientId: z.string().uuid('ID de cliente inválido').optional(),
  clientName: z.string()
    .min(1, 'El nombre del cliente es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  clientRIF: z.string()
    .regex(/^[JGVEPCD]-\d{8}-\d$/, 'RIF inválido (formato: J-12345678-9)')
    .optional(),
  clientAddress: z.string().max(500).optional(),
  clientPhone: z.string().max(20).optional(),
  
  date: z.string().datetime('Fecha inválida'),
  dueDate: z.string().datetime('Fecha de vencimiento inválida').optional(),
  
  items: z.array(invoiceItemSchema)
    .min(1, 'La factura debe tener al menos un item')
    .max(100, 'Máximo 100 items por factura'),
  
  subtotal: z.number().nonnegative('El subtotal no puede ser negativo'),
  tax: z.number().nonnegative('El impuesto no puede ser negativo'),
  discount: z.number().nonnegative('El descuento no puede ser negativo').default(0),
  total: z.number().positive('El total debe ser mayor a 0'),
  
  currency: z.enum(['USD', 'VES', 'EUR']).default('USD'),
  exchangeRate: z.number().positive().default(1),
  
  paymentMethod: z.enum([
    'efectivo',
    'transferencia',
    'tarjeta_debito',
    'tarjeta_credito',
    'cheque',
    'pago_movil',
    'zelle',
    'paypal',
    'credito',
  ]).optional(),
  
  status: z.enum(['pending', 'paid', 'cancelled', 'overdue']).default('pending'),
  
  notes: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional(),
  
  warehouseId: z.string().uuid().optional(),
}).refine((data) => {
  // Validar que el total sea correcto
  const calculatedTotal = data.subtotal + data.tax - data.discount;
  return Math.abs(calculatedTotal - data.total) < 0.01; // Tolerancia de 1 centavo
}, {
  message: 'El total no coincide con subtotal + impuesto - descuento',
  path: ['total'],
}).refine((data) => {
  // Validar que la fecha de vencimiento sea posterior a la fecha de emisión
  if (data.dueDate) {
    return new Date(data.dueDate) >= new Date(data.date);
  }
  return true;
}, {
  message: 'La fecha de vencimiento debe ser posterior a la fecha de emisión',
  path: ['dueDate'],
});

/**
 * Schema para actualizar una factura
 */
export const updateInvoiceSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled', 'overdue']).optional(),
  paymentMethod: z.enum([
    'efectivo',
    'transferencia',
    'tarjeta_debito',
    'tarjeta_credito',
    'cheque',
    'pago_movil',
    'zelle',
    'paypal',
    'credito',
  ]).optional(),
  notes: z.string().max(1000).optional(),
  dueDate: z.string().datetime().optional(),
});

/**
 * Schema para búsqueda de facturas
 */
export const searchInvoiceSchema = z.object({
  type: z.enum(['venta', 'compra']).optional(),
  status: z.enum(['pending', 'paid', 'cancelled', 'overdue']).optional(),
  clientName: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
  limit: z.number().int().positive().max(1000).default(50),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * Schema para anular una factura
 */
export const cancelInvoiceSchema = z.object({
  invoiceId: z.string().uuid('ID de factura inválido'),
  reason: z.string()
    .min(10, 'La razón debe tener al menos 10 caracteres')
    .max(500, 'La razón no puede exceder 500 caracteres'),
});

/**
 * Tipos TypeScript inferidos
 */
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type SearchInvoiceInput = z.infer<typeof searchInvoiceSchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;

/**
 * Funciones helper de validación
 */
export const validateInvoice = (data: unknown) => {
  return createInvoiceSchema.safeParse(data);
};

export const validateInvoiceUpdate = (data: unknown) => {
  return updateInvoiceSchema.safeParse(data);
};

export const validateInvoiceItem = (data: unknown) => {
  return invoiceItemSchema.safeParse(data);
};
