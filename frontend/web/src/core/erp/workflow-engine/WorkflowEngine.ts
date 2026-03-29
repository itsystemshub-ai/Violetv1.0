/**
 * Workflow Engine - Motor de Workflows y Aprobaciones
 * 
 * Responsabilidad:
 * - Gestionar estados de documentos (draft → approved → posted)
 * - Controlar aprobaciones jerárquicas
 * - Validaciones de negocio
 * - Tracking de flujo de trabajo
 * 
 * @module core/erp/workflow-engine
 */

import { eventBus, ERP_EVENTS } from '../event-bus/EventBus';
import { companyContext } from '../company-context/CompanyContext';
import { localDb } from '@/core/database/localDb';

// Tipos de workflow
export type WorkflowType = 
  | 'PURCHASE_APPROVAL'
  | 'SALE_APPROVAL'
  | 'EXPENSE_APPROVAL'
  | 'INVENTORY_ADJUSTMENT'
  | 'RETURN_AUTHORIZATION';

export type WorkflowStatus = 
  | 'PENDING' 
  | 'IN_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'COMPLETED'
  | 'CANCELLED';

export interface WorkflowStep {
  stepOrder: number;
  role: string;
  approverId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  approvedAt?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  type: WorkflowType;
  steps: WorkflowStep[];
  companyId: string;
  isActive: boolean;
  createdAt: string;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  type: WorkflowType;
  status: WorkflowStatus;
  currentStep: number;
  documentId: string;
  documentType: string;
  documentAmount?: number;
  initiatedBy: string;
  companyId: string;
  steps: WorkflowStep[];
  comments: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface WorkflowResult {
  success: boolean;
  workflow?: WorkflowInstance;
  error?: Error;
}

// Definiciones de workflow por defecto
const DEFAULT_WORKFLOWS: Omit<WorkflowDefinition, 'id' | 'createdAt'>[] = [
  {
    name: 'Aprobación de Compra',
    type: 'PURCHASE_APPROVAL',
    steps: [
      { stepOrder: 1, role: 'GERENTE', status: 'PENDING' },
      { stepOrder: 2, role: 'ADMIN', status: 'PENDING' },
    ],
    companyId: '',
    isActive: true,
  },
  {
    name: 'Aprobación de Venta',
    type: 'SALE_APPROVAL',
    steps: [
      { stepOrder: 1, role: 'GERENTE', status: 'PENDING' },
    ],
    companyId: '',
    isActive: true,
  },
  {
    name: 'Ajuste de Inventario',
    type: 'INVENTORY_ADJUSTMENT',
    steps: [
      { stepOrder: 1, role: 'ALMACEN', status: 'PENDING' },
      { stepOrder: 2, role: 'GERENTE', status: 'PENDING' },
    ],
    companyId: '',
    isActive: true,
  },
];

class WorkflowEngineClass {
  private static instance: WorkflowEngineClass;
  private definitions: Map<string, WorkflowDefinition> = new Map();

  private constructor() {
    console.log('[WorkflowEngine] Inicializado');
  }

  static getInstance(): WorkflowEngineClass {
    if (!WorkflowEngineClass.instance) {
      WorkflowEngineClass.instance = new WorkflowEngineClass();
    }
    return WorkflowEngineClass.instance;
  }

  /**
   * Inicializar workflows por defecto para una empresa
   */
  async initializeWorkflows(companyId: string): Promise<void> {
    for (const workflow of DEFAULT_WORKFLOWS) {
      const definition: WorkflowDefinition = {
        ...workflow,
        id: `WF-${workflow.type}-${companyId}`,
        companyId,
        createdAt: new Date().toISOString(),
      };
      
      this.definitions.set(definition.id, definition);
      
      // Guardar en DB
      try {
        await localDb.workflow_definitions?.put({
          ...definition,
          is_dirty: true,
        });
      } catch (e) {
        // Tabla puede no existir aún
      }
    }
  }

