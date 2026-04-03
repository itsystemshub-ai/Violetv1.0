# Módulo 01-Administrativo: RRHH - Empleados y Nómina

## Descripción

Módulo de Recursos Humanos para gestión de empleados, nómina, asistencia y prestaciones sociales. Cumple con la LOTTT (Ley Orgánica del Trabajo, Trabajadores y Trabajadoras) de Venezuela.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  00-shared/auth.md          → Usuarios del sistema             │
│  00-shared/rbac.md          → Roles RRHH                       │
├─────────────────────────────────────────────────────────────────┤
│  01-administrativo/contabilidad.md → Asientos de nómina        │
│  01-administrativo/contabilidad.md → Provisiones laborales     │
│  01-administrativo/impuestos.md      → Retenciones IVSS, FAOV  │
│  01-administrativo/tesoreria.md      → Pagos de nómina         │
├─────────────────────────────────────────────────────────────────┤
│  03-comercial/ventas.md     → Comisiones de vendedores         │
├─────────────────────────────────────────────────────────────────┤
│  05-configuracion/sistema.md → Parámetros de cálculo           │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. La nómina **CREA** asiento contable automático en contabilidad
2. Las retenciones (IVSS, FAOV, ISLR) se registran en impuestos
3. El pago de nómina **DEBITA** la cuenta bancaria en tesorería
4. Las comisiones de vendedores se calculan desde ventas

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// DEPARTAMENTOS Y CARGOS
// ─────────────────────────────────────────────────────────────────────────────

