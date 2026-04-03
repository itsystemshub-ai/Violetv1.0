# Módulo 02: OPERATIVO - Mantenimiento (CMMS)

## Descripción

Sistema de Gestión de Mantenimiento Asistido por Computadora (CMMS) para planificación, ejecución y seguimiento de órdenes de trabajo, mantenimiento preventivo y predictivo de activos.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/activos-fijos → Activos a mantener          │
│  01-administrativo/contabilidad  → Costos de mantenimiento     │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/inventario         → Repuestos y materiales      │
│  02-operativo/produccion         → Paradas de producción       │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/flota              → Mantenimiento de vehículos  │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Órdenes de trabajo **CONSUMEN** repuestos del inventario
2. Mantenimiento **AFECTA** disponibilidad de activos de producción
3. Costos **GENERAN** asiento contable de gasto
4. Flota **REQUIERE** mantenimiento periódico obligatorio

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// ACTIVOS DE MANTENIMIENTO
// ─────────────────────────────────────────────────────────────────────────────

model MaintenanceAsset {
  id                String   @id @default(cuid())
  fixedAssetId      String?
  fixedAsset        FixedAsset? @relation(fields: [fixedAssetId], references: [id])
  
  name              String
  serialNumber      String?
  model             String?
  manufacturer      String?
  
  // Ubicación
  location          String?
  department        String?
  
  // Criticidad
  criticality       String   @default("MEDIA") // ALTA, MEDIA, BAJA
  
  // Mantenimiento
  maintenancePlanId String?
  maintenancePlan   MaintenancePlan? @relation(fields: [maintenancePlanId], references: [id])
  
  // Órdenes de trabajo
  workOrders        WorkOrder[]
  
  // Estado
  status            String   @default("OPERATIVO") // OPERATIVO, MANTENIMIENTO, AVERIADO
  lastMaintenance   DateTime?
  nextMaintenance   DateTime?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([fixedAssetId])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANES DE MANTENIMIENTO
// ─────────────────────────────────────────────────────────────────────────────

model MaintenancePlan {
  id                String   @id @default(cuid())
  name              String
  description       String?
  
  // Tipo
  type              MaintenanceType // PREVENTIVO, PREDICTIVO, CORRECTIVO
  
  // Frecuencia
  frequency         Int      // Número
  frequencyUnit     String   // DIAS, SEMANAS, MESES, ANOS, HORAS_USO
  
  // Tareas
  tasks             Json     // Lista de tareas a realizar
  estimatedHours    Float
  estimatedCost     Float
  
  // Recursos
  requiredParts     Json?    // Repuestos necesarios
  requiredTools     Json?    // Herramientas necesarias
  skillLevel        String   @default("MEDIO") // BASICO, MEDIO, AVANZADO
  
  // Activos asignados
  assets            MaintenanceAsset[]
  
  // Estado
  isActive          Boolean  @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([type])
  @@index([isActive])
}

// ─────────────────────────────────────────────────────────────────────────────
// ÓRDENES DE TRABAJO
// ─────────────────────────────────────────────────────────────────────────────

model WorkOrder {
  id                String   @id @default(cuid())
  number            String   @unique // ej. OT-2024-000001
  
  // Activo
  assetId           String
  asset             MaintenanceAsset @relation(fields: [assetId], references: [id])
  
  // Tipo
  type              WorkOrderType // PREVENTIVO, CORRECTIVO, EMERGENCIA, PREDICTIVO
  priority          String   @default("NORMAL") // CRITICA, ALTA, NORMAL, BAJA
  
  // Descripción
  title             String
  description       String
  failureCode       String?  // Código de falla
  
  // Asignación
  assignedTo        String?  // Técnico responsable
  assignedAt        DateTime?
  
  // Programación
  scheduledDate     DateTime?
  startDate         DateTime?
  endDate           DateTime?
  
  // Estado
  status            WorkOrderStatus // PENDIENTE, ASIGNADA, EN_PROGRESO, COMPLETADA, CANCELADA
  
  // Mano de obra
  laborHours        Float    @default(0)
  laborCost         Float    @default(0)
  laborRate         Float    @default(0) // Costo por hora
  
  // Repuestos
  parts             WorkOrderPart[]
  partsCost         Float    @default(0)
  
  // Costos totales
  totalCost         Float    @default(0)
  
  // Notas
  notes             String?
  completionNotes   String?
  
  // Auditoría
  createdBy         String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([assetId])
  @@index([status])
  @@index([type])
}

// ─────────────────────────────────────────────────────────────────────────────
// REPUESTOS USADOS EN ÓRDENES
// ─────────────────────────────────────────────────────────────────────────────

model WorkOrderPart {
  id                String   @id @default(cuid())
  workOrderId       String
  workOrder         WorkOrder @relation(fields: [workOrderId], references: [id])
  
  // Repuesto
  productId         String
  product           Product  @relation(fields: [productId], references: [id])
  
  // Cantidad y costo
  quantity          Float
  unitCost          Float
  totalCost         Float
  
  // Almacén
  warehouseId       String?
  
  createdAt         DateTime @default(now())

  @@index([workOrderId])
  @@index([productId])
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIAL DE MANTENIMIENTO
// ─────────────────────────────────────────────────────────────────────────────

model MaintenanceHistory {
  id                String   @id @default(cuid())
  assetId           String
  asset             MaintenanceAsset @relation(fields: [assetId], references: [id])
  
  // Orden asociada
  workOrderId       String?
  workOrder         WorkOrder? @relation(fields: [workOrderId], references: [id])
  
  // Fecha
  date              DateTime
  
  // Tipo
  type              MaintenanceType
  description       String
  
  // Costo
  cost              Float
  
  // Técnico
  technician        String?
  
  // Tiempo siguiente mantenimiento
  nextMaintenance   DateTime?
  
  createdAt         DateTime @default(now())

  @@index([assetId])
  @@index([date])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum MaintenanceType {
  PREVENTIVO
  PREDICTIVO
  CORRECTIVO
}

enum WorkOrderType {
  PREVENTIVO
  CORRECTIVO
  EMERGENCIA
  PREDICTIVO
}

enum WorkOrderStatus {
  PENDIENTE
  ASIGNADA
  EN_PROGRESO
  COMPLETADA
  CANCELADA
}
```

---

## 📡 Endpoints de la API

### Controller de Mantenimiento

```typescript
// apps/backend/src/modules/mantenimiento/mantenimiento.controller.ts

import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { MantenimientoService } from './mantenimiento.service';

@Controller('mantenimiento')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MantenimientoController {
  constructor(private mantenimientoService: MantenimientoService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // ACTIVOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('activos')
  @RequirePermissions('mantenimiento:read')
  async getActivos(@Query('status') status?: string) {
    return this.mantenimientoService.getActivos(status);
  }

  @Post('activos')
  @RequirePermissions('mantenimiento:create')
  async createActivo(@Body() dto: CreateMaintenanceAssetDto, @User() user: any) {
    return this.mantenimientoService.createActivo(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PLANES DE MANTENIMIENTO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('planes')
  @RequirePermissions('mantenimiento:read')
  async getPlanes(@Query('type') type?: MaintenanceType) {
    return this.mantenimientoService.getPlanes(type);
  }

  @Post('planes')
  @RequirePermissions('mantenimiento:create')
  async createPlan(@Body() dto: CreateMaintenancePlanDto, @User() user: any) {
    return this.mantenimientoService.createPlan(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ÓRDENES DE TRABAJO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('ordenes')
  @RequirePermissions('mantenimiento:read')
  async getOrdenes(@Query('status') status?: string, @Query('assetId') assetId?: string) {
    return this.mantenimientoService.getOrdenes(status, assetId);
  }

  @Get('ordenes/:id')
  @RequirePermissions('mantenimiento:read')
  async getOrden(@Param('id') id: string) {
    return this.mantenimientoService.getOrden(id);
  }

  @Post('ordenes')
  @RequirePermissions('mantenimiento:create')
  async createOrden(@Body() dto: CreateWorkOrderDto, @User() user: any) {
    return this.mantenimientoService.createOrden(dto, user.id);
  }

  @Put('ordenes/:id')
  @RequirePermissions('mantenimiento:update')
  async updateOrden(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
    @User() user: any,
  ) {
    return this.mantenimientoService.updateOrden(id, dto, user.id);
  }

  @Post('ordenes/:id/iniciar')
  @RequirePermissions('mantenimiento:update')
  async iniciarOrden(@Param('id') id: string, @User() user: any) {
    return this.mantenimientoService.iniciarOrden(id, user.id);
  }

  @Post('ordenes/:id/completar')
  @RequirePermissions('mantenimiento:update')
  async completarOrden(
    @Param('id') id: string,
    @Body() dto: CompleteWorkOrderDto,
    @User() user: any,
  ) {
    return this.mantenimientoService.completarOrden(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MANTENIMIENTO PREVENTIVO AUTOMÁTICO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('preventivo/generar')
  @RequirePermissions('mantenimiento:create')
  async generarMantenimientoPreventivo(@User() user: any) {
    return this.mantenimientoService.generarMantenimientoPreventivo(user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // HISTORIAL
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('historial/:assetId')
  @RequirePermissions('mantenimiento:read')
  async getHistorial(@Param('assetId') assetId: string) {
    return this.mantenimientoService.getHistorial(assetId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/costos')
  @RequirePermissions('reportes-mantenimiento:read')
  async getReporteCostos(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.mantenimientoService.getReporteCostos(new Date(from), new Date(to));
  }

  @Get('reportes/disponibilidad')
  @RequirePermissions('reportes-mantenimiento:read')
  async getDisponibilidad() {
    return this.mantenimientoService.getDisponibilidad();
  }

  @Get('reportes/mtbf-mttr')
  @RequirePermissions('reportes-mantenimiento:read')
  async getMTBF_MTTR(@Query('assetId') assetId?: string) {
    return this.mantenimientoService.getMTBF_MTTR(assetId);
  }
}
```

---

## 🧩 Servicio de Mantenimiento

### Funciones Principales

```typescript
// apps/backend/src/modules/mantenimiento/mantenimiento.service.ts

@Injectable()
export class MantenimientoService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private contabilidadService: ContabilidadService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // GENERAR MANTENIMIENTO PREVENTIVO AUTOMÁTICO
  // ───────────────────────────────────────────────────────────────────────────
  
  async generarMantenimientoPreventivo(userId: string) {
    const now = new Date();
    
    // Obtener planes activos
    const plans = await this.prisma.maintenancePlan.findMany({
      where: { isActive: true },
      include: { assets: true },
    });

    const generatedOrders = [];

    for (const plan of plans) {
      for (const asset of plan.assets) {
        // Verificar si toca mantenimiento
        const isDue = await this.isMaintenanceDue(asset, plan);
        
        if (isDue) {
          // Verificar si ya existe orden pendiente
          const existing = await this.prisma.workOrder.findFirst({
            where: {
              assetId: asset.id,
              type: 'PREVENTIVO',
              status: { in: ['PENDIENTE', 'ASIGNADA', 'EN_PROGRESO'] },
            },
          });

          if (!existing) {
            const order = await this.createOrden({
              assetId: asset.id,
              type: 'PREVENTIVO',
              priority: plan.type === 'PREVENTIVO' ? 'NORMAL' : 'ALTA',
              title: `Mantenimiento ${plan.type} - ${asset.name}`,
              description: plan.description || '',
              scheduledDate: now,
              estimatedHours: plan.estimatedHours,
            }, userId);

            generatedOrders.push(order);
          }
        }
      }
    }

    return {
      generated: generatedOrders.length,
      orders: generatedOrders,
    };
  }

  private async isMaintenanceDue(asset: any, plan: any): Promise<boolean> {
    const now = new Date();
    
    // Última orden completada
    const lastOrder = await this.prisma.workOrder.findFirst({
      where: {
        assetId: asset.id,
        type: plan.type.toUpperCase(),
        status: 'COMPLETADA',
      },
      orderBy: { endDate: 'desc' },
    });

    if (!lastOrder) {
      // Nunca ha tenido mantenimiento, tocar ahora
      return true;
    }

    // Calcular próxima fecha según frecuencia
    const nextDate = new Date(lastOrder.endDate);
    
    switch (plan.frequencyUnit) {
      case 'DIAS':
        nextDate.setDate(nextDate.getDate() + plan.frequency);
        break;
      case 'SEMANAS':
        nextDate.setDate(nextDate.getDate() + (plan.frequency * 7));
        break;
      case 'MESES':
        nextDate.setMonth(nextDate.getMonth() + plan.frequency);
        break;
      case 'ANOS':
        nextDate.setFullYear(nextDate.getFullYear() + plan.frequency);
        break;
    }

    return nextDate <= now;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // COMPLETAR ORDEN DE TRABAJO
  // ───────────────────────────────────────────────────────────────────────────
  
  async completarOrden(orderId: string, dto: CompleteWorkOrderDto, userId: string) {
    const order = await this.prisma.workOrder.findUnique({
      where: { id: orderId },
      include: {
        asset: true,
        parts: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status !== 'EN_PROGRESO') {
      throw new BadRequestException('La orden debe estar en progreso para completarla');
    }

    // Calcular costos finales
    const laborCost = order.laborHours * order.laborRate;
    const partsCost = order.parts.reduce((sum, p) => sum + p.totalCost, 0);
    const totalCost = laborCost + partsCost;

    // Actualizar orden
    await this.prisma.workOrder.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETADA',
        endDate: new Date(),
        completionNotes: dto.completionNotes,
        laborHours: dto.laborHours || order.laborHours,
        laborCost,
        partsCost,
        totalCost,
      },
    });

    // Actualizar activo
    await this.prisma.maintenanceAsset.update({
      where: { id: order.assetId },
      data: {
        status: 'OPERATIVO',
        lastMaintenance: new Date(),
        nextMaintenance: this.calculateNextMaintenance(order.assetId, order.type),
      },
    });

    // Registrar en historial
    await this.prisma.maintenanceHistory.create({
      data: {
        assetId: order.assetId,
        workOrderId: orderId,
        date: new Date(),
        type: order.type.toUpperCase() as MaintenanceType,
        description: dto.completionNotes || order.description,
        cost: totalCost,
        technician: order.assignedTo,
        nextMaintenance: this.calculateNextMaintenance(order.assetId, order.type),
      },
    });

    // Crear asiento contable
    await this.contabilidadService.createEntry({
      date: new Date(),
      description: `Mantenimiento ${order.type} - OT ${order.number}`,
      reference: orderId,
      sourceModule: 'mantenimiento',
      sourceId: orderId,
      createdBy: userId,
      items: [
        {
          accountCode: '6.02.01', // Gasto de mantenimiento
          debit: totalCost,
          credit: 0,
          description: 'Gasto de mantenimiento',
        },
        {
          accountCode: '1.01.03', // Inventario de repuestos
          debit: 0,
          credit: partsCost,
          description: 'Repuestos utilizados',
        },
        {
          accountCode: '2.01.05', // Mano de obra por pagar
          debit: 0,
          credit: laborCost,
          description: 'Mano de obra',
        },
      ],
    });

    return {
      success: true,
      orderId,
      totalCost,
      laborCost,
      partsCost,
    };
  }

  private calculateNextMaintenance(assetId: string, orderType: string): DateTime {
    // Calcular próxima fecha de mantenimiento según plan
    // Implementar según configuración del plan
    return new Date();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  async getReporteCostos(from: Date, to: Date) {
    const orders = await this.prisma.workOrder.findMany({
      where: {
        status: 'COMPLETADA',
        endDate: { gte: from, lte: to },
      },
      include: {
        asset: true,
      },
    });

    const byType = orders.reduce((acc, o) => {
      if (!acc[o.type]) acc[o.type] = { count: 0, cost: 0 };
      acc[o.type].count++;
      acc[o.type].cost += o.totalCost;
      return acc;
    }, {} as Record<string, { count: number; cost: number }>);

    const byAsset = orders.reduce((acc, o) => {
      if (!acc[o.assetId]) acc[o.assetId] = { asset: o.asset.name, count: 0, cost: 0 };
      acc[o.assetId].count++;
      acc[o.assetId].cost += o.totalCost;
      return acc;
    }, {} as Record<string, { asset: string; count: number; cost: number }>);

    return {
      period: { from, to },
      totalOrders: orders.length,
      totalCost: orders.reduce((sum, o) => sum + o.totalCost, 0),
      byType,
      byAsset: Object.values(byAsset),
    };
  }

  async getDisponibilidad() {
    const assets = await this.prisma.maintenanceAsset.findMany({
      include: { fixedAsset: true },
    });

    const total = assets.length;
    const operativos = assets.filter(a => a.status === 'OPERATIVO').length;
    const enMantenimiento = assets.filter(a => a.status === 'MANTENIMIENTO').length;
    const averiados = assets.filter(a => a.status === 'AVERIADO').length;

    return {
      total,
      operativos,
      enMantenimiento,
      averiados,
      disponibilidadPercent: total > 0 ? (operativos / total) * 100 : 0,
    };
  }

  async getMTBF_MTTR(assetId?: string) {
    const where: any = {};
    if (assetId) where.assetId = assetId;

    const history = await this.prisma.maintenanceHistory.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // MTBF (Mean Time Between Failures)
    // MTTR (Mean Time To Repair)
    // Implementar cálculos según historial

    return {
      assetId,
      mtbf: 0, // Horas entre fallas
      mttr: 0, // Horas para reparar
    };
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Preventivo Automático**: Generar órdenes según frecuencia del plan
2. **Repuestos**: Descontar de inventario al completar orden
3. **Costos**: Registrar en contabilidad al completar
4. **Disponibilidad**: Actualizar estado del activo durante mantenimiento
5. **Historial**: Guardar todo mantenimiento para MTBF/MTTR
6. **Prioridad**: Emergencias tienen prioridad sobre preventivos
7. **Seguridad**: No operar activos en mantenimiento

---

## 📁 Archivos del Módulo

```
02-modulo-operativo/
├── inventario.md
├── compras.md
├── produccion.md
├── mantenimiento.md (este archivo)
├── calidad.md
└── flota.md
```

**Anterior**: `01-administrativo/impuestos.md` | **Siguiente**: `02-operativo/calidad.md`
