/**
 * Email Service - Stub para frontend
 */

export async function sendInvoiceEmail(invoice: any, recipient: string): Promise<void> {
  console.log('[Email] Enviando factura a:', recipient, invoice);
  // Stub: en producción usaría un servicio de email como SendGrid o AWS SES
}

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  console.log('[Email] Enviando email:', { to, subject, body });
  // Stub: en producción usaría un servicio de email
}
