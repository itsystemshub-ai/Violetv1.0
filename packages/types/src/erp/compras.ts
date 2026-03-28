/**
 * Tipos para el módulo de Compras
 */

export interface Compra {
  correlativo: number;
  documento: string;
  tipo_documento: string;
  proveedor_codigo: string;
  proveedor_nombre?: string;
  proveedor_rif?: string;
  fecha_documento: string;
  fecha_registro: string;
  fecha_vencimiento?: string;
  deposito_codigo?: string;
  moneda_codigo?: string;
  factor_cambio: number;
  total_bruto_lineas: number;
  total_descuento_lineas: number;
  total_neto_lineas: number;
  total_impuesto_lineas: number;
  total_lineas: number;
  total_neto: number;
  impuesto: number;
  total_operacion: number;
  total_base_imponible: number;
  total_impuesto_fiscal: number;
  total_exento: number;
  total_costo: number;
  total_retencion_iva: number;
  total_retencion_islr: number;
  estatus: 'R' | 'A'; // Registrada / Anulada
  usuario_codigo?: string;
  estacion?: string;
}

export interface CompraDesglose {
  correlativo: number;
  codigo: number;
  producto_codigo?: string;
  producto_nombre?: string;
  cantidad: number;
  unidad_codigo?: string;
  precio: number;
  porc_descuento: number;
  descuento: number;
  bruto: number;
  neto: number;
  impuesto: number;
  total: number;
  costo: number;
  alicuota_iva: number;
  exento: 'T' | 'F';
  serial?: string;
  lote?: string;
  fecha_vencimiento?: string;
  deposito_codigo?: string;
}

export interface CompraDesgloseImpuesto {
  correlativo: number;
  codigo: number;
  alicuota: number;
  base_imponible: number;
  impuesto: number;
  exento: 'T' | 'F';
}

export interface OrdenCompra {
  correlativo: number;
  documento: string;
  proveedor_codigo: string;
  fecha_emision: string;
  fecha_entrega_esperada?: string;
  estatus: 'P' | 'R' | 'C'; // Pendiente / Recibida / Cancelada
  total_operacion: number;
}
