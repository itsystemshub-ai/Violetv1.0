# Módulo 00-SHARED: Autenticación y Autorización

## Descripción

Este módulo proporciona el sistema de autenticación y autorización que TODOS los demás módulos deben utilizar. Incluye JWT, MFA, gestión de sesiones y guards de permisos.

## 🔗 Conexiones con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    TODOS LOS MÓDULOS                            │
│  (01-administrativo, 02-operativo, 03-comercial, etc.)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Importa Guards
                              │ Valida Tokens
                              │ Verifica Permisos
                              ▼
                    ┌─────────────────────┐
                    │   00-shared/auth    │
                    │   00-shared/rbac    │
                    └─────────────────────┘
```

**Regla Crítica**: NINGÚN módulo puede tener su propio sistema de auth. TODOS deben usar este.

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// USUARIOS Y AUTENTICACIÓN
// ─────────────────────────────────────────────────────────────────────────────

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  username        String    @unique
  passwordHash    String
  name            String
  firstName       String
  lastName        String
  cedula          String    @unique
  phone           String?
  avatar          String?
  roleId          String
  role            Role      @relation(fields: [roleId], references: [id])
  isActive        Boolean   @default(true)
  isVerified      Boolean   @default(false)
  mfaSecret       String?
  mfaEnabled      Boolean   @default(false)
  lastLogin       DateTime?
  lastLoginIP     String?
  failedAttempts  Int       @default(0)
  lockedUntil     DateTime?
  
  // Relaciones con otros módulos
  sessions        Session[]
  auditLogs       AuditLog[]
  notifications   Notification[]
  journalEntries  JournalEntry[]      // 01-administrativo: asientos creados
  sales           Sale[]              // 03-comercial: ventas creadas
  purchases       Purchase[]          // 02-operativo: compras creadas
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([email])
  @@index([roleId])
  @@index([isActive])
  @@index([cedula])
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique // ADMIN, CONTADOR, VENDEDOR, etc.
  description String?
  color       String       @default("#6366f1")
  icon        String       @default("shield")
  isSystem    Boolean      @default(false)
  permissions Permission[]
  users       User[]
  modules     ModuleAccess[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([name])
}

model Permission {
  id        String   @id @default(cuid())
  roleId    String
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  module    String   // ventas, compras, contabilidad, rrhh, etc.
  action    String   // create, read, update, delete, approve, export, report
  resource  String?  // Recurso específico (opcional)
  createdAt DateTime @default(now())

  @@unique([roleId, module, action, resource])
  @@index([roleId])
  @@index([module])
}

model ModuleAccess {
  id          String   @id @default(cuid())
  roleId      String
  role        Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  moduleGroup String   // administrativo, operativo, comercial, rrhh
  moduleName  String   // Módulo específico
  canView     Boolean  @default(true)
  canEdit     Boolean  @default(false)
  canDelete   Boolean  @default(false)
  canExport   Boolean  @default(false)
  canReport   Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@unique([roleId, moduleName])
  @@index([roleId])
}

model Session {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token       String   @unique
  refreshToken String?
  ipAddress   String?
  userAgent   String?
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  action     String   // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT
  module     String   // ventas, contabilidad, rrhh, etc.
  entityId   String?
  entityType String?
  before     Json?    // Snapshot antes del cambio
  after      Json?    // Snapshot después del cambio
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([module])
  @@index([action])
  @@index([createdAt])
}
```

---

## 🔐 Servicio de Autenticación (NestJS)

