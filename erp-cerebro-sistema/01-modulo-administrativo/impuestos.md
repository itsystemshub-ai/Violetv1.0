# Módulo 01: ADMINISTRATIVO - Impuestos (IVA, ISLR, Retenciones)

## Descripción

Módulo de gestión tributaria que incluye cálculo y declaración de IVA, retenciones de ISLR, comprobantes de retención y reportes para el SENIAT.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad  → Asientos de impuestos       │
│  01-administrativo/finanzas      → Provisiones fiscales        │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/compras            → IVA crédito fiscal          │
│  02-operativo/ventas             → IVA débito fiscal           │
├─────────────────────────────────────────────────────────────────┤
│  05-configuracion/sistema        → Parámetros fiscales         │
│  07-integraciones/api-externas   → SENIAT                      │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Ventas **CALCULAN** IVA débito fiscal automáticamente
2. Compras **CALCULAN** IVA crédito fiscal automáticamente
3. ISLR **RETIENE** según porcentajes de ley
4. SENIAT **RECIBE** libros fiscales mensuales

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// DECLARACIONES DE IVA
// ─────────────────────────────────────────────────────────────────────────────

model IVADeclaration {
  id                String   @id @default(cuid())
  period            String   @unique // MM-YYYY
  
  // IVA Débito Fiscal (Ventas)
  debitFiscal       Float    @default(0)
  debitFiscalBase   Float    @default(0) // Base imponible
  
  // IVA Crédito Fiscal (Compras)
  creditFiscal      Float    @default(0)
  creditFiscalBase  Float    @default(0) // Base imponible
  
  // Resultado
  result            Float    // debitFiscal - creditFiscal
  toPay             Float    // Monto a pagar
  carryForward      Float    // Saldo a favor para próximo período
  
  // Estado
  status            TaxStatus @default(DRAFT) // DRAFT, SUBMITTED, PAID
  submittedAt       DateTime?
  paidAt            DateTime?
  
  // Archivo
  formUrl           String?  // URL del formulario en R2
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([period])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// RETENCIONES DE ISLR
// ─────────────────────────────────────────────────────────────────────────────

model ISLRWithholding {
  id                String   @id @default(cuid())
  number            String   @unique // ej. ISLR-2024-000001
  
  // Sujeto retenido
  entityRif         String
  entityName        String
  entityType        String   // JURIDICA, NATURAL
  
  // Factura retenida
  invoiceNumber     String
  invoiceDate       DateTime
  invoiceAmount     Float
  
  // Cálculo
  taxBase           Float    // Base imponible
  rate              Float    // Porcentaje de retención
  amount            Float    // Monto retenido
  
  // Concepto
  concept           String   // Honorarios, Servicios, Alquileres, etc.
  subconcept        String?
  
  // Comprobante
  voucherNumber     String?  // Número de comprobante
  voucherDate       DateTime?
  
  // Período
  period            String   // MM-YYYY
  
  // Estado
  status            String   @default("PENDING") // PENDING, SUBMITTED, PAID
  submittedAt       DateTime?
  paidAt            DateTime?
  
  // Asiento contable
  journalEntryId    String?
  journalEntry      JournalEntry? @relation(fields: [journalEntryId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([period])
  @@index([entityRif])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// RETENCIONES DE IVA
// ─────────────────────────────────────────────────────────────────────────────

model IVAWithholding {
  id                String   @id @default(cuid())
  number            String   @unique // ej. IVA-RET-2024-000001
  
  // Proveedor retenido
  supplierRif       String
  supplierName      String
  
  // Factura retenida
  invoiceNumber     String
  invoiceControl    String
  invoiceDate       DateTime
  invoiceAmount     Float
  ivaAmount         Float    // Monto de IVA
  
  // Retención
  rate              Float    @default(0.75) // 75% por defecto
  amount            Float    // Monto retenido
  
  // Comprobante
  voucherNumber     String
  voucherDate       DateTime
  
  // Período
  period            String   // MM-YYYY
  
  // Estado
  status            String   @default("PENDING")
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([period])
  @@index([supplierRif])
}

// ─────────────────────────────────────────────────────────────────────────────
// DECLARACIÓN ISLR ANUAL
// ─────────────────────────────────────────────────────────────────────────────

model ISLRAnnualDeclaration {
  id                String   @id @default(cuid())
  fiscalYear        Int      @unique // Año fiscal
  
  // Ingresos
  grossIncome       Float
  exemptIncome      Float  @default(0)
  taxableIncome     Float  // grossIncome - exemptIncome
  
  // Deducciones
  deductions        Float
  netIncome         Float  // taxableIncome - deductions
  
  // Impuesto
  taxRate           Float
  taxAmount         Float
  withholdings      Float  // Retenciones sufridas
  toPay             Float  // taxAmount - withholdings
  
  // Estado
  status            String   @default("DRAFT")
  filedAt           DateTime?
  formARC           String?  // URL del formulario AR-C
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([fiscalYear])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// LIBROS FISCALES
// ─────────────────────────────────────────────────────────────────────────────

model TaxBook {
  id                String   @id @default(cuid())
  type              TaxBookType // LIBRO_VENTAS, LIBRO_COMPRAS
  period            String   // MM-YYYY
  
  // Contenido en JSON
  entries           Json     // Array de registros
  
  // Totales
  totalBase         Float
  totalTax          Float
  total             Float
  
  // Estado
  status            String   @default("DRAFT")
  generatedAt       DateTime?
  
  // Archivo
  excelUrl          String?
  pdfUrl            String?
  
  createdAt         DateTime @default(now())

  @@unique([type, period])
  @@index([period])
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTRIBUYENTES
// ─────────────────────────────────────────────────────────────────────────────

model Taxpayer {
  id                String   @id @default(cuid())
  rif               String   @unique
  name              String
  address           String?
  phone             String?
  email             String?
  
  // Tipo
  type              TaxpayerType // JURIDICA, NATURAL
  isContributor     Boolean  @default(true) // Contribuyente IVA?
  hasSpecialRegime  Boolean  @default(false) // Régimen especial?
  
  // ISLR
  islrRate          Float?   // Porcentaje de ISLR
  islrCategory      String?  // Categoría de ISLR
  
  // Comprobantes
  lastVoucherNumber Int      @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([rif])
  @@index([type])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum TaxStatus {
  DRAFT
  SUBMITTED
  PAID
  LATE
}

enum TaxBookType {
  LIBRO_VENTAS
  LIBRO_COMPRAS
}

enum TaxpayerType {
  JURIDICA
  NATURAL
}
```

---

## 📡 Endpoints de la API

### Controller de Impuestos

```typescript
// apps/backend/src/modules/impuestos/impuestos.controller.ts

import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ImpuestosService } from './impuestos.service';

@Controller('impuestos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImpuestosController {
  constructor(private impuestosService: ImpuestosService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // IVA - DECLARACIONES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('iva/declaraciones')
  @RequirePermissions('impuestos:read')
  async getDeclaracionesIVA(@Query('period') period?: string) {
    return this.impuestosService.getDeclaracionesIVA(period);
  }

  @Post('iva/calcular')
  @RequirePermissions('impuestos:create')
  async calcularIVA(@Body() dto: CalcularIVADto) {
    return this.impuestosService.calcularIVA(dto.period);
  }

  @Post('iva/declarar')
  @RequirePermissions('impuestos:create')
  async declararIVA(@Body() dto: DeclararIVADto, @User() user: any) {
    return this.impuestosService.declararIVA(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LIBROS FISCALES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('libros/ventas')
  @RequirePermissions('impuestos:read')
  async getLibroVentas(@Query('period') period: string) {
    return this.impuestosService.getLibroVentas(period);
  }

  @Get('libros/compras')
  @RequirePermissions('impuestos:read')
  async getLibroCompras(@Query('period') period: string) {
    return this.impuestosService.getLibroCompras(period);
  }

  @Post('libros/generar')
  @RequirePermissions('impuestos:create')
  async generarLibros(@Body() dto: GenerarLibrosDto, @User() user: any) {
    return this.impuestosService.generarLibros(dto.period, user.id);
  }

  @Get('libros/exportar')
  @RequirePermissions('impuestos:export')
  async exportarLibro(@Query('type') type: string, @Query('period') period: string) {
    return this.impuestosService.exportarLibro(type as TaxBookType, period);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ISLR - RETENCIONES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('islr/retenciones')
  @RequirePermissions('impuestos:read')
  async getRetencionesISLR(@Query('period') period?: string) {
    return this.impuestosService.getRetencionesISLR(period);
  }

  @Post('islr/retener')
  @RequirePermissions('impuestos:create')
  async retenerISLR(@Body() dto: RetenerISLRDto, @User() user: any) {
    return this.impuestosService.retenerISLR(dto, user.id);
  }

  @Get('islr/comprobante/:id')
  @RequirePermissions('impuestos:export')
  async getComprobanteISLR(@Param('id') id: string) {
    return this.impuestosService.getComprobanteISLR(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // IVA - RETENCIONES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('iva/retenciones')
  @RequirePermissions('impuestos:read')
  async getRetencionesIVA(@Query('period') period?: string) {
    return this.impuestosService.getRetencionesIVA(period);
  }

  @Post('iva/retener')
  @RequirePermissions('impuestos:create')
  async retenerIVA(@Body() dto: RetenerIVADto, @User() user: any) {
    return this.impuestosService.retenerIVA(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ISLR - DECLARACIÓN ANUAL
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('islr/anual')
  @RequirePermissions('impuestos:read')
  async getDeclaracionAnual(@Query('year') year?: number) {
    return this.impuestosService.getDeclaracionAnual(parseInt(year?.toString() || new Date().getFullYear().toString()));
  }

  @Post('islr/anual/calcular')
  @RequirePermissions('impuestos:create')
  async calcularDeclaracionAnual(@Body() dto: CalcularAnualDto, @User() user: any) {
    return this.impuestosService.calcularDeclaracionAnual(dto.year, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONTRIBUYENTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('contribuyentes')
  @RequirePermissions('impuestos:read')
  async getContribuyentes(@Query('type') type?: string) {
    return this.impuestosService.getContribuyentes(type);
  }

  @Post('contribuyentes')
  @RequirePermissions('impuestos:create')
  async createContribuyente(@Body() dto: CreateContribuyenteDto, @User() user: any) {
    return this.impuestosService.createContribuyente(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES SENIAT
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/resumen-iva')
  @RequirePermissions('reportes-impuestos:read')
  async getResumenIVA(@Query('period') period: string) {
    return this.impuestosService.getResumenIVA(period);
  }

  @Get('reportes/retenciones-mes')
  @RequirePermissions('reportes-impuestos:read')
  async getRetencionesMes(@Query('period') period: string) {
    return this.impuestosService.getRetencionesMes(period);
  }
}
```

---

## 🧩 Servicio de Impuestos

### Funciones Principales

```typescript
// apps/backend/src/modules/impuestos/impuestos.service.ts

@Injectable()
export class ImpuestosService {
  constructor(private prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CALCULAR IVA DEL PERÍODO
  // ───────────────────────────────────────────────────────────────────────────
  
  async calcularIVA(period: string) {
    const [month, year] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // IVA Débito Fiscal (Ventas facturadas)
    const debitFiscal = await this.prisma.sale.aggregate({
      where: {
        status: 'INVOICED',
        date: { gte: startDate, lte: endDate },
      },
      _sum: { tax: true, subtotal: true },
    });

    // IVA Crédito Fiscal (Compras recibidas)
    const creditFiscal = await this.prisma.purchase.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      _sum: { tax: true, subtotal: true },
    });

    const debitFiscalAmount = debitFiscal._sum.tax || 0;
    const debitFiscalBase = debitFiscal._sum.subtotal || 0;
    const creditFiscalAmount = creditFiscal._sum.tax || 0;
    const creditFiscalBase = creditFiscal._sum.subtotal || 0;

    // Resultado
    const result = debitFiscalAmount - creditFiscalAmount;
    const toPay = result > 0 ? result : 0;
    const carryForward = result < 0 ? Math.abs(result) : 0;

    return {
      period,
      debitFiscal: {
        amount: debitFiscalAmount,
        base: debitFiscalBase,
      },
      creditFiscal: {
        amount: creditFiscalAmount,
        base: creditFiscalBase,
      },
      result,
      toPay,
      carryForward,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DECLARAR IVA
  // ───────────────────────────────────────────────────────────────────────────
  
  async declararIVA(dto: DeclararIVADto, userId: string) {
    const calculation = await this.calcularIVA(dto.period);

    // Verificar si ya existe declaración
    const existing = await this.prisma.iVADeclaration.findUnique({
      where: { period: dto.period },
    });

    if (existing && existing.status !== 'DRAFT') {
      throw new BadRequestException('Ya existe una declaración presentada para este período');
    }

    // Crear o actualizar declaración
    const declaration = await this.prisma.iVADeclaration.upsert({
      where: { period: dto.period },
      update: {
        debitFiscal: calculation.debitFiscal.amount,
        debitFiscalBase: calculation.debitFiscal.base,
        creditFiscal: calculation.creditFiscal.amount,
        creditFiscalBase: calculation.creditFiscal.base,
        result: calculation.result,
        toPay: calculation.toPay,
        carryForward: calculation.carryForward,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      create: {
        period: dto.period,
        debitFiscal: calculation.debitFiscal.amount,
        debitFiscalBase: calculation.debitFiscal.base,
        creditFiscal: calculation.creditFiscal.amount,
        creditFiscalBase: calculation.creditFiscal.base,
        result: calculation.result,
        toPay: calculation.toPay,
        carryForward: calculation.carryForward,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Generar formulario PDF
    const formUrl = await this.generateIVAForm(declaration);

    await this.prisma.iVADeclaration.update({
      where: { id: declaration.id },
      data: { formUrl },
    });

    return {
      declaration,
      formUrl,
      message: 'Declaración de IVA generada exitosamente',
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GENERAR LIBROS FISCALES
  // ───────────────────────────────────────────────────────────────────────────
  
  async generarLibros(period: string, userId: string) {
    const [month, year] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Generar Libro de Ventas
    const ventas = await this.prisma.sale.findMany({
      where: {
        status: 'INVOICED',
        date: { gte: startDate, lte: endDate },
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: { invoiceNumber: 'asc' },
    });

    const libroVentas = ventas.map((venta, index) => ({
      numero: index + 1,
      fecha: venta.date.toISOString().split('T')[0],
      rif: venta.customer.rif,
      nombre: venta.customer.businessName,
      numeroFactura: venta.invoiceNumber,
      numeroControl: venta.invoiceControl,
      baseImponible16: venta.items.filter(i => i.taxRate === 0.16).reduce((s, i) => s + i.subtotal, 0),
      iva16: venta.items.filter(i => i.taxRate === 0.16).reduce((s, i) => s + i.taxAmount, 0),
      baseImponible8: venta.items.filter(i => i.taxRate === 0.08).reduce((s, i) => s + i.subtotal, 0),
      iva8: venta.items.filter(i => i.taxRate === 0.08).reduce((s, i) => s + i.taxAmount, 0),
      exento: venta.items.filter(i => i.taxRate === 0).reduce((s, i) => s + i.subtotal, 0),
      total: venta.total,
    }));

    // Generar Libro de Compras
    const compras = await this.prisma.purchase.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      include: {
        supplier: true,
        items: true,
      },
      orderBy: { invoiceNumber: 'asc' },
    });

    const libroCompras = compras.map((compra, index) => ({
      numero: index + 1,
      fecha: compra.date.toISOString().split('T')[0],
      rif: compra.supplier.rif,
      nombre: compra.supplier.businessName,
      numeroFactura: compra.invoiceNumber,
      numeroControl: compra.controlNumber,
      baseImponible16: compra.items.filter(i => i.taxRate === 0.16).reduce((s, i) => s + i.subtotal, 0),
      iva16: compra.items.filter(i => i.taxRate === 0.16).reduce((s, i) => s + i.taxAmount, 0),
      baseImponible8: compra.items.filter(i => i.taxRate === 0.08).reduce((s, i) => s + i.subtotal, 0),
      iva8: compra.items.filter(i => i.taxRate === 0.08).reduce((s, i) => s + i.taxAmount, 0),
      exento: compra.items.filter(i => i.taxRate === 0).reduce((s, i) => s + i.subtotal, 0),
      total: compra.total,
    }));

    // Guardar libros
    const [libroVentasRecord, libroComprasRecord] = await this.prisma.$transaction([
      this.prisma.taxBook.upsert({
        where: { type_period: { type: 'LIBRO_VENTAS', period } },
        update: {
          entries: libroVentas,
          totalBase: libroVentas.reduce((s, v) => s + v.baseImponible16 + v.baseImponible8, 0),
          totalTax: libroVentas.reduce((s, v) => s + v.iva16 + v.iva8, 0),
          total: libroVentas.reduce((s, v) => s + v.total, 0),
          status: 'GENERATED',
          generatedAt: new Date(),
        },
        create: {
          type: 'LIBRO_VENTAS',
          period,
          entries: libroVentas,
          totalBase: libroVentas.reduce((s, v) => s + v.baseImponible16 + v.baseImponible8, 0),
          totalTax: libroVentas.reduce((s, v) => s + v.iva16 + v.iva8, 0),
          total: libroVentas.reduce((s, v) => s + v.total, 0),
          status: 'GENERATED',
          generatedAt: new Date(),
        },
      }),
      this.prisma.taxBook.upsert({
        where: { type_period: { type: 'LIBRO_COMPRAS', period } },
        update: {
          entries: libroCompras,
          totalBase: libroCompras.reduce((s, v) => s + v.baseImponible16 + v.baseImponible8, 0),
          totalTax: libroCompras.reduce((s, v) => s + v.iva16 + v.iva8, 0),
          total: libroCompras.reduce((s, v) => s + v.total, 0),
          status: 'GENERATED',
          generatedAt: new Date(),
        },
        create: {
          type: 'LIBRO_COMPRAS',
          period,
          entries: libroCompras,
          totalBase: libroCompras.reduce((s, v) => s + v.baseImponible16 + v.baseImponible8, 0),
          totalTax: libroCompras.reduce((s, v) => s + v.iva16 + v.iva8, 0),
          total: libroCompras.reduce((s, v) => s + v.total, 0),
          status: 'GENERATED',
          generatedAt: new Date(),
        },
      }),
    ]);

    return {
      libroVentas: libroVentasRecord,
      libroCompras: libroComprasRecord,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RETENER ISLR
  // ───────────────────────────────────────────────────────────────────────────
  
  async retenerISLR(dto: RetenerISLRDto, userId: string) {
    const number = await this.generateISLRNumber();

    // Obtener tasa de ISLR según tipo de ingreso
    const rate = this.getISLRRate(dto.concept, dto.entityType);
    const amount = dto.taxBase * rate;

    const withholding = await this.prisma.iSLRWithholding.create({
      data: {
        number,
        entityRif: dto.entityRif,
        entityName: dto.entityName,
        entityType: dto.entityType,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate: dto.invoiceDate,
        invoiceAmount: dto.invoiceAmount,
        taxBase: dto.taxBase,
        rate,
        amount,
        concept: dto.concept,
        subconcept: dto.subconcept,
        period: this.getCurrentPeriod(),
        status: 'PENDING',
      },
    });

    return withholding;
  }

  private getISLRRate(concept: string, entityType: string): number {
    // Tabla de tasas de ISLR según concepto y tipo de entidad
    const rates: Record<string, Record<string, number>> = {
      'HONORARIOS': {
        'NATURAL': 0.03,
        'JURIDICA': 0.05,
      },
      'SERVICIOS': {
        'NATURAL': 0.01,
        'JURIDICA': 0.02,
      },
      'ALQUILERES': {
        'NATURAL': 0.03,
        'JURIDICA': 0.05,
      },
      'COMISIONES': {
        'NATURAL': 0.03,
        'JURIDICA': 0.05,
      },
    };

    return rates[concept]?.[entityType] || 0.02; // 2% por defecto
  }

  private async generateISLRNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.iSLRWithholding.findFirst({
      where: { number: { startsWith: `ISLR-${year}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[2]) + 1 : 1;
    return `ISLR-${year}-${num.toString().padStart(6, '0')}`;
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async generateIVAForm(declaration: any): Promise<string> {
    // Generar PDF del formulario de IVA
    // Implementar según formato SENIAT
    return '';
  }

  async getResumenIVA(period: string) {
    const calculation = await this.calcularIVA(period);
    
    return {
      period,
      ...calculation,
      declaration: await this.prisma.iVADeclaration.findUnique({
        where: { period },
      }),
    };
  }

  async getRetencionesMes(period: string) {
    const [islr, iva] = await Promise.all([
      this.prisma.iSLRWithholding.findMany({
        where: { period },
        include: { journalEntry: true },
      }),
      this.prisma.iVAWithholding.findMany({
        where: { period },
      }),
    ]);

    return {
      period,
      islr: {
        count: islr.length,
        total: islr.reduce((sum, r) => sum + r.amount, 0),
        retentions: islr,
      },
      iva: {
        count: iva.length,
        total: iva.reduce((sum, r) => sum + r.amount, 0),
        retentions: iva,
      },
    };
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **IVA Mensual**: Declarar dentro de los primeros 15 días del mes siguiente
2. **Libros Fiscales**: Generar mensualmente para SENIAT
3. **Retenciones ISLR**: Aplicar según tabla de conceptos
4. **Retenciones IVA**: 75% para contribuyentes especiales
5. **Comprobantes**: Generar número consecutivo por tipo
6. **Año Fiscal**: Cerrar declaración anual de ISLR
7. **Auditoría**: Todos los cálculos deben estar trazables

---

## 📁 Archivos del Módulo

```
01-modulo-administrativo/
├── contabilidad.md
├── tesoreria.md
├── finanzas.md
├── presupuesto.md
├── activos-fijos.md
├── impuestos.md (este archivo)
└── rrhh/
    └── empleados.md
```

**Anterior**: `01-administrativo/activos-fijos.md` | **Siguiente**: `02-operativo/mantenimiento.md`
