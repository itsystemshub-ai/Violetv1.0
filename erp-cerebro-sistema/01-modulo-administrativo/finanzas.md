# Módulo 01: ADMINISTRATIVO - Finanzas y Estados Financieros

## Descripción

Módulo de gestión financiera que incluye estados financieros, análisis financiero, ratios, flujo de efectivo y reportes ejecutivos para la toma de decisiones.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad  → Asientos, cuentas           │
│  01-administrativo/tesoreria     → Flujo de caja, bancos       │
│  01-administrativo/presupuesto   → Presupuesto vs Real         │
├─────────────────────────────────────────────────────────────────┤
│  02-operativo/inventario         → Valoración de inventario    │
│  02-operativo/compras            → Cuentas por pagar           │
├─────────────────────────────────────────────────────────────────┤
│  03-comercial/ventas             → Ingresos, cuentas por cobrar│
├─────────────────────────────────────────────────────────────────┤
│  06-reportes/dashboard           → KPIs financieros            │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. Estados financieros **CONSOLIDAN** datos de contabilidad
2. Análisis financiero **COMPARA** presupuesto vs real
3. Ratios financieros **EVALÚAN** salud de la empresa
4. Proyecciones **PRONOSTICAN** flujo de caja futuro

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// ESTADOS FINANCIEROS
// ─────────────────────────────────────────────────────────────────────────────

