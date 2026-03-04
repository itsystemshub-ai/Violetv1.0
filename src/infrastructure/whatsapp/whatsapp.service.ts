/**
 * WhatsApp Service - Stub para frontend
 */

export async function notifyOrderWhatsApp(order: any): Promise<void> {
  console.log('[WhatsApp] Notificando pedido:', order);
  // Stub: en producción enviaría mensaje por WhatsApp API
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  console.log('[WhatsApp] Enviando mensaje a:', to, message);
  // Stub: en producción usaría WhatsApp Business API
}
