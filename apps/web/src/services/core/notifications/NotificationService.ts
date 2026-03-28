/**
 * Transversal Service: Notifications Orchestrator
 * Connects to external Email/SMS/WhatsApp providers defined by the Super User.
 */
import { toast } from "sonner";

export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "IN_APP";

export interface NotificationPayload {
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  priority: "LOW" | "NORMAL" | "HIGH";
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async dispatch(payload: NotificationPayload): Promise<boolean> {
    console.log(`[Notification MS]: Dispatching ${payload.priority} message via ${payload.channel} to ${payload.recipient}...`);
    
    try {
      // Feature Flags read from Super Admin config
      const isChannelEnabled = this.checkChannelConfig(payload.channel);
      if (!isChannelEnabled) {
        console.warn(`[Notification MS]: Channel ${payload.channel} is disabled globally.`);
        return false;
      }

      // Simulate sending via ESB / external provider (SendGrid, Twilio, Meta)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (payload.channel === "IN_APP") {
        toast.info(payload.body, { description: payload.subject });
      }

      console.log(`[Notification MS]: Sent successfully.`);
      return true;
    } catch (e) {
      console.error(`[Notification MS]: Failed to dispatch.`, e);
      return false;
    }
  }

  private checkChannelConfig(channel: NotificationChannel): boolean {
    // In the future this reads from the "Fuente de la Verdad" (Configuración Centralizada)
    return true; 
  }
}

export const notifications = NotificationService.getInstance();
