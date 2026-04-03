# Módulo 07: INTEGRACIONES - Flujos n8n de Automatización

## Descripción

Flujos de automatización con n8n para el ERP ZENITH. Incluye automatización de facturación, nómina, inventario, reportes y alertas.

---

## 📊 Arquitectura de Automatización

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJOS PRINCIPALES                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Facturación Electrónica SENIAT                               │
│ 2. Nómina Automática Mensual                                    │
│ 3. Alerta de Stock Bajo                                         │
│ 4. Conciliación Bancaria Automática                             │
│ 5. Recordatorio de Cobranza                                     │
│ 6. Backup Automático a R2                                       │
│ 7. Sincronización Tipo de Cambio BCV                            │
│ 8. Aprobación de Compras                                        │
│ 9. Reportes Automáticos por Email                               │
│ 10. Webhook de Ventas                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Flujo 1: Facturación Electrónica SENIAT

### Descripción
Genera automáticamente el XML y PDF de facturas, las firma digitalmente y las envía al SENIAT (simulado).

### JSON del Flujo

```json
{
  "name": "Facturación Electrónica SENIAT",
  "nodes": [
    {
      "name": "Webhook Venta",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "factura-electronica",
        "responseMode": "onReceived",
        "options": {}
      }
    },
    {
      "name": "Validar Datos",
      "type": "n8n-nodes-base.function",
      "position": [500, 300],
      "parameters": {
        "functionCode": "// Validar datos de la factura\nconst sale = $input.all()[0].json;\n\nif (!sale.invoiceNumber || !sale.customer.rif) {\n  throw new Error('Factura incompleta');\n}\n\n// Calcular totales\nconst baseImponible = sale.subtotal;\nconst iva = sale.tax;\nconst total = sale.total;\n\nreturn [{\n  json: {\n    ...sale,\n    baseImponible,\n    iva,\n    total,\n    timestamp: new Date().toISOString()\n  }\n}];"
      }
    },
    {
      "name": "Generar XML",
      "type": "n8n-nodes-base.xml",
      "position": [750, 300],
      "parameters": {
        "operation": "create",
        "xmlPath": "Factura",
        "options": {
          "declaration": true,
          "indent": "  "
        }
      }
    },
    {
      "name": "Convertir a PDF",
      "type": "n8n-nodes-base.html",
      "position": [1000, 300],
      "parameters": {
        "operation": "template",
        "template": "<!DOCTYPE html><html><head><style>body{font-family:Arial;margin:20px}.header{text-align:center;border-bottom:2px solid #333}.totals{float:right;width:300px}</style></head><body><div class='header'><h1>FACTURA</h1><p>N° {{$json.invoiceNumber}}</p><p>Control: {{$json.invoiceControl}}</p></div><div class='totals'><p>Total: Bs. {{$json.total}}</p></div></body></html>"
      }
    },
    {
      "name": "Subir a R2",
      "type": "n8n-nodes-base.awsS3",
      "position": [1250, 300],
      "parameters": {
        "operation": "upload",
        "bucket": "erp-facturas",
        "region": "auto",
        "endpoint": "={{ $env.CLOUDFLARE_R2_ENDPOINT }}",
        "accessKeyId": "={{ $env.CLOUDFLARE_R2_ACCESS_KEY_ID }}",
        "secretAccessKey": "={{ $env.CLOUDFLARE_R2_SECRET_ACCESS_KEY }}",
        "file": "={{ $binary.pdf }}",
        "key": "={{ `facturas/${$json.invoiceNumber}.pdf` }}"
      }
    },
    {
      "name": "Actualizar ERP",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1500, 300],
      "parameters": {
        "method": "PUT",
        "url": "={{ $env.API_URL }}/ventas/{{ $json.saleId }}",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "invoicePdf",
              "value": "={{ $env.CLOUDFLARE_R2_PUBLIC_URL }}/facturas/{{ $json.invoiceNumber }}.pdf"
            },
            {
              "name": "status",
              "value": "INVOICED"
            }
          ]
        }
      }
    },
    {
      "name": "Enviar Email Cliente",
      "type": "n8n-nodes-base.emailSend",
      "position": [1750, 300],
      "parameters": {
        "toEmail": "={{ $json.customer.email }}",
        "subject": "Factura N° {{ $json.invoiceNumber }}",
        "html": "<p>Estimado {{ $json.customer.businessName }},</p><p>Adjuntamos su factura N° {{ $json.invoiceNumber }} por un total de <strong>Bs. {{ $json.total }}</strong>.</p><p>Gracias por su compra.</p>"
      }
    }
  ],
  "connections": {
    "Webhook Venta": {
      "main": [[{ "node": "Validar Datos", "type": "main" }]]
    },
    "Validar Datos": {
      "main": [[{ "node": "Generar XML", "type": "main" }]]
    },
    "Generar XML": {
      "main": [[{ "node": "Convertir a PDF", "type": "main" }]]
    },
    "Convertir a PDF": {
      "main": [[{ "node": "Subir a R2", "type": "main" }]]
    },
    "Subir a R2": {
      "main": [[{ "node": "Actualizar ERP", "type": "main" }]]
    },
    "Actualizar ERP": {
      "main": [[{ "node": "Enviar Email Cliente", "type": "main" }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": ["facturacion", "seniat", "ventas"],
  "triggerCount": 1,
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "versionId": "1"
}
```

