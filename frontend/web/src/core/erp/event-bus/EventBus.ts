/**
 * Event Bus - Sistema de Comunicación Desacoplada
 * 
 * Permite que los módulos del ERP se comuniquen sin dependencias directas.
 * Cualquier módulo puede:
 * - Emitir eventos (publish)
 * - Suscribirse a eventos (subscribe)
 * - Desuscribirse (unsubscribe)
 * 
 * @module core/erp/event-bus
 */

export type EventPayload = Record<string, unknown> | null;

export interface ERPEvent<T = EventPayload> {
  type: string;
  payload: T;
  timestamp: string;
  sourceModule: string;
  transactionId?: string;
  company_id?: string;
}

type EventHandler<T = EventPayload> = (event: ERPEvent<T>) => void | Promise<void>;

interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  module: string;
}

// Catálogo de eventos estándar del ERP
export const ERP_EVENTS = {
  // Eventos de Ventas
  SALE_CREATED: 'SALE.created',
  SALE_UPDATED: 'SALE.updated',
  SALE_CANCELLED: 'SALE.cancelled',
  SALE_COMPLETED: 'SALE.completed',
  
  // Eventos de Compras
  PURCHASE_ORDER_CREATED: 'PURCHASE_ORDER.created',
  PURCHASE_ORDER_APPROVED: 'PURCHASE_ORDER.approved',
  PURCHASE_ORDER_RECEIVED: 'PURCHASE_ORDER.received',
  PURCHASE_ORDER_CANCELLED: 'PURCHASE_ORDER.cancelled',
  
  // Eventos de Inventario
  INVENTORY_INCREASED: 'INVENTORY.increased',
  INVENTORY_DECREASED: 'INVENTORY.decreased',
  INVENTORY_ADJUSTED: 'INVENTORY.adjusted',
  STOCK_LOW: 'INVENTORY.stock_low',
  STOCK_OUT: 'INVENTORY.stock_out',
  
  // Eventos de Facturación
  INVOICE_CREATED: 'INVOICE.created',
  INVOICE_POSTED: 'INVOICE.posted',
  INVOICE_CANCELLED: 'INVOICE.cancelled',
  
  // Eventos de Pagos
  PAYMENT_RECEIVED: 'PAYMENT.received',
  PAYMENT_MADE: 'PAYMENT.made',
  PAYMENT_APPLIED: 'PAYMENT.applied',
  
  // Eventos Contables
  LEDGER_ENTRY_CREATED: 'LEDGER.entry_created',
  JOURNAL_ENTRY_CREATED: 'JOURNAL.entry_created',
  
  // Eventos de Empresa
  COMPANY_SELECTED: 'COMPANY.selected',
  COMPANY_UPDATED: 'COMPANY.updated',
  
  // Eventos de Usuario
  USER_LOGGED_IN: 'USER.logged_in',
  USER_LOGGED_OUT: 'USER.logged_out',
  
  // Eventos de Sistema
  SYNC_COMPLETED: 'SYNC.completed',
  SYNC_FAILED: 'SYNC.failed',
  ERROR_OCCURRED: 'ERROR.occurred',
} as const;

export type ERPEventType = typeof ERP_EVENTS[keyof typeof ERP_EVENTS];

/**
 * EventBus - Singleton para gestión de eventos del ERP
 */
class EventBusClass {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventHistory: ERPEvent[] = [];
  private maxHistory = 100;
  private static instance: EventBusClass;

  private constructor() {
    console.log('[EventBus] Inicializado');
  }

  static getInstance(): EventBusClass {
    if (!EventBusClass.instance) {
      EventBusClass.instance = new EventBusClass();
    }
    return EventBusClass.instance;
  }

