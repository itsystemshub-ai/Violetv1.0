# Módulo 01: ADMINISTRATIVO - Activos Fijos y Depreciación

## Descripción

Módulo de gestión de activos fijos que incluye registro de activos, cálculo de depreciación, bajas, revaluaciones y mantenimiento de activos.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad  → Asientos de depreciación    │
│  01-administrativo/finanzas      → Valoración de activos       │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/mantenimiento      → Mantenimiento de activos    │
│  02-operativo/inventario         → Activos en inventario       │
├─────────────────────────────────────────────────────────────────┤
│  05-configuracion/sistema        → Parámetros de depreciación  │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Activos **GENERAN** asiento de depreciación mensual
2. Bajas **CREAN** asiento de pérdida/ganancia
3. Mantenimiento **AÑADE** al valor del activo
4. Revaluaciones **AJUSTAN** valor en libros

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// ACTIVOS FIJOS
// ─────────────────────────────────────────────────────────────────────────────

model FixedAsset {
  id                String   @id @default(cuid())
  code              String   @unique // ej. ACT-2024-001
  name              String
  description       String?
  
  // Categoría
  categoryId        String
  category          AssetCategory @relation(fields: [categoryId], references: [id])
  
  // Ubicación
  locationId        String?
  location          CostCenter? @relation(fields: [locationId], references: [id])
  
  // Valores
  acquisitionCost   Float    // Costo de adquisición
  residualValue     Float    @default(0) // Valor residual
  depreciableBase   Float    // acquisitionCost - residualValue
  
  // Depreciación
  usefulLifeYears   Int      // Vida útil en años
  usefulLifeMonths  Int      // Vida útil en meses
  depreciationMethod DepreciationMethod // LINEAL, ACELERADA, UNIDADES
  depreciationRate  Float    // Tasa anual
  accumulatedDepreciation Float @default(0)
  currentValue      Float    // Valor actual en libros
  
  // Fechas
  acquisitionDate   DateTime
  depreciationStartDate DateTime?
  lastDepreciationDate DateTime?
  
  // Estado
  status          AssetStatus @default(ACTIVE) // ACTIVE, DISPOSED, HELD_FOR_SALE, IN_MAINTENANCE
  
  // Datos adicionales
  serialNumber    String?
  manufacturer    String?
  model           String?
  vendor          String?
  invoiceNumber   String?
  invoiceDate     DateTime?
  
  // Relaciones
  depreciations   AssetDepreciation[]
  revaluations    AssetRevaluation[]
  disposals       AssetDisposal[]
  maintenances    AssetMaintenance[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([code])
  @@index([categoryId])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORÍAS DE ACTIVOS
// ─────────────────────────────────────────────────────────────────────────────

model AssetCategory {
  id                String   @id @default(cuid())
  code              String   @unique
  name              String
  description       String?
  
  // Depreciación por defecto
  usefulLifeYears   Int      @default(5)
  depreciationRate  Float    @default(0.20) // 20% anual
  depreciationMethod DepreciationMethod @default(LINEAL)
  
  // Cuentas contables
  assetAccountId    String?  // Cuenta del activo
  depreciationAccountId String? // Cuenta de depreciación acumulada
  expenseAccountId  String?  // Cuenta de gasto por depreciación
  
  assets            FixedAsset[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([code])
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPRECIACIÓN
// ─────────────────────────────────────────────────────────────────────────────

model AssetDepreciation {
  id          String   @id @default(cuid())
  assetId     String
  asset       FixedAsset @relation(fields: [assetId], references: [id])
  
  // Período
  period      String   // MM-YYYY
  year        Int
  month       Int
  
  // Montos
  depreciationAmount Float
  accumulatedDepreciation Float
  bookValue   Float    // Valor en libros
  
  // Asiento contable
  journalEntryId String?
  journalEntry  JournalEntry? @relation(fields: [journalEntryId], references: [id])
  
  // Estado
  status      String   @default("POSTED") // PENDING, POSTED
  postedAt    DateTime?
  
  createdAt   DateTime @default(now())

  @@unique([assetId, period])
  @@index([assetId])
  @@index([period])
}

// ─────────────────────────────────────────────────────────────────────────────
// REVALUACIONES
// ─────────────────────────────────────────────────────────────────────────────

model AssetRevaluation {
  id          String   @id @default(cuid())
  assetId     String
  asset       FixedAsset @relation(fields: [assetId], references: [id])
  
  // Fechas
  date        DateTime
  
  // Valores
  previousValue Float
  newValue    Float
  adjustment  Float  // newValue - previousValue
  
  // Razón
  reason      String
  appraisalBy String?  // Tasador
  appraisalReport String? // Informe de tasación
  
  // Asiento contable
  journalEntryId String?
  journalEntry  JournalEntry? @relation(fields: [journalEntryId], references: [id])
  
  createdAt   DateTime @default(now())

  @@index([assetId])
}

// ─────────────────────────────────────────────────────────────────────────────
// BAJAS DE ACTIVOS
// ─────────────────────────────────────────────────────────────────────────────

model AssetDisposal {
  id          String   @id @default(cuid())
  assetId     String
  asset       FixedAsset @relation(fields: [assetId], references: [id])
  
  // Fecha
  date        DateTime
  
  // Tipo de baja
  type        DisposalType // SALE, SCRAPPED, DONATED, LOST
  
  // Razón
  reason      String
  description String?
  
  // Valores
  salePrice   Float?   // Precio de venta (si aplica)
  bookValue   Float    // Valor en libros al momento de la baja
  gainLoss    Float    // salePrice - bookValue
  
  // Asiento contable
  journalEntryId String?
  journalEntry  JournalEntry? @relation(fields: [journalEntryId], references: [id])
  
  // Aprobación
  approvedBy    String?
  approvedAt    DateTime?
  
  createdAt   DateTime @default(now())

  @@index([assetId])
  @@index([type])
}

// ─────────────────────────────────────────────────────────────────────────────
// MANTENIMIENTO DE ACTIVOS
// ─────────────────────────────────────────────────────────────────────────────

model AssetMaintenance {
  id          String   @id @default(cuid())
  assetId     String
  asset       FixedAsset @relation(fields: [assetId], references: [id])
  
  // Tipo
  type        MaintenanceType // PREVENTIVE, CORRECTIVE, PREDICTIVE
  
  // Descripción
  description String
  notes       String?
  
  // Fechas
  scheduledDate DateTime
  completedDate DateTime?
  
  // Costo
  cost        Float    @default(0)
  vendor      String?
  
  // Estado
  status      String   @default("SCHEDULED") // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([assetId])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum DepreciationMethod {
  LINEAL
  ACELERADA
  UNIDADES_PRODUCCION
  SUMA_DIGITOS
}

enum AssetStatus {
  ACTIVE
  DISPOSED
  HELD_FOR_SALE
  IN_MAINTENANCE
  FULLY_DEPRECIATED
}

enum DisposalType {
  SALE
  SCRAPPED
  DONATED
  LOST
}

enum MaintenanceType {
  PREVENTIVE
  CORRECTIVE
  PREDICTIVE
}
```

---

## 📡 Endpoints de la API

### Controller de Activos Fijos

```typescript
// apps/backend/src/modules/activos-fijos/activos-fijos.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ActivosFijosService } from './activos-fijos.service';

@Controller('activos-fijos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ActivosFijosController {
  constructor(private activosFijosService: ActivosFijosService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // ACTIVOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('activos')
  @RequirePermissions('activos-fijos:read')
  async getActivos(@Query('status') status?: string, @Query('categoryId') categoryId?: string) {
    return this.activosFijosService.getActivos(status, categoryId);
  }

  @Get('activos/:id')
  @RequirePermissions('activos-fijos:read')
  async getActivo(@Param('id') id: string) {
    return this.activosFijosService.getActivo(id);
  }

  @Post('activos')
  @RequirePermissions('activos-fijos:create')
  async createActivo(@Body() dto: CreateActivoDto, @User() user: any) {
    return this.activosFijosService.createActivo(dto, user.id);
  }

  @Put('activos/:id')
  @RequirePermissions('activos-fijos:update')
  async updateActivo(
    @Param('id') id: string,
    @Body() dto: UpdateActivoDto,
    @User() user: any,
  ) {
    return this.activosFijosService.updateActivo(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DEPRECIACIÓN
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('depreciacion/calcular')
  @RequirePermissions('activos-fijos:read')
  async calcularDepreciacion(@Query('period') period?: string) {
    return this.activosFijosService.calcularDepreciacion(period || this.getCurrentPeriod());
  }

  @Post('depreciacion/ejecutar')
  @RequirePermissions('activos-fijos:create')
  async ejecutarDepreciacion(@Body() dto: EjecutarDepreciacionDto, @User() user: any) {
    return this.activosFijosService.ejecutarDepreciacion(dto.period, user.id);
  }

  @Get('depreciacion/historial/:assetId')
  @RequirePermissions('activos-fijos:read')
  async getDepreciacionHistorial(@Param('assetId') assetId: string) {
    return this.activosFijosService.getDepreciacionHistorial(assetId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // BAJAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('activos/:id/baja')
  @RequirePermissions('activos-fijos:delete')
  async registrarBaja(
    @Param('id') id: string,
    @Body() dto: RegistrarBajaDto,
    @User() user: any,
  ) {
    return this.activosFijosService.registrarBaja(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REVALUACIONES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('activos/:id/revaluar')
  @RequirePermissions('activos-fijos:update')
  async revaluarActivo(
    @Param('id') id: string,
    @Body() dto: RevaluarActivoDto,
    @User() user: any,
  ) {
    return this.activosFijosService.revaluarActivo(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MANTENIMIENTO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('mantenimiento')
  @RequirePermissions('activos-fijos:read')
  async getMantenimientos(@Query('assetId') assetId?: string, @Query('status') status?: string) {
    return this.activosFijosService.getMantenimientos(assetId, status);
  }

  @Post('mantenimiento')
  @RequirePermissions('activos-fijos:create')
  async createMantenimiento(@Body() dto: CreateMantenimientoDto, @User() user: any) {
    return this.activosFijosService.createMantenimiento(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/libro-activos')
  @RequirePermissions('reportes-activos:read')
  async getLibroActivos() {
    return this.activosFijosService.getLibroActivos();
  }

  @Get('reportes/depreciacion-ejercicio')
  @RequirePermissions('reportes-activos:read')
  async getDepreciacionEjercicio(@Query('year') year?: number) {
    return this.activosFijosService.getDepreciacionEjercicio(parseInt(year?.toString() || new Date().getFullYear().toString()));
  }

  @Get('reportes/activos-vencidos')
  @RequirePermissions('reportes-activos:read')
  async getActivosVencidos() {
    return this.activosFijosService.getActivosVencidos();
  }
}
```

---

## 🧩 Servicio de Activos Fijos

### Funciones Principales

```typescript
// apps/backend/src/modules/activos-fijos/activos-fijos.service.ts

@Injectable()
export class ActivosFijosService {
  constructor(
    private prisma: PrismaService,
    private contabilidadService: ContabilidadService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CREAR ACTIVO
  // ───────────────────────────────────────────────────────────────────────────
  
  async createActivo(dto: CreateActivoDto, userId: string) {
    const category = await this.prisma.assetCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoría de activo no encontrada');
    }

    const depreciableBase = dto.acquisitionCost - dto.residualValue;
    const usefulLifeMonths = dto.usefulLifeYears * 12;
    const depreciationRate = dto.depreciationMethod === 'LINEAL' 
      ? 1 / dto.usefulLifeYears 
      : category.depreciationRate;

    const asset = await this.prisma.fixedAsset.create({
      data: {
        code: await this.generateAssetCode(),
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        locationId: dto.locationId,
        acquisitionCost: dto.acquisitionCost,
        residualValue: dto.residualValue || 0,
        depreciableBase,
        usefulLifeYears: dto.usefulLifeYears,
        usefulLifeMonths,
        depreciationMethod: dto.depreciationMethod,
        depreciationRate,
        currentValue: dto.acquisitionCost,
        acquisitionDate: dto.acquisitionDate,
        depreciationStartDate: dto.depreciationStartDate || dto.acquisitionDate,
        status: 'ACTIVE',
        serialNumber: dto.serialNumber,
        manufacturer: dto.manufacturer,
        model: dto.model,
        vendor: dto.vendor,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate: dto.invoiceDate,
      },
      include: {
        category: true,
        location: true,
      },
    });

    return asset;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CALCULAR DEPRECIACIÓN MENSUAL
  // ───────────────────────────────────────────────────────────────────────────
  
  async calcularDepreciacion(period: string) {
    const [month, year] = period.split('-').map(Number);
    
    // Obtener activos elegibles para depreciación
    const assets = await this.prisma.fixedAsset.findMany({
      where: {
        status: 'ACTIVE',
        depreciationStartDate: { lte: new Date(year, month - 1, 1) },
      },
      include: {
        category: true,
      },
    });

    const calculations = assets.map(asset => {
      let depreciationAmount = 0;

      switch (asset.depreciationMethod) {
        case 'LINEAL':
          depreciationAmount = asset.depreciableBase / asset.usefulLifeMonths;
          break;
        
        case 'ACELERADA':
          depreciationAmount = asset currentValue * asset.depreciationRate / 12;
          break;
        
        case 'SUMA_DIGITOS':
          // Implementar método de suma de dígitos
          const n = asset.usefulLifeYears;
          const sumDigits = (n * (n + 1)) / 2;
          const yearsRemaining = asset.usefulLifeYears - this.getYearsDepreciated(asset);
          depreciationAmount = (asset.depreciableBase * yearsRemaining) / (sumDigits * 12);
          break;
        
        default:
          depreciationAmount = asset.depreciableBase / asset.usefulLifeMonths;
      }

      // Verificar que no exceda el valor depreciable
      const maxDepreciation = asset.depreciableBase - asset.accumulatedDepreciation;
      if (depreciationAmount > maxDepreciation) {
        depreciationAmount = maxDepreciation;
      }

      return {
        assetId: asset.id,
        assetCode: asset.code,
        assetName: asset.name,
        period,
        depreciationAmount,
        accumulatedDepreciation: asset.accumulatedDepreciation + depreciationAmount,
        bookValue: asset.currentValue - depreciationAmount,
        isFullyDepreciated: depreciationAmount >= maxDepreciation,
      };
    });

    return {
      period,
      totalDepreciation: calculations.reduce((sum, c) => sum + c.depreciationAmount, 0),
      assetsCount: calculations.length,
      calculations,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EJECUTAR DEPRECIACIÓN DEL PERÍODO
  // ───────────────────────────────────────────────────────────────────────────
  
  async ejecutarDepreciacion(period: string, userId: string) {
    const [month, year] = period.split('-').map(Number);
    const calculations = await this.calcularDepreciacion(period);

    if (calculations.assetsCount === 0) {
      return { message: 'No hay activos para depreciar en este período', entries: [] };
    }

    const entries = [];

    // Procesar cada activo en transacción
    for (const calc of calculations.calculations) {
      const asset = await this.prisma.fixedAsset.findUnique({
        where: { id: calc.assetId },
        include: { category: true },
      });

      // Crear registro de depreciación
      const depreciation = await this.prisma.assetDepreciation.create({
        data: {
          assetId: calc.assetId,
          period,
          year,
          month,
          depreciationAmount: calc.depreciationAmount,
          accumulatedDepreciation: calc.accumulatedDepreciation,
          bookValue: calc.bookValue,
          status: 'PENDING',
        },
      });

      // Crear asiento contable
      const journalEntry = await this.contabilidadService.createEntry({
        date: new Date(year, month - 1, 31),
        description: `Depreciación ${asset.name} - ${period}`,
        reference: depreciation.id,
        sourceModule: 'activos-fijos',
        sourceId: asset.id,
        createdBy: userId,
        items: [
          {
            accountCode: asset.category.expenseAccountId,
            debit: calc.depreciationAmount,
            credit: 0,
            description: `Gasto depreciación ${asset.name}`,
          },
          {
            accountCode: asset.category.depreciationAccountId,
            debit: 0,
            credit: calc.depreciationAmount,
            description: `Depreciación acumulada ${asset.name}`,
          },
        ],
      });

      // Actualizar activo
      await this.prisma.fixedAsset.update({
        where: { id: calc.assetId },
        data: {
          accumulatedDepreciation: calc.accumulatedDepreciation,
          currentValue: calc.bookValue,
          lastDepreciationDate: new Date(),
          status: calc.isFullyDepreciated ? 'FULLY_DEPRECIATED' : 'ACTIVE',
        },
      });

      // Actualizar depreciación con asiento
      await this.prisma.assetDepreciation.update({
        where: { id: depreciation.id },
        data: {
          journalEntryId: journalEntry.id,
          status: 'POSTED',
          postedAt: new Date(),
        },
      });

      entries.push({
        assetId: calc.assetId,
        assetName: asset.name,
        depreciationAmount: calc.depreciationAmount,
        journalEntryId: journalEntry.id,
      });
    }

    return {
      period,
      totalDepreciation: calculations.totalDepreciation,
      assetsProcessed: entries.length,
      entries,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR BAJA DE ACTIVO
  // ───────────────────────────────────────────────────────────────────────────
  
  async registrarBaja(assetId: string, dto: RegistrarBajaDto, userId: string) {
    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id: assetId },
      include: { category: true },
    });

    if (!asset) {
      throw new NotFoundException('Activo no encontrado');
    }

    if (asset.status !== 'ACTIVE' && asset.status !== 'FULLY_DEPRECIATED') {
      throw new BadRequestException('El activo no está disponible para baja');
    }

    // Calcular ganancia o pérdida
    const bookValue = asset.currentValue;
    const salePrice = dto.salePrice || 0;
    const gainLoss = salePrice - bookValue;

    // Crear registro de baja
    const disposal = await this.prisma.assetDisposal.create({
      data: {
        assetId,
        date: dto.date || new Date(),
        type: dto.type,
        reason: dto.reason,
        description: dto.description,
        salePrice,
        bookValue,
        gainLoss,
      },
    });

    // Crear asiento contable de baja
    const journalEntry = await this.contabilidadService.createEntry({
      date: dto.date || new Date(),
      description: `Baja de activo ${asset.name} - ${dto.type}`,
      reference: disposal.id,
      sourceModule: 'activos-fijos',
      sourceId: assetId,
      createdBy: userId,
      items: [
        // Dar de baja el activo
        {
          accountCode: asset.category.depreciationAccountId,
          debit: asset.accumulatedDepreciation,
          credit: 0,
          description: 'Depreciación acumulada',
        },
        // Si hay pérdida
        ...(gainLoss < 0 ? [{
          accountCode: '5.03.01', // Pérdida en venta de activos
          debit: Math.abs(gainLoss),
          credit: 0,
          description: 'Pérdida en baja de activo',
        }] : []),
        // Si hay ganancia
        ...(gainLoss > 0 ? [{
          accountCode: '4.02.01', // Ganancia en venta de activos
          debit: 0,
          credit: gainLoss,
          description: 'Ganancia en baja de activo',
        }] : []),
        // Crédito al activo
        {
          accountCode: asset.category.assetAccountId,
          debit: 0,
          credit: asset.acquisitionCost,
          description: 'Baja de activo',
        },
        // Si es venta, débito a banco/caja
        ...(dto.type === 'SALE' ? [{
          accountCode: '1.01.01', // Caja o banco
          debit: salePrice,
          credit: 0,
          description: 'Cobro por venta de activo',
        }] : []),
      ],
    });

    // Actualizar activo
    await this.prisma.fixedAsset.update({
      where: { id: assetId },
      data: {
        status: 'DISPOSED',
        updatedAt: new Date(),
      },
    });

    // Actualizar baja con asiento
    await this.prisma.assetDisposal.update({
      where: { id: disposal.id },
      data: {
        journalEntryId: journalEntry.id,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    return {
      disposal,
      journalEntry,
      gainLoss,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async generateAssetCode(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.fixedAsset.findFirst({
      where: { code: { startsWith: `ACT-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const num = last ? parseInt(last.code.split('-')[2]) + 1 : 1;
    return `ACT-${year}-${num.toString().padStart(4, '0')}`;
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
  }

  private getYearsDepreciated(asset: any): number {
    if (!asset.lastDepreciationDate) return 0;
    const startDate = new Date(asset.depreciationStartDate);
    const lastDate = new Date(asset.lastDepreciationDate);
    return (lastDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  async getLibroActivos() {
    const assets = await this.prisma.fixedAsset.findMany({
      where: { status: { in: ['ACTIVE', 'FULLY_DEPRECIATED'] } },
      include: {
        category: true,
        location: true,
        depreciations: {
          orderBy: { period: 'desc' },
          take: 1,
        },
      },
      orderBy: { code: 'asc' },
    });

    return assets.map(asset => ({
      code: asset.code,
      name: asset.name,
      category: asset.category.name,
      location: asset.location?.name,
      acquisitionDate: asset.acquisitionDate,
      acquisitionCost: asset.acquisitionCost,
      accumulatedDepreciation: asset.accumulatedDepreciation,
      currentValue: asset.currentValue,
      usefulLifeYears: asset.usefulLifeYears,
      depreciationMethod: asset.depreciationMethod,
      status: asset.status,
    }));
  }

  async getDepreciacionEjercicio(year: number) {
    const depreciations = await this.prisma.assetDepreciation.groupBy({
      by: ['year', 'month'],
      where: { year },
      _sum: {
        depreciationAmount: true,
      },
      orderBy: { month: 'asc' },
    });

    const byMonth = depreciations.map(d => ({
      year: d.year,
      month: d.month,
      totalDepreciation: d._sum.depreciationAmount || 0,
    }));

    return {
      year,
      totalAnual: byMonth.reduce((sum, m) => sum + m.totalDepreciation, 0),
      byMonth,
    };
  }

  async getActivosVencidos() {
    const now = new Date();
    
    const assets = await this.prisma.fixedAsset.findMany({
      where: {
        status: 'ACTIVE',
        usefulLifeYears: {
          lte: this.getYearsSinceAcquisition(),
        },
      },
      include: { category: true },
    });

    return {
      count: assets.length,
      assets: assets.map(a => ({
        code: a.code,
        name: a.name,
        category: a.category.name,
        acquisitionDate: a.acquisitionDate,
        usefulLifeYears: a.usefulLifeYears,
        currentValue: a.currentValue,
      })),
    };
  }

  private getYearsSinceAcquisition(): number {
    // Implementar según lógica de negocio
    return 0;
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Depreciación Mensual**: Calcular y postear cada mes
2. **Valor Residual**: No depreciar por debajo del valor residual
3. **Bajas**: Requieren aprobación y generan asiento automático
4. **Revaluaciones**: Solo por tasadores certificados
5. **Vida Útil**: No cambiar sin justificación válida
6. **Activos Fully Depreciated**: No seguir depreciando
7. **Auditoría**: Todos los movimientos quedan registrados

---

## 📁 Archivos del Módulo

```
01-modulo-administrativo/
├── contabilidad.md
├── tesoreria.md
├── finanzas.md
├── presupuesto.md
├── activos-fijos.md (este archivo)
├── impuestos.md
└── rrhh/
    └── empleados.md
```

**Anterior**: `01-administrativo/presupuesto.md` | **Siguiente**: `01-administrativo/impuestos.md`
