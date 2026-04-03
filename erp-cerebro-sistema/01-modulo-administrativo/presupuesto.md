# Módulo 01: ADMINISTRATIVO - Presupuesto y Control de Gestión

## Descripción

Módulo de presupuesto que incluye planificación presupuestaria, control de ejecución, análisis de variaciones, centros de costo y reporting presupuestario.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad  → Ejecución real vs presupuesto│
│  01-administrativo/finanzas      → Proyecciones financieras    │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/compras            → Límites presupuestarios     │
│  02-operativo/produccion         → Presupuesto de producción   │
├─────────────────────────────────────────────────────────────────┤
│  03-comercial/ventas             → Presupuesto de ventas       │
├─────────────────────────────────────────────────────────────────┤
│  06-reportes/dashboard           → KPIs presupuestarios        │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Presupuesto **COMPARA** con ejecución real de contabilidad
2. Compras **VALIDA** disponibilidad presupuestaria
3. Ventas **ALIMENTA** presupuesto de ingresos
4. Reportes **MUESTRAN** variaciones presupuesto vs real

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CENTROS DE COSTO
// ─────────────────────────────────────────────────────────────────────────────

model CostCenter {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String?
  parentId    String?
  parent      CostCenter? @relation("CostCenterTree", fields: [parentId], references: [id])
  children    CostCenter[] @relation("CostCenterTree")
  
  // Responsable
  managerId   String?
  managerName String?
  
  // Tipo
  type        String   // OPERATIVO, ADMINISTRATIVO, VENTAS, PRODUCCION
  isActive    Boolean  @default(true)
  
  // Relaciones
  budgets     Budget[]
  journalItems JournalEntryItem[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([code])
  @@index([parentId])
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESUPUESTOS
// ─────────────────────────────────────────────────────────────────────────────

model Budget {
  id            String   @id @default(cuid())
  code          String   @unique // ej. PRE-2024-001
  
  // Período
  year          Int
  month         Int?     // Null = anual
  period        String   // MM-YYYY
  
  // Centro de costo
  costCenterId  String
  costCenter    CostCenter @relation(fields: [costCenterId], references: [id])
  
  // Cuenta contable
  accountId     String
  account       Account  @relation(fields: [accountId], references: [id])
  
  // Montos
  amount        Float    // Presupuestado
  executed      Float    @default(0) // Ejecutado real
  committed     Float    @default(0) // Comprometido (órdenes de compra)
  available     Float    // Disponible (calculado)
  
  // Variación
  variance      Float    // amount - executed
  variancePercent Float  // (variance / amount) * 100
  
  // Estado
  status        BudgetStatus @default(DRAFT) // DRAFT, REVIEW, APPROVED, EXECUTING, CLOSED
  approvedBy    String?
  approvedAt    DateTime?
  
  // Auditoría
  createdBy     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([costCenterId])
  @@index([accountId])
  @@index([period])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFERENCIAS PRESUPUESTARIAS
// ─────────────────────────────────────────────────────────────────────────────

model BudgetTransfer {
  id            String   @id @default(cuid())
  number        String   @unique // ej. TRA-2024-001
  
  // Origen y destino
  fromBudgetId  String
  fromBudget    Budget @relation("TransferFrom", fields: [fromBudgetId], references: [id])
  toBudgetId    String
  toBudget      Budget @relation("TransferTo", fields: [toBudgetId], references: [id])
  
  // Monto
  amount        Float
  
  // Justificación
  reason        String
  justification String?
  
  // Aprobación
  requestedBy   String
  requestedAt   DateTime @default(now())
  approvedBy    String?
  approvedAt    DateTime?
  rejectedBy    String?
  rejectedAt    DateTime?
  rejectReason  String?
  
  // Estado
  status        String   @default("PENDING") // PENDING, APPROVED, REJECTED, EXECUTED
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([fromBudgetId])
  @@index([toBudgetId])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// ANÁLISIS DE VARIANZAS
// ─────────────────────────────────────────────────────────────────────────────

model VarianceAnalysis {
  id          String   @id @default(cuid())
  period      String   // MM-YYYY
  
  // Presupuesto
  budgetId    String
  budget      Budget @relation(fields: [budgetId], references: [id])
  
  // Valores
  budgeted    Float    // Presupuestado
  actual      Float    // Real
  variance    Float    // Varianza absoluta
  variancePercent Float // Varianza porcentual
  
  // Análisis
  type        String   // FAVORABLE, DESFAVORABLE, NEUTRA
  severity    String   // LOW, MEDIUM, HIGH, CRITICAL
  explanation String?
  actionPlan  String?
  responsible String?
  dueDate     DateTime?
  
  // Estado
  status      String   @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  reviewedBy  String?
  reviewedAt  DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([period])
  @@index([budgetId])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORÍAS PRESUPUESTARIAS
// ─────────────────────────────────────────────────────────────────────────────

model BudgetCategory {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String?
  type        String   // INGRESO, GASTO, INVERSION
  parentId    String?
  parent      BudgetCategory? @relation("BudgetCategoryTree", fields: [parentId], references: [id])
  children    BudgetCategory[] @relation("BudgetCategoryTree")
  
  // Cuentas asociadas
  accounts    String[] // IDs de cuentas contables
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([code])
  @@index([type])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum BudgetStatus {
  DRAFT
  REVIEW
  APPROVED
  EXECUTING
  CLOSED
  CANCELLED
}
```

---

## 📡 Endpoints de la API

### Controller de Presupuesto

```typescript
// apps/backend/src/modules/presupuesto/presupuesto.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PresupuestoService } from './presupuesto.service';

@Controller('presupuesto')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PresupuestoController {
  constructor(private presupuestoService: PresupuestoService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CENTROS DE COSTO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('centros-costo')
  @RequirePermissions('presupuesto:read')
  async getCentrosCosto(@Query('parentId') parentId?: string) {
    return this.presupuestoService.getCentrosCosto(parentId);
  }

  @Post('centros-costo')
  @RequirePermissions('presupuesto:create')
  async createCentroCosto(@Body() dto: CreateCentroCostoDto, @User() user: any) {
    return this.presupuestoService.createCentroCosto(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PRESUPUESTOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('presupuestos')
  @RequirePermissions('presupuesto:read')
  async getPresupuestos(
    @Query('period') period?: string,
    @Query('costCenterId') costCenterId?: string,
    @Query('status') status?: string,
  ) {
    return this.presupuestoService.getPresupuestos(period, costCenterId, status);
  }

  @Post('presupuestos')
  @RequirePermissions('presupuesto:create')
  async createPresupuesto(@Body() dto: CreatePresupuestoDto, @User() user: any) {
    return this.presupuestoService.createPresupuesto(dto, user.id);
  }

  @Put('presupuestos/:id')
  @RequirePermissions('presupuesto:update')
  async updatePresupuesto(
    @Param('id') id: string,
    @Body() dto: UpdatePresupuestoDto,
    @User() user: any,
  ) {
    return this.presupuestoService.updatePresupuesto(id, dto, user.id);
  }

  @Post('presupuestos/:id/approve')
  @RequirePermissions('presupuesto:approve')
  async approvePresupuesto(@Param('id') id: string, @User() user: any) {
    return this.presupuestoService.approvePresupuesto(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EJECUCIÓN PRESUPUESTARIA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('ejecucion')
  @RequirePermissions('presupuesto:read')
  async getEjecucion(
    @Query('period') period?: string,
    @Query('costCenterId') costCenterId?: string,
  ) {
    return this.presupuestoService.getEjecucion(period, costCenterId);
  }

  @Post('presupuestos/:id/commit')
  @RequirePermissions('presupuesto:create')
  async commitBudget(@Param('id') id: string, @Body() dto: CommitBudgetDto) {
    return this.presupuestoService.commitBudget(id, dto.amount);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSFERENCIAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('transferencias')
  @RequirePermissions('presupuesto:read')
  async getTransferencias(@Query('status') status?: string) {
    return this.presupuestoService.getTransferencias(status);
  }

  @Post('transferencias')
  @RequirePermissions('presupuesto:create')
  async createTransferencia(@Body() dto: CreateTransferenciaDto, @User() user: any) {
    return this.presupuestoService.createTransferencia(dto, user.id);
  }

  @Post('transferencias/:id/approve')
  @RequirePermissions('presupuesto:approve')
  async approveTransferencia(@Param('id') id: string, @User() user: any) {
    return this.presupuestoService.approveTransferencia(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ANÁLISIS DE VARIANZAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('varianzas')
  @RequirePermissions('presupuesto:read')
  async getVarianzas(@Query('period') period?: string) {
    return this.presupuestoService.getVarianzas(period);
  }

  @Post('varianzas/analizar')
  @RequirePermissions('presupuesto:create')
  async analizarVarianzas(@Body() dto: AnalizarVarianzasDto, @User() user: any) {
    return this.presupuestoService.analizarVarianzas(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/ejecucion-presupuestaria')
  @RequirePermissions('reportes-presupuesto:read')
  async getEjecucionPresupuestaria(@Query('period') period?: string) {
    return this.presupuestoService.getEjecucionPresupuestaria(period);
  }

  @Get('reportes/varianzas-acumuladas')
  @RequirePermissions('reportes-presupuesto:read')
  async getVarianzasAcumuladas(@Query('year') year?: number) {
    return this.presupuestoService.getVarianzasAcumuladas(parseInt(year?.toString() || new Date().getFullYear().toString()));
  }

  @Get('reportes/disponibilidad')
  @RequirePermissions('presupuesto:read')
  async getDisponibilidad(@Query('costCenterId') costCenterId?: string) {
    return this.presupuestoService.getDisponibilidad(costCenterId);
  }
}
```

---

## 🧩 Servicio de Presupuesto

### Funciones Principales

```typescript
// apps/backend/src/modules/presupuesto/presupuesto.service.ts

@Injectable()
export class PresupuestoService {
  constructor(private prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR PRESUPUESTO
  // ───────────────────────────────────────────────────────────────────────────
  
  async createPresupuesto(dto: CreatePresupuestoDto, userId: string) {
    const period = dto.month 
      ? `${dto.month.toString().padStart(2, '0')}-${dto.year}`
      : `00-${dto.year}`;

    // Verificar si ya existe presupuesto para ese período y cuenta
    const existing = await this.prisma.budget.findFirst({
      where: {
        costCenterId: dto.costCenterId,
        accountId: dto.accountId,
        period,
      },
    });

    if (existing) {
      throw new BadRequestException('Ya existe un presupuesto para este centro de costo y cuenta en el período especificado');
    }

    const budget = await this.prisma.budget.create({
      data: {
        code: await this.generateBudgetCode(),
        year: dto.year,
        month: dto.month,
        period,
        costCenterId: dto.costCenterId,
        accountId: dto.accountId,
        amount: dto.amount,
        executed: 0,
        committed: 0,
        available: dto.amount,
        variance: dto.amount,
        variancePercent: 0,
        status: 'DRAFT',
        createdBy: userId,
      },
      include: {
        costCenter: true,
        account: true,
      },
    });

    return budget;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // APROBAR PRESUPUESTO
  // ───────────────────────────────────────────────────────────────────────────
  
  async approvePresupuesto(budgetId: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (budget.status !== 'DRAFT' && budget.status !== 'REVIEW') {
      throw new BadRequestException('Solo se pueden aprobar presupuestos en estado DRAFT o REVIEW');
    }

    return this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // OBTENER EJECUCIÓN PRESUPUESTARIA
  // ───────────────────────────────────────────────────────────────────────────
  
  async getEjecucion(period?: string, costCenterId?: string) {
    const where: any = {};
    
    if (period) where.period = period;
    if (costCenterId) where.costCenterId = costCenterId;

    const budgets = await this.prisma.budget.findMany({
      where,
      include: {
        costCenter: true,
        account: true,
      },
    });

    // Calcular disponible y variaciones
    const execution = budgets.map(budget => ({
      ...budget,
      available: budget.amount - budget.executed - budget.committed,
      variance: budget.amount - budget.executed,
      variancePercent: budget.amount > 0 
        ? ((budget.amount - budget.executed) / budget.amount) * 100 
        : 0,
      executionPercent: budget.amount > 0 
        ? (budget.executed / budget.amount) * 100 
        : 0,
      commitmentPercent: budget.amount > 0 
        ? (budget.committed / budget.amount) * 100 
        : 0,
    }));

    return {
      period: period || 'Todos',
      totalBudgets: execution.length,
      totalAmount: execution.reduce((sum, b) => sum + b.amount, 0),
      totalExecuted: execution.reduce((sum, b) => sum + b.executed, 0),
      totalCommitted: execution.reduce((sum, b) => sum + b.committed, 0),
      totalAvailable: execution.reduce((sum, b) => sum + b.available, 0),
      executionRate: execution.reduce((sum, b) => sum + b.executed, 0) / 
                     (execution.reduce((sum, b) => sum + b.amount, 0) || 1) * 100,
      budgets: execution,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // COMPROMETER PRESUPUESTO (para órdenes de compra)
  // ───────────────────────────────────────────────────────────────────────────
  
  async commitBudget(budgetId: string, amount: number) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (budget.status !== 'APPROVED' && budget.status !== 'EXECUTING') {
      throw new BadRequestException('El presupuesto debe estar aprobado para comprometer fondos');
    }

    const available = budget.amount - budget.executed - budget.committed;
    
    if (amount > available) {
      throw new BadRequestException(
        `Monto insuficiente. Disponible: ${available}, Solicitado: ${amount}`
      );
    }

    return this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        committed: { increment: amount },
        available: { decrement: amount },
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR EJECUCIÓN REAL (desde contabilidad)
  // ───────────────────────────────────────────────────────────────────────────
  
  async registerExecution(accountId: string, costCenterId: string, amount: number, period: string) {
    const budget = await this.prisma.budget.findFirst({
      where: {
        accountId,
        costCenterId,
        period,
      },
    });

    if (!budget) {
      // Presupuesto no existe, crear alerta
      await this.createBudgetAlert(accountId, costCenterId, amount, period);
      return null;
    }

    // Liberar comprometido y ejecutar real
    const updated = await this.prisma.budget.update({
      where: { id: budget.id },
      data: {
        executed: { increment: amount },
        committed: { decrement: amount }, // Asumiendo que ya estaba comprometido
        variance: { decrement: amount },
        variancePercent: ((budget.amount - budget.executed - amount) / budget.amount) * 100,
      },
    });

    // Verificar si excede presupuesto
    if (updated.executed > updated.amount) {
      await this.createBudgetExceededAlert(updated);
    }

    return updated;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSFERENCIA PRESUPUESTARIA
  // ───────────────────────────────────────────────────────────────────────────
  
  async createTransferencia(dto: CreateTransferenciaDto, userId: string) {
    const fromBudget = await this.prisma.budget.findUnique({
      where: { id: dto.fromBudgetId },
    });

    const toBudget = await this.prisma.budget.findUnique({
      where: { id: dto.toBudgetId },
    });

    if (!fromBudget || !toBudget) {
      throw new NotFoundException('Presupuesto de origen o destino no encontrado');
    }

    // Validar que haya disponible
    const fromAvailable = fromBudget.amount - fromBudget.executed - fromBudget.committed;
    
    if (dto.amount > fromAvailable) {
      throw new BadRequestException(
        `Saldo insuficiente en presupuesto origen. Disponible: ${fromAvailable}`
      );
    }

    const transfer = await this.prisma.budgetTransfer.create({
      data: {
        number: await this.generateTransferNumber(),
        fromBudgetId: dto.fromBudgetId,
        toBudgetId: dto.toBudgetId,
        amount: dto.amount,
        reason: dto.reason,
        justification: dto.justification,
        requestedBy: userId,
        status: 'PENDING',
      },
      include: {
        fromBudget: { include: { costCenter: true, account: true } },
        toBudget: { include: { costCenter: true, account: true } },
      },
    });

    return transfer;
  }

  async approveTransferencia(transferId: string, userId: string) {
    const transfer = await this.prisma.budgetTransfer.findUnique({
      where: { id: transferId },
      include: {
        fromBudget: true,
        toBudget: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transferencia no encontrada');
    }

    if (transfer.status !== 'PENDING') {
      throw new BadRequestException('La transferencia ya fue procesada');
    }

    // Ejecutar transferencia en transacción
    await this.prisma.$transaction([
      // Reducir presupuesto origen
      this.prisma.budget.update({
        where: { id: transfer.fromBudgetId },
        data: {
          amount: { decrement: transfer.amount },
          available: { decrement: transfer.amount },
        },
      }),

      // Aumentar presupuesto destino
      this.prisma.budget.update({
        where: { id: transfer.toBudgetId },
        data: {
          amount: { increment: transfer.amount },
          available: { increment: transfer.amount },
        },
      }),

      // Actualizar transferencia
      this.prisma.budgetTransfer.update({
        where: { id: transferId },
        data: {
          status: 'EXECUTED',
          approvedBy: userId,
          approvedAt: new Date(),
        },
      }),
    ]);

    return { success: true, transfer };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ANÁLISIS DE VARIANZAS
  // ───────────────────────────────────────────────────────────────────────────
  
  async getVarianzas(period?: string) {
    const where: any = {};
    if (period) where.period = period;

    const budgets = await this.prisma.budget.findMany({
      where,
      include: {
        costCenter: true,
        account: true,
      },
    });

    const varianzas = budgets.map(budget => {
      const variance = budget.amount - budget.executed;
      const variancePercent = budget.amount > 0 
        ? (variance / budget.amount) * 100 
        : 0;
      
      const type = variance >= 0 ? 'FAVORABLE' : 'DESFAVORABLE';
      const severity = Math.abs(variancePercent) >= 20 ? 'CRITICAL'
        : Math.abs(variancePercent) >= 10 ? 'HIGH'
        : Math.abs(variancePercent) >= 5 ? 'MEDIUM'
        : 'LOW';

      return {
        budgetId: budget.id,
        code: budget.code,
        costCenter: budget.costCenter.name,
        account: budget.account.name,
        period: budget.period,
        budgeted: budget.amount,
        executed: budget.executed,
        variance,
        variancePercent: parseFloat(variancePercent.toFixed(2)),
        type,
        severity,
        executedPercent: parseFloat(((budget.executed / budget.amount) * 100).toFixed(2)),
      };
    });

    return {
      period: period || 'Todos',
      totalBudgets: varianzas.length,
      favorable: varianzas.filter(v => v.type === 'FAVORABLE').length,
      unfavorable: varianzas.filter(v => v.type === 'DESFAVORABLE').length,
      critical: varianzas.filter(v => v.severity === 'CRITICAL').length,
      totalVariance: varianzas.reduce((sum, v) => sum + v.variance, 0),
      varianzas,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async generateBudgetCode(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.budget.findFirst({
      where: { code: { startsWith: `PRE-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const num = last ? parseInt(last.code.split('-')[2]) + 1 : 1;
    return `PRE-${year}-${num.toString().padStart(4, '0')}`;
  }

  private async generateTransferNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.budgetTransfer.findFirst({
      where: { number: { startsWith: `TRA-${year}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[2]) + 1 : 1;
    return `TRA-${year}-${num.toString().padStart(4, '0')}`;
  }

  private async createBudgetAlert(accountId: string, costCenterId: string, amount: number, period: string) {
    // Crear alerta de gasto sin presupuesto
    // Implementar según sistema de alertas
  }

  private async createBudgetExceededAlert(budget: any) {
    // Crear alerta de presupuesto excedido
    // Implementar según sistema de alertas
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  async getEjecucionPresupuestaria(period?: string) {
    const execution = await this.getEjecucion(period);
    
    // Agrupar por centro de costo
    const byCostCenter = execution.budgets.reduce((acc, b) => {
      if (!acc[b.costCenter.name]) {
        acc[b.costCenter.name] = {
          costCenter: b.costCenter.name,
          budgeted: 0,
          executed: 0,
          committed: 0,
          available: 0,
        };
      }
      acc[b.costCenter.name].budgeted += b.amount;
      acc[b.costCenter.name].executed += b.executed;
      acc[b.costCenter.name].committed += b.committed;
      acc[b.costCenter.name].available += b.available;
      return acc;
    }, {} as Record<string, any>);

    return {
      period: period || 'Todos',
      summary: execution,
      byCostCenter: Object.values(byCostCenter),
    };
  }

  async getDisponibilidad(costCenterId?: string) {
    const where: any = { status: 'APPROVED' };
    if (costCenterId) where.costCenterId = costCenterId;

    const budgets = await this.prisma.budget.findMany({ where });

    return budgets.map(b => ({
      budgetId: b.id,
      code: b.code,
      costCenter: b.costCenter.name,
      account: b.account.name,
      period: b.period,
      total: b.amount,
      executed: b.executed,
      committed: b.committed,
      available: b.amount - b.executed - b.committed,
      availablePercent: ((b.amount - b.executed - b.committed) / b.amount) * 100,
    }));
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Aprobación Requerida**: Presupuestos deben estar aprobados para ejecutarse
2. **Validación de Compromiso**: No comprometer más del disponible
3. **Transferencias**: Requieren aprobación, no se pueden ejecutar sin ella
4. **Variaciones Críticas**: Alertar cuando ejecución > 90% o < 10%
5. **Períodos Cerrados**: No modificar presupuestos de períodos cerrados
6. **Integridad**: Presupuesto = Ejecutado + Comprometido + Disponible
7. **Auditoría**: Todas las transferencias quedan registradas

---

## 📁 Archivos del Módulo

```
01-modulo-administrativo/
├── contabilidad.md
├── tesoreria.md
├── finanzas.md
├── presupuesto.md (este archivo)
├── activos-fijos.md
├── impuestos.md
└── rrhh/
    └── empleados.md
```

**Anterior**: `01-administrativo/finanzas.md` | **Siguiente**: `01-administrativo/activos-fijos.md`
