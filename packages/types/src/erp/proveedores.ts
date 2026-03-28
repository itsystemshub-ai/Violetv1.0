/**
 * Tipos para el módulo de Proveedores (CXP)
 */

export interface Proveedor {
  codigo: string;
  nombre: string;
  referencia?: string;
  contacto?: string;
  lista_precios_codigo?: string;
  cuenta_contable?: string;
  rif: string;
  nit?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  pais?: string;
  telefonos?: string;
  fax?: string;
  correo_electronico?: string;
  limite_credito: number;
  dias_credito: number;
  credito_disponible: number;
  total_debitos: number;
  total_creditos: number;
  total_saldo: number;
  denominacion_fiscal: 'CO' | 'GB' | 'NO';
  retencion_iva: number;
  retencion_islr: number;
  estatus: 'A' | 'I';
  contribuyente_especial: 'T' | 'F';
  tiempo_pago_promedio: number;
}

export interface CXP {
  correlativo: number;
  proveedor_codigo: string;
  documento: string;
  tipo_documento: string;
  fecha: string;
  fecha_vencimiento?: string;
  total_operacion: number;
  total_base_imponible: number;
  total_impuesto: number;
  saldo: number;
  estatus: 'P' | 'C'; // Pendiente / Cancelado
}

export interface CXPDesgloseImpuesto {
  correlativo: number;
  alicuota: number;
  base_imponible: number;
  impuesto: number;
}
