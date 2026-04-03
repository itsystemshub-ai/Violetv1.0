# Módulo 07: INTEGRACIONES - Webhooks

## Descripción

Gestión de webhooks entrantes y salientes para integración en tiempo real con sistemas externos.

## 🔗 Conexiones

- **Todos los módulos** → Disparan webhooks
- **07-integraciones/n8n** → Procesan webhooks
- **07-integraciones/api-externas** → APIs que usan webhooks

---

## 📊 Modelo de Datos

```prisma
model Webhook {
  id          String   @id @default(cuid())
  name        String
  url         String
  secret      String?  // Para firmar payloads
  events      String[] // Eventos a escuchar
  isActive    Boolean  @default(true)
  headers     Json?    // Headers personalizados
  
  // Logs
  logs        WebhookLog[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WebhookLog {
  id          String   @id @default(cuid())
  webhookId   String
  webhook     Webhook @relation(fields: [webhookId], references: [id])
  event       String
  payload     Json
  response    Json?
  statusCode  Int?
  duration    Int?     // Milisegundos
  success     Boolean
  error       String?
  attempts    Int      @default(1)
  createdAt   DateTime @default(now())
}
```

---

## 📡 Webhooks Disponibles

### Ventas

```typescript
const salesWebhooks = {
  'sale.created': 'Cuando se crea una venta',
  'sale.invoiced': 'Cuando se factura una venta',
  'sale.cancelled': 'Cuando se cancela una venta',
  'payment.received': 'Cuando se recibe un pago',
};
```

### Inventario

```typescript
const inventoryWebhooks = {
  'stock.low': 'Cuando stock es bajo',
  'stock.out': 'Cuando se agota stock',
  'product.created': 'Cuando se crea producto',
  'product.updated': 'Cuando se actualiza producto',
};
```

### Compras

```typescript
const purchasesWebhooks = {
  'purchase.created': 'Cuando se crea compra',
  'purchase.received': 'Cuando se recibe mercancía',
  'purchase.invoice_received': 'Cuando llega factura',
};
```

---

## 🔧 Implementación

### Disparar Webhook

```typescript
// apps/backend/src/common/services/webhook.service.ts

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}
  
  async trigger(event: string, payload: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: event },
      },
    });
    
    for (const webhook of webhooks) {
      await this.sendWebhook(webhook, event, payload);
    }
  }
  
  private async sendWebhook(webhook: any, event: string, payload: any) {
    const signature = this.signPayload(payload, webhook.secret);
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        body: JSON.stringify(payload),
      });
      
      await this.logWebhook(webhook.id, event, payload, response, true);
    } catch (error) {
      await this.logWebhook(webhook.id, event, payload, null, false, error.message);
      await this.retryWebhook(webhook.id, event, payload);
    }
  }
  
  private signPayload(payload: any, secret: string): string {
    if (!secret) return '';
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}
```

### Recibir Webhook

```typescript
// apps/backend/src/modules/webhooks/webhooks.controller.ts

@Controller('webhooks')
export class WebhooksController {
  @Post(':event')
  async receiveWebhook(
    @Param('event') event: string,
    @Body() payload: any,
    @Headers() headers: any,
  ) {
    // Verificar firma
    const signature = headers['x-webhook-signature'];
    const isValid = await this.verifySignature(payload, signature);
    
    if (!isValid) {
      throw new UnauthorizedException('Firma inválida');
    }
    
    // Procesar webhook según evento
    switch (event) {
      case 'pago-confirmado':
        await this.handlePagoConfirmado(payload);
        break;
      case 'factura-aprobada':
        await this.handleFacturaAprobada(payload);
        break;
      // ... más eventos
    }
    
    return { success: true };
  }
}
```

---

## 📡 Endpoints Principales

```typescript
@Controller('webhooks')
export class WebhooksController {
  @Get()
  async getWebhooks() { }
  
  @Post()
  async createWebhook(@Body() dto: CreateWebhookDto) { }
  
  @Put(':id')
  async updateWebhook(@Param('id') id: string, @Body() dto: UpdateWebhookDto) { }
  
  @Delete(':id')
  async deleteWebhook(@Param('id') id: string) { }
  
  @Get(':id/logs')
  async getWebhookLogs(@Param('id') id: string) { }
  
  @Post(':id/test')
  async testWebhook(@Param('id') id: string) { }
  
  @Post(':event')
  async receiveWebhook(@Param('event') event: string, @Body() payload: any) { }
}
```

---

## ⚠️ Reglas de Negocio

1. **Firmas**: Todos los webhooks deben estar firmados
2. **Reintentos**: Reintentar 3 veces con backoff exponencial
3. **Logs**: Registrar todos los webhooks enviados/recibidos
4. **Timeout**: Timeout de 30 segundos para webhooks entrantes
5. **Rate Limiting**: Limitar webhooks entrantes por IP
6. **Validación**: Verificar origen de webhooks entrantes

---

**Anterior**: `07-integraciones/api-externas.md` | **Siguiente**: `02-operativo/flota.md`