model FinancialStatement {
  id          String   @id @default(cuid())
  type        StatementType // BALANCE_GENERAL, ESTADO_RESULTADOS, FLUJO_EFECTIVO
  period      String   // MM-YYYY
  date        DateTime
  
  // Datos en JSON estructurado
  data        Json
  
  // Estado
  status      String   @default("DRAFT") // DRAFT, REVIEW, APPROVED, PUBLISHED
  
  // Auditoría
  preparedBy  String?
  reviewedBy  String?
  approvedBy  String?
  approvedAt  DateTime?
  
  // Archivo
  pdfUrl      String?
  excelUrl    String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([type])
  @@index([period])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────────────────
// RATIOS FINANCIEROS
// ─────────────────────────────────────────────────────────────────────────────

model FinancialRatio {
  id          String   @id @default(cuid())
  type        RatioType // LIQUIDEZ, GESTION, ENDEUDAMIENTO, RENTABILIDAD
  name        String   // ej. "Liquidez Corriente", "ROE", "ROA"
  formula     String   // Fórmula del ratio
  
  // Valores
  value       Float
  benchmark   Float?   // Valor de referencia del sector
  unit        String   @default("%") // %, veces, días
  
  // Período
  period      String   // MM-YYYY
  date        DateTime
  
  // Análisis
  interpretation String? // Interpretación del resultado
  recommendation String? // Recomendación basada en el resultado
  
  createdAt   DateTime @default(now())

  @@index([type])
  @@index([period])
}

// ─────────────────────────────────────────────────────────────────────────────
// ANÁLISIS DE VARIANZAS
// ─────────────────────────────────────────────────────────────────────────────

model VarianceAnalysis {
  id          String   @id @default(cuid())
  period      String   // MM-YYYY
  
  // Cuenta o concepto
  accountId   String?
  account     Account? @relation(fields: [accountId], references: [id])
  concept     String?
  
  // Valores
  budgeted    Float    // Presupuestado
  actual      Float    // Real
  variance    Float    // Varianza (actual - budgeted)
  variancePercent Float // Varianza porcentual
  
  // Análisis
  explanation String? // Explicación de la varianza
  actionPlan  String? // Plan de acción
  
  createdAt   DateTime @default(now())

  @@index([period])
  @@index([accountId])
}

// ─────────────────────────────────────────────────────────────────────────────
// PROYECCIONES FINANCIERAS
// ─────────────────────────────────────────────────────────────────────────────

model FinancialProjection {
  id          String   @id @default(cuid())
  type        ProjectionType // VENTAS, GASTOS, FLUJO_CAJA, RESULTADOS
  period      String   // MM-YYYY
  
  // Datos de proyección
  projected   Float
  conservative Float   // Escenario conservador
  optimistic  Float    // Escenario optimista
  pessimistic Float    // Escenario pesimista
  
  // Supuestos
  assumptions Json     // Supuestos de la proyección
  
  // Método
  method      String   // ej. "PROMEDIO_MOVIL", "REGRESION", "TREND"
  confidence  Float?   // % de confianza
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([type])
  @@index([period])
}

// ─────────────────────────────────────────────────────────────────────────────
// PUNTO DE EQUILIBRIO
// ─────────────────────────────────────────────────────────────────────────────

model BreakEvenAnalysis {
  id          String   @id @default(cuid())
  period      String   // MM-YYYY
  
  // Costos
  fixedCosts  Float    // Costos fijos totales
  variableCosts Float  // Costos variables totales
  
  // Ventas
  totalSales  Float    // Ventas totales
  contributionMargin Float // Margen de contribución
  
  // Resultados
  breakEvenPoint Float  // Punto de equilibrio en ventas
  breakEvenUnits Float  // Punto de equilibrio en unidades
  marginOfSafety Float  // Margen de seguridad
  
  // Análisis
  interpretation String?
  
  createdAt   DateTime @default(now())

  @@index([period])
}

// ─────────────────────────────────────────────────────────────────────────────
// FLUJO DE EFECTIVO DIRECTO/INDIRECTO
// ─────────────────────────────────────────────────────────────────────────────

model CashFlowStatement {
  id          String   @id @default(cuid())
  period      String   // MM-YYYY
  method      String   @default("INDIRECT") // DIRECT, INDIRECT
  
  // Actividades de operación
  operatingActivities Json
  
  // Actividades de inversión
  investingActivities Json
  
  // Actividades de financiamiento
  financingActivities Json
  
  // Resultados
  netCashFlow Float    // Flujo neto de efectivo
  openingBalance Float // Saldo inicial
  closingBalance Float // Saldo final
  
  // Auditoría
  preparedBy  String?
  approvedBy  String?
  
  createdAt   DateTime @default(now())

  @@index([period])
}

// ─────────────────────────────────────────────────────────────────────────────
// INDICADORES DE GESTIÓN (KPIs Financieros)
// ─────────────────────────────────────────────────────────────────────────────

model FinancialKPI {
  id          String   @id @default(cuid())
  name        String   // ej. "ROI", "ROE", "EBITDA"
  category    String   // RENTABILIDAD, LIQUIDEZ, GESTION, ENDEUDAMIENTO
  
  // Valores
  value       Float
  target      Float    // Meta
  previous    Float    // Período anterior
  
  // Cálculo
  formula     String
  frequency   String   // MONTHLY, QUARTERLY, YEARLY
  
  // Estado
  status      String   @default("ON_TRACK") // ON_TRACK, WARNING, CRITICAL
  
  period      String   // MM-YYYY
  date        DateTime
  
  createdAt   DateTime @default(now())

  @@index([category])
  @@index([period])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum StatementType {
  BALANCE_GENERAL
  ESTADO_RESULTADOS
  FLUJO_EFECTIVO
  CAMBIOS_PATRIMONIO
}

enum RatioType {
  LIQUIDEZ
  GESTION
  ENDEUDAMIENTO
  RENTABILIDAD
}

enum ProjectionType {
  VENTAS
  GASTOS
  FLUJO_CAJA
  RESULTADOS
  INVERSION
}
```

---

## 📡 Endpoints de la API

### Controller de Finanzas

```typescript
// apps/backend/src/modules/finanzas/finanzas.controller.ts

import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { FinanzasService } from './finanzas.service';

@Controller('finanzas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanzasController {
  constructor(private finanzasService: FinanzasService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // ESTADOS FINANCIEROS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('estado-resultados')
  @RequirePermissions('finanzas:read')
  async getEstadoResultados(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.finanzasService.getEstadoResultados(new Date(from), new Date(to));
  }

  @Get('balance-general')
  @RequirePermissions('finanzas:read')
  async getBalanceGeneral(@Query('date') date?: string) {
    return this.finanzasService.getBalanceGeneral(date ? new Date(date) : new Date());
  }

  @Get('flujo-efectivo')
  @RequirePermissions('finanzas:read')
  async getFlujoEfectivo(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('method') method?: 'DIRECT' | 'INDIRECT',
  ) {
    return this.finanzasService.getFlujoEfectivo(
      new Date(from),
      new Date(to),
      method || 'INDIRECT',
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RATIOS FINANCIEROS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('ratios')
  @RequirePermissions('finanzas:read')
  async getRatios(@Query('period') period?: string) {
    return this.finanzasService.getRatios(period || this.getCurrentPeriod());
  }

  @Get('ratios/liquidez')
  @RequirePermissions('finanzas:read')
  async getRatiosLiquidez(@Query('period') period?: string) {
    return this.finanzasService.getRatiosPorTipo('LIQUIDEZ', period);
  }

  @Get('ratios/gestion')
  @RequirePermissions('finanzas:read')
  async getRatiosGestion(@Query('period') period?: string) {
    return this.finanzasService.getRatiosPorTipo('GESTION', period);
  }

  @Get('ratios/endudamiento')
  @RequirePermissions('finanzas:read')
  async getRatiosEndeudamiento(@Query('period') period?: string) {
    return this.finanzasService.getRatiosPorTipo('ENDEUDAMIENTO', period);
  }

  @Get('ratios/rentabilidad')
  @RequirePermissions('finanzas:read')
  async getRatiosRentabilidad(@Query('period') period?: string) {
    return this.finanzasService.getRatiosPorTipo('RENTABILIDAD', period);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ANÁLISIS DE VARIANZAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('varianzas')
  @RequirePermissions('finanzas:read')
  async getVarianzas(@Query('period') period?: string) {
    return this.finanzasService.getVarianzas(period || this.getCurrentPeriod());
  }

  @Post('varianzas/analizar')
  @RequirePermissions('finanzas:create')
  async analizarVarianzas(@Body() dto: AnalizarVarianzasDto) {
    return this.finanzasService.analizarVarianzas(dto);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROYECCIONES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('proyecciones')
  @RequirePermissions('finanzas:read')
  async getProyecciones(
    @Query('type') type?: ProjectionType,
    @Query('months') months?: number,
  ) {
    return this.finanzasService.getProyecciones(type, parseInt(months?.toString() || '12'));
  }

  @Post('proyecciones/calcular')
  @RequirePermissions('finanzas:create')
  async calcularProyecciones(@Body() dto: CalcularProyeccionDto) {
    return this.finanzasService.calcularProyecciones(dto);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PUNTO DE EQUILIBRIO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('punto-equilibrio')
  @RequirePermissions('finanzas:read')
  async getPuntoEquilibrio(@Query('period') period?: string) {
    return this.finanzasService.getPuntoEquilibrio(period || this.getCurrentPeriod());
  }

  @Post('punto-equilibrio/calcular')
  @RequirePermissions('finanzas:create')
  async calcularPuntoEquilibrio(@Body() dto: CalcularPuntoEquilibrioDto) {
    return this.finanzasService.calcularPuntoEquilibrio(dto);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // KPIS FINANCIEROS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('kpis')
  @RequirePermissions('finanzas:read')
  async getKPIs(@Query('period') period?: string) {
    return this.finanzasService.getKPIs(period || this.getCurrentPeriod());
  }

  @Get('kpis/ebitda')
  @RequirePermissions('finanzas:read')
  async getEBITDA(@Query('period') period?: string) {
    return this.finanzasService.getEBITDA(period);
  }

  @Get('kpis/roi')
  @RequirePermissions('finanzas:read')
  async getROI(@Query('period') period?: string) {
    return this.finanzasService.getROI(period);
  }

  @Get('kpis/roe')
  @RequirePermissions('finanzas:read')
  async getROE(@Query('period') period?: string) {
    return this.finanzasService.getROE(period);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/analisis-horizontal')
  @RequirePermissions('reportes-finanzas:read')
  async getAnalisisHorizontal(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.finanzasService.getAnalisisHorizontal(new Date(from), new Date(to));
  }

  @Get('reportes/analisis-vertical')
  @RequirePermissions('reportes-finanzas:read')
  async getAnalisisVertical(@Query('date') date?: string) {
    return this.finanzasService.getAnalisisVertical(date ? new Date(date) : new Date());
  }

  @Get('reportes/capital-trabajo')
  @RequirePermissions('reportes-finanzas:read')
  async getCapitalTrabajo() {
    return this.finanzasService.getCapitalTrabajo();
  }
}
```

---

## 🧩 Servicio de Finanzas

### Funciones Principales

```typescript
// apps/backend/src/modules/finanzas/finanzas.service.ts

@Injectable()
export class FinanzasService {
  constructor(private prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // ESTADO DE RESULTADOS
  // ───────────────────────────────────────────────────────────────────────────
  
  async getEstadoResultados(from: Date, to: Date) {
    // Ingresos operativos
    const ingresos = await this.prisma.journalEntryItem.aggregate({
      where: {
        account: { type: 'INGRESO' },
        journalEntry: { date: { gte: from, lte: to } },
      },
      _sum: { credit: true },
    });

    // Costos de venta
    const costos = await this.prisma.journalEntryItem.aggregate({
      where: {
        account: { code: { startsWith: '5.01' } }, // Cuenta de costos
        journalEntry: { date: { gte: from, lte: to } },
      },
      _sum: { debit: true },
    });

    // Utilidad bruta
    const utilidadBruta = (ingresos._sum.credit || 0) - (costos._sum.debit || 0);
    const margenBruto = (ingresos._sum.credit || 0) > 0
      ? (utilidadBruta / (ingresos._sum.credit || 0)) * 100
      : 0;

    // Gastos operativos
    const gastosOperativos = await this.prisma.journalEntryItem.aggregate({
      where: {
        account: { code: { startsWith: '5.02' } }, // Gastos operativos
        journalEntry: { date: { gte: from, lte: to } },
      },
      _sum: { debit: true },
    });

    // Utilidad operativa (EBIT)
    const utilidadOperativa = utilidadBruta - (gastosOperativos._sum.debit || 0);
    const margenOperativo = (ingresos._sum.credit || 0) > 0
      ? (utilidadOperativa / (ingresos._sum.credit || 0)) * 100
      : 0;

    // Otros ingresos/gastos
    const otrosIngresos = await this.prisma.journalEntryItem.aggregate({
      where: {
        account: { code: { startsWith: '4.02' } },
        journalEntry: { date: { gte: from, lte: to } },
      },
      _sum: { credit: true },
    });

    const otrosGastos = await this.prisma.journalEntryItem.aggregate({
      where: {
        account: { code: { startsWith: '5.03' } },
        journalEntry: { date: { gte: from, lte: to } },
      },
      _sum: { debit: true },
    });

    // Utilidad antes de impuestos (EBT)
    const utilidadAntesImpuestos = utilidadOperativa + (otrosIngresos._sum.credit || 0) - (otrosGastos._sum.debit || 0);

    // Impuestos (ISLR)
    const impuestos = await this.prisma.journalEntryItem.aggregate({
      where: {
        account: { code: { startsWith: '5.04' } },
        journalEntry: { date: { gte: from, lte: to } },
      },
      _sum: { debit: true },
    });

    // Utilidad neta
    const utilidadNeta = utilidadAntesImpuestos - (impuestos._sum.debit || 0);
    const margenNeto = (ingresos._sum.credit || 0) > 0
      ? (utilidadNeta / (ingresos._sum.credit || 0)) * 100
      : 0;

    // EBITDA
    const ebitda = utilidadOperativa + (gastosOperativos._sum.debit || 0) * 0.1; // Simplificado

    return {
      period: { from, to },
      ingresos: ingresos._sum.credit || 0,
      costos: costos._sum.debit || 0,
      utilidadBruta,
      margenBruto: parseFloat(margenBruto.toFixed(2)),
      gastosOperativos: gastosOperativos._sum.debit || 0,
      utilidadOperativa,
      margenOperativo: parseFloat(margenOperativo.toFixed(2)),
      ebitda,
      utilidadAntesImpuestos,
      impuestos: impuestos._sum.debit || 0,
      utilidadNeta,
      margenNeto: parseFloat(margenNeto.toFixed(2)),
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // BALANCE GENERAL
  // ───────────────────────────────────────────────────────────────────────────
  
  async getBalanceGeneral(date: Date) {
    // Activos
    const activos = await this.getSaldoCuentasPorTipo('ACTIVO', date);
    const activosCorrientes = await this.getSaldoCuentasPorNivel('ACTIVO', 2, date, '1.01');
    const activosNoCorrientes = await this.getSaldoCuentasPorNivel('ACTIVO', 2, date, '1.02');

    // Pasivos
    const pasivos = await this.getSaldoCuentasPorTipo('PASIVO', date);
    const pasivosCorrientes = await this.getSaldoCuentasPorNivel('PASIVO', 2, date, '2.01');
    const pasivosNoCorrientes = await this.getSaldoCuentasPorNivel('PASIVO', 2, date, '2.02');

    // Patrimonio
    const patrimonio = await this.getSaldoCuentasPorTipo('PATRIMONIO', date);

    // Validar ecuación contable
    const totalActivos = Object.values(activos).reduce((sum, val) => sum + val, 0);
    const totalPasivos = Object.values(pasivos).reduce((sum, val) => sum + val, 0);
    const totalPatrimonio = Object.values(patrimonio).reduce((sum, val) => sum + val, 0);

    const ecuacionContable = Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) < 0.01;

    return {
      date,
      activos: {
        corrientes: activosCorrientes,
        noCorrientes: activosNoCorrientes,
        total: totalActivos,
      },
      pasivos: {
        corrientes: pasivosCorrientes,
        noCorrientes: pasivosNoCorrientes,
        total: totalPasivos,
      },
      patrimonio,
      totalPatrimonio,
      ecuacionContable,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FLUJO DE EFECTIVO (Método Indirecto)
  // ───────────────────────────────────────────────────────────────────────────
  
  async getFlujoEfectivo(from: Date, to: Date, method: 'DIRECT' | 'INDIRECT' = 'INDIRECT') {
    const utilidadNeta = await this.getUtilidadNeta(from, to);

    // Ajustes por partidas no monetarias
    const depreciacion = await this.getDepreciacion(from, to);
    const amortizacion = await this.getAmortizacion(from, to);

    // Cambios en capital de trabajo
    const cambiosCxC = await this.getCambiosCuenta('ACTIVO', '1.01.02', from, to); // Clientes
    const cambiosInventario = await this.getCambiosCuenta('ACTIVO', '1.01.03', from, to); // Inventario
    const cambiosCxP = await this.getCambiosCuenta('PASIVO', '2.01.01', from, to); // Proveedores

    // Flujo de actividades de operación
    const flujoOperacion = utilidadNeta + depreciacion + amortizacion - cambiosCxC - cambiosInventario + cambiosCxP;

    // Actividades de inversión
    const compraActivoFijo = await this.getCompraActivoFijo(from, to);
    const ventaActivoFijo = await this.getVentaActivoFijo(from, to);
    const flujoInversion = ventaActivoFijo - compraActivoFijo;

    // Actividades de financiamiento
    const captacionCredito = await this.getCaptacionCredito(from, to);
    const pagoCredito = await this.getPagoCredito(from, to);
    const pagoDividendos = await this.getPagoDividendos(from, to);
    const flujoFinanciamiento = captacionCredito - pagoCredito - pagoDividendos;

    // Flujo neto de efectivo
    const flujoNeto = flujoOperacion + flujoInversion + flujoFinanciamiento;

    // Saldos de efectivo
    const saldoInicial = await this.getSaldoEfectivo(from);
    const saldoFinal = saldoInicial + flujoNeto;

    return {
      period: { from, to },
      method,
      actividades: {
        operacion: {
          utilidadNeta,
          ajustes: {
            depreciacion,
            amortizacion,
          },
          cambiosCapitalTrabajo: {
            cuentasPorCobrar: cambiosCxC,
            inventarios: cambiosInventario,
            cuentasPorPagar: cambiosCxP,
          },
          total: flujoOperacion,
        },
        inversion: {
          compraActivoFijo,
          ventaActivoFijo,
          total: flujoInversion,
        },
        financiamiento: {
          captacionCredito,
          pagoCredito,
          pagoDividendos,
          total: flujoFinanciamiento,
        },
      },
      flujoNeto,
      saldoInicial,
      saldoFinal,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RATIOS FINANCIEROS
  // ───────────────────────────────────────────────────────────────────────────
  
  async getRatios(period: string) {
    const [month, year] = period.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Obtener datos del balance
    const balance = await this.getBalanceGeneral(endDate);
    const estadoResultados = await this.getEstadoResultados(date, endDate);

    // Ratios de liquidez
    const liquidezCorriente = balance.activos.corrientes / balance.pasivos.corrientes;
    const liquidezSeca = (balance.activos.corrientes - balance.activos.noCorrientes.inventario) / balance.pasivos.corrientes;

    // Ratios de gestión
    const rotacionInventario = estadoResultados.costos / ((balance.activos.noCorrientes.inventario || 1));
    const diasCobranza = (balance.activos.corrientes.cuentasPorCobrar * 30) / estadoResultados.ingresos;

    // Ratios de endeudamiento
    const endeudamientoTotal = (balance.pasivos.total / balance.activos.total) * 100;
    const coberturaIntereses = estadoResultados.utilidadOperativa / 1; // Simplificado

    // Ratios de rentabilidad
    const roe = (estadoResultados.utilidadNeta / balance.totalPatrimonio) * 100;
    const roa = (estadoResultados.utilidadNeta / balance.activos.total) * 100;
    const margenNeto = estadoResultados.margenNeto;

    return {
      period,
      liquidez: {
        corriente: parseFloat(liquidezCorriente.toFixed(2)),
        seca: parseFloat(liquidezSeca.toFixed(2)),
        interpretacion: liquidezCorriente >= 1.5 ? 'Óptima' : liquidezCorriente >= 1 ? 'Aceptable' : 'Deficiente',
      },
      gestion: {
        rotacionInventario: parseFloat(rotacionInventario.toFixed(2)),
        diasCobranza: parseFloat(diasCobranza.toFixed(1)),
      },
      endeudamiento: {
        total: parseFloat(endeudamientoTotal.toFixed(2)),
        interpretacion: endeudamientoTotal <= 50 ? 'Óptimo' : endeudamientoTotal <= 70 ? 'Aceptable' : 'Alto',
      },
      rentabilidad: {
        roe: parseFloat(roe.toFixed(2)),
        roa: parseFloat(roa.toFixed(2)),
        margenNeto,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PUNTO DE EQUILIBRIO
  // ───────────────────────────────────────────────────────────────────────────
  
  async getPuntoEquilibrio(period: string) {
    const [month, year] = period.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Obtener costos fijos (cuentas de gastos fijos)
    const costosFijos = await this.getCostosFijos(date, endDate);

    // Obtener costos variables
    const costosVariables = await this.getCostosVariables(date, endDate);

    // Obtener ventas
    const ventas = await this.getVentasTotales(date, endDate);

    // Margen de contribución
    const margenContribucion = ventas - costosVariables;
    const ratioMargenContribucion = (margenContribucion / ventas) * 100;

    // Punto de equilibrio
    const puntoEquilibrioVentas = costosFijos / (ratioMargenContribucion / 100);
    const margenSeguridad = ((ventas - puntoEquilibrioVentas) / ventas) * 100;

    return {
      period,
      costosFijos,
      costosVariables,
      ventas,
      margenContribucion,
      ratioMargenContribucion: parseFloat(ratioMargenContribucion.toFixed(2)),
      puntoEquilibrioVentas,
      margenSeguridad: parseFloat(margenSeguridad.toFixed(2)),
      interpretacion: margenSeguridad > 20 ? 'Bueno' : margenSeguridad > 10 ? 'Regular' : 'Riesgoso',
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ANÁLISIS HORIZONTAL
  // ───────────────────────────────────────────────────────────────────────────
  
  async getAnalisisHorizontal(from: Date, to: Date) {
    const period1 = await this.getEstadoResultados(from, to);
    const period2 = await this.getEstadoResultados(
      new Date(from.getTime() - (to.getTime() - from.getTime())),
      from,
    );

    const analisis = Object.entries(period1).map(([key, value]) => {
      if (typeof value !== 'number') return null;
      
      const previous = period2[key as keyof typeof period2] as number || 0;
      const variance = value - previous;
      const variancePercent = previous > 0 ? (variance / previous) * 100 : 0;

      return {
        concept: key,
        current: value,
        previous,
        variance,
        variancePercent: parseFloat(variancePercent.toFixed(2)),
        trend: variance > 0 ? 'UP' : variance < 0 ? 'DOWN' : 'STABLE',
      };
    }).filter(Boolean);

    return {
      period: { from, to },
      analisis,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async getSaldoCuentasPorTipo(type: string, date: Date) {
    const accounts = await this.prisma.account.findMany({
      where: { type, isActive: true },
      include: {
        journalEntries: {
          where: {
            journalEntry: {
              date: { lte: date },
              status: 'POSTED',
            },
          },
        },
      },
    });

    const balances: Record<string, number> = {};
    accounts.forEach(account => {
      const balance = account.journalEntries.reduce((sum, item) => {
        return sum + (item.debit - item.credit);
      }, 0);
      balances[account.code] = Math.abs(balance);
    });

    return balances;
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Ecuación Contable**: Activo = Pasivo + Patrimonio (debe cuadrar)
2. **Ratios**: Calcular mensualmente con datos reales
3. **Proyecciones**: Mínimo 3 escenarios (conservador, optimista, pesimista)
4. **Punto Equilibrio**: Actualizar cuando cambien costos fijos
5. **Flujo Efectivo**: Método indirecto es el estándar
6. **Auditoría**: Estados financieros requieren aprobación
7. **Consistencia**: Métodos de cálculo no deben cambiar sin justificación

---

## 📁 Archivos del Módulo

```
01-modulo-administrativo/
├── contabilidad.md
├── tesoreria.md
├── finanzas.md (este archivo)
├── presupuesto.md
├── activos-fijos.md
├── impuestos.md
└── rrhh/
    └── empleados.md
```

**Anterior**: `01-administrativo/tesoreria.md` | **Siguiente**: `01-administrativo/presupuesto.md`