---

## 🔧 Flujo 2: Nómina Automática Mensual

### Descripción
Calcula y procesa la nómina automáticamente el último día de cada mes, genera recibos y los envía a los empleados.

### JSON del Flujo

```json
{
  "name": "Nómina Automática Mensual",
  "nodes": [
    {
      "name": "Cron Último Día",
      "type": "n8n-nodes-base.cron",
      "position": [250, 300],
      "parameters": {
        "triggerTimes": {
          "item": [
            {
              "hour": 8,
              "minute": 0,
              "dayOfMonth": "last"
            }
          ]
        }
      }
    },
    {
      "name": "Calcular Nómina",
      "type": "n8n-nodes-base.httpRequest",
      "position": [500, 300],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.API_URL }}/rrhh/nomina/calcular",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\n  \"periodStart\": \"{{ $now.minus({months: 1}).format('YYYY-MM-01') }}\",\n  \"periodEnd\": \"{{ $now.format('YYYY-MM-31') }}\",\n  \"paymentDate\": \"{{ $now.plus({days: 5}).format('YYYY-MM-30') }}\"\n}"
      }
    },
    {
      "name": "Enviar para Aprobación",
      "type": "n8n-nodes-base.emailSend",
      "position": [750, 300],
      "parameters": {
        "toEmail": "={{ $env.HR_MANAGER_EMAIL }}",
        "subject": "Nómina {{ $now.format('MMMM YYYY') }} - Pendiente de Aprobación",
        "html": "<p>La nómina del mes está lista para revisión.</p><p><strong>Total empleados:</strong> {{ $json.totalEmployees }}</p><p><strong>Total a pagar:</strong> Bs. {{ $json.totalNet }}</p><p><a href='{{ $env.FRONTEND_URL }}/rrhh/nomina/{{ $json.id }}'>Revisar y Aprobar</a></p>"
      }
    },
    {
      "name": "Esperar Aprobación",
      "type": "n8n-nodes-base.wait",
      "position": [1000, 300],
      "parameters": {
        "waitType": "date",
        "resume": "webhook"
      }
    },
    {
      "name": "Procesar Nómina",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1250, 300],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.API_URL }}/rrhh/nomina/{{ $json.payrollId }}/procesar",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth"
      }
    },
    {
      "name": "Generar Recibos",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1500, 300],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.API_URL }}/rrhh/nomina/{{ $json.id }}/recibos",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth"
      }
    },
    {
      "name": "Enviar a Empleados",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [1750, 300],
      "parameters": {
        "batchSize": 1
      }
    },
    {
      "name": "Email Recibo Individual",
      "type": "n8n-nodes-base.emailSend",
      "position": [2000, 300],
      "parameters": {
        "toEmail": "={{ $json.employee.email }}",
        "subject": "Recibo de Pago - {{ $now.format('MMMM YYYY') }}",
        "html": "<p>Estimado {{ $json.employee.firstName }},</p><p>Adjuntamos su recibo de pago correspondiente al mes de {{ $now.format('MMMM YYYY') }}.</p><p><strong>Neto a Pagar:</strong> Bs. {{ $json.netSalary }}</p>",
        "attachments": "={{ $json.receiptUrl }}"
      }
    }
  ]
}
```

---

## 🔧 Flujo 3: Alerta de Stock Bajo

### Descripción
Monitorea el inventario cada 6 horas y envía alertas cuando el stock está por debajo del mínimo.

### JSON del Flujo

