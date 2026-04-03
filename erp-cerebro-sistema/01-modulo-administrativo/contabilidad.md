# Módulo 01: ADMINISTRATIVO - Contabilidad

## Descripción

Módulo de contabilidad completa para empresas venezolanas. Incluye plan de cuentas, asientos contables, libros legales, balances y estados financieros. Cumple con normas VEN-NIF y requisitos del SENIAT.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    MÓDULOS QUE ENVÍAN DATOS                     │
├─────────────────────────────────────────────────────────────────┤
│  03-comercial/ventas.md     → Asientos de venta (automático)   │
│  02-operativo/compras.md    → Asientos de compra (automático)  │
│  04-rrhh/nomina.md          → Asientos de nómina (automático)  │
│  02-operativo/inventario.md → Asientos de inventario           │
│  02-operativo/activos.md    → Asientos de depreciación         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  01-contabilidad    │
                    │  - Asientos         │
                    │  - Plan de Cuentas  │
                    │  - Libros           │
                    └──────────┬──────────┘
                               │
                               │ Envía datos consolidados
                               ▼
                    ┌─────────────────────┐
                    │  06-reportes        │
                    │  - Balance General  │
                    │  - Estado de Result.│
                    │  - Libros SENIAT    │
                    └─────────────────────┘
```

**Reglas de Conexión**:
1. Ventas, Compras, Nómina **CREAN** asientos automáticos en contabilidad
2. Contabilidad **NO** escribe directamente en otros módulos
3. Todos los asientos automáticos deben poder **reversarse** si se anula el documento origen
4. Reportes **SOLO LEE** de contabilidad (no escribe)

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CONTABILIDAD - PLAN DE CUENTAS
// ─────────────────────────────────────────────────────────────────────────────

model Account {
  id          String   @id @default(cuid())
  code        String   @unique // Código contable (ej. 1.01.01.0001)
  name        String
  type        AccountType // ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO
  level       Int      // Nivel jerárquico (1-10)
  parentId    String?
  parent      Account? @relation("AccountHierarchy", fields: [parentId], references: [id])
  children    Account[] @relation("AccountHierarchy")
  
  // Configuración
  isSystem    Boolean  @default(false) // Cuentas del sistema no editables
  isActive    Boolean  @default(true)
  allowMovements Boolean @default(true) // Si false, es cuenta titular
  
  // Saldos
  balanceDebit   Float @default(0)
  balanceCredit  Float @default(0)
  balanceCurrent Float @default(0) // Débito - Crédito
  
  // Relaciones con otros módulos
  journalEntries JournalEntryItem[]
  budgets        Budget[]              // 01-presupuesto
  bankAccounts   BankAccount[]         // 01-tesoreria
  
  // Auditoría
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([code])
  @@index([type])
  @@index([parentId])
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTABILIDAD - ASIENTOS CONTABLES
// ─────────────────────────────────────────────────────────────────────────────

model JournalEntry {
  id          String   @id @default(cuid())
  number      String   @unique // Número consecutivo (ej. AS-2024-000001)
  date        DateTime // Fecha del asiento
  description String
  reference   String?  // Número de factura, recibo, etc.
  
  // Estado
  status      JournalEntryStatus @default(DRAFT) // DRAFT, POSTED, VOIDED
  postedBy    String?
  postedAt    DateTime?
  voidedBy    String?
  voidedAt    DateTime?
  voidReason  String?
  
  // Validación
  totalDebit  Float
  totalCredit Float
  isBalanced  Boolean @default(true)
  
  // Módulo origen (para asientos automáticos)
  sourceModule String? // ventas, compras, rrhh, inventario, activos
  sourceId     String? // ID del documento origen (venta.id, compra.id, etc.)
  sourceDocument String? // Número del documento origen
  
  // Relaciones
  items       JournalEntryItem[]
  attachments Attachment[]
  
  // Auditoría
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([date])
  @@index([status])
  @@index([number])
  @@index([sourceModule, sourceId])
}

model JournalEntryItem {
  id             String   @id @default(cuid())
  journalEntryId String
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  accountId      String
  account        Account @relation(fields: [accountId], references: [id])
  
  // Montos
  debit          Float   @default(0)
  credit         Float   @default(0)
  description    String?
  
  // Centro de costo (opcional)
  costCenterId   String?
  costCenter     CostCenter? @relation(fields: [costCenterId], references: [id])
  
  // Auditoría
  createdAt DateTime @default(now())
  
  @@index([journalEntryId])
  @@index([accountId])
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTABILIDAD - PERÍODOS CONTABLES
// ─────────────────────────────────────────────────────────────────────────────

model AccountingPeriod {
  id        String   @id @default(cuid())
  year      Int
  month     Int      // 1-12
  status    PeriodStatus @default(OPEN) // OPEN, CLOSED, LOCKED
  closedBy  String?
  closedAt  DateTime?
  lockedBy  String?
  lockedAt  DateTime?
  
  @@unique([year, month])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTABILIDAD - IMPUESTOS (IVA, ISLR)
// ─────────────────────────────────────────────────────────────────────────────

model TaxDeclaration {
  id          String   @id @default(cuid())
  period      String   // MM-YYYY
  type        TaxType  // IVA_VENTAS, IVA_COMPRAS, ISLR
  totalDebit  Float
  totalCredit Float
  amount      Float    // Monto a pagar
  status      TaxStatus @default(DRAFT) // DRAFT, SUBMITTED, PAID
  fileUrl     String?  // URL del archivo en R2
  submittedAt DateTime?
  paidAt      DateTime?
  createdAt   DateTime @default(now())
  
  @@unique([period, type])
  @@index([status])
}

model WithholdingTax {
  id            String   @id @default(cuid())
  type          WithholdingType // ISLR, IVA
  entityRif     String
  entityName    String
  invoiceNumber String
  invoiceDate   DateTime
  invoiceAmount Float
  taxBase       Float
  rate          Float    // Porcentaje de retención
  amount        Float    // Monto retenido
  period        String   // MM-YYYY
  comprobante   String?  // Número de comprobante
  status        String   @default("PENDING")
  journalEntryId String?
  journalEntry  JournalEntry? @relation(fields: [journalEntryId], references: [id])
  createdAt     DateTime @default(now())
  
  @@index([period])
  @@index([type])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum AccountType {
  ACTIVO
  PASIVO
  PATRIMONIO
  INGRESO
  GASTO
}

enum JournalEntryStatus {
  DRAFT
  POSTED
  VOIDED
}

enum PeriodStatus {
  OPEN
  CLOSED
  LOCKED
}

enum TaxType {
  IVA_VENTAS
  IVA_COMPRAS
  ISLR
}

enum TaxStatus {
  DRAFT
  SUBMITTED
  PAID
}

enum WithholdingType {
  ISLR_HONORARIOS
  ISLR_SERVICIOS
  ISLR_ALQUILERES
  IVA_RETENCION
}
```

