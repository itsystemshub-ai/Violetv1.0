# Módulo 02: OPERATIVO - Inventarios

## Descripción

Módulo de gestión de inventarios multi-almacén con control de stock, movimientos, trazabilidad de lotes y valoración de inventario (PEPS/Promedio).

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  00-shared/auth.md          → Permisos de almacenista          │
│  00-shared/rbac.md          → Roles ALMACENISTA, COMPRADOR     │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad.md → Asientos de inventario    │
│  01-administrativo/activos-fijos.md → Activos de inventario    │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/compras.md    → Entrada por recepción de compras │
│  02-operativo/produccion.md → Salida para producción           │
├─────────────────────────────────────────────────────────────────┤
│  03-comercial/ventas.md     → Descuento por ventas             │
│  03-comercial/pos.md        → Descuento por POS                │
├─────────────────────────────────────────────────────────────────┤
│  05-configuracion/sistema.md → Parámetros de stock             │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Ventas **DESCUENTA** stock automáticamente al facturar
2. Compras **AUMENTA** stock al recibir mercancía
3. Producción **DESCUENTA** materias primas y **AUMENTA** producto terminado
4. Todo movimiento **CREA** registro en InventoryMovement
5. Ajustes de inventario **GENERAN** asiento contable

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CATEGORÍAS DE PRODUCTOS
// ─────────────────────────────────────────────────────────────────────────────

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  createdAt   DateTime @default(now())

  @@index([parentId])
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTOS
// ─────────────────────────────────────────────────────────────────────────────

model Product {
  id          String   @id @default(cuid())
  code        String   @unique // Código interno (SKU)
  barcode     String?  @unique // Código de barras
  name        String
  description String?
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  
  // Precios
  cost        Float    // Último costo (se actualiza con compras)
  price       Float    // Precio de venta sugerido
  
  // Stock
  stock       Float    @default(0) // Stock total (suma de todos los almacenes)
  minStock    Float    @default(0) // Stock mínimo para alerta
  maxStock    Float?   // Stock máximo sugerido
  
  // Valoración
  valuationMethod ValuationMethod @default(PROMEDIO) // PROMEDIO o PEPS
  
  // Estado
  isActive    Boolean  @default(true)
  isService   Boolean  @default(false) // Los servicios no tienen stock
  
  // Relaciones con otros módulos
  saleItems   SaleItem[]        // 03-comercial
  purchaseItems PurchaseItem[]  // 02-operativo/compras
  movements   InventoryMovement[]
  warehouseStock WarehouseStock[]
  lots        Lot[]
  bom         BillOfMaterial?   // 02-operativo/produccion
  bomComponents BOMComponent[] @relation("component")
  
  // Auditoría
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([code])
  @@index([categoryId])
  @@index([isActive])
}

// ─────────────────────────────────────────────────────────────────────────────
// ALMACENES
// ─────────────────────────────────────────────────────────────────────────────

model Warehouse {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  address     String?
  isMain      Boolean  @default(false) // Almacén principal
  isActive    Boolean  @default(true)
  
  // Relaciones
  stock       WarehouseStock[]
  movements   InventoryMovement[]
  posSession  POSSession[] // 03-comercial/pos
  
  createdAt   DateTime @default(now())

  @@index([isMain])
}

model WarehouseStock {
  id          String @id @default(cuid())
  warehouseId String
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id])
  productId   String
  product     Product @relation(fields: [productId], references: [id])
  quantity    Float  @default(0)
  
  @@unique([warehouseId, productId])
  @@index([warehouseId])
  @@index([productId])
}

// ─────────────────────────────────────────────────────────────────────────────
// MOVIMIENTOS DE INVENTARIO
// ─────────────────────────────────────────────────────────────────────────────

model InventoryMovement {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  warehouseId String?
  warehouse   Warehouse? @relation(fields: [warehouseId], references: [id])
  
  // Tipo de movimiento
  type        MovementType // IN, OUT, ADJUSTMENT, TRANSFER, PRODUCTION
  reference   String?  // ID del documento origen (venta.id, compra.id, etc.)
  referenceType String? // SALE, PURCHASE, ADJUSTMENT, TRANSFER, PRODUCTION
  
  // Cantidades
  quantity    Float    // Positivo = entrada, Negativo = salida
  unitCost    Float?   // Costo unitario en el momento del movimiento
  totalCost   Float?   // quantity * unitCost
  
  // Lote (si aplica trazabilidad)
  lotId       String?
  lot         Lot?     @relation(fields: [lotId], references: [id])
  
  // Información adicional
  notes       String?
  
  // Usuario que realizó el movimiento
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  createdAt   DateTime @default(now())

  @@index([productId])
  @@index([warehouseId])
  @@index([type])
  @@index([createdAt])
}

// ─────────────────────────────────────────────────────────────────────────────
// LOTES Y TRAZABILIDAD
// ─────────────────────────────────────────────────────────────────────────────

model Lot {
  id          String   @id @default(cuid())
  code        String   @unique // Código de lote
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  // Cantidades
  quantity    Float
  initialQuantity Float // Cantidad inicial (para control de mermas)
  
  // Fechas
  manufacturingDate DateTime?
  expirationDate DateTime?
  
  // Origen
  supplierId  String?
  supplier    Supplier? @relation(fields: [supplierId], references: [id]) // 02-operativo/compras
  purchaseId  String?
  purchase    Purchase? @relation(fields: [purchaseId], references: [id]) // 02-operativo/compras
  productionOrderId String?
  productionOrder ProductionOrder? @relation(fields: [productionOrderId], references: [id]) // 02-operativo/produccion
  
  // Calidad
  qualityStatus QualityStatus @default(PENDING) // PENDING, APPROVED, REJECTED, QUARANTINE
  
  // Movimientos
  movements   LotMovement[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([productId])
  @@index([qualityStatus])
  @@index([expirationDate])
}

model LotMovement {
  id          String   @id @default(cuid())
  lotId       String
  lot         Lot      @relation(fields: [lotId], references: [id])
  type        MovementType
  quantity    Float
  reference   String?
  createdAt   DateTime @default(now())

  @@index([lotId])
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEO FÍSICO DE INVENTARIO
// ─────────────────────────────────────────────────────────────────────────────

model PhysicalCount {
  id          String   @id @default(cuid())
  warehouseId String
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id])
  status      String   @default("IN_PROGRESS") // IN_PROGRESS, CLOSED
  startedBy   String
  closedBy    String?
  closedAt    DateTime?
  items       PhysicalCountItem[]
  createdAt   DateTime @default(now())

  @@index([warehouseId])
  @@index([status])
}

