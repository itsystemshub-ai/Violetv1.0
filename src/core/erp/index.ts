/**
 * ERP Core - Índice Central
 * 
 * Este archivo exporta todos los módulos del núcleo ERP para facilitar
 * la importación en otras partes de la aplicación.
 * 
 * @module core/erp
 */

// Company Context
export * from './company-context/CompanyContext';

// Event Bus
export * from './event-bus/EventBus';

// Transaction Engine
export * from './transaction-engine/TransactionEngine';

// Workflow Engine
export * from './workflow-engine/WorkflowEngine';

// Accounting Bridge
export * from './accounting-bridge/AccountingBridge';

// Audit Log
export * from './audit-log/AuditLogService';

// Event Reactor - Reacciones automáticas
export * from './event-reactor/EventReactor';

// Hooks
export * from './hooks';

/**
 * ERP Instance - Acceso directo al núcleo ERP
 * 
 * Proporciona una interfaz unificada para todas las funcionalidades del ERP.
 * 
 * @example
 * ```typescript
 * import { erp } from '@/core/erp';
 * 
 * // Seleccionar empresa
 * erp.setCompany(company);
 * 
 * // Crear transacción
 * const result = await erp.createTransaction('SALE', 'sales', { emitEvents: true });
 * 
 * // Escuchar eventos
 * erp.on('SALE.created', (event) => { console.log(event); });
 * ```
 */
export const erp = {
  // Company Context
  setCompany: (company: any) => {
    const { useCompanyContext } = require('./company-context/CompanyContext');
    useCompanyContext.getState().setCompany(company);
  },
  clearCompany: () => {
    const { useCompanyContext } = require('./company-context/CompanyContext');
    useCompanyContext.getState().clearCompany();
  },
  getCompany: () => {
    const { useCompanyContext } = require('./company-context/CompanyContext');
    return useCompanyContext.getState().activeCompany;
  },
  getCompanyId: () => {
    const { useCompanyContext } = require('./company-context/CompanyContext');
    return useCompanyContext.getState().activeCompany?.id || null;
  },

  // Transaction Engine
  createTransaction: async (type: any, originModule: string, options?: any) => {
    const { transactionEngine } = require('./transaction-engine/TransactionEngine');
    return transactionEngine.createTransaction(type, originModule, options);
  },
  updateTransactionStatus: async (transactionId: string, status: any, options?: any) => {
    const { transactionEngine } = require('./transaction-engine/TransactionEngine');
    return transactionEngine.updateTransactionStatus(transactionId, status, options);
  },

  // Event Bus
  emit: (eventType: string, payload: any, options: any) => {
    const { eventBus } = require('./event-bus/EventBus');
    eventBus.emit(eventType, payload, options);
  },
  on: (eventType: string, handler: any, module: string) => {
    const { eventBus } = require('./event-bus/EventBus');
    return eventBus.on(eventType, handler, module);
  },

  // Workflow Engine
  createWorkflow: async (type: any, documentId: string, documentType: string, userId: string, options?: any) => {
    const { workflowEngine } = require('./workflow-engine/WorkflowEngine');
    return workflowEngine.createWorkflow(type, documentId, documentType, userId, options);
  },
  approveWorkflow: async (workflowId: string, approverId: string, comments?: string) => {
    const { workflowEngine } = require('./workflow-engine/WorkflowEngine');
    return workflowEngine.approveStep(workflowId, approverId, comments);
  },

  // Accounting Bridge
  createLedgerEntry: async (data: any) => {
    const { accountingBridge } = require('./accounting-bridge/AccountingBridge');
    return accountingBridge.createLedgerEntry(data);
  },
  createJournalEntry: async (data: any) => {
    const { accountingBridge } = require('./accounting-bridge/AccountingBridge');
    return accountingBridge.createJournalEntry(data);
  },
  getAccountBalance: async (accountCode: string) => {
    const { accountingBridge } = require('./accounting-bridge/AccountingBridge');
    return accountingBridge.getAccountBalance(accountCode);
  },

  // Audit Log
  logAudit: async (params: any) => {
    const { auditLog } = require('./audit-log/AuditLogService');
    return auditLog.log(params);
  },
  getAuditHistory: async (entityId: string) => {
    const { auditLog } = require('./audit-log/AuditLogService');
    return auditLog.getEntityHistory(entityId);
  },

  // Initialization
  initialize: async (companyId: string) => {
    const { workflowEngine } = require('./workflow-engine/WorkflowEngine');
    const { accountingBridge } = require('./accounting-bridge/AccountingBridge');
    
    console.log('[ERP] Inicializando módulos...');
    
    // Inicializar workflows
    await workflowEngine.initializeWorkflows(companyId);
    
    // Inicializar plan de cuentas
    await accountingBridge.initializeChartOfAccounts(companyId);
    
    console.log('[ERP] ✅ Módulos inicializados');
  },
};

export default erp;