# Módulo 02: OPERATIVO - Flota Vehicular

## Descripción

Gestión de flota vehicular incluyendo vehículos, choferes, mantenimiento, seguros, combustible y seguimiento de rutas.

## 🔗 Conexiones

- **02-operativo/mantenimiento** → Mantenimiento de vehículos
- **01-administrativo/activos-fijos** → Vehículos como activos
- **02-operativo/compras** → Combustible y repuestos

---

## 📊 Modelo de Datos

```prisma
model Vehicle {
  id              String   @id @default(cuid())
  plate           String   @unique
  brand           String
  model           String
  year            Int
  color           String
  vin             String?
  
  // Tipo
  type            String   // CAMIONETA, FURGON, AUTO, MOTO
  capacity        Float    // Capacidad de carga
  
  // Estado
  status          String   @default("ACTIVO") // ACTIVO, MANTENIMIENTO, TALLER, BAJA
  
  // Asignación
  driverId        String?
  driver          Driver?  @relation(fields: [driverId], references: [id])
  
  // Mantenimiento
  lastMaintenance DateTime?
  nextMaintenance DateTime?
  mileage         Float    @default(0)
  
  // Seguros
  insuranceCompany String?
  insurancePolicy  String?
  insuranceExpiry  DateTime?
  
  // Documentos
  registrationExpiry DateTime?
  
  trips           Trip[]
  maintenances    VehicleMaintenance[]
  fuelLogs        FuelLog[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Driver {
  id              String   @id @default(cuid())
  employeeId      String?
  name            String
  license         String
  licenseExpiry   DateTime?
  phone           String?
  email           String?
  
  status          String   @default("ACTIVO")
  vehicles        Vehicle[]
  trips           Trip[]
  
  createdAt       DateTime @default(now())
}

model Trip {
  id              String   @id @default(cuid())
  vehicleId       String
  vehicle         Vehicle @relation(fields: [vehicleId], references: [id])
  driverId        String
  driver          Driver @relation(fields: [driverId], references: [id])
  
  // Ruta
  origin          String
  destination     String
  route           Json?    // Coordenadas de la ruta
  
  // Fechas
  startDate       DateTime
  endDate         DateTime?
  
  // Estado
  status          String   @default("SCHEDULED") // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  
  // Kilometraje
  startMileage    Float
  endMileage      Float?
  
  // Propósito
  purpose         String?
  notes           String?
  
  createdAt       DateTime @default(now())
}

model FuelLog {
  id              String   @id @default(cuid())
  vehicleId       String
  vehicle         Vehicle @relation(fields: [vehicleId], references: [id])
  
  // Fecha
  date            DateTime
  mileage         Float
  
  // Combustible
  fuelType        String   // GASOLINA, DIESEL
  quantity        Float    // Litros/galones
  unitPrice       Float
  totalCost       Float
  
  // Estación
  station         String?
  location        String?
  
  createdAt       DateTime @default(now())
}

model VehicleMaintenance {
  id              String   @id @default(cuid())
  vehicleId       String
  vehicle         Vehicle @relation(fields: [vehicleId], references: [id])
  
  // Tipo
  type            String   // PREVENTIVO, CORRECTIVO
  description     String
  
  // Fechas
  scheduledDate   DateTime
  completedDate   DateTime?
  
  // Costo
  cost            Float
  vendor          String?
  
  // Estado
  status          String   @default("SCHEDULED")
  
  createdAt       DateTime @default(now())
}
```

---

## 📡 Endpoints Principales

```typescript
@Controller('flota')
export class FlotaController {
  @Get('vehiculos')
  async getVehiculos(@Query('status') status?: string) { }
  
  @Post('vehiculos')
  async createVehiculo(@Body() dto: CreateVehiculoDto) { }
  
  @Get('choferes')
  async getChoferes() { }
  
  @Post('choferes')
  async createChofer(@Body() dto: CreateChoferDto) { }
  
  @Get('viajes')
  async getViajes(@Query('status') status?: string) { }
  
  @Post('viajes')
  async createViaje(@Body() dto: CreateViajeDto) { }
  
  @Post('vehiculos/:id/mantenimiento')
  async scheduleMantenimiento(@Param('id') id: string, @Body() dto: ScheduleMantenimientoDto) { }
  
  @Post('vehiculos/:id/combustible')
  async registerCombustible(@Param('id') id: string, @Body() dto: RegisterCombustibleDto) { }
  
  @Get('reportes/costos')
  async getCostosFlota(@Query('from') from: string, @Query('to') to: string) { }
  
  @Get('reportes/rendimiento')
  async getRendimiento() { }
}
```

---

## ⚠️ Reglas de Negocio

1. **Licencias**: Validar vencimiento de licencias de choferes
2. **Seguros**: Alertar antes de vencimiento de seguros
3. **Mantenimiento**: Preventivo según kilometraje o tiempo
4. **Combustible**: Registrar cada carga con kilometraje
5. **Viajes**: Asignar solo choferes con licencia válida
6. **Documentos**: Alertar vencimiento de documentos del vehículo

---

**Anterior**: `07-integraciones/webhooks.md` | **Último archivo de módulos operativos**