### Archivo: `apps/backend/src/modules/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ───────────────────────────────────────────────────────────────────────────
  
  async login(email: string, password: string, mfaToken?: string, ip?: string) {
    // 1. Buscar usuario con rol y permisos
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: true,
            modules: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Verificar si está activo
    if (!user.isActive) {
      throw new ForbiddenException('Usuario inactivo. Contacte al administrador.');
    }

    // 3. Verificar si está bloqueado por intentos fallidos
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Cuenta bloqueada por ${minutes} minutos por seguridad.`);
    }

    // 4. Validar contraseña
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      // Incrementar intentos fallidos
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: { increment: 1 },
          lockedUntil: user.failedAttempts >= 4 
            ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
            : undefined,
        },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 5. Verificar MFA si está activado
    if (user.mfaEnabled) {
      if (!mfaToken) {
        throw new UnauthorizedException('Se requiere código MFA');
      }
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret!,
        encoding: 'base32',
        token: mfaToken,
        window: 1,
      });
      if (!verified) {
        throw new UnauthorizedException('Código MFA inválido');
      }
    }

    // 6. Resetear intentos fallidos
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
        lastLoginIP: ip,
      },
    });

    // 7. Generar tokens
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role.name,
      roleId: user.roleId,
      permissions: user.role.permissions.map(p => `${p.module}:${p.action}`),
      modules: user.role.modules.map(m => ({
        group: m.moduleGroup,
        name: m.moduleName,
        canView: m.canView,
        canEdit: m.canEdit,
        canDelete: m.canDelete,
        canExport: m.canExport,
        canReport: m.canReport,
      })),
    };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN', '8h'),
      secret: this.config.get('JWT_SECRET'),
    });

    const refreshToken = this.jwt.sign(
      { sub: user.id },
      {
        expiresIn: '7d',
        secret: this.config.get('JWT_REFRESH_SECRET'),
      }
    );

    // 8. Guardar sesión
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        ipAddress: ip,
        userAgent: '', // Se obtiene del request
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 horas
      },
    });

    // 9. Registrar auditoría
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'auth',
        ipAddress: ip,
      },
    });

    // 10. Retornar datos (NUNCA retornar passwordHash o mfaSecret)
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: {
          id: user.role.id,
          name: user.role.name,
          color: user.role.color,
          icon: user.role.icon,
        },
        modules: payload.modules,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ───────────────────────────────────────────────────────────────────────────
  
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const session = await this.prisma.session.findUnique({
        where: { token: refreshToken },
        include: { user: { include: { role: { include: { permissions: true } } } } },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Sesión expirada');
      }

      // Generar nuevo access token
      const newAccessToken = this.jwt.sign(
        {
          sub: payload.sub,
          email: session.user.email,
          username: session.user.username,
          role: session.user.role.name,
          roleId: session.user.roleId,
          permissions: session.user.role.permissions.map(p => `${p.module}:${p.action}`),
        },
        {
          expiresIn: this.config.get('JWT_EXPIRES_IN', '8h'),
          secret: this.config.get('JWT_SECRET'),
        }
      );

      // Actualizar sesión
      await this.prisma.session.update({
        where: { id: session.id },
        data: { token: newAccessToken },
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ───────────────────────────────────────────────────────────────────────────
  
  async logout(userId: string, token: string) {
    await this.prisma.session.deleteMany({
      where: { token },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        module: 'auth',
      },
    });

    return { success: true, message: 'Sesión cerrada correctamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SETUP MFA
  // ───────────────────────────────────────────────────────────────────────────
  
  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    const secret = speakeasy.generateSecret({
      name: `ERP ZENITH (${user.email})`,
      length: 32,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    return {
      otpauthUrl: secret.otpauth_url,
      base32: secret.base32,
      qrCode: `otpauth://totp/${secret.otpauth_url}`,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ENABLE/DISABLE MFA
  // ───────────────────────────────────────────────────────────────────────────
  
  async enableMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret!,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Código MFA inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { success: true, message: 'MFA activado correctamente' };
  }

  async disableMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret!,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Código MFA inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    return { success: true, message: 'MFA desactivado correctamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CAMBIAR CONTRASEÑA
  // ───────────────────────────────────────────────────────────────────────────
  
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Contraseña actual inválida');
    }

    // Validar que no sea la misma
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      throw new BadRequestException('La nueva contraseña debe ser diferente');
    }

    // Validar política de contraseñas
    this.validatePasswordPolicy(newPassword);

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Guardar en historial (para evitar reuso)
    await this.prisma.passwordHistory.create({
      data: {
        userId,
        hash: user.passwordHash,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { success: true, message: 'Contraseña cambiada correctamente' };
  }

  private validatePasswordPolicy(password: string): void {
    const errors: string[] = [];

    if (password.length < 10) {
      errors.push('Mínimo 10 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Al menos una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Al menos una minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Al menos un número');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/.test(password)) {
      errors.push('Al menos un carácter especial');
    }

    if (errors.length > 0) {
      throw new BadRequestException(`Política de contraseña no cumplida: ${errors.join(', ')}`);
    }
  }
}
```

---

## 🛡️ Guards de Permisos

### Archivo: `apps/backend/src/common/guards/permissions.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay permisos requeridos, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.id) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Si es ADMIN, permitir todo
    if (user.role === 'ADMIN') {
      return true;
    }

    // Obtener permisos actualizados de la BD
    const userRole = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      include: { 
        permissions: true,
        modules: true,
      },
    });

    if (!userRole) {
      throw new ForbiddenException('Rol de usuario no encontrado');
    }

    const userPermissions = userRole.permissions.map(
      p => `${p.module}:${p.action}`
    );

    // Verificar cada permiso requerido
    const hasAllPermissions = requiredPermissions.every(permission => {
      // Wildcard: ventas:* significa todas las acciones de ventas
      if (permission.endsWith(':*')) {
        const module = permission.split(':')[0];
        return userPermissions.some(p => p.startsWith(`${module}:`));
      }
      return userPermissions.includes(permission);
    });

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Acceso denegado. Permisos requeridos: ${requiredPermissions.join(', ')}. ` +
        `Tus permisos: ${userPermissions.join(', ')}`
      );
    }

    // Verificar acceso al módulo específico
    const requestPath = context.switchToHttp().getRequest().url;
    const moduleMatch = requestPath.match(/\/api\/v1\/([^/]+)/);
    if (moduleMatch) {
      const requestedModule = moduleMatch[1];
      const hasModuleAccess = userRole.modules.some(m => 
        m.moduleName === requestedModule && m.canView
      );

      if (!hasModuleAccess && user.role !== 'ADMIN') {
        throw new ForbiddenException(
          `No tienes acceso al módulo ${requestedModule}`
        );
      }
    }

    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DECORADOR DE PERMISOS
// ─────────────────────────────────────────────────────────────────────────────

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
```

