/**
 * Violet ERP - JobQueueService
 * Sistema de cola de trabajos en segundo plano
 */

import { createLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('JobQueueService');

/**
 * Estados posibles de un trabajo
 */
export const JobStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRY: 'retry',
};

/**
 * Tipos de trabajos disponibles
 */
export const JobType = {
  SYNC_DATA: 'sync_data',
  GENERATE_REPORT: 'generate_report',
  SEND_EMAIL: 'send_email',
  BACKUP_DATABASE: 'backup_database',
  CLEANUP_OLD_DATA: 'cleanup_old_data',
  PROCESS_BATCH: 'process_batch',
  CUSTOM: 'custom',
};

/**
 * Clase principal de la cola de trabajos
 */
class JobQueueService {
  constructor() {
    this.jobs = new Map();
    this.workers = new Map();
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000;
    this.processInterval = 5000;
    this.processTimer = null;
    this.jobHandlers = new Map();
  }

  /**
   * Inicializar servicio
   */
  initialize(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 5000;
    this.processInterval = options.processInterval || 5000;

    logger.info(`JobQueueService initialized (interval: ${this.processInterval}ms)`);

    // Iniciar procesamiento automático
    this.start();
  }

  /**
   * Registrar handler para un tipo de trabajo
   */
  registerHandler(jobType, handler) {
    this.jobHandlers.set(jobType, handler);
    logger.info(`Handler registered for job type: ${jobType}`);
  }

  /**
   * Agregar trabajo a la cola
   */
  async addJob(jobData) {
    const job = {
      id: jobData.id || uuidv4(),
      type: jobData.type,
      data: jobData.data,
      status: JobStatus.PENDING,
      priority: jobData.priority || 0,
      attempts: 0,
      maxRetries: jobData.maxRetries || this.maxRetries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      error: null,
      result: null,
    };

    this.jobs.set(job.id, job);

    logger.info(`Job added: ${job.id} (type: ${job.type}, priority: ${job.priority})`);

    return job;
  }

  /**
   * Obtener trabajo por ID
   */
  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  /**
   * Obtener todos los trabajos con filtro
   */
  getJobs(options = {}) {
    const { status, type, limit = 100 } = options;

    let jobs = Array.from(this.jobs.values());

    if (status) {
      jobs = jobs.filter(j => j.status === status);
    }

    if (type) {
      jobs = jobs.filter(j => j.type === type);
    }

    // Ordenar por prioridad y fecha
    jobs.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return jobs.slice(0, limit);
  }

  /**
   * Procesar siguiente trabajo pendiente
   */
  async processNext() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Obtener trabajos pendientes ordenados por prioridad
      const pendingJobs = this.getJobs({ status: JobStatus.PENDING, limit: 1 });

      if (pendingJobs.length === 0) return;

      const job = pendingJobs[0];

      // Obtener handler
      const handler = this.jobHandlers.get(job.type);

      if (!handler) {
        logger.warn(`No handler registered for job type: ${job.type}`);
        await this.failJob(job.id, new Error(`No handler for type: ${job.type}`));
        return;
      }

      // Actualizar estado a processing
      await this.updateJobStatus(job.id, JobStatus.PROCESSING);
      job.startedAt = new Date().toISOString();

