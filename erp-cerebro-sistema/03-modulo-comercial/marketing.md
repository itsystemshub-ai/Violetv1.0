# Módulo 03: COMERCIAL - Marketing y Campañas

## Descripción

Módulo de marketing para gestión de campañas, email marketing, segmentación de clientes y análisis de efectividad.

## 🔗 Conexiones

- **03-comercial/crm** → Leads y clientes
- **03-comercial/ventas** → Segmentación por compras
- **07-integraciones/n8n** → Automatización de campañas

---

## 📊 Modelo de Datos

```prisma
model Campaign {
  id          String   @id @default(cuid())
  name        String
  type        String   // EMAIL, SMS, WHATSAPP, REDES
  status      String   @default("DRAFT")
  targetSegment Json
  content     String
  scheduledAt DateTime?
  sentAt      DateTime?
  stats       CampaignStats?
  budget      Float?
}

model CampaignStats {
  id          String @id @default(cuid())
  campaignId  String @unique
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  sent        Int @default(0)
  delivered   Int @default(0)
  opened      Int @default(0)
  clicked     Int @default(0)
  converted   Int @default(0)
  conversionRate Float @default(0)
}

model CustomerSegment {
  id          String @id @default(cuid())
  name        String @unique
  description String?
  criteria    Json // Criterios de segmentación
  customers   Customer[]
}
```

---

## 📡 Endpoints Principales

```typescript
@Controller('marketing')
export class MarketingController {
  @Get('campanas')
  async getCampanas(@Query('status') status?: string) { }
  
  @Post('campanas')
  async createCampana(@Body() dto: CreateCampanaDto) { }
  
  @Post('campanas/:id/enviar')
  async enviarCampana(@Param('id') id: string) { }
  
  @Get('segmentos')
  async getSegmentos() { }
  
  @Get('estadisticas/:id')
  async getEstadisticas(@Param('id') id: string) { }
}
```

---

## ⚠️ Reglas de Negocio

1. **Segmentación**: Clientes se segmentan por comportamiento de compra
2. **Campañas**: Requieren aprobación antes de enviar
3. **Estadísticas**: Tracking de opens, clicks y conversiones
4. **ROI**: Calcular retorno de inversión por campaña

---

**Anterior**: `03-comercial/pos.md` | **Siguiente**: `05-configuracion/usuarios.md`
