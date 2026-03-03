/**
 * DataMapper centralizado
 * Maneja la conversión entre formatos de base de datos (snake_case) y frontend (camelCase)
 */

import type { Product, Invoice } from '@/lib/index';
import type { ProductDB, InvoiceDB } from '@/types/database.types';

/**
 * Convierte snake_case a camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convierte camelCase a snake_case
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Convierte un objeto de snake_case a camelCase
 */
export const objectSnakeToCamel = <T extends Record<string, any>>(obj: any): T => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(objectSnakeToCamel) as any;
  if (typeof obj !== 'object') return obj;

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = snakeToCamel(key);
      result[camelKey] = objectSnakeToCamel(obj[key]);
    }
  }
  return result;
};

/**
 * Convierte un objeto de camelCase a snake_case
 */
export const objectCamelToSnake = <T extends Record<string, any>>(obj: any): T => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(objectCamelToSnake) as any;
  if (typeof obj !== 'object') return obj;

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = objectCamelToSnake(obj[key]);
    }
  }
  return result;
};

/**
 * Mapea un producto de DB a frontend
 */
export const mapProductFromDB = (dbItem: ProductDB): Product => {
  let images: string[] = [];
  if (dbItem.image_urls && Array.isArray(dbItem.image_urls)) {
    images = dbItem.image_urls;
  } else if (dbItem.image_url) {
    images = [dbItem.image_url];
  }

  return {
    id: dbItem.id,
    name: dbItem.name,
    description: dbItem.description,
    price: Number(dbItem.price),
    cost: Number(dbItem.cost),
    stock: dbItem.stock,
    minStock: dbItem.min_stock,
    unit: dbItem.unit,
    category: dbItem.category,
    warehouseId: dbItem.warehouse_id,
    images,
    cauplas: dbItem.cauplas,
    torflex: dbItem.torflex,
    indomax: dbItem.indomax,
    oem: dbItem.oem,
    aplicacion: dbItem.aplicacion,
    descripcionManguera: dbItem.descripcion_manguera,
    aplicacionesDiesel: dbItem.aplicaciones_diesel,
    isNuevo: dbItem.is_nuevo,
    ventasHistory: dbItem.ventas_history,
    rankingHistory: dbItem.ranking_history,
    precioFCA: Number(dbItem.precio_fca),
    status: dbItem.status,
    isCombo: dbItem.is_combo,
    components: dbItem.components,
    warehouseStocks: dbItem.warehouse_stocks,
  };
};

/**
 * Mapea un producto de frontend a DB
 */
export const mapProductToDB = (product: Partial<Product>, tenantId: string): Partial<ProductDB> => {
  const dbItem: Partial<ProductDB> = {
    tenant_id: tenantId,
    sku: product.cauplas || 'PENDING',
    name: product.name,
    description: product.description,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    min_stock: product.minStock,
    unit: product.unit,
    category: product.category,
    warehouse_id: product.warehouseId,
    cauplas: product.cauplas,
    torflex: product.torflex,
    indomax: product.indomax,
    oem: product.oem,
    aplicacion: product.aplicacion,
    descripcion_manguera: product.descripcionManguera,
    aplicaciones_diesel: product.aplicacionesDiesel,
    is_nuevo: product.isNuevo,
    ventas_history: product.ventasHistory,
    ranking_history: product.rankingHistory,
    precio_fca: product.precioFCA,
    status: product.status,
    is_combo: product.isCombo,
    components: product.components,
    warehouse_stocks: product.warehouseStocks,
    updated_at: new Date().toISOString(),
  };

  if (product.images && product.images.length > 0) {
    dbItem.image_url = product.images[0];
    dbItem.image_urls = product.images;
  }

  return dbItem;
};

/**
 * Mapea una factura de DB a frontend
 */
export const mapInvoiceFromDB = (dbItem: InvoiceDB): Invoice => {
  return {
    id: dbItem.id,
    tenantId: dbItem.tenant_id,
    number: dbItem.number,
    customerName: dbItem.customer_name,
    customerRif: dbItem.customer_rif,
    sellerId: dbItem.seller_id,
    date: dbItem.date,
    subtotal: dbItem.subtotal,
    taxTotal: dbItem.tax_total,
    taxIgtf: dbItem.tax_igtf,
    total: dbItem.total,
    status: dbItem.status,
    items: dbItem.items.map((item) => ({
      productId: item.product_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      tax: item.tax,
    })),
    type: dbItem.type,
    exchangeRateUsed: dbItem.exchange_rate_used,
    totalVES: dbItem.total_ves,
    notes: dbItem.notes,
    metadata: dbItem.metadata,
  };
};

/**
 * Mapea una factura de frontend a DB
 */
export const mapInvoiceToDB = (invoice: Partial<Invoice>, tenantId: string): Partial<InvoiceDB> => {
  const dbItem: Partial<InvoiceDB> = {
    tenant_id: tenantId,
    number: invoice.number,
    customer_name: invoice.customerName,
    customer_rif: invoice.customerRif,
    seller_id: invoice.sellerId,
    date: invoice.date,
    subtotal: invoice.subtotal,
    tax_total: invoice.taxTotal,
    tax_igtf: invoice.taxIgtf,
    total: invoice.total,
    status: invoice.status,
    items: invoice.items?.map((item) => ({
      product_id: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      tax: item.tax,
    })),
    type: invoice.type,
    exchange_rate_used: invoice.exchangeRateUsed,
    total_ves: invoice.totalVES,
    notes: invoice.notes,
    metadata: invoice.metadata,
    updated_at: new Date().toISOString(),
  };

  return dbItem;
};

/**
 * Mapper genérico para cualquier entidad
 */
export class GenericMapper<TFrontend, TDB> {
  constructor(
    private fromDBMapper: (dbItem: TDB) => TFrontend,
    private toDBMapper: (frontendItem: Partial<TFrontend>, tenantId: string) => Partial<TDB>
  ) {}

  fromDB(dbItem: TDB): TFrontend {
    return this.fromDBMapper(dbItem);
  }

  toDB(frontendItem: Partial<TFrontend>, tenantId: string): Partial<TDB> {
    return this.toDBMapper(frontendItem, tenantId);
  }

  fromDBArray(dbItems: TDB[]): TFrontend[] {
    return dbItems.map((item) => this.fromDB(item));
  }

  toDBArray(frontendItems: Partial<TFrontend>[], tenantId: string): Partial<TDB>[] {
    return frontendItems.map((item) => this.toDB(item, tenantId));
  }
}

/**
 * Instancias de mappers para uso común
 */
export const ProductMapper = new GenericMapper<Product, ProductDB>(
  mapProductFromDB,
  mapProductToDB
);

export const InvoiceMapper = new GenericMapper<Invoice, InvoiceDB>(
  mapInvoiceFromDB,
  mapInvoiceToDB
);
