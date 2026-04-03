# Módulo 03: COMERCIAL - Ventas

## Descripción

Módulo de gestión de ventas completo. Incluye cotizaciones, pedidos, facturación, notas de crédito y seguimiento de cuentas por cobrar. Integración automática con contabilidad e inventario.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    MÓDULOS QUE INTERACTÚAN                      │
├─────────────────────────────────────────────────────────────────┤
│  00-shared/auth.md          → Valida permisos del vendedor     │
│  00-shared/rbac.md          → Roles: VENDEDOR, ADMIN           │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/inventario.md → Verifica stock, descuenta venta │
│  02-operativo/compras.md    → Alerta compras si stock bajo    │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad.md → Crea asiento automático   │
│  01-administrativo/impuestos.md      → Calcula IVA, retenciones│
│  01-administrativo/tesoreria.md      → Registra cobros         │
├─────────────────────────────────────────────────────────────────┤
│  04-rrhh/nomina.md          → Calcula comisiones vendedor     │
├─────────────────────────────────────────────────────────────────┤
│  06-reportes/               → Dashboard de ventas, KPIs        │
│  07-integraciones/n8n.md    → Facturación electrónica, emails │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Al facturar → **DESCUENTA** inventario automáticamente
2. Al facturar → **CREA** asiento contable automáticamente
3. Al anular factura → **REVERSA** asiento y **DEVUELVE** inventario
4. Al cobrar → **ACTUALIZA** estado en tesorería
5. NO puede facturar si no hay stock suficiente (configurable)

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────────────────────────────────────

model Customer {
  id              String   @id @default(cuid())
  businessName    String
  rif             String   @unique
  address         String?
  phone           String?
  email           String?
  creditLimit     Float?   // Límite de crédito
  creditDays      Int?     // Días de crédito
  isContributor   Boolean  @default(true) // Contribuyente IVA?
  hasSpecialTax   Boolean  @default(false) // Régimen especial?
  
  // Relaciones
  sales           Sale[]
  quotes          Quote[]
  receivables     AccountReceivable[]
  interactions    Interaction[] // 03-crm
  
  // Auditoría
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([rif])
  @@index([email])
}

// ─────────────────────────────────────────────────────────────────────────────
// VENTAS
// ─────────────────────────────────────────────────────────────────────────────

model Sale {
  id              String   @id @default(cuid())
  number          String   @unique // Número interno (ej. V-2024-000001)
  date            DateTime @default(now())
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  
  // Items
  items           SaleItem[]
  subtotal        Float
  tax             Float
  total           Float
  
  // Estado
  status          SaleStatus @default(DRAFT) // DRAFT, CONFIRMED, INVOICED, CANCELLED
  paymentStatus   PaymentStatus @default(PENDING) // PENDING, PARTIAL, PAID
  
  // Facturación
  invoiceNumber   String?  @unique // Número de factura (al facturar)
  invoiceControl  String?  // Número de control SENIAT
  invoicePdf      String?  // URL en R2
  invoiceXml      String?  // URL XML en R2
  
  // Pago
  paymentMethod   String?  // TRANSFERENCIA, EFECTIVO, ZELLE, CHEQUE, CREDITO
  paymentDate     DateTime?
  dueDate         DateTime?
  paidAt          DateTime?
  
  // Vendedor
  sellerId        String
  seller          User     @relation(fields: [sellerId], references: [id])
  commission      Float?   // Comisión del vendedor
  
  // Documentos relacionados
  quoteId         String?
  quote           Quote?   @relation(fields: [quoteId], references: [id])
  posTransaction  POSTransaction?
  receivable      AccountReceivable?
  creditNotes     CreditNote[]
  
  // Proyecto (si es venta por proyecto)
  projectId       String?
  project         Project? @relation(fields: [projectId], references: [id])
  
  // Auditoría
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([customerId])
  @@index([status])
  @@index([date])
  @@index([invoiceNumber])
}