---

## 📡 Endpoints de la API

### Controller de Contabilidad

```typescript
// apps/backend/src/modules/contabilidad/contabilidad.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ContabilidadService } from './contabilidad.service';

@Controller('contabilidad')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContabilidadController {
  constructor(private contabilidadService: ContabilidadService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // PLAN DE CUENTAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('accounts')
  @RequirePermissions('contabilidad:read')
  async getAccounts(@Query('type') type?: AccountType) {
    return this.contabilidadService.getAccounts(type);
  }

  @Post('accounts')
  @RequirePermissions('contabilidad:create')
  async createAccount(@Body() dto: CreateAccountDto) {
    return this.contabilidadService.createAccount(dto);
  }

  @Put('accounts/:id')
  @RequirePermissions('contabilidad:update')
  async updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.contabilidadService.updateAccount(id, dto);
  }

  @Delete('accounts/:id')
  @RequirePermissions('contabilidad:delete')
  async deleteAccount(@Param('id') id: string) {
    return this.contabilidadService.deleteAccount(id);
  }

  @Get('accounts/tree')
  @RequirePermissions('contabilidad:read')
  async getAccountTree() {
    return this.contabilidadService.getAccountTree();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ASIENTOS CONTABLES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('journal-entries')
  @RequirePermissions('contabilidad:read')
  async getJournalEntries(@Query() query: JournalEntryQueryDto) {
    return this.contabilidadService.getJournalEntries(query);
  }

  @Get('journal-entries/:id')
  @RequirePermissions('contabilidad:read')
  async getJournalEntry(@Param('id') id: string) {
    return this.contabilidadService.getJournalEntry(id);
  }

  @Post('journal-entries')
  @RequirePermissions('contabilidad:create')
  async createJournalEntry(@Body() dto: CreateJournalEntryDto) {
    return this.contabilidadService.createJournalEntry(dto);
  }

  @Put('journal-entries/:id')
  @RequirePermissions('contabilidad:update')
  async updateJournalEntry(@Param('id') id: string, @Body() dto: UpdateJournalEntryDto) {
    return this.contabilidadService.updateJournalEntry(id, dto);
  }

  @Delete('journal-entries/:id')
  @RequirePermissions('contabilidad:delete')
  async deleteJournalEntry(@Param('id') id: string) {
    return this.contabilidadService.deleteJournalEntry(id);
  }

  @Post('journal-entries/:id/post')
  @RequirePermissions('contabilidad:post')
  async postJournalEntry(@Param('id') id: string) {
    return this.contabilidadService.postJournalEntry(id);
  }

  @Post('journal-entries/:id/void')
  @RequirePermissions('contabilidad:delete')
  async voidJournalEntry(
    @Param('id') id: string,
    @Body() dto: VoidJournalEntryDto,
  ) {
    return this.contabilidadService.voidJournalEntry(id, dto.reason);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LIBROS CONTABLES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('libro-diario')
  @RequirePermissions('contabilidad:export')
  async getLibroDiario(@Query('from') from: string, @Query('to') to: string) {
    return this.contabilidadService.getLibroDiario(new Date(from), new Date(to));
  }

  @Get('libro-mayor')
  @RequirePermissions('contabilidad:export')
  async getLibroMayor(
    @Query('accountId') accountId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.contabilidadService.getLibroMayor(
      accountId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('balance-comprobacion')
  @RequirePermissions('contabilidad:export')
  async getTrialBalance(@Query('from') from: string, @Query('to') to: string) {
    return this.contabilidadService.getTrialBalance(new Date(from), new Date(to));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ESTADOS FINANCIEROS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('balance-general')
  @RequirePermissions('finanzas:read')
  async getBalanceSheet(@Query('date') date: string) {
    return this.contabilidadService.getBalanceSheet(new Date(date));
  }

  @Get('estado-resultados')
  @RequirePermissions('finanzas:read')
  async getIncomeStatement(@Query('from') from: string, @Query('to') to: string) {
    return this.contabilidadService.getIncomeStatement(new Date(from), new Date(to));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LIBROS IVA (SENIAT)
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('libro-ventas-iva')
  @RequirePermissions('impuestos:read')
  async getLibroVentasIVA(@Query('period') period: string) {
    return this.contabilidadService.getLibroVentasIVA(period);
  }

  @Get('libro-compras-iva')
  @RequirePermissions('impuestos:read')
  async getLibroComprasIVA(@Query('period') period: string) {
    return this.contabilidadService.getLibroComprasIVA(period);
  }

  @Post('libro-ventas-iva/export')
  @RequirePermissions('impuestos:export')
  async exportLibroVentasIVA(@Query('period') period: string) {
    return this.contabilidadService.exportLibroVentasIVA(period);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CIERRE CONTABLE
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('cierre-mensual/:year/:month')
  @RequirePermissions('contabilidad:approve')
  async monthlyClose(
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.contabilidadService.monthlyClose(year, month);
  }

  @Post('cierre-anual/:year')
  @RequirePermissions('contabilidad:approve')
  async annualClose(@Param('year') year: number) {
    return this.contabilidadService.annualClose(year);
  }
}
```

