import * as bcvService from './bcv';
import * as EmailService from './email';
import * as exportService from './export';
import * as pdfService from './pdf';
import * as weatherService from './weather';
import * as WhatsAppService from './whatsapp';
import { SyncEngine } from '../core/sync';

/**
 * Unified Service Registry
 * Centralizes access to all external integrations and core services.
 * This pattern allows for easier mocking during tests and unified dependency injection.
 */
export const ServiceRegistry = {
  bcv: bcvService,
  email: EmailService,
  export: exportService,
  pdf: pdfService,
  weather: weatherService,
  whatsapp: WhatsAppService,
  sync: SyncEngine,
};

export type IServiceRegistry = typeof ServiceRegistry;
