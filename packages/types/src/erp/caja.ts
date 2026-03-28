/**
 * Tipos ERP - Módulo de Caja
 */

export interface Caja {
  codigo: string;
  nombre: string;
  ubicacion?: string;
  estatus: 'A' | 'I';
}

export interface MovimientoCaja {
  correlativo: number;
  caja_codigo: string;
  documento: string;
  tipo_movimiento: 'ING' | 'EGR'; // Ingreso / Egreso
  fecha_hora: string;
  descripcion?: string;
  referencia?: string;
  monto: number;
  saldo_anterior: number;
  saldo_actual: number;
  usuario_codigo?: string;
  estatus: 'R' | 'A';
}

export interface CierreCaja {
  correlativo: number;
  caja_codigo: string;
  fecha_inicio: string;
  fecha_fin?: string;
  saldo_inicial: number;
  total_ingresos: number;
  total_egresos: number;
  saldo_sistema: number;
  saldo_fisico: number;
  diferencia: number;
  usuario_codigo?: string;
  estatus: 'A' | 'C'; // Abierto / Cerrado
}

export interface ReciboCaja {
  correlativo: number;
  numero_recibo: string;
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  descripcion: string;
  beneficiario?: string;
  forma_pago: string;
  usuario_codigo?: string;
}

export interface ArqueoCaja {
  caja_codigo: string;
  fecha: string;
  saldo_sistema: number;
  saldo_fisico: number;
  diferencia: number;
  billetes_monedas: {
    denominacion: number;
    cantidad: number;
    total: number;
  }[];
  usuario_codigo: string;
}