  /**
   * Crear una nueva instancia de workflow
   */
  async createWorkflow(
    type: WorkflowType,
    documentId: string,
    documentType: string,
    initiatedBy: string,
    options: {
      documentAmount?: number;
      customSteps?: WorkflowStep[];
    } = {}
  ): Promise<WorkflowResult> {
    const companyId = companyContext.getCompanyId();
    
    if (!companyId) {
      return {
        success: false,
        error: new Error('No hay empresa seleccionada'),
      };
    }

    // Buscar definición del workflow
    let definition: WorkflowDefinition | undefined;
    
    for (const def of this.definitions.values()) {
      if (def.type === type && def.companyId === companyId) {
        definition = def;
        break;
      }
    }

    if (!definition) {
      // Crear definición por defecto
      const defaultDef = DEFAULT_WORKFLOWS.find(w => w.type === type);
      if (!defaultDef) {
        return {
          success: false,
          error: new Error(`Tipo de workflow ${type} no encontrado`),
        };
      }

      definition = {
        ...defaultDef,
        id: `WF-${type}-${companyId}`,
        companyId,
        createdAt: new Date().toISOString(),
      };
      this.definitions.set(definition.id, definition);
    }

    const workflowId = `WFI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const steps = options.customSteps || definition.steps.map(s => ({
      ...s,
      status: 'PENDING' as const,
    }));

    const workflow: WorkflowInstance = {
      id: workflowId,
      definitionId: definition.id,
      type,
      status: 'PENDING',
      currentStep: 0,
      documentId,
      documentType,
      documentAmount: options.documentAmount,
      initiatedBy,
      companyId,
      steps,
      comments: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await localDb.workflow_instances?.put({
        ...workflow,
        is_dirty: true,
      });

      // Emitir evento
      eventBus.emit(ERP_EVENTS.PURCHASE_ORDER_CREATED, workflow, {
        sourceModule: 'WorkflowEngine',
        companyId,
      });

      console.log(`[WorkflowEngine] ✅ Workflow creado: ${workflowId}`, { type, documentId });

      return { success: true, workflow };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Aprobar el paso actual del workflow
   */
  async approveStep(
    workflowId: string,
    approverId: string,
    comments?: string
  ): Promise<WorkflowResult> {
    try {
      const workflow = await localDb.workflow_instances?.get(workflowId);
      
      if (!workflow) {
        return { success: false, error: new Error(`Workflow ${workflowId} no encontrado`) };
      }

      if (workflow.status === 'COMPLETED' || workflow.status === 'CANCELLED') {
        return { success: false, error: new Error('Workflow ya completado o cancelado') };
      }

      const currentStep = workflow.steps[workflow.currentStep];
      
      // Marcar paso actual como aprobado
      currentStep.status = 'APPROVED';
      currentStep.approverId = approverId;
      currentStep.approvedAt = new Date().toISOString();
      if (comments) currentStep.comments = comments;

      // Determinar siguiente paso
      const nextStep = workflow.currentStep + 1;
      
      if (nextStep >= workflow.steps.length) {
        // Workflow completo
        workflow.status = 'COMPLETED';
        workflow.completedAt = new Date().toISOString();
      } else {
        workflow.status = 'IN_REVIEW';
        workflow.currentStep = nextStep;
      }

      workflow.updatedAt = new Date().toISOString();

      await localDb.workflow_instances?.update(workflowId, {
        ...workflow,
        is_dirty: true,
      });

      eventBus.emit(ERP_EVENTS.PURCHASE_ORDER_APPROVED, workflow, {
        sourceModule: 'WorkflowEngine',
        companyId: workflow.companyId,
      });

      console.log(`[WorkflowEngine] ✅ Paso aprobado en workflow ${workflowId}`);

      return { success: true, workflow };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Rechazar el workflow
   */
  async rejectWorkflow(
    workflowId: string,
    rejecterId: string,
    reason: string
  ): Promise<WorkflowResult> {
    try {
      const workflow = await localDb.workflow_instances?.get(workflowId);
      
      if (!workflow) {
        return { success: false, error: new Error(`Workflow ${workflowId} no encontrado`) };
      }

      workflow.status = 'REJECTED';
      workflow.updatedAt = new Date().toISOString();
      workflow.comments.push({
        id: Date.now().toString(),
        author: rejecterId,
        text: reason,
        timestamp: workflow.updatedAt,
      } as any);

      await localDb.workflow_instances?.update(workflowId, {
        status: 'REJECTED',
        updatedAt: workflow.updatedAt,
        is_dirty: true,
      });

      return { success: true, workflow };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Obtener workflows pendientes para un usuario
   */
  async getPendingWorkflows(userId: string, role: string): Promise<WorkflowInstance[]> {
    try {
      const workflows = await localDb.workflow_instances?.toArray() || [];
      
      return workflows.filter(w => {
        if (w.status !== 'PENDING' && w.status !== 'IN_REVIEW') return false;
        
        const currentStep = w.steps[w.currentStep];
        return currentStep?.role === role;
      });
    } catch {
      return [];
    }
  }

  /**
   * Obtener workflow por documento
   */
  async getWorkflowByDocument(documentId: string): Promise<WorkflowInstance | null> {
    try {
      const workflows = await localDb.workflow_instances
        ?.where('documentId')
        .equals(documentId)
        .toArray();
      
      return workflows?.[0] || null;
    } catch {
      return null;
    }
  }
}

export const workflowEngine = WorkflowEngineClass.getInstance();
export default workflowEngine;