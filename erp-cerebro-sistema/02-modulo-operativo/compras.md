# Módulo 02: OPERATIVO - Compras

## Descripción

Módulo de gestión de compras que incluye solicitudes, órdenes de compra, recepción de mercancía, evaluación de proveedores y cuentas por pagar.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  00-shared/auth.md          → Permisos de comprador            │
│  00-shared/rbac.md          → Roles COMPRADOR, ADMIN           │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad.md → Asientos de compra        │
│  01-administrativo/tesoreria.md      → Pagos a proveedores     │
│  01-administrativo/presupuesto.md    → Límites de compra       │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/inventario.md → Entrada de mercancía             │
│  02-operativo/produccion.md → Solicitud de materiales          │
├─────────────────────────────────────────────────────────────────┤
│  03-comercial/ventas.md     → Alerta de stock bajo             │
├─────────────────────────────────────────────────────────────────┤
│  05-configuracion/sistema.md → Parámetros de aprobación        │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Compras **AUMENTA** inventario al recibir mercancía
2. Compras **CREA** asiento contable de compra
3. Compras **GENERA** cuenta por pagar en tesorería
4. Inventario **DISPARA** alerta de compra cuando stock < mínimo
5. Producción **SOLICITA** materiales mediante órdenes de compra

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// PROVEEDORES
// ─────────────────────────────────────────────────────────────────────────────

model Supplier {
  id           String   @id @default(cuid())
  businessName String
  rif          String   @unique // J-12345678-9
  code         String   @unique // Código interno (ej. PROV-001)
  
  // Datos de contacto
  address      String?
  phone        String?
  email        String?
  website      String?
  contactName  String?
  contactPhone String?
  contactEmail String?
  
  // Datos fiscales
  isContributor Boolean @default(true) // Contribuyente IVA?
  hasSpecialTax Boolean @default(false) // Régimen especial?
  
  // Datos bancarios
  bankName     String?
  bankAccount  String?
  bankType     String? // AHORRO, CORRIENTE
  
  // Clasificación
  categoryId   String?
  category     SupplierCategory? @relation(fields: [categoryId], references: [id])
  
  // Evaluación
  rating       Float    @default(0) // 1-5 estrellas
  isApproved   Boolean  @default(true)
  
  // Relaciones
  purchases    Purchase[]
  evaluations  SupplierEvaluation[]
  lots         Lot[] // 02-operativo/inventario
  
  // Estado
  isActive     Boolean  @default(true)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([rif])
  @@index([code])
  @@index([categoryId])
}

model SupplierCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  suppliers   Supplier[]
  createdAt   DateTime @default(now())

  @@index([name])
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLICITUDES DE COMPRA
// ─────────────────────────────────────────────────────────────────────────────

model PurchaseRequest {
  id            String   @id @default(cuid())
  number        String   @unique // ej. SC-2024-000001
  date          DateTime @default(now())
  requestedBy   String
  requesterName String?
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id]) // 01-administrativo/rrhh
  
  items         PurchaseRequestItem[]
  
  // Estado
  status        PRStatus @default(PENDING) // PENDING, APPROVED, REJECTED, ORDERED
  priority      Priority @default(NORMAL) // URGENTE, ALTA, NORMAL, BAJA
  
  // Aprobación
  approvedBy    String?
  approvedAt    DateTime?
  rejectedBy    String?
  rejectedAt    DateTime?
  rejectReason  String?
  
  // Orden generada
  purchaseOrderId String?
  purchaseOrder   PurchaseOrder? @relation(fields: [purchaseOrderId], references: [id])
  
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status])
  @@index([date])
}

model PurchaseRequestItem {
  id          String   @id @default(cuid())
  requestId   String
  request     PurchaseRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id]) // 02-operativo/inventario
  
  quantity    Float
  estimatedCost Float?
  description String?
  
  // Aprobación
  approvedQuantity Float?
  
  createdAt   DateTime @default(now())

  @@index([requestId])
  @@index([productId])
}

