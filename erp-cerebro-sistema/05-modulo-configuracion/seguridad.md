# Módulo 05: CONFIGURACIÓN - Seguridad y Auditoría

## Descripción

Módulo de seguridad que incluye políticas de contraseñas, auditoría de acciones, logs de actividad, control de accesos y cumplimiento de normativas.

## 🔗 Conexiones con Todos los Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                       │
├─────────────────────────────────────────────────────────────────┤
│  00-shared/auth.md          → Logs de autenticación            │
│  00-shared/rbac.md          → Auditoría de permisos            │
├─────────────────────────────────────────────────────────────────┤
│  TODOS LOS MÓDULOS          → Registro de acciones             │
│                             → Logs de cambios                  │
│                             → Trazabilidad                     │
└─────────────────────────────────────────────────────────────────┘
```

**Reglas de Conexión**:
1. TODAS las acciones críticas **REGISTRAN** en auditoría
2. TODOS los cambios importantes **GUARDAN** snapshot antes/después
3. TODOS los accesos **DEJAN** traza de IP y user agent
4. LOS reportes de auditoría **CONSOLIDAN** datos de todos los módulos

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// POLÍTICAS DE SEGURIDAD
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
  passwordHistory     Int      @default(5) // Cuántas recordar
  passwordExpiryDays  Int      @default(90) // Días para expiración
  
  // Política de sesiones
  maxConcurrentSessions Int    @default(3)
  sessionTimeoutMinutes Int    @default(480) // 8 horas
  inactiveTimeoutMinutes Int   @default(30) // Inactividad
  
  // Política de bloqueo
  maxFailedAttempts   Int      @default(5)
  lockoutDurationMinutes Int   @default(15)
  
  // Política de IP
  allowedIPs          String[] // IPs permitidas (vacío = todas)
  blockedIPs          String[] // IPs bloqueadas
  requireTwoFactor    Boolean  @default(false)
  
  // Auditoría
  enableAuditLog      Boolean  @default(true)
  auditLogRetentionDays Int    @default(365)
  enableLoginAlert    Boolean  @default(true)
  
  // Actualización
  updatedAt         DateTime @updatedAt
  updatedBy         String?

  @@index([isEnabled])
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGS DE AUDITORÍA
// ─────────────────────────────────────────────────────────────────────────────

model AuditLog {
  id         String   @id @default(cuid())
  
  // Usuario
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  userName   String   // Copia del nombre (por si se elimina el usuario)
  userRole   String?  // Rol en el momento de la acción
  
  // Acción
  action     String   // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc.
  module     String   // Módulo donde ocurrió (ventas, contabilidad, etc.)
  
  // Entidad afectada
  entityType String?  // Tipo de entidad (Sale, Purchase, etc.)
  entityId   String?  // ID de la entidad
  
  // Snapshots
  before     Json?    // Estado antes del cambio
  after      Json?    // Estado después del cambio
  
  // Contexto
  ipAddress  String?
  userAgent  String?
  referer    String?
  
  // Metadata adicional
  metadata   Json?
  
  // Timestamp
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([module])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@index([ipAddress])
}

// ─────────────────────────────────────────────────────────────────────────────
// INTENTOS DE ACCESO
// ─────────────────────────────────────────────────────────────────────────────

model AccessAttempt {
  id          String   @id @default(cuid())
  
  // Intento
  email       String?
  ipAddress   String
  userAgent   String?
  
  // Resultado
  success     Boolean
  reason      String? // INVALID_CREDENTIALS, USER_INACTIVE, MFA_REQUIRED, etc.
  
  // Usuario (si se identificó)
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  
  // Geolocalización
  country     String?
  city        String?
  latitude    Float?
  longitude   Float?
  
  createdAt   DateTime @default(now())

  @@index([email])
  @@index([ipAddress])
  @@index([success])
  @@index([createdAt])
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERTAS DE SEGURIDAD
// ─────────────────────────────────────────────────────────────────────────────

model SecurityAlert {
  id          String   @id @default(cuid())
  
  // Tipo de alerta
  type        AlertType // LOGIN_SOSPECHOSO, ACCESO_DENEGADO, CAMBIO_CRITICO, etc.
  severity    Severity  // LOW, MEDIUM, HIGH, CRITICAL
  
  // Descripción
  title       String
  description String?
  
  // Contexto
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  ipAddress   String?
  module      String?
  entityId    String?
  
  // Estado
  status      String   @default("NEW") // NEW, IN_REVIEW, RESOLVED, FALSE_POSITIVE
  reviewedBy  String?
  reviewedAt  DateTime?
  resolution  String?
  
  // Acciones tomadas
  actionsTaken Json?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([type])
  @@index([severity])
  @@index([status])
  @@index([userId])
  @@index([createdAt])
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIAL DE CONTRASEÑAS
// ─────────────────────────────────────────────────────────────────────────────

model PasswordHistory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  hash      String
  createdAt DateTime @default(now())

  @@index([userId])
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVIDAD DE USUARIOS
// ─────────────────────────────────────────────────────────────────────────────

model UserActivity {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  // Actividad
  action      String   // VIEW, CREATE, UPDATE, DELETE, EXPORT, PRINT
  module      String
  description String?
  
  // Contexto
  ipAddress   String?
  userAgent   String?
  sessionId   String?
  
  // Duración (para sesiones)
  duration    Int?     // Segundos
  
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([module])
  @@index([createdAt])
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE AUDITORÍA
// ─────────────────────────────────────────────────────────────────────────────

model AuditConfig {
  id          String   @id @default(cuid())
  module      String   @unique
  
  // Qué auditar
  auditCreate Boolean  @default(true)
  auditUpdate Boolean  @default(true)
  auditDelete Boolean  @default(true)
  auditView   Boolean  @default(false)
  auditExport Boolean  @default(true)
  
  // Campos sensibles (no guardar en audit log)
  sensitiveFields String[] // ej. ["password", "creditCard", "ssn"]
  
  // Retención específica
  retentionDays Int?     // Null = usar default del sistema
  
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([module])
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum AlertType {
  LOGIN_SOSPECHOSO
  ACCESO_DENEGADO
  CAMBIO_CRITICO
  EXPORT_MASIVA
  INTENTO_BLOQUEO
  IP_DESCONOCIDA
  HORARIO_INUSUAL
  MULTIPLES_SESIONES
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## 📡 Endpoints de la API

### Controller de Seguridad

```typescript
// apps/backend/src/modules/seguridad/seguridad.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { SeguridadService } from './seguridad.service';

