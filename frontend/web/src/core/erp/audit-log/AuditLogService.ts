/**
 * ERP Audit Log Service - Servicio de Auditoría del ERP
 * 
 * Registra todos los eventos del sistema para auditoría total.
 * Cumple con la regla: Nunca borrar datos.
 * 
 * @module core/erp/audit-log
 */

import { companyContext } from '../company-context/CompanyContext';
import { localDb } from '@/core/database/localDb';
import { toast } from 'sonner';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'POST' 
  | 'CANCEL'
  | 'VIEW'
  | 'EXPORT';

export type AuditEntityType = 
  | 'TRANSACTION'
  | 'INVOICE'
  | 'ORDER'
  | 'PRODUCT'
  | 'EMPLOYEE'
  | 'PAYMENT'
  | 'WORKFLOW'
  | 'LEDGER_ENTRY'
  | 'JOURNAL_ENTRY'
  | 'COMPANY'
  | 'USER';

export interface AuditLogEntry {
  id: string;
  companyId: string;
  transactionId?: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  userId?: string;
  userName?: string;
  previousValue?: string;
  newValue?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Tabla de enlaces entre documentos
export interface DocumentLink {
  id: string;
  companyId: string;
  sourceType: AuditEntityType;
  sourceId: string;
  targetType: AuditEntityType;
  targetId: string;
  linkType: 'RELATED' | 'PARENT' | 'CHILD' | 'REFERENCE' | 'PAYMENT';
  createdAt: string;
  createdBy?: string;
}

class AuditLogServiceClass {
  private static instance: AuditLogServiceClass;

  private constructor() {
    console.log('[AuditLog] Servicio de auditoría inicializado');
  }

  static getInstance(): AuditLogServiceClass {
    if (!AuditLogServiceClass.instance) {
      AuditLogServiceClass.instance = new AuditLogServiceClass();
    }
    return AuditLogServiceClass.instance;
  }

  /**
   * Registrar una acción de auditoría
   */
  async log(params: {
    entityType: AuditEntityType;
    entityId: string;
    action: AuditAction;
    description: string;
    transactionId?: string;
    userId?: string;
    userName?: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
  }): Promise<AuditLogEntry | null> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) {
      console.warn('[AuditLog] No hay empresa activa, no se puede registrar');
      return null;
    }

    const entry: AuditLogEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      companyId,
      transactionId: params.transactionId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      userId: params.userId,
      userName: params.userName,
      previousValue: params.previousValue ? JSON.stringify(params.previousValue) : undefined,
      newValue: params.newValue ? JSON.stringify(params.newValue) : undefined,
      description: params.description,
      ipAddress: typeof window !== 'undefined' ? 'client' : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await localDb.audit_logs?.put({
        ...entry,
        table_name: 'erp_audit',
        record_id: entry.id,
        changed_by: params.userId,
        is_dirty: true,
      });

      console.log(`[AuditLog] ✅ ${params.action} en ${params.entityType}:${params.entityId}`);
      return entry;
    } catch (error) {
      console.error('[AuditLog] Error registrando auditoría:', error);
      return null;
    }
  }

  /**
   * Crear enlace entre documentos
   */
  async createDocumentLink(params: {
    sourceType: AuditEntityType;
    sourceId: string;
    targetType: AuditEntityType;
    targetId: string;
    linkType: DocumentLink['linkType'];
    createdBy?: string;
  }): Promise<DocumentLink | null> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) return null;

    const link: DocumentLink = {
      id: `DL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      companyId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      targetType: params.targetType,
      targetId: params.targetId,
      linkType: params.linkType,
      createdAt: new Date().toISOString(),
      createdBy: params.createdBy,
    };

    try {
      // Guardar en tabla de enlaces de documentos
      // Por ahora usamos una estructura flexible
      console.log('[AuditLog] Document link creado:', link);
      return link;
    } catch (error) {
      console.error('[AuditLog] Error creando enlace:', error);
      return null;
    }
  }

  /**
   * Obtener historial de auditoría para una entidad
   */
  async getEntityHistory(entityId: string, entityType?: AuditEntityType): Promise<AuditLogEntry[]> {
    try {
      const logs = await localDb.audit_logs?.toArray() || [];
      
      return logs
        .filter(log => 
          log.record_id === entityId || 
          (entityType && log.entityType === entityType)
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  }

  /**
   * Obtener historial de auditoría para una transacción
   */
  async getTransactionHistory(transactionId: string): Promise<AuditLogEntry[]> {
    try {
      const logs = await localDb.audit_logs?.toArray() || [];
      
      return logs
        .filter(log => log.transaction_id === transactionId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  }

  /**
   * Obtener documentos relacionados
   */
  async getRelatedDocuments(
    entityType: AuditEntityType,
    entityId: string
  ): Promise<DocumentLink[]> {
    // Por ahora retorna array vacío - implementar cuando se use la tabla document_links
    console.log(`[AuditLog] Obteniendo documentos relacionados para ${entityType}:${entityId}`);
    return [];
  }

  /**
   * Reporte de auditoría por período
   */
  async getAuditReport(params: {
    startDate: string;
    endDate: string;
    entityType?: AuditEntityType;
    action?: AuditAction;
    userId?: string;
  }): Promise<AuditLogEntry[]> {
    try {
      const logs = await localDb.audit_logs?.toArray() || [];
      const companyId = companyContext.getCompanyId();

      return logs.filter(log => {
        if (log.company_id !== companyId) return false;
        if (log.created_at < params.startDate || log.created_at > params.endDate) return false;
        if (params.entityType && log.entity_type !== params.entityType) return false;
        if (params.action && log.action !== params.action) return false;
        if (params.userId && log.user_id !== params.userId) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  /**
   * Estadísticas de auditoría
   */
  async getAuditStats(companyId?: string): Promise<{
    totalEntries: number;
    byAction: Record<AuditAction, number>;
    byEntity: Record<AuditEntityType, number>;
  }> {
    try {
      const cid = companyId || companyContext.getCompanyId();
      const logs = await localDb.audit_logs?.toArray() || [];
      
      const filtered = cid ? logs.filter(l => l.company_id === cid) : logs;

      const byAction: Record<AuditAction, number> = {
        CREATE: 0, UPDATE: 0, DELETE: 0, APPROVE: 0,
        REJECT: 0, POST: 0, CANCEL: 0, VIEW: 0, EXPORT: 0,
      };

      const byEntity: Record<AuditEntityType, number> = {
        TRANSACTION: 0, INVOICE: 0, ORDER: 0, PRODUCT: 0,
        EMPLOYEE: 0, PAYMENT: 0, WORKFLOW: 0, LEDGER_ENTRY: 0,
        JOURNAL_ENTRY: 0, COMPANY: 0, USER: 0,
      };

      filtered.forEach(log => {
        byAction[log.action as AuditAction] = (byAction[log.action as AuditAction] || 0) + 1;
        byEntity[log.entity_type as AuditEntityType] = (byEntity[log.entity_type as AuditEntityType] || 0) + 1;
      });

      return {
        totalEntries: filtered.length,
        byAction,
        byEntity,
      };
    } catch {
      return { totalEntries: 0, byAction: {} as any, byEntity: {} as any };
    }
  }
}

export const auditLog = AuditLogServiceClass.getInstance();
export default auditLog;