---

## 🧩 Servicio de Contabilidad

### Funciones Principales

```typescript
// apps/backend/src/modules/contabilidad/contabilidad.service.ts

@Injectable()
export class ContabilidadService {
  constructor(
    private prisma: PrismaService,
    private config: SystemConfigService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR ASIENTO CONTABLE (Valida partida doble)
  // ───────────────────────────────────────────────────────────────────────────
  
  async createJournalEntry(dto: CreateJournalEntryDto) {
    // 1. Validar que el período esté abierto
    const period = await this.getPeriod(dto.date);
    if (period.status !== 'OPEN') {
      throw new BadRequestException(
        `El período ${period.month}/${period.year} está ${period.status}`
      );
    }

    // 2. Calcular totales
    const totalDebit = dto.items.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = dto.items.reduce((sum, item) => sum + item.credit, 0);

    // 3. Validar partida doble (débitos = créditos)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `El asiento no cuadra. Débitos: ${totalDebit}, Créditos: ${totalCredit}`
      );
    }

    // 4. Obtener número consecutivo
    const number = await this.getNextJournalEntryNumber();

    // 5. Crear asiento con transacción
    const journalEntry = await this.prisma.$transaction(async (tx) => {
      // Crear asiento
      const entry = await tx.journalEntry.create({
        data: {
          number,
          date: dto.date,
          description: dto.description,
          reference: dto.reference,
          totalDebit,
          totalCredit,
          isBalanced: true,
          sourceModule: dto.sourceModule,
          sourceId: dto.sourceId,
          sourceDocument: dto.sourceDocument,
          createdBy: dto.createdBy,
          items: {
            create: dto.items.map(item => ({
              accountId: item.accountId,
              debit: item.debit,
              credit: item.credit,
              description: item.description,
              costCenterId: item.costCenterId,
            })),
          },
        },
        include: { items: { include: { account: true } } },
      });

      // Actualizar saldos de cuentas (solo para cuentas de balance)
      for (const item of entry.items) {
        const account = await tx.account.findUnique({
          where: { id: item.accountId },
        });

        if (account && ['ACTIVO', 'PASIVO', 'PATRIMONIO'].includes(account.type)) {
          await tx.account.update({
            where: { id: item.accountId },
            data: {
              balanceDebit: { increment: item.debit },
              balanceCredit: { increment: item.credit },
              balanceCurrent: { increment: item.debit - item.credit },
            },
          });
        }
      }

      return entry;
    });

    // 6. Registrar auditoría
    await this.prisma.auditLog.create({
      data: {
        userId: dto.createdBy,
        action: 'CREATE',
        module: 'contabilidad',
        entityType: 'JournalEntry',
        entityId: journalEntry.id,
        after: journalEntry,
      },
    });

    return journalEntry;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // POSTEAR ASIENTO (Lo hace ineditable)
  // ───────────────────────────────────────────────────────────────────────────
  
  async postJournalEntry(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!entry) {
      throw new NotFoundException('Asiento no encontrado');
    }

    if (entry.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden postear asientos en borrador');
    }

    // Validar que el período esté abierto
    const period = await this.getPeriod(entry.date);
    if (period.status !== 'OPEN') {
      throw new BadRequestException(
        `El período ${period.month}/${period.year} está ${period.status}`
      );
    }

    const posted = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'POSTED',
        postedBy: entry.createdBy, // En producción usar user.id del request
        postedAt: new Date(),
      },
    });

    // Registrar auditoría
    await this.prisma.auditLog.create({
      data: {
        userId: entry.createdBy,
        action: 'POST',
        module: 'contabilidad',
        entityType: 'JournalEntry',
        entityId: id,
      },
    });

    return posted;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ANULAR ASIENTO (Crea asiento de reverso)
  // ───────────────────────────────────────────────────────────────────────────
  
  async voidJournalEntry(id: string, reason: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!entry) {
      throw new NotFoundException('Asiento no encontrado');
    }

    if (entry.status === 'VOIDED') {
      throw new BadRequestException('El asiento ya está anulado');
    }

    // Crear asiento de reverso con fecha actual
    const reverseNumber = await this.getNextJournalEntryNumber();
    const reversedEntry = await this.prisma.journalEntry.create({
      data: {
        number: reverseNumber,
        date: new Date(),
        description: `Reverso de asiento ${entry.number} - ${reason}`,
        reference: entry.number,
        totalDebit: entry.totalCredit, // Invertir
        totalCredit: entry.totalDebit, // Invertir
        isBalanced: true,
        sourceModule: 'contabilidad',
        sourceId: id,
        sourceDocument: entry.sourceDocument,
        createdBy: entry.createdBy,
        items: {
          create: entry.items.map(item => ({
            accountId: item.accountId,
            debit: item.credit, // Invertir débito/crédito
            credit: item.debit, // Invertir crédito/débito
            description: item.description,
          })),
        },
      },
    });

    // Marcar asiento original como anulado
    await this.prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'VOIDED',
        voidedBy: entry.createdBy,
        voidedAt: new Date(),
        voidReason: reason,
      },
    });

    // Registrar auditoría
    await this.prisma.auditLog.create({
      data: {
        userId: entry.createdBy,
        action: 'VOID',
        module: 'contabilidad',
        entityType: 'JournalEntry',
        entityId: id,
        after: { reversedEntryId: reversedEntry.id, reason },
      },
    });

    return { original: entry, reversed: reversedEntry };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // OBTENER LIBRO DIARIO
  // ───────────────────────────────────────────────────────────────────────────
  
  async getLibroDiario(from: Date, to: Date) {
    const entries = await this.prisma.journalEntry.findMany({
      where: {
        date: { gte: from, lte: to },
        status: 'POSTED',
      },
      include: {
        items: {
          include: {
            account: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return entries.map(entry => ({
      ...entry,
      items: entry.items.map(item => ({
        ...item,
        balanceDebit: item.account.balanceDebit,
        balanceCredit: item.account.balanceCredit,
      })),
    }));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // OBTENER BALANCE DE COMPROBACIÓN
  // ───────────────────────────────────────────────────────────────────────────
  
  async getTrialBalance(from: Date, to: Date) {
    const accounts = await this.prisma.account.findMany({
      where: { isActive: true },
      include: {
        parent: true,
      },
    });

    const balances = await Promise.all(
      accounts.map(async account => {
        const movements = await this.prisma.journalEntryItem.findMany({
          where: {
            accountId: account.id,
            journalEntry: {
              date: { gte: from, lte: to },
              status: 'POSTED',
            },
          },
          _sum: {
            debit: true,
            credit: true,
          },
        });

        const debitTotal = movements._sum.debit || 0;
        const creditTotal = movements._sum.credit || 0;
        const balance = debitTotal - creditTotal;

        return {
          ...account,
          debitTotal,
          creditTotal,
          balance,
          balanceType: balance >= 0 ? 'DEUDORA' : 'ACREEDORA',
        };
      })
    );

    const totalDebit = balances.reduce((sum, b) => sum + b.debitTotal, 0);
    const totalCredit = balances.reduce((sum, b) => sum + b.creditTotal, 0);

    return {
      accounts: balances,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      period: { from, to },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // OBTENER LIBRO DE VENTAS IVA (SENIAT)
  // ───────────────────────────────────────────────────────────────────────────
  
  async getLibroVentasIVA(period: string) {
    const [month, year] = period.split('-').map(Number);
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);

    // Obtener todas las ventas facturadas del período
    const sales = await this.prisma.sale.findMany({
      where: {
        status: 'INVOICED',
        date: { gte: from, lte: to },
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: { invoiceNumber: 'asc' },
    });

    // Procesar cada venta
    return sales.map(sale => {
      const baseImponible16 = sale.items
        .filter(i => i.taxRate === 0.16)
        .reduce((sum, i) => sum + i.subtotal, 0);

      const iva16 = baseImponible16 * 0.16;

      const baseImponible8 = sale.items
        .filter(i => i.taxRate === 0.08)
        .reduce((sum, i) => sum + i.subtotal, 0);

      const iva8 = baseImponible8 * 0.08;

      const exempt = sale.items
        .filter(i => i.taxRate === 0)
        .reduce((sum, i) => sum + i.subtotal, 0);

      return {
        numero: sale.invoiceNumber,
        numeroControl: sale.invoiceControl,
        fecha: sale.date,
        rif: sale.customer.rif,
        nombreCliente: sale.customer.businessName,
        baseImponible16: baseImponible16.toFixed(2),
        iva16: iva16.toFixed(2),
        baseImponible8: baseImponible8.toFixed(2),
        iva8: iva8.toFixed(2),
        exento: exempt.toFixed(2),
        total: sale.total.toFixed(2),
      };
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CIERRE MENSUAL
  // ───────────────────────────────────────────────────────────────────────────
  
  async monthlyClose(year: number, month: number) {
    // 1. Verificar que todos los asientos del mes estén posteados
    const pendingEntries = await this.prisma.journalEntry.count({
      where: {
        date: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
        status: 'DRAFT',
      },
    });

    if (pendingEntries > 0) {
      throw new BadRequestException(
        `Hay ${pendingEntries} asientos en borrador. Postear antes de cerrar.`
      );
    }

    // 2. Generar provisiones (vacaciones, utilidades, etc.)
    const provisions = await this.generateMonthlyProvisions(year, month);

    // 3. Generar depreciación del mes
    const depreciation = await this.generateMonthlyDepreciation(year, month);

    // 4. Cerrar período
    const period = await this.prisma.accountingPeriod.upsert({
      where: {
        year_month: { year, month },
      },
      update: {
        status: 'CLOSED',
        closedBy: 'system', // En producción usar user.id
        closedAt: new Date(),
      },
      create: {
        year,
        month,
        status: 'CLOSED',
        closedBy: 'system',
        closedAt: new Date(),
      },
    });

    return {
      period,
      provisions,
      depreciation,
      message: `Cierre mensual ${month}/${year} completado exitosamente`,
    };
  }

  private async generateMonthlyProvisions(year: number, month: number) {
    // Implementar cálculo de provisiones mensuales
    // - Vacaciones
    // - Utilidades
    // - Intereses sobre prestaciones
    return { created: true };
  }

  private async generateMonthlyDepreciation(year: number, month: number) {
    // Llamar al servicio de activos fijos
    // return this.fixedAssetsService.runMonthlyDepreciation(`${month}-${year}`);
    return { created: true };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async getPeriod(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    let period = await this.prisma.accountingPeriod.findUnique({
      where: { year_month: { year, month } },
    });

    if (!period) {
      period = await this.prisma.accountingPeriod.create({
        data: { year, month, status: 'OPEN' },
      });
    }

    return period;
  }

  private async getNextJournalEntryNumber() {
    const year = new Date().getFullYear();
    const lastEntry = await this.prisma.journalEntry.findFirst({
      where: { number: { startsWith: `AS-${year}-` } },
      orderBy: { number: 'desc' },
    });

    let nextNumber = 1;
    if (lastEntry) {
      const lastNum = parseInt(lastEntry.number.split('-')[2]);
      nextNumber = lastNum + 1;
    }

    return `AS-${year}-${nextNumber.toString().padStart(6, '0')}`;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ASIENTOS AUTOMÁTICOS (Desde otros módulos)
  // ───────────────────────────────────────────────────────────────────────────
  
  /**
   * Crea asiento automático desde Ventas
   * Este método es llamado por 03-comercial/ventas.md
   */
  async createEntryFromVenta(ventaData: {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    customerRif: string;
    subtotal: number;
    tax: number;
    total: number;
    date: Date;
    createdBy: string;
  }) {
    // Obtener cuentas de configuración
    const accountsReceivable = await this.config.get('accounting.accounts_receivable');
    const accountsSales = await this.config.get('accounting.sales_revenue');
    const accountsIvaPayable = await this.config.get('accounting.iva_payable');

    return this.createJournalEntry({
      date: ventaData.date,
      description: `Venta ${ventaData.invoiceNumber} - ${ventaData.customerName}`,
      reference: ventaData.invoiceNumber,
      sourceModule: 'ventas',
      sourceId: ventaData.id,
      sourceDocument: ventaData.invoiceNumber,
      createdBy: ventaData.createdBy,
      items: [
        {
          accountId: accountsReceivable,
          debit: ventaData.total,
          credit: 0,
          description: `Cliente: ${ventaData.customerName}`,
        },
        {
          accountId: accountsSales,
          debit: 0,
          credit: ventaData.subtotal,
          description: 'Ingreso por venta',
        },
        {
          accountId: accountsIvaPayable,
          debit: 0,
          credit: ventaData.tax,
          description: 'IVA por pagar',
        },
      ],
    });
  }

  /**
   * Crea asiento automático desde Compras
   * Este método es llamado por 02-operativo/compras.md
   */
  async createEntryFromCompra(compraData: {
    id: string;
    invoiceNumber: string;
    supplierName: string;
    supplierRif: string;
    subtotal: number;
    tax: number;
    total: number;
    date: Date;
    createdBy: string;
  }) {
    const accountsPayable = await this.config.get('accounting.accounts_payable');
    const accountsPurchases = await this.config.get('accounting.purchases');
    const accountsIvaCredit = await this.config.get('accounting.iva_credit');

    return this.createJournalEntry({
      date: compraData.date,
      description: `Compra ${compraData.invoiceNumber} - ${compraData.supplierName}`,
      reference: compraData.invoiceNumber,
      sourceModule: 'compras',
      sourceId: compraData.id,
      sourceDocument: compraData.invoiceNumber,
      createdBy: compraData.createdBy,
      items: [
        {
          accountId: accountsPurchases,
          debit: compraData.subtotal,
          credit: 0,
          description: 'Compra de mercancía',
        },
        {
          accountId: accountsIvaCredit,
          debit: compraData.tax,
          credit: 0,
          description: 'IVA crédito fiscal',
        },
        {
          accountId: accountsPayable,
          debit: 0,
          credit: compraData.total,
          description: `Proveedor: ${compraData.supplierName}`,
        },
      ],
    });
  }

  /**
   * Crea asiento automático desde Nómina
   * Este método es llamado por 04-rrhh/nomina.md
   */
  async createEntryFromNomina(nominaData: {
    id: string;
    periodStart: Date;
    periodEnd: Date;
    totalSalaries: number;
    totalIvss: number;
    totalFaov: number;
    totalInce: number;
    totalNeto: number;
    createdBy: string;
  }) {
    const accountsSalaryExpense = await this.config.get('accounting.salary_expense');
    const accountsIvssPayable = await this.config.get('accounting.ivss_payable');
    const accountsFaovPayable = await this.config.get('accounting.faov_payable');
    const accountsIncePayable = await this.config.get('accounting.ince_payable');
    const accountsSalariesPayable = await this.config.get('accounting.salaries_payable');

    return this.createJournalEntry({
      date: nominaData.periodEnd,
      description: `Nómina ${nominaData.periodStart.toLocaleDateString()} - ${nominaData.periodEnd.toLocaleDateString()}`,
      reference: nominaData.id,
      sourceModule: 'rrhh',
      sourceId: nominaData.id,
      createdBy: nominaData.createdBy,
      items: [
        {
          accountId: accountsSalaryExpense,
          debit: nominaData.totalSalaries,
          credit: 0,
          description: 'Gasto de salarios',
        },
        {
          accountId: accountsIvssPayable,
          debit: 0,
          credit: nominaData.totalIvss,
          description: 'IVSS por pagar',
        },
        {
          accountId: accountsFaovPayable,
          debit: 0,
          credit: nominaData.totalFaov,
          description: 'FAOV por pagar',
        },
        {
          accountId: accountsIncePayable,
          debit: 0,
          credit: nominaData.totalInce,
          description: 'INCE por pagar',
        },
        {
          accountId: accountsSalariesPayable,
          debit: 0,
          credit: nominaData.totalNeto,
          description: 'Salarios netos por pagar',
        },
      ],
    });
  }
}
```

---

## 🎯 DTOs (Data Transfer Objects)

```typescript
// apps/backend/src/modules/contabilidad/dto/create-account.dto.ts

export class CreateAccountDto {
  @IsString()
  @MinLength(3)
  code: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsInt()
  @Min(1)
  @Max(10)
  level: number;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMovements?: boolean;
}

// apps/backend/src/modules/contabilidad/dto/create-journal-entry.dto.ts

export class CreateJournalEntryItemDto {
  @IsString()
  accountId: string;

  @IsNumber()
  @Min(0)
  debit: number;

  @IsNumber()
  @Min(0)
  credit: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  costCenterId?: string;
}

export class CreateJournalEntryDto {
  @IsDate()
  date: Date;

  @IsString()
  @MinLength(5)
  description: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateJournalEntryItemDto)
  items: CreateJournalEntryItemDto[];

  @IsOptional()
  @IsString()
  sourceModule?: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  sourceDocument?: string;

  @IsString()
  createdBy: string;
}

export class VoidJournalEntryDto {
  @IsString()
  @MinLength(10)
  reason: string;
}
```

---

## 📊 Dashboard de Contabilidad

### KPIs Principales

```typescript
// apps/frontend/app/(dashboard)/administrativo/contabilidad/page.tsx

export async function getContabilidadDashboard() {
  const [
    trialBalance,
    journalEntriesCount,
    pendingEntries,
    accountsReceivable,
    accountsPayable,
  ] = await Promise.all([
    api.get('/contabilidad/balance-comprobacion?from=2024-01-01&to=2024-12-31'),
    api.get('/contabilidad/journal-entries/count?year=2024'),
    api.get('/contabilidad/journal-entries?status=DRAFT'),
    api.get('/contabilidad/cuentas-por-cobrar'),
    api.get('/contabilidad/cuentas-por-pagar'),
  ]);

  return {
    totalActivos: trialBalance.data.accounts
      .filter((a: any) => a.type === 'ACTIVO')
      .reduce((sum: number, a: any) => sum + Math.abs(a.balance), 0),
    
    totalPasivos: trialBalance.data.accounts
      .filter((a: any) => a.type === 'PASIVO')
      .reduce((sum: number, a: any) => sum + Math.abs(a.balance), 0),
    
    utilidadEjercicio: trialBalance.data.accounts
      .filter((a: any) => a.type === 'INGRESO' || a.type === 'GASTO')
      .reduce((sum: number, a: any) => {
        return a.type === 'INGRESO' 
          ? sum + a.balance 
          : sum - a.balance;
      }, 0),
    
    asientosMes: journalEntriesCount.data.count,
    asientosPendientes: pendingEntries.data.length,
    
    cuentasPorCobrar: accountsReceivable.data.total,
    cuentasPorPagar: accountsPayable.data.total,
  };
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Partida Doble**: TODO asiento debe tener débitos = créditos (diferencia máxima 0.01)
2. **Períodos Cerrados**: NO se puede crear/editar asientos en períodos cerrados
3. **Asientos Posteados**: NO se pueden editar, solo anular con asiento de reverso
4. **Cuentas Titulares**: Las cuentas con `allowMovements=false` NO reciben movimientos directos
5. **Consecutividad**: Los números de asiento deben ser consecutivos por año
6. **Auditoría**: TODA creación/edición/anulación de asientos se registra en audit_log

---

## 🔗 Conexiones Detalladas

### Desde Ventas (03-comercial/ventas.md)

```typescript
// Cuando se factura una venta:
await this.contabilidadService.createEntryFromVenta({
  id: sale.id,
  invoiceNumber: sale.invoiceNumber,
  customerId: sale.customerId,
  customerName: sale.customer.businessName,
  customerRif: sale.customer.rif,
  subtotal: sale.subtotal,
  tax: sale.tax,
  total: sale.total,
  date: sale.date,
  createdBy: userId,
});

