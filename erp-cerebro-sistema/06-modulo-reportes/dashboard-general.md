# Módulo 06: REPORTES - Dashboard General y BI

## Descripción

Módulo de Business Intelligence (BI) con dashboards consolidados, KPIs en tiempo real, gráficos avanzados y reportes ejecutales para la toma de decisiones.

## 🔗 Conexiones con Todos los Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    FUENTES DE DATOS                             │
├─────────────────────────────────────────────────────────────────┤
│ 01-administrativo/contabilidad  → Estados financieros          │
│ 01-administrativo/tesoreria     → Flujo de caja, bancos        │
│ 01-administrativo/rrhh          → Nómina, empleados            │
├─────────────────────────────────────────────────────────────────┤
│ 02-operativo/inventario         → Stock, rotación              │
│ 02-operativo/compras            → Compras, proveedores         │
│ 02-operativo/produccion         → Producción, costos           │
├─────────────────────────────────────────────────────────────────┤
│ 03-comercial/ventas             → Ventas, clientes             │
│ 03-comercial/crm                → Leads, pipeline              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  06-reportes        │
                    │  - Dashboard        │
                    │  - KPIs             │
                    │  - Gráficos         │
                    │  - Exportación      │
                    └─────────────────────┘
```

**Regla Crítica**: Este módulo es SOLO LECTURA. Consolida datos de todos los módulos.

---

## 📊 KPIs Principales del Dashboard

### Estructura de KPIs

```typescript
// lib/dashboard/kpis.ts

export interface DashboardKPIs {
  // ─── VENTAS ──────────────────────────────────────────────────
  ventas: {
    totalMes: number;
    totalAnio: number;
    crecimientoMes: number;
    crecimientoAnio: number;
    ticketPromedio: number;
    clientesNuevos: number;
    productosMasVendidos: Array<{
      productId: string;
      name: string;
      quantity: number;
      revenue: number;
    }>;
  };

  // ─── FINANZAS ────────────────────────────────────────────────
  finanzas: {
    ingresosMes: number;
    gastosMes: number;
    utilidadMes: number;
    margenUtilidad: number;
    cuentasPorCobrar: number;
    cuentasPorPagar: number;
    saldoBancos: number;
    flujoCajaProyectado: number;
  };

  // ─── INVENTARIO ──────────────────────────────────────────────
  inventario: {
    valorTotal: number;
    productosStockBajo: number;
    productosSinStock: number;
    rotacionInventario: number;
    mercanciaObsoleta: number;
  };

  // ─── COMPRAS ─────────────────────────────────────────────────
  compras: {
    totalMes: number;
    ordenesPendientes: number;
    proveedoresActivos: number;
    comprasUrgentes: number;
  };

  // ─── PRODUCCIÓN ──────────────────────────────────────────────
  produccion: {
    ordenesEnProceso: number;
    eficienciaProduccion: number;
    mermas: number;
    costoProduccion: number;
  };

  // ─── RRHH ────────────────────────────────────────────────────
  rrhh: {
    totalEmpleados: number;
    nominaMes: number;
    asistenciaPromedio: number;
    vacacionesPendientes: number;
  };

