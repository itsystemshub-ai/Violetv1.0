/**
 * Tipos ERP - Módulo de Nómina
 */

export interface Empleado {
  codigo: string;
  nombre: string;
  apellido: string;
  cedula: string;
  fecha_nacimiento?: string;
  direccion?: string;
  telefono?: string;
  correo_electronico?: string;
  departamento_codigo?: string;
  cargo?: string;
  sueldo_base: number;
  fecha_ingreso?: string;
  fecha_egreso?: string;
  estatus: 'A' | 'I';
  cuenta_bancaria_codigo?: string;
  tipo_personal: 'O' | 'T'; // Ordinario / Temporal
}

export interface Departamento {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface Cargo {
  codigo: string;
  nombre: string;
  descripcion?: string;
  sueldo_minimo: number;
  sueldo_maximo: number;
}

export interface Nomina {
  correlativo: number;
  periodo: string; // YYYY-MM
  tipo_nomina: 'R' | 'V' | 'U'; // Regular / Vacaciones / Utilidades
  fecha_pago: string;
  total_asignaciones: number;
  total_deducciones: number;
  total_neto: number;
  estatus: 'P' | 'Q'; // Pendiente / Quitada
  usuario_codigo?: string;
}

export interface NominaDetalle {
  correlativo: number;
  empleado_codigo: string;
  dias_trabajados: number;
  sueldo_devengado: number;
  asignaciones: NominaAsignacion[];
  deducciones: NominaDeduccion[];
  saldo_neto: number;
}

export interface NominaAsignacion {
  codigo: string;
  nombre: string;
  monto: number;
  tipo: 'SUELDO' | 'BONO' | 'COMISION' | 'HORAS_EXTRAS' | 'VACACIONES' | 'UTILIDADES';
}

export interface NominaDeduccion {
  codigo: string;
  nombre: string;
  monto: number;
  tipo: 'IVSS' | 'FAOV' | 'INCES' | 'ISLR' | 'PRESTAMO' | 'VALE';
}

export interface Asignacion {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'FIJO' | 'VARIABLE';
  monto_fijo?: number;
  porcentaje?: number;
}

export interface Deduccion {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'LEY' | 'VOLUNTARIA';
  porcentaje?: number;
  monto_fijo?: number;
}

export interface Prestamo {
  correlativo: number;
  empleado_codigo: string;
  monto: number;
  saldo: number;
  cuotas: number;
  cuotas_pagadas: number;
  fecha_otorgamiento: string;
  fecha_vencimiento?: string;
  estatus: 'A' | 'C'; // Activo / Cancelado
}

export interface Vacaciones {
  correlativo: number;
  empleado_codigo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_disfrutados: number;
  dias_pendientes: number;
  estatus: 'S' | 'D' | 'C'; // Solicitado / Disfrutando / Completado
}
