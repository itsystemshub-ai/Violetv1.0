/**
 * Tipos para el módulo de Ventas
 */

export interface Venta {
  correlativo: number;
  correlativo_codigo: number;
  documento: string;
  tipo_documento: string;
  cliente_codigo: string;
  cliente_nombre?: string;
  cliente_rif?: string;
  cliente_nit?: string;
  cliente_contacto?: string;
  cliente_direccion?: string;
  cliente_telefonos?: string;
  cliente_fax?: string;
  cliente_correo_e?: string;
  cliente_zona?: string;
  cliente_tipo_precio?: string;
  denominacion_fiscal?: string;
  moneda_codigo?: string;
  factor_cambio: number;
  fecha_emision: string;
  hora_emision?: string;
  dias_vencimiento: number;
  fecha_vencimiento?: string;
  deposito_codigo?: string;
  vendedor_codigo?: string;
  orden_de_compra?: string;
  fecha_orden_compra?: string;
  retencion: number;
  contado: number;
  credito: number;
  anticipo: number;
  total_cancelado: number;
  vuelto: number;
  total_bruto_lineas: number;
  total_descuento_lineas: number;
  total_neto_lineas: number;
  total_impuesto_lineas: number;
  total_lineas: number;
  descuento_1: number;
  porc_descuento_1: number;
  descuento_2: number;
  porc_descuento_2: number;
  flete: number;
  porc_flete: number;
  total_neto: number;
  impuesto: number;
  porc_impuesto: number;
  total_impuesto_municipal: number;
  total_impuesto_adicional: number;
  total_operacion: number;
  total_base_imponible_lineas: number;
  total_impuesto_fiscal_lineas: number;
  total_exento_lineas: number;
  total_base_imponible: number;
  total_impuesto_fiscal: number;
  total_exento: number;
  total_costo: number;
  estacion?: string;
  usuario_codigo?: string;
  temporal: 'T' | 'F';
  asignar_costo?: number;
  porc_retencion: number;
  correlativo_cxc?: number;
  motivo_codigo?: string;
  total_costo_promedio: number;
  impuesto_iva_codigo?: string;
  total_retencion_iva: number;
  porc_retencion_iva: number;
  documento_retencion_iva?: string;
  control_interno?: string;
  documento_ncr?: string;
  numero_control?: string;
  fecha_recepcion_rtp?: string;
  fecha_hora_impresion?: string;
  fecha_y_hora?: string;
  total_impuesto_al_licor: number;
  fecha_hora_registro?: string;
  total_costo_imp: number;
  total_costo_promedio_imp: number;
  total_cantidad_items: number;
  total_items: number;
  tipo_transaccion?: string;
  estatus: 'R' | 'A'; // Registrada / Anulada
  impacta_inventario: 'T' | 'F';
  impacta_contabilidad: 'T' | 'F';
}

export interface VentaDesglose {
  correlativo: number;
  codigo: number;
  tipo_registro: 'P' | 'S'; // Producto / Servicio
  producto_codigo?: string;
  producto_nombre?: string;
  producto_descripcion?: string;
  producto_referencia?: string;
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
  costo_promedio: number;
  alicuota_iva: number;
  impuesto_iva_codigo?: string;
  exento: 'T' | 'F';
  impuesto_municipal: number;
  impuesto_adicional: number;
  serial?: string;
  lote?: string;
  fecha_vencimiento?: string;
  deposito_codigo?: string;
  orden: number;
}

export interface VentaDesgloseImpuesto {
  correlativo: number;
  codigo: number;
  alicuota: number;
  base_imponible: number;
  impuesto: number;
  exento: 'T' | 'F';
}

export interface TipoDocumentoVenta {
  codigo: string;
  nombre: string;
  descripcion: string;
  impacta_inventario: boolean;
}

export const TIPOS_DOCUMENTO_VENTA: Record<string, TipoDocumentoVenta> = {
  'FAC': { codigo: 'FAC', nombre: 'Factura', descripcion: 'Factura fiscal', impacta_inventario: true },
  'FCR': { codigo: 'FCR', nombre: 'Factura Crédito', descripcion: 'Factura a crédito', impacta_inventario: true },
  'NCR': { codigo: 'NCR', nombre: 'Nota Crédito', descripcion: 'Devolución/Saldo a favor', impacta_inventario: true },
  'NDB': { codigo: 'NDB', nombre: 'Nota Débito', descripcion: 'Cargo adicional', impacta_inventario: true },
  'PED': { codigo: 'PED', nombre: 'Pedido', descripcion: 'Pedido de cliente', impacta_inventario: false },
  'ODD': { codigo: 'ODD', nombre: 'Orden Despacho', descripcion: 'Orden de entrega', impacta_inventario: false },
  'PRS': { codigo: 'PRS', nombre: 'Presupuesto', descripcion: 'Cotización', impacta_inventario: false },
  'NET': { codigo: 'NET', nombre: 'Nota Entrega', descripcion: 'Entrega parcial', impacta_inventario: true },
  'FPV': { codigo: 'FPV', nombre: 'Factura PV', descripcion: 'Factura punto de venta', impacta_inventario: true },
};