// Asiento generado:
// Débito: Cuentas por Cobrar (total)
// Crédito: Ingresos por Venta (subtotal)
// Crédito: IVA por Pagar (tax)
```

### Desde Compras (02-operativo/compras.md)

```typescript
// Cuando se recibe una compra:
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

### Desde Nómina (04-rrhh/nomina.md)

```typescript
// Cuando se procesa la nómina:
await this.contabilidadService.createEntryFromNomina({
  id: payroll.id,
  periodStart: payroll.periodStart,
  periodEnd: payroll.periodEnd,
  totalSalaries: payroll.totalSalaries,
  totalIvss: payroll.totalIvss,
  totalFaov: payroll.totalFaov,
  totalInce: payroll.totalInce,
  totalNeto: payroll.totalNeto,
  createdBy: userId,
});

// Asiento generado:
// Débito: Gasto de Salarios (totalSalaries)
// Crédito: IVSS por Pagar (totalIvss)
// Crédito: FAOV por Pagar (totalFaov)
// Crédito: INCE por Pagar (totalInce)
// Crédito: Salarios Netos por Pagar (totalNeto)
```

---

## 📁 Archivos del Módulo

```
01-modulo-administrativo/
├── contabilidad.md (este archivo)
├── finanzas.md
├── tesoreria.md
├── presupuesto.md
├── activos-fijos.md
└── impuestos.md
```

**Anterior**: `00-shared/rbac.md` | **Siguiente**: `finanzas.md`
