# Módulo 06: REPORTES - Business Intelligence Avanzado

## Descripción

Módulo de BI avanzado con cubos OLAP, dashboards interactivos, análisis predictivo y reportes ejecutivos para toma de decisiones.

## 🔗 Conexiones

- **Todos los módulos** → Lee datos para consolidar
- **07-integraciones/ia** → Predicciones y tendencias
- **06-reportes/dashboard-general** → KPIs principales

---

## 📊 Características Principales

### 1. Cubos OLAP

```typescript
interface OLAPCube {
  name: string; // ej. "Ventas", "Compras", "Inventario"
  dimensions: string[]; // ej. ["Tiempo", "Producto", "Cliente", "Ubicación"]
  measures: string[]; // ej. ["Cantidad", "Monto", "Costo", "Utilidad"]
  hierarchies: {
    [dimension: string]: string[]; // ej. Tiempo: ["Año", "Trimestre", "Mes", "Dia"]
  };
}
```

### 2. Dashboards Interactivos

- Filtros dinámicos por dimensión
- Drill-down/drill-up
- Slice and dice
- Pivot tables
- Gráficos interactivos

### 3. Análisis Predictivo

- Forecast de ventas
- Detección de tendencias
- Análisis de estacionalidad
- Alertas predictivas

---

## 📡 Endpoints Principales

```typescript
@Controller('bi')
export class BIController {
  @Get('cubes')
  async getCubes() { }
  
  @Post('cubes/:name/query')
  async executeQuery(
    @Param('name') cubeName: string,
    @Body() query: OLAPQuery,
  ) { }
  
  @Get('dashboards')
  async getDashboards() { }
  
  @Get('dashboards/:id/data')
  async getDashboardData(@Param('id') id: string) { }
  
  @Post('forecast')
  async getForecast(@Body() dto: ForecastDto) { }
  
  @Get('trends')
  async getTrends(@Query('metric') metric: string) { }
  
  @Get('export/:reportId')
  async exportReport(@Param('reportId') reportId: string) { }
}
```

---

## 📊 Tipos de Reportes

### 1. Reportes Financieros
- Balance general
- Estado de resultados
- Flujo de efectivo
- Razones financieras
- Análisis horizontal/vertical

### 2. Reportes de Ventas
- Ventas por período
- Ventas por producto
- Ventas por cliente
- Ventas por vendedor
- Comparativo presupuestado vs real

### 3. Reportes de Inventario
- Rotación de inventario
- Valoración de inventario
- Stock por almacén
- Productos más vendidos
- Productos obsoletos

### 4. Reportes de Producción
- Eficiencia de producción
- Costos de producción
- Mermas y desperdicios
- Capacidad utilizada
- Órdenes en proceso

### 5. Reportes de RRHH
- Nómina por departamento
- Asistencia y puntualidad
- Vacaciones pendientes
- Rotación de personal
- Horas extras

---

## 🎯 Features de IA en BI

```typescript
// Detección automática de anomalías
const anomalies = await aiService.detectAnomalies('ventas', data);

// Predicción de ventas
const forecast = await aiService.forecastSales(productId, months: 3);

// Segmentación automática de clientes
const segments = await aiService.clusterCustomers(customers);

// Recomendaciones
const recommendations = await aiService.getRecommendations({
  module: 'inventario',
  context: { lowStock: true, slowMoving: true },
});
```

---

## ⚠️ Reglas de Negocio

1. **Solo Lectura**: BI no modifica datos, solo consulta
2. **Performance**: Usar índices y caché para consultas pesadas
3. **Seguridad**: Respetar permisos de usuario en consultas
4. **Actualización**: Datos se actualizan cada 15 minutos (configurable)
5. **Histórico**: Mantener mínimo 5 años de histórico para tendencias

---

**Anterior**: `05-configuracion/tablas.md` | **Siguiente**: `07-integraciones/api-externas.md`