@Controller('seguridad')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SeguridadController {
  constructor(private seguridadService: SeguridadService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // POLÍTICAS DE SEGURIDAD
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('policies')
  @RequirePermissions('configuracion-seguridad:read')
  async getPolicies() {
    return this.seguridadService.getPolicies();
  }

  @Put('policies/:id')
  @RequirePermissions('configuracion-seguridad:update')
  async updatePolicy(
    @Param('id') id: string,
    @Body() dto: UpdateSecurityPolicyDto,
    @User() user: any,
  ) {
    return this.seguridadService.updatePolicy(id, dto, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // AUDITORÍA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('audit-logs')
  @RequirePermissions('configuracion-seguridad:read')
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number,
  ) {
    return this.seguridadService.getAuditLogs({
      userId,
      module,
      action,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: parseInt(limit?.toString() || '100'),
    });
  }

  @Get('audit-logs/:id')
  @RequirePermissions('configuracion-seguridad:read')
  async getAuditLog(@Param('id') id: string) {
    return this.seguridadService.getAuditLog(id);
  }

  @Get('audit-logs/entity/:entityType/:entityId')
  @RequirePermissions('configuracion-seguridad:read')
  async getEntityAuditLog(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.seguridadService.getEntityAuditLog(entityType, entityId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTENTOS DE ACCESO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('access-attempts')
  @RequirePermissions('configuracion-seguridad:read')
  async getAccessAttempts(
    @Query('email') email?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('success') success?: boolean,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.seguridadService.getAccessAttempts({
      email,
      ipAddress,
      success: success !== undefined ? success : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('access-attempts/stats')
  @RequirePermissions('configuracion-seguridad:read')
  async getAccessAttemptsStats(@Query('days') days?: number) {
    return this.seguridadService.getAccessAttemptsStats(parseInt(days?.toString() || '30'));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ALERTAS DE SEGURIDAD
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('alerts')
  @RequirePermissions('configuracion-seguridad:read')
  async getAlerts(
    @Query('type') type?: AlertType,
    @Query('severity') severity?: Severity,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.seguridadService.getAlerts({ type, severity, status, userId });
  }

  @Get('alerts/:id')
  @RequirePermissions('configuracion-seguridad:read')
  async getAlert(@Param('id') id: string) {
    return this.seguridadService.getAlert(id);
  }

  @Put('alerts/:id/review')
  @RequirePermissions('configuracion-seguridad:update')
  async reviewAlert(
    @Param('id') id: string,
    @Body() dto: ReviewAlertDto,
    @User() user: any,
  ) {
    return this.seguridadService.reviewAlert(id, dto, user.id);
  }

  @Post('alerts/:id/escalate')
  @RequirePermissions('configuracion-seguridad:update')
  async escalateAlert(@Param('id') id: string, @User() user: any) {
    return this.seguridadService.escalateAlert(id, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ACTIVIDAD DE USUARIOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('user-activity')
  @RequirePermissions('configuracion-seguridad:read')
  async getUserActivity(
    @Query('userId') userId?: string,
    @Query('module') module?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.seguridadService.getUserActivity({
      userId,
      module,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('user-activity/:userId')
  @RequirePermissions('configuracion-seguridad:read')
  async getUserActivityDetail(@Param('userId') userId: string) {
    return this.seguridadService.getUserActivityDetail(userId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORTES DE SEGURIDAD
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('reportes/resumen-seguridad')
  @RequirePermissions('reportes-seguridad:read')
  async getSecuritySummary(@Query('days') days?: number) {
    return this.seguridadService.getSecuritySummary(parseInt(days?.toString() || '30'));
  }

  @Get('reportes/actividad-usuarios')
  @RequirePermissions('reportes-seguridad:read')
  async getUserActivityReport(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.seguridadService.getUserActivityReport(new Date(from), new Date(to));
  }

  @Get('reportes/intentos-fallidos')
  @RequirePermissions('reportes-seguridad:read')
  async getFailedAttemptsReport(@Query('days') days?: number) {
    return this.seguridadService.getFailedAttemptsReport(parseInt(days?.toString() || '30'));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONFIGURACIÓN DE AUDITORÍA POR MÓDULO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('audit-config')
  @RequirePermissions('configuracion-seguridad:read')
  async getAuditConfig() {
    return this.seguridadService.getAuditConfig();
  }

  @Put('audit-config/:module')
  @RequirePermissions('configuracion-seguridad:update')
  async updateAuditConfig(
    @Param('module') module: string,
    @Body() dto: UpdateAuditConfigDto,
    @User() user: any,
  ) {
    return this.seguridadService.updateAuditConfig(module, dto, user.id);
  }
}
```

---

## 🧩 Servicio de Seguridad

### Funciones Principales

```typescript
// apps/backend/src/modules/seguridad/seguridad.service.ts

@Injectable()
export class SeguridadService {
  constructor(private prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR AUDITORÍA
  // ───────────────────────────────────────────────────────────────────────────
  
  async logAudit(data: {
    userId: string;
    action: string;
    module: string;
    entityType?: string;
    entityId?: string;
    before?: any;
    after?: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      include: { role: true },
    });

    // Verificar si el módulo está configurado para auditar esta acción
    const auditConfig = await this.prisma.auditConfig.findUnique({
      where: { module: data.module },
    });

    if (auditConfig && !this.shouldAudit(auditConfig, data.action)) {
      return;
    }

    // Obtener campos sensibles a ocultar
    const sensitiveFields = auditConfig?.sensitiveFields || ['password', 'passwordHash', 'mfaSecret'];

    // Ocultar campos sensibles
    const before = data.before ? this.hideSensitiveFields(data.before, sensitiveFields) : null;
    const after = data.after ? this.hideSensitiveFields(data.after, sensitiveFields) : null;

    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        userName: user?.name || 'Unknown',
        userRole: user?.role?.name,
        action: data.action,
        module: data.module,
        entityType: data.entityType,
        entityId: data.entityId,
        before,
        after,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRAR INTENTO DE ACCESO
  // ───────────────────────────────────────────────────────────────────────────
  
  async logAccessAttempt(data: {
    email?: string;
    ipAddress: string;
    userAgent?: string;
    success: boolean;
    reason?: string;
    userId?: string;
    country?: string;
    city?: string;
  }) {
    const attempt = await this.prisma.accessAttempt.create({
      data,
    });

    // Si falló, verificar si debe generar alerta
    if (!data.success) {
      await this.checkFailedAttempts(data.email, data.ipAddress);
    }

    return attempt;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GENERAR ALERTA DE SEGURIDAD
  // ───────────────────────────────────────────────────────────────────────────
  
  async createAlert(data: {
    type: AlertType;
    severity: Severity;
    title: string;
    description?: string;
    userId?: string;
    ipAddress?: string;
    module?: string;
    entityId?: string;
  }) {
    const alert = await this.prisma.securityAlert.create({
      data,
    });

    // Si es crítica, notificar inmediatamente
    if (data.severity === 'CRITICAL' || data.severity === 'HIGH') {
      await this.notifySecurityAlert(alert);
    }

    return alert;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // OBTENER LOGS DE AUDITORÍA
  // ───────────────────────────────────────────────────────────────────────────
  
  async getAuditLogs(filters: {
    userId?: string;
    module?: string;
    action?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.module) where.module = filters.module;
    if (filters.action) where.action = filters.action;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // HISTORIAL DE UNA ENTIDAD
  // ───────────────────────────────────────────────────────────────────────────
  
  async getEntityAuditLog(entityType: string, entityId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Reconstruir historial de cambios
    const history = logs.map(log => ({
      timestamp: log.createdAt,
      user: log.userName,
      action: log.action,
      changes: this.getChanges(log.before, log.after),
    }));

    return {
      entityType,
      entityId,
      history,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ESTADÍSTICAS DE INTENTOS DE ACCESO
  // ───────────────────────────────────────────────────────────────────────────
  
  async getAccessAttemptsStats(days: number) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const [total, successful, failed, byIP, byEmail] = await Promise.all([
      this.prisma.accessAttempt.count({
        where: { createdAt: { gte: fromDate } },
      }),
      this.prisma.accessAttempt.count({
        where: { success: true, createdAt: { gte: fromDate } },
      }),
      this.prisma.accessAttempt.count({
        where: { success: false, createdAt: { gte: fromDate } },
      }),
      this.prisma.accessAttempt.groupBy({
        by: ['ipAddress'],
        where: {
          success: false,
          createdAt: { gte: fromDate },
        },
        _count: true,
        orderBy: { _count: { ipAddress: 'desc' } },
        take: 10,
      }),
      this.prisma.accessAttempt.groupBy({
        by: ['email'],
        where: {
          success: false,
          createdAt: { gte: fromDate },
        },
        _count: true,
        orderBy: { _count: { email: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      period: { days, from: fromDate },
      total,
      successful,
      failed,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : '0%',
      topFailedIPs: byIP.map(ip => ({
        ipAddress: ip.ipAddress,
        failedAttempts: ip._count,
      })),
      topFailedEmails: byEmail.map(email => ({
        email: email.email,
        failedAttempts: email._count,
      })),
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RESUMEN DE SEGURIDAD
  // ───────────────────────────────────────────────────────────────────────────
  
  async getSecuritySummary(days: number) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const [
      totalLogs,
      totalAlerts,
      criticalAlerts,
      failedAttempts,
      activeUsers,
      topActions,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where: { createdAt: { gte: fromDate } } }),
      this.prisma.securityAlert.count({ where: { createdAt: { gte: fromDate } } }),
      this.prisma.securityAlert.count({
        where: {
          severity: { in: ['CRITICAL', 'HIGH'] },
          createdAt: { gte: fromDate },
        },
      }),
      this.prisma.accessAttempt.count({
        where: { success: false, createdAt: { gte: fromDate } },
      }),
      this.prisma.user.count({
        where: {
          isActive: true,
          lastLogin: { gte: fromDate },
        },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: fromDate } },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      period: { days, from: fromDate },
      totalLogs,
      totalAlerts,
      criticalAlerts,
      failedAttempts,
      activeUsers,
      topActions: topActions.map(a => ({
        action: a.action,
        count: a._count,
      })),
      riskScore: this.calculateRiskScore(criticalAlerts, failedAttempts, totalLogs),
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────────
  
  private hideSensitiveFields(data: any, fields: string[]): any {
    if (!data || typeof data !== 'object') return data;
    
    const hidden = { ...data };
    fields.forEach(field => {
      if (hidden[field]) {
        hidden[field] = '[REDACTED]';
      }
    });
    return hidden;
  }

  private shouldAudit(config: any, action: string): boolean {
    const actionMap: Record<string, boolean> = {
      'CREATE': config.auditCreate,
      'UPDATE': config.auditUpdate,
      'DELETE': config.auditDelete,
      'VIEW': config.auditView,
      'EXPORT': config.auditExport,
    };
    return actionMap[action] ?? true;
  }

  private getChanges(before: any, after: any): any[] {
    const changes: any[] = [];
    
    if (!before || !after) return changes;
    
    const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    
    allKeys.forEach(key => {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push({
          field: key,
          before: before[key],
          after: after[key],
        });
      }
    });
    
    return changes;
  }

  private async checkFailedAttempts(email?: string, ipAddress?: string) {
    if (!email && !ipAddress) return;
    
    const where: any = { success: false };
    if (email) where.email = email;
    if (ipAddress) where.ipAddress = ipAddress;
    
    // Intentos en la última hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    where.createdAt = { gte: oneHourAgo };
    
    const failedCount = await this.prisma.accessAttempt.count({ where });
    
    // Si más de 5 intentos fallidos, generar alerta
    if (failedCount >= 5) {
      await this.createAlert({
        type: 'INTENTO_BLOQUEO',
        severity: 'HIGH',
        title: 'Múltiples intentos de acceso fallidos',
        description: `Email: ${email || 'N/A'}, IP: ${ipAddress || 'N/A'}, Intentos: ${failedCount}`,
        ipAddress: ipAddress || undefined,
      });
    }
  }

  private async notifySecurityAlert(alert: any) {
    // Enviar email/notificación a administradores
    // Implementar según sistema de notificaciones
  }

  private calculateRiskScore(criticalAlerts: number, failedAttempts: number, totalLogs: number): number {
    const alertScore = Math.min(criticalAlerts * 10, 40);
    const failedScore = Math.min(Math.floor(failedAttempts / 10) * 5, 30);
    const volumeScore = Math.min(Math.floor(totalLogs / 100) * 5, 30);
    
    return Math.min(alertScore + failedScore + volumeScore, 100);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REVISAR ALERTA
  // ───────────────────────────────────────────────────────────────────────────
  
  async reviewAlert(alertId: string, dto: ReviewAlertDto, userId: string) {
    return this.prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        status: dto.status,
        resolution: dto.resolution,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });
  }

  async getAlerts(filters: {
    type?: AlertType;
    severity?: Severity;
    status?: string;
    userId?: string;
  }) {
    const where: any = {};
    
    if (filters.type) where.type = filters.type;
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;
    
    return this.prisma.securityAlert.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

---

## ⚠️ Reglas de Negocio Críticas

1. **Todo se audita**: CREATE, UPDATE, DELETE siempre se registran
2. **Campos sensibles**: Nunca guardar passwords en logs
3. **Alertas críticas**: Notificar inmediatamente a administradores
4. **Retención**: Logs se mantienen mínimo 365 días
5. **Inmutabilidad**: Logs de auditoría no se pueden editar/eliminar
6. **IP y UserAgent**: Siempre registrar contexto de acceso
7. **Snapshots**: Guardar before/after para cambios críticos

---

## 📁 Archivos del Módulo

```
05-modulo-configuracion/
├── sistema.md
├── usuarios.md
├── tablas.md
├── seguridad.md (este archivo)
└── integraciones.md
```

**Anterior**: `05-configuracion/sistema.md` | **Siguiente**: `05-configuracion/usuarios.md`
