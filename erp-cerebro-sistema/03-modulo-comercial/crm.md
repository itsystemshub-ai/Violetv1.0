# Módulo 03: COMERCIAL - CRM (Gestión de Clientes)

## Descripción

Módulo de Customer Relationship Management (CRM) para gestión de leads, oportunidades, pipeline de ventas, interacciones y seguimiento de clientes.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  00-shared/auth.md          → Permisos de vendedor             │
│  00-shared/rbac.md          → Roles VENDEDOR, ADMIN            │
├─────────────────────────────────────────────────────────────────┤
│  03-comercial/ventas.md     → Conversión lead a cliente        │
│  03-comercial/ventas.md     → Historial de compras             │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/tesoreria.md → Cuentas por cobrar           │
├─────────────────────────────────────────────────────────────────┤
│  07-integraciones/n8n.md    → Email marketing, recordatorios   │
│  07-integraciones/ia.md     → Análisis de sentimiento          │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Lead convertido **CREA** cliente en ventas
2. Interacciones **DISPARAN** análisis de sentimiento (IA)
3. Oportunidad ganada **GENERA** cotización en ventas
4. Recordatorios **ENVÍAN** emails vía n8n

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// LEADS (Prospectos)
// ─────────────────────────────────────────────────────────────────────────────

model Lead {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  company     String?
  position    String?
  
  // Clasificación
  status      LeadStatus @default(NUEVO) // NUEVO, CONTACTADO, CALIFICADO, NEGOCIACION, GANADO, PERDIDO
  source      String?  // WEB, REFERIDO, REDES_SOCIALES, LLAMADA, FERIA
  priority    Priority @default(NORMAL) // URGENTE, ALTA, NORMAL, BAJA
  
  // Asignación
  assignedTo  String?
  assigned    User     @relation(fields: [assignedTo], references: [id])
  
  // Pipeline
  pipelineId  String?
  pipeline    Pipeline? @relation(fields: [pipelineId], references: [id])
  stageId     String?
  stage       PipelineStage? @relation(fields: [stageId], references: [id])
  
  // Score y análisis
  leadScore   Int      @default(0) // 0-100
  sentiment   Float?   // Análisis de sentimiento (-1 a 1)
  
  // Datos adicionales
  budget      Float?   // Presupuesto estimado
  expectedClose DateTime? // Fecha estimada de cierre
  notes       String?
  
  // Relaciones
  interactions Interaction[]
  tasks        Task[]
  
  // Conversión
  convertedToCustomerId String?
  convertedToCustomer   Customer? @relation(fields: [convertedToCustomerId], references: [id])
  convertedAt DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([assignedTo])
  @@index([pipelineId])
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACCIONES
// ─────────────────────────────────────────────────────────────────────────────

model Interaction {
  id          String   @id @default(cuid())
  leadId      String
  lead        Lead     @relation(fields: [leadId], references: [id])
  
  type        InteractionType // LLAMADA, EMAIL, REUNION, WHATSAPP, VISITA
  subject     String?
  notes       String?
  date        DateTime @default(now())
  duration    Int?     // Minutos
  
  // Análisis de sentimiento
  sentiment   Float?   // -1 (negativo) a 1 (positivo)
  sentimentLabel String? // NEGATIVO, NEUTRO, POSITIVO
  
  createdBy   String
  createdAt   DateTime @default(now())

  @@index([leadId])
  @@index([type])
  @@index([date])
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE DE VENTAS
// ─────────────────────────────────────────────────────────────────────────────

model Pipeline {
  id          String   @id @default(cuid())
  name        String   @unique // ej. "Ventas Mayoristas", "Ventas Minoristas"
  description String?
  isActive    Boolean  @default(true)
  stages      PipelineStage[]
  leads       Lead[]
  createdAt   DateTime @default(now())

  @@index([name])
}

model PipelineStage {
  id          String   @id @default(cuid())
  pipelineId  String
  pipeline    Pipeline @relation(fields: [pipelineId], references: [id])
  name        String   // ej. "Contacto Inicial", "Propuesta", "Negociación", "Cierre"
  order       Int
  probability Float    @default(0) // % de probabilidad de cierre (0-100)
  color       String   @default("#6366f1")
  leads       Lead[]
  createdAt   DateTime @default(now())

  @@index([pipelineId])
  @@index([order])
}

// ─────────────────────────────────────────────────────────────────────────────
// TAREAS Y RECORDATORIOS
// ─────────────────────────────────────────────────────────────────────────────

model Task {
  id          String   @id @default(cuid())
  leadId      String
  lead        Lead     @relation(fields: [leadId], references: [id])
  
  title       String
  description String?
  type        TaskType // LLAMADA, EMAIL, REUNION, ENVIO_PROPUESTA, SEGUIMIENTO
  
  // Fechas
  dueDate     DateTime
  completedAt DateTime?
  
  // Estado
  status      TaskStatus @default(PENDING) // PENDING, COMPLETED, CANCELLED
  priority    Priority   @default(NORMAL)
  
  // Asignación
  assignedTo  String?
  assigned    User     @relation(fields: [assignedTo], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([leadId])
  @@index([assignedTo])
  @@index([status])
  @@index([dueDate])
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAÑAS DE MARKETING
// ─────────────────────────────────────────────────────────────────────────────

model Campaign {
  id          String   @id @default(cuid())
  name        String
  type        CampaignType // EMAIL, SMS, WHATSAPP, REDES_SOCIALES
  status      CampaignStatus // DRAFT, SCHEDULED, RUNNING, COMPLETED, CANCELLED
  
  // Segmentación
  targetSegment Json? // { minPurchases: 3, lastPurchaseDays: 90, ... }
  
  // Contenido
  subject     String?
  content     String
  templateId  String?
  
  // Fechas
  scheduledAt DateTime?
  sentAt      DateTime?
  endsAt      DateTime?
  
  // Estadísticas
  stats       CampaignStats?
  
  // Presupuesto
  budget      Float?
  actualCost  Float?
  
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([type])
}

model CampaignStats {
  id          String   @id @default(cuid())
  campaignId  String   @unique
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  
  sent        Int      @default(0)
  delivered   Int      @default(0)
  opened      Int      @default(0)
  clicked     Int      @default(0)
  bounced     Int      @default(0)
  unsubscribed Int     @default(0)
  converted   Int      @default(0)
  
  conversionRate Float @default(0)
  openRate       Float @default(0)
  clickRate      Float @default(0)
  
  revenue       Float? @default(0) // Ingresos generados
  roi           Float? @default(0) // Retorno de inversión
  
  updatedAt     DateTime @updatedAt

  @@index([campaignId])
}

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENTACIÓN DE CLIENTES (RFM)
// ─────────────────────────────────────────────────────────────────────────────

model CustomerSegment {
  id          String   @id @default(cuid())
  name        String   @unique // ej. "CHAMPIONS", "LOYAL", "AT_RISK"
  description String?
  rfmMin      Json?    // { recency: 0, frequency: 3, monetary: 1000 }
  rfmMax      Json?    // { recency: 30, frequency: 10, monetary: 5000 }
  color       String?
  customers   Customer[]
  createdAt   DateTime @default(now())

  @@index([name])
}

// Actualizar modelo Customer (en 03-comercial/ventas.md)
// Añadir:
// segmentId String?
// segment   CustomerSegment? @relation(fields: [segmentId], references: [id])
// rfmScore  Float? @default(0) // Score RFM (1-5)
// lastPurchaseDate DateTime?
// totalPurchases Float @default(0)
// purchaseCount Int @default(0)

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum LeadStatus {
  NUEVO
  CONTACTADO
  CALIFICADO
  NEGOCIACION
  GANADO
  PERDIDO
}

enum InteractionType {
  LLAMADA
  EMAIL
  REUNION
  WHATSAPP
  VISITA
}

enum TaskType {
  LLAMADA
  EMAIL
  REUNION
  ENVIO_PROPUESTA
  SEGUIMIENTO
  OTRO
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum CampaignType {
  EMAIL
  SMS
  WHATSAPP
  REDES_SOCIALES
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  RUNNING
  COMPLETED
  CANCELLED
}
```

---

## 📡 Endpoints de la API

### Controller de CRM

```typescript
// apps/backend/src/modules/crm/crm.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CrmService } from './crm.service';

@Controller('crm')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmController {
  constructor(private crmService: CrmService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // LEADS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('leads')
  @RequirePermissions('crm:read')
  async getLeads(
    @Query('status') status?: LeadStatus,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.crmService.getLeads(status, assignedTo);
  }

  @Get('leads/:id')
  @RequirePermissions('crm:read')
  async getLead(@Param('id') id: string) {
    return this.crmService.getLead(id);
  }

  @Post('leads')
  @RequirePermissions('crm:create')
  async createLead(@Body() dto: CreateLeadDto, @User() user: any) {
    return this.crmService.createLead(dto, user.id);
  }

  @Put('leads/:id')
  @RequirePermissions('crm:update')
  async updateLead(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @User() user: any,
  ) {
    return this.crmService.updateLead(id, dto, user.id);
  }

  @Delete('leads/:id')
  @RequirePermissions('crm:delete')
  async deleteLead(@Param('id') id: string) {
    return this.crmService.deleteLead(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CAMBIAR ESTADO DE LEAD
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('leads/:id/estado')
  @RequirePermissions('crm:update')
  async cambiarEstadoLead(
    @Param('id') id: string,
    @Body() dto: CambiarEstadoDto,
    @User() user: any,
  ) {
    return this.crmService.cambiarEstadoLead(id, dto, user.id);
  }

  @Post('leads/:id/convertir')
  @RequirePermissions('crm:create')
  async convertirLeadACliente(@Param('id') id: string, @User() user: any) {
    return this.crmService.convertirLeadACliente(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTERACCIONES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('leads/:id/interactions')
  @RequirePermissions('crm:read')
  async getInteracciones(@Param('id') id: string) {
    return this.crmService.getInteracciones(id);
  }

  @Post('leads/:id/interactions')
  @RequirePermissions('crm:create')
  async createInteraccion(
    @Param('id') id: string,
    @Body() dto: CreateInteraccionDto,
    @User() user: any,
  ) {
    return this.crmService.createInteraccion(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TAREAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('tasks')
  @RequirePermissions('crm:read')
  async getTareas(
    @Query('status') status?: TaskStatus,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.crmService.getTareas(status, assignedTo);
  }

  @Post('tasks')
  @RequirePermissions('crm:create')
  async createTarea(@Body() dto: CreateTareaDto, @User() user: any) {
    return this.crmService.createTarea(dto, user.id);
  }

  @Post('tasks/:id/complete')
  @RequirePermissions('crm:update')
  async completarTarea(@Param('id') id: string, @User() user: any) {
    return this.crmService.completarTarea(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PIPELINE
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('pipelines')
  @RequirePermissions('crm:read')
  async getPipelines() {
    return this.crmService.getPipelines();
  }

  @Get('pipelines/:id')
  @RequirePermissions('crm:read')
  async getPipeline(@Param('id') id: string) {
    return this.crmService.getPipeline(id);
  }

  @Post('pipelines')
  @RequirePermissions('crm:create')
  async createPipeline(@Body() dto: CreatePipelineDto, @User() user: any) {
    return this.crmService.createPipeline(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CAMPAÑAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('campaigns')
  @RequirePermissions('marketing:read')
  async getCampaigns(@Query('status') status?: CampaignStatus) {
    return this.crmService.getCampaigns(status);
  }

  @Post('campaigns')
  @RequirePermissions('marketing:create')
  async createCampaign(@Body() dto: CreateCampaignDto, @User() user: any) {
    return this.crmService.createCampaign(dto, user.id);
  }

  @Post('campaigns/:id/send')
  @RequirePermissions('marketing:create')
  async sendCampaign(@Param('id') id: string, @User() user: any) {
    return this.crmService.sendCampaign(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DASHBOARD CRM
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('dashboard')
  @RequirePermissions('crm:read')
  async getDashboard() {
    return this.crmService.getDashboard();
  }

  @Get('dashboard/funnel')
  @RequirePermissions('crm:read')
  async getFunnel() {
    return this.crmService.getFunnel();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/conversion')
  @RequirePermissions('reportes-crm:read')
  async getConversionReport(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.crmService.getConversionReport(new Date(from), new Date(to));
  }

  @Get('reportes/rendimiento-vendedores')
  @RequirePermissions('reportes-crm:read')
  async getRendimientoVendedores(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.crmService.getRendimientoVendedores(new Date(from), new Date(to));
  }
}
```

---

## 🧩 Servicio de CRM

### Funciones Principales

```typescript
// apps/backend/src/modules/crm/crm.service.ts

@Injectable()
export class CrmService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService, // 07-integraciones/ia.md
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR LEAD
  // ───────────────────────────────────────────────────────────────────────────
  
  async createLead(dto: CreateLeadDto, userId: string) {
    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        position: dto.position,
        source: dto.source || 'WEB',
        status: 'NUEVO',
        assignedTo: dto.assignedTo || userId,
        priority: dto.priority || 'NORMAL',
        budget: dto.budget,
        expectedClose: dto.expectedClose,
        notes: dto.notes,
      },
      include: { assigned: true },
    });

    // Calcular lead score inicial
    const score = await this.calculateLeadScore(lead.id);
    
    return { ...lead, leadScore: score };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CAMBIAR ESTADO DE LEAD
  // ───────────────────────────────────────────────────────────────────────────
  
  async cambiarEstadoLead(leadId: string, dto: CambiarEstadoDto, userId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException('Lead no encontrado');
    }

    // Si cambia a GANADO, no permitir cambiar a otro estado
    if (lead.status === 'GANADO' && dto.status !== 'GANADO') {
      throw new BadRequestException('No se puede cambiar un lead ganado');
    }

    // Si cambia a PERDIDO, requerir motivo
    if (dto.status === 'PERDIDO' && !dto.reason) {
      throw new BadRequestException('Debe especificar motivo de pérdida');
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: dto.status,
        stageId: dto.stageId,
        notes: dto.reason ? `${lead.notes}\n\n[PERDIDO] ${dto.reason}` : lead.notes,
      },
      include: { stage: true, assigned: true },
    });

    // Si es GANADO, crear tarea de seguimiento
    if (dto.status === 'GANADO') {
      await this.prisma.task.create({
        data: {
          leadId,
          title: 'Seguimiento post-venta',
          type: 'LLAMADA',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
          assignedTo: userId,
          status: 'PENDING',
        },
      });
    }

    return updated;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONVERTIR LEAD A CLIENTE
  // ───────────────────────────────────────────────────────────────────────────
  
  async convertirLeadACliente(leadId: string, userId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { interactions: true },
    });

    if (!lead) {
      throw new NotFoundException('Lead no encontrado');
    }

    if (lead.status !== 'GANADO' && lead.status !== 'CALIFICADO') {
      throw new BadRequestException('Solo se pueden convertir leads calificados o ganados');
    }

    // 1. Crear cliente
    const customer = await this.prisma.customer.create({
      data: {
        businessName: lead.company || lead.name,
        rif: dto.rif, // Requerido para cliente
        address: dto.address,
        phone: lead.phone,
        email: lead.email,
        creditLimit: dto.creditLimit,
        creditDays: dto.creditDays,
      },
    });

    // 2. Actualizar lead
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'GANADO',
        convertedToCustomerId: customer.id,
        convertedAt: new Date(),
      },
    });

    // 3. Migrar interacciones (opcional, para historial)
    // Las interacciones se mantienen en el lead

    return { lead, customer };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR INTERACCIÓN CON ANÁLISIS DE SENTIMIENTO
  // ───────────────────────────────────────────────────────────────────────────
  
  async createInteraccion(leadId: string, dto: CreateInteraccionDto, userId: string) {
    // 1. Crear interacción
    const interaction = await this.prisma.interaction.create({
      data: {
        leadId,
        type: dto.type,
        subject: dto.subject,
        notes: dto.notes,
        date: dto.date || new Date(),
        duration: dto.duration,
        createdBy: userId,
      },
    });

    // 2. Análisis de sentimiento con IA (si hay notas)
    if (dto.notes && dto.notes.length > 10) {
      const sentiment = await this.aiService.analyzeSentiment(dto.notes);
      
      await this.prisma.interaction.update({
        where: { id: interaction.id },
        data: {
          sentiment: sentiment.score, // -1 a 1
          sentimentLabel: sentiment.label, // NEGATIVO, NEUTRO, POSITIVO
        },
      });

      // 3. Actualizar sentimiento del lead (promedio de interacciones)
      await this.updateLeadSentiment(leadId);
    }

    // 4. Recalcular lead score
    await this.calculateLeadScore(leadId);

    return interaction;
  }

  private async updateLeadSentiment(leadId: string) {
    const interactions = await this.prisma.interaction.findMany({
      where: { leadId, sentiment: { not: null } },
    });

    if (interactions.length === 0) return;

    const avgSentiment = interactions.reduce((sum, i) => sum + (i.sentiment || 0), 0) / interactions.length;

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { sentiment: avgSentiment },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CÁLCULO DE LEAD SCORE
  // ───────────────────────────────────────────────────────────────────────────
  
  async calculateLeadScore(leadId: string): Promise<number> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { interactions: true, tasks: true },
    });

    if (!lead) return 0;

    let score = 0;

    // Puntuación por actividad (máx 30 puntos)
    const interactionCount = lead.interactions.length;
    score += Math.min(interactionCount * 5, 30);

    // Puntuación por sentimiento (máx 20 puntos)
    if (lead.sentiment !== null && lead.sentiment !== undefined) {
      score += (lead.sentiment + 1) * 10; // -1 a 1 -> 0 a 20
    }

    // Puntuación por fuente (máx 20 puntos)
    const sourceScores: Record<string, number> = {
      REFERIDO: 20,
      WEB: 10,
      LLAMADA: 5,
      REDES_SOCIALES: 8,
      FERIA: 15,
    };
    score += sourceScores[lead.source || 'WEB'] || 0;

    // Puntuación por recencia (máx 20 puntos)
    const lastInteraction = lead.interactions.length > 0
      ? lead.interactions.reduce((max, i) => i.date > max ? i.date : max, lead.interactions[0].date)
      : lead.createdAt;
    
    const daysSinceLast = Math.floor((Date.now() - new Date(lastInteraction).getTime()) / 86400000);
    if (daysSinceLast <= 7) score += 20;
    else if (daysSinceLast <= 30) score += 10;
    else if (daysSinceLast <= 90) score += 5;

    // Puntuación por presupuesto (máx 10 puntos)
    if (lead.budget) {
      if (lead.budget >= 10000) score += 10;
      else if (lead.budget >= 5000) score += 7;
      else if (lead.budget >= 1000) score += 5;
    }

    return Math.min(score, 100);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR TAREA
  // ───────────────────────────────────────────────────────────────────────────
  
  async createTarea(dto: CreateTareaDto, userId: string) {
    const task = await this.prisma.task.create({
      data: {
        leadId: dto.leadId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        dueDate: dto.dueDate,
        priority: dto.priority || 'NORMAL',
        assignedTo: dto.assignedTo || userId,
        status: 'PENDING',
      },
      include: { lead: true, assigned: true },
    });

    // Disparar recordatorio (n8n)
    if (dto.dueDate) {
      await this.triggerTaskReminder(task);
    }

    return task;
  }

  async completarTarea(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CAMPAÑAS DE MARKETING
  // ───────────────────────────────────────────────────────────────────────────
  
  async createCampaign(dto: CreateCampaignDto, userId: string) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        type: dto.type,
        status: 'DRAFT',
        subject: dto.subject,
        content: dto.content,
        targetSegment: dto.targetSegment,
        scheduledAt: dto.scheduledAt,
        budget: dto.budget,
      },
    });

    // Calcular audiencia estimada
    const audience = await this.calculateCampaignAudience(campaign.id);

    return { ...campaign, estimatedAudience: audience };
  }

  async sendCampaign(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new BadRequestException('Solo se pueden enviar campañas en borrador o programadas');
    }

    // 1. Segmentar destinatarios
    const recipients = await this.segmentCustomers(campaign.targetSegment);

    // 2. Actualizar estado
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'RUNNING',
        sentAt: new Date(),
      },
    });

    // 3. Crear estadísticas iniciales
    await this.prisma.campaignStats.upsert({
      where: { campaignId },
      update: { sent: recipients.length },
      create: { campaignId, sent: recipients.length },
    });

    // 4. Disparar envío vía n8n
    await this.triggerCampaignSend(campaign, recipients);

    return { success: true, recipientsCount: recipients.length };
  }

  private async segmentCustomers(segment: any): Promise<any[]> {
    // Implementar segmentación RFM
    // Ejemplo: clientes con compras > $1000 en últimos 90 días
    const customers = await this.prisma.customer.findMany({
      where: {
        totalPurchases: { gte: segment?.minPurchases || 0 },
        lastPurchaseDate: { gte: new Date(Date.now() - (segment?.lastPurchaseDays || 90) * 86400000) },
      },
    });

    return customers;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DASHBOARD CRM
  // ───────────────────────────────────────────────────────────────────────────
  
  async getDashboard() {
    const [
      totalLeads,
      activeLeads,
      convertedLeads,
      conversionRate,
      tasksPending,
      interactionsToday,
    ] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { status: { in: ['NUEVO', 'CONTACTADO', 'CALIFICADO', 'NEGOCIACION'] } } }),
      this.prisma.lead.count({ where: { status: 'GANADO' } }),
      this.calculateConversionRate(),
      this.prisma.task.count({ where: { status: 'PENDING' } }),
      this.prisma.interaction.count({
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    return {
      totalLeads,
      activeLeads,
      convertedLeads,
      conversionRate,
      tasksPending,
      interactionsToday,
    };
  }

  async getFunnel() {
    const stages = await this.prisma.pipelineStage.findMany({
      include: {
        _count: {
          select: { leads: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    const total = stages.reduce((sum, s) => sum + s._count.leads, 0);

    return stages.map(s => ({
      stageId: s.id,
      stageName: s.name,
      order: s.order,
      color: s.color,
      count: s._count.leads,
      percentage: total > 0 ? ((s._count.leads / total) * 100).toFixed(1) : '0',
      probability: s.probability,
    }));
  }

  private async calculateConversionRate(): Promise<number> {
    const total = await this.prisma.lead.count();
    const converted = await this.prisma.lead.count({ where: { status: 'GANADO' } });
    
    if (total === 0) return 0;
    return parseFloat(((converted / total) * 100).toFixed(2));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  async getConversionReport(from: Date, to: Date) {
    const leads = await this.prisma.lead.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
    });

    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySource = leads.reduce((acc, lead) => {
      acc[lead.source || 'SIN_FUENTE'] = (acc[lead.source || 'SIN_FUENTE'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const converted = leads.filter(l => l.status === 'GANADO').length;
    const lost = leads.filter(l => l.status === 'PERDIDO').length;

    return {
      period: { from, to },
      totalLeads: leads.length,
      converted,
      lost,
      conversionRate: leads.length > 0 ? ((converted / leads.length) * 100).toFixed(2) : '0',
      byStatus,
      bySource,
    };
  }

  async getRendimientoVendedores(from: Date, to: Date) {
    const vendedores = await this.prisma.user.findMany({
      where: { role: { name: 'VENDEDOR' } },
      include: {
        leads: {
          where: {
            createdAt: { gte: from, lte: to },
          },
        },
      },
    });

    return vendedores.map(v => {
      const totalLeads = v.leads.length;
      const convertedLeads = v.leads.filter(l => l.status === 'GANADO').length;
      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : '0';
      const totalBudget = v.leads.reduce((sum, l) => sum + (l.budget || 0), 0);

      return {
        vendedorId: v.id,
        vendedorName: v.name,
        totalLeads,
        convertedLeads,
        lostLeads: totalLeads - convertedLeads,
        conversionRate,
        totalBudget,
        avgBudget: totalLeads > 0 ? (totalBudget / totalLeads).toFixed(2) : '0',
      };
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async triggerTaskReminder(task: any) {
    // Disparar webhook a n8n para recordatorio
    const webhookUrl = process.env.N8N_WEBHOOK_URL + '/recordatorio-tarea';
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    });
  }

  private async triggerCampaignSend(campaign: any, recipients: any[]) {
    // Disparar webhook a n8n para envío de campaña
    const webhookUrl = process.env.N8N_WEBHOOK_URL + '/enviar-campana';
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign, recipients }),
    });
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Lead Score**: Se calcula automáticamente con cada interacción
2. **Sentimiento**: IA analiza cada interacción y actualiza lead
3. **Conversión**: Solo leads CALIFICADOS o GANADOS se convierten
4. **Pipeline**: Cada etapa tiene probabilidad de cierre
5. **Tareas**: Recordatorios automáticos vía n8n
6. **Campañas**: Segmentación RFM configurable
7. **Histórico**: Interacciones se mantienen aunque lead se convierta

---

## 🔗 Conexiones Detalladas

### Con Ventas

```typescript
// Al convertir lead:
const customer = await this.prisma.customer.create({
  data: {
    businessName: lead.company || lead.name,
    rif: dto.rif,
    phone: lead.phone,
    email: lead.email,
  },
});

await this.prisma.lead.update({
  where: { id: leadId },
  data: {
    status: 'GANADO',
    convertedToCustomerId: customer.id,
    convertedAt: new Date(),
  },
});
```

### Con IA (Análisis de Sentimiento)

```typescript
// Al crear interacción:
const sentiment = await this.aiService.analyzeSentiment(dto.notes);

await this.prisma.interaction.update({
  where: { id: interaction.id },
  data: {
    sentiment: sentiment.score, // -1 a 1
    sentimentLabel: sentiment.label, // NEGATIVO, NEUTRO, POSITIVO
  },
});

// Actualizar sentimiento del lead
await this.updateLeadSentiment(leadId);
```

---

## 📁 Archivos del Módulo

```
03-modulo-comercial/
├── ventas.md
├── crm.md (este archivo)
├── pos.md
└── marketing.md
```

**Anterior**: `03-comercial/ventas.md` | **Siguiente**: `03-comercial/pos.md`