  // ─── CRM ─────────────────────────────────────────────────────
  crm: {
    totalLeads: number;
    tasaConversion: number;
    oportunidadesActivas: number;
    valorPipeline: number;
  };
}
```

---

## 📡 Endpoints de la API

### Controller de Reportes

```typescript
// apps/backend/src/modules/reportes/reportes.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportesService } from './reportes.service';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private reportesService: ReportesService) {}

  // ─────────────────────────────────────────────────────────────
  // DASHBOARD GENERAL
  // ─────────────────────────────────────────────────────────────
  
  @Get('dashboard')
  async getDashboard(@Query('period') period?: string) {
    return this.reportesService.getDashboard(period || 'month');
  }

  @Get('dashboard/ventas')
  async getDashboardVentas(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportesService.getDashboardVentas(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('dashboard/finanzas')
  async getDashboardFinanzas(@Query('period') period?: string) {
    return this.reportesService.getDashboardFinanzas(period || 'month');
  }

  @Get('dashboard/inventario')
  async getDashboardInventario() {
    return this.reportesService.getDashboardInventario();
  }

  // ─────────────────────────────────────────────────────────────
  // GRÁFICOS
  // ─────────────────────────────────────────────────────────────
  
  @Get('charts/ventas-tendencia')
  async getVentasTendencia(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.reportesService.getVentasTendencia(
      new Date(from),
      new Date(to),
      groupBy || 'day',
    );
  }

  @Get('charts/ventas-categoria')
  async getVentasCategoria(@Query('period') period?: string) {
    return this.reportesService.getVentasCategoria(period || 'month');
  }

  @Get('charts/ingresos-vs-gastos')
  async getIngresosVsGastos(@Query('year') year?: number) {
    return this.reportesService.getIngresosVsGastos(parseInt(year?.toString() || new Date().getFullYear().toString()));
  }

  @Get('charts/flujo-caja')
  async getFlujoCaja(@Query('months') months?: number) {
    return this.reportesService.getFlujoCaja(parseInt(months?.toString() || '12'));
  }

  // ─────────────────────────────────────────────────────────────
  // REPORTES EJECUTIVOS
  // ─────────────────────────────────────────────────────────────
  
  @Get('ejecutivo/estado-resultados')
  async getEstadoResultados(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportesService.getEstadoResultados(new Date(from), new Date(to));
  }

  @Get('ejecutivo/balance-general')
  async getBalanceGeneral(@Query('date') date?: string) {
    return this.reportesService.getBalanceGeneral(date ? new Date(date) : new Date());
  }

  @Get('ejecutivo/flujo-efectivo')
  async getFlujoEfectivo(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportesService.getFlujoEfectivo(new Date(from), new Date(to));
  }

  // ─────────────────────────────────────────────────────────────
  // EXPORTACIÓN
  // ─────────────────────────────────────────────────────────────
  
  @Get('export/dashboard-pdf')
  async exportDashboardPDF(@Query('period') period?: string) {
    return this.reportesService.exportDashboardPDF(period || 'month');
  }

  @Get('export/ventas-excel')
  async exportVentasExcel(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportesService.exportVentasExcel(new Date(from), new Date(to));
  }
}
```

---

## 🧩 Servicio de Reportes

### Funciones Principales

```typescript
// apps/backend/src/modules/reportes/reportes.service.ts

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────
  // DASHBOARD GENERAL
  // ─────────────────────────────────────────────────────────────
  
  async getDashboard(period: string) {
    const now = new Date();
    const [from, to] = this.getPeriodDates(period, now);

    // Obtener todos los KPIs en paralelo
    const [
      ventas,
      finanzas,
      inventario,
      compras,
      produccion,
      rrhh,
      crm,
    ] = await Promise.all([
      this.getVentasKPIs(from, to),
      this.getFinanzasKPIs(from, to),
      this.getInventarioKPIs(),
      this.getComprasKPIs(from, to),
      this.getProduccionKPIs(from, to),
      this.getRRHHKPIs(from, to),
      this.getCRMKPIs(from, to),
    ]);

    return {
      period: { from, to, label: this.getPeriodLabel(period) },
      kpis: {
        ventas,
        finanzas,
        inventario,
        compras,
        produccion,
        rrhh,
        crm,
      },
      summary: {
        totalIngresos: finanzas.ingresosMes,
        totalGastos: finanzas.gastosMes,
        utilidad: finanzas.utilidadMes,
        margen: finanzas.margenUtilidad,
      },
    };
  }

  private async getVentasKPIs(from: Date, to: Date) {
    const [currentPeriod, previousPeriod] = await Promise.all([
      this.getVentasByPeriod(from, to),
      this.getVentasByPeriod(
        new Date(from.getTime() - (to.getTime() - from.getTime())),
        from,
      ),
    ]);

    const totalMes = currentPeriod.total;
    const totalPeriodoAnterior = previousPeriod.total;
    const crecimiento = totalPeriodoAnterior > 0
      ? ((totalMes - totalPeriodoAnterior) / totalPeriodoAnterior) * 100
      : 0;

    const ticketPromedio = currentPeriod.count > 0
      ? totalMes / currentPeriod.count
      : 0;

    const clientesNuevos = await this.prisma.customer.count({
      where: {
        createdAt: { gte: from, lte: to },
      },
    });

    const productosMasVendidos = await this.prisma.$queryRaw`
      SELECT 
        p.id as "productId",
        p.name,
        SUM(si.quantity) as quantity,
        SUM(si.subtotal) as revenue
      FROM "SaleItem" si
      JOIN "Product" p ON si."productId" = p.id
      JOIN "Sale" s ON si."saleId" = s.id
      WHERE s.status = 'INVOICED'
        AND s.date BETWEEN ${from} AND ${to}
      GROUP BY p.id, p.name
      ORDER BY quantity DESC
      LIMIT 10
    `;

    return {
      totalMes,
      crecimientoMes: parseFloat(crecimiento.toFixed(2)),
      ticketPromedio: parseFloat(ticketPromedio.toFixed(2)),
      clientesNuevos,
      productosMasVendidos,
    };
  }

  private async getFinanzasKPIs(from: Date, to: Date) {
    // Ingresos (ventas facturadas)
    const ingresos = await this.prisma.sale.aggregate({
      where: {
        status: 'INVOICED',
        date: { gte: from, lte: to },
      },
      _sum: { subtotal: true },
    });

    // Gastos (compras)
    const gastos = await this.prisma.purchase.aggregate({
      where: {
        date: { gte: from, lte: to },
      },
      _sum: { subtotal: true },
    });

    // Nómina
    const nomina = await this.prisma.payroll.aggregate({
      where: {
        periodStart: { gte: from, lte: to },
        status: 'PAID',
      },
      _sum: { total: true },
    });

    const ingresosMes = ingresos._sum.subtotal || 0;
    const gastosMes = (gastos._sum.subtotal || 0) + (nomina._sum.total || 0);
    const utilidadMes = ingresosMes - gastosMes;
    const margenUtilidad = ingresosMes > 0 ? (utilidadMes / ingresosMes) * 100 : 0;

    // Cuentas por cobrar
    const cuentasPorCobrar = await this.prisma.accountReceivable.aggregate({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      _sum: { balance: true },
    });

    // Cuentas por pagar
    const cuentasPorPagar = await this.prisma.accountPayable.aggregate({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      _sum: { balance: true },
    });

    // Saldo en bancos
    const saldoBancos = await this.prisma.bankAccount.aggregate({
      where: { isActive: true },
      _sum: { balance: true },
    });

    return {
      ingresosMes,
      gastosMes,
      utilidadMes,
      margenUtilidad: parseFloat(margenUtilidad.toFixed(2)),
      cuentasPorCobrar: cuentasPorCobrar._sum.balance || 0,
      cuentasPorPagar: cuentasPorPagar._sum.balance || 0,
      saldoBancos: saldoBancos._sum.balance || 0,
    };
  }

  private async getInventarioKPIs() {
    // Valor total del inventario
    const productos = await this.prisma.product.findMany({
      where: { isActive: true },
    });

    const valorTotal = productos.reduce((sum, p) => sum + (p.stock * p.cost), 0);

    // Stock bajo
    const stockBajo = productos.filter(p => p.stock <= p.minStock).length;

    // Sin stock
    const sinStock = productos.filter(p => p.stock === 0).length;

    // Rotación (ventas / inventario promedio)
    const ventasMes = await this.prisma.saleItem.aggregate({
      where: {
        sale: {
          status: 'INVOICED',
          date: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
        },
      },
      _sum: { subtotal: true },
    });

    const rotacion = valorTotal > 0
      ? (ventasMes._sum.subtotal || 0) / valorTotal
      : 0;

    return {
      valorTotal,
      productosStockBajo: stockBajo,
      productosSinStock: sinStock,
      rotacionInventario: parseFloat(rotacion.toFixed(2)),
    };
  }

  private async getComprasKPIs(from: Date, to: Date) {
    const totalMes = await this.prisma.purchase.aggregate({
      where: {
        date: { gte: from, lte: to },
      },
      _sum: { total: true },
    });

    const ordenesPendientes = await this.prisma.purchaseOrder.count({
      where: { status: { in: ['SENT', 'CONFIRMED', 'PARTIAL'] } },
    });

    const proveedoresActivos = await this.prisma.supplier.count({
      where: {
        isActive: true,
        purchases: {
          some: {
            date: { gte: from, lte: to },
          },
        },
      },
    });

    return {
      totalMes: totalMes._sum.total || 0,
      ordenesPendientes,
      proveedoresActivos,
    };
  }

  private async getProduccionKPIs(from: Date, to: Date) {
    const ordenesEnProceso = await this.prisma.productionOrder.count({
      where: { status: 'IN_PROGRESS' },
    });

    const ordenesCompletadas = await this.prisma.productionOrder.findMany({
      where: {
        status: 'COMPLETED',
        actualEndDate: { gte: from, lte: to },
      },
    });

    const eficiencia = ordenesCompletadas.length > 0
      ? ordenesCompletadas.reduce((acc, o) => {
          const planned = o.endDate.getTime() - o.startDate.getTime();
          const actual = o.actualEndDate.getTime() - o.actualStartDate.getTime();
          return acc + (planned / actual);
        }, 0) / ordenesCompletadas.length
      : 0;

    const mermas = await this.prisma.productionOrder.aggregate({
      where: {
        status: 'COMPLETED',
        actualEndDate: { gte: from, lte: to },
      },
      _sum: { scrapped: true },
    });

    return {
      ordenesEnProceso,
      eficienciaProduccion: parseFloat((eficiencia * 100).toFixed(2)),
      mermas: mermas._sum.scrapped || 0,
    };
  }

  private async getRRHHKPIs(from: Date, to: Date) {
    const totalEmpleados = await this.prisma.employee.count({
      where: { isActive: true },
    });

    const nominaMes = await this.prisma.payroll.aggregate({
      where: {
        periodStart: { gte: from, lte: to },
        status: { in: ['PROCESSED', 'PAID'] },
      },
      _sum: { total: true },
    });

    const asistencia = await this.prisma.attendance.findMany({
      where: {
        date: { gte: from, lte: to },
      },
    });

    const asistenciaPromedio = asistencia.length > 0
      ? (asistencia.filter(a => a.status === 'PRESENTE').length / asistencia.length) * 100
      : 0;

    const vacacionesPendientes = await this.prisma.vacation.count({
      where: { status: 'APPROBADO' },
    });

    return {
      totalEmpleados,
      nominaMes: nominaMes._sum.total || 0,
      asistenciaPromedio: parseFloat(asistenciaPromedio.toFixed(2)),
      vacacionesPendientes,
    };
  }

  private async getCRMKPIs(from: Date, to: Date) {
    const totalLeads = await this.prisma.lead.count();

    const leadsGanados = await this.prisma.lead.count({
      where: {
        status: 'GANADO',
        convertedAt: { gte: from, lte: to },
      },
    });

    const tasaConversion = await this.prisma.lead.count({
      where: {
        createdAt: { gte: from, lte: to },
      },
    });

    const conversionRate = tasaConversion > 0
      ? (leadsGanados / tasaConversion) * 100
      : 0;

    const oportunidadesActivas = await this.prisma.lead.count({
      where: { status: { in: ['CALIFICADO', 'NEGOCIACION'] } },
    });

    const valorPipeline = await this.prisma.lead.aggregate({
      where: { status: { in: ['CALIFICADO', 'NEGOCIACION'] } },
      _sum: { budget: true },
    });

    return {
      totalLeads,
      tasaConversion: parseFloat(conversionRate.toFixed(2)),
      oportunidadesActivas,
      valorPipeline: valorPipeline._sum.budget || 0,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // UTILIDADES
  // ─────────────────────────────────────────────────────────────
  
  private getPeriodDates(period: string, now: Date): [Date, Date] {
    switch (period) {
      case 'day':
        return [new Date(now.setHours(0, 0, 0, 0)), now];
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return [weekAgo, now];
      case 'month':
        return [new Date(now.getFullYear(), now.getMonth(), 1), now];
      case 'year':
        return [new Date(now.getFullYear(), 0, 1), now];
      default:
        return [new Date(now.setMonth(now.getMonth() - 1)), now];
    }
  }

  private getPeriodLabel(period: string): string {
    const labels = {
      day: 'Hoy',
      week: 'Últimos 7 días',
      month: 'Este mes',
      year: 'Este año',
    };
    return labels[period] || 'Período personalizado';
  }

  private async getVentasByPeriod(from: Date, to: Date) {
    const result = await this.prisma.sale.aggregate({
      where: {
        status: 'INVOICED',
        date: { gte: from, lte: to },
      },
      _sum: { total: true },
      _count: true,
    });

    return {
      total: result._sum.total || 0,
      count: result._count,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // EXPORTACIÓN
  // ─────────────────────────────────────────────────────────────
  
  async exportDashboardPDF(period: string) {
    const dashboard = await this.getDashboard(period);
    
    // Generar PDF con librería como pdfmake o puppeteer
    const pdfBuffer = await this.generateDashboardPDF(dashboard);
    
    return {
      filename: `dashboard-${period}-${new Date().toISOString().split('T')[0]}.pdf`,
      buffer: pdfBuffer,
    };
  }

  private async generateDashboardPDF(data: any): Promise<Buffer> {
    // Implementar generación de PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    // Agregar contenido al PDF
    doc.fontSize(20).text('Dashboard Ejecutivo', { align: 'center' });
    doc.moveDown();
    
    // Agregar KPIs
    Object.entries(data.kpis).forEach(([module, kpis]: [string, any]) => {
      doc.fontSize(14).text(module.toUpperCase(), { underline: true });
      Object.entries(kpis).forEach(([key, value]) => {
        doc.fontSize(10).text(`${key}: ${value}`);
      });
      doc.moveDown();
    });
    
    doc.end();
    
    return Buffer.concat(chunks);
  }
}
```

---

## 📊 Componente de Dashboard

### Dashboard Principal

```tsx
// apps/frontend/app/(dashboard)/reportes/dashboard/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { KPICard } from '@/components/dashboard/kpi-card';
import { GlassCard } from '@/components/ui/glass-card';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  Activity,
  Wallet,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const [period, setPeriod] = useState('month');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => api.get(`/reportes/dashboard?period=${period}`).then(r => r.data),
  });

  if (isLoading) return <DashboardSkeleton />;

  const { kpis } = dashboard;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Ejecutivo</h1>
          <p className="text-gray-500 mt-1">
            {dashboard.period.label} - {new Date().toLocaleDateString('es-VE')}
          </p>
        </div>
        
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="day">Hoy</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
          <option value="year">Año</option>
        </select>
      </div>

      {/* KPIs de Ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Ventas del Mes"
          value={`$${kpis.ventas.totalMes.toLocaleString()}`}
          change={kpis.ventas.crecimientoMes}
          icon={<ShoppingCart className="w-8 h-8" />}
          gradient="from-primary-500 to-purple-500"
          delay={0}
        />
        
        <KPICard
          title="Utilidad"
          value={`$${kpis.finanzas.utilidadMes.toLocaleString()}`}
          change={kpis.finanzas.margenUtilidad}
          icon={<DollarSign className="w-8 h-8" />}
          gradient="from-success-500 to-emerald-500"
          delay={0.1}
        />
        
        <KPICard
          title="Clientes Nuevos"
          value={kpis.ventas.clientesNuevos}
          icon={<Users className="w-8 h-8" />}
          gradient="from-info-500 to-blue-500"
          delay={0.2}
        />
        
        <KPICard
          title="Productos Vendidos"
          value={kpis.inventario.rotacionInventario}
          icon={<Package className="w-8 h-8" />}
          gradient="from-warning-500 to-orange-500"
          delay={0.3}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Ventas */}
        <GlassCard gradient>
          <h3 className="text-lg font-bold mb-4">Tendencia de Ventas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboard.charts?.ventasTendencia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="date" stroke="#ffffff80" />
              <YAxis stroke="#ffffff80" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ fill: '#6366F1', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Ingresos vs Gastos */}
        <GlassCard gradient>
          <h3 className="text-lg font-bold mb-4">Ingresos vs Gastos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboard.charts?.ingresosVsGastos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="month" stroke="#ffffff80" />
              <YAxis stroke="#ffffff80" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="#EF4444" name="Gastos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Ventas por Categoría */}
        <GlassCard gradient>
          <h3 className="text-lg font-bold mb-4">Ventas por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboard.charts?.ventasCategoria}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
              >
                {dashboard.charts?.ventasCategoria.map((entry: any, index: number) => (
                  <Cell
                    key={index}
                    fill={[
                      '#6366F1',
                      '#8B5CF6',
                      '#EC4899',
                      '#F59E0B',
                      '#10B981',
                      '#0EA5E9',
                    ][index % 6]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Flujo de Caja */}
        <GlassCard gradient>
          <h3 className="text-lg font-bold mb-4">Flujo de Caja Proyectado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboard.charts?.flujoCaja}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="date" stroke="#ffffff80" />
              <YAxis stroke="#ffffff80" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#0EA5E9"
                strokeWidth={3}
                dot={{ fill: '#0EA5E9', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Productos Más Vendidos */}
      <GlassCard gradient>
        <h3 className="text-lg font-bold mb-4">Productos Más Vendidos</h3>
        <Table data={kpis.ventas.productosMasVendidos}>
          <Column header="#" accessor={(_, i) => i + 1} />
          <Column header="Producto" accessor="name" />
          <Column header="Cantidad" accessor="quantity" />
          <Column header="Ingresos" accessor={(row) => `$${row.revenue.toLocaleString()}`} />
          <Column header="% del Total" accessor={(row) => `${((row.revenue / kpis.ventas.totalMes) * 100).toFixed(1)}%`} />
        </Table>
      </GlassCard>
    </div>
  );
}
```

---

## 📁 Archivos del Módulo

```
06-modulo-reportes/
├── dashboard-general.md (este archivo)
├── bi-avanzado.md
└── exportacion.md
```

**Anterior**: `07-integraciones/n8n-workflows.md` | **Siguiente**: `06-reportes/bi-avanzado.md`
