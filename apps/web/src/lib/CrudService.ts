/**
 * Servicio CRUD genérico
 * Proporciona operaciones CRUD reutilizables para cualquier entidad
 */

import { toast } from 'sonner';
import { SyncService } from "@/core/sync/SyncService";
import { GenericMapper } from './DataMapper';
import type { CrudResponse, SyncMutationResult } from '@/types/database.types';

/**
 * Opciones de configuración para CrudService
 */
export interface CrudServiceOptions<TFrontend, TDB> {
  tableName: string;
  mapper: GenericMapper<TFrontend, TDB>;
  entityName: string; // Nombre para mensajes (ej: "producto", "factura")
  entityNamePlural?: string; // Nombre plural (ej: "productos", "facturas")
}

/**
 * Servicio CRUD genérico
 */
export class CrudService<TFrontend extends { id?: string }, TDB extends { id?: string }> {
  private tableName: string;
  private mapper: GenericMapper<TFrontend, TDB>;
  private entityName: string;
  private entityNamePlural: string;

  constructor(options: CrudServiceOptions<TFrontend, TDB>) {
    this.tableName = options.tableName;
    this.mapper = options.mapper;
    this.entityName = options.entityName;
    this.entityNamePlural = options.entityNamePlural || `${options.entityName}s`;
  }

  /**
   * Crea una nueva entidad
   */
  async create(
    data: Partial<TFrontend>,
    tenantId: string,
    showToast: boolean = true
  ): Promise<CrudResponse<TFrontend>> {
    try {
      const dbItem = this.mapper.toDB(data, tenantId);
      const tempId = crypto.randomUUID();

      const result = await SyncService.mutate(
        this.tableName,
        'INSERT',
        { ...dbItem, id: tempId },
        tempId
      ) as SyncMutationResult<TDB>;

      if (result.error) throw result.error;

      const newEntity = result.data
        ? this.mapper.fromDB(result.data)
        : { ...data, id: tempId } as TFrontend;

      if (showToast) {
        toast.success(`${this.capitalize(this.entityName)} creado exitosamente`);
      }

      return { success: true, data: newEntity };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error al crear ${this.entityName}`;
      console.error(`[CrudService:${this.tableName}] Create error:`, error);
      
      if (showToast) {
        toast.error(errorMessage);
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
      };
    }
  }

  /**
   * Actualiza una entidad existente
   */
  async update(
    id: string,
    updates: Partial<TFrontend>,
    tenantId: string,
    showToast: boolean = true
  ): Promise<CrudResponse<TFrontend>> {
    try {
      const dbItem = this.mapper.toDB(updates, tenantId);

      const result = await SyncService.mutate(
        this.tableName,
        'UPDATE',
        dbItem,
        id
      ) as SyncMutationResult<TDB>;

      if (result.error) throw result.error;

      const updatedEntity = result.data
        ? this.mapper.fromDB(result.data)
        : { ...updates, id } as TFrontend;

      if (showToast) {
        toast.success(`${this.capitalize(this.entityName)} actualizado exitosamente`);
      }

      return { success: true, data: updatedEntity };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error al actualizar ${this.entityName}`;
      console.error(`[CrudService:${this.tableName}] Update error:`, error);
      
      if (showToast) {
        toast.error(errorMessage);
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
      };
    }
  }

  /**
   * Elimina una entidad
   */
  async delete(
    id: string,
    showToast: boolean = true
  ): Promise<CrudResponse<void>> {
    try {
      const { error } = await SyncService.mutate(
        this.tableName,
        'DELETE',
        null,
        id
      );

      if (error) throw error;

      if (showToast) {
        toast.success(`${this.capitalize(this.entityName)} eliminado exitosamente`);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error al eliminar ${this.entityName}`;
      console.error(`[CrudService:${this.tableName}] Delete error:`, error);
      
      if (showToast) {
        toast.error(errorMessage);
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
      };
    }
  }

  /**
   * Crea múltiples entidades en lote
   */
  async createBulk(
    items: Partial<TFrontend>[],
    tenantId: string,
    showToast: boolean = true
  ): Promise<CrudResponse<TFrontend[]>> {
    try {
      const dbItems = this.mapper.toDBArray(items, tenantId);
      const results: TFrontend[] = [];

      // Procesar en lotes para evitar sobrecarga
      const batchSize = 100;
      for (let i = 0; i < dbItems.length; i += batchSize) {
        const batch = dbItems.slice(i, i + batchSize);
        
        for (const dbItem of batch) {
          const tempId = crypto.randomUUID();
          const result = await SyncService.mutate(
            this.tableName,
            'INSERT',
            { ...dbItem, id: tempId },
            tempId
          ) as SyncMutationResult<TDB>;

          if (result.data) {
            results.push(this.mapper.fromDB(result.data));
          }
        }
      }

      if (showToast) {
        toast.success(`${results.length} ${this.entityNamePlural} creados exitosamente`);
      }

      return { success: true, data: results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error al crear ${this.entityNamePlural}`;
      console.error(`[CrudService:${this.tableName}] CreateBulk error:`, error);
      
      if (showToast) {
        toast.error(errorMessage);
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
      };
    }
  }

  /**
   * Capitaliza la primera letra
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Factory para crear servicios CRUD
 */
export const createCrudService = <TFrontend extends { id?: string }, TDB extends { id?: string }>(
  options: CrudServiceOptions<TFrontend, TDB>
): CrudService<TFrontend, TDB> => {
  return new CrudService(options);
};