  /**
   * Emitir un evento a todos los suscriptores
   * 
   * @param eventType - Tipo de evento (usar ERP_EVENTS)
   * @param payload - Datos del evento
   * @param options - Opciones adicionales (sourceModule, transactionId, companyId)
   */
  emit<T = EventPayload>(
    eventType: string,
    payload: T,
    options: {
      sourceModule: string;
      transactionId?: string;
      company_id?: string;
    }
  ): void {
    const event: ERPEvent<T> = {
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
      sourceModule: options.sourceModule,
      transactionId: options.transactionId,
      company_id: options.company_id,
    };

    // Registrar en historial
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    console.log(`[EventBus] 📢 Emitido: ${eventType}`, {
      source: options.sourceModule,
      transactionId: options.transactionId,
      company_id: options.company_id,
    });

    // Notificar suscriptores
    const subs = this.subscriptions.get(eventType) || [];
    subs.forEach((sub) => {
      try {
        sub.handler(event);
      } catch (error) {
        console.error(`[EventBus] Error en handler para ${eventType}:`, error);
      }
    });

    // También notificar suscriptores wildcard
    const wildcardSubs = this.subscriptions.get('*') || [];
    wildcardSubs.forEach((sub) => {
      try {
        sub.handler(event);
      } catch (error) {
        console.error(`[EventBus] Error en handler wildcard:`, error);
      }
    });
  }

  /**
   * Suscribirse a un tipo de evento
   * 
   * @param eventType - Tipo de evento a escuchar
   * @param handler - Función que處理 el evento
   * @param module - Nombre del módulo suscriptor (para debugging)
   * @returns Función para cancelar la suscripción
   */
  on<T = EventPayload>(
    eventType: string,
    handler: EventHandler<T>,
    module: string
  ): () => void {
    const subscription: EventSubscription = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
      eventType,
      handler: handler as EventHandler,
      module,
    };

    const existing = this.subscriptions.get(eventType) || [];
    existing.push(subscription);
    this.subscriptions.set(eventType, existing);

    console.log(`[EventBus] ✅ Suscrito a: ${eventType} (módulo: ${module})`);

    // Retornar función de cleanup
    return () => this.off(eventType, subscription.id);
  }

  /**
   * Cancelar suscripción
   */
  off(eventType: string, subscriptionId: string): void {
    const subs = this.subscriptions.get(eventType);
    if (subs) {
      const filtered = subs.filter((s) => s.id !== subscriptionId);
      if (filtered.length === 0) {
        this.subscriptions.delete(eventType);
      } else {
        this.subscriptions.set(eventType, filtered);
      }
    }
  }

  /**
   * Suscribirse a múltiples eventos a la vez
   */
  onMany(
    events: string[],
    handler: EventHandler,
    module: string
  ): () => void {
    const cleanups = events.map((event) => this.on(event, handler, module));
    return () => cleanups.forEach((cleanup) => cleanup());
  }

  /**
   * Obtener historial de eventos
   */
  getHistory(limit = 50): ERPEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Obtener eventos por tipo
   */
  getEventsByType(eventType: string): ERPEvent[] {
    return this.eventHistory.filter((e) => e.type === eventType);
  }

  /**
   * Obtener eventos por transacción
   */
  getEventsByTransaction(transactionId: string): ERPEvent[] {
    return this.eventHistory.filter((e) => e.transactionId === transactionId);
  }

  /**
   * Limpiar historial
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Obtener estadísticas de eventos
   */
  getStats(): { eventTypes: string[]; totalEvents: number } {
    const eventTypes = Array.from(this.subscriptions.keys());
    return {
      eventTypes,
      totalEvents: this.eventHistory.length,
    };
  }
}

// Singleton instance
export const eventBus = EventBusClass.getInstance();

/**
 * Hook para usar EventBus en componentes React
 */
export function useEventBus() {
  return {
    emit: eventBus.emit.bind(eventBus),
    on: eventBus.on.bind(eventBus),
    off: eventBus.off.bind(eventBus),
    onMany: eventBus.onMany.bind(eventBus),
    getHistory: eventBus.getHistory.bind(eventBus),
    getEventsByType: eventBus.getEventsByType.bind(eventBus),
    getEventsByTransaction: eventBus.getEventsByTransaction.bind(eventBus),
  };
}

// Exportar constants para uso directo
export { ERP_EVENTS as Events };
export default eventBus;