/**
 * Tipos ERP - Módulo de Banco
 */

export interface Banco {
  codigo: string;
  nombre: string;
  codigo_bancario?: string;
  direccion?: string;
  telefono?: string;
  estatus: 'A' | 'I';
}

export interface CuentaBancaria {
  codigo: string;
  banco_codigo: string;
  numero_cuenta: string;
  tipo_cuenta: 'C' | 'A'; // Corriente / Ahorro
  moneda_codigo?: string;
  saldo: number;
  saldo_inicial: number;
  fecha_saldo_inicial?: string;
  estatus: 'A' | 'I';
}

export interface MovimientoBanco {
  correlativo: number;
  cuenta_codigo: string;
  documento: string;
  tipo_movimiento: string; // DEP, CHE, TRA, NCR, NDB
  fecha: string;
  beneficiario?: string;
  descripcion?: string;
  referencia?: string;
  debito: number;
  credito: number;
  saldo_anterior: number;
  saldo_actual: number;
  conciliado: 'T' | 'F';
  fecha_conciliacion?: string;
  usuario_codigo?: string;
  estatus: 'R' | 'A';
}

export interface Cheque {
  correlativo: number;
  cuenta_codigo: string;
  numero_cheque: string;
  fecha_emision: string;
  beneficiario_codigo?: string;
  beneficiario_nombre?: string;
  monto: number;
  estatus: 'E' | 'C' | 'A'; // Emitido / Cobrado / Anulado
  fecha_cobro?: string;
  documento_pago?: string;
}

export interface ConciliacionBancaria {
  correlativo: number;
  cuenta_codigo: string;
  fecha_inicio: string;
  fecha_fin: string;
  saldo_banco: number;
  saldo_libro: number;
  diferencias: number;
  partidas_conciliadas: ConciliacionItem[];
  estatus: 'P' | 'C';
}

export interface ConciliacionItem {
  movimiento_codigo: number;
  tipo: 'DEBITO' | 'CREDITO';
  monto: number;
  descripcion: string;
}
