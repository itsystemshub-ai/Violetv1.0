import axios from "axios";
import { localDb } from "@/core/database/localDb";

/**
 * AutomationHub - Orquestador avanzado para n8n Enterprise
 * Maneja:
 * 1. Self-Healing Webhooks (Cola en IndexedDB si n8n está offline)
 * 2. AI Payload Decoration (Contextualización automática)
 * 3. Retry Logic inteligente
 */

interface AutomationEvent {
  id?: number;
  webhookUrl: string;
  payload: any;
  retries: number;
  status: "pending" | "failed" | "sent";
  timestamp: number;
}

class AutomationHub {
  private static instance: AutomationHub;
  private isProcessing = false;

  private constructor() {
    this.startQueueListener();
  }

  public static getInstance(): AutomationHub {
    if (!AutomationHub.instance) {
      AutomationHub.instance = new AutomationHub();
    }
    return AutomationHub.instance;
  }

  /**
   * Dispara un evento hacia n8n con decoración de IA y manejo de fallos
   */
  public async trigger(webhookPath: string, payload: any): Promise<void> {
    const webhookUrl = `${import.meta.env.VITE_N8N_WEBHOOK_URL}${webhookPath}`;

    // 1. AI Payload Decoration (Inyectar contexto local para la IA de n8n)
    const decoratedPayload = {
      ...payload,
      _metadata: {
        appVersion: "3.0.0-stitch-pro",
        environment: import.meta.env.MODE,
        timestamp: new Date().toISOString(),
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    try {
      // 2. Intento de envío inmediato
      console.log(`[AutomationHub] 📡 Enviando a n8n: ${webhookPath}`);
      await axios.post(webhookUrl, decoratedPayload);
      console.log(`[AutomationHub] ✅ Evento procesado con éxito`);
    } catch (error) {
      // 3. Self-Healing: Si falla, encolar en la base de datos local
      console.warn(
        `[AutomationHub] ⚠️ n8n offline o error. Encolando para reintento.`,
      );
      await this.enqueueEvent({
        webhookUrl,
        payload: decoratedPayload,
        retries: 0,
        status: "pending",
        timestamp: Date.now(),
      });
    }
  }

  private async enqueueEvent(event: AutomationEvent) {
    // Nota: Asume que localDb tiene una tabla 'automation_queue'
    // Si no existe, fallará silenciosamente o se debe crear en la migración de la DB
    try {
      // @ts-ignore - Acceso dinámico si la tabla se agregó recientemente
      await localDb.table("automation_queue").add(event);
    } catch (e) {
      console.error("[AutomationHub] Error al encolar evento:", e);
    }
  }

  private startQueueListener() {
    // Monitorizar la cola cada 30 segundos si hay conexión a internet
    setInterval(async () => {
      if (navigator.onLine && !this.isProcessing) {
        await this.processQueue();
      }
    }, 30000);
  }

  private async processQueue() {
    this.isProcessing = true;
    try {
      // @ts-ignore
      const pendingEvents = await localDb
        .table("automation_queue")
        .where("status")
        .equals("pending")
        .toArray();

      for (const event of pendingEvents) {
        try {
          await axios.post(event.webhookUrl, event.payload);
          // @ts-ignore
          await localDb
            .table("automation_queue")
            .update(event.id, { status: "sent" });
        } catch (err) {
          const newRetries = event.retries + 1;
          if (newRetries > 5) {
            // @ts-ignore
            await localDb
              .table("automation_queue")
              .update(event.id, { status: "failed" });
          } else {
            // @ts-ignore
            await localDb
              .table("automation_queue")
              .update(event.id, { retries: newRetries });
          }
        }
      }
    } catch (e) {
      console.error("[AutomationHub] Error procesando cola:", e);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const automationHub = AutomationHub.getInstance();
