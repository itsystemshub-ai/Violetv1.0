# Módulo 07: INTEGRACIONES - APIs Externas

## Descripción

Integración con APIs externas para conexión con SENIAT, BCV, bancos y otros sistemas.

## 🔗 Conexiones

- **01-administrativo/impuestos** → SENIAT
- **01-administrativo/tesoreria** → BCV, Bancos
- **07-integraciones/n8n** → Automatización de integraciones

---

## 📊 APIs Soportadas

### 1. SENIAT (Facturación Electrónica)

```typescript
interface SENIATAPI {
  baseUrl: string;
  endpoints: {
    sendInvoice: '/api/v1/invoices',
    getStatus: '/api/v1/invoices/:id/status',
    cancelInvoice: '/api/v1/invoices/:id/cancel',
  };
  
  async sendInvoice(invoice: Invoice): Promise<SENIATResponse> {
    // Enviar factura al SENIAT
  }
}
```

### 2. BCV (Tipo de Cambio)

```typescript
interface BCVAPI {
  baseUrl: string;
  
  async getExchangeRate(date: string): Promise<number> {
    // Obtener tasa BCV del día
    // https://www.bcv.org.ve/
  }
}

// Implementación con API externa
const getBCVRate = async () => {
  const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
  const data = await response.json();
  return data.promedio; // Tasa promedio BCV
};
```

### 3. Bancos (Conciliación Automática)

```typescript
interface BankAPI {
  bank: string; // 'MERCANTIL', 'Banesco', 'Venezuela', etc.
  
  async getTransactions(from: Date, to: Date): Promise<BankTransaction[]> {
    // Obtener extracto bancario
  }
  
  async reconcile(systemTransactions: any[], bankTransactions: any[]): Promise<Reconciliation> {
    // Conciliar automáticamente
  }
}
```

### 4. Pasarelas de Pago

```typescript
interface PaymentGateway {
  provider: string; // 'PagoMóvil', 'Stripe', 'PayPal', 'Zelle'
  
  async processPayment(payment: Payment): Promise<PaymentResponse> {
    // Procesar pago
  }
  
  async getPaymentStatus(paymentId: string): Promise<string> {
    // Consultar estado del pago
  }
}
```

---

## 📡 Endpoints Principales

```typescript
@Controller('api-externas')
export class ApiExternasController {
  @Get('bcv/rate')
  async getBCVRate(@Query('date') date?: string) { }
  
  @Post('seniat/factura')
  async sendToSENIAT(@Body() invoice: Invoice) { }
  
  @Get('seniat/factura/:id/status')
  async getInvoiceStatus(@Param('id') id: string) { }
  
  @Post('bancos/conciliar')
  async reconcileBank(@Body() dto: ReconcileDto) { }
  
  @Get('bancos/:bank/transactions')
  async getBankTransactions(
    @Param('bank') bank: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) { }
  
  @Post('pagos/procesar')
  async processPayment(@Body() payment: Payment) { }
}
```

---

## 🔧 Configuración de APIs

```typescript
// apps/backend/src/config/external-apis.config.ts

export const externalApis = {
  seniat: {
    baseUrl: process.env.SENIAT_API_URL,
    apiKey: process.env.SENIAT_API_KEY,
    timeout: 30000,
  },
  
  bcv: {
    baseUrl: 'https://ve.dolarapi.com',
    timeout: 10000,
  },
  
  banks: {
    mercantil: {
      baseUrl: process.env.MERCANTIL_API_URL,
      apiKey: process.env.MERCANTIL_API_KEY,
    },
    banesco: {
      baseUrl: process.env.BANESCO_API_URL,
      apiKey: process.env.BANESCO_API_KEY,
    },
  },
  
  paymentGateways: {
    stripe: {
      apiKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      sandbox: process.env.NODE_ENV === 'development',
    },
  },
};
```

---

## ⚠️ Reglas de Negocio

1. **Timeouts**: Todas las APIs externas deben tener timeout configurado
2. **Retry**: Reintentar automáticamente si falla (máximo 3 intentos)
3. **Logs**: Registrar todas las llamadas a APIs externas
4. **Cache**: Cachear respuestas de BCV por 1 hora
5. **Seguridad**: Encriptar credenciales de APIs
6. **Circuit Breaker**: No saturar APIs externas si están caídas

---

**Anterior**: `06-reportes/bi-avanzado.md` | **Siguiente**: `07-integraciones/webhooks.md`
