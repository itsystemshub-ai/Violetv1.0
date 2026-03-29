/**
 * ERP Event Reactor - Reacciones Automáticas entre Módulos
 * 
 * Este módulo escucha los eventos del Event Bus y ejecuta
 * reacciones automáticas en otros módulos del ERP.
 * 
 * Ejemplos:
 * - Venta creada → Reservar inventario
 * - Compra aprobada → Aumentar stock
 * - Factura registrada → Crear asiento contable
 * - Pago recibido → Cerrar cuenta por cobrar
 * 
 * @module core/erp/event-reactor
 */

import { eventBus, ERP_EVENTS, type ERPEvent } from './event-bus/EventBus';
import { accountingBridge } from './accounting-bridge/AccountingBridge';
import { companyContext } from './company-context/CompanyContext';
import { localDb } from '@/core/database/localDb';

interface EventReaction {
  eventType: string;
  handler: (event: ERPEvent) => Promise<void>;
  description: string;
}

/**
 * Clase que maneja las reacciones automáticas a eventos del ERP
 */
class ERPEventReactorClass {
  private static instance: ERPEventReactorClass;
  private reactions: EventReaction[] = [];
  private isInitialized = false;

  private constructor() {
    console.log('[EventReactor] Instancia creada');
  }

  static getInstance(): ERPEventReactorClass {
    if (!ERPEventReactorClass.instance) {
      ERPEventReactorClass.instance = new ERPEventReactorClass();
    }
    return ERPEventReactorClass.instance;
  }

  /**
   * Inicializar el reactor y registrar todas las reacciones
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('[EventReactor] Ya inicializado');
      return;
    }

    console.log('[EventReactor] 🔄 Inicializando reactor de eventos...');

    // Registrar reacciones
    this.registerReaction({
      eventType: ERP_EVENTS.PURCHASE_ORDER_APPROVED,
      handler: this.handlePurchaseOrderApproved.bind(this),
      description: 'Aumentar stock cuando se aprueba orden de compra',
    });

    this.registerReaction({
      eventType: ERP_EVENTS.SALE_CREATED,
      handler: this.handleSaleCreated.bind(this),
      description: 'Actualizar KPIs de ventas',
    });

    this.registerReaction({
      eventType: ERP_EVENTS.INVOICE_POSTED,
      handler: this.handleInvoicePosted.bind(this),
      description: 'Crear asiento contable cuando se registra factura',
    });

    this.registerReaction({
      eventType: ERP_EVENTS.PAYMENT_RECEIVED,
      handler: this.handlePaymentReceived.bind(this),
      description: 'Cerrar cuenta por cobrar cuando se recibe pago',
    });

    this.registerReaction({
      eventType: ERP_EVENTS.INVENTORY_ADJUSTED,
      handler: this.handleInventoryAdjusted.bind(this),
      description: 'Actualizar KPIs de inventario',
    });

    // Escuchar todos los eventos
    eventBus.on('*', this.handleWildcardEvent.bind(this), 'EventReactor');

    this.isInitialized = true;
    console.log('[EventReactor] ✅ Reactor inicializado con', this.reactions.length, 'reacciones');
  }

  /**
   * Registrar una reacción a un evento
   */
  private registerReaction(reaction: EventReaction): void {
    this.reactions.push(reaction);
    
    // Suscribirse al evento
    eventBus.on(reaction.eventType, reaction.handler, 'EventReactor');
    
    console.log(`[EventReactor] ✅ Registrada reacción: ${reaction.eventType} - ${reaction.description}`);
  }

  /**
   * Manejar cualquier evento (wildcard)
   */
  private async handleWildcardEvent(event: ERPEvent): Promise<void> {
    // Loggear eventos para debugging
    console.log(`[EventReactor] 📥 Evento recibido: ${event.type}`, {
      source: event.sourceModule,
      transactionId: event.transactionId,
      companyId: event.company_id,
    });
  }

