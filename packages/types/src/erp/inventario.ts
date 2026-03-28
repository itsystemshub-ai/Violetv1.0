/**
 * Tipos para el módulo de Inventario
 */

export interface AjusteInventario {
  correlativo: number;
  documento: string;
  fecha: string;
  deposito_codigo: string;
  producto_codigo: string;
  cantidad_anterior: number;
  cantidad_nueva: number;
  cantidad_ajuste: number;
  costo: number;
  motivo: string;
  notas?: string;
  usuario_codigo: string;
  estatus: 'P' | 'R'; // Pendiente / Registrado
}

export interface TransferenciaInventario {
  correlativo: number;
  documento: string;
  fecha: string;
  deposito_origen_codigo: string;
  deposito_destino_codigo: string;
  items: TransferenciaItem[];
  total_items: number;
  usuario_codigo: string;
  estatus: 'P' | 'T' | 'R'; // Pendiente / En Tránsito / Recibido
}

export interface TransferenciaItem {
  producto_codigo: string;
  cantidad: number;
  costo: number;
}

export interface InventarioFisico {
  correlativo: number;
  documento: string;
  fecha_inicio: string;
  fecha_fin?: string;
  deposito_codigo: string;
  items: InventarioFisicoItem[];
  total_items: number;
  usuario_codigo: string;
  estatus: 'P' | 'C'; // Pendiente / Completado
}

export interface InventarioFisicoItem {
  producto_codigo: string;
  cantidad_sistema: number;
  cantidad_fisica: number;
  diferencia: number;
  costo: number;
  diferencia_valor: number;
}

export interface TipoMovimientoInventario {
  codigo: string;
  nombre: string;
  descripcion: string;
  afecta_costo: boolean;
  afecta_inventario: boolean;
}

export const TIPOS_MOVIMIENTO_INVENTARIO: Record<string, TipoMovimientoInventario> = {
  'ENT': { codigo: 'ENT', nombre: 'Entrada', descripcion: 'Compra, devolución, ajuste positivo', afecta_costo: true, afecta_inventario: true },
  'SAL': { codigo: 'SAL', nombre: 'Salida', descripcion: 'Venta, consumo, ajuste negativo', afecta_costo: true, afecta_inventario: true },
  'TRA': { codigo: 'TRA', nombre: 'Traspaso', descripcion: 'Movimiento entre depósitos', afecta_costo: false, afecta_inventario: true },
  'AJU': { codigo: 'AJU', nombre: 'Ajuste', descripcion: 'Corrección de inventario', afecta_costo: true, afecta_inventario: true },
  'INV': { codigo: 'INV', nombre: 'Inventario', descripcion: 'Conteo físico', afecta_costo: true, afecta_inventario: true },
};

export interface AlertaStock {
  producto_codigo: string;
  producto_nombre: string;
  existencia_actual: number;
  stock_minimo: number;
  diferencia: number;
  deposito_codigo: string;
  fecha_alerta: string;
}
