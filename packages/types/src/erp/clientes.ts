/**
 * Tipos para el módulo de Clientes (CXC)
 */

export interface Cliente {
  codigo: string;
  nombre: string;
  referencia?: string;
  contacto?: string;
  vendedor_codigo?: string;
  zona_venta_codigo?: string;
  lista_precios_codigo?: string;
  cuenta_contable?: string;
  rif: string;
  nit?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  pais?: string;
  codigo_postal?: string;
  telefonos?: string;
  fax?: string;
  correo_electronico?: string;
  limite_credito: number;
  dias_credito: number;
  credito_disponible: number;
  total_debitos: number;
  total_creditos: number;
  total_anticipos: number;
  total_saldo: number;
  denominacion_fiscal: 'CO' | 'GB' | 'NO'; // Común / Gran Contribuyente / No contribuyente
  precio_venta: '1' | '2' | '3' | '4' | '5' | '6' | '7';
  retencion: number;
  descuento: number;
  editar_datos_fiscales: 'T' | 'F';
  aceptar_cheque: 'T' | 'F';
  requiere_clave: 'T' | 'F';
  notas?: string;
  maximo_monto_venta: number;
  maximo_credito: number;
  ultima_venta_contado?: string; // timestamp
  monto_ultima_venta_contado: number;
  ultima_venta_credito?: string; // timestamp
  monto_ultima_venta_credito: number;
  ultimo_pago?: string; // timestamp
  monto_ultimo_pago: number;
  estatus: 'A' | 'I';
  fecha_inicio?: string; // date
  grupo_clientes_codigo?: string;
  municipio?: string;
  contribuyente_especial: 'T' | 'F';
  tipo_venta: string;
  tipo_cliente: string;
  dv?: string; // Dígito verificador (Panamá)
}

export interface GrupoClientes {
  codigo: string;
  nombre: string;
}

export interface ZonaVentas {
  codigo: string;
  nombre: string;
  referencia?: string;
}

export interface CXC {
  correlativo: number;
  cliente_codigo: string;
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

export interface CXCDesgloseImpuesto {
  correlativo: number;
  alicuota: number;
  base_imponible: number;
  impuesto: number;
}

export interface TipoContribuyente {
  codigo: string;
  nombre: 'ORDINARIO' | 'ESPECIAL' | 'FORMAL';
  porcentaje_retencion_iva: number;
  porcentaje_retencion_islr: number;
}

export interface DenominacionFiscal {
  codigo: 'CO' | 'GB' | 'NO';
  nombre: 'Común' | 'Gran Contribuyente' | 'No contribuyente';
}
