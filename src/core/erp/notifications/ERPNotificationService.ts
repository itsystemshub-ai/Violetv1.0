/**
 * ERP Notification Service - Sistema de Notificaciones del ERP
 * 
 * Gestiona las notificaciones del sistema ERP basadas en eventos,
 * incluyendo alertas de stock bajo, transacciones pendientes, y más.
 * 
 * @module core/erp/notifications
 */

import { eventBus, ERP_EVENTS } from '@/core/erp/event-bus/EventBus';
import { localDb } from '@/core/database/localDb';
import { companyContext } from '@/core/erp/company-context/CompanyContext';

export type NotificationType = 
  | 'INFO'
  | 'WARNING'
  | 'ERROR'
  | 'SUCCESS'
  | 'STOCK_LOW'
  | 'PAYMENT_PENDING'
  | 'APPROVAL_REQUIRED'
  | 'TRANSACTION_COMPLETED';

export interface ERPNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  companyId: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  transactionId?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

class ERPNotificationServiceClass {
  private static instance: ERPNotificationServiceClass;
  private initialized = false;

  private constructor() {
    console.log('[ERPNotifications] Servicio inicializado');
  }

  static getInstance(): ERPNotificationServiceClass {
    if (!ERPNotificationServiceClass.instance) {
      ERPNotificationServiceClass.instance = new ERPNotificationServiceClass();
    }
    return ERPNotificationServiceClass.instance;
  }

  /**
   * Inicializar el servicio y configurar listeners de eventos
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Escuchar eventos del ERP y generar notificaciones
    eventBus.on(ERP_EVENTS.STOCK_LOW, this.handleStockLow.bind(this), 'ERPNotifications');
    eventBus.on(ERP_EVENTS.PURCHASE_ORDER_CREATED, this.handlePurchaseCreated.bind(this), 'ERPNotifications');
    eventBus.on(ERP_EVENTS.SALE_CREATED, this.handleSaleCreated.bind(this), 'ERPNotifications');
    eventBus.on(ERP_EVENTS.INVENTORY_ADJUSTED, this.handleInventoryAdjusted.bind(this), 'ERPNotifications');
    
    this.initialized = true;
    console.log('[ERPNotifications] ✅ listeners configurados');
  }

  /**
   * Crear una notificación manual
   */
  async createNotification(params: {
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    transactionId?: string;
    userId?: string;
  }): Promise<ERPNotification | null> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) return null;

    const notification: ERPNotification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: params.type,
      title: params.title,
      message: params.message,
      companyId,
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      transactionId: params.transactionId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await localDb.notifications?.put({
        ...notification,
        is_dirty: true,
      });

      console.log(`[ERPNotifications] ✅ Notificación creada: ${notification.type}`);
      return notification;
    } catch (error) {
      console.error('[ERPNotifications] Error creando notificación:', error);
      return null;
    }
  }

  /**
   * Obtener notificaciones no leídas
   */
  async getUnreadNotifications(companyId: string): Promise<ERPNotification[]> {
    const notifications = await localDb.notifications
      ?.where('companyId')
      .equals(companyId)
      .and(n => !n.read)
      .toArray() || [];

    return notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Obtener todas las notificaciones
   */
  async getAllNotifications(companyId: string, limit = 50): Promise<ERPNotification[]> {
    const notifications = await localDb.notifications
      ?.where('companyId')
      .equals(companyId)
      .toArray() || [];

    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await localDb.notifications?.update(notificationId, {
        read: true,
        read_at: new Date().toISOString(),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(companyId: string): Promise<void> {
    const unread = await this.getUnreadNotifications(companyId);
    for (const notification of unread) {
      await this.markAsRead(notification.id);
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(companyId: string): Promise<number> {
    return localDb.notifications
      ?.where('companyId')
      .equals(companyId)
      .and(n => !n.read)
      .count() || 0;
  }

  // Handlers de eventos privados

  private async handleStockLow(event: any): Promise<void> {
    await this.createNotification({
      type: 'STOCK_LOW',
      title: '⚠️ Stock Bajo',
      message: `El producto "${event.payload.productName}" tiene solo ${event.payload.currentStock} unidades (mínimo: ${event.payload.minimumStock})`,
      entityType: 'PRODUCT',
      entityId: event.payload.productId,
      transactionId: event.transactionId,
    });
  }

  private async handlePurchaseCreated(event: any): Promise<void> {
    await this.createNotification({
      type: 'INFO',
      title: '📦 Nueva Orden de Compra',
      message: `Orden de compra creada por ${event.payload.total} ${event.payload.currency}`,
      entityType: 'ORDER',
      entityId: event.payload.id,
      transactionId: event.transactionId,
    });
  }

  private async handleSaleCreated(event: any): Promise<void> {
    await this.createNotification({
      type: 'SUCCESS',
      title: '💰 Nueva Venta',
      message: `Venta registrada: ${event.payload.total} ${event.payload.currency}`,
      entityType: 'INVOICE',
      entityId: event.payload.id,
      transactionId: event.transactionId,
    });
  }

  private async handleInventoryAdjusted(event: any): Promise<void> {
    await this.createNotification({
      type: 'INFO',
      title: '📊 Ajuste de Inventario',
      message: `Ajuste registrado: ${event.payload.difference > 0 ? '+' : ''}${event.payload.difference} unidades`,
      entityType: 'ADJUSTMENT',
      entityId: event.payload.adjustmentId,
      transactionId: event.transactionId,
    });
  }
}

export const erpNotificationService = ERPNotificationServiceClass.getInstance();
export default erpNotificationService;