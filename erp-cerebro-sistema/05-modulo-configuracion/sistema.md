# Módulo 05: CONFIGURACIÓN - Sistema y Administración

## Descripción

Módulo de configuración y administración del sistema ERP. Centraliza toda la configuración, gestión de usuarios, roles, tablas del sistema, seguridad e integraciones.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    TODOS LOS MÓDULOS                            │
│  (01-administrativo, 02-operativo, 03-comercial, etc.)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Lee configuración
                              │ Valida permisos
                              │ Consulta tablas
                              ▼
                    ┌─────────────────────┐
                    │  05-configuracion   │
                    │  - Sistema          │
                    │  - Usuarios         │
                    │  - Tablas           │
                    │  - Seguridad        │
                    │  - Integraciones    │
                    └─────────────────────┘
```

**Regla Crítica**: TODOS los módulos leen configuración de aquí. NINGÚN módulo tiene su propia configuración hardcodeada.

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE EMPRESA
// ─────────────────────────────────────────────────────────────────────────────

model CompanyConfig {
  id              String   @id @default(cuid())
  businessName    String
  rif             String
  address         String
  phone           String?
  email           String?
  logoUrl         String?
  
  // Configuración fiscal
  fiscalYear      String   @default("ENERO-DICIEMBRE") // ENERO-DICIEMBRE | OCTUBRE-SEPTIEMBRE
  currency        String   @default("VES")
  taxRate         Float    @default(0.16) // 16% IVA general
  
  // Facturación
  invoicePrefix   String   @default("F")
  invoiceControl  String   @default("00-00000001") // Número de control SENIAT
  invoiceSeries   String   @default("A")
  nextInvoiceNum  Int      @default(1)
  
  // Configuración de ventas
  checkStock      Boolean  @default(true) // Verificar stock al facturar
  allowNegativeStock Boolean @default(false) // Permitir stock negativo
  commissionRate  Float    @default(0) // Comisión por defecto
  
  // Configuración de inventario
  defaultWarehouseId String?
  defaultWarehouse   Warehouse? @relation(fields: [defaultWarehouseId], references: [id])
  valuationMethod String   @default("PROMEDIO") // PROMEDIO | PEPS
  
  // Actualización
  updatedAt       DateTime @updatedAt
  updatedBy       String?

  @@index([rif])
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL SISTEMA (Parámetros)
// ─────────────────────────────────────────────────────────────────────────────

model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique // ej. accounting.accounts_receivable
  value     String   // Valor almacenado (string, number, JSON)
  type      String   @default("string") // string, number, boolean, json
  group     String   // accounting, sales, hr, inventory, general
  label     String   // Descripción legible
  isPublic  Boolean  @default(false) // Visible para todos los usuarios?
  isEditable Boolean @default(true) // Se puede editar desde UI?
  updatedAt DateTime @updatedAt
  updatedBy String?

  @@index([group])
  @@index([key])
}

// Ejemplos de claves de configuración:
// accounting.accounts_receivable = "cuid_cuenta"
// accounting.accounts_payable    = "cuid_cuenta"
// accounting.sales_revenue       = "cuid_cuenta"
// accounting.iva_payable         = "cuid_cuenta"
// accounting.iva_credit          = "cuid_cuenta"
// accounting.inventory           = "cuid_cuenta"
// accounting.cost_of_sales       = "cuid_cuenta"
// accounting.cash                = "cuid_cuenta"
// accounting.salary_expense      = "cuid_cuenta"
// accounting.ivss_payable        = "cuid_cuenta"
// accounting.faov_payable        = "cuid_cuenta"
// accounting.ince_payable        = "cuid_cuenta"
// hr.ivss_rate_employee          = "0.04"
// hr.ivss_rate_employer          = "0.09"
// hr.faov_rate_employee          = "0.01"
// hr.faov_rate_employer          = "0.02"
// hr.ince_rate                   = "0.005"
// hr.cesta_ticket_amount         = "1500"
// hr.utility_days                = "15"
// inventory.default_warehouse    = "cuid_almacen"
// inventory.alert_min_stock      = "true"
// sales.commission_rate          = "0.03"
// sales.check_stock              = "true"
// sales.allow_credit_sales       = "true"
// sales.max_credit_days          = "30"

// ─────────────────────────────────────────────────────────────────────────────
// TABLAS DEL SISTEMA (Catálogos)
// ─────────────────────────────────────────────────────────────────────────────

model SystemTable {
  id          String   @id @default(cuid())
  name        String   @unique // ej. payment_methods, shipping_methods
  description String?
  isSystem    Boolean  @default(false) // Tablas del sistema no editables
  items       SystemTableItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}

model SystemTableItem {
  id          String   @id @default(cuid())
  tableId     String
  table       SystemTable @relation(fields: [tableId], references: [id], onDelete: Cascade)
  code        String
  name        String
  description String?
  color       String?
  icon        String?
  isActive    Boolean  @default(true)
  order       Int      @default(0)
  extraData   Json?    // Datos adicionales en JSON
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tableId])
  @@index([code])
  @@unique([tableId, code])
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDITORÍA Y SEGURIDAD
// ─────────────────────────────────────────────────────────────────────────────

model SecurityPolicy {
  id                  String   @id @default(cuid())
  name                String   @unique
  description         String?
  isEnabled           Boolean  @default(true)
  
  // Política de contraseñas
  minPasswordLength   Int      @default(10)
  requireUppercase    Boolean  @default(true)
  requireLowercase    Boolean  @default(true)
  requireNumbers      Boolean  @default(true)
  requireSpecial      Boolean  @default(true)
  passwordHistory     Int      @default(5) // Cuántas contraseñas recordar
  passwordExpiryDays  Int      @default(90) // Días para expiración
  
  // Política de sesiones
  maxConcurrentSessions Int    @default(3)
  sessionTimeoutMinutes Int    @default(480) // 8 horas
  inactiveTimeoutMinutes Int   @default(30)
  
  // Política de bloqueo
  maxFailedAttempts   Int      @default(5)
  lockoutDurationMinutes Int   @default(15)
  
  // Auditoría
  enableAuditLog      Boolean  @default(true)
  auditLogRetentionDays Int    @default(365)
  
  updatedAt         DateTime @updatedAt
  updatedBy         String?
}

model PasswordHistory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  hash      String
  createdAt DateTime @default(now())

  @@index([userId])
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRACIONES
// ─────────────────────────────────────────────────────────────────────────────

model IntegrationConfig {
  id          String   @id @default(cuid())
  name        String   @unique // ej. SENIAT, BCV, BANK_MERCANTIL
  type        String   // API, WEBHOOK, FILE
  isActive    Boolean  @default(true)
  
  // Configuración
  baseUrl     String?
  apiKey      String?  // Encriptada
  apiSecret   String?  // Encriptada
  username    String?
  password    String?  // Encriptada
  
  // Configuración específica en JSON
  config      Json?
  
  // Webhooks
  webhookUrl  String?
  webhookSecret String?
  
  // Estado
  lastSync    DateTime?
  lastStatus  String?  // SUCCESS, ERROR
  lastError   String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  updatedBy   String?

  @@index([type])
  @@index([isActive])
}

model WebhookLog {
  id          String   @id @default(cuid())
  integrationId String
  integration IntegrationConfig? @relation(fields: [integrationId], references: [id])
  direction   String   // INCOMING, OUTGOING
  url         String
  method      String   // GET, POST, PUT, DELETE
  headers     Json?
  payload     Json?
  statusCode  Int?
  response    Json?
  error       String?
  duration    Int?     // Milisegundos
  createdAt   DateTime @default(now())

  @@index([integrationId])
  @@index([direction])
  @@index([createdAt])
}

// ─────────────────────────────────────────────────────────────────────────────
// SECUENCIAS Y CONSECUTIVOS
// ─────────────────────────────────────────────────────────────────────────────

model Sequence {
  id          String   @id @default(cuid())
  name        String   @unique // ej. sale_number, invoice_number
  prefix      String?
  suffix      String?
  current     Int      @default(0)
  minLength   Int      @default(6) // Rellenar con ceros
  resetPeriod String   @default("YEAR") // NONE, YEAR, MONTH, DAY
  lastReset   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}
```

