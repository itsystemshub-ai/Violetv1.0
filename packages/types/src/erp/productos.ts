/**
 * Tipos para el módulo de Productos
 */

export interface Producto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  codigo_barra?: string;
  referencia?: string;
  grupo_codigo?: string;
  marca_codigo?: string;
  unidad_codigo?: string;
  linea_codigo?: string;
  deposito_codigo?: string;
  cuenta_contable?: string;
  precio_costo: number;
  precio_venta: number;
  precio_mayor: number;
  precio_oferta: number;
  precio_minimo: number;
  precio_maximo: number;
  alicuota_iva: number;
  existencia: number;
  stock_minimo: number;
  stock_maximo?: number;
  estatus: 'A' | 'I';
  tipo: 'P' | 'S' | 'C'; // Producto / Servicio / Compuesto
  requiere_serial: 'T' | 'F';
  controla_lote: 'T' | 'F';
  fecha_vencimiento?: string;
  peso?: number;
  volumen?: number;
  largo?: number;
  ancho?: number;
  alto?: number;
}

export interface ProductoComposicion {
  producto_padre_codigo: string;
  producto_hijo_codigo: string;
  cantidad: number;
  unidad_codigo?: string;
}

export interface Unidad {
  codigo: string;
  nombre: string;
  abreviatura: string;
}

export interface Deposito {
  codigo: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  estatus: 'A' | 'I';
}

export interface Existencia {
  producto_codigo: string;
  deposito_codigo: string;
  cantidad: number;
  costo_promedio: number;
  ultima_compra?: string;
  ultima_venta?: string;
}

export interface GrupoProductos {
  codigo: string;
  nombre: string;
}

export interface Marca {
  codigo: string;
  nombre: string;
}

export interface Linea {
  codigo: string;
  nombre: string;
}

export interface ListaPrecios {
  codigo: string;
  nombre: string;
  porcentaje_descuento: number;
}

export interface MovimientoInventario {
  correlativo: number;
  documento: string;
  tipo_documento: string;
  fecha: string;
  hora: string;
  deposito_origen_codigo?: string;
  deposito_destino_codigo?: string;
  producto_codigo: string;
  cantidad: number;
  costo: number;
  costo_promedio: number;
  serial?: string;
  lote?: string;
  fecha_vencimiento?: string;
  referencia?: string;
  notas?: string;
  usuario_codigo: string;
  estacion?: string;
  documento_origen?: string;
  estatus: 'R' | 'A'; // Registrado / Anulado
}

export interface Kardex {
  producto_codigo: string;
  deposito_codigo: string;
  fecha: string;
  documento: string;
  tipo_movimiento: string;
  entrada_cantidad: number;
  entrada_costo: number;
  entrada_total: number;
  salida_cantidad: number;
  salida_costo: number;
  salida_total: number;
  saldo_cantidad: number;
  saldo_costo: number;
  saldo_total: number;
}