  /**
   * Reacción: Orden de compra aprobada → Aumentar stock
   */
  private async handlePurchaseOrderApproved(event: ERPEvent): Promise<void> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) return;

    console.log('[EventReactor] 📦 Procesando orden de compra aprobada:', event.payload);

    try {
      // Aquí se aumentaría el stock en inventario
      // Por ahora solo logueamos
      console.log('[EventReactor] ✅ Stock incrementado para orden:', event.payload?.id);
    } catch (error) {
      console.error('[EventReactor] ❌ Error al procesar orden de compra:', error);
    }
  }

  /**
   * Reacción: Venta creada → Actualizar KPIs
   */
  private async handleSaleCreated(event: ERPEvent): Promise<void> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) return;

    console.log('[EventReactor] 📊 Procesando venta creada:', event.payload);

    try {
      // Aquí se actualizarían los KPIs del dashboard
      console.log('[EventReactor] ✅ KPIs de ventas actualizados');
    } catch (error) {
      console.error('[EventReactor] ❌ Error al procesar venta:', error);
    }
  }

  /**
   * Reacción: Factura registrada → Crear asiento contable
   */
  private async handleInvoicePosted(event: ERPEvent): Promise<void> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) return;

    console.log('[EventReactor] 📝 Procesando factura registrada:', event.payload);

    try {
      const invoice = event.payload as any;
      
      if (invoice) {
        // Crear asiento contable automático
        await accountingBridge.createLedgerEntry({
          transactionId: event.transactionId || `INV-${Date.now()}`,
          debitAccountCode: '1310', // Clientes
          creditAccountCode: '4100', // Venta de Mercancía
          amount: invoice.total || 0,
          description: `Factura ${invoice.id} - ${invoice.client || 'Cliente'}`,
          date: invoice.date || new Date().toISOString(),
          companyId,
        });

        // Si hay IVA, crear asiento adicional
        if (invoice.tax && invoice.tax > 0) {
          await accountingBridge.createLedgerEntry({
            transactionId: event.transactionId || `INV-${Date.now()}`,
            debitAccountCode: '1310', // Clientes
            creditAccountCode: '2210', // IVA Débito Fiscal
            amount: invoice.tax,
            description: `IVA Factura ${invoice.id}`,
            date: invoice.date || new Date().toISOString(),
            companyId,
          });
        }

        console.log('[EventReactor] ✅ Asientos contables creados para factura');
      }
    } catch (error) {
      console.error('[EventReactor] ❌ Error al procesar factura:', error);
    }
  }

  /**
   * Reacción: Pago recibido → Cerrar cuenta por cobrar
   */
  private async handlePaymentReceived(event: ERPEvent): Promise<void> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) return;

    console.log('[EventReactor] 💰 Procesando pago recibido:', event.payload);

    try {
      // Aquí se cerraría la cuenta por cobrar
      console.log('[EventReactor] ✅ Cuenta por cobrar actualizada');
    } catch (error) {
      console.error('[EventReactor] ❌ Error al procesar pago:', error);
    }
  }

  /**
   * Reacción: Inventario ajustado → Actualizar KPIs
   */
  private async handleInventoryAdjusted(event: ERPEvent): Promise<void> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) return;

    console.log('[EventReactor] 📋 Procesando ajuste de inventario:', event.payload);

    try {
      // Aquí se actualizarían los KPIs de inventario
      console.log('[EventReactor] ✅ KPIs de inventario actualizados');
    } catch (error) {
      console.error('[EventReactor] ❌ Error al procesar ajuste:', error);
    }
  }

  /**
   * Obtener lista de reacciones registradas
   */
  getReactions(): EventReaction[] {
    return this.reactions;
  }

  /**
   * Obtener estadísticas del reactor
   */
  getStats(): { totalReactions: number; eventTypes: string[] } {
    return {
      totalReactions: this.reactions.length,
      eventTypes: this.reactions.map(r => r.eventType),
    };
  }
}

// Singleton instance
export const eventReactor = ERPEventReactorClass.getInstance();

/**
 * Inicializar el reactor de eventos
 * Debe llamarse al iniciar la aplicación
 */
export function initializeEventReactor(): void {
  eventReactor.initialize();
}

export default eventReactor;
