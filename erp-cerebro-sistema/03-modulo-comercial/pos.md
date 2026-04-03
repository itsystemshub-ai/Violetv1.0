# Módulo 03: COMERCIAL - Punto de Venta (POS)

## Descripción

Módulo de Punto de Venta (POS) táctil para ventas rápidas en mostrador. Incluye gestión de sesiones de caja, múltiples métodos de pago, facturación rápida y arqueos de caja.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  00-shared/auth.md          → Permisos de cajero               │
│  00-shared/rbac.md          → Roles CAJERO, VENDEDOR           │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad.md → Asientos de venta         │
│  01-administrativo/tesoreria.md      → Arqueos de caja         │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/inventario.md → Descuento de stock en tiempo real│
├─────────────────────────────────────────────────────────────────┤
│  03-comercial/ventas.md     → Las ventas POS son ventas        │
│  03-comercial/crm.md        → Cliente consumidor final         │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. POS **DESCUENTA** inventario inmediatamente
2. POS **CREA** venta tipo contado automáticamente
3. POS **REGISTRA** pagos en tesorería
4. Sesiones **GENERAN** arqueo al cerrar

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// SESIONES DE CAJA POS
// ─────────────────────────────────────────────────────────────────────────────

model POSSession {
  id          String   @id @default(cuid())
  number      String   @unique // ej. POS-2024-000001
  
  // Cajero
  cashierId   String
  cashier     User     @relation(fields: [cashierId], references: [id])
  
  // Almacén
  warehouseId String
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id])
  
  // Fechas
  openedAt    DateTime @default(now())
  closedAt    DateTime?
  
  // Saldo
  openingCash Float    @default(0) // Caja base
  closingCash Float?   // Caja al cerrar
  expectedCash Float?  // Caja esperada según ventas
  difference  Float?   // Diferencia (sobrante/faltante)
  
  // Estado
  status      POSSessionStatus @default(OPEN) // OPEN, CLOSED
  
  // Transacciones
  transactions POSTransaction[]
  
  // Auditoría
  openedBy    String
  closedBy    String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([cashierId])
  @@index([warehouseId])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACCIONES POS
// ─────────────────────────────────────────────────────────────────────────────

model POSTransaction {
  id          String   @id @default(cuid())
  sessionId   String
  session     POSSession @relation(fields: [sessionId], references: [id])
  
  // Venta asociada
  saleId      String?
  sale        Sale?    @relation(fields: [saleId], references: [id])
  
  // Monto
  total       Float
  
  // Pago
  paymentMethod POSPaymentMethod // EFECTIVO, TARJETA, TRANSFERENCIA, ZELLE, MIXTO
  cashReceived Float?   // Monto recibido en efectivo
  change      Float?   // Cambio devuelto
  
  // Referencia
  reference   String?  // Número de tarjeta, transferencia, etc.
  
  // Estado
  status      String   @default("COMPLETED") // COMPLETED, CANCELLED, REFUNDED
  
  createdAt   DateTime @default(now())

  @@index([sessionId])
  @@index([saleId])
  @@index([paymentMethod])
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN POS
// ─────────────────────────────────────────────────────────────────────────────

model POSConfig {
  id          String   @id @default(cuid())
  name        String   @unique // ej. "POS Principal"
  
  // Almacén asignado
  warehouseId String
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id])
  
  // Configuración
  allowNegativeStock Boolean @default(false)
  requireCustomer    Boolean @default(false) // ¿Requerir cliente?
  defaultCustomerId  String? // Consumidor final por defecto
  printReceipt       Boolean @default(true)
  askForInvoice      Boolean @default(false) // ¿Preguntar si requiere factura?
  
  // Métodos de pago habilitados
  allowCash          Boolean @default(true)
  allowCard          Boolean @default(true)
  allowTransfer      Boolean @default(true)
  allowZelle         Boolean @default(true)
  allowMixed         Boolean @default(true)
  
  // Límites
  maxCashAmount      Float?   // Máximo efectivo en caja
  alertLimit         Float?   // Alerta cuando exceda
  
  isActive      Boolean @default(true)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([warehouseId])
}

