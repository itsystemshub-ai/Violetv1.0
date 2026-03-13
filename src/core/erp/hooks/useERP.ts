/**
 * useERP Hook - Hook de React para acceder al ERP Core
 * 
 * Proporciona una interfaz React para todas las funcionalidades del ERP.
 * 
 * @module core/erp/hooks/useERP
 */

import { useCallback } from 'react';
import { useCompanyContext, type Company } from '../company-context/CompanyContext';
import { eventBus, ERP_EVENTS, type ERPEventType } from '../event-bus/EventBus';
import { transactionEngine, type TransactionType, type TransactionStatus } from '../transaction-engine/TransactionEngine';
import { workflowEngine, type WorkflowType } from '../workflow-engine/WorkflowEngine';
import { accountingBridge } from '../accounting-bridge/AccountingBridge';
import { auditLog, type AuditEntityType, type AuditAction } from '../audit-log/AuditLogService';

export interface UseERPOptions {
  module: string;
  userId?: string;
  userName?: string;
}

/**
 * Hook principal para usar el ERP en componentes React
 */
export function useERP(options: UseERPOptions) {
  const { module } = options;
  
  // Company Context
  const { 
    activeCompany, 
    isCompanySelected, 
    setCompany, 
    clearCompany 
  } = useCompanyContext();

  // Transaction Engine
  const createTransaction = useCallback(async (
    type: TransactionType,
    transactionOptions?: {
      status?: TransactionStatus;
      notes?: string;
      metadata?: Record<string, unknown>;
      emitEvents?: boolean;
    }
  ) => {
    const result = await transactionEngine.createTransaction(
      type,
      module,
      transactionOptions
    );

    // Registrar auditoría
    if (result.success && result.transaction) {
      await auditLog.log({
        entityType: 'TRANSACTION',
        entityId: result.transaction.id,
        action: 'CREATE',
        description: `Transacción ${type} creada desde módulo ${module}`,
        transactionId: result.transaction.id,
        userId: options.userId,
        userName: options.userName,
        newValue: result.transaction,
      });
    }

    return result;
  }, [module, options.userId, options.userName]);

  const updateTransactionStatus = useCallback(async (
    transactionId: string,
    newStatus: TransactionStatus,
    auditOptions?: { notes?: string }
  ) => {
    const result = await transactionEngine.updateTransactionStatus(
      transactionId,
      newStatus,
      { notes: auditOptions?.notes, emitEvents: true }
    );

    if (result.success && result.transaction) {
      await auditLog.log({
        entityType: 'TRANSACTION',
        entityId: transactionId,
        action: newStatus === 'CANCELLED' ? 'CANCEL' : 'UPDATE',
        description: `Transacción actualizada a ${newStatus}`,
        transactionId,
        userId: options.userId,
        userName: options.userName,
        newValue: result.transaction,
      });
    }

    return result;
  }, [options.userId, options.userName]);

  // Event Bus
  const emitEvent = useCallback((
    eventType: ERPEventType,
    payload: unknown,
    additionalOptions?: {
      transactionId?: string;
    }
  ) => {
    eventBus.emit(eventType, payload, {
      sourceModule: module,
      transactionId: additionalOptions?.transactionId,
      companyId: activeCompany?.id,
    });
  }, [module, activeCompany?.id]);

  const subscribeToEvent = useCallback((
    eventType: string,
    handler: (event: any) => void | Promise<void>
  ) => {
    return eventBus.on(eventType, handler, module);
  }, [module]);

  // Workflow Engine
  const createWorkflow = useCallback(async (
    type: WorkflowType,
    documentId: string,
    documentType: string,
    workflowOptions?: {
      documentAmount?: number;
      customSteps?: any[];
    }
  ) => {
    if (!options.userId) {
      throw new Error('Se requiere userId para crear un workflow');
    }

    const result = await workflowEngine.createWorkflow(
      type,
      documentId,
      documentType,
      options.userId,
      workflowOptions
    );

    if (result.success && result.workflow) {
      await auditLog.log({
        entityType: 'WORKFLOW',
        entityId: result.workflow.id,
        action: 'CREATE',
        description: `Workflow ${type} iniciado para ${documentType}:${documentId}`,
        userId: options.userId,
        userName: options.userName,
        newValue: result.workflow,
      });
    }

    return result;
  }, [options.userId, options.userName]);

  const approveWorkflowStep = useCallback(async (
    workflowId: string,
    comments?: string
  ) => {
    if (!options.userId) {
      throw new Error('Se requiere userId para aprobar');
    }

    const result = await workflowEngine.approveStep(workflowId, options.userId, comments);

    if (result.success) {
      await auditLog.log({
        entityType: 'WORKFLOW',
        entityId: workflowId,
        action: 'APPROVE',
        description: `Paso de workflow aprobado por ${options.userName || options.userId}`,
        userId: options.userId,
        userName: options.userName,
        newValue: result.workflow,
      });
    }

    return result;
  }, [options.userId, options.userName]);

  // Accounting Bridge
  const createLedgerEntry = useCallback(async (data: {
    date: string;
    description: string;
    reference?: string;
    debitAccountCode: string;
    creditAccountCode: string;
    amount: number;
    currency?: 'USD' | 'VES';
    exchangeRate?: number;
    taxAmount?: number;
    taxType?: 'IVA' | 'IGTF' | 'NONE';
  }) => {
    const transactionResult = await transactionEngine.createTransaction(
      'LEDGER_ENTRY',
      module,
      { emitEvents: false }
    );

    if (!transactionResult.success) {
      return { success: false, error: transactionResult.error };
    }

    const result = await accountingBridge.createLedgerEntry({
      ...data,
      transactionId: transactionResult.transaction!.id,
      createdBy: options.userId,
    });

    if (result.success && result.entry) {
      await auditLog.log({
        entityType: 'LEDGER_ENTRY',
        entityId: result.entry.id,
        action: 'CREATE',
        description: `Asiento contable: ${data.description}`,
        transactionId: transactionResult.transaction!.id,
        userId: options.userId,
        userName: options.userName,
        newValue: result.entry,
      });
    }

    return result;
  }, [module, options.userId, options.userName]);

  const getAccountBalance = useCallback(async (accountCode: string) => {
    return accountingBridge.getAccountBalance(accountCode);
  }, []);

  // Audit
  const logAction = useCallback(async (
    entityType: AuditEntityType,
    entityId: string,
    action: AuditAction,
    description: string,
    additionalOptions?: {
      previousValue?: Record<string, unknown>;
      newValue?: Record<string, unknown>;
    }
  ) => {
    const transactionResult = await transactionEngine.createTransaction(
      'JOURNAL_ENTRY',
      module,
      { emitEvents: false }
    );

    return auditLog.log({
      entityType,
      entityId,
      action,
      description,
      transactionId: transactionResult.success ? transactionResult.transaction?.id : undefined,
      userId: options.userId,
      userName: options.userName,
      previousValue: additionalOptions?.previousValue,
      newValue: additionalOptions?.newValue,
    });
  }, [module, options.userId, options.userName]);

  // Initialize ERP for company
  const initializeERP = useCallback(async () => {
    if (!activeCompany?.id) {
      throw new Error('No hay empresa seleccionada');
    }

    console.log(`[useERP] Inicializando ERP para empresa: ${activeCompany.name}`);
    
    // Inicializar workflows
    await workflowEngine.initializeWorkflows(activeCompany.id);
    
    // Inicializar plan de cuentas
    await accountingBridge.initializeChartOfAccounts(activeCompany.id);
    
    console.log('[useERP] ✅ ERP inicializado');
  }, [activeCompany]);

  return {
    // Company
    company: activeCompany,
    hasCompany: isCompanySelected,
    setCompany,
    clearCompany,
    
    // Transactions
    createTransaction,
    updateTransactionStatus,
    
    // Events
    emitEvent,
    subscribeToEvent,
    ERP_EVENTS,
    
    // Workflows
    createWorkflow,
    approveWorkflowStep,
    
    // Accounting
    createLedgerEntry,
    getAccountBalance,
    
    // Audit
    logAction,
    
    // Initialization
    initializeERP,
  };
}

/**
 * Hook para escuchar eventos del ERP
 */
export function useERPEvent(
  eventType: string,
  handler: (event: any) => void | Promise<void>,
  deps: React.DependencyList = []
) {
  const { subscribeToEvent } = useERP({ module: 'listener' });
  
  // Este hook se debe usar con useEffect
  return subscribeToEvent(eventType, handler);
}

export default useERP;