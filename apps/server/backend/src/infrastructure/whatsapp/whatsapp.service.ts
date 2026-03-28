/**
 * whatsappService.ts
 * Envía mensajes de WhatsApp usando CallMeBot API.
 * Gratis: ~100 mensajes/día. Requiere registro en callmebot.com.
 * Requiere: VITE_CALLMEBOT_APIKEY en .env
 */

export const sendWhatsApp = async (phone: string, message: string) => {
  const apiKey = import.meta.env.VITE_CALLMEBOT_APIKEY;
  if (!apiKey) {
    console.warn("[whatsappService] VITE_CALLMEBOT_APIKEY no configurada.");
    return;
  }

  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;

  try {
    await fetch(url);
  } catch (err) {
    console.warn("[whatsappService] Error al enviar WhatsApp:", err);
  }
};

/** Notifica al cliente la confirmación de su pedido */
export const notifyOrderWhatsApp = async (
  phone: string,
  invoiceNumber: string,
  total: number,
  currency = "USD"
) => {
  const msg =
    `✅ *Cauplas ERP*\n` +
    `Su pedido *${invoiceNumber}* ha sido procesado exitosamente.\n` +
    `💰 Total: ${total.toFixed(2)} ${currency}\n` +
    `Gracias por su preferencia. 🚛`;
  return sendWhatsApp(phone, msg);
};