```json
{
  "name": "Alerta de Stock Bajo",
  "nodes": [
    {
      "name": "Cron Cada 6 Horas",
      "type": "n8n-nodes-base.cron",
      "position": [250, 300],
      "parameters": {
        "triggerTimes": {
          "item": [
            { "hour": 6 },
            { "hour": 12 },
            { "hour": 18 }
          ]
        }
      }
    },
    {
      "name": "Consultar Stock Bajo",
      "type": "n8n-nodes-base.httpRequest",
      "position": [500, 300],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.API_URL }}/inventario/alertas/stock-bajo",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth"
      }
    },
    {
      "name": "¿Hay Productos?",
      "type": "n8n-nodes-base.if",
      "position": [750, 300],
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $json.length }}",
              "operation": "larger",
              "value2": 0
            }
          ]
        }
      }
    },
    {
      "name": "Crear Orden de Compra Sugerida",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1000, 200],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.API_URL }}/compras/solicitudes",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\n  \"items\": {{ $json.map(p => ({productId: p.productId, quantity: p.shortage * 2, estimatedCost: p.cost})) }},\n  \"priority\": \"ALTA\",\n  \"notes\": \"Generada automáticamente por stock bajo\"\n}"
      }
    },
    {
      "name": "Enviar Email a Compras",
      "type": "n8n-nodes-base.emailSend",
      "position": [1250, 200],
      "parameters": {
        "toEmail": "={{ $env.PURCHASING_EMAIL }}",
        "subject": "⚠️ Alerta: {{ $json.length }} productos con stock bajo",
        "html": "<h2>Productos que requieren reposición</h2><table border='1'><tr><th>Producto</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Faltante</th></tr>{{ $json.map(p => `<tr><td>${p.name}</td><td>${p.currentStock}</td><td>${p.minStock}</td><td>${p.shortage}</td></tr>`).join('') }}</table><p>Se ha generado una solicitud de compra automática.</p>"
      }
    },
    {
      "name": "Notificar por WhatsApp",
      "type": "n8n-nodes-base.whatsapp",
      "position": [1500, 200],
      "parameters": {
        "operation": "sendTemplate",
        "to": "={{ $env.WHATSAPP_PURCHASING }}",
        "templateName": "stock_bajo_alert",
        "language": "es"
      }
    }
  ]
}
```

---

## 🔧 Flujo 4: Sincronización Tipo de Cambio BCV

### Descripción
Obtiene diariamente el tipo de cambio del BCV y actualiza el sistema.

### JSON del Flujo

```json
{
  "name": "Sync Tipo de Cambio BCV",
  "nodes": [
    {
      "name": "Cron Diario 8AM",
      "type": "n8n-nodes-base.cron",
      "position": [250, 300],
      "parameters": {
        "triggerTimes": {
          "item": [{ "hour": 8, "minute": 0 }]
        }
      }
    },
    {
      "name": "Obtener Tasa BCV",
      "type": "n8n-nodes-base.httpRequest",
      "position": [500, 300],
      "parameters": {
        "method": "GET",
        "url": "https://ve.dolarapi.com/v1/dolares/oficial"
      }
    },
    {
      "name": "Actualizar en ERP",
      "type": "n8n-nodes-base.httpRequest",
      "position": [750, 300],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.API_URL }}/tesoreria/tipo-cambio",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\n  \"fromCurrency\": \"USD\",\n  \"toCurrency\": \"VES\",\n  \"rate\": {{ $json.promedio }},\n  \"source\": \"BCV\",\n  \"date\": \"{{ $now.format('YYYY-MM-DD') }}\"\n}"
      }
    },
    {
      "name": "Notificar Contabilidad",
      "type": "n8n-nodes-base.emailSend",
      "position": [1000, 300],
      "parameters": {
        "toEmail": "={{ $env.ACCOUNTING_EMAIL }}",
        "subject": "Tasa BCV del día: Bs. {{ $json.promedio }}",
        "html": "<p>La tasa oficial del BCV para hoy es:</p><h1>1 USD = Bs. {{ $json.promedio }}</h1><p>El sistema ha sido actualizado automáticamente.</p>"
      }
    }
  ]
}
```

---

## 🔧 Flujo 5: Backup Automático a R2

### Descripción
Realiza backup diario de la base de datos y lo almacena en Cloudflare R2.

### JSON del Flujo