// ─────────────────────────────────────────────────────────────────────────────
// ARQUEOS DE CAJA
// ─────────────────────────────────────────────────────────────────────────────

model CashReconciliation {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  session     POSSession @relation(fields: [sessionId], references: [id])
  
  // Conteo físico
  cashCount   Float    @default(0) // Efectivo contado
  cardCount   Float    @default(0) // Tarjetas
  transferCount Float  @default(0) // Transferencias
  zelleCount  Float    @default(0) // Zelle
  otherCount  Float    @default(0) // Otros
  
  // Total
  totalPhysical Float  // Total físico
  
  // Comparación
  totalSystem Float    // Total según sistema
  difference  Float    // Diferencia
  
  // Observaciones
  observations String?
  
  // Auditoría
  countedBy   String
  reviewedBy  String?
  
  createdAt   DateTime @default(now())

  @@index([sessionId])
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTOS RÁPIDOS (Atajos para POS)
// ─────────────────────────────────────────────────────────────────────────────

model POSQuickProduct {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  // Configuración rápida
  code        String   @unique // Código rápido (ej. "001")
  name        String   // Nombre corto para POS
  price       Float    // Precio rápido (puede diferir del producto)
  
  // Orden en pantalla
  order       Int      @default(0)
  category    String?  // Categoría para agrupar
  
  // Icono/Color
  icon        String?
  color       String?
  
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([code])
  @@index([isActive])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum POSSessionStatus {
  OPEN
  CLOSED
  SUSPENDED
}

enum POSPaymentMethod {
  EFECTIVO
  TARJETA
  TRANSFERENCIA
  ZELLE
  CHEQUE
  MIXTO
}
```

---

## 📡 Endpoints de la API

### Controller de POS

```typescript
// apps/backend/src/modules/pos/pos.controller.ts

import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { POSService } from './pos.service';

@Controller('pos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class POSController {
  constructor(private posService: POSService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // SESIONES DE CAJA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('sessions')
  @RequirePermissions('pos:read')
  async getSessions(@Query('status') status?: string, @Query('cashierId') cashierId?: string) {
    return this.posService.getSessions(status, cashierId);
  }

  @Get('sessions/:id')
  @RequirePermissions('pos:read')
  async getSession(@Param('id') id: string) {
    return this.posService.getSession(id);
  }

  @Post('sessions/open')
  @RequirePermissions('pos:create')
  async openSession(@Body() dto: OpenPOSSessionDto, @User() user: any) {
    return this.posService.openSession(dto, user.id);
  }

  @Post('sessions/:id/close')
  @RequirePermissions('pos:update')
  async closeSession(
    @Param('id') id: string,
    @Body() dto: ClosePOSSessionDto,
    @User() user: any,
  ) {
    return this.posService.closeSession(id, dto, user.id);
  }

  @Get('sessions/:id/summary')
  @RequirePermissions('pos:read')
  async getSessionSummary(@Param('id') id: string) {
    return this.posService.getSessionSummary(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSACCIONES POS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('transactions')
  @RequirePermissions('pos:create')
  async createTransaction(@Body() dto: CreatePOSTransactionDto, @User() user: any) {
    return this.posService.createTransaction(dto, user.id);
  }

  @Post('transactions/quick-sale')
  @RequirePermissions('pos:create')
  async quickSale(@Body() dto: QuickSaleDto, @User() user: any) {
    return this.posService.quickSale(dto, user.id);
  }

  @Post('transactions/:id/refund')
  @RequirePermissions('pos:update')
  async refundTransaction(
    @Param('id') id: string,
    @Body() dto: RefundDto,
    @User() user: any,
  ) {
    return this.posService.refundTransaction(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PRODUCTOS RÁPIDOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('quick-products')
  @RequirePermissions('pos:read')
  async getQuickProducts(@Query('category') category?: string) {
    return this.posService.getQuickProducts(category);
  }

  @Post('quick-products')
  @RequirePermissions('pos:create')
  async createQuickProduct(@Body() dto: CreateQuickProductDto, @User() user: any) {
    return this.posService.createQuickProduct(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ARQUEOS DE CAJA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('sessions/:id/reconciliation')
  @RequirePermissions('pos:update')
  async createReconciliation(
    @Param('id') id: string,
    @Body() dto: CreateReconciliationDto,
    @User() user: any,
  ) {
    return this.posService.createReconciliation(id, dto, user.id);
  }

  @Get('sessions/:id/reconciliation')
  @RequirePermissions('pos:read')
  async getReconciliation(@Param('id') id: string) {
    return this.posService.getReconciliation(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONFIGURACIÓN POS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('config')
  @RequirePermissions('pos:read')
  async getConfig() {
    return this.posService.getConfig();
  }

  @Put('config')
  @RequirePermissions('pos:update')
  async updateConfig(@Body() dto: UpdatePOSConfigDto, @User() user: any) {
    return this.posService.updateConfig(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/ventas-dia')
  @RequirePermissions('reportes-pos:read')
  async getVentasDia(@Query('date') date?: string) {
    return this.posService.getVentasDia(date ? new Date(date) : new Date());
  }

  @Get('reportes/cierre-cajero')
  @RequirePermissions('reportes-pos:read')
  async getCierreCajero(
    @Query('cashierId') cashierId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.posService.getCierreCajero(cashierId, new Date(from), new Date(to));
  }

  @Get('reportes/productos-vendidos')
  @RequirePermissions('reportes-pos:read')
  async getProductosVendidos(@Query('date') date?: string) {
    return this.posService.getProductosVendidos(date ? new Date(date) : new Date());
  }
}
```

---

## 🧩 Servicio de POS

### Funciones Principales

```typescript
// apps/backend/src/modules/pos/pos.service.ts

@Injectable()
export class POSService {
  constructor(
    private prisma: PrismaService,
    private salesService: SalesService,
    private inventoryService: InventoryService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // ABRIR SESIÓN DE CAJA
  // ───────────────────────────────────────────────────────────────────────────
  
  async openSession(dto: OpenPOSSessionDto, userId: string) {
    const number = await this.getNextSessionNumber();

    // Verificar si ya tiene una sesión abierta
    const existingSession = await this.prisma.pOSSession.findFirst({
      where: {
        cashierId: userId,
        status: 'OPEN',
      },
    });

    if (existingSession) {
      throw new BadRequestException('Ya tienes una sesión de caja abierta');
    }

    const session = await this.prisma.pOSSession.create({
      data: {
        number,
        cashierId: userId,
        warehouseId: dto.warehouseId,
        openingCash: dto.openingCash || 0,
        status: 'OPEN',
        openedBy: userId,
      },
      include: {
        cashier: true,
        warehouse: true,
      },
    });

    return session;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CERRAR SESIÓN DE CAJA
  // ───────────────────────────────────────────────────────────────────────────
  
  async closeSession(sessionId: string, dto: ClosePOSSessionDto, userId: string) {
    const session = await this.prisma.pOSSession.findUnique({
      where: { id: sessionId },
      include: {
        transactions: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }

    if (session.status !== 'OPEN') {
      throw new BadRequestException('La sesión ya está cerrada');
    }

    // Calcular esperado en caja
    const salesTotal = session.transactions
      .filter(t => t.paymentMethod === 'EFECTIVO')
      .reduce((sum, t) => sum + t.total, 0);

    const expectedCash = session.openingCash + salesTotal;

    // Calcular diferencia
    const difference = dto.closingCash - expectedCash;

    // Actualizar sesión
    await this.prisma.pOSSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        closingCash: dto.closingCash,
        expectedCash,
        difference,
        closedBy: userId,
        closedAt: new Date(),
      },
    });

    // Crear arqueo
    await this.prisma.cashReconciliation.create({
      data: {
        sessionId,
        cashCount: dto.cashCount || 0,
        cardCount: dto.cardCount || 0,
        transferCount: dto.transferCount || 0,
        zelleCount: dto.zelleCount || 0,
        otherCount: dto.otherCount || 0,
        totalPhysical: dto.closingCash,
        totalSystem: expectedCash,
        difference,
        observations: dto.observations,
        countedBy: userId,
      },
    });

    // Si hay diferencia significativa, registrar en contabilidad
    if (Math.abs(difference) > 10) {
      await this.registerCashDifference(sessionId, difference, userId);
    }

    return {
      success: true,
      expectedCash,
      closingCash: dto.closingCash,
      difference,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR TRANSACCIÓN POS (Venta rápida)
  // ───────────────────────────────────────────────────────────────────────────
  
  async createTransaction(dto: CreatePOSTransactionDto, userId: string) {
    // Obtener sesión activa
    const session = await this.prisma.pOSSession.findFirst({
      where: {
        cashierId: userId,
        status: 'OPEN',
      },
    });

    if (!session) {
      throw new BadRequestException('No tienes una sesión de caja abierta');
    }

    // Crear venta (usando servicio de ventas)
    const sale = await this.salesService.create({
      customerId: dto.customerId || await this.getDefaultCustomerId(),
      items: dto.items,
      paymentMethod: dto.paymentMethod,
    }, userId);

    // Facturar inmediatamente (POS es contado)
    const invoicedSale = await this.salesService.invoice(sale.id, userId);

    // Crear transacción POS
    const transaction = await this.prisma.pOSTransaction.create({
      data: {
        sessionId: session.id,
        saleId: invoicedSale.id,
        total: invoicedSale.total,
        paymentMethod: dto.paymentMethod,
        cashReceived: dto.paymentMethod === 'EFECTIVO' ? dto.cashReceived : invoicedSale.total,
        change: dto.paymentMethod === 'EFECTIVO' ? (dto.cashReceived || 0) - invoicedSale.total : 0,
        reference: dto.reference,
        status: 'COMPLETED',
      },
    });

    return {
      transaction,
      sale: invoicedSale,
      change: transaction.change,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VENTA RÁPIDA (Con productos predefinidos)
  // ───────────────────────────────────────────────────────────────────────────
  
  async quickSale(dto: QuickSaleDto, userId: string) {
    // Obtener productos rápidos
    const quickProducts = await this.prisma.pOSQuickProduct.findMany({
      where: {
        code: { in: dto.items.map(i => i.code) },
        isActive: true,
      },
      include: { product: true },
    });

    // Convertir a items de venta
    const items = quickProducts.map(qp => {
      const qty = dto.items.find(i => i.code === qp.code)?.quantity || 1;
      return {
        productId: qp.product.id,
        quantity: qty,
        price: qp.price,
        taxRate: 0.16,
      };
    });

    // Crear transacción
    return this.createTransaction({
      items,
      paymentMethod: dto.paymentMethod || 'EFECTIVO',
      cashReceived: dto.cashReceived,
      customerId: dto.customerId,
    }, userId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RESUMEN DE SESIÓN
  // ───────────────────────────────────────────────────────────────────────────
  
  async getSessionSummary(sessionId: string) {
    const session = await this.prisma.pOSSession.findUnique({
      where: { id: sessionId },
      include: {
        transactions: {
          include: {
            sale: {
              include: {
                customer: true,
                items: {
                  include: { product: true },
                },
              },
            },
          },
        },
        cashier: true,
        warehouse: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }

    // Calcular totales por método de pago
    const byPaymentMethod = session.transactions.reduce((acc, t) => {
      if (!acc[t.paymentMethod]) {
        acc[t.paymentMethod] = { count: 0, total: 0 };
      }
      acc[t.paymentMethod].count++;
      acc[t.paymentMethod].total += t.total;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Calcular total de ventas
    const totalSales = session.transactions.reduce((sum, t) => sum + t.total, 0);

    // Calcular cambio devuelto
    const totalChange = session.transactions
      .filter(t => t.paymentMethod === 'EFECTIVO')
      .reduce((sum, t) => sum + (t.change || 0), 0);

    // Calcular esperado en caja
    const expectedCash = session.openingCash + (byPaymentMethod['EFECTIVO']?.total || 0) - totalChange;

    return {
      session: {
        id: session.id,
        number: session.number,
        cashier: session.cashier.name,
        warehouse: session.warehouse.name,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        status: session.status,
      },
      openingCash: session.openingCash,
      transactions: {
        total: session.transactions.length,
        byPaymentMethod,
        totalSales,
        totalChange,
      },
      expectedCash,
      currentCash: expectedCash, // En tiempo real
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async getNextSessionNumber() {
    const year = new Date().getFullYear();
    const last = await this.prisma.pOSSession.findFirst({
      where: { number: { startsWith: `POS-${year}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[2]) + 1 : 1;
    return `POS-${year}-${num.toString().padStart(6, '0')}`;
  }

  private async getDefaultCustomerId(): Promise<string> {
    const config = await this.prisma.pOSConfig.findFirst();
    if (config?.defaultCustomerId) {
      return config.defaultCustomerId;
    }

    // Buscar o crear consumidor final
    let customer = await this.prisma.customer.findFirst({
      where: { rif: 'V-00000000-0' },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          businessName: 'Consumidor Final',
          rif: 'V-00000000-0',
        },
      });
    }

    return customer.id;
  }

  private async registerCashDifference(sessionId: string, difference: number, userId: string) {
    // Crear asiento contable por diferencia de caja
    // Implementar según módulo de contabilidad
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  async getVentasDia(date: Date) {
    const sessions = await this.prisma.pOSSession.findMany({
      where: {
        openedAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        transactions: {
          include: {
            sale: true,
          },
        },
        cashier: true,
      },
    });

    const totalVentas = sessions.reduce((sum, s) => {
      return sum + s.transactions.reduce((ts, t) => ts + t.total, 0);
    }, 0);

    const totalTransacciones = sessions.reduce((sum, s) => sum + s.transactions.length, 0);

    return {
      date,
      sessions: sessions.length,
      totalVentas,
      totalTransacciones,
      promedioPorSesion: totalVentas / (sessions.length || 1),
      promedioPorTransaccion: totalVentas / (totalTransacciones || 1),
    };
  }

  async getProductosVendidos(date: Date) {
    const products = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          status: 'INVOICED',
          date: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lte: new Date(date.setHours(23, 59, 59, 999)),
          },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 20,
    });

    return products.map(p => ({
      productId: p.productId,
      quantity: p._sum.quantity,
      revenue: p._sum.subtotal,
    }));
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Sesión Única**: Un cajero solo puede tener una sesión abierta
2. **Apertura Obligatoria**: No vender sin sesión abierta
3. **Cierre con Arqueo**: Todo cierre requiere conteo físico
4. **Diferencias > 10**: Registrar en contabilidad
5. **Stock en Tiempo Real**: Descuento inmediato al vender
6. **Consumidor Final**: Cliente por defecto si no se especifica
7. **Facturación**: POS es contado, facturar inmediatamente

---

## 📁 Archivos del Módulo

```
03-modulo-comercial/
├── ventas.md
├── crm.md
├── pos.md (este archivo)
└── marketing.md
```

**Anterior**: `03-comercial/crm.md` | **Siguiente**: `03-comercial/marketing.md`