model Department {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  managerId   String?
  parentId    String?
  parent      Department? @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  employees   Employee[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([parentId])
}

model JobPosition {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  minSalary   Float?
  maxSalary   Float?
  employees   Employee[]
  createdAt   DateTime @default(now())

  @@index([name])
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLEADOS
// ─────────────────────────────────────────────────────────────────────────────

model Employee {
  id               String   @id @default(cuid())
  userId          String?   @unique // Si es usuario del sistema
  user            User?     @relation(fields: [userId], references: [id])
  
  // Datos personales
  firstName        String
  lastName         String
  cedula          String   @unique // V-12345678
  birthDate       DateTime?
  gender          String?  // M, F
  nationality     String?  // V, E
  
  // Datos de contacto
  address         String?
  phone           String?
  email           String?
  
  // Datos laborales
  departmentId    String?
  department      Department? @relation(fields: [departmentId], references: [id])
  positionId      String?
  position        JobPosition? @relation(fields: [positionId], references: [id])
  
  // Datos de contratación
  hireDate        DateTime
  employmentType  EmploymentType // INDEFINIDO, TEMPORAL, OBRA, PASANTIA
  workSchedule    String?  // HORARIO_NORMAL, HORARIO_ESPECIAL
  salary          Float    // Salario base mensual
  salaryType      SalaryType // MENSUAL, DIARIO, HORARIO
  
  // Datos bancarios (para pago de nómina)
  bankId          String?
  bank            Bank?    @relation(fields: [bankId], references: [id])
  bankAccount     String?
  
  // Carga familiar (para cálculo de prestaciones)
  childrenCount   Int      @default(0)
  hasDisability   Boolean  @default(false)
  
  // Estado
  isActive        Boolean  @default(true)
  terminationDate DateTime?
  terminationReason String?
  
  // Relaciones
  contracts       Contract[]
  attendances     Attendance[]
  payrollItems    PayrollItem[]
  vacations       Vacation[]
  bonuses         Bonus[]
  deductions      Deduction[]
  commissions     SalesCommission[] // 03-comercial
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([cedula])
  @@index([departmentId])
  @@index([isActive])
}

model Contract {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  type        ContractType // INDEFINIDO, DETERMINADO, OBRA, PASANTIA
  startDate   DateTime
  endDate     DateTime?
  salary      Float
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([employeeId])
}

// ─────────────────────────────────────────────────────────────────────────────
// ASISTENCIA Y HORARIOS
// ─────────────────────────────────────────────────────────────────────────────

model Attendance {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  date        DateTime @db.Date
  
  // Marcadas
  checkIn     DateTime? // Entrada
  checkOut    DateTime? // Salida
  checkInLunch DateTime? // Entrada después de almuerzo
  checkOutLunch DateTime? // Salida para almuerzo
  
  // Horas trabajadas
  hoursWorked Float?   // Calculado automáticamente
  overtimeHours Float? // Horas extras
  nightHours  Float?   // Horas nocturnas (10pm-5am)
  
  // Estado
  status      AttendanceStatus // PRESENTE, TARDE, FALTA, PERMISO, VACACIONES
  notes       String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([employeeId, date])
  @@index([employeeId])
  @@index([date])
}

model WorkSchedule {
  id          String   @id @default(cuid())
  name        String   @unique
  mondayIn    String?  // "08:00"
  mondayOut   String?  // "17:00"
  tuesdayIn   String?
  tuesdayOut  String?
  wednesdayIn String?
  wednesdayOut String?
  thursdayIn  String?
  thursdayOut String?
  fridayIn    String?
  fridayOut   String?
  saturdayIn  String?
  saturdayOut String?
  sundayIn    String?
  sundayOut   String?
  lunchBreakMinutes Int @default(60)
  createdAt   DateTime @default(now())

  @@index([name])
}

// ─────────────────────────────────────────────────────────────────────────────
// VACACIONES Y PERMISOS
// ─────────────────────────────────────────────────────────────────────────────

model Vacation {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  
  // Período de vacaciones
  periodStart DateTime // Año de inicio del período
  periodEnd   DateTime // Año de fin del período
  
  // Días
  totalDays   Int      // Días totales (15 + bono por año)
  takenDays   Int      @default(0)
  remainingDays Int
  
  // Fechas de disfrute
  startDate   DateTime?
  endDate     DateTime?
  status      VacationStatus // PENDIENTE, APROBADO, EN_CURSO, COMPLETADO, CANCELADO
  
  // Bono vacacional
  bonusDays   Int      // Días de bono vacacional
  bonusAmount Float?   // Monto del bono
  
  approvedBy  String?
  approvedAt  DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([employeeId])
  @@index([status])
}

model Bonus {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  type        BonusType // BONO_PRODUCCION, BONO_RENDIMIENTO, AGUINALDO, etc.
  description String?
  amount      Float
  date        DateTime
  period      String?  // MM-YYYY
  isRecurring Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([employeeId])
  @@index([date])
}

model Deduction {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  type        DeductionType // IVSS, FAOV, INCE, ISLR, PRESTAMO, OTRO
  description String?
  amount      Float
  percentage  Float?   // Para deducciones porcentuales
  date        DateTime
  period      String?  // MM-YYYY
  isRecurring Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([employeeId])
  @@index([date])
}

// ─────────────────────────────────────────────────────────────────────────────
// NÓMINA
// ─────────────────────────────────────────────────────────────────────────────

model Payroll {
  id          String   @id @default(cuid())
  number      String   @unique // ej. N-2024-01
  periodStart DateTime
  periodEnd   DateTime
  paymentDate DateTime
  
  // Totales
  totalEmployees Int
  totalGross     Float  // Total devengado
  totalDeductions Float // Total deducciones
  totalNet       Float  // Total neto a pagar
  
  // Estado
  status      PayrollStatus // DRAFT, PROCESSED, PAID, CANCELLED
  journalEntryId String?
  journalEntry  JournalEntry? @relation(fields: [journalEntryId], references: [id])
  
  // Items
  items       PayrollItem[]
  
  // Auditoría
  processedBy String?
  processedAt DateTime?
  paidAt      DateTime?
  createdAt   DateTime @default(now())

  @@index([periodStart, periodEnd])
  @@index([status])
}

model PayrollItem {
  id              String   @id @default(cuid())
  payrollId       String
  payroll         Payroll  @relation(fields: [payrollId], references: [id])
  employeeId      String
  employee        Employee @relation(fields: [employeeId], references: [id])
  
  // Devengado
  baseSalary      Float    // Salario base del período
  overtimePay     Float    @default(0) // Horas extras
  nightBonus      Float    @default(0) // Bono nocturno
  holidayPay      Float    @default(0) // Días feriados
  bonus           Float    @default(0) // Bonos
  cestaTicket     Float    @default(0) // Cesta ticket
  commissions     Float    @default(0) // Comisiones de venta
  otherEarnings   Float    @default(0) // Otros conceptos
  
  totalGross      Float    // Total devengado
  
  // Deducciones
  ivss            Float    @default(0) // IVSS (4%)
  faov            Float    @default(0) // FAOV (1%)
  ince            Float    @default(0) // INCE (0.5%)
  islr            Float    @default(0) // ISLR
  otherDeductions Float    @default(0) // Otras deducciones
  
  totalDeductions Float    // Total deducciones
  
  // Neto
  netSalary       Float    // Salario neto
  
  // Pago
  paymentMethod   String?  // TRANSFERENCIA, EFECTIVO, CHEQUE
  bankReference   String?
  
  // Recibo
  receiptUrl      String?  // URL del recibo en R2
  
  createdAt       DateTime @default(now())

  @@index([payrollId])
  @@index([employeeId])
}

// ─────────────────────────────────────────────────────────────────────────────
// BANCOS (para nómina)
// ─────────────────────────────────────────────────────────────────────────────

model Bank {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique // Código bancario
  isActive    Boolean  @default(true)
  employees   Employee[]
  createdAt   DateTime @default(now())

  @@index([code])
}

// ─────────────────────────────────────────────────────────────────────────────
// COMISIONES DE VENTA (conexión con 03-comercial)
// ─────────────────────────────────────────────────────────────────────────────

model SalesCommission {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  saleId      String
  sale        Sale     @relation(fields: [saleId], references: [id]) // 03-comercial
  rate        Float    // Porcentaje de comisión
  amount      Float    // Monto de comisión
  status      String   @default("PENDING") // PENDING, PAID
  paidAt      DateTime?
  payrollItemId String?
  payrollItem PayrollItem? @relation(fields: [payrollItemId], references: [id])
  createdAt   DateTime @default(now())

  @@index([employeeId])
  @@index([saleId])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum EmploymentType {
  INDEFINIDO
  TEMPORAL
  OBRA
  PASANTIA
}

enum SalaryType {
  MENSUAL
  DIARIO
  HORARIO
}

enum ContractType {
  INDEFINIDO
  DETERMINADO
  OBRA
  PASANTIA
}

enum AttendanceStatus {
  PRESENTE
  TARDE
  FALTA
  PERMISO
  VACACIONES
  INCIDENCIA
}

enum VacationStatus {
  PENDIENTE
  APROBADO
  EN_CURSO
  COMPLETADO
  CANCELADO
}

enum BonusType {
  BONO_PRODUCCION
  BONO_RENDIMIENTO
  BONO_PUNTUALIDAD
  AGUINALDO
  UTILIDADES
  OTRO
}

enum DeductionType {
  IVSS
  FAOV
  INCE
  ISLR
  PRESTAMO
  AHORRO
  SEGURO
  OTRO
}

enum PayrollStatus {
  DRAFT
  PROCESSED
  PAID
  CANCELLED
}
```

---

## 📡 Endpoints de la API

### Controller de RRHH

```typescript
// apps/backend/src/modules/rrhh/rrhh.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RrhhService } from './rrhh.service';

@Controller('rrhh')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RrhhController {
  constructor(private rrhhService: RrhhService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // EMPLEADOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('empleados')
  @RequirePermissions('empleados:read')
  async getEmpleados(@Query('isActive') isActive?: boolean) {
    return this.rrhhService.getEmpleados(isActive);
  }

  @Get('empleados/:id')
  @RequirePermissions('empleados:read')
  async getEmpleado(@Param('id') id: string) {
    return this.rrhhService.findOne(id);
  }

  @Post('empleados')
  @RequirePermissions('empleados:create')
  async createEmpleado(@Body() dto: CreateEmpleadoDto, @User() user: any) {
    return this.rrhhService.createEmpleado(dto, user.id);
  }

  @Put('empleados/:id')
  @RequirePermissions('empleados:update')
  async updateEmpleado(
    @Param('id') id: string,
    @Body() dto: UpdateEmpleadoDto,
    @User() user: any,
  ) {
    return this.rrhhService.updateEmpleado(id, dto, user.id);
  }

  @Delete('empleados/:id')
  @RequirePermissions('empleados:delete')
  async deleteEmpleado(@Param('id') id: string) {
    return this.rrhhService.deleteEmpleado(id);
  }

  @Post('empleados/:id/terminar')
  @RequirePermissions('empleados:delete')
  async terminarContrato(
    @Param('id') id: string,
    @Body() dto: TerminarContratoDto,
    @User() user: any,
  ) {
    return this.rrhhService.terminarContrato(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ASISTENCIA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('asistencia')
  @RequirePermissions('asistencia:read')
  async getAsistencia(
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.rrhhService.getAsistencia(employeeId, from, to);
  }

  @Post('asistencia/marcar')
  @RequirePermissions('asistencia:create')
  async marcarAsistencia(
    @Body() dto: MarcarAsistenciaDto,
    @User() user: any,
  ) {
    return this.rrhhService.marcarAsistencia(dto, user.id);
  }

  @Post('asistencia/importar')
  @RequirePermissions('asistencia:create')
  async importarAsistencia(@Body() file: any) {
    return this.rrhhService.importarAsistencia(file);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VACACIONES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('vacaciones')
  @RequirePermissions('empleados:read')
  async getVacaciones(@Query('employeeId') employeeId?: string) {
    return this.rrhhService.getVacaciones(employeeId);
  }

  @Post('vacaciones')
  @RequirePermissions('empleados:update')
  async solicitarVacaciones(@Body() dto: CreateVacacionDto, @User() user: any) {
    return this.rrhhService.solicitarVacaciones(dto, user.id);
  }

  @Post('vacaciones/:id/aprobar')
  @RequirePermissions('empleados:update')
  async aprobarVacaciones(@Param('id') id: string, @User() user: any) {
    return this.rrhhService.aprobarVacaciones(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // NÓMINA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('nomina')
  @RequirePermissions('nomina:read')
  async getNomina(@Query('period') period?: string) {
    return this.rrhhService.getNomina(period);
  }

  @Get('nomina/:id')
  @RequirePermissions('nomina:read')
  async getNominaDetalle(@Param('id') id: string) {
    return this.rrhhService.getNominaDetalle(id);
  }

  @Post('nomina/calcular')
  @RequirePermissions('nomina:create')
  async calcularNomina(@Body() dto: CalcularNominaDto, @User() user: any) {
    return this.rrhhService.calcularNomina(dto, user.id);
  }

  @Post('nomina/procesar')
  @RequirePermissions('nomina:create')
  async procesarNomina(@Param('id') id: string, @User() user: any) {
    return this.rrhhService.procesarNomina(id, user.id);
  }

  @Get('nomina/:id/recibos')
  @RequirePermissions('nomina:export')
  async generarRecibos(@Param('id') id: string) {
    return this.rrhhService.generarRecibos(id);
  }

  @Get('nomina/:id/recibo/:employeeId')
  @RequirePermissions('nomina:export')
  async getRecibo(@Param('id') id: string, @Param('employeeId') employeeId: string) {
    return this.rrhhService.getRecibo(id, employeeId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/gastos-personal')
  @RequirePermissions('reportes-rrhh:read')
  async getGastosPersonal(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.rrhhService.getGastosPersonal(new Date(from), new Date(to));
  }

  @Get('reportes/asistencia-mensual')
  @RequirePermissions('reportes-rrhh:read')
  async getAsistenciaMensual(
    @Query('month') month: string,
  ) {
    return this.rrhhService.getAsistenciaMensual(month);
  }

  @Get('reportes/vacaciones-pendientes')
  @RequirePermissions('reportes-rrhh:read')
  async getVacacionesPendientes() {
    return this.rrhhService.getVacacionesPendientes();
  }

  @Get('reportes/provisiones')
  @RequirePermissions('reportes-rrhh:read')
  async getProvisiones(@Query('date') date: string) {
    return this.rrhhService.getProvisiones(new Date(date));
  }
}
```

---

## 🧩 Servicio de RRHH y Nómina

### Cálculo de Nómina Venezolana (LOTTT)

```typescript
// apps/backend/src/modules/rrhh/rrhh.service.ts

@Injectable()
export class RrhhService {
  constructor(
    private prisma: PrismaService,
    private contabilidadService: ContabilidadService,
    private config: SystemConfigService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CÁLCULO DE NÓMINA
  // ───────────────────────────────────────────────────────────────────────────
  
  async calcularNomina(dto: CalcularNominaDto, userId: string) {
    const { periodStart, periodEnd } = dto;

    // 1. Obtener empleados activos
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      include: {
        department: true,
        position: true,
        bank: true,
      },
    });

    // 2. Obtener asistencia del período
    const attendances = await this.prisma.attendance.findMany({
      where: {
        employeeId: { in: employees.map(e => e.id) },
        date: { gte: periodStart, lte: periodEnd },
      },
    });

    // 3. Obtener comisiones del período (ventas)
    const commissions = await this.prisma.salesCommission.findMany({
      where: {
        employeeId: { in: employees.map(e => e.id) },
        status: 'PENDING',
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: { sale: true },
    });

    // 4. Calcular nómina por empleado
    const payrollItems: any[] = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const employee of employees) {
      const item = await this.calculateEmployeePayroll(
        employee,
        attendances.filter(a => a.employeeId === employee.id),
        commissions.filter(c => c.employeeId === employee.id),
        periodStart,
        periodEnd,
      );
      payrollItems.push(item);
      totalGross += item.totalGross;
      totalDeductions += item.totalDeductions;
      totalNet += item.netSalary;
    }

    // 5. Crear nómina
    const number = await this.getNextPayrollNumber();
    
    const payroll = await this.prisma.payroll.create({
      data: {
        number,
        periodStart,
        periodEnd,
        paymentDate: dto.paymentDate,
        totalEmployees: employees.length,
        totalGross,
        totalDeductions,
        totalNet,
        status: 'DRAFT',
        items: {
          create: payrollItems,
        },
      },
      include: { items: { include: { employee: true } } },
    });

    return payroll;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CÁLCULO INDIVIDUAL POR EMPLEADO
  // ───────────────────────────────────────────────────────────────────────────
  
  private async calculateEmployeePayroll(
    employee: any,
    attendances: any[],
    commissions: any[],
    periodStart: Date,
    periodEnd: Date,
  ) {
    // ─── DEVENGADO ───────────────────────────────────────────────────────────
    
    // Salario base del período
    const daysInPeriod = this.getDaysBetween(periodStart, periodEnd);
    const baseSalary = employee.salaryType === 'MENSUAL'
      ? employee.salary
      : employee.salary * daysInPeriod;

    // Horas extras
    const overtimeHours = attendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    const hourlyRate = employee.salary / 30 / 8; // Salario diario / 8 horas
    const overtimePay = overtimeHours * hourlyRate * 1.5; // 50% recargo

    // Bono nocturno
    const nightHours = attendances.reduce((sum, a) => sum + (a.nightHours || 0), 0);
    const nightBonus = nightHours * hourlyRate * 0.3; // 30% recargo nocturno

    // Días feriados trabajados
    const holidayDays = attendances.filter(a => a.status === 'FALTA').length; // Simplificado
    const dailySalary = employee.salary / 30;
    const holidayPay = holidayDays * dailySalary * 2; // Doble pago

    // Bonos
    const bonuses = await this.prisma.bonus.findMany({
      where: {
        employeeId: employee.id,
        date: { gte: periodStart, lte: periodEnd },
      },
    });
    const bonusTotal = bonuses.reduce((sum, b) => sum + b.amount, 0);

    // Cesta ticket
    const cestaTicket = await this.config.getNumber('hr.cesta_ticket_amount', 0);

    // Comisiones
    const commissionsTotal = commissions.reduce((sum, c) => sum + c.amount, 0);

    // Total devengado
    const totalGross = baseSalary + overtimePay + nightBonus + holidayPay + 
                       bonusTotal + cestaTicket + commissionsTotal;

    // ─── DEDUCCIONES ─────────────────────────────────────────────────────────
    
    // IVSS (4% del salario, con tope de 5 salarios mínimos)
    const ivssRate = await this.config.getNumber('hr.ivss_rate_employee', 0.04);
    const ivss = Math.min(baseSalary, 5 * 1300) * ivssRate; // 1300 = salario mínimo 2024

    // FAOV (1%)
    const faovRate = await this.config.getNumber('hr.faov_rate_employee', 0.01);
    const faov = baseSalary * faovRate;

    // INCE (0.5%)
    const inceRate = await this.config.getNumber('hr.ince_rate', 0.005);
    const ince = baseSalary * inceRate;

    // ISLR (según tabla)
    const islr = this.calculateISLR(baseSalary * 12); // Anualizado

    // Otras deducciones
    const otherDeductions = await this.prisma.deduction.findMany({
      where: {
        employeeId: employee.id,
        date: { gte: periodStart, lte: periodEnd },
      },
    });
    const otherDeductionsTotal = otherDeductions.reduce((sum, d) => sum + d.amount, 0);

    // Total deducciones
    const totalDeductions = ivss + faov + ince + islr + otherDeductionsTotal;

    // ─── NETO A PAGAR ────────────────────────────────────────────────────────
    
    const netSalary = totalGross - totalDeductions;

    return {
      employeeId: employee.id,
      baseSalary,
      overtimePay,
      nightBonus,
      holidayPay,
      bonus: bonusTotal,
      cestaTicket,
      commissions: commissionsTotal,
      otherEarnings: 0,
      totalGross,
      ivss,
      faov,
      ince,
      islr,
      otherDeductions: otherDeductionsTotal,
      totalDeductions,
      netSalary,
      paymentMethod: employee.bankAccount ? 'TRANSFERENCIA' : 'EFECTIVO',
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CÁLCULO DE ISLR (Personas Naturales)
  // ───────────────────────────────────────────────────────────────────────────
  
  private calculateISLR(annualIncome: number): number {
    // Tabla ISLR 2024 (en Unidades Tributarias, UT = 9 Bs)
    const UT = 9;
    const annualUT = annualIncome / UT;

    if (annualUT <= 1000) return 0;
    
    if (annualUT <= 1500) {
      return ((annualUT - 1000) * 0.06) * UT / 12;
    }
    
    if (annualUT <= 2000) {
      return ((500 * 0.06) + (annualUT - 1500) * 0.09) * UT / 12;
    }
    
    if (annualUT <= 2500) {
      return ((500 * 0.06) + (500 * 0.09) + (annualUT - 2000) * 0.12) * UT / 12;
    }
    
    return ((500 * 0.06) + (500 * 0.09) + (500 * 0.12) + (annualUT - 2500) * 0.16) * UT / 12;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROCESAR NÓMINA (Genera asiento contable y recibos)
  // ───────────────────────────────────────────────────────────────────────────
  
  async procesarNomina(payrollId: string, userId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { items: { include: { employee: true } } },
    });

    if (!payroll) {
      throw new NotFoundException('Nómina no encontrada');
    }

    if (payroll.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden procesar nóminas en borrador');
    }

    // 1. Crear asiento contable automático
    const journalEntry = await this.contabilidadService.createEntryFromNomina({
      id: payroll.id,
      periodStart: payroll.periodStart,
      periodEnd: payroll.periodEnd,
      totalSalaries: payroll.totalGross,
      totalIvss: payroll.items.reduce((sum, i) => sum + i.ivss, 0),
      totalFaov: payroll.items.reduce((sum, i) => sum + i.faov, 0),
      totalInce: payroll.items.reduce((sum, i) => sum + i.ince, 0),
      totalNeto: payroll.totalNet,
      createdBy: userId,
    });

    // 2. Generar recibos PDF
    await this.generarRecibos(payrollId);

    // 3. Marcar comisiones como pagadas
    await this.prisma.salesCommission.updateMany({
      where: {
        employeeId: { in: payroll.items.map(i => i.employeeId) },
        status: 'PENDING',
        createdAt: { gte: payroll.periodStart, lte: payroll.periodEnd },
      },
      data: { status: 'PAID', paidAt: new Date() },
    });

    // 4. Actualizar estado de nómina
    const updated = await this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: 'PROCESSED',
        journalEntryId: journalEntry.id,
        processedBy: userId,
        processedAt: new Date(),
      },
    });

    return updated;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GENERAR RECIBOS PDF
  // ───────────────────────────────────────────────────────────────────────────
  
  async generarRecibos(payrollId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { 
        items: { 
          include: { 
            employee: { include: { bank: true } },
            payroll: true,
          } 
        },
      },
    });

    const company = await this.prisma.companyConfig.findFirst();

    for (const item of payroll.items) {
      const pdfBuffer = await this.generatePayrollReceiptPDF(item, company);
      const key = `receipts/${item.employeeId}/${payrollId}.pdf`;
      await this.r2Service.uploadBuffer(key, pdfBuffer, 'application/pdf');
      
      const receiptUrl = this.r2Service.getPublicUrl(key);
      
      await this.prisma.payrollItem.update({
        where: { id: item.id },
        data: { receiptUrl },
      });
    }

    return { success: true, count: payroll.items.length };
  }

  private async generatePayrollReceiptPDF(item: any, company: any): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {});

    // Encabezado
    doc.fontSize(16).font('Helvetica-Bold').text(company.businessName, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`RIF: ${company.rif}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('RECIBO DE PAGO', { align: 'center' });
    doc.moveDown();

    // Datos del empleado
    doc.fontSize(10).font('Helvetica');
    doc.text(`Empleado: ${item.employee.firstName} ${item.employee.lastName}`);
    doc.text(`Cédula: ${item.employee.cedula}`);
    doc.text(`Cargo: ${item.employee.position?.name || 'N/A'}`);
    doc.text(`Período: ${new Date(item.payroll.periodStart).toLocaleDateString('es-VE')} - ${new Date(item.payroll.periodEnd).toLocaleDateString('es-VE')}`);
    doc.moveDown();

    // Tabla de conceptos
    const col1 = 40, col2 = 300;
    doc.font('Helvetica-Bold').text('ASIGNACIONES', col1);
    doc.font('Helvetica-Bold').text('DEDUCCIONES', col2, doc.y - 12);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    const assignments = [
      ['Salario Base', item.baseSalary],
      ['Horas Extras', item.overtimePay || 0],
      ['Bono Nocturno', item.nightBonus || 0],
      ['Cesta Ticket', item.cestaTicket || 0],
      ['Comisiones', item.commissions || 0],
    ].filter(([, v]) => v > 0);

    const deductions = [
      ['IVSS (4%)', item.ivss || 0],
      ['FAOV (1%)', item.faov || 0],
      ['INCE (0.5%)', item.ince || 0],
      ['ISLR', item.islr || 0],
    ].filter(([, v]) => v > 0);

    const maxRows = Math.max(assignments.length, deductions.length);
    for (let i = 0; i < maxRows; i++) {
      const a = assignments[i];
      const d = deductions[i];
      doc.font('Helvetica');
      if (a) doc.text(`${a[0]}`, col1);
      if (a) doc.text(`Bs. ${(a[1] as number).toFixed(2)}`, col1 + 150, doc.y - 12);
      if (d) doc.text(`${d[0]}`, col2, doc.y - 12);
      if (d) doc.text(`Bs. ${(d[1] as number).toFixed(2)}`, col2 + 150, doc.y - 12);
      if (!a && d) doc.moveDown(0.8);
    }

    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica-Bold');
    doc.text(`Total Asignaciones: Bs. ${item.totalGross.toFixed(2)}`, col1);
    doc.text(`Total Deducciones: Bs. ${item.totalDeductions.toFixed(2)}`, col2, doc.y - 12);
    doc.moveDown();
    doc.fontSize(12).text(`NETO A PAGAR: Bs. ${item.netSalary.toFixed(2)}`, { align: 'center' });

    doc.end();

    return Buffer.concat(chunks);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async getNextPayrollNumber() {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const last = await this.prisma.payroll.findFirst({
      where: { number: { startsWith: `N-${year}-${month.toString().padStart(2, '0')}-` } },
      orderBy: { number: 'desc' },
    });
    const num = last ? parseInt(last.number.split('-')[3]) + 1 : 1;
    return `N-${year}-${month.toString().padStart(2, '0')}-${num.toString().padStart(3, '0')}`;
  }

  private getDaysBetween(start: Date, end: Date): number {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CÁLCULO DE PROVISIONES (Vacaciones, Utilidades, Prestaciones)
  // ───────────────────────────────────────────────────────────────────────────
  
  async getProvisiones(date: Date) {
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
    });

    const provisiones = employees.map(emp => {
      const yearsOfService = this.getYearsOfService(emp.hireDate);
      const monthlySalary = emp.salary;

      // Vacaciones (15 días + 1 por año, máx 30)
      const vacationDays = Math.min(15 + Math.max(0, yearsOfService - 1), 30);
      const vacationProvision = (monthlySalary / 30) * vacationDays / 12;

      // Bono vacacional (igual a vacaciones)
      const bonusVacacional = vacationProvision;

      // Utilidades (mínimo 15 días, máx 4 meses)
      const utilityDays = 15; // Mínimo LOTTT
      const utilityProvision = (monthlySalary / 30) * utilityDays / 12;

      // Prestaciones (5 días por trimestre después del primer año)
      let severanceProvision = 0;
      if (yearsOfService >= 1) {
        const daysPerQuarter = 5;
        const quartersAfterFirstYear = (yearsOfService - 1) * 4;
        severanceProvision = (monthlySalary / 30) * (daysPerQuarter * quartersAfterFirstYear) / 12;
      }

      return {
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        cedula: emp.cedula,
        yearsOfService,
        monthlySalary,
        vacationProvision,
        bonusVacacional,
        utilityProvision,
        severanceProvision,
        totalProvision: vacationProvision + bonusVacacional + utilityProvision + severanceProvision,
      };
    });

    const totals = provisiones.reduce((acc, p) => ({
      vacation: acc.vacation + p.vacationProvision,
      bonus: acc.bonus + p.bonusVacacional,
      utility: acc.utility + p.utilityProvision,
      severance: acc.severance + p.severanceProvision,
      total: acc.total + p.totalProvision,
    }), { vacation: 0, bonus: 0, utility: 0, severance: 0, total: 0 });

    return {
      date,
      employees: provisiones,
      totals: {
        vacaciones: totals.vacation,
        bonoVacacional: totals.bonus,
        utilidades: totals.utility,
        prestaciones: totals.severance,
        total: totals.total,
      },
    };
  }

  private getYearsOfService(hireDate: Date): number {
    return Math.floor((Date.now() - new Date(hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **LOTTT**: Cumplir con Ley Orgánica del Trabajo venezolana
2. **IVSS**: 4% empleado, 9% patronal (tope 5 salarios mínimos)
3. **FAOV**: 1% empleado, 2% patronal
4. **INCE**: 0.5% solo patronal
5. **Vacaciones**: 15 días + 1 por año (máx 30) + bono vacacional
6. **Utilidades**: Mínimo 15 días de salario (máx 4 meses)
7. **Prestaciones**: 5 días por trimestre después del primer año
8. **Horas Extras**: 50% recargo diurno, 30% nocturno
9. **ISLR**: Tabla progresiva según ingreso anual
10. **Nómina**: Genera asiento contable automático

---

## 🔗 Conexiones Detalladas

### Con Contabilidad

```typescript
// Al procesar nómina:
await this.contabilidadService.createEntryFromNomina({
  id: payroll.id,
  periodStart: payroll.periodStart,
  periodEnd: payroll.periodEnd,
  totalSalaries: payroll.totalGross,
  totalIvss: payroll.items.reduce((sum, i) => sum + i.ivss, 0),
  totalFaov: payroll.items.reduce((sum, i) => sum + i.faov, 0),
  totalInce: payroll.items.reduce((sum, i) => sum + i.ince, 0),
  totalNeto: payroll.totalNet,
  createdBy: userId,
});

// Asiento generado:
// Débito: Gasto de Salarios (totalGross)
// Crédito: IVSS por Pagar (totalIvss)
// Crédito: FAOV por Pagar (totalFaov)
// Crédito: INCE por Pagar (totalInce)
// Crédito: Salarios Netos por Pagar (totalNeto)
```

### Con Ventas (Comisiones)

```typescript
// Al facturar venta (03-comercial/ventas.md):
await this.prisma.salesCommission.create({
  userId: sale.sellerId,
  employeeId: sellerEmployeeId,
  saleId: sale.id,
  rate: commissionRate,
  amount: sale.subtotal * commissionRate,
  status: 'PENDING',
});

// Al procesar nómina:
const commissions = await this.prisma.salesCommission.findMany({
  where: {
    employeeId: employee.id,
    status: 'PENDING',
    createdAt: { gte: periodStart, lte: periodEnd },
  },
});

// Después de pagar:
await this.prisma.salesCommission.updateMany({
  where: { ... },
  data: { status: 'PAID', paidAt: new Date() },
});
```

---

## 📁 Archivos del Submódulo

```
01-modulo-administrativo/
├── contabilidad.md
├── finanzas.md
├── tesoreria.md
├── impuestos.md
├── activos-fijos.md
└── rrhh/
    ├── empleados.md (este archivo)
    └── nomina.md
```

**Anterior**: `01-administrativo/contabilidad.md` | **Siguiente**: `01-administrativo/finanzas.md`