```json
{
  "name": "Backup BD a R2",
  "nodes": [
    {
      "name": "Cron Diario 2AM",
      "type": "n8n-nodes-base.cron",
      "position": [250, 300],
      "parameters": {
        "triggerTimes": {
          "item": [{ "hour": 2, "minute": 0 }]
        }
      }
    },
    {
      "name": "Ejecutar pg_dump",
      "type": "n8n-nodes-base.executeCommand",
      "position": [500, 300],
      "parameters": {
        "command": "pg_dump {{ $env.DATABASE_URL }} | gzip > /tmp/backup_{{ $now.format('YYYYMMDD_HHmmss') }}.sql.gz"
      }
    },
    {
      "name": "Subir a R2",
      "type": "n8n-nodes-base.awsS3",
      "position": [750, 300],
      "parameters": {
        "operation": "upload",
        "bucket": "erp-backups",
        "region": "auto",
        "endpoint": "={{ $env.CLOUDFLARE_R2_ENDPOINT }}",
        "accessKeyId": "={{ $env.CLOUDFLARE_R2_ACCESS_KEY_ID }}",
        "secretAccessKey": "={{ $env.CLOUDFLARE_R2_SECRET_ACCESS_KEY }}",
        "file": "/tmp/backup_*.sql.gz",
        "key": "={{ `backups/${$now.format('YYYY/MM/DD')}/backup_${$now.format('YYYYMMDD_HHmmss')}.sql.gz` }}"
      }
    },
    {
      "name": "Limpiar Backups >30 Días",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1000, 300],
      "parameters": {
        "method": "DELETE",
        "url": "={{ $env.API_URL }}/admin/cleanup-backups",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{ \"olderThanDays\": 30 }"
      }
    },
    {
      "name": "Notificar Éxito",
      "type": "n8n-nodes-base.emailSend",
      "position": [1250, 300],
      "parameters": {
        "toEmail": "={{ $env.ADMIN_EMAIL }}",
        "subject": "✅ Backup completado exitosamente",
        "html": "<p>El backup diario se ha completado exitosamente.</p><p><strong>Fecha:</strong> {{ $now.format('DD/MM/YYYY HH:mm') }}</p><p><strong>Ubicación:</strong> R2/erp-backups/backups/{{ $now.format('YYYY/MM/DD') }}/</p>"
      }
    }
  ]
}
```

---

## ⚙️ Configuración de Credenciales

### Variables de Entorno para n8n

```bash
# .env de n8n

# API del ERP
API_URL="https://api.erpzenith.com"

# Cloudflare R2
CLOUDFLARE_R2_ENDPOINT="https://account-id.r2.cloudflarestorage.com"
CLOUDFLARE_R2_ACCESS_KEY_ID="xxx"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="xxx"
CLOUDFLARE_R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# Emails
HR_MANAGER_EMAIL="rrhh@erpzenith.com"
PURCHASING_EMAIL="compras@erpzenith.com"
ACCOUNTING_EMAIL="contabilidad@erpzenith.com"
ADMIN_EMAIL="admin@erpzenith.com"

# WhatsApp
WHATSAPP_PURCHASING="+584121234567"

# Base de Datos (para backups)
DATABASE_URL="postgresql://user:password@host:5432/erpzenith"
```

---

## 📊 Monitoreo de Flujos

### Dashboard de Automatización

```typescript
// apps/frontend/app/(dashboard)/integraciones/n8n/page.tsx

export default function N8NDashboard() {
  const { data: workflows } = useQuery({
    queryKey: ['n8n-workflows'],
    queryFn: () => api.get('/n8n/workflows').then(r => r.data),
  });

  const { data: executions } = useQuery({
    queryKey: ['n8n-executions'],
    queryFn: () => api.get('/n8n/executions?limit=50').then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Automatización n8n</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Flujos Activos"
          value={workflows?.active || 0}
          icon={<Workflow className="w-8 h-8" />}
        />
        <KPICard
          title="Ejecuciones Hoy"
          value={executions?.today || 0}
          change={executions?.change || 0}
          icon={<Zap className="w-8 h-8" />}
        />
        <KPICard
          title="Tasa de Éxito"
          value={`${executions?.successRate || 0}%`}
          icon={<CheckCircle className="w-8 h-8" />}
        />
        <KPICard
          title="Tiempo Promedio"
          value={`${executions?.avgDuration || 0}s`}
          icon={<Clock className="w-8 h-8" />}
        />
      </div>

      {/* Lista de Flujos */}
      <GlassCard>
        <h2 className="text-xl font-bold mb-4">Flujos Configurados</h2>
        <Table data={workflows?.items || []}>
          <Column header="Nombre" accessor="name" />
          <Column header="Estado" accessor="status" />
          <Column header="Última Ejecución" accessor="lastExecution" />
          <Column header="Próxima Ejecución" accessor="nextExecution" />
        </Table>
      </GlassCard>

      {/* Ejecuciones Recientes */}
      <GlassCard>
        <h2 className="text-xl font-bold mb-4">Ejecuciones Recientes</h2>
        <Table data={executions?.items || []}>
          <Column header="Flujo" accessor="workflowName" />
          <Column header="Estado" accessor="status" />
          <Column header="Duración" accessor="duration" />
          <Column header="Fecha" accessor="startedAt" />
        </Table>
      </GlassCard>
    </div>
  );
}
```

---

## 📁 Archivos del Módulo

```
07-integraciones/
├── ia.md
├── n8n-workflows.md (este archivo)
├── api-externas.md
└── webhooks.md
```

**Anterior**: `07-integraciones/ia.md` | **Siguiente**: `07-integraciones/api-externas.md`
