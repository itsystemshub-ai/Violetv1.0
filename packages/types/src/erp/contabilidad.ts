/**
 * Tipos ERP - Módulo de Contabilidad
 */

export interface PlanCuentas {
  cuenta_codigo: string;
  cuenta_nombre: string;
  cuenta_tipo: 'A' | 'P' | 'O' | 'I' | 'G'; // Activo, Pasivo, Patrimonio, Ingreso, Gasto
  cuenta_naturaleza: 'D' | 'A'; // Deudora, Acreedora
  cuenta_padre_codigo?: string;
  nivel: number;
  saldo: number;
  estatus: 'A' | 'I';
}

export interface AsientoContable {
  correlativo: number;
  numero_asiento: string;
  fecha: string;
  descripcion: string;
  referencia?: string;
  total_debito: number;
  total_credito: number;
  cuadrado: boolean;
  usuario_codigo?: string;
  estatus: 'R' | 'A'; // Registrado / Anulado
}

export interface AsientoDetalle {
  correlativo_asiento: number;
  linea: number;
  cuenta_codigo: string;
  descripcion?: string;
  debito: number;
  credito: number;
  centro_costo_codigo?: string;
}

export interface CentroCosto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  estatus: 'A' | 'I';
}

export interface LibroDiario {
  numero_asiento: string;
  fecha: string;
  descripcion: string;
  cuenta_codigo: string;
  cuenta_nombre: string;
  debito: number;
  credito: number;
}

export interface LibroMayor {
  cuenta_codigo: string;
  cuenta_nombre: string;
  saldo_inicial: number;
  total_debitos: number;
  total_creditos: number;
  saldo_final: number;
  periodo: string;
}

export interface BalanceComprobacion {
  cuenta_codigo: string;
  cuenta_nombre: string;
  saldo_inicial: number;
  movimientos_debito: number;
  movimientos_credito: number;
  saldo_final: number;
}

export interface EstadoResultados {
  periodo: string;
  ingresos: number;
  costo_ventas: number;
  utilidad_bruta: number;
  gastos_operativos: number;
  utilidad_operativa: number;
  otros_ingresos: number;
  otros_egresos: number;
  utilidad_antes_impuestos: number;
  impuesto_renta: number;
  utilidad_neta: number;
}

export interface BalanceGeneral {
  fecha: string;
  activo: {
    corriente: number;
    no_corriente: number;
    total: number;
  };
  pasivo: {
    corriente: number;
    no_corriente: number;
    total: number;
  };
  patrimonio: number;
  total_pasivo_patrimonio: number;
}

export interface LibroVentas {
  numero_comprobante: string;
  fecha: string;
  rif_cliente: string;
  nombre_cliente: string;
  numero_factura: string;
  numero_control: string;
  total_venta: number;
  base_imponible: number;
  porcentaje_alicuota: number;
  impuesto_iva: number;
  venta_exenta: number;
  retencion_iva: number;
}

export interface LibroCompras {
  numero_comprobante: string;
  fecha: string;
  rif_proveedor: string;
  nombre_proveedor: string;
  numero_factura: string;
  numero_control: string;
  total_compra: number;
  base_imponible: number;
  porcentaje_alicuota: number;
  impuesto_iva: number;
  compra_exenta: number;
  retencion_iva: number;
  retencion_islr: number;
}