---

## 🔑 JWT Strategy

### Archivo: `apps/backend/src/common/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            permissions: true,
            modules: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      roleId: user.roleId,
      role: user.role.name,
      permissions: user.role.permissions.map(p => `${p.module}:${p.action}`),
      modules: user.role.modules.map(m => ({
        group: m.moduleGroup,
        name: m.moduleName,
        canView: m.canView,
        canEdit: m.canEdit,
        canDelete: m.canDelete,
        canExport: m.canExport,
        canReport: m.canReport,
      })),
    };
  }
}
```

---

## 📡 Endpoints de la API

### Auth Controller

```typescript
// apps/backend/src/modules/auth/auth.controller.ts

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip;
    return this.authService.login(dto.email, dto.password, dto.mfaToken, ip);
  }

  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@User() user: any, @Headers('authorization') auth: string) {
    const token = auth.replace('Bearer ', '');
    return this.authService.logout(user.id, token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@User() user: any) {
    return { user };
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  async setupMfa(@User() user: any) {
    return this.authService.setupMfa(user.id);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  async enableMfa(@Body() dto: MfaDto, @User() user: any) {
    return this.authService.enableMfa(user.id, dto.token);
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  async disableMfa(@Body() dto: MfaDto, @User() user: any) {
    return this.authService.disableMfa(user.id, dto.token);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Body() dto: ChangePasswordDto, @User() user: any) {
    return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }
}
```

---

## 🎯 Cómo Usar en Otros Módulos

### Ejemplo: Módulo de Ventas

```typescript
// apps/backend/src/modules/ventas/ventas.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { VentasService } from './ventas.service';

@Controller('ventas')
@UseGuards(JwtAuthGuard, PermissionsGuard) // <- TODOS los endpoints requieren auth
export class VentasController {
  constructor(private ventasService: VentasService) {}

  @Get()
  @RequirePermissions('ventas:read') // <- Solo usuarios con permiso de lectura
  async findAll(@Query() query: QueryDto) {
    return this.ventasService.findAll(query);
  }

  @Post()
  @RequirePermissions('ventas:create') // <- Solo usuarios con permiso de creación
  async create(@Body() dto: CreateVentaDto) {
    return this.ventasService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('ventas:update') // <- Solo usuarios con permiso de actualización
  async update(@Param('id') id: string, @Body() dto: UpdateVentaDto) {
    return this.ventasService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('ventas:delete') // <- Solo usuarios con permiso de eliminación
  async remove(@Param('id') id: string) {
    return this.ventasService.remove(id);
  }
}
```

---

## ⚠️ Consideraciones de Seguridad

1. **NUNCA** retornar `passwordHash`, `mfaSecret` o `refreshToken` en respuestas
2. **SIEMPRE** usar HTTPS en producción
3. **SIEMPRE** validar permisos en backend (nunca confiar en frontend)
4. **SIEMPRE** registrar auditoría de logins y acciones críticas
5. **ROTAR** secretos JWT cada 90 días
6. **LIMITAR** intentos de login (bloquear después de 5 intentos)
7. **EXPIRAR** sesiones después de 8 horas de inactividad

---

## 📊 Flujo de Autenticación

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ 1. POST /auth/login (email, password)
       ▼
┌─────────────────────────────────────────┐
│           Auth Service                  │
│  1. Buscar usuario + rol + permisos     │
│  2. Validar contraseña (bcrypt)         │
│  3. Verificar MFA (si aplica)           │
│  4. Generar JWT (access + refresh)      │
│  5. Guardar sesión en BD                │
│  6. Registrar auditoría                 │
└──────┬──────────────────────────────────┘
       │ 2. { accessToken, refreshToken, user }
       ▼
┌─────────────┐
│   Usuario   │
│  Guarda en  │
│  localStorage│
└──────┬──────┘
       │ 3. Request con Authorization: Bearer <token>
       ▼
┌─────────────────────────────────────────┐
│         JWT Strategy                    │
│  1. Extraer token del header            │
│  2. Validar firma y expiración          │
│  3. Obtener user de BD                  │
│  4. Inyectar en request.user            │
└──────┬──────────────────────────────────┘
       │ 4. request.user disponible
       ▼
┌─────────────────────────────────────────┐
│       Permissions Guard                 │
│  1. Obtener permisos requeridos         │
│  2. Comparar con user.permissions       │
│  3. Verificar acceso al módulo          │
│  4. Permitir o denegar (Forbidden)      │
└──────┬──────────────────────────────────┘
       │ 5. Acceso permitido
       ▼
┌─────────────────────────────────────────┐
│         Controller                      │
│  Ejecutar lógica del módulo             │
└─────────────────────────────────────────┘
```

---

## 🔗 Conexiones con Otros Módulos

| Módulo | Conexión | Descripción |
|--------|----------|-------------|
| 01-administrativo | `journalEntries` | Usuario que creó el asiento |
| 02-operativo | `purchases` | Usuario que creó la compra |
| 03-comercial | `sales` | Usuario que creó la venta |
| 04-rrhh | N/A | Usa auth para login de empleados |
| 05-configuracion | `auditLogs` | Registra todas las acciones |
| 06-reportes | N/A | Usa auth para filtrar por usuario |
| 07-integraciones | Webhooks | Valida tokens en webhooks |

---

## 📁 Archivos del Módulo

```
00-shared/
├── auth.md (este archivo)
├── rbac.md
├── prisma-schema.md
└── types.md
```

**Siguiente**: Ver `rbac.md` para detalles de roles y permisos.
