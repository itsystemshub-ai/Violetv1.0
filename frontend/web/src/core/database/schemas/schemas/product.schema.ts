/**
 * Schemas de validación para productos usando Zod
 * Proporciona validación type-safe en runtime
 */

import { z } from 'zod';

/**
 * Schema para crear un producto
 */
export const createProductSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  
  description: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  
  price: z.number()
    .positive('El precio debe ser mayor a 0')
    .max(999999999, 'El precio es demasiado alto'),
  
  cost: z.number()
    .nonnegative('El costo no puede ser negativo')
    .max(999999999, 'El costo es demasiado alto')
    .optional(),
  
  stock: z.number()
    .int('El stock debe ser un número entero')
    .nonnegative('El stock no puede ser negativo')
    .default(0),
  
  minStock: z.number()
    .int('El stock mínimo debe ser un número entero')
    .nonnegative('El stock mínimo no puede ser negativo')
    .default(0),
  
  unit: z.enum(['unidad', 'kg', 'litro', 'metro', 'caja', 'paquete'])
    .default('unidad'),
  
  category: z.string()
    .min(1, 'La categoría es requerida')
    .max(100, 'La categoría no puede exceder 100 caracteres'),
  
  warehouseId: z.string()
    .uuid('ID de almacén inválido')
    .optional(),
  
  images: z.array(z.string().url('URL de imagen inválida'))
    .max(10, 'Máximo 10 imágenes permitidas')
    .optional(),
  
  // Campos específicos de Violet ERP
  cauplas: z.string().max(50).optional(),
  torflex: z.string().max(50).optional(),
  indomax: z.string().max(50).optional(),
  oem: z.string().max(50).optional(),
  aplicacion: z.string().max(200).optional(),
  descripcionManguera: z.string().max(500).optional(),
  aplicacionesDiesel: z.string().max(500).optional(),
  isNuevo: z.boolean().default(false),
  precioFCA: z.number().nonnegative().optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  isCombo: z.boolean().default(false),
  components: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
  })).optional(),
  warehouseStocks: z.record(z.string(), z.number().nonnegative()).optional(),
});

/**
 * Schema para actualizar un producto
 * Todos los campos son opcionales
 */
export const updateProductSchema = createProductSchema.partial();

/**
 * Schema para búsqueda de productos
 */
export const searchProductSchema = z.object({
  query: z.string().min(1, 'La búsqueda no puede estar vacía').max(200),
  category: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  inStock: z.boolean().optional(),
  limit: z.number().int().positive().max(1000).default(50),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * Schema para importación masiva
 */
export const bulkImportProductSchema = z.array(createProductSchema)
  .min(1, 'Debe importar al menos un producto')
  .max(1000, 'Máximo 1000 productos por importación');

/**
 * Schema para actualización de stock
 */
export const updateStockSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z.number().int('La cantidad debe ser un número entero'),
  operation: z.enum(['add', 'subtract', 'set']),
  reason: z.string().max(200).optional(),
});

/**
 * Tipos TypeScript inferidos de los schemas
 */
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type SearchProductInput = z.infer<typeof searchProductSchema>;
export type BulkImportProductInput = z.infer<typeof bulkImportProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;

/**
 * Función helper para validar productos
 */
export const validateProduct = (data: unknown) => {
  return createProductSchema.safeParse(data);
};

/**
 * Función helper para validar actualización de producto
 */
export const validateProductUpdate = (data: unknown) => {
  return updateProductSchema.safeParse(data);
};