      try {
        // Ejecutar handler
        const result = await handler(job.data);

        // Completar trabajo
        await this.completeJob(job.id, result);
        logger.info(`Job completed: ${job.id}`);
      } catch (error) {
        logger.error(`Job failed: ${job.id}`, error);
        await this.handleJobError(job.id, error);
      }
    } catch (error) {
      logger.error('Error processing job queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Actualizar estado del trabajo
   */
  async updateJobStatus(jobId, status, additionalData = {}) {
    const job = this.jobs.get(jobId);

    if (!job) {
      logger.warn(`Job not found: ${jobId}`);
      return;
    }

    job.status = status;
    job.updatedAt = new Date().toISOString();

    if (additionalData.error) job.error = additionalData.error;
    if (additionalData.result) job.result = additionalData.result;
    if (additionalData.attempts !== undefined) job.attempts = additionalData.attempts;

    this.jobs.set(jobId, job);
  }

  /**
   * Completar trabajo exitosamente
   */
  async completeJob(jobId, result) {
    await this.updateJobStatus(jobId, JobStatus.COMPLETED, { result });

    const job = this.jobs.get(jobId);
    job.completedAt = new Date().toISOString();
    this.jobs.set(jobId, job);
  }

  /**
   * Manejar error de trabajo
   */
  async handleJobError(jobId, error) {
    const job = this.jobs.get(jobId);

    if (!job) return;

    job.attempts++;

    if (job.attempts < job.maxRetries) {
      // Reintentar
      await this.updateJobStatus(jobId, JobStatus.RETRY, {
        error: error.message,
        attempts: job.attempts,
      });

      logger.info(`Job ${jobId} scheduled for retry (${job.attempts}/${job.maxRetries})`);

      // Reintentar después del delay
      setTimeout(() => {
        job.status = JobStatus.PENDING;
        this.jobs.set(jobId, job);
      }, this.retryDelay);
    } else {
      // Fallar permanentemente
      await this.failJob(jobId, error);
    }
  }

  /**
   * Fallar trabajo permanentemente
   */
  async failJob(jobId, error) {
    await this.updateJobStatus(jobId, JobStatus.FAILED, {
      error: error.message,
    });

    const job = this.jobs.get(jobId);
    job.completedAt = new Date().toISOString();
    this.jobs.set(jobId, job);

    logger.error(`Job permanently failed: ${jobId} - ${error.message}`);
  }

  /**
   * Eliminar trabajo completado/fallido
   */
  async removeJob(jobId) {
    const job = this.jobs.get(jobId);

    if (!job) {
      logger.warn(`Job not found: ${jobId}`);
      return false;
    }

    if (job.status === JobStatus.PENDING || job.status === JobStatus.PROCESSING) {
      logger.warn(`Cannot remove job in ${job.status} status`);
      return false;
    }

    this.jobs.delete(jobId);
    logger.info(`Job removed: ${jobId}`);
    return true;
  }

  /**
   * Limpiar trabajos completados/fallidos antiguos
   */
  async cleanupOldJobs(maxAgeHours = 24) {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let removed = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) &&
        new Date(job.completedAt).getTime() < cutoffTime
      ) {
        this.jobs.delete(id);
        removed++;
      }
    }

    logger.info(`Cleaned up ${removed} old jobs`);
    return removed;
  }

  /**
   * Iniciar procesamiento automático
   */
  start() {
    if (this.processTimer) {
      logger.warn('JobQueueService already started');
      return;
    }

    this.processTimer = setInterval(() => {
      this.processNext();
    }, this.processInterval);

    logger.info('JobQueueService started');
  }

  /**
   * Detener procesamiento
   */
  stop() {
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
      logger.info('JobQueueService stopped');
    }
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());

    return {
      total: jobs.length,
      byStatus: {
        pending: jobs.filter(j => j.status === JobStatus.PENDING).length,
        processing: jobs.filter(j => j.status === JobStatus.PROCESSING).length,
        completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
        failed: jobs.filter(j => j.status === JobStatus.FAILED).length,
        retry: jobs.filter(j => j.status === JobStatus.RETRY).length,
      },
      byType: jobs.reduce((acc, job) => {
        acc[job.type] = (acc[job.type] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  /**
   * Cancelar trabajo pendiente
   */
  async cancelJob(jobId) {
    const job = this.jobs.get(jobId);

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    if (job.status === JobStatus.PROCESSING) {
      return { success: false, error: 'Cannot cancel processing job' };
    }

    await this.updateJobStatus(jobId, JobStatus.FAILED, {
      error: 'Cancelled by user',
    });

    logger.info(`Job cancelled: ${jobId}`);
    return { success: true };
  }

  /**
   * Reintentar trabajo fallido
   */
  async retryJob(jobId) {
    const job = this.jobs.get(jobId);

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    if (job.status !== JobStatus.FAILED) {
      return { success: false, error: 'Job is not in failed status' };
    }

    job.status = JobStatus.PENDING;
    job.attempts = 0;
    job.error = null;
    job.updatedAt = new Date().toISOString();

    this.jobs.set(jobId, job);

    logger.info(`Job retry scheduled: ${jobId}`);
    return { success: true };
  }
}

// Singleton
export const jobQueueService = new JobQueueService();
export default jobQueueService;