model SaleItem {
  id          String   @id @default(cuid())
  saleId      String
  sale        Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  // Cantidades y precios
  quantity    Float
  price       Float
  discount    Float    @default(0) // Porcentaje
  taxRate     Float    @default(0.16) // 0.16 = 16%, 0.08 = 8%, 0 = exento
  
  // Totales
  subtotal    Float    // quantity * price * (1 - discount)
  taxAmount   Float    // subtotal * taxRate
  total       Float    // subtotal + taxAmount
  
  // Lote (si aplica trazabilidad)
  lotId       String?
  lot         Lot?     @relation(fields: [lotId], references: [id])
  
  // Auditoría
  createdAt DateTime @default(now())

  @@index([saleId])
  @@index([productId])
}

// ─────────────────────────────────────────────────────────────────────────────
// COTIZACIONES
// ─────────────────────────────────────────────────────────────────────────────

model Quote {
  id            String   @id @default(cuid())
  number        String   @unique // ej. C-2024-000001
  date          DateTime @default(now())
  validUntil    DateTime
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  
  items         QuoteItem[]
  subtotal      Float
  tax           Float
  total         Float
  
  status        QuoteStatus @default(DRAFT) // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
  notes         String?
  
  sellerId      String
  seller        User     @relation(fields: [sellerId], references: [id])
  
  convertedToSaleId String?
  convertedToSale   Sale?  @relation(fields: [convertedToSaleId], references: [id])
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([customerId])
  @@index([status])
}