// ─────────────────────────────────────────────────────────────────────────────
// ÓRDENES DE COMPRA
// ─────────────────────────────────────────────────────────────────────────────

model PurchaseOrder {
  id            String   @id @default(cuid())
  number        String   @unique // ej. OC-2024-000001
  date          DateTime @default(now())
  
  // Proveedor
  supplierId    String
  supplier      Supplier @relation(fields: [supplierId], references: [id])
  
  // Origen
  requestId     String?
  request       PurchaseRequest? @relation(fields: [requestId], references: [id])
  
  items         PurchaseOrderItem[]
  
  // Totales
  subtotal      Float
  tax           Float
  total         Float
  
  // Fechas
  expectedDate  DateTime?
  deliveryDate  DateTime?
  
  // Estado
  status        POStatus @default(DRAFT) // DRAFT, SENT, CONFIRMED, PARTIAL, RECEIVED, CANCELLED
  
  // Aprobación
  approvedBy    String?
  approvedAt    DateTime?
  
  // Recepción
  receivedAt    DateTime?
  purchaseId    String?
  purchase      Purchase? @relation(fields: [purchaseId], references: [id])
  
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([supplierId])
  @@index([status])
  @@index([date])
}

model PurchaseOrderItem {
  id          String   @id @default(cuid())
  orderId     String
  order       PurchaseOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  quantity    Float
  received    Float    @default(0)
  unitCost    Float
  taxRate     Float    @default(0.16)
  subtotal    Float
  total       Float
  
  @@index([orderId])
  @@index([productId])
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPRAS (Recepción)
// ─────────────────────────────────────────────────────────────────────────────

model Purchase {
  id            String   @id @default(cuid())
  number        String   @unique // ej. C-2024-000001
  date          DateTime @default(now())
  
  // Proveedor
  supplierId    String
  supplier      Supplier @relation(fields: [supplierId], references: [id])
  
  // Orden de compra asociada
  orderId       String?
  order         PurchaseOrder? @relation(fields: [orderId], references: [id])
  
  items         PurchaseItem[]
  
  // Totales
  subtotal      Float
  tax           Float
  total         Float
  
  // Factura del proveedor
  invoiceNumber String? // Número de factura del proveedor
  invoiceDate   DateTime?
  controlNumber String? // Número de control SENIAT
  
  // Estado
  status        PurchaseStatus @default(PENDING) // PENDING, RECEIVED, INVOICED, CANCELLED
  
  // Pago
  paymentStatus PaymentStatus @default(PENDING)
  dueDate       DateTime?
  paidAt        DateTime?
  
  // Cuenta por pagar
  payableId     String?
  payable       AccountPayable? @relation(fields: [payableId], references: [id])
  
  // Auditoría
  receivedBy    String?
  receivedAt    DateTime?
  invoicedBy    String?
  invoicedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([supplierId])
  @@index([status])
  @@index([date])
}

model PurchaseItem {
  id          String   @id @default(cuid())
  purchaseId  String
  purchase    Purchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  quantity    Float
  unitCost    Float
  taxRate     Float    @default(0.16)
  subtotal    Float
  taxAmount   Float
  total       Float
  
  // Lote (si aplica)
  lotId       String?
  lot         Lot?     @relation(fields: [lotId], references: [id])
  
  @@index([purchaseId])
  @@index([productId])
}

// ─────────────────────────────────────────────────────────────────────────────
// EVALUACIÓN DE PROVEEDORES
// ─────────────────────────────────────────────────────────────────────────────

model SupplierEvaluation {
  id            String   @id @default(cuid())
  supplierId    String
  supplier      Supplier @relation(fields: [supplierId], references: [id])
  period        String   // MM-YYYY
  
  // Puntuaciones (1-5)
  qualityScore  Float    // Calidad del producto/servicio
  deliveryScore Float    // Cumplimiento de fechas
  priceScore    Float    // Competitividad de precios
  serviceScore  Float    // Atención al cliente
  totalScore    Float    // Promedio
  
  notes         String?
  evaluatedBy   String
  createdAt     DateTime @default(now())

  @@unique([supplierId, period])
  @@index([supplierId])
}

// ─────────────────────────────────────────────────────────────────────────────
// CUENTAS POR PAGAR (conexión con 01-administrativo/tesoreria)
// ─────────────────────────────────────────────────────────────────────────────

model AccountPayable {
  id            String   @id @default(cuid())
  purchaseId    String   @unique
  purchase      Purchase @relation(fields: [purchaseId], references: [id])
  supplierId    String
  supplier      Supplier @relation(fields: [supplierId], references: [id])
  
  originalAmount Float
  paidAmount    Float    @default(0)
  balance       Float
  
  dueDate       DateTime
  status        APStatus @default(PENDING) // PENDING, PARTIAL, PAID, OVERDUE
  
  payments      APPayment[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([supplierId])
  @@index([status])
  @@index([dueDate])
}

model APPayment {
  id            String   @id @default(cuid())
  payableId     String
  payable       AccountPayable @relation(fields: [payableId], references: [id])
  amount        Float
  date          DateTime
  method        String   // TRANSFERENCIA, CHEQUE, EFECTIVO, ZELLE
  reference     String?
  bankAccountId String?
  bankAccount   BankAccount? @relation(fields: [bankAccountId], references: [id])
  journalEntryId String?
  journalEntry  JournalEntry? @relation(fields: [journalEntryId], references: [id])
  createdAt     DateTime @default(now())

  @@index([payableId])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum PRStatus {
  PENDING
  APPROVED
  REJECTED
  ORDERED
}

enum Priority {
  URGENTE
  ALTA
  NORMAL
  BAJA
}

enum POStatus {
  DRAFT
  SENT
  CONFIRMED
  PARTIAL
  RECEIVED
  CANCELLED
}

enum PurchaseStatus {
  PENDING
  RECEIVED
  INVOICED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PARTIAL
  PAID
}

enum APStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
}
```

---

## 📡 Endpoints de la API

### Controller de Compras

```typescript
// apps/backend/src/modules/compras/compras.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ComprasService } from './compras.service';

@Controller('compras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComprasController {
  constructor(private comprasService: ComprasService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // PROVEEDORES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('proveedores')
  @RequirePermissions('proveedores:read')
  async getProveedores(@Query('categoryId') categoryId?: string) {
    return this.comprasService.getProveedores(categoryId);
  }

  @Get('proveedores/:id')
  @RequirePermissions('proveedores:read')
  async getProveedor(@Param('id') id: string) {
    return this.comprasService.getProveedor(id);
  }

  @Post('proveedores')
  @RequirePermissions('proveedores:create')
  async createProveedor(@Body() dto: CreateProveedorDto, @User() user: any) {
    return this.comprasService.createProveedor(dto, user.id);
  }

  @Put('proveedores/:id')
  @RequirePermissions('proveedores:update')
  async updateProveedor(
    @Param('id') id: string,
    @Body() dto: UpdateProveedorDto,
    @User() user: any,
  ) {
    return this.comprasService.updateProveedor(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SOLICITUDES DE COMPRA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('solicitudes')
  @RequirePermissions('compras:read')
  async getSolicitudes(@Query('status') status?: PRStatus) {
    return this.comprasService.getSolicitudes(status);
  }

  @Post('solicitudes')
  @RequirePermissions('compras:create')
  async createSolicitud(@Body() dto: CreateSolicitudDto, @User() user: any) {
    return this.comprasService.createSolicitud(dto, user.id);
  }

  @Post('solicitudes/:id/aprobar')
  @RequirePermissions('compras:approve')
  async aprobarSolicitud(@Param('id') id: string, @User() user: any) {
    return this.comprasService.aprobarSolicitud(id, user.id);
  }

  @Post('solicitudes/:id/rechazar')
  @RequirePermissions('compras:approve')
  async rechazarSolicitud(
    @Param('id') id: string,
    @Body() dto: RechazarSolicitudDto,
    @User() user: any,
  ) {
    return this.comprasService.rechazarSolicitud(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ÓRDENES DE COMPRA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('ordenes')
  @RequirePermissions('compras:read')
  async getOrdenes(@Query('status') status?: POStatus) {
    return this.comprasService.getOrdenes(status);
  }

  @Get('ordenes/:id')
  @RequirePermissions('compras:read')
  async getOrden(@Param('id') id: string) {
    return this.comprasService.getOrden(id);
  }

  @Post('ordenes')
  @RequirePermissions('compras:create')
  async createOrden(@Body() dto: CreateOrdenDto, @User() user: any) {
    return this.comprasService.createOrden(dto, user.id);
  }

  @Post('ordenes/:id/enviar')
  @RequirePermissions('compras:create')
  async enviarOrden(@Param('id') id: string, @User() user: any) {
    return this.comprasService.enviarOrden(id, user.id);
  }

  @Post('ordenes/:id/recibir')
  @RequirePermissions('compras:create')
  async recibirOrden(
    @Param('id') id: string,
    @Body() dto: RecibirOrdenDto,
    @User() user: any,
  ) {
    return this.comprasService.recibirOrden(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // COMPRAS (Recepción)
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('compras')
  @RequirePermissions('compras:read')
  async getCompras(@Query('status') status?: PurchaseStatus) {
    return this.comprasService.getCompras(status);
  }

  @Get('compras/:id')
  @RequirePermissions('compras:read')
  async getCompra(@Param('id') id: string) {
    return this.comprasService.getCompra(id);
  }

  @Post('compras')
  @RequirePermissions('compras:create')
  async createCompra(@Body() dto: CreateCompraDto, @User() user: any) {
    return this.comprasService.createCompra(dto, user.id);
  }

  @Post('compras/:id/facturar')
  @RequirePermissions('compras:create')
  async facturarCompra(
    @Param('id') id: string,
    @Body() dto: FacturarCompraDto,
    @User() user: any,
  ) {
    return this.comprasService.facturarCompra(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CUENTAS POR PAGAR
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('cuentas-por-pagar')
  @RequirePermissions('compras:read')
  async getCuentasPorPagar(@Query('supplierId') supplierId?: string) {
    return this.comprasService.getCuentasPorPagar(supplierId);
  }

  @Post('cuentas-por-pagar/:id/pagar')
  @RequirePermissions('compras:create')
  async registrarPago(
    @Param('id') id: string,
    @Body() dto: RegistrarPagoDto,
    @User() user: any,
  ) {
    return this.comprasService.registrarPago(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVALUACIÓN DE PROVEEDORES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('evaluaciones')
  @RequirePermissions('compras:read')
  async getEvaluaciones(@Query('supplierId') supplierId?: string) {
    return this.comprasService.getEvaluaciones(supplierId);
  }

  @Post('evaluaciones')
  @RequirePermissions('compras:create')
  async createEvaluacion(@Body() dto: CreateEvaluacionDto, @User() user: any) {
    return this.comprasService.createEvaluacion(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/compras-periodo')
  @RequirePermissions('reportes-compras:read')
  async getComprasPeriodo(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.comprasService.getComprasPeriodo(new Date(from), new Date(to));
  }

  @Get('reportes/compras-proveedor')
  @RequirePermissions('reportes-compras:read')
  async getComprasPorProveedor(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.comprasService.getComprasPorProveedor(new Date(from), new Date(to));
  }

  @Get('reportes/ordenes-pendientes')
  @RequirePermissions('reportes-compras:read')
  async getOrdenesPendientes() {
    return this.comprasService.getOrdenesPendientes();
  }
}
```

---

## 🧩 Servicio de Compras

### Funciones Principales

```typescript
// apps/backend/src/modules/compras/compras.service.ts

@Injectable()
export class ComprasService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private contabilidadService: ContabilidadService,
    private config: SystemConfigService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR SOLICITUD DE COMPRA
  // ───────────────────────────────────────────────────────────────────────────
  
  async createSolicitud(dto: CreateSolicitudDto, userId: string) {
    const number = await this.getNextRequestNumber();

    const request = await this.prisma.purchaseRequest.create({
      data: {
        number,
        requestedBy: userId,
        requesterName: dto.requesterName,
        departmentId: dto.departmentId,
        priority: dto.priority || 'NORMAL',
        notes: dto.notes,
        items: {
          create: dto.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            estimatedCost: item.estimatedCost,
            description: item.description,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        department: true,
      },
    });

    return request;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // APROBAR SOLICITUD
  // ───────────────────────────────────────────────────────────────────────────
  
  async aprobarSolicitud(requestId: string, userId: string) {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: { items: true },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Solo se pueden aprobar solicitudes pendientes');
    }

    // Verificar presupuesto si está configurado
    const checkBudget = await this.config.getBoolean('compras.check_budget', 'false');
    if (checkBudget) {
      const totalEstimated = request.items.reduce(
        (sum, item) => sum + (item.estimatedCost || 0) * item.quantity,
        0
      );
      
      const budgetAvailable = await this.verifyBudget(request.departmentId, totalEstimated);
      if (!budgetAvailable) {
        throw new BadRequestException('Presupuesto insuficiente para esta solicitud');
      }
    }

    await this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    return { success: true, message: 'Solicitud aprobada' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR ORDEN DE COMPRA
  // ───────────────────────────────────────────────────────────────────────────
  
  async createOrden(dto: CreateOrdenDto, userId: string) {
    const number = await this.getNextOrderNumber();

    // Calcular totales
    let subtotal = 0;
    let tax = 0;

    for (const item of dto.items) {
      const itemSubtotal = item.quantity * item.unitCost;
      const itemTax = itemSubtotal * (item.taxRate || 0.16);
      subtotal += itemSubtotal;
      tax += itemTax;
    }

    const total = subtotal + tax;

    const order = await this.prisma.purchaseOrder.create({
      data: {
        number,
        supplierId: dto.supplierId,
        requestId: dto.requestId,
        subtotal,
        tax,
        total,
        expectedDate: dto.expectedDate,
        notes: dto.notes,
        status: 'DRAFT',
        items: {
          create: dto.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            taxRate: item.taxRate || 0.16,
            subtotal: item.quantity * item.unitCost,
            total: item.quantity * item.unitCost * (1 + (item.taxRate || 0.16)),
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    // Si viene de una solicitud aprobada, actualizar solicitud
    if (dto.requestId) {
      await this.prisma.purchaseRequest.update({
        where: { id: dto.requestId },
        data: {
          status: 'ORDERED',
          purchaseOrderId: order.id,
        },
      });
    }

    return order;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ENVIAR ORDEN AL PROVEEDOR
  // ───────────────────────────────────────────────────────────────────────────
  
  async enviarOrden(orderId: string, userId: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { supplier: true, items: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden enviar órdenes en borrador');
    }

    // Actualizar estado
    await this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: 'SENT',
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    // Enviar email al proveedor (vía n8n)
    await this.triggerSendOrderEmail(order);

    return { success: true, message: 'Orden enviada al proveedor' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RECIBIR ORDEN (Parcial o Total)
  // ───────────────────────────────────────────────────────────────────────────
  
  async recibirOrden(orderId: string, dto: RecibirOrdenDto, userId: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true, supplier: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // 1. Procesar items recibidos
    for (const receivedItem of dto.items) {
      const orderItem = order.items.find(i => i.productId === receivedItem.productId);
      if (!orderItem) continue;

      const newReceived = orderItem.received + receivedItem.quantity;

      // Actualizar item de la orden
      await this.prisma.purchaseOrderItem.update({
        where: { id: orderItem.id },
        data: { received: newReceived },
      });

      // 2. Registrar entrada de inventario
      await this.inventoryService.registrarEntrada({
        productId: receivedItem.productId,
        warehouseId: dto.warehouseId,
        quantity: receivedItem.quantity,
        unitCost: orderItem.unitCost,
        lotCode: receivedItem.lotCode,
        manufacturingDate: receivedItem.manufacturingDate,
        expirationDate: receivedItem.expirationDate,
        reference: orderId,
        referenceType: 'PURCHASE_ORDER',
        supplierId: order.supplierId,
      }, userId);
    }

    // 3. Verificar si está completamente recibida
    const updatedOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    const allReceived = updatedOrder.items.every(i => i.received >= i.quantity);
    const anyReceived = updatedOrder.items.some(i => i.received > 0);

    await this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: allReceived ? 'RECEIVED' : anyReceived ? 'PARTIAL' : 'CONFIRMED',
        receivedAt: allReceived ? new Date() : undefined,
      },
    });

    return { success: true, order: updatedOrder };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR COMPRA (Factura del Proveedor)
  // ───────────────────────────────────────────────────────────────────────────
  
  async createCompra(dto: CreateCompraDto, userId: string) {
    const number = await this.getNextPurchaseNumber();

    // Calcular totales
    let subtotal = 0;
    let tax = 0;

    for (const item of dto.items) {
      const itemSubtotal = item.quantity * item.unitCost;
      const itemTax = itemSubtotal * (item.taxRate || 0.16);
      subtotal += itemSubtotal;
      tax += itemTax;
    }

    const total = subtotal + tax;

    const purchase = await this.prisma.purchase.create({
      data: {
        number,
        supplierId: dto.supplierId,
        orderId: dto.orderId,
        subtotal,
        tax,
        total,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate: dto.invoiceDate,
        controlNumber: dto.controlNumber,
        dueDate: dto.dueDate,
        status: dto.invoiceNumber ? 'INVOICED' : 'RECEIVED',
        items: {
          create: dto.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            taxRate: item.taxRate || 0.16,
            subtotal: item.quantity * item.unitCost,
            taxAmount: item.quantity * item.unitCost * (item.taxRate || 0.16),
            total: item.quantity * item.unitCost * (1 + (item.taxRate || 0.16)),
            lotId: item.lotId,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    // 2. Crear asiento contable automático
    await this.contabilidadService.createEntryFromCompra({
      id: purchase.id,
      invoiceNumber: purchase.invoiceNumber,
      supplierName: purchase.supplier.businessName,
      supplierRif: purchase.supplier.rif,
      subtotal: purchase.subtotal,
      tax: purchase.tax,
      total: purchase.total,
      date: purchase.date,
      createdBy: userId,
    });

    // 3. Crear cuenta por pagar
    await this.prisma.accountPayable.create({
      data: {
        purchaseId: purchase.id,
        supplierId: purchase.supplierId,
        originalAmount: purchase.total,
        paidAmount: 0,
        balance: purchase.total,
        dueDate: purchase.dueDate!,
        status: 'PENDING',
      },
    });

    // 4. Actualizar orden de compra si existe
    if (dto.orderId) {
      await this.prisma.purchaseOrder.update({
        where: { id: dto.orderId },
        data: {
          status: 'RECEIVED',
          purchaseId: purchase.id,
          receivedAt: new Date(),
        },
      });
    }

    return purchase;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR PAGO A PROVEEDOR
  // ───────────────────────────────────────────────────────────────────────────
  
  async registrarPago(payableId: string, dto: RegistrarPagoDto, userId: string) {
    const payable = await this.prisma.accountPayable.findUnique({
      where: { id: payableId },
      include: { purchase: true, supplier: true },
    });

    if (!payable) {
      throw new NotFoundException('Cuenta por pagar no encontrada');
    }

    if (payable.status === 'PAID') {
      throw new BadRequestException('Esta cuenta ya está pagada');
    }

    if (dto.amount > payable.balance) {
      throw new BadRequestException(
        `El monto (${dto.amount}) supera el saldo pendiente (${payable.balance})`
      );
    }

    // 1. Registrar pago
    const payment = await this.prisma.aPPayment.create({
      data: {
        payableId,
        amount: dto.amount,
        date: dto.date || new Date(),
        method: dto.method,
        reference: dto.reference,
        bankAccountId: dto.bankAccountId,
      },
    });

    // 2. Actualizar cuenta por pagar
    const newPaidAmount = payable.paidAmount + dto.amount;
    const newBalance = payable.originalAmount - newPaidAmount;
    const newStatus: APStatus = newBalance <= 0.01 ? 'PAID' : 'PARTIAL';

    await this.prisma.accountPayable.update({
      where: { id: payableId },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      },
    });

    // 3. Actualizar compra
    await this.prisma.purchase.update({
      where: { id: payable.purchaseId },
      data: {
        paymentStatus: newStatus === 'PAID' ? 'PAID' : 'PARTIAL',
        paidAt: newStatus === 'PAID' ? new Date() : undefined,
      },
    });

    // 4. Actualizar banco si se especifica
    if (dto.bankAccountId) {
      await this.prisma.bankAccount.update({
        where: { id: dto.bankAccountId },
        data: { balance: { decrement: dto.amount } },
      });
    }

    // 5. Crear asiento contable del pago
    await this.contabilidadService.createPaymentEntry({
      payableId,
      amount: dto.amount,
      method: dto.method,
      bankAccountId: dto.bankAccountId,
      createdBy: userId,
    });

    return { payment, payable: { ...payable, paidAmount: newPaidAmount, balance: newBalance, status: newStatus } };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVALUAR PROVEEDOR
  // ───────────────────────────────────────────────────────────────────────────
  
  async createEvaluacion(dto: CreateEvaluacionDto, userId: string) {
    const totalScore = (dto.qualityScore + dto.deliveryScore + dto.priceScore + dto.serviceScore) / 4;

    const evaluation = await this.prisma.supplierEvaluation.create({
      data: {
        supplierId: dto.supplierId,
        period: dto.period,
        qualityScore: dto.qualityScore,
        deliveryScore: dto.deliveryScore,
        priceScore: dto.priceScore,
        serviceScore: dto.serviceScore,
        totalScore,
        notes: dto.notes,
        evaluatedBy: userId,
      },
    });

    // Actualizar rating promedio del proveedor
    const avgRating = await this.getSupplierAverageRating(dto.supplierId);
    await this.prisma.supplier.update({
      where: { id: dto.supplierId },
      data: { rating: avgRating },
    });

    return evaluation;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async getNextRequestNumber() {
    const year = new Date().getFullYear();
    const last = await this.prisma.purchaseRequest.findFirst({
      where: { number: { startsWith: `SC-${year}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[2]) + 1 : 1;
    return `SC-${year}-${num.toString().padStart(6, '0')}`;
  }

  private async getNextOrderNumber() {
    const year = new Date().getFullYear();
    const last = await this.prisma.purchaseOrder.findFirst({
      where: { number: { startsWith: `OC-${year}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[2]) + 1 : 1;
    return `OC-${year}-${num.toString().padStart(6, '0')}`;
  }

  private async getNextPurchaseNumber() {
    const year = new Date().getFullYear();
    const last = await this.prisma.purchase.findFirst({
      where: { number: { startsWith: `C-${year}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[2]) + 1 : 1;
    return `C-${year}-${num.toString().padStart(6, '0')}`;
  }

  private async verifyBudget(departmentId: string, amount: number): Promise<boolean> {
    // Implementar verificación de presupuesto
    // return this.budgetService.checkAvailability(departmentId, amount);
    return true;
  }

  private async getSupplierAverageRating(supplierId: string): Promise<number> {
    const evaluations = await this.prisma.supplierEvaluation.findMany({
      where: { supplierId },
    });
    
    if (evaluations.length === 0) return 0;
    
    const total = evaluations.reduce((sum, e) => sum + e.totalScore, 0);
    return total / evaluations.length;
  }

  private async triggerSendOrderEmail(order: any) {
    // Disparar webhook a n8n para enviar email al proveedor
    const webhookUrl = process.env.N8N_WEBHOOK_URL + '/enviar-orden-compra';
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  async getComprasPeriodo(from: Date, to: Date) {
    const compras = await this.prisma.purchase.findMany({
      where: {
        date: { gte: from, lte: to },
      },
      include: {
        supplier: true,
        items: true,
      },
      orderBy: { date: 'desc' },
    });

    const totalCompras = compras.reduce((sum, c) => sum + c.total, 0);
    const totalImpuestos = compras.reduce((sum, c) => sum + c.tax, 0);

    return {
      from,
      to,
      compras,
      resumen: {
        totalCompras,
        totalImpuestos,
        comprasNetas: totalCompras - totalImpuestos,
        count: compras.length,
      },
    };
  }

  async getComprasPorProveedor(from: Date, to: Date) {
    const compras = await this.prisma.purchase.groupBy({
      by: ['supplierId'],
      where: {
        date: { gte: from, lte: to },
      },
      _sum: {
        total: true,
        tax: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
    });

    const proveedores = await Promise.all(
      compras.map(async c => {
        const supplier = await this.prisma.supplier.findUnique({
          where: { id: c.supplierId },
        });

        return {
          supplierId: c.supplierId,
          supplierName: supplier?.businessName,
          supplierRif: supplier?.rif,
          totalCompras: c._sum.total || 0,
          totalImpuestos: c._sum.tax || 0,
          comprasNetas: (c._sum.total || 0) - (c._sum.tax || 0),
          count: c._count.id,
        };
      })
    );

    return proveedores;
  }

  async getOrdenesPendientes() {
    const ordenes = await this.prisma.purchaseOrder.findMany({
      where: {
        status: { in: ['SENT', 'CONFIRMED', 'PARTIAL'] },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { expectedDate: 'asc' },
    });

    const now = new Date();
    return ordenes.map(o => ({
      ...o,
      isLate: o.expectedDate && new Date(o.expectedDate) < now,
      daysLate: o.expectedDate ? Math.ceil((now.getTime() - new Date(o.expectedDate).getTime()) / 86400000) : 0,
    }));
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Aprobación**: Solicitudes > monto límite requieren aprobación
2. **Presupuesto**: Verificar disponibilidad antes de aprobar (configurable)
3. **Recepción Parcial**: Permitir recepción parcial de órdenes
4. **Facturación**: No facturar sin recepción completa (configurable)
5. **Lotes**: Obligatorios para productos con vencimiento
6. **Pago**: No pagar más del saldo pendiente
7. **Evaluación**: Evaluar proveedores mensualmente

---

## 🔗 Conexiones Detalladas

### Con Inventario

```typescript
// Al recibir orden:
await this.inventoryService.registrarEntrada({
  productId: item.productId,
  warehouseId: dto.warehouseId,
  quantity: receivedItem.quantity,
  unitCost: orderItem.unitCost,
  lotCode: receivedItem.lotCode,
  reference: orderId,
  referenceType: 'PURCHASE_ORDER',
  supplierId: order.supplierId,
}, userId);
```

### Con Contabilidad

```typescript
// Al facturar compra:
await this.contabilidadService.createEntryFromCompra({
  id: purchase.id,
  invoiceNumber: purchase.invoiceNumber,
  supplierName: purchase.supplier.businessName,
  supplierRif: purchase.supplier.rif,
  subtotal: purchase.subtotal,
  tax: purchase.tax,
  total: purchase.total,
  date: purchase.date,
  createdBy: userId,
});

// Asiento generado:
// Débito: Compras (subtotal)
// Débito: IVA Crédito Fiscal (tax)
// Crédito: Cuentas por Pagar (total)
```

### Con Tesorería

```typescript
// Al crear compra facturada:
await this.prisma.accountPayable.create({
  data: {
    purchaseId: purchase.id,
    supplierId: purchase.supplierId,
    originalAmount: purchase.total,
    paidAmount: 0,
    balance: purchase.total,
    dueDate: purchase.dueDate,
    status: 'PENDING',
  },
});
```

---

## 📁 Archivos del Módulo

```
02-modulo-operativo/
├── inventario.md
├── compras.md (este archivo)
├── produccion.md
├── mantenimiento.md
├── calidad.md
└── flota.md
```

**Anterior**: `02-operativo/inventario.md` | **Siguiente**: `02-operativo/produccion.md`