---

## 📡 Endpoints de la API

### Controller de Configuración

```typescript
// apps/backend/src/modules/configuracion/configuracion.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ConfiguracionService } from './configuracion.service';

@Controller('configuracion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConfiguracionController {
  constructor(private configuracionService: ConfiguracionService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CONFIGURACIÓN DE EMPRESA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('empresa')
  @RequirePermissions('configuracion-empresa:read')
  async getEmpresa() {
    return this.configuracionService.getEmpresa();
  }

  @Put('empresa')
  @RequirePermissions('configuracion-empresa:update')
  async updateEmpresa(@Body() dto: UpdateEmpresaDto, @User() user: any) {
    return this.configuracionService.updateEmpresa(dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONFIGURACIÓN DEL SISTEMA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('sistema')
  @RequirePermissions('configuracion-tablas:read')
  async getSistemaConfig(@Query('group') group?: string) {
    return this.configuracionService.getSistemaConfig(group);
  }

  @Put('sistema/:key')
  @RequirePermissions('configuracion-tablas:update')
  async updateSistemaConfig(
    @Param('key') key: string,
    @Body() dto: UpdateSystemConfigDto,
    @User() user: any,
  ) {
    return this.configuracionService.updateSistemaConfig(key, dto, user.id);
  }

  @Get('sistema/group/:group')
  @RequirePermissions('configuracion-tablas:read')
  async getConfigByGroup(@Param('group') group: string) {
    return this.configuracionService.getConfigByGroup(group);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TABLAS DEL SISTEMA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('tablas')
  @RequirePermissions('configuracion-tablas:read')
  async getTablas() {
    return this.configuracionService.getTablas();
  }

  @Get('tablas/:name/items')
  @RequirePermissions('configuracion-tablas:read')
  async getTablaItems(@Param('name') name: string) {
    return this.configuracionService.getTablaItems(name);
  }

  @Post('tablas')
  @RequirePermissions('configuracion-tablas:create')
  async createTabla(@Body() dto: CreateSystemTableDto, @User() user: any) {
    return this.configuracionService.createTabla(dto, user.id);
  }

  @Post('tablas/:name/items')
  @RequirePermissions('configuracion-tablas:create')
  async createTablaItem(
    @Param('name') name: string,
    @Body() dto: CreateSystemTableItemDto,
    @User() user: any,
  ) {
    return this.configuracionService.createTablaItem(name, dto, user.id);
  }

  @Put('tablas/items/:id')
  @RequirePermissions('configuracion-tablas:update')
  async updateTablaItem(
    @Param('id') id: string,
    @Body() dto: UpdateSystemTableItemDto,
    @User() user: any,
  ) {
    return this.configuracionService.updateTablaItem(id, dto, user.id);
  }

  @Delete('tablas/items/:id')
  @RequirePermissions('configuracion-tablas:delete')
  async deleteTablaItem(@Param('id') id: string) {
    return this.configuracionService.deleteTablaItem(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // USUARIOS Y ROLES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('usuarios')
  @RequirePermissions('configuracion-usuarios:read')
  async getUsuarios(@Query('roleId') roleId?: string) {
    return this.configuracionService.getUsuarios(roleId);
  }

  @Post('usuarios')
  @RequirePermissions('configuracion-usuarios:create')
  async createUsuario(@Body() dto: CreateUsuarioDto, @User() user: any) {
    return this.configuracionService.createUsuario(dto, user.id);
  }

  @Put('usuarios/:id')
  @RequirePermissions('configuracion-usuarios:update')
  async updateUsuario(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @User() user: any,
  ) {
    return this.configuracionService.updateUsuario(id, dto, user.id);
  }

  @Delete('usuarios/:id')
  @RequirePermissions('configuracion-usuarios:delete')
  async deleteUsuario(@Param('id') id: string) {
    return this.configuracionService.deleteUsuario(id);
  }

  @Post('usuarios/:id/reset-password')
  @RequirePermissions('configuracion-usuarios:update')
  async resetPassword(@Param('id') id: string) {
    return this.configuracionService.resetPassword(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ROLES Y PERMISOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('roles')
  @RequirePermissions('configuracion-usuarios:read')
  async getRoles() {
    return this.configuracionService.getRoles();
  }

  @Get('roles/:id/permissions')
  @RequirePermissions('configuracion-usuarios:read')
  async getRolePermissions(@Param('id') id: string) {
    return this.configuracionService.getRolePermissions(id);
  }

  @Put('roles/:id/permissions')
  @RequirePermissions('configuracion-usuarios:update')
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionsDto,
    @User() user: any,
  ) {
    return this.configuracionService.updateRolePermissions(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SEGURIDAD
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('security-policies')
  @RequirePermissions('configuracion-seguridad:read')
  async getSecurityPolicies() {
    return this.configuracionService.getSecurityPolicies();
  }

  @Put('security-policies/:id')
  @RequirePermissions('configuracion-seguridad:update')
  async updateSecurityPolicy(
    @Param('id') id: string,
    @Body() dto: UpdateSecurityPolicyDto,
    @User() user: any,
  ) {
    return this.configuracionService.updateSecurityPolicy(id, dto, user.id);
  }

  @Get('audit-logs')
  @RequirePermissions('configuracion-seguridad:read')
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.configuracionService.getAuditLogs(query);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTEGRACIONES
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('integrations')
  @RequirePermissions('configuracion-integraciones:read')
  async getIntegrations() {
    return this.configuracionService.getIntegrations();
  }

  @Post('integrations')
  @RequirePermissions('configuracion-integraciones:create')
  async createIntegration(@Body() dto: CreateIntegrationDto, @User() user: any) {
    return this.configuracionService.createIntegration(dto, user.id);
  }

  @Put('integrations/:id')
  @RequirePermissions('configuracion-integraciones:update')
  async updateIntegration(
    @Param('id') id: string,
    @Body() dto: UpdateIntegrationDto,
    @User() user: any,
  ) {
    return this.configuracionService.updateIntegration(id, dto, user.id);
  }

  @Post('integrations/:id/test')
  @RequirePermissions('configuracion-integraciones:update')
  async testIntegration(@Param('id') id: string) {
    return this.configuracionService.testIntegration(id);
  }

  @Get('integrations/:id/logs')
  @RequirePermissions('configuracion-integraciones:read')
  async getIntegrationLogs(@Param('id') id: string, @Query() query: WebhookLogQueryDto) {
    return this.configuracionService.getIntegrationLogs(id, query);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONSECUTIVOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('sequences')
  @RequirePermissions('configuracion-tablas:read')
  async getSequences() {
    return this.configuracionService.getSequences();
  }

  @Put('sequences/:id')
  @RequirePermissions('configuracion-tablas:update')
  async updateSequence(
    @Param('id') id: string,
    @Body() dto: UpdateSequenceDto,
    @User() user: any,
  ) {
    return this.configuracionService.updateSequence(id, dto, user.id);
  }

  @Post('sequences/:id/reset')
  @RequirePermissions('configuracion-tablas:update')
  async resetSequence(@Param('id') id: string) {
    return this.configuracionService.resetSequence(id);
  }
}
```

---

## 🧩 Servicio de Configuración

### Funciones Principales

```typescript
// apps/backend/src/modules/configuracion/configuracion.service.ts

@Injectable()
export class ConfiguracionService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService, // Servicio de encriptación
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CONFIGURACIÓN DE EMPRESA
  // ───────────────────────────────────────────────────────────────────────────
  
  async getEmpresa() {
    const config = await this.prisma.companyConfig.findFirst();
    
    if (!config) {
      // Crear configuración por defecto si no existe
      return this.prisma.companyConfig.create({
        data: {
          businessName: 'Empresa C.A.',
          rif: 'J-00000000-0',
          address: 'Dirección fiscal',
          phone: '',
          email: '',
          fiscalYear: 'ENERO-DICIEMBRE',
          currency: 'VES',
          taxRate: 0.16,
          invoicePrefix: 'F',
          invoiceControl: '00-00000001',
          invoiceSeries: 'A',
          nextInvoiceNum: 1,
          checkStock: true,
          allowNegativeStock: false,
          commissionRate: 0,
          valuationMethod: 'PROMEDIO',
        },
      });
    }
    
    return config;
  }

  async updateEmpresa(dto: UpdateEmpresaDto, userId: string) {
    const config = await this.prisma.companyConfig.findFirst();
    
    if (!config) {
      throw new NotFoundException('Configuración de empresa no encontrada');
    }

    // Validar RIF
    if (dto.rif && !this.validateRIF(dto.rif)) {
      throw new BadRequestException('RIF inválido');
    }

    const updated = await this.prisma.companyConfig.update({
      where: { id: config.id },
      data: {
        ...dto,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    // Registrar auditoría
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        module: 'configuracion',
        entityType: 'CompanyConfig',
        entityId: config.id,
        before: config,
        after: updated,
      },
    });

    return updated;
  }

  private validateRIF(rif: string): boolean {
    // Validar formato RIF venezolano: V-12345678-0, J-12345678-9, etc.
    const regex = /^[VEJPGvejpg]-\d{8}-\d{1}$/;
    if (!regex.test(rif)) return false;

    // Validar dígito verificador
    const tipo = rif[0].toUpperCase();
    const num = rif.slice(2, -2);
    const dv = parseInt(rif[rif.length - 1]);

    const base = { V: 1, E: 2, J: 3, P: 4, G: 5 }[tipo] || 0;
    let suma = 0;
    let multiplicador = 1;

    for (let i = num.length - 1; i >= 0; i--) {
      suma += parseInt(num[i]) * multiplicador;
      multiplicador = multiplicador === 1 ? 2 : 1;
    }

    suma += base;
    const resto = suma % 11;
    const calculado = resto === 0 ? 0 : 11 - resto;

    return calculado === dv;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONFIGURACIÓN DEL SISTEMA
  // ───────────────────────────────────────────────────────────────────────────
  
  async getSistemaConfig(group?: string) {
    const where = group ? { group } : {};
    
    return this.prisma.systemConfig.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  }

  async getConfigByGroup(group: string) {
    const configs = await this.prisma.systemConfig.findMany({
      where: { group },
      orderBy: { key: 'asc' },
    });

    // Convertir valores al tipo correcto
    return configs.map(config => ({
      ...config,
      value: this.parseValue(config.value, config.type),
    }));
  }

  async updateSistemaConfig(key: string, dto: UpdateSystemConfigDto, userId: string) {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuración ${key} no encontrada`);
    }

    if (!config.isEditable) {
      throw new BadRequestException(`La configuración ${key} no es editable`);
    }

    // Validar tipo
    const stringValue = this.stringifyValue(dto.value, dto.type || config.type);

    const updated = await this.prisma.systemConfig.update({
      where: { key },
      data: {
        value: stringValue,
        type: dto.type || config.type,
        label: dto.label || config.label,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    // Registrar auditoría
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        module: 'configuracion',
        entityType: 'SystemConfig',
        entityId: config.id,
        before: config,
        after: updated,
      },
    });

    return updated;
  }

  // Método helper para obtener configuración (usado por otros módulos)
  async get(key: string, defaultValue?: string): Promise<string> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });

    return config?.value ?? defaultValue ?? '';
  }

  async getNumber(key: string, defaultValue = 0): Promise<number> {
    const val = await this.get(key);
    return val ? parseFloat(val) : defaultValue;
  }

  async getBoolean(key: string, defaultValue = false): Promise<boolean> {
    const val = await this.get(key);
    return val ? val.toLowerCase() === 'true' : defaultValue;
  }

  async getJSON(key: string, defaultValue?: any): Promise<any> {
    const val = await this.get(key);
    try {
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private parseValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  }

  private stringifyValue(value: any, type: string): string {
    switch (type) {
      case 'number':
        return value.toString();
      case 'boolean':
        return value ? 'true' : 'false';
      case 'json':
        return JSON.stringify(value);
      default:
        return value.toString();
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TABLAS DEL SISTEMA
  // ───────────────────────────────────────────────────────────────────────────
  
  async getTablas() {
    return this.prisma.systemTable.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getTablaItems(name: string) {
    const table = await this.prisma.systemTable.findUnique({
      where: { name },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`Tabla ${name} no encontrada`);
    }

    return table.items;
  }

  async createTabla(dto: CreateSystemTableDto, userId: string) {
    // Verificar que no exista
    const existing = await this.prisma.systemTable.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`La tabla ${dto.name} ya existe`);
    }

    const table = await this.prisma.systemTable.create({
      data: {
        name: dto.name,
        description: dto.description,
        isSystem: false,
      },
    });

    // Registrar auditoría
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        module: 'configuracion',
        entityType: 'SystemTable',
        entityId: table.id,
        after: table,
      },
    });

    return table;
  }

  async createTablaItem(tableName: string, dto: CreateSystemTableItemDto, userId: string) {
    const table = await this.prisma.systemTable.findUnique({
      where: { name: tableName },
    });

    if (!table) {
      throw new NotFoundException(`Tabla ${tableName} no encontrada`);
    }

    // Verificar que no exista el código
    const existing = await this.prisma.systemTableItem.findUnique({
      where: {
        tableId_code: {
          tableId: table.id,
          code: dto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`El código ${dto.code} ya existe en la tabla ${tableName}`);
    }

    const item = await this.prisma.systemTableItem.create({
      data: {
        tableId: table.id,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
        extraData: dto.extraData,
      },
    });

    // Registrar auditoría
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        module: 'configuracion',
        entityType: 'SystemTableItem',
        entityId: item.id,
        after: item,
      },
    });

    return item;
  }

  async updateTablaItem(id: string, dto: UpdateSystemTableItemDto, userId: string) {
    const item = await this.prisma.systemTableItem.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    if (item.table.isSystem) {
      throw new BadRequestException('No se pueden editar items de tablas del sistema');
    }

    const updated = await this.prisma.systemTableItem.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    // Registrar auditoría
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        module: 'configuracion',
        entityType: 'SystemTableItem',
        entityId: id,
        before: item,
        after: updated,
      },
    });

    return updated;
  }

  async deleteTablaItem(id: string) {
    const item = await this.prisma.systemTableItem.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    if (item.table.isSystem) {
      throw new BadRequestException('No se pueden eliminar items de tablas del sistema');
    }

    // Verificar si está en uso (esto depende de la tabla específica)
    // Implementar según cada tabla

    await this.prisma.systemTableItem.delete({
      where: { id },
    });

    // Registrar auditoría
    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        module: 'configuracion',
        entityType: 'SystemTableItem',
        entityId: id,
      },
    });

    return { success: true };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SECUENCIAS Y CONSECUTIVOS
  // ───────────────────────────────────────────────────────────────────────────
  
  async getNextSequence(name: string): Promise<string> {
    const sequence = await this.prisma.sequence.findUnique({
      where: { name },
    });

    if (!sequence) {
      throw new NotFoundException(`Secuencia ${name} no encontrada`);
    }

    // Verificar si necesita reset
    const now = new Date();
    let shouldReset = false;

    if (sequence.resetPeriod === 'YEAR') {
      shouldReset = !sequence.lastReset || 
        new Date(sequence.lastReset).getFullYear() !== now.getFullYear();
    } else if (sequence.resetPeriod === 'MONTH') {
      shouldReset = !sequence.lastReset ||
        new Date(sequence.lastReset).getMonth() !== now.getMonth();
    } else if (sequence.resetPeriod === 'DAY') {
      shouldReset = !sequence.lastReset ||
        new Date(sequence.lastReset).toDateString() !== now.toDateString();
    }

    let current = sequence.current;

    if (shouldReset) {
      current = 0;
    }

    // Incrementar
    const next = current + 1;

    await this.prisma.sequence.update({
      where: { id: sequence.id },
      data: {
        current: next,
        lastReset: shouldReset ? now : undefined,
        updatedAt: now,
      },
    });

    // Formatear número
    const formatted = next.toString().padStart(sequence.minLength, '0');
    
    return `${sequence.prefix || ''}${formatted}${sequence.suffix || ''}`;
  }

  async resetSequence(id: string) {
    const sequence = await this.prisma.sequence.findUnique({
      where: { id },
    });

    if (!sequence) {
      throw new NotFoundException('Secuencia no encontrada');
    }

    await this.prisma.sequence.update({
      where: { id },
      data: {
        current: 0,
        lastReset: new Date(),
      },
    });

    return { success: true };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTEGRACIONES
  // ───────────────────────────────────────────────────────────────────────────
  
  async createIntegration(dto: CreateIntegrationDto, userId: string) {
    // Encriptar credenciales
    const encryptedData: any = {};
    
    if (dto.apiKey) {
      encryptedData.apiKey = this.crypto.encrypt(dto.apiKey);
    }
    if (dto.apiSecret) {
      encryptedData.apiSecret = this.crypto.encrypt(dto.apiSecret);
    }
    if (dto.password) {
      encryptedData.password = this.crypto.encrypt(dto.password);
    }

    const integration = await this.prisma.integrationConfig.create({
      data: {
        ...dto,
        ...encryptedData,
      },
    });

    // Registrar auditoría (sin credenciales)
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        module: 'configuracion',
        entityType: 'IntegrationConfig',
        entityId: integration.id,
        after: { ...integration, apiKey: '***', apiSecret: '***', password: '***' },
      },
    });

    return integration;
  }

  async testIntegration(id: string) {
    const integration = await this.prisma.integrationConfig.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new NotFoundException('Integración no encontrada');
    }

    // Desencriptar credenciales
    const credentials: any = {};
    if (integration.apiKey) {
      credentials.apiKey = this.crypto.decrypt(integration.apiKey);
    }
    if (integration.apiSecret) {
      credentials.apiSecret = this.crypto.decrypt(integration.apiSecret);
    }
    if (integration.password) {
      credentials.password = this.crypto.decrypt(integration.password);
    }

    try {
      // Testear conexión según tipo
      let result: any;

      if (integration.type === 'API') {
        result = await this.testAPIIntegration(integration, credentials);
      } else if (integration.type === 'WEBHOOK') {
        result = await this.testWebhookIntegration(integration);
      }

      // Actualizar estado
      await this.prisma.integrationConfig.update({
        where: { id },
        data: {
          lastSync: new Date(),
          lastStatus: 'SUCCESS',
          lastError: null,
        },
      });

      return { success: true, result };
    } catch (error: any) {
      await this.prisma.integrationConfig.update({
        where: { id },
        data: {
          lastSync: new Date(),
          lastStatus: 'ERROR',
          lastError: error.message,
        },
      });

      throw new BadRequestException(`Test fallido: ${error.message}`);
    }
  }

  private async testAPIIntegration(integration: any, credentials: any) {
    // Testear conexión API
    const response = await fetch(integration.baseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { status: 'OK', statusCode: response.status };
  }

  private async testWebhookIntegration(integration: any) {
    // Enviar webhook de test
    const payload = { test: true, timestamp: new Date().toISOString() };
    
    const response = await fetch(integration.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': this.generateWebhookSignature(payload, integration.webhookSecret),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { status: 'OK', statusCode: response.status };
  }

  private generateWebhookSignature(payload: any, secret?: string): string {
    if (!secret) return '';
    
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Configuración Única**: Solo debe haber UN registro de CompanyConfig
2. **RIF Válido**: Debe validar algoritmo de RIF venezolano
3. **Consecutivos**: Números de factura deben ser consecutivos y únicos
4. **Encriptación**: Credenciales de integraciones deben estar encriptadas
5. **Auditoría**: TODOS los cambios se registran en audit_log
6. **Tablas Sistema**: Las tablas isSystem=true no se pueden eliminar

---

## 🔗 Conexiones con Otros Módulos

### Todos los módulos leen configuración

```typescript
// Ejemplo: Módulo de Ventas lee configuración
const checkStock = await this.config.get('ventas.check_stock', 'true');
const commissionRate = await this.config.get('ventas.commission_rate', '0.03');

// Ejemplo: Módulo de Contabilidad lee cuentas
const accountsReceivable = await this.config.get('accounting.accounts_receivable');
const accountsSales = await this.config.get('accounting.sales_revenue');

// Ejemplo: Módulo de RRHH lee tasas
const ivssRateEmployee = await this.config.getNumber('hr.ivss_rate_employee', 0.04);
const cestaTicketAmount = await this.config.getNumber('hr.cesta_ticket_amount', 0);
```

---

## 📁 Archivos del Módulo

```
05-modulo-configuracion/
├── sistema.md (este archivo)
├── usuarios.md
├── tablas.md
├── seguridad.md
└── integraciones.md
```

**Anterior**: `04-rrhh/nomina.md` | **Siguiente**: `06-reportes/dashboard.md`