model PhysicalCountItem {
  id              String   @id @default(cuid())
  countId         String
  count           PhysicalCount @relation(fields: [countId], references: [id])
  productId       String
  product         Product @relation(fields: [productId], references: [id])
  systemQuantity  Float    // Cantidad en sistema
  countedQuantity Float?   // Cantidad contada físicamente
  difference      Float?   // Diferencia (counted - system)
  adjusted        Boolean  @default(false) // Si ya se ajustó

  @@index([countId])
  @@index([productId])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum ValuationMethod {
  PEPS      // Primero en Entrar, Primero en Salir (FIFO)
  PROMEDIO  // Costo Promedio Ponderado
}

enum MovementType {
  IN        // Entrada
  OUT       // Salida
  ADJUSTMENT // Ajuste
  TRANSFER  // Transferencia entre almacenes
  PRODUCTION // Salida para producción
  RETURN    // Devolución
}

enum QualityStatus {
  PENDING
  APPROVED
  REJECTED
  QUARANTINE
}
```

---

## 📡 Endpoints de la API

### Controller de Inventarios

```typescript
// apps/backend/src/modules/inventario/inventario.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { InventarioService } from './inventario.service';

@Controller('inventario')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventarioController {
  constructor(private inventarioService: InventarioService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // PRODUCTOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('productos')
  @RequirePermissions('inventario:read')
  async getProductos(@Query() query: ProductoQueryDto) {
    return this.inventarioService.getProductos(query);
  }

  @Get('productos/:id')
  @RequirePermissions('inventario:read')
  async getProducto(@Param('id') id: string) {
    return this.inventarioService.getProducto(id);
  }

  @Post('productos')
  @RequirePermissions('inventario:create')
  async createProducto(@Body() dto: CreateProductoDto, @User() user: any) {
    return this.inventarioService.createProducto(dto, user.id);
  }

  @Put('productos/:id')
  @RequirePermissions('inventario:update')
  async updateProducto(
    @Param('id') id: string,
    @Body() dto: UpdateProductoDto,
    @User() user: any,
  ) {
    return this.inventarioService.updateProducto(id, dto, user.id);
  }

  @Delete('productos/:id')
  @RequirePermissions('inventario:delete')
  async deleteProducto(@Param('id') id: string) {
    return this.inventarioService.deleteProducto(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STOCK POR ALMACÉN
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('stock')
  @RequirePermissions('inventario:read')
  async getStock(
    @Query('warehouseId') warehouseId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.inventarioService.getStock(warehouseId, categoryId);
  }

  @Get('productos/:id/stock')
  @RequirePermissions('inventario:read')
  async getProductoStock(@Param('id') id: string) {
    return this.inventarioService.getProductoStock(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MOVIMIENTOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('movimientos')
  @RequirePermissions('inventario:read')
  async getMovimientos(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.inventarioService.getMovimientos(productId, warehouseId, from, to);
  }

  @Post('movimientos/entrada')
  @RequirePermissions('inventario:create')
  async registrarEntrada(
    @Body() dto: RegistrarEntradaDto,
    @User() user: any,
  ) {
    return this.inventarioService.registrarEntrada(dto, user.id);
  }

  @Post('movimientos/salida')
  @RequirePermissions('inventario:create')
  async registrarSalida(
    @Body() dto: RegistrarSalidaDto,
    @User() user: any,
  ) {
    return this.inventarioService.registrarSalida(dto, user.id);
  }

  @Post('movimientos/ajuste')
  @RequirePermissions('inventario:create')
  async registrarAjuste(
    @Body() dto: RegistrarAjusteDto,
    @User() user: any,
  ) {
    return this.inventarioService.registrarAjuste(dto, user.id);
  }

  @Post('movimientos/transferencia')
  @RequirePermissions('inventario:create')
  async registrarTransferencia(
    @Body() dto: RegistrarTransferenciaDto,
    @User() user: any,
  ) {
    return this.inventarioService.registrarTransferencia(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('lotes')
  @RequirePermissions('inventario:read')
  async getLotes(@Query('productId') productId?: string) {
    return this.inventarioService.getLotes(productId);
  }

  @Post('lotes')
  @RequirePermissions('inventario:create')
  async createLote(@Body() dto: CreateLoteDto, @User() user: any) {
    return this.inventarioService.createLote(dto, user.id);
  }

  @Post('lotes/:id/aprobar')
  @RequirePermissions('inventario:update')
  async aprobarLote(@Param('id') id: string, @User() user: any) {
    return this.inventarioService.aprobarLote(id, user.id);
  }

  @Post('lotes/:id/rechazar')
  @RequirePermissions('inventario:update')
  async rechazarLote(@Param('id') id: string, @Body() dto: RechazarLoteDto, @User() user: any) {
    return this.inventarioService.rechazarLote(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONTEO FÍSICO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('conteos')
  @RequirePermissions('inventario:read')
  async getConteos(@Query('warehouseId') warehouseId?: string) {
    return this.inventarioService.getConteos(warehouseId);
  }

  @Post('conteos')
  @RequirePermissions('inventario:create')
  async iniciarConteo(@Body() dto: IniciarConteoDto, @User() user: any) {
    return this.inventarioService.iniciarConteo(dto, user.id);
  }

  @Put('conteos/:countId/items/:productId')
  @RequirePermissions('inventario:update')
  async actualizarConteo(
    @Param('countId') countId: string,
    @Param('productId') productId: string,
    @Body() dto: ActualizarConteoDto,
    @User() user: any,
  ) {
    return this.inventarioService.actualizarConteo(countId, productId, dto, user.id);
  }

  @Post('conteos/:countId/cerrar')
  @RequirePermissions('inventario:update')
  async cerrarConteo(@Param('countId') countId: string, @User() user: any) {
    return this.inventarioService.cerrarConteo(countId, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ALERTAS DE STOCK
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('alertas/stock-bajo')
  @RequirePermissions('inventario:read')
  async getStockBajo() {
    return this.inventarioService.getStockBajo();
  }

  @Get('alertas/vencimientos')
  @RequirePermissions('inventario:read')
  async getVencimientos(@Query('days') days?: number) {
    return this.inventarioService.getVencimientos(parseInt(days || '30'));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VALORACIÓN DE INVENTARIO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('valoracion')
  @RequirePermissions('inventario:read')
  async getValoracionInventario(@Query('warehouseId') warehouseId?: string) {
    return this.inventarioService.getValoracionInventario(warehouseId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/kardex')
  @RequirePermissions('reportes-inventario:read')
  async getKardex(
    @Query('productId') productId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.inventarioService.getKardex(productId, new Date(from), new Date(to));
  }

  @Get('reportes/rotacion')
  @RequirePermissions('reportes-inventario:read')
  async getRotacionInventario(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.inventarioService.getRotacionInventario(new Date(from), new Date(to));
  }

  @Get('reportes/mermas')
  @RequirePermissions('reportes-inventario:read')
  async getMermas(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.inventarioService.getMermas(new Date(from), new Date(to));
  }
}
```

---

## 🧩 Servicio de Inventarios

### Funciones Principales

```typescript
// apps/backend/src/modules/inventario/inventario.service.ts

@Injectable()
export class InventarioService {
  constructor(
    private prisma: PrismaService,
    private contabilidadService: ContabilidadService,
    private config: SystemConfigService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR ENTRADA DE INVENTARIO
  // ───────────────────────────────────────────────────────────────────────────
  
  async registrarEntrada(dto: RegistrarEntradaDto, userId: string) {
    const { productId, warehouseId, quantity, unitCost, lotCode, reference, referenceType, notes } = dto;

    // 1. Validar producto
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (!product.isActive) {
      throw new BadRequestException('Producto inactivo');
    }

    // 2. Actualizar stock del almacén
    await this.prisma.warehouseStock.upsert({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        warehouseId,
        productId,
        quantity,
      },
    });

    // 3. Actualizar stock total del producto
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: { increment: quantity },
        cost: unitCost, // Actualizar último costo
      },
    });

    // 4. Crear movimiento
    const movement = await this.prisma.inventoryMovement.create({
      data: {
        productId,
        warehouseId,
        type: 'IN',
        reference,
        referenceType,
        quantity,
        unitCost,
        totalCost: quantity * unitCost,
        notes,
        userId,
      },
    });

    // 5. Crear lote si se especifica código
    if (lotCode) {
      await this.prisma.lot.create({
        data: {
          code: lotCode,
          productId,
          quantity,
          initialQuantity: quantity,
          manufacturingDate: dto.manufacturingDate,
          expirationDate: dto.expirationDate,
          supplierId: dto.supplierId,
          purchaseId: referenceType === 'PURCHASE' ? reference : null,
          qualityStatus: 'PENDING',
        },
      });
    }

    // 6. Si es compra, crear asiento contable
    if (referenceType === 'PURCHASE') {
      // El asiento lo crea el módulo de compras, no aquí
    }

    return { movement, stock: await this.getProductoStock(productId) };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR SALIDA DE INVENTARIO (PEPS o Promedio)
  // ───────────────────────────────────────────────────────────────────────────
  
  async registrarSalida(dto: RegistrarSalidaDto, userId: string) {
    const { productId, warehouseId, quantity, reference, referenceType, notes } = dto;

    // 1. Validar producto
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // 2. Verificar stock
    const warehouseStock = await this.prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
    });

    if (!warehouseStock || warehouseStock.quantity < quantity) {
      throw new BadRequestException(
        `Stock insuficiente en almacén. Disponible: ${warehouseStock?.quantity || 0}, Requerido: ${quantity}`
      );
    }

    // 3. Determinar costo según método de valoración
    let unitCost = product.cost;
    
    if (product.valuationMethod === 'PEPS') {
      // Obtener costo del lote más antiguo
      unitCost = await this.getFIFOCost(productId, quantity);
    }

    // 4. Actualizar stock del almacén
    await this.prisma.warehouseStock.update({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
      data: {
        quantity: { decrement: quantity },
      },
    });

    // 5. Actualizar stock total
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: { decrement: quantity },
      },
    });

    // 6. Crear movimiento
    const movement = await this.prisma.inventoryMovement.create({
      data: {
        productId,
        warehouseId,
        type: 'OUT',
        reference,
        referenceType,
        quantity: -quantity, // Negativo para salida
        unitCost,
        totalCost: quantity * unitCost,
        notes,
        userId,
      },
    });

    return { movement, stock: await this.getProductoStock(productId) };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CÁLCULO DE COSTO PEPS (FIFO)
  // ───────────────────────────────────────────────────────────────────────────
  
  private async getFIFOCost(productId: string, quantity: number): Promise<number> {
    // Obtener lotes ordenados por fecha de creación (más antiguos primero)
    const lots = await this.prisma.lot.findMany({
      where: {
        productId,
        quantity: { gt: 0 },
        qualityStatus: 'APPROVED',
      },
      orderBy: { createdAt: 'asc' },
    });

    let remaining = quantity;
    let totalCost = 0;

    for (const lot of lots) {
      if (remaining <= 0) break;

      const consumed = Math.min(lot.quantity, remaining);
      
      // Obtener costo del lote (de la compra o producción)
      let lotCost = 0;
      if (lot.purchaseId) {
        const purchaseItem = await this.prisma.purchaseItem.findFirst({
          where: { purchaseId: lot.purchaseId, productId },
        });
        lotCost = purchaseItem?.cost || 0;
      }

      totalCost += consumed * lotCost;
      remaining -= consumed;

      // Actualizar cantidad del lote
      await this.prisma.lot.update({
        where: { id: lot.id },
        data: { quantity: { decrement: consumed } },
      });

      // Registrar movimiento del lote
      await this.prisma.lotMovement.create({
        data: {
          lotId: lot.id,
          type: 'OUT',
          quantity: consumed,
          reference: `Salida PEPS`,
        },
      });
    }

    if (remaining > 0) {
      throw new BadRequestException(`Stock insuficiente en lotes PEPS. Faltan ${remaining} unidades`);
    }

    return totalCost / quantity;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSFERENCIA ENTRE ALMACENES
  // ───────────────────────────────────────────────────────────────────────────
  
  async registrarTransferencia(dto: RegistrarTransferenciaDto, userId: string) {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = dto;

    // 1. Validar producto
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // 2. Verificar stock en almacén origen
    const fromStock = await this.prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: fromWarehouseId,
          productId,
        },
      },
    });

    if (!fromStock || fromStock.quantity < quantity) {
      throw new BadRequestException('Stock insuficiente en almacén origen');
    }

    // 3. Ejecutar transferencia en transacción
    await this.prisma.$transaction([
      // Restar del almacén origen
      this.prisma.warehouseStock.update({
        where: {
          warehouseId_productId: {
            warehouseId: fromWarehouseId,
            productId,
          },
        },
        data: {
          quantity: { decrement: quantity },
        },
      }),

      // Sumar al almacén destino
      this.prisma.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: toWarehouseId,
            productId,
          },
        },
        update: {
          quantity: { increment: quantity },
        },
        create: {
          warehouseId: toWarehouseId,
          productId,
          quantity,
        },
      }),

      // Crear movimiento de salida
      this.prisma.inventoryMovement.create({
        data: {
          productId,
          warehouseId: fromWarehouseId,
          type: 'TRANSFER',
          quantity: -quantity,
          unitCost: product.cost,
          totalCost: quantity * product.cost,
          reference: `TO:${toWarehouseId}`,
          referenceType: 'TRANSFER',
          notes,
          userId,
        },
      }),

      // Crear movimiento de entrada
      this.prisma.inventoryMovement.create({
        data: {
          productId,
          warehouseId: toWarehouseId,
          type: 'TRANSFER',
          quantity,
          unitCost: product.cost,
          totalCost: quantity * product.cost,
          reference: `FROM:${fromWarehouseId}`,
          referenceType: 'TRANSFER',
          notes,
          userId,
        },
      }),
    ]);

    return { success: true, stock: await this.getProductoStock(productId) };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // AJUSTE DE INVENTARIO
  // ───────────────────────────────────────────────────────────────────────────
  
  async registrarAjuste(dto: RegistrarAjusteDto, userId: string) {
    const { productId, warehouseId, quantity, reason, notes } = dto;

    // 1. Validar producto
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // 2. Determinar tipo de ajuste
    const type = quantity > 0 ? 'IN' : 'OUT';
    const absQuantity = Math.abs(quantity);

    // 3. Actualizar stock
    await this.prisma.warehouseStock.update({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
      data: {
        quantity: { increment: quantity },
      },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: { increment: quantity },
      },
    });

    // 4. Crear movimiento
    const movement = await this.prisma.inventoryMovement.create({
      data: {
        productId,
        warehouseId,
        type: 'ADJUSTMENT',
        quantity,
        unitCost: product.cost,
        totalCost: absQuantity * product.cost,
        notes: `${reason}. ${notes || ''}`,
        userId,
      },
    });

    // 5. Crear asiento contable si el ajuste es significativo
    const adjustmentValue = absQuantity * product.cost;
    if (adjustmentValue > 100) { // Umbral configurable
      await this.contabilidadService.createInventoryAdjustmentEntry({
        productId,
        productName: product.name,
        quantity,
        unitCost: product.cost,
        totalCost: adjustmentValue,
        reason,
        createdBy: userId,
      });
    }

    return { movement, stock: await this.getProductoStock(productId) };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONTEO FÍSICO DE INVENTARIO
  // ───────────────────────────────────────────────────────────────────────────
  
  async iniciarConteo(dto: IniciarConteoDto, userId: string) {
    const { warehouseId } = dto;

    // 1. Obtener todos los productos del almacén
    const warehouseStock = await this.prisma.warehouseStock.findMany({
      where: { warehouseId },
      include: { product: true },
    });

    // 2. Crear conteo
    const count = await this.prisma.physicalCount.create({
      data: {
        warehouseId,
        startedBy: userId,
        status: 'IN_PROGRESS',
        items: {
          create: warehouseStock.map(ws => ({
            productId: ws.productId,
            systemQuantity: ws.quantity,
            countedQuantity: null,
            difference: null,
            adjusted: false,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    return count;
  }

  async actualizarConteo(
    countId: string,
    productId: string,
    dto: ActualizarConteoDto,
    userId: string,
  ) {
    const { countedQuantity } = dto;

    const countItem = await this.prisma.physicalCountItem.findFirst({
      where: { countId, productId },
    });

    if (!countItem) {
      throw new NotFoundException('Item de conteo no encontrado');
    }

    const difference = countedQuantity - countItem.systemQuantity;

    await this.prisma.physicalCountItem.update({
      where: { id: countItem.id },
      data: {
        countedQuantity,
        difference,
      },
    });

    return { success: true, difference };
  }

  async cerrarConteo(countId: string, userId: string) {
    const count = await this.prisma.physicalCount.findUnique({
      where: { id: countId },
      include: { items: { include: { product: true } }, warehouse: true },
    });

    if (!count) {
      throw new NotFoundException('Conteo no encontrado');
    }

    let adjustments = 0;

    // 3. Ajustar diferencias
    for (const item of count.items) {
      if (item.countedQuantity === null) continue;
      if (Math.abs(item.difference) < 0.001) continue; // Sin diferencia significativa

      // Ajustar stock
      await this.registrarAjuste({
        productId: item.productId,
        warehouseId: count.warehouseId,
        quantity: item.difference,
        reason: `Ajuste por conteo físico ${countId}`,
      }, userId);

      // Marcar como ajustado
      await this.prisma.physicalCountItem.update({
        where: { id: item.id },
        data: { adjusted: true },
      });

      adjustments++;
    }

    // 4. Cerrar conteo
    await this.prisma.physicalCount.update({
      where: { id: countId },
      data: {
        status: 'CLOSED',
        closedBy: userId,
        closedAt: new Date(),
      },
    });

    return { success: true, adjustments };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  async getProductoStock(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        warehouseStock: {
          include: { warehouse: true },
        },
      },
    });

    return {
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      totalStock: product.stock,
      byWarehouse: product.warehouseStock.map(ws => ({
        warehouseId: ws.warehouseId,
        warehouseName: ws.warehouse.name,
        quantity: ws.quantity,
      })),
    };
  }

  async getStockBajo() {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: this.prisma.product.fields.minStock },
      },
      include: { category: true },
    });

    return products.map(p => ({
      productId: p.id,
      code: p.code,
      name: p.name,
      category: p.category?.name,
      currentStock: p.stock,
      minStock: p.minStock,
      shortage: p.minStock - p.stock,
    }));
  }

  async getVencimientos(days: number) {
    const future = new Date();
    future.setDate(future.getDate() + days);

    const lots = await this.prisma.lot.findMany({
      where: {
        expirationDate: { lte: future, gte: new Date() },
        quantity: { gt: 0 },
        qualityStatus: 'APPROVED',
      },
      include: { product: true },
      orderBy: { expirationDate: 'asc' },
    });

    return lots.map(lot => ({
      lotCode: lot.code,
      productId: lot.product.id,
      productName: lot.product.name,
      quantity: lot.quantity,
      expirationDate: lot.expirationDate,
      daysToExpire: Math.ceil((lot.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getValoracionInventario(warehouseId?: string) {
    const where = warehouseId ? { warehouseId } : {};

    const stock = await this.prisma.warehouseStock.findMany({
      where,
      include: { product: true },
    });

    const byCategory = stock.reduce((acc, ws) => {
      const cat = ws.product.category?.name || 'Sin categoría';
      if (!acc[cat]) acc[cat] = { quantity: 0, value: 0 };
      acc[cat].quantity += ws.quantity;
      acc[cat].value += ws.quantity * ws.product.cost;
      return acc;
    }, {} as Record<string, { quantity: number; value: number }>);

    const totalValue = stock.reduce((sum, ws) => sum + ws.quantity * ws.product.cost, 0);

    return {
      totalValue,
      totalItems: stock.length,
      byCategory,
      items: stock.map(ws => ({
        productCode: ws.product.code,
        productName: ws.product.name,
        category: ws.product.category?.name,
        quantity: ws.quantity,
        unitCost: ws.product.cost,
        totalValue: ws.quantity * ws.product.cost,
      })),
    };
  }

  async getKardex(productId: string, from: Date, to: Date) {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        productId,
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: 'asc' },
      include: { warehouse: true },
    });

    let balance = 0;
    let balanceValue = 0;

    const kardex = movements.map(m => {
      const isEntry = m.quantity > 0;
      balance += m.quantity;
      balanceValue += m.totalCost * (isEntry ? 1 : -1);

      return {
        date: m.createdAt,
        type: m.type,
        reference: m.reference,
        warehouse: m.warehouse?.name,
        entryQuantity: isEntry ? m.quantity : 0,
        entryUnitCost: isEntry ? m.unitCost : 0,
        entryTotal: isEntry ? m.totalCost : 0,
        exitQuantity: !isEntry ? Math.abs(m.quantity) : 0,
        exitUnitCost: !isEntry ? m.unitCost : 0,
        exitTotal: !isEntry ? m.totalCost : 0,
        balanceQuantity: balance,
        balanceUnitCost: balance > 0 ? balanceValue / balance : 0,
        balanceTotal: balanceValue,
      };
    });

    return { productId, from, to, kardex };
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Stock Negativo**: No permitir (configurable en sistema)
2. **PEPS**: Salidas usan costo del lote más antiguo
3. **Promedio**: Actualizar costo con cada entrada
4. **Lotes**: Obligatorios para productos con vencimiento
5. **Ajustes**: Generan asiento contable si son significativos
6. **Transferencias**: No afectan stock total, solo distribución
7. **Conteo Físico**: Genera ajustes automáticos por diferencias

---

## 🔗 Conexiones Detalladas

### Con Ventas

```typescript
// Al facturar venta (03-comercial/ventas.md):
await this.inventarioService.registrarSalida({
  productId: item.productId,
  warehouseId: defaultWarehouseId,
  quantity: item.quantity,
  reference: sale.id,
  referenceType: 'SALE',
  notes: `Venta ${sale.invoiceNumber}`,
}, userId);
```

### Con Compras

```typescript
// Al recibir compra (02-operativo/compras.md):
await this.inventarioService.registrarEntrada({
  productId: item.productId,
  warehouseId: defaultWarehouseId,
  quantity: item.quantity,
  unitCost: item.cost,
  lotCode: item.lotCode,
  reference: purchase.id,
  referenceType: 'PURCHASE',
}, userId);
```

### Con Contabilidad

```typescript
// Al ajustar inventario:
await this.contabilidadService.createInventoryAdjustmentEntry({
  productId,
  productName: product.name,
  quantity,
  unitCost: product.cost,
  totalCost: adjustmentValue,
  reason,
  createdBy: userId,
});

// Asiento generado:
// Si es aumento:
//   Débito: Inventario
//   Crédito: Ajuste de Inventario (ingreso)
// Si es disminución:
//   Débito: Pérdida por Ajuste (gasto)
//   Crédito: Inventario
```

---

## 📁 Archivos del Módulo

```
02-modulo-operativo/
├── inventario.md (este archivo)
├── compras.md
├── produccion.md
├── mantenimiento.md
├── calidad.md
└── flota.md
```

**Anterior**: `01-administrativo/rrhh/empleados.md` | **Siguiente**: `02-operativo/compras.md`
