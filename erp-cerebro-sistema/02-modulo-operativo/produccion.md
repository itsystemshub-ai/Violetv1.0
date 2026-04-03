# Módulo 02: OPERATIVO - Producción (MRP)

## Descripción

Módulo de planificación de requerimientos de materiales (MRP), órdenes de producción, listas de materiales (BOM), control de producción y costeo de manufactura.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  00-shared/auth.md          → Permisos de producción           │
│  00-shared/rbac.md          → Roles PRODUCCION, ADMIN          │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad.md → Asientos de producción    │
│  01-administrativo/activos-fijos.md → Maquinaria usada         │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/inventario.md → Materias primas, productos       │
│  02-operativo/compras.md    → Solicitud de materiales          │
│  02-operativo/mantenimiento.md → Mantenimiento de máquinas     │
├─────────────────────────────────────────────────────────────────┤
│  03-comercial/ventas.md     → Órdenes por satisfacer           │
├─────────────────────────────────────────────────────────────────┤
│  05-configuracion/sistema.md → Parámetros de producción        │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Producción **DESCUENTA** materias primas del inventario
2. Producción **AUMENTA** productos terminados en inventario
3. Producción **GENERA** asiento contable de costo de producción
4. Producción **SOLICITA** compras si faltan materiales
5. Producción **PROGRAMA** mantenimiento de maquinaria

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// LISTAS DE MATERIALES (BOM)
// ─────────────────────────────────────────────────────────────────────────────