model QuoteItem {
  id          String @id @default(cuid())
  quoteId     String
  quote       Quote  @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  quantity    Float
  price       Float
  discount    Float  @default(0)
  taxRate     Float  @default(0.16)
  subtotal    Float
  total       Float
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTAS DE CRÉDITO
// ─────────────────────────────────────────────────────────────────────────────

model CreditNote {
  id            String   @id @default(cuid())
  number        String   @unique // ej. NC-2024-000001
  date          DateTime @default(now())
  originalSaleId String
  originalSale  Sale     @relation(fields: [originalSaleId], references: [id])
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  
  items         CreditNoteItem[]
  subtotal      Float
  tax           Float
  total         Float
  
  reason        String   // Motivo de la nota de crédito
  status        String   @default("ISSUED") // ISSUED, APPLIED, CANCELLED
  
  journalEntryId String?
  journalEntry  JournalEntry? @relation(fields: [journalEntryId], references: [id])
  
  createdAt     DateTime @default(now())

  @@index([originalSaleId])
  @@index([customerId])
}

model CreditNoteItem {
  id            String @id @default(cuid())
  creditNoteId  String
  creditNote    CreditNote @relation(fields: [creditNoteId], references: [id])
  productId     String
  product       Product  @relation(fields: [productId], references: [id])
  quantity      Float
  price         Float
  taxRate       Float
  subtotal      Float
  total         Float
}

// ─────────────────────────────────────────────────────────────────────────────
// CUENTAS POR COBRAR
// ─────────────────────────────────────────────────────────────────────────────

model AccountReceivable {
  id            String   @id @default(cuid())
  saleId        String   @unique
  sale          Sale     @relation(fields: [saleId], references: [id])
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  
  originalAmount Float
  paidAmount    Float    @default(0)
  balance       Float
  
  dueDate       DateTime
  status        ARStatus @default(PENDING) // PENDING, PARTIAL, PAID, OVERDUE, WRITTEN_OFF
  
  payments      ARPayment[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([customerId])
  @@index([status])
  @@index([dueDate])
}

model ARPayment {
  id              String   @id @default(cuid())
  receivableId    String
  receivable      AccountReceivable @relation(fields: [receivableId], references: [id])
  amount          Float
  date            DateTime
  method          String   // TRANSFERENCIA, EFECTIVO, ZELLE, CHEQUE
  reference       String?
  bankAccountId   String?
  bankAccount     BankAccount? @relation(fields: [bankAccountId], references: [id])
  journalEntryId  String?
  journalEntry    JournalEntry? @relation(fields: [journalEntryId], references: [id])
  createdAt       DateTime @default(now())

  @@index([receivableId])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum SaleStatus {
  DRAFT
  CONFIRMED
  INVOICED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PARTIAL
  PAID
}

enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
}

enum ARStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
  WRITTEN_OFF
}
```

---

## 📡 Endpoints de la API

### Controller de Ventas

```typescript
// apps/backend/src/modules/ventas/ventas.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { VentasService } from './ventas.service';

@Controller('ventas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VentasController {
  constructor(private ventasService: VentasService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // VENTAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get()
  @RequirePermissions('ventas:read')
  async getVentas(@Query() query: VentaQueryDto) {
    return this.ventasService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('ventas:read')
  async getVenta(@Param('id') id: string) {
    return this.ventasService.findOne(id);
  }

  @Post()
  @RequirePermissions('ventas:create')
  async createVenta(@Body() dto: CreateVentaDto, @User() user: any) {
    return this.ventasService.create(dto, user.id);
  }

  @Put(':id')
  @RequirePermissions('ventas:update')
  async updateVenta(
    @Param('id') id: string,
    @Body() dto: UpdateVentaDto,
    @User() user: any,
  ) {
    return this.ventasService.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('ventas:delete')
  async deleteVenta(@Param('id') id: string) {
    return this.ventasService.remove(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FACTURAR VENTA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post(':id/facturar')
  @RequirePermissions('ventas:create')
  async facturarVenta(
    @Param('id') id: string,
    @Body() dto: FacturarVentaDto,
    @User() user: any,
  ) {
    return this.ventasService.facturar(id, dto, user.id);
  }

  @Get(':id/factura/pdf')
  @RequirePermissions('ventas:export')
  async getFacturaPdf(@Param('id') id: string) {
    return this.ventasService.getFacturaPdf(id);
  }

  @Get(':id/factura/xml')
  @RequirePermissions('ventas:export')
  async getFacturaXml(@Param('id') id: string) {
    return this.ventasService.getFacturaXml(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // NOTAS DE CRÉDITO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post(':id/nota-credito')
  @RequirePermissions('ventas:delete')
  async emitirNotaCredito(
    @Param('id') id: string,
    @Body() dto: NotaCreditoDto,
    @User() user: any,
  ) {
    return this.ventasService.emitirNotaCredito(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // COTIZACIONES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('cotizaciones')
  @RequirePermissions('ventas:read')
  async getCotizaciones(@Query() query: QuoteQueryDto) {
    return this.ventasService.getCotizaciones(query);
  }

  @Post('cotizaciones')
  @RequirePermissions('ventas:create')
  async createCotizacion(@Body() dto: CreateQuoteDto, @User() user: any) {
    return this.ventasService.createCotizacion(dto, user.id);
  }

  @Post('cotizaciones/:id/convertir')
  @RequirePermissions('ventas:create')
  async convertirCotizacionAVenta(
    @Param('id') id: string,
    @User() user: any,
  ) {
    return this.ventasService.convertirCotizacionAVenta(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CUENTAS POR COBRAR
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('cuentas-por-cobrar')
  @RequirePermissions('ventas:read')
  async getCuentasPorCobrar(@Query() query: ARQueryDto) {
    return this.ventasService.getCuentasPorCobrar(query);
  }

  @Post('cuentas-por-cobrar/:id/cobrar')
  @RequirePermissions('ventas:create')
  async registrarCobro(
    @Param('id') id: string,
    @Body() dto: RegistrarCobroDto,
    @User() user: any,
  ) {
    return this.ventasService.registrarCobro(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/ventas-periodo')
  @RequirePermissions('reportes-ventas:read')
  async getVentasPeriodo(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.ventasService.getVentasPeriodo(new Date(from), new Date(to));
  }

  @Get('reportes/ventas-vendedor')
  @RequirePermissions('reportes-ventas:read')
  async getVentasPorVendedor(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.ventasService.getVentasPorVendedor(new Date(from), new Date(to));
  }

  @Get('reportes/productos-mas-vendidos')
  @RequirePermissions('reportes-ventas:read')
  async getProductosMasVendidos(
    @Query('limit') limit: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.ventasService.getProductosMasVendidos(
      limit || 10,
      new Date(from),
      new Date(to),
    );
  }
}
```

---

## 🧩 Servicio de Ventas

### Funciones Principales

```typescript
// apps/backend/src/modules/ventas/ventas.service.ts

@Injectable()
export class VentasService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private contabilidadService: ContabilidadService,
    private config: SystemConfigService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR VENTA (Borrador)
  // ───────────────────────────────────────────────────────────────────────────
  
  async create(dto: CreateVentaDto, userId: string) {
    // 1. Obtener número consecutivo
    const number = await this.getNextSaleNumber();

    // 2. Calcular totales
    let subtotal = 0;
    let tax = 0;

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Producto ${item.productId} no encontrado`);
      }

      const itemSubtotal = item.quantity * item.price * (1 - (item.discount || 0));
      const itemTax = itemSubtotal * (item.taxRate || 0.16);

      subtotal += itemSubtotal;
      tax += itemTax;
    }

    const total = subtotal + tax;

    // 3. Crear venta en estado BORRADOR
    const sale = await this.prisma.sale.create({
      data: {
        number,
        customerId: dto.customerId,
        subtotal,
        tax,
        total,
        status: 'DRAFT',
        paymentStatus: 'PENDING',
        sellerId: userId,
        paymentMethod: dto.paymentMethod,
        dueDate: dto.dueDate,
        items: {
          create: dto.items.map(item => {
            const product = dto.productsData?.find(p => p.id === item.productId);
            const itemSubtotal = item.quantity * item.price * (1 - (item.discount || 0));
            const itemTax = itemSubtotal * (item.taxRate || 0.16);

            return {
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0,
              taxRate: item.taxRate || 0.16,
              subtotal: itemSubtotal,
              taxAmount: itemTax,
              total: itemSubtotal + itemTax,
            };
          }),
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    return sale;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FACTURAR VENTA
  // ───────────────────────────────────────────────────────────────────────────
  
  async facturar(id: string, dto: FacturarVentaDto, userId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (sale.status !== 'DRAFT' && sale.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Solo se pueden facturar ventas en borrador o confirmadas'
      );
    }

    // 1. Verificar stock (si está habilitado en configuración)
    const checkStock = await this.config.get('ventas.check_stock', 'true');
    if (checkStock === 'true') {
      for (const item of sale.items) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${item.product.name}. ` +
            `Disponible: ${item.product.stock}, Requerido: ${item.quantity}`
          );
        }
      }
    }

    // 2. Generar número de factura y control
    const invoiceNumber = await this.getNextInvoiceNumber();
    const invoiceControl = await this.getNextControlNumber();

    // 3. Descontar inventario
    for (const item of sale.items) {
      await this.inventoryService.removeStock(
        item.productId,
        item.quantity,
        'VENTA',
        sale.id,
      );
    }

    // 4. Crear asiento contable automático
    await this.contabilidadService.createEntryFromVenta({
      id: sale.id,
      invoiceNumber,
      customerId: sale.customerId,
      customerName: sale.customer.businessName,
      customerRif: sale.customer.rif,
      subtotal: sale.subtotal,
      tax: sale.tax,
      total: sale.total,
      date: new Date(),
      createdBy: userId,
    });

    // 5. Generar PDF y XML de factura
    const invoicePdfUrl = await this.generateInvoicePdf(sale, invoiceNumber, invoiceControl);
    const invoiceXmlUrl = await this.generateInvoiceXml(sale, invoiceNumber, invoiceControl);

    // 6. Actualizar venta
    const updatedSale = await this.prisma.sale.update({
      where: { id },
      data: {
        status: 'INVOICED',
        invoiceNumber,
        invoiceControl,
        invoicePdf: invoicePdfUrl,
        invoiceXml: invoiceXmlUrl,
        paymentStatus: dto.paymentMethod === 'CREDITO' ? 'PENDING' : 'PAID',
        paidAt: dto.paymentMethod !== 'CREDITO' ? new Date() : null,
      },
    });

    // 7. Crear cuenta por cobrar si es crédito
    if (dto.paymentMethod === 'CREDITO') {
      await this.prisma.accountReceivable.create({
        data: {
          saleId: sale.id,
          customerId: sale.customerId,
          originalAmount: sale.total,
          paidAmount: 0,
          balance: sale.total,
          dueDate: sale.dueDate!,
          status: 'PENDING',
        },
      });
    }

    // 8. Calcular comisión del vendedor
    const commissionRate = await this.config.get('ventas.commission_rate', '0');
    if (commissionRate !== '0') {
      const commission = sale.subtotal * parseFloat(commissionRate);
      await this.prisma.salesCommission.create({
        data: {
          userId: sale.sellerId,
          saleId: sale.id,
          rate: parseFloat(commissionRate),
          amount: commission,
          status: 'PENDING',
        },
      });
    }

    // 9. Disparar webhook a n8n para facturación electrónica
    await this.triggerElectronicInvoiceWebhook(updatedSale);

    return updatedSale;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EMITIR NOTA DE CRÉDITO
  // ───────────────────────────────────────────────────────────────────────────
  
  async emitirNotaCredito(saleId: string, dto: NotaCreditoDto, userId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    if (!sale || sale.status !== 'INVOICED') {
      throw new BadRequestException('Solo se pueden emitir NC sobre facturas');
    }

    // 1. Generar número de NC
    const year = new Date().getFullYear();
    const last = await this.prisma.creditNote.findFirst({
      where: { number: { startsWith: `NC-${year}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[2]) + 1 : 1;
    const number = `NC-${year}-${num.toString().padStart(6, '0')}`;

    // 2. Procesar items de la NC
    let subtotal = 0;
    let tax = 0;

    const ncItems = dto.items.map(item => {
      const saleItem = sale.items.find(si => si.productId === item.productId);
      if (!saleItem) {
        throw new BadRequestException(
          `Producto ${item.productId} no está en la factura original`
        );
      }

      if (item.quantity > saleItem.quantity) {
        throw new BadRequestException(
          `Cantidad mayor a la facturada para ${saleItem.product.name}`
        );
      }

      const itemSubtotal = item.quantity * saleItem.price;
      const itemTax = itemSubtotal * saleItem.taxRate;

      subtotal += itemSubtotal;
      tax += itemTax;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: saleItem.price,
        taxRate: saleItem.taxRate,
        subtotal: itemSubtotal,
        total: itemSubtotal + itemTax,
      };
    });

    const total = subtotal + tax;

    // 3. Crear nota de crédito
    const creditNote = await this.prisma.creditNote.create({
      data: {
        number,
        originalSaleId: saleId,
        customerId: sale.customerId,
        subtotal,
        tax,
        total,
        reason: dto.reason,
        items: {
          create: ncItems,
        },
      },
      include: { items: { include: { product: true } } },
    });

    // 4. Devolver stock
    for (const item of creditNote.items) {
      await this.inventoryService.addStock(
        item.productId,
        item.quantity,
        'DEVOLUCION',
        creditNote.id,
      );
    }

    // 5. Crear asiento de reverso
    await this.contabilidadService.createCreditNoteEntry({
      creditNoteId: creditNote.id,
      originalSaleId: saleId,
      customerId: sale.customerId,
      customerName: sale.customer.businessName,
      customerRif: sale.customer.rif,
      subtotal,
      tax,
      total,
      createdBy: userId,
    });

    // 6. Actualizar estado de la venta original
    const allItemsReturned = dto.items.every(item => {
      const saleItem = sale.items.find(si => si.productId === item.productId);
      return saleItem && item.quantity >= saleItem.quantity;
    });

    if (allItemsReturned) {
      await this.prisma.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' },
      });
    }

    return creditNote;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR COBRO
  // ───────────────────────────────────────────────────────────────────────────
  
  async registrarCobro(receivableId: string, dto: RegistrarCobroDto, userId: string) {
    const receivable = await this.prisma.accountReceivable.findUnique({
      where: { id: receivableId },
      include: { sale: true, customer: true },
    });

    if (!receivable) {
      throw new NotFoundException('Cuenta por cobrar no encontrada');
    }

    if (receivable.status === 'PAID') {
      throw new BadRequestException('Esta cuenta ya está pagada');
    }

    if (dto.amount > receivable.balance) {
      throw new BadRequestException(
        `El monto (${dto.amount}) supera el saldo pendiente (${receivable.balance})`
      );
    }

    // 1. Registrar pago
    const payment = await this.prisma.aRPayment.create({
      data: {
        receivableId,
        amount: dto.amount,
        date: dto.date || new Date(),
        method: dto.method,
        reference: dto.reference,
        bankAccountId: dto.bankAccountId,
      },
    });

    // 2. Actualizar cuenta por cobrar
    const newPaidAmount = receivable.paidAmount + dto.amount;
    const newBalance = receivable.originalAmount - newPaidAmount;
    const newStatus: ARStatus = newBalance <= 0.01 ? 'PAID' : 'PARTIAL';

    await this.prisma.accountReceivable.update({
      where: { id: receivableId },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      },
    });

    // 3. Actualizar venta
    await this.prisma.sale.update({
      where: { id: receivable.saleId },
      data: {
        paymentStatus: newStatus === 'PAID' ? 'PAID' : 'PARTIAL',
        paidAt: newStatus === 'PAID' ? new Date() : undefined,
      },
    });

    // 4. Si hay banco, actualizar saldo
    if (dto.bankAccountId) {
      await this.prisma.bankAccount.update({
        where: { id: dto.bankAccountId },
        data: { balance: { increment: dto.amount } },
      });
    }

    // 5. Crear asiento contable del cobro
    await this.contabilidadService.createPaymentEntry({
      receivableId,
      amount: dto.amount,
      method: dto.method,
      bankAccountId: dto.bankAccountId,
      createdBy: userId,
    });

    return { payment, receivable: { ...receivable, paidAmount: newPaidAmount, balance: newBalance, status: newStatus } };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async getNextSaleNumber() {
    const year = new Date().getFullYear();
    const last = await this.prisma.sale.findFirst({
      where: { number: { startsWith: `V-${year}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[2]) + 1 : 1;
    return `V-${year}-${num.toString().padStart(6, '0')}`;
  }

  private async getNextInvoiceNumber() {
    const company = await this.prisma.companyConfig.findFirst();
    if (!company) throw new Error('Empresa no configurada');
    
    const num = company.nextInvoiceNum.toString().padStart(8, '0');
    const invoiceNumber = `${company.invoicePrefix}${company.invoiceSeries}-${num}`;
    
    await this.prisma.companyConfig.update({
      where: { id: company.id },
      data: { nextInvoiceNum: { increment: 1 } },
    });
    
    return invoiceNumber;
  }

  private async getNextControlNumber() {
    const company = await this.prisma.companyConfig.findFirst();
    if (!company) throw new Error('Empresa no configurada');
    
    const parts = company.invoiceControl.split('-');
    const series = parts[0];
    const num = (parseInt(parts[1]) + 1).toString().padStart(8, '0');
    const control = `${series}-${num}`;
    
    await this.prisma.companyConfig.update({
      where: { id: company.id },
      data: { invoiceControl: control },
    });
    
    return control;
  }

  private async generateInvoicePdf(sale: any, invoiceNumber: string, invoiceControl: string) {
    // Generar HTML de factura
    const html = await this.generateInvoiceHTML(sale, invoiceNumber, invoiceControl);
    
    // Convertir a PDF y subir a R2
    const pdfBuffer = await htmlToPdf(html);
    const key = `facturas/${invoiceNumber}.pdf`;
    await this.r2Service.uploadBuffer(key, pdfBuffer, 'application/pdf');
    
    return this.r2Service.getPublicUrl(key);
  }

  private async generateInvoiceXml(sale: any, invoiceNumber: string, invoiceControl: string) {
    // Generar XML según formato SENIAT
    const xml = await this.generateInvoiceXML(sale, invoiceNumber, invoiceControl);
    
    // Subir a R2
    const key = `facturas/${invoiceNumber}.xml`;
    await this.r2Service.uploadBuffer(key, Buffer.from(xml), 'application/xml');
    
    return this.r2Service.getPublicUrl(key);
  }

  private async triggerElectronicInvoiceWebhook(sale: any) {
    // Disparar webhook a n8n para procesamiento asíncrono
    const webhookUrl = process.env.N8N_WEBHOOK_URL + '/factura-electronica';
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sale }),
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  async getVentasPeriodo(from: Date, to: Date) {
    const ventas = await this.prisma.sale.findMany({
      where: {
        status: 'INVOICED',
        date: { gte: from, lte: to },
      },
      include: {
        customer: true,
        seller: true,
      },
      orderBy: { date: 'desc' },
    });

    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    const totalImpuestos = ventas.reduce((sum, v) => sum + v.tax, 0);

    return {
      from,
      to,
      ventas,
      resumen: {
        totalVentas,
        totalImpuestos,
        ventasNetas: totalVentas - totalImpuestos,
        count: ventas.length,
      },
    };
  }

  async getProductosMasVendidos(limit: number, from: Date, to: Date) {
    const productos = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          status: 'INVOICED',
          date: { gte: from, lte: to },
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
      take: limit,
    });

    const productosConDetalle = await Promise.all(
      productos.map(async p => {
        const product = await this.prisma.product.findUnique({
          where: { id: p.productId },
          include: { category: true },
        });

        return {
          ...product,
          cantidadVendida: p._sum.quantity,
          totalVendido: p._sum.subtotal,
        };
      })
    );

    return productosConDetalle;
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Stock**: NO facturar si no hay stock (configurable)
2. **Consecutividad**: Números de factura deben ser consecutivos
3. **Número de Control**: Único por factura, formato SENIAT
4. **Notas de Crédito**: Solo sobre facturas INVOICED
5. **Cobros**: No cobrar más del saldo pendiente
6. **Comisiones**: Se calculan sobre subtotal (sin IVA)
7. **Anulación**: NC debe especificar motivo válido

---

## 🔗 Conexiones Detalladas

### Con Inventario (02-operativo/inventario.md)

```typescript
// Al facturar:
await this.inventoryService.removeStock(
  productId,
  quantity,
  'VENTA',
  sale.id,
);

// Al emitir NC:
await this.inventoryService.addStock(
  productId,
  quantity,
  'DEVOLUCION',
  creditNote.id,
);
```

### Con Contabilidad (01-administrativo/contabilidad.md)

```typescript
// Al facturar:
await this.contabilidadService.createEntryFromVenta({
  id: sale.id,
  invoiceNumber,
  customerId: sale.customerId,
  customerName: sale.customer.businessName,
  subtotal: sale.subtotal,
  tax: sale.tax,
  total: sale.total,
  date: new Date(),
  createdBy: userId,
});

// Asiento generado:
// Débito: Cuentas por Cobrar (total)
// Crédito: Ingresos (subtotal)
// Crédito: IVA por Pagar (tax)
```

### Con Tesorería (01-administrativo/tesoreria.md)

```typescript
// Al cobrar:
await this.prisma.bankAccount.update({
  where: { id: bankAccountId },
  data: { balance: { increment: amount } },
});
```

### Con RRHH (04-rrhh/nomina.md)

```typescript
// Al facturar, registrar comisión:
await this.prisma.salesCommission.create({
  userId: sale.sellerId,
  saleId: sale.id,
  rate: commissionRate,
  amount: sale.subtotal * commissionRate,
  status: 'PENDING',
});

// Nómina mensual consulta comisiones:
const comisiones = await this.prisma.salesCommission.findMany({
  where: {
    userId: employeeId,
    status: 'PENDING',
    createdAt: { gte: startOfMonth, lte: endOfMonth },
  },
});
```

---

## 📁 Archivos del Módulo

```
03-modulo-comercial/
├── ventas.md (este archivo)
├── crm.md
├── pos.md
└── marketing.md
```

**Anterior**: `02-operativo/inventario.md` | **Siguiente**: `crm.md`
