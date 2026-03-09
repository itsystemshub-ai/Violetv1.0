/**
 * emailService.ts
 * Envía emails transaccionales con Resend.
 * Gratis: 3,000 emails/mes, 100/día.
 * Requiere: VITE_RESEND_API_KEY en .env
 */

const RESEND_URL = "https://api.resend.com/emails";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[]; // content = base64
}

export const sendEmail = async (options: SendEmailOptions) => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[emailService] VITE_RESEND_API_KEY no configurada.");
    return { error: "API key no configurada" };
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cauplas ERP <onboarding@resend.dev>",
        to: [options.to],
        subject: options.subject,
        html: options.html,
        ...(options.attachments && { attachments: options.attachments }),
      }),
    });
    return res.json();
  } catch (err) {
    console.error("[emailService] Error al enviar email:", err);
    return { error: err };
  }
};

interface InvoiceEmailOptions {
  to: string;
  customerName: string;
  invoiceNumber: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  iva: number;
  igtf: number;
  total: number;
  tenantName: string;
  pdfBase64?: string;
}

/** Envía un pedido/factura con tabla HTML detallada */
export const sendInvoiceEmail = async (options: InvoiceEmailOptions) => {
  const itemsHtml = options.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return sendEmail({
    to: options.to,
    subject: `📦 Pedido ${options.invoiceNumber} — ${options.tenantName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;">
        <h2 style="color: #7c3aed; margin-top: 0;">${options.tenantName}</h2>
        <p>Hola <strong>${options.customerName}</strong>,</p>
        <p>Tu pedido <strong style="color: #7c3aed;">#${options.invoiceNumber}</strong> ha sido generado con éxito.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Producto</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Cant.</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Unit.</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; border-top: 2px solid #f3f4f6; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #6b7280;">Subtotal:</span>
            <span style="font-weight: bold;">$${options.subtotal.toFixed(2)}</span>
          </div>
          ${options.iva > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="color: #6b7280;">IVA:</span><span style="font-weight: bold;">$${options.iva.toFixed(2)}</span></div>` : ""}
          ${options.igtf > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="color: #6b7280;">IGTF:</span><span style="font-weight: bold;">$${options.igtf.toFixed(2)}</span></div>` : ""}
          <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 18px; color: #7c3aed;">
            <span style="font-weight: bold;">Total:</span>
            <span style="font-weight: 900;">$${options.total.toFixed(2)}</span>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;" />
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-bottom: 0;">Este es un correo automático. Powered by Violet ERP · Cauplas Venezuela</p>
      </div>
    `,
    ...(options.pdfBase64 && {
      attachments: [{ filename: `Pedido_${options.invoiceNumber}.pdf`, content: options.pdfBase64 }],
    }),
  });
};