model BillOfMaterial {
  id          String   @id @default(cuid())
  productId   String   @unique // Producto terminado
  product     Product  @relation(fields: [productId], references: [id])
  name        String
  version     String   @default("1.0")
  isActive    Boolean  @default(true)
  
  // Cantidad producida por lote
  batchQuantity Float  @default(1)
  
  // Tiempo estimado
  setupTime   Int      @default(0) // Minutos de preparación
  runTime     Int      @default(0) // Minutos por unidad
  
  components  BOMComponent[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([productId])
  @@index([isActive])
}

model BOMComponent {
  id          String   @id @default(cuid())
  bomId       String
  bom         BillOfMaterial @relation(fields: [bomId], references: [id], onDelete: Cascade)
  componentId String   // Materia prima o subensamble
  component   Product  @relation("component", fields: [componentId], references: [id])
  
  // Cantidad necesaria
  quantity    Float
  unitOfMeasure String @default("UNIDAD") // UNIDAD, KG, LITRO, METRO
  
  // Merma esperada (%)
  scrapRate   Float    @default(0)
  
  // Secuencia de ensamblaje
  sequence    Int      @default(0)
  
  createdAt   DateTime @default(now())

  @@index([bomId])
  @@index([componentId])
}

// ─────────────────────────────────────────────────────────────────────────────
// ÓRDENES DE PRODUCCIÓN
// ─────────────────────────────────────────────────────────────────────────────

model ProductionOrder {
  id          String   @id @default(cuid())
  number      String   @unique // ej. OP-2024-000001
  date        DateTime @default(now())
  
  // Producto a fabricar
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  // Cantidades
  quantity    Float
  produced    Float    @default(0)
  scrapped    Float    @default(0)
  
  // Fechas
  startDate   DateTime
  endDate     DateTime?
  actualStartDate DateTime?
  actualEndDate DateTime?
  
  // Estado
  status      ProductionStatus @default(PLANNED) // PLANNED, RELEASED, IN_PROGRESS, COMPLETED, CANCELLED
  
  // BOM usado
  bomId       String?
  bom         BillOfMaterial? @relation(fields: [bomId], references: [id])
  
  // Materiales consumidos
  consumed    ProductionConsumed[]
  
  // Productos producidos
  produced    ProductionResult[]
  
  // Mano de obra
  laborHours  Float    @default(0)
  laborCost   Float    @default(0)
  
  // Costos
  materialCost Float   @default(0)
  overheadCost Float   @default(0)
  totalCost   Float    @default(0)
  unitCost    Float    @default(0)
  
  // Notas
  notes       String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([productId])
  @@index([startDate])
}

model ProductionConsumed {
  id          String   @id @default(cuid())
  orderId     String
  order       ProductionOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String   // Materia prima consumida
  product     Product  @relation("consumed", fields: [productId], references: [id])
  
  quantity    Float
  unitCost    Float
  totalCost   Float
  
  // Lote usado (si aplica)
  lotId       String?
  lot         Lot?     @relation(fields: [lotId], references: [id])
  
  createdAt   DateTime @default(now())

  @@index([orderId])
  @@index([productId])
}

model ProductionResult {
  id          String   @id @default(cuid())
  orderId     String
  order       ProductionOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String   // Producto terminado producido
  product     Product  @relation("produced", fields: [productId], references: [id])
  
  quantity    Float
  unitCost    Float
  totalCost   Float
  
  // Lote generado (si aplica)
  lotId       String?
  lot         Lot?     @relation(fields: [lotId], references: [id])
  
  createdAt   DateTime @default(now())

  @@index([orderId])
  @@index([productId])
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANIFICACIÓN DE CAPACIDAD
// ─────────────────────────────────────────────────────────────────────────────

model WorkCenter {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  type        String   // MAQUINA, LINEA, CELULA
  capacity    Float    // Horas disponibles por día
  efficiency  Float    @default(1) // Factor de eficiencia (0-1)
  
  // Costos
  laborCostPerHour Float @default(0)
  overheadCostPerHour Float @default(0)
  
  // Máquinas asignadas
  machines    Machine[]
  
  // Órdenes asignadas
  orders      ProductionOrder[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}

model Machine {
  id          String   @id @default(cuid())
  name        String
  model       String?
  serialNumber String?
  workCenterId String
  workCenter  WorkCenter @relation(fields: [workCenterId], references: [id])
  
  // Capacidad
  maxCapacity Float    // Unidades por hora
  
  // Mantenimiento
  lastMaintenance DateTime?
  nextMaintenance DateTime?
  maintenancePlanId String?
  
  // Estado
  status      String   @default("OPERATIVO") // OPERATIVO, MANTENIMIENTO, AVERIADO
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workCenterId])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// MRP (Planificación de Requerimientos)
// ─────────────────────────────────────────────────────────────────────────────

model MRPRequest {
  id          String   @id @default(cuid())
  date        DateTime @default(now())
  
  // Producto a planificar
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  // Cantidad requerida
  quantity    Float
  dueDate     DateTime
  
  // Resultados del MRP
  materialsAvailable Boolean @default(false)
  materialsShortage Json? // Lista de materiales faltantes
  
  // Orden generada
  productionOrderId String?
  productionOrder   ProductionOrder? @relation(fields: [productionOrderId], references: [id])
  
  // Estado
  status      MRPStatus @default(PENDING) // PENDING, ANALYZED, ORDERED, CANCELLED
  
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([productId])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum ProductionStatus {
  PLANNED
  RELEASED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum MRPStatus {
  PENDING
  ANALYZED
  ORDERED
  CANCELLED
}
```

---

## 📡 Endpoints de la API

### Controller de Producción

```typescript
// apps/backend/src/modules/produccion/produccion.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ProduccionService } from './produccion.service';

@Controller('produccion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProduccionController {
  constructor(private produccionService: ProduccionService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // LISTAS DE MATERIALES (BOM)
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('bom')
  @RequirePermissions('produccion:read')
  async getBOMs(@Query('productId') productId?: string) {
    return this.produccionService.getBOMs(productId);
  }

  @Get('bom/:id')
  @RequirePermissions('produccion:read')
  async getBOM(@Param('id') id: string) {
    return this.produccionService.getBOM(id);
  }

  @Post('bom')
  @RequirePermissions('produccion:create')
  async createBOM(@Body() dto: CreateBOMDto, @User() user: any) {
    return this.produccionService.createBOM(dto, user.id);
  }

  @Put('bom/:id')
  @RequirePermissions('produccion:update')
  async updateBOM(
    @Param('id') id: string,
    @Body() dto: UpdateBOMDto,
    @User() user: any,
  ) {
    return this.produccionService.updateBOM(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ÓRDENES DE PRODUCCIÓN
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('ordenes')
  @RequirePermissions('produccion:read')
  async getOrdenes(@Query('status') status?: ProductionStatus) {
    return this.produccionService.getOrdenes(status);
  }

  @Get('ordenes/:id')
  @RequirePermissions('produccion:read')
  async getOrden(@Param('id') id: string) {
    return this.produccionService.getOrden(id);
  }

  @Post('ordenes')
  @RequirePermissions('produccion:create')
  async createOrden(@Body() dto: CreateOrdenProduccionDto, @User() user: any) {
    return this.produccionService.createOrden(dto, user.id);
  }

  @Post('ordenes/:id/iniciar')
  @RequirePermissions('produccion:update')
  async iniciarOrden(@Param('id') id: string, @User() user: any) {
    return this.produccionService.iniciarOrden(id, user.id);
  }

  @Post('ordenes/:id/consumir')
  @RequirePermissions('produccion:update')
  async consumirMateriales(
    @Param('id') id: string,
    @Body() dto: ConsumirMaterialesDto,
    @User() user: any,
  ) {
    return this.produccionService.consumirMateriales(id, dto, user.id);
  }

  @Post('ordenes/:id/producir')
  @RequirePermissions('produccion:update')
  async registrarProduccion(
    @Param('id') id: string,
    @Body() dto: RegistrarProduccionDto,
    @User() user: any,
  ) {
    return this.produccionService.registrarProduccion(id, dto, user.id);
  }

  @Post('ordenes/:id/completar')
  @RequirePermissions('produccion:update')
  async completarOrden(@Param('id') id: string, @User() user: any) {
    return this.produccionService.completarOrden(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MRP (Planificación de Requerimientos)
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('mrp/run')
  @RequirePermissions('produccion:create')
  async runMRP(@Body() dto: RunMRPDto, @User() user: any) {
    return this.produccionService.runMRP(dto, user.id);
  }

  @Get('mrp/requirements')
  @RequirePermissions('produccion:read')
  async getRequirements(@Query('productId') productId: string) {
    return this.produccionService.getRequirements(productId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CENTROS DE TRABAJO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('work-centers')
  @RequirePermissions('produccion:read')
  async getWorkCenters() {
    return this.produccionService.getWorkCenters();
  }

  @Get('work-centers/:id/capacity')
  @RequirePermissions('produccion:read')
  async getWorkCenterCapacity(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.produccionService.getWorkCenterCapacity(id, new Date(from), new Date(to));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // COSTOS DE PRODUCCIÓN
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('ordenes/:id/costos')
  @RequirePermissions('produccion:read')
  async getOrdenCostos(@Param('id') id: string) {
    return this.produccionService.getOrdenCostos(id);
  }

  @Post('ordenes/:id/calcular-costo')
  @RequirePermissions('produccion:update')
  async calcularCosto(@Param('id') id: string, @User() user: any) {
    return this.produccionService.calcularCosto(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/eficiencia')
  @RequirePermissions('reportes-produccion:read')
  async getEficiencia(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.produccionService.getEficiencia(new Date(from), new Date(to));
  }

  @Get('reportes/mermas')
  @RequirePermissions('reportes-produccion:read')
  async getMermas(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.produccionService.getMermas(new Date(from), new Date(to));
  }

  @Get('reportes/costo-producto')
  @RequirePermissions('reportes-produccion:read')
  async getCostoProducto(@Query('productId') productId: string) {
    return this.produccionService.getCostoProducto(productId);
  }
}
```

---

## 🧩 Servicio de Producción

### Funciones Principales

```typescript
// apps/backend/src/modules/produccion/produccion.service.ts

@Injectable()
export class ProduccionService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private contabilidadService: ContabilidadService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR LISTA DE MATERIALES (BOM)
  // ───────────────────────────────────────────────────────────────────────────
  
  async createBOM(dto: CreateBOMDto, userId: string) {
    // Validar que el producto no tenga BOM activo
    const existing = await this.prisma.billOfMaterial.findUnique({
      where: { productId: dto.productId },
    });

    if (existing && existing.isActive) {
      throw new BadRequestException('El producto ya tiene una BOM activa');
    }

    // Crear BOM
    const bom = await this.prisma.billOfMaterial.create({
      data: {
        productId: dto.productId,
        name: dto.name,
        version: dto.version || '1.0',
        batchQuantity: dto.batchQuantity || 1,
        setupTime: dto.setupTime || 0,
        runTime: dto.runTime || 0,
        components: {
          create: dto.components.map((comp, index) => ({
            componentId: comp.componentId,
            quantity: comp.quantity,
            unitOfMeasure: comp.unitOfMeasure || 'UNIDAD',
            scrapRate: comp.scrapRate || 0,
            sequence: index,
          })),
        },
      },
      include: {
        product: true,
        components: { include: { component: true } },
      },
    });

    return bom;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR ORDEN DE PRODUCCIÓN
  // ───────────────────────────────────────────────────────────────────────────
  
  async createOrden(dto: CreateOrdenProduccionDto, userId: string) {
    const number = await this.getNextOrderNumber();

    // Obtener BOM del producto
    const bom = await this.prisma.billOfMaterial.findUnique({
      where: { productId: dto.productId },
      include: { components: { include: { component: true } } },
    });

    if (!bom) {
      throw new BadRequestException('El producto no tiene lista de materiales');
    }

    // Calcular materiales necesarios
    const materials = bom.components.map(comp => {
      const quantityNeeded = (comp.quantity / bom.batchQuantity) * dto.quantity;
      const scrap = quantityNeeded * (comp.scrapRate || 0);
      return {
        componentId: comp.componentId,
        componentName: comp.component.name,
        quantityNeeded: quantityNeeded + scrap,
        currentStock: comp.component.stock,
        isAvailable: comp.component.stock >= (quantityNeeded + scrap),
      };
    });

    const allAvailable = materials.every(m => m.isAvailable);

    // Crear orden
    const order = await this.prisma.productionOrder.create({
      data: {
        number,
        productId: dto.productId,
        quantity: dto.quantity,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: allAvailable ? 'RELEASED' : 'PLANNED',
        bomId: bom.id,
        notes: dto.notes,
      },
      include: {
        product: true,
        bom: true,
      },
    });

    // Si no hay materiales, crear solicitud de compra
    if (!allAvailable) {
      const shortage = materials.filter(m => !m.isAvailable);
      await this.createPurchaseRequisition(shortage, order.id);
    }

    return order;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONSUMIR MATERIALES (Con PEPS)
  // ───────────────────────────────────────────────────────────────────────────
  
  async consumirMateriales(orderId: string, dto: ConsumirMaterialesDto, userId: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        bom: { include: { components: { include: { component: true } } } },
        consumed: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status !== 'IN_PROGRESS') {
      throw new BadRequestException('La orden debe estar en progreso');
    }

    let totalMaterialCost = 0;

    // Consumir cada material
    for (const item of dto.items) {
      // Registrar salida de inventario (PEPS)
      const movement = await this.inventoryService.registrarSalida({
        productId: item.componentId,
        warehouseId: dto.warehouseId,
        quantity: item.quantity,
        reference: orderId,
        referenceType: 'PRODUCTION',
        notes: `Consumo para OP ${order.number}`,
      }, userId);

      totalMaterialCost += movement.movement.totalCost || 0;

      // Registrar consumo en la orden
      await this.prisma.productionConsumed.create({
        data: {
          orderId,
          productId: item.componentId,
          quantity: item.quantity,
          unitCost: movement.movement.unitCost || 0,
          totalCost: movement.movement.totalCost || 0,
          lotId: item.lotId,
        },
      });
    }

    // Actualizar costo de materiales en la orden
    await this.prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        materialCost: { increment: totalMaterialCost },
        totalCost: { increment: totalMaterialCost },
      },
    });

    return { success: true, materialCost: totalMaterialCost };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR PRODUCCIÓN (Producto Terminado)
  // ───────────────────────────────────────────────────────────────────────────
  
  async registrarProduccion(orderId: string, dto: RegistrarProduccionDto, userId: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: { product: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Calcular costo unitario
    const totalCost = order.totalCost;
    const totalProduced = order.produced + dto.quantity;
    const unitCost = totalProduced > 0 ? totalCost / totalProduced : 0;

    // Registrar entrada de producto terminado
    await this.inventoryService.registrarEntrada({
      productId: order.productId,
      warehouseId: dto.warehouseId,
      quantity: dto.quantity,
      unitCost,
      reference: orderId,
      referenceType: 'PRODUCTION',
      lotCode: dto.lotCode,
      notes: `Producción de OP ${order.number}`,
    }, userId);

    // Registrar resultado de producción
    await this.prisma.productionResult.create({
      data: {
        orderId,
        productId: order.productId,
        quantity: dto.quantity,
        unitCost,
        totalCost: dto.quantity * unitCost,
        lotId: dto.lotId,
      },
    });

    // Actualizar orden
    await this.prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        produced: { increment: dto.quantity },
        totalCost,
        unitCost,
      },
    });

    return { success: true, unitCost };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // COMPLETAR ORDEN DE PRODUCCIÓN
  // ───────────────────────────────────────────────────────────────────────────
  
  async completarOrden(orderId: string, userId: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        consumed: { include: { product: true } },
        produced: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status !== 'IN_PROGRESS') {
      throw new BadRequestException('La orden debe estar en progreso');
    }

    // Calcular costos finales
    const finalCost = await this.calcularCosto(orderId, userId);

    // Crear asiento contable
    await this.contabilidadService.createProductionEntry({
      orderId,
      orderNumber: order.number,
      productId: order.productId,
      productName: order.product.name,
      quantityProduced: order.produced,
      unitCost: finalCost.unitCost,
      totalCost: finalCost.totalCost,
      materialCost: order.materialCost,
      laborCost: order.laborCost,
      overheadCost: order.overheadCost,
      createdBy: userId,
    });

    // Actualizar estado
    await this.prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        actualEndDate: new Date(),
        unitCost: finalCost.unitCost,
        totalCost: finalCost.totalCost,
      },
    });

    return { success: true, ...finalCost };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MRP: PLANIFICACIÓN DE REQUERIMIENTOS
  // ───────────────────────────────────────────────────────────────────────────
  
  async runMRP(dto: RunMRPDto, userId: string) {
    const { productId, quantity, dueDate } = dto;

    // 1. Obtener BOM del producto
    const bom = await this.prisma.billOfMaterial.findUnique({
      where: { productId },
      include: { components: { include: { component: true } } },
    });

    if (!bom) {
      throw new BadRequestException('Producto sin lista de materiales');
    }

    // 2. Calcular requerimientos de materiales
    const requirements = bom.components.map(comp => {
      const quantityNeeded = (comp.quantity / bom.batchQuantity) * quantity;
      const scrap = quantityNeeded * (comp.scrapRate || 0);
      const totalNeeded = quantityNeeded + scrap;

      return {
        componentId: comp.componentId,
        componentName: comp.component.name,
        quantityNeeded: totalNeeded,
        currentStock: comp.component.stock,
        minStock: comp.component.minStock,
        available: comp.component.stock,
        shortage: totalNeeded - comp.component.stock,
        needsPurchase: comp.component.stock < totalNeeded,
      };
    });

    const hasShortage = requirements.some(r => r.needsPurchase);

    // 3. Crear solicitud MRP
    const mrpRequest = await this.prisma.mRPRequest.create({
      data: {
        productId,
        quantity,
        dueDate,
        materialsAvailable: !hasShortage,
        materialsShortage: hasShortage ? requirements.filter(r => r.needsPurchase) : null,
        status: hasShortage ? 'ANALYZED' : 'ORDERED',
      },
    });

    // 4. Si hay shortage, crear órdenes de compra sugeridas
    if (hasShortage) {
      const purchaseSuggestions = requirements
        .filter(r => r.needsPurchase)
        .map(r => ({
          componentId: r.componentId,
          componentName: r.componentName,
          quantityToOrder: r.shortage,
          suggestedDeliveryDate: new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 días antes
        }));

      return {
        mrpRequestId: mrpRequest.id,
        canProduce: false,
        requirements,
        purchaseSuggestions,
        message: 'Materiales insuficientes. Se sugieren compras.',
      };
    }

    // 5. Si hay materiales, crear orden de producción
    const order = await this.createOrden({
      productId,
      quantity,
      startDate: new Date(),
      endDate: dueDate,
      notes: `Generada por MRP - Solicitud ${mrpRequest.id}`,
    }, userId);

    await this.prisma.mRPRequest.update({
      where: { id: mrpRequest.id },
      data: {
        status: 'ORDERED',
        productionOrderId: order.id,
      },
    });

    return {
      mrpRequestId: mrpRequest.id,
      canProduce: true,
      productionOrderId: order.id,
      requirements,
      message: 'Materiales disponibles. Orden de producción creada.',
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CALCULAR COSTO DE ORDEN
  // ───────────────────────────────────────────────────────────────────────────
  
  async calcularCosto(orderId: string, userId: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        consumed: true,
        produced: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Costo de materiales (ya calculado en consumos)
    const materialCost = order.consumed.reduce((sum, c) => sum + c.totalCost, 0);

    // Costo de mano de obra
    const laborCost = (order.laborHours || 0) * (order.laborCost || 0);

    // Overhead (configurable, ej. 15% de materiales)
    const overheadRate = await this.config.getNumber('produccion.overhead_rate', 0.15);
    const overheadCost = materialCost * overheadRate;

    // Costo total
    const totalCost = materialCost + laborCost + overheadCost;

    // Costo unitario
    const unitCost = order.produced > 0 ? totalCost / order.produced : 0;

    // Actualizar orden
    await this.prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        materialCost,
        laborCost,
        overheadCost,
        totalCost,
        unitCost,
      },
    });

    return {
      materialCost,
      laborCost,
      overheadCost,
      totalCost,
      unitCost,
      produced: order.produced,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async getNextOrderNumber() {
    const year = new Date().getFullYear();
    const last = await this.prisma.productionOrder.findFirst({
      where: { number: { startsWith: `OP-${year}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[2]) + 1 : 1;
    return `OP-${year}-${num.toString().padStart(6, '0')}`;
  }

  private async createPurchaseRequisition(shortage: any[], orderId: string) {
    // Crear solicitud de compra para materiales faltantes
    // Implementar según módulo de compras
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  async getEficiencia(from: Date, to: Date) {
    const orders = await this.prisma.productionOrder.findMany({
      where: {
        status: 'COMPLETED',
        actualEndDate: { gte: from, lte: to },
      },
    });

    const efficiency = orders.map(o => {
      const plannedDuration = (o.endDate.getTime() - o.startDate.getTime()) / (1000 * 60 * 60 * 24);
      const actualDuration = (o.actualEndDate.getTime() - o.actualStartDate.getTime()) / (1000 * 60 * 60 * 24);
      const durationEfficiency = plannedDuration > 0 ? (plannedDuration / actualDuration) * 100 : 0;

      const qualityRate = o.produced > 0 ? ((o.produced - o.scrapped) / o.produced) * 100 : 0;

      return {
        orderId: o.id,
        orderNumber: o.number,
        product: o.product.name,
        plannedDuration,
        actualDuration,
        durationEfficiency,
        qualityRate,
        overallEfficiency: (durationEfficiency + qualityRate) / 2,
      };
    });

    const avgEfficiency = orders.length > 0
      ? orders.reduce((sum, o) => sum + o.overallEfficiency, 0) / orders.length
      : 0;

    return {
      period: { from, to },
      totalOrders: orders.length,
      avgEfficiency: avgEfficiency.toFixed(2),
      orders: efficiency,
    };
  }

  async getMermas(from: Date, to: Date) {
    const orders = await this.prisma.productionOrder.findMany({
      where: {
        status: 'COMPLETED',
        actualEndDate: { gte: from, lte: to },
      },
      include: { product: true },
    });

    const scrapByProduct = orders.reduce((acc, o) => {
      if (!acc[o.productId]) {
        acc[o.productId] = {
          productId: o.productId,
          productName: o.product.name,
          totalProduced: 0,
          totalScrapped: 0,
        };
      }
      acc[o.productId].totalProduced += o.produced;
      acc[o.productId].totalScrapped += o.scrapped;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(scrapByProduct).map(p => ({
      ...p,
      scrapRate: p.totalProduced > 0 ? ((p.totalScrapped / p.totalProduced) * 100).toFixed(2) : '0',
    }));
  }

  async getCostoProducto(productId: string) {
    const orders = await this.prisma.productionOrder.findMany({
      where: { productId, status: 'COMPLETED' },
      orderBy: { actualEndDate: 'desc' },
      take: 10,
    });

    const avgUnitCost = orders.length > 0
      ? orders.reduce((sum, o) => sum + o.unitCost, 0) / orders.length
      : 0;

    const costHistory = orders.map(o => ({
      date: o.actualEndDate,
      unitCost: o.unitCost,
      quantity: o.produced,
    }));

    return {
      productId,
      avgUnitCost,
      costHistory,
      lastCost: orders[0]?.unitCost || 0,
    };
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **BOM Obligatoria**: No producir sin BOM aprobada
2. **Consumo PEPS**: Salidas de materiales usan costo PEPS
3. **Costeo Real**: Costos reales vs estándar
4. **Merma**: Registrar mermas y productos no conformes
5. **Trazabilidad**: Lotes de materias primas → lotes de producto terminado
6. **Capacidad**: Validar disponibilidad de centros de trabajo
7. **Mantenimiento**: Programar mantenimiento preventivo de máquinas

---

## 🔗 Conexiones Detalladas

### Con Inventario

```typescript
// Al consumir materiales:
await this.inventoryService.registrarSalida({
  productId: item.componentId,
  warehouseId: dto.warehouseId,
  quantity: item.quantity,
  reference: orderId,
  referenceType: 'PRODUCTION',
}, userId);

// Al producir producto terminado:
await this.inventoryService.registrarEntrada({
  productId: order.productId,
  warehouseId: dto.warehouseId,
  quantity: dto.quantity,
  unitCost,
  reference: orderId,
  referenceType: 'PRODUCTION',
}, userId);
```

### Con Contabilidad

```typescript
// Al completar orden:
await this.contabilidadService.createProductionEntry({
  orderId,
  orderNumber: order.number,
  productId: order.productId,
  productName: order.product.name,
  quantityProduced: order.produced,
  unitCost: finalCost.unitCost,
  totalCost: finalCost.totalCost,
  materialCost: order.materialCost,
  laborCost: order.laborCost,
  overheadCost: order.overheadCost,
  createdBy: userId,
});

// Asiento generado:
// Débito: Inventario Producto Terminado (totalCost)
// Crédito: Inventario Materias Primas (materialCost)
// Crédito: Mano de Obra por Pagar (laborCost)
// Crédito: Overhead por Pagar (overheadCost)
```

---

## 📁 Archivos del Módulo

```
02-modulo-operativo/
├── inventario.md
├── compras.md
├── produccion.md (este archivo)
├── mantenimiento.md
├── calidad.md
└── flota.md
```

**Anterior**: `02-operativo/compras.md` | **Siguiente**: `02-operativo/mantenimiento.md`
