# Módulo 01: ADMINISTRATIVO - Tesorería y Bancos

## Descripción

Módulo de gestión de tesorería que incluye cuentas bancarias, conciliación bancaria, flujo de caja, pagos y cobros. Integración automática con contabilidad.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  00-shared/auth.md          → Permisos de tesorería            │
│  00-shared/rbac.md          → Roles TESORERIA, ADMIN           │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad.md → Asientos bancarios        │
│  01-administrativo/finanzas.md       → Proyecciones            │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/compras.md    → Pagos a proveedores              │
├─────────────────────────────────────────────────────────────────┤
│  03-comercial/ventas.md     → Cobros de clientes               │
├─────────────────────────────────────────────────────────────────┤
│  05-configuracion/sistema.md → Parámetros bancarios            │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Pagos a proveedores **DEBITAN** cuenta bancaria
2. Cobros de clientes **ACREDITAN** cuenta bancaria
3. Conciliación **COMPARA** extracto bancario vs movimientos
4. Flujo de caja **PROYECTA** saldos futuros

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CUENTAS BANCARIAS
// ─────────────────────────────────────────────────────────────────────────────

model BankAccount {
  id              String   @id @default(cuid())
  bankName        String   // Nombre del banco
  accountNumber   String   @unique // Número de cuenta
  accountType     String   // CORRIENTE, AHORRO, MONEDA_EXTRANJERA
  currency        String   @default("VES") // VES, USD, EUR
  
  // Saldo
  balance         Float    @default(0)
  availableBalance Float   @default(0) // Saldo disponible
  
  // Configuración contable
  accountingCode  String?  // Cuenta contable asociada
  
  // Datos del banco
  bankCode        String?  // Código bancario
  agencyCode      String?  // Código de agencia
  agencyName      String?  // Nombre de agencia
  
  // Titular
  accountHolder   String   // Titular de la cuenta
  holderDocument  String?  // Documento del titular
  
  // Estado
  isActive        Boolean  @default(true)
  isMain          Boolean  @default(false) // Cuenta principal
  
  // Conciliación
  lastReconciliation DateTime?
  lastReconciliationBalance Float?
  
  // Relaciones
  transactions    BankTransaction[]
  reconciliations BankReconciliation[]
  payments        APPayment[]
  receipts        ARPayment[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([bankName])
  @@index([accountNumber])
  @@index([isActive])
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACCIONES BANCARIAS
// ─────────────────────────────────────────────────────────────────────────────

model BankTransaction {
  id              String   @id @default(cuid())
  bankAccountId   String
  bankAccount     BankAccount @relation(fields: [bankAccountId], references: [id])
  
  // Datos de la transacción
  date            DateTime
  description     String
  amount          Float    // Positivo = ingreso, Negativo = egreso
  type            TransactionType // DEPOSITO, RETIRO, TRANSFERENCIA, CHEQUE, NOTA_DEBITO, NOTA_CREDITO
  
  // Referencia
  reference       String?  // Número de referencia
  checkNumber     String?  // Número de cheque
  documentNumber  String?  // Número de documento
  
  // Conciliación
  reconciled      Boolean  @default(false)
  reconciledAt    DateTime?
  reconciledBy    String?
  
  // Extracto bancario
  bankStatementRef String? // Referencia en extracto bancario
  bankDate        DateTime? // Fecha de procesamiento del banco
  
  // Contabilidad
  journalEntryId  String?
  journalEntry    JournalEntry? @relation(fields: [journalEntryId], references: [id])
  
  // Categorización
  categoryId      String?
  category        BankTransactionCategory? @relation(fields: [categoryId], references: [id])
  
  // Notas
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([bankAccountId])
  @@index([date])
  @@index([reconciled])
  @@index([type])
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORÍAS DE TRANSACCIONES
// ─────────────────────────────────────────────────────────────────────────────

model BankTransactionCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  type        String   // INGRESO, EGRESO
  color       String?
  icon        String?
  transactions BankTransaction[]
  createdAt   DateTime @default(now())

  @@index([name])
}

// ─────────────────────────────────────────────────────────────────────────────
// CONCILIACIÓN BANCARIA
// ─────────────────────────────────────────────────────────────────────────────

model BankReconciliation {
  id              String   @id @default(cuid())
  bankAccountId   String
  bankAccount     BankAccount @relation(fields: [bankAccountId], references: [id])
  
  // Período
  period          String   // MM-YYYY
  startDate       DateTime
  endDate         DateTime
  
  // Saldos
  openingBalance  Float    // Saldo inicial
  closingBalance  Float    // Saldo final según banco
  systemBalance   Float    // Saldo según sistema
  
  // Movimientos
  deposits        Float    @default(0) // Total depósitos
  withdrawals     Float    @default(0) // Total retiros
  
  // Diferencias
  difference      Float    // Diferencia entre banco y sistema
  reconciledItems Int      @default(0)
  pendingItems    Int      @default(0)
  
  // Estado
  status          String   @default("DRAFT") // DRAFT, IN_PROGRESS, CLOSED
  
  // Archivo de extracto
  statementFile   String?  // URL del extracto en R2
  
  // Auditoría
  preparedBy      String?
  reviewedBy      String?
  approvedBy      String?
  reconciledAt    DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([bankAccountId])
  @@index([period])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFERENCIAS ENTRE CUENTAS
// ─────────────────────────────────────────────────────────────────────────────

model BankTransfer {
  id              String   @id @default(cuid())
  number          String   @unique // ej. T-2024-000001
  
  // Cuentas
  fromAccountId   String
  fromAccount     BankAccount @relation("TransferFrom", fields: [fromAccountId], references: [id])
  toAccountId     String
  toAccount       BankAccount @relation("TransferTo", fields: [toAccountId], references: [id])
  
  // Monto
  amount          Float
  exchangeRate    Float?   // Si es entre diferentes monedas
  
  // Fechas
  requestedDate   DateTime
  processedDate   DateTime?
  
  // Estado
  status          String   @default("PENDING") // PENDING, PROCESSED, CANCELLED
  
  // Referencia
  reference       String?
  notes           String?
  
  // Auditoría
  requestedBy     String
  processedBy     String?
  approvedBy      String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([fromAccountId])
  @@index([toAccountId])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// FLUJO DE CAJA (Proyecciones)
// ─────────────────────────────────────────────────────────────────────────────

model CashFlowProjection {
  id          String   @id @default(cuid())
  date        DateTime
  category    String   // COBROS_CLIENTES, PAGOS_PROVEEDORES, NOMINA, IMPUESTOS, OTROS
  
  description String
  expected    Float    // Monto esperado
  actual      Float?   // Monto real (se actualiza después)
  variance    Float?   // Varianza (expected - actual)
  
  type        String   // INGRESO, EGRESO
  
  // Estado
  status      String   @default("PROJECTED") // PROJECTED, REALIZED
  
  // Referencia
  entityId    String?  // ID de la entidad relacionada (venta.id, compra.id, etc.)
  entityType  String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([date])
  @@index([category])
  @@index([type])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum TransactionType {
  DEPOSITO
  RETIRO
  TRANSFERENCIA
  CHEQUE
  NOTA_DEBITO
  NOTA_CREDITO
  INTERES
  COMISION
}
```

---

## 📡 Endpoints de la API

### Controller de Tesorería

```typescript
// apps/backend/src/modules/tesoreria/tesoreria.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TesoreriaService } from './tesoreria.service';

@Controller('tesoreria')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TesoreriaController {
  constructor(private tesoreriaService: TesoreriaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CUENTAS BANCARIAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('cuentas')
  @RequirePermissions('tesoreria:read')
  async getCuentas(@Query('isActive') isActive?: boolean) {
    return this.tesoreriaService.getCuentas(isActive);
  }

  @Get('cuentas/:id')
  @RequirePermissions('tesoreria:read')
  async getCuenta(@Param('id') id: string) {
    return this.tesoreriaService.getCuenta(id);
  }

  @Post('cuentas')
  @RequirePermissions('tesoreria:create')
  async createCuenta(@Body() dto: CreateCuentaDto, @User() user: any) {
    return this.tesoreriaService.createCuenta(dto, user.id);
  }

  @Put('cuentas/:id')
  @RequirePermissions('tesoreria:update')
  async updateCuenta(
    @Param('id') id: string,
    @Body() dto: UpdateCuentaDto,
    @User() user: any,
  ) {
    return this.tesoreriaService.updateCuenta(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSACCIONES BANCARIAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('transacciones')
  @RequirePermissions('tesoreria:read')
  async getTransacciones(
    @Query('bankAccountId') bankAccountId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.tesoreriaService.getTransacciones(bankAccountId, from, to);
  }

  @Post('transacciones')
  @RequirePermissions('tesoreria:create')
  async createTransaccion(@Body() dto: CreateTransaccionDto, @User() user: any) {
    return this.tesoreriaService.createTransaccion(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONCILIACIÓN BANCARIA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('conciliaciones')
  @RequirePermissions('tesoreria:read')
  async getConciliaciones(@Query('bankAccountId') bankAccountId?: string) {
    return this.tesoreriaService.getConciliaciones(bankAccountId);
  }

  @Post('conciliaciones')
  @RequirePermissions('tesoreria:create')
  async createConciliacion(@Body() dto: CreateConciliacionDto, @User() user: any) {
    return this.tesoreriaService.createConciliacion(dto, user.id);
  }

  @Post('conciliaciones/:id/reconciliar')
  @RequirePermissions('tesoreria:update')
  async reconciliarTransaccion(
    @Param('id') id: string,
    @Body() dto: ReconciliarDto,
    @User() user: any,
  ) {
    return this.tesoreriaService.reconciliarTransaccion(id, dto, user.id);
  }

  @Post('conciliaciones/:id/cerrar')
  @RequirePermissions('tesoreria:update')
  async cerrarConciliacion(@Param('id') id: string, @User() user: any) {
    return this.tesoreriaService.cerrarConciliacion(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSFERENCIAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('transferencias')
  @RequirePermissions('tesoreria:read')
  async getTransferencias(@Query('status') status?: string) {
    return this.tesoreriaService.getTransferencias(status);
  }

  @Post('transferencias')
  @RequirePermissions('tesoreria:create')
  async createTransferencia(@Body() dto: CreateTransferenciaDto, @User() user: any) {
    return this.tesoreriaService.createTransferencia(dto, user.id);
  }

  @Post('transferencias/:id/procesar')
  @RequirePermissions('tesoreria:update')
  async procesarTransferencia(@Param('id') id: string, @User() user: any) {
    return this.tesoreriaService.procesarTransferencia(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FLUJO DE CAJA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('flujo-caja')
  @RequirePermissions('tesoreria:read')
  async getFlujoCaja(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.tesoreriaService.getFlujoCaja(new Date(from), new Date(to));
  }

  @Get('flujo-caja/proyeccion')
  @RequirePermissions('tesoreria:read')
  async getProyeccion(
    @Query('days') days?: number,
  ) {
    return this.tesoreriaService.getProyeccion(parseInt(days || '30'));
  }

  @Post('flujo-caja/proyeccion')
  @RequirePermissions('tesoreria:create')
  async createProyeccion(@Body() dto: CreateProyeccionDto, @User() user: any) {
    return this.tesoreriaService.createProyeccion(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/estado-cuentas')
  @RequirePermissions('reportes-tesoreria:read')
  async getEstadoCuentas() {
    return this.tesoreriaService.getEstadoCuentas();
  }

  @Get('reportes/movimientos-periodo')
  @RequirePermissions('reportes-tesoreria:read')
  async getMovimientosPeriodo(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.tesoreriaService.getMovimientosPeriodo(new Date(from), new Date(to));
  }

  @Get('reportes/conciliacion-pendiente')
  @RequirePermissions('reportes-tesoreria:read')
  async getConciliacionPendiente() {
    return this.tesoreriaService.getConciliacionPendiente();
  }
}
```

---

## 🧩 Servicio de Tesorería

### Funciones Principales

```typescript
// apps/backend/src/modules/tesoreria/tesoreria.service.ts

@Injectable()
export class TesoreriaService {
  constructor(
    private prisma: PrismaService,
    private contabilidadService: ContabilidadService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR CUENTA BANCARIA
  // ───────────────────────────────────────────────────────────────────────────
  
  async createCuenta(dto: CreateCuentaDto, userId: string) {
    const cuenta = await this.prisma.bankAccount.create({
      data: {
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountType: dto.accountType,
        currency: dto.currency || 'VES',
        accountingCode: dto.accountingCode,
        bankCode: dto.bankCode,
        agencyCode: dto.agencyCode,
        agencyName: dto.agencyName,
        accountHolder: dto.accountHolder,
        holderDocument: dto.holderDocument,
        isActive: dto.isActive ?? true,
        isMain: dto.isMain ?? false,
      },
    });

    return cuenta;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR TRANSACCIÓN BANCARIA
  // ───────────────────────────────────────────────────────────────────────────
  
  async createTransaccion(dto: CreateTransaccionDto, userId: string) {
    const cuenta = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });

    if (!cuenta) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    // Validar saldo suficiente para retiros
    if (dto.amount < 0 && cuenta.balance < Math.abs(dto.amount)) {
      throw new BadRequestException('Saldo insuficiente en la cuenta');
    }

    // Crear transacción
    const transaccion = await this.prisma.bankTransaction.create({
      data: {
        bankAccountId: dto.bankAccountId,
        date: dto.date || new Date(),
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        reference: dto.reference,
        checkNumber: dto.checkNumber,
        documentNumber: dto.documentNumber,
        categoryId: dto.categoryId,
        notes: dto.notes,
      },
      include: { bankAccount: true, category: true },
    });

    // Actualizar saldo de la cuenta
    await this.prisma.bankAccount.update({
      where: { id: dto.bankAccountId },
      data: {
        balance: { increment: dto.amount },
        availableBalance: { increment: dto.amount },
      },
    });

    // Crear asiento contable si corresponde
    if (dto.createAccountingEntry) {
      await this.contabilidadService.createBankTransactionEntry({
        transactionId: transaccion.id,
        bankAccountId: dto.bankAccountId,
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
        categoryId: dto.categoryId,
        createdBy: userId,
      });
    }

    return transaccion;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONCILIACIÓN BANCARIA
  // ───────────────────────────────────────────────────────────────────────────
  
  async createConciliacion(dto: CreateConciliacionDto, userId: string) {
    const { bankAccountId, period, startDate, endDate, openingBalance, closingBalance } = dto;

    // Obtener saldo del sistema al inicio del período
    const systemBalance = await this.getSystemBalance(bankAccountId, startDate);

    // Calcular diferencia
    const difference = closingBalance - systemBalance;

    // Crear conciliación
    const conciliacion = await this.prisma.bankReconciliation.create({
      data: {
        bankAccountId,
        period,
        startDate,
        endDate,
        openingBalance,
        closingBalance,
        systemBalance,
        difference,
        status: 'DRAFT',
        preparedBy: userId,
      },
      include: { bankAccount: true },
    });

    return conciliacion;
  }

  async reconciliarTransaccion(reconciliationId: string, dto: ReconciliarDto, userId: string) {
    const { transactionId, bankStatementRef, bankDate } = dto;

    // Marcar transacción como conciliada
    await this.prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        reconciled: true,
        reconciledAt: new Date(),
        reconciledBy: userId,
        bankStatementRef,
        bankDate: bankDate || new Date(),
      },
    });

    // Actualizar contadores de la conciliación
    const reconciliation = await this.prisma.bankReconciliation.findUnique({
      where: { id: reconciliationId },
      include: {
        bankAccount: {
          include: {
            transactions: {
              where: { reconciled: true },
            },
          },
        },
      },
    });

    const reconciledItems = reconciliation.bankAccount.transactions.length;
    const pendingItems = reconciliation.bankAccount.transactions.filter(t => !t.reconciled).length;

    await this.prisma.bankReconciliation.update({
      where: { id: reconciliationId },
      data: {
        reconciledItems,
        pendingItems,
      },
    });

    return { success: true, reconciledItems, pendingItems };
  }

  async cerrarConciliacion(reconciliationId: string, userId: string) {
    const reconciliation = await this.prisma.bankReconciliation.findUnique({
      where: { id: reconciliationId },
      include: {
        bankAccount: {
          include: {
            transactions: {
              where: {
                date: {
                  gte: reconciliation.startDate,
                  lte: reconciliation.endDate,
                },
              },
            },
          },
        },
      },
    });

    if (!reconciliation) {
      throw new NotFoundException('Conciliación no encontrada');
    }

    // Verificar que todas las transacciones estén conciliadas
    const pendingTransactions = reconciliation.bankAccount.transactions.filter(t => !t.reconciled);
    
    if (pendingTransactions.length > 0) {
      throw new BadRequestException(
        `Hay ${pendingTransactions.length} transacciones pendientes de conciliar`
      );
    }

    // Calcular diferencia final
    const systemBalance = reconciliation.bankAccount.transactions
      .filter(t => t.date >= reconciliation.startDate && t.date <= reconciliation.endDate)
      .reduce((sum, t) => sum + t.amount, 0);

    const difference = reconciliation.closingBalance - (reconciliation.openingBalance + systemBalance);

    // Si hay diferencia significativa, no permitir cerrar
    if (Math.abs(difference) > 0.01) {
      throw new BadRequestException(
        `Diferencia en conciliación: ${difference.toFixed(2)}. Debe ser 0.00 para cerrar.`
      );
    }

    // Cerrar conciliación
    await this.prisma.bankReconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: 'CLOSED',
        difference,
        reconciledAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Actualizar última conciliación de la cuenta
    await this.prisma.bankAccount.update({
      where: { id: reconciliation.bankAccountId },
      data: {
        lastReconciliation: new Date(),
        lastReconciliationBalance: reconciliation.closingBalance,
      },
    });

    return { success: true, message: 'Conciliación cerrada exitosamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSFERENCIAS ENTRE CUENTAS
  // ───────────────────────────────────────────────────────────────────────────
  
  async createTransferencia(dto: CreateTransferenciaDto, userId: string) {
    const number = await this.getNextTransferNumber();

    const { fromAccountId, toAccountId, amount, reference, notes } = dto;

    // Validar cuentas
    const fromAccount = await this.prisma.bankAccount.findUnique({
      where: { id: fromAccountId },
    });

    const toAccount = await this.prisma.bankAccount.findUnique({
      where: { id: toAccountId },
    });

    if (!fromAccount || !toAccount) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    // Validar saldo suficiente
    if (fromAccount.balance < amount) {
      throw new BadRequestException('Saldo insuficiente en la cuenta de origen');
    }

    // Crear transferencia
    const transferencia = await this.prisma.bankTransfer.create({
      data: {
        number,
        fromAccountId,
        toAccountId,
        amount,
        exchangeRate: dto.exchangeRate || 1,
        requestedDate: new Date(),
        status: 'PENDING',
        reference,
        notes,
        requestedBy: userId,
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });

    return transferencia;
  }

  async procesarTransferencia(transferId: string, userId: string) {
    const transferencia = await this.prisma.bankTransfer.findUnique({
      where: { id: transferId },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });

    if (!transferencia) {
      throw new NotFoundException('Transferencia no encontrada');
    }

    if (transferencia.status !== 'PENDING') {
      throw new BadRequestException('La transferencia ya fue procesada');
    }

    // Ejecutar transferencia en transacción
    await this.prisma.$transaction([
      // Debitar cuenta de origen
      this.prisma.bankAccount.update({
        where: { id: transferencia.fromAccountId },
        data: {
          balance: { decrement: transferencia.amount },
          availableBalance: { decrement: transferencia.amount },
        },
      }),

      // Acreditar cuenta de destino
      this.prisma.bankAccount.update({
        where: { id: transferencia.toAccountId },
        data: {
          balance: { increment: transferencia.amount },
          availableBalance: { increment: transferencia.amount },
        },
      }),

      // Crear transacción de salida
      this.prisma.bankTransaction.create({
        data: {
          bankAccountId: transferencia.fromAccountId,
          date: new Date(),
          description: `Transferencia a ${transferencia.toAccount.bankName} - ${transferencia.toAccount.accountNumber}`,
          amount: -transferencia.amount,
          type: 'TRANSFERENCIA',
          reference: transferencia.number,
          notes: transferencia.notes,
        },
      }),

      // Crear transacción de entrada
      this.prisma.bankTransaction.create({
        data: {
          bankAccountId: transferencia.toAccountId,
          date: new Date(),
          description: `Transferencia desde ${transferencia.fromAccount.bankName} - ${transferencia.fromAccount.accountNumber}`,
          amount: transferencia.amount,
          type: 'TRANSFERENCIA',
          reference: transferencia.number,
          notes: transferencia.notes,
        },
      }),

      // Actualizar transferencia
      this.prisma.bankTransfer.update({
        where: { id: transferId },
        data: {
          status: 'PROCESSED',
          processedDate: new Date(),
          processedBy: userId,
        },
      }),
    ]);

    return { success: true, message: 'Transferencia procesada exitosamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FLUJO DE CAJA
  // ───────────────────────────────────────────────────────────────────────────
  
  async getFlujoCaja(from: Date, to: Date) {
    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        date: { gte: from, lte: to },
      },
      include: {
        bankAccount: true,
        category: true,
      },
      orderBy: { date: 'asc' },
    });

    // Agrupar por categoría
    const byCategory = transactions.reduce((acc, t) => {
      const category = t.category?.name || 'SIN_CATEGORIA';
      if (!acc[category]) {
        acc[category] = { ingresos: 0, egresos: 0, neto: 0 };
      }
      if (t.amount > 0) {
        acc[category].ingresos += t.amount;
      } else {
        acc[category].egresos += Math.abs(t.amount);
      }
      acc[category].neto = acc[category].ingresos - acc[category].egresos;
      return acc;
    }, {} as Record<string, { ingresos: number; egresos: number; neto: number }>);

    // Totales
    const totalIngresos = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalEgresos = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const neto = totalIngresos - totalEgresos;

    return {
      period: { from, to },
      transactions,
      byCategory,
      totals: {
        ingresos: totalIngresos,
        egresos: totalEgresos,
        neto,
      },
    };
  }

  async getProyeccion(days: number) {
    const today = new Date();
    const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    // Obtener proyecciones
    const projections = await this.prisma.cashFlowProjection.findMany({
      where: {
        date: { gte: today, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    // Agrupar por día
    const byDay = projections.reduce((acc, p) => {
      const date = p.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { ingresos: 0, egresos: 0, neto: 0 };
      }
      if (p.type === 'INGRESO') {
        acc[date].ingresos += p.expected;
      } else {
        acc[date].egresos += p.expected;
      }
      acc[date].neto = acc[date].ingresos - acc[date].egresos;
      return acc;
    }, {} as Record<string, { ingresos: number; egresos: number; neto: number }>);

    // Obtener saldo actual de todas las cuentas
    const accounts = await this.prisma.bankAccount.findMany({
      where: { isActive: true },
    });
    const currentBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    // Calcular saldo proyectado por día
    let runningBalance = currentBalance;
    const projectedBalance = Object.entries(byDay).map(([date, data]) => {
      runningBalance += data.neto;
      return {
        date,
        ...data,
        projectedBalance: runningBalance,
      };
    });

    return {
      currentBalance,
      days,
      byDay: projectedBalance,
      finalBalance: runningBalance,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async getSystemBalance(bankAccountId: string, date: Date): Promise<number> {
    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccountId,
        date: { lt: date },
      },
    });

    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  private async getNextTransferNumber() {
    const year = new Date().getFullYear();
    const last = await this.prisma.bankTransfer.findFirst({
      where: { number: { startsWith: `T-${year}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[2]) + 1 : 1;
    return `T-${year}-${num.toString().padStart(6, '0')}`;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  async getEstadoCuentas() {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            transactions: true,
            reconciliations: true,
          },
        },
      },
    });

    return accounts.map(a => ({
      id: a.id,
      bankName: a.bankName,
      accountNumber: a.accountNumber,
      currency: a.currency,
      balance: a.balance,
      availableBalance: a.availableBalance,
      isMain: a.isMain,
      lastReconciliation: a.lastReconciliation,
      transactionCount: a._count.transactions,
      reconciliationCount: a._count.reconciliations,
    }));
  }

  async getConciliacionPendiente() {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { isActive: true },
      include: {
        transactions: {
          where: { reconciled: false },
          orderBy: { date: 'asc' },
        },
      },
    });

    return accounts.map(a => ({
      id: a.id,
      bankName: a.bankName,
      accountNumber: a.accountNumber,
      pendingTransactions: a.transactions.length,
      oldestPending: a.transactions[0]?.date,
      totalPending: a.transactions.reduce((sum, t) => sum + t.amount, 0),
    }));
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Saldo Insuficiente**: No permitir retiros sin saldo disponible
2. **Conciliación**: Diferencia debe ser 0.00 para cerrar
3. **Transferencias**: Validar saldo antes de procesar
4. **Transacciones Duplicadas**: Validar referencia única por banco
5. **Períodos Cerrados**: No permitir movimientos en períodos conciliados
6. **Auditoría**: Todas las transacciones deben tener usuario creador
7. **Contabilidad**: Transacciones > monto umbral generan asiento automático

---

## 🔗 Conexiones Detalladas

### Con Contabilidad

```typescript
// Al crear transacción bancaria:
await this.contabilidadService.createBankTransactionEntry({
  transactionId: transaccion.id,
  bankAccountId: dto.bankAccountId,
  amount: dto.amount,
  type: dto.type,
  description: dto.description,
  categoryId: dto.categoryId,
  createdBy: userId,
});

// Asiento generado para depósito:
// Débito: Banco (amount)
// Crédito: Cuenta correspondiente (amount)
```

### Con Ventas (Cobros)

```typescript
// Al cobrar cuenta por cobrar:
await this.prisma.aRPayment.create({
  data: {
    receivableId,
    amount: dto.amount,
    date: dto.date,
    method: 'TRANSFERENCIA',
    bankAccountId: dto.bankAccountId,
  },
});

// Actualizar cuenta bancaria:
await this.prisma.bankAccount.update({
  where: { id: dto.bankAccountId },
  data: { balance: { increment: dto.amount } },
});
```

### Con Compras (Pagos)

```typescript
// Al pagar cuenta por pagar:
await this.prisma.aPPayment.create({
  data: {
    payableId,
    amount: dto.amount,
    date: dto.date,
    method: 'CHEQUE',
    bankAccountId: dto.bankAccountId,
  },
});

// Actualizar cuenta bancaria:
await this.prisma.bankAccount.update({
  where: { id: dto.bankAccountId },
  data: { balance: { decrement: dto.amount } },
});
```

---

## 📁 Archivos del Módulo

```
01-modulo-administrativo/
├── contabilidad.md
├── finanzas.md
├── tesoreria.md (este archivo)
├── presupuesto.md
├── activos-fijos.md
├── impuestos.md
└── rrhh/
    └── empleados.md
```

**Anterior**: `01-administrativo/contabilidad.md` | **Siguiente**: `01-administrativo/finanzas.md`
