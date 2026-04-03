# ERP ZENITH - Sistema ERP Profesional para Venezuela
## Versión: 2.0 | Fecha: 2025 | Stack: Next.js 14, NestJS 10, Prisma, PostgreSQL, n8n, Cloudflare R2, IA

---

## TABLA DE CONTENIDO

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Sistema de Roles y Permisos (RBAC Granular)](#sistema-de-roles-y-permisos-rbac-granular)
4. [Módulos Agrupados por Área](#módulos-agrupados-por-área)
5. [Módulo Administrativo](#módulo-administrativo)
6. [Módulo Operativo](#módulo-operativo)
7. [Módulo Comercial](#módulo-comercial)
8. [Módulo de Recursos Humanos](#módulo-de-recursos-humanos)
9. [Módulo de Configuración y Sistema](#módulo-de-configuración-y-sistema)
10. [Módulo de Reportes y Dashboards](#módulo-de-reportes-y-dashboards)
11. [Inteligencia Artificial y APIs Avanzadas](#inteligencia-artificial-y-apis-avanzadas)
12. [Infraestructura y Despliegue (Sin Docker)](#infraestructura-y-despliegue-sin-docker)
13. [UI/UX Premium - Componentes Visuales](#uiux-premium---componentes-visuales)
14. [Especificaciones Técnicas para Generación de Código](#especificaciones-técnicas-para-generación-de-código)

---

## INTRODUCCIÓN

ERP ZENITH es un sistema ERP empresarial completo diseñado específicamente para el mercado venezolano, cumpliendo con todas las normativas legales locales (LOTTT, IVA, ISLR, SENIAT). El sistema está organizado en **módulos agrupados por área funcional** con control de acceso basado en roles (RBAC) donde cada usuario solo puede ver y acceder al módulo asignado a su rol.

### Principios de Diseño

1. **Segregación por Roles**: Un usuario de Ventas SOLO ve el módulo de Ventas. Un usuario de Inventario SOLO ve el módulo de Inventario.
2. **Dashboards Independientes**: Cada módulo tiene su propio dashboard de reportes y KPIs.
3. **Configuración Centralizada**: Módulo de configuración para personalizar todo el sistema.
4. **IA Integrada**: Funciones de inteligencia artificial en todos los módulos.
5. **UI Premium**: Interfaz moderna con componentes visuales avanzados.

---

## ARQUITECTURA DEL SISTEMA

### Estructura del Monorepo

```
erpzenith/
├── apps/
│   ├── frontend/                 # Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/           # Login, registro, recuperación
│   │   │   ├── (dashboard)/      # Layout principal con sidebar
│   │   │   │   ├── layout.tsx    # Sidebar dinámico según rol
│   │   │   │   ├── page.tsx      # Dashboard principal
│   │   │   │   ├── administrativo/
│   │   │   │   ├── operativo/
│   │   │   │   ├── comercial/
│   │   │   │   ├── rrhh/
│   │   │   │   └── configuracion/
│   │   │   └── api/              # API routes (opcional)
│   │   ├── components/
│   │   │   ├── ui/               # Componentes base (shadcn/ui)
│   │   │   ├── layout/           # Sidebar, TopBar, Header
│   │   │   ├── modules/          # Componentes por módulo
│   │   │   └── charts/           # Gráficos y dashboards
│   │   ├── lib/
│   │   │   ├── api.ts            # Cliente API axios
│   │   │   ├── utils.ts          # Utilidades
│   │   │   └── validators.ts     # Validaciones
│   │   ├── stores/
│   │   │   ├── authStore.ts      # Zustand auth
│   │   │   ├── moduleStore.ts    # Estado de módulos
│   │   │   └── uiStore.ts        # Estado UI
│   │   └── hooks/
│   │       ├── usePermissions.ts
│   │       └── useModules.ts
│   │
│   └── backend/                  # NestJS 10
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/         # Autenticación y autorización
│       │   │   ├── administrativo/
│       │   │   ├── operativo/
│       │   │   ├── comercial/
│       │   │   ├── rrhh/
│       │   │   └── configuracion/
│       │   ├── common/
│       │   │   ├── guards/       # Guards de permisos
│       │   │   ├── decorators/   # Decoradores personalizados
│       │   │   └── interceptors/
│       │   ├── prisma/           # Schema y servicios
│       │   └── main.ts
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── shared-types/             # Tipos TypeScript compartidos
│   └── ui/                       # Componentes UI reutilizables
│
├── n8n-workflows/                # Flujos de automatización
└── scripts/                      # Scripts de utilidad
```

---

## SISTEMA DE ROLES Y PERMISOS (RBAC GRANULAR)

### Modelo de Datos - Roles y Permisos

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// ROLES Y PERMISOS
// ─────────────────────────────────────────────────────────────────────────────

model Role {
  id          String       @id @default(cuid())
  name        String       @unique // ADMIN, CONTADOR, RRHH, VENDEDOR, ALMACENISTA, etc.
  description String?
  color       String       @default("#6366f1") // Color para UI
  icon        String       @default("shield")  // Icono para UI
  isSystem    Boolean      @default(false)     // Roles del sistema no editables
  permissions Permission[]
  users       User[]
  modules     ModuleAccess[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Permission {
  id          String   @id @default(cuid())
  roleId      String
  role        Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  module      String   // Módulo: ventas, compras, contabilidad, rrhh, etc.
  action      String   // Acción: create, read, update, delete, approve, export, report
  resource    String?  // Recurso específico (opcional)
  createdAt   DateTime @default(now())

  @@unique([roleId, module, action, resource])
}

// Acceso de roles a módulos específicos
model ModuleAccess {
  id          String   @id @default(cuid())
  roleId      String
  role        Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  moduleGroup String   // GRUPO: administrativo, operativo, comercial, rrhh
  moduleName  String   // Módulo específico
  canView     Boolean  @default(true)
  canEdit     Boolean  @default(false)
  canDelete   Boolean  @default(false)
  canExport   Boolean  @default(false)
  canReport   Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@unique([roleId, moduleName])
}

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
  sessions        Session[]
  auditLogs       AuditLog[]
  notifications   Notification[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([roleId])
  @@index([isActive])
}
```

### Roles Predefinidos del Sistema

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// ROLES PREDEFINIDOS - SOLO LECTURA PARA USUARIOS
// ─────────────────────────────────────────────────────────────────────────────

export const SYSTEM_ROLES = {
  // ─── ROL SUPER ADMIN ─────────────────────────────────────────────────────
  ADMIN: {
    id: 'admin',
    name: 'Administrador del Sistema',
    description: 'Acceso completo a todos los módulos y configuraciones',
    color: '#dc2626', // rojo
    icon: 'crown',
    isSystem: true,
    modules: ['*'], // Todos los módulos
    permissions: ['*:*'], // Todas las acciones
  },

  // ─── MÓDULO ADMINISTRATIVO ───────────────────────────────────────────────
  CONTADOR: {
    id: 'contador',
    name: 'Contador',
    description: 'Gestión contable y financiera',
    color: '#2563eb', // azul
    icon: 'calculator',
    isSystem: true,
    modules: ['contabilidad', 'finanzas', 'tesoreria', 'presupuesto', 'activos-fijos'],
    permissions: [
      'contabilidad:*',
      'finanzas:*',
      'tesoreria:*',
      'presupuesto:*',
      'activos-fijos:*',
      'reportes-contables:read',
    ],
  },

  FINANZAS: {
    id: 'finanzas',
    name: 'Analista Financiero',
    description: 'Gestión financiera y tesorería',
    color: '#0891b2', // cyan
    icon: 'trending-up',
    isSystem: true,
    modules: ['finanzas', 'tesoreria', 'presupuesto'],
    permissions: [
      'finanzas:*',
      'tesoreria:*',
      'presupuesto:*',
      'reportes-financieros:read',
    ],
  },

  // ─── MÓDULO OPERATIVO ────────────────────────────────────────────────────
  ALMACENISTA: {
    id: 'almacenista',
    name: 'Almacenista',
    description: 'Gestión de inventario y almacén',
    color: '#16a34a', // verde
    icon: 'package',
    isSystem: true,
    modules: ['inventario', 'almacen'],
    permissions: [
      'inventario:*',
      'almacen:*',
      'movimientos-inventario:create',
      'movimientos-inventario:read',
      'reportes-inventario:read',
    ],
  },

  PRODUCCION: {
    id: 'produccion',
    name: 'Jefe de Producción',
    description: 'Gestión de producción y MRP',
    color: '#ea580c', // naranja
    icon: 'factory',
    isSystem: true,
    modules: ['produccion', 'mrp', 'calidad'],
    permissions: [
      'produccion:*',
      'mrp:*',
      'calidad:*',
      'reportes-produccion:read',
    ],
  },

  MANTENIMIENTO: {
    id: 'mantenimiento',
    name: 'Jefe de Mantenimiento',
    description: 'Gestión de mantenimiento de activos',
    color: '#7c3aed', // violeta
    icon: 'wrench',
    isSystem: true,
    modules: ['mantenimiento', 'activos-fijos'],
    permissions: [
      'mantenimiento:*',
      'activos-fijos:read',
      'reportes-mantenimiento:read',
    ],
  },

  // ─── MÓDULO COMERCIAL ────────────────────────────────────────────────────
  VENDEDOR: {
    id: 'vendedor',
    name: 'Vendedor',
    description: 'Gestión de ventas y clientes',
    color: '#db2777', // rosa
    icon: 'shopping-cart',
    isSystem: true,
    modules: ['ventas', 'crm', 'pos'],
    permissions: [
      'ventas:create',
      'ventas:read',
      'ventas:update',
      'crm:*',
      'pos:*',
      'clientes:*',
      'reportes-ventas:read',
    ],
  },

  COMPRADOR: {
    id: 'comprador',
    name: 'Comprador',
    description: 'Gestión de compras y proveedores',
    color: '#0284c7', // sky
    icon: 'shopping-bag',
    isSystem: true,
    modules: ['compras', 'proveedores'],
    permissions: [
      'compras:*',
      'proveedores:*',
      'solicitudes-compra:*',
      'reportes-compras:read',
    ],
  },

  // ─── MÓDULO RECURSOS HUMANOS ─────────────────────────────────────────────
  RRHH: {
    id: 'rrhh',
    name: 'Recursos Humanos',
    description: 'Gestión de personal y nómina',
    color: '#c026d3', // fucsia
    icon: 'users',
    isSystem: true,
    modules: ['rrhh', 'nomina', 'asistencia'],
    permissions: [
      'rrhh:*',
      'nomina:*',
      'asistencia:*',
      'empleados:*',
      'reportes-rrhh:read',
    ],
  },
} as const;
```

### Guard de Permisos - Backend

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// GUARD DE PERMISOS - NESTJS
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

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

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No requiere permisos específicos
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.id) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Obtener permisos del usuario desde BD
    const userRole = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      include: { permissions: true },
    });

    if (!userRole) {
      throw new ForbiddenException('Rol de usuario no encontrado');
    }

    // Verificar si es ADMIN (tiene acceso total)
    if (userRole.name === 'ADMIN') {
      return true;
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
        `No tienes permisos para esta acción. Requerido: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DECORADOR DE PERMISOS
// ─────────────────────────────────────────────────────────────────────────────

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// ─────────────────────────────────────────────────────────────────────────────
// EJEMPLO DE USO EN CONTROLADOR
// ─────────────────────────────────────────────────────────────────────────────

@Controller('ventas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VentasController {
  constructor(private ventasService: VentasService) {}

  @Post()
  @RequirePermissions('ventas:create')
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.ventasService.create(createSaleDto);
  }

  @Get()
  @RequirePermissions('ventas:read')
  findAll(@Query() query: QueryDto) {
    return this.ventasService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('ventas:read')
  findOne(@Param('id') id: string) {
    return this.ventasService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('ventas:update')
  update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
    return this.ventasService.update(id, updateSaleDto);
  }

  @Delete(':id')
  @RequirePermissions('ventas:delete')
  remove(@Param('id') id: string) {
    return this.ventasService.remove(id);
  }

  @Get('reportes/ventas')
  @RequirePermissions('reportes-ventas:read')
  getVentasReport(@Query() query: ReportQueryDto) {
    return this.ventasService.getVentasReport(query);
  }
}
```

---

## MÓDULOS AGRUPADOS POR ÁREA

### Estructura de Módulos por Grupo

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// DEFINICIÓN DE GRUPOS Y MÓDULOS
// ─────────────────────────────────────────────────────────────────────────────

export const MODULE_GROUPS = {
  ADMINISTRATIVO: {
    id: 'administrativo',
    name: 'Módulo Administrativo',
    description: 'Gestión administrativa, financiera y contable',
    icon: 'building-2',
    color: '#2563eb', // azul
    modules: [
      {
        id: 'contabilidad',
        name: 'Contabilidad',
        description: 'Plan de cuentas, asientos, libros legales',
        icon: 'book-open',
        route: '/administrativo/contabilidad',
        permissions: ['contabilidad:*'],
      },
      {
        id: 'finanzas',
        name: 'Finanzas',
        description: 'Gestión financiera, estados financieros',
        icon: 'trending-up',
        route: '/administrativo/finanzas',
        permissions: ['finanzas:*'],
      },
      {
        id: 'tesoreria',
        name: 'Tesorería',
        description: 'Cuentas bancarias, conciliación, flujo de caja',
        icon: 'wallet',
        route: '/administrativo/tesoreria',
        permissions: ['tesoreria:*'],
      },
      {
        id: 'presupuesto',
        name: 'Presupuesto',
        description: 'Control presupuestario, centros de costo',
        icon: 'piggy-bank',
        route: '/administrativo/presupuesto',
        permissions: ['presupuesto:*'],
      },
      {
        id: 'activos-fijos',
        name: 'Activos Fijos',
        description: 'Depreciación, bajas, mantenimiento de activos',
        icon: 'building',
        route: '/administrativo/activos-fijos',
        permissions: ['activos-fijos:*'],
      },
      {
        id: 'impuestos',
        name: 'Impuestos',
        description: 'IVA, ISLR, retenciones, declaraciones',
        icon: 'receipt',
        route: '/administrativo/impuestos',
        permissions: ['impuestos:*'],
      },
    ],
  },

  OPERATIVO: {
    id: 'operativo',
    name: 'Módulo Operativo',
    description: 'Gestión operativa de la empresa',
    icon: 'factory',
    color: '#16a34a', // verde
    modules: [
      {
        id: 'inventario',
        name: 'Inventarios',
        description: 'Control de stock, almacenes, movimientos',
        icon: 'package',
        route: '/operativo/inventario',
        permissions: ['inventario:*'],
      },
      {
        id: 'compras',
        name: 'Compras',
        description: 'Órdenes de compra, proveedores, solicitudes',
        icon: 'shopping-cart',
        route: '/operativo/compras',
        permissions: ['compras:*'],
      },
      {
        id: 'produccion',
        name: 'Producción',
        description: 'Órdenes de producción, MRP, BOM',
        icon: 'factory',
        route: '/operativo/produccion',
        permissions: ['produccion:*'],
      },
      {
        id: 'mantenimiento',
        name: 'Mantenimiento',
        description: 'Mantenimiento de activos, órdenes de trabajo',
        icon: 'wrench',
        route: '/operativo/mantenimiento',
        permissions: ['mantenimiento:*'],
      },
      {
        id: 'calidad',
        name: 'Calidad',
        description: 'Control de calidad, trazabilidad, lotes',
        icon: 'star',
        route: '/operativo/calidad',
        permissions: ['calidad:*'],
      },
      {
        id: 'flota',
        name: 'Flota Vehicular',
        description: 'Gestión de vehículos, choferes, mantenimiento',
        icon: 'truck',
        route: '/operativo/flota',
        permissions: ['flota:*'],
      },
    ],
  },

  COMERCIAL: {
    id: 'comercial',
    name: 'Módulo Comercial',
    description: 'Gestión comercial y de ventas',
    icon: 'shopping-bag',
    color: '#db2777', // rosa
    modules: [
      {
        id: 'ventas',
        name: 'Ventas',
        description: 'Facturación, pedidos, cotizaciones',
        icon: 'shopping-cart',
        route: '/comercial/ventas',
        permissions: ['ventas:*'],
      },
      {
        id: 'crm',
        name: 'CRM',
        description: 'Gestión de clientes, leads, pipeline',
        icon: 'users',
        route: '/comercial/crm',
        permissions: ['crm:*'],
      },
      {
        id: 'pos',
        name: 'Punto de Venta',
        description: 'POS táctil, sesiones de caja',
        icon: 'monitor',
        route: '/comercial/pos',
        permissions: ['pos:*'],
      },
      {
        id: 'marketing',
        name: 'Marketing',
        description: 'Campañas, email marketing, segmentación',
        icon: 'megaphone',
        route: '/comercial/marketing',
        permissions: ['marketing:*'],
      },
    ],
  },

  RRHH: {
    id: 'rrhh',
    name: 'Módulo Recursos Humanos',
    description: 'Gestión de personal y nómina',
    icon: 'users',
    color: '#c026d3', // fucsia
    modules: [
      {
        id: 'empleados',
        name: 'Empleados',
        description: 'Expedientes, contratos, documentos',
        icon: 'user',
        route: '/rrhh/empleados',
        permissions: ['empleados:*'],
      },
      {
        id: 'nomina',
        name: 'Nómina',
        description: 'Cálculo de nómina, recibos, provisiones',
        icon: 'banknote',
        route: '/rrhh/nomina',
        permissions: ['nomina:*'],
      },
      {
        id: 'asistencia',
        name: 'Asistencia',
        description: 'Control de asistencia, horarios, vacaciones',
        icon: 'clock',
        route: '/rrhh/asistencia',
        permissions: ['asistencia:*'],
      },
      {
        id: 'capacitacion',
        name: 'Capacitación',
        description: 'Cursos, evaluaciones, desarrollo',
        icon: 'graduation-cap',
        route: '/rrhh/capacitacion',
        permissions: ['capacitacion:*'],
      },
    ],
  },

  CONFIGURACION: {
    id: 'configuracion',
    name: 'Módulo Configuración',
    description: 'Configuración del sistema y administración',
    icon: 'settings',
    color: '#64748b', // slate
    modules: [
      {
        id: 'empresa',
        name: 'Datos de Empresa',
        description: 'Información fiscal, configuración general',
        icon: 'building-2',
        route: '/configuracion/empresa',
        permissions: ['configuracion-empresa:*'],
      },
      {
        id: 'usuarios',
        name: 'Usuarios y Roles',
        description: 'Gestión de usuarios, roles, permisos',
        icon: 'users',
        route: '/configuracion/usuarios',
        permissions: ['configuracion-usuarios:*'],
      },
      {
        id: 'tablas',
        name: 'Tablas del Sistema',
        description: 'Catálogos, listas, parámetros',
        icon: 'table',
        route: '/configuracion/tablas',
        permissions: ['configuracion-tablas:*'],
      },
      {
        id: 'seguridad',
        name: 'Seguridad',
        description: 'Auditoría, logs, políticas',
        icon: 'shield',
        route: '/configuracion/seguridad',
        permissions: ['configuracion-seguridad:*'],
      },
      {
        id: 'integraciones',
        name: 'Integraciones',
        description: 'APIs, webhooks, conexiones externas',
        icon: 'plug',
        route: '/configuracion/integraciones',
        permissions: ['configuracion-integraciones:*'],
      },
    ],
  },
} as const;

export type ModuleGroup = keyof typeof MODULE_GROUPS;
export type ModuleId = typeof MODULE_GROUPS[ModuleGroup]['modules'][number]['id'];
```

---

## SIDEBAR DINÁMICO SEGÚN ROL

### Componente Sidebar - Frontend

```tsx
// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR CON NAVEGACIÓN FILTRADA POR ROL
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { MODULE_GROUPS } from '@/lib/modules';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Factory,
  ShoppingCart,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

const GROUP_ICONS = {
  ADMINISTRATIVO: Building2,
  OPERATIVO: Factory,
  COMERCIAL: ShoppingCart,
  RRHH: Users,
  CONFIGURACION: Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['administrativo']);

  // Obtener módulos visibles según el rol del usuario
  const visibleModules = useMemo(() => {
    if (!user?.roleId) return [];

    const userPermissions = user.permissions || [];
    const modules: any[] = [];

    Object.values(MODULE_GROUPS).forEach(group => {
      const groupModules = group.modules.filter(module => {
        // Verificar si el usuario tiene al menos un permiso del módulo
        return userPermissions.some(p =>
          p.startsWith(`${module.id}:`) || p === '*:*'
        );
      });

      if (groupModules.length > 0) {
        modules.push({
          ...group,
          modules: groupModules,
        });
      }
    });

    return modules;
  }, [user]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <aside className="w-72 bg-gray-900 text-white flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">ERP ZENITH</h1>
            <p className="text-xs text-gray-400">{user?.name}</p>
            <p className="text-xs text-indigo-400">{user?.role?.name}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Dashboard Principal */}
        <button
          onClick={() => router.push('/dashboard')}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
            pathname === '/dashboard'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>

        {/* Grupos de Módulos */}
        {visibleModules.map(group => {
          const GroupIcon = GROUP_ICONS[group.id as keyof typeof GROUP_ICONS];
          const isExpanded = expandedGroups.includes(group.id);

          return (
            <div key={group.id} className="mb-2">
              {/* Header del Grupo */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GroupIcon className="w-4 h-4" style={{ color: group.color }} />
                  <span className="font-medium">{group.name}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Módulos del Grupo */}
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {group.modules.map(module => {
                    const isActive = pathname.startsWith(module.route);
                    return (
                      <button
                        key={module.id}
                        onClick={() => router.push(module.route)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors rounded-lg',
                          isActive
                            ? 'bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        )}
                      >
                        <module.icon className="w-4 h-4" />
                        {module.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => router.push('/configuracion')}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </button>
      </div>
    </aside>
  );
}
```

---

*(Continuará con la definición completa de cada módulo, funciones específicas, APIs, modelos de datos, componentes UI, dashboards, reportes, IA, y especificaciones técnicas)*

---

## MÓDULO ADMINISTRATIVO

### Contabilidad

#### Funciones Específicas

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// SERVICIO DE CONTABILIDAD - FUNCIONES ESPECÍFICAS
// ─────────────────────────────────────────────────────────────────────────────

interface IAccountingService {
  // ─── PLAN DE CUENTAS ─────────────────────────────────────────────────────
  // Crear cuenta contable con validación de código único
  createAccount(data: CreateAccountDto): Promise<Account>;
  
  // Actualizar cuenta (validar que no tenga movimientos si cambia código)
  updateAccount(id: string, data: UpdateAccountDto): Promise<Account>;
  
  // Eliminar cuenta (solo si no tiene movimientos y no es cuenta sistema)
  deleteAccount(id: string): Promise<void>;
  
  // Obtener árbol completo de cuentas
  getAccountTree(): Promise<AccountTree[]>;
  
  // Buscar cuenta por código
  getAccountByCode(code: string): Promise<Account | null>;

  // ─── ASIENTOS CONTABLES ──────────────────────────────────────────────────
  // Crear asiento validando partida doble (débitos = créditos)
  createJournalEntry(data: CreateJournalEntryDto): Promise<JournalEntry>;
  
  // Actualizar asiento (solo si no está posteado)
  updateJournalEntry(id: string, data: UpdateJournalEntryDto): Promise<JournalEntry>;
  
  // Postear asiento (lo hace ineditable)
  postJournalEntry(id: string): Promise<JournalEntry>;
  
  // Anular asiento (crea asiento de reverso)
  voidJournalEntry(id: string, reason: string): Promise<JournalEntry>;
  
  // Obtener libro diario (asientos ordenados por fecha)
  getDiario(from: Date, to: Date): Promise<JournalEntry[]>;
  
  // Obtener libro mayor (saldos por cuenta)
  getMayor(accountId?: string, from?: Date, to?: Date): Promise<AccountBalance[]>;

  // ─── BALANCES Y ESTADOS FINANCIEROS ─────────────────────────────────────
  // Balance de comprobación (saldos antes y después)
  getTrialBalance(from: Date, to: Date): Promise<TrialBalance>;
  
  // Balance general (activo, pasivo, patrimonio)
  getBalanceSheet(date: Date): Promise<BalanceSheet>;
  
  // Estado de resultados (ingresos, gastos, utilidad)
  getIncomeStatement(from: Date, to: Date): Promise<IncomeStatement>;
  
  // Estado de flujos de efectivo
  getCashFlowStatement(from: Date, to: Date): Promise<CashFlowStatement>;

  // ─── LIBROS LEGALES VENEZUELA ───────────────────────────────────────────
  // Libro de compras IVA
  getLibroComprasIVA(period: string): Promise<LibroIVA[]>;
  
  // Libro de ventas IVA
  getLibroVentasIVA(period: string): Promise<LibroIVA[]>;
  
  // Generar archivo Excel para SENIAT
  exportLibroSENIAATipo: 'COMPRAS' | 'VENTAS', period: string): Promise<Buffer>;

  // ─── CIERRE CONTABLE ────────────────────────────────────────────────────
  // Cierre mensual (provisiones, depreciación)
  monthlyClose(year: number, month: number): Promise<CloseResult>;
  
  // Cierre anual (resultado del ejercicio)
  annualClose(year: number): Promise<CloseResult>;
  
  // Apertura de ejercicio
  openFiscalYear(year: number): Promise<void>;

  // ─── REPORTES ───────────────────────────────────────────────────────────
  // Mayor analítico (movimientos por cuenta)
  getAnalyticalLedger(accountId: string, from: Date, to: Date): Promise<JournalEntry[]>;
  
  // Balance de comprobación por niveles
  getTrialBalanceByLevel(level: number, from: Date, to: Date): Promise<TrialBalance>;
  
  // Cuentas por edad (antigüedad de saldos)
  getAgingAccounts(type: 'ACTIVO' | 'PASIVO'): Promise<AgingReport>;
}
```

#### Modelo de Datos - Contabilidad

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// MODELO DE DATOS - CONTABILIDAD
// ─────────────────────────────────────────────────────────────────────────────

model Account {
  id          String   @id @default(cuid())
  code        String   @unique // Código contable (ej. 1.01.01.0001)
  name        String
  type        AccountType // ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO
  level       Int      // Nivel jerárquico (1-10)
  parentId    String?
  parent      Account? @relation("AccountHierarchy", fields: [parentId], references: [id])
  children    Account[] @relation("AccountHierarchy")
  
  // Configuración
  isSystem    Boolean  @default(false) // Cuentas del sistema no editables
  isActive    Boolean  @default(true)
  allowMovements Boolean @default(true) // Si false, es cuenta titular
  
  // Saldos
  balanceDebit   Float @default(0)
  balanceCredit  Float @default(0)
  balanceCurrent Float @default(0) // Débito - Crédito
  
  // Relaciones
  journalEntries JournalEntryItem[]
  budgets        Budget[]
  
  // Auditoría
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([code])
  @@index([type])
  @@index([parentId])
}

model JournalEntry {
  id          String   @id @default(cuid())
  number      String   @unique // Número consecutivo (ej. AS-2024-000001)
  date        DateTime // Fecha del asiento
  description String
  reference   String?  // Número de factura, recibo, etc.
  
  // Estado
  status      JournalEntryStatus @default(DRAFT) // DRAFT, POSTED, VOIDED
  postedBy    String?
  postedAt    DateTime?
  voidedBy    String?
  voidedAt    DateTime?
  voidReason  String?
  
  // Validación
  totalDebit  Float
  totalCredit Float
  isBalanced  Boolean @default(true)
  
  // Relaciones
  items       JournalEntryItem[]
  attachments Attachment[]
  
  // Auditoría
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([date])
  @@index([status])
  @@index([number])
}

model JournalEntryItem {
  id             String   @id @default(cuid())
  journalEntryId String
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  accountId      String
  account        Account @relation(fields: [accountId], references: [id])
  
  // Montos
  debit          Float   @default(0)
  credit         Float   @default(0)
  description    String?
  
  // Centro de costo (opcional)
  costCenterId   String?
  costCenter     CostCenter? @relation(fields: [costCenterId], references: [id])
  
  // Auditoría
  createdAt DateTime @default(now())
  
  @@index([journalEntryId])
  @@index([accountId])
}

model AccountingPeriod {
  id        String   @id @default(cuid())
  year      Int
  month     Int      // 1-12
  status    PeriodStatus @default(OPEN) // OPEN, CLOSED, LOCKED
  closedBy  String?
  closedAt  DateTime?
  lockedBy  String?
  lockedAt  DateTime?
  
  @@unique([year, month])
  @@index([status])
}

enum AccountType {
  ACTIVO
  PASIVO
  PATRIMONIO
  INGRESO
  GASTO
}

enum JournalEntryStatus {
  DRAFT
  POSTED
  VOIDED
}

enum PeriodStatus {
  OPEN
  CLOSED
  LOCKED
}
```

#### Dashboard de Contabilidad

```tsx
// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD DE CONTABILIDAD - KPIs Y GRÁFICOS
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

export function ContabilidadDashboard() {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['contabilidad-kpis'],
    queryFn: () => api.get('/dashboard/contabilidad').then(r => r.data),
  });

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Contable</h1>
          <p className="text-gray-500 mt-1">Resumen financiero y contable</p>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Activos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activos</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.totalActivos)}</div>
            <p className="text-xs text-gray-500 mt-1">
              vs {formatCurrency(kpis?.totalActivosPrev)} del mes anterior
            </p>
          </CardContent>
        </Card>

        {/* Total Pasivos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pasivos</CardTitle>
            <DollarSign className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.totalPasivos)}</div>
            <p className="text-xs text-gray-500 mt-1">
              vs {formatCurrency(kpis?.totalPasivosPrev)} del mes anterior
            </p>
          </CardContent>
        </Card>

        {/* Utilidad del Ejercicio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Ejercicio</CardTitle>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.utilidadEjercicio)}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{kpis?.utilidadPorcentaje}% vs año anterior
            </p>
          </CardContent>
        </Card>

        {/* Asientos del Mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asientos del Mes</CardTitle>
            <PieChart className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.asientosMes}</div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis?.asientosPendientes} pendientes de postear
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos vs Gastos */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Gastos (Anual)</CardTitle>
            <CardDescription>Comparativo mensual del ejercicio fiscal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpis?.ingresosVsGastos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" />
                <Bar dataKey="gastos" fill="#ef4444" name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Tipo de Cuenta */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Cuentas</CardTitle>
            <CardDescription>Cuentas por tipo y nivel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={kpis?.distribucionCuentas}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="valor"
                  nameKey="tipo"
                  label={({ tipo, porcentaje }) => `${tipo} (${porcentaje}%)`}
                >
                  {kpis?.distribucionCuentas.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas y Pendientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cuentas por Conciliar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Cuentas por Conciliar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {kpis?.cuentasPorConciliar?.map((cuenta: any) => (
                <li key={cuenta.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="font-medium">{cuenta.nombre}</p>
                    <p className="text-sm text-gray-500">Diferencia: {formatCurrency(cuenta.diferencia)}</p>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Conciliar
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Asientos Pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Asientos para Postear
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {kpis?.asientosPendientesList?.map((asiento: any) => (
                <li key={asiento.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">{asiento.numero}</p>
                    <p className="text-sm text-gray-500">{asiento.descripcion}</p>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Postear
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

*(El archivo continúa con la misma estructura detallada para cada módulo: Operativo, Comercial, RRHH, Configuración, Reportes, IA, Infraestructura, UI/UX)*

---

## ESPECIFICACIONES TÉCNICAS PARA GENERACIÓN DE CÓDIGO

### Reglas Obligatorias para la IA Generadora

```markdown
# ─────────────────────────────────────────────────────────────────────────────
# REGLAS OBLIGATORIAS PARA GENERACIÓN DE CÓDIGO
# ─────────────────────────────────────────────────────────────────────────────

## 1. GENERACIÓN DE MODELOS PRISMA

### Reglas:
- TODOS los modelos DEBEN tener `id String @id @default(cuid())`
- TODOS los modelos DEBEN tener `createdAt DateTime @default(now())`
- TODOS los modelos DEBEN tener `updatedAt DateTime @updatedAt` (excepto tablas catálogo)
- TODAS las relaciones DEBEN tener `onDelete: Cascade` o `onDelete: Restrict` explícito
- TODOS los campos monetarios DEBEN ser `Float` (nunca `Decimal` en Prisma)
- TODOS los enums DEBEN estar en MAYÚSCULAS con guiones bajos
- LOS ÍNDICES se definen con `@@index([campo])` o `@@unique([campo1, campo2])`

### Ejemplo Correcto:
```prisma
model Sale {
  id          String   @id @default(cuid())
  number      String   @unique
  date        DateTime @default(now())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Restrict)
  subtotal    Float
  tax         Float
  total       Float
  status      SaleStatus @default(DRAFT)
  items       SaleItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([customerId])
  @@index([status])
  @@index([date])
}
```

## 2. GENERACIÓN DE ENDPOINTS NESTJS

### Reglas:
- TODOS los controladores DEBEN usar `@UseGuards(JwtAuthGuard, PermissionsGuard)`
- TODOS los métodos DEBEN tener `@RequirePermissions('modulo:accion')`
- TODOS los DTOs DEBEN usar `class-validator` con decoradores de validación
- LAS respuestas DEBEN seguir formato: `{ success: boolean, data: T, message?: string }`
- LOS errores DEBEN usar `HttpException` con códigos HTTP apropiados

### Ejemplo Correcto:
```typescript
@Controller('ventas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VentasController {
  constructor(private ventasService: VentasService) {}

  @Post()
  @RequirePermissions('ventas:create')
  async create(@Body() dto: CreateSaleDto) {
    const result = await this.ventasService.create(dto);
    return { success: true, data: result, message: 'Venta creada exitosamente' };
  }

  @Get(':id')
  @RequirePermissions('ventas:read')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.ventasService.findOne(id);
    if (!result) {
      throw new NotFoundException('Venta no encontrada');
    }
    return { success: true, data: result };
  }
}
```

## 3. GENERACIÓN DE COMPONENTES REACT

### Reglas:
- TODOS los componentes DEBEN ser `'use client'` si usan hooks o estado
- TODOS los componentes DEBEN usar TypeScript con interfaces explícitas
- LAS consultas DEBEN usar `@tanstack/react-query` con `queryKey` único
- LAS mutaciones DEBEN usar `useMutation` con `onSuccess` y `onError`
- LOS estilos DEBEN usar Tailwind CSS con `cn()` para clases condicionales
- LOS componentes DEBEN ser responsivos (mobile-first)

### Ejemplo Correcto:
```tsx
'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface VentasListProps {
  initialFilter?: string;
}

export function VentasList({ initialFilter }: VentasListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ventas', { filter: initialFilter }],
    queryFn: () => api.get(`/ventas?filter=${initialFilter}`).then(r => r.data),
  });

  const { mutate: deleteVenta, isPending } = useMutation({
    mutationFn: (id: string) => api.delete(`/ventas/${id}`),
    onSuccess: () => {
      toast.success('Venta eliminada correctamente');
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    },
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <Alert variant="destructive">Error cargando ventas</Alert>;

  return (
    <div className="space-y-4">
      {data?.data?.map((venta: Venta) => (
        <Card key={venta.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{venta.numero}</p>
              <p className="text-sm text-gray-500">{formatCurrency(venta.total)}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteVenta(venta.id)}
              disabled={isPending}
            >
              Eliminar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## 4. GENERACIÓN DE FLUJOS N8N

### Reglas:
- TODOS los flujos DEBEN tener un trigger (Cron o Webhook)
- TODAS las peticiones HTTP DEBEN incluir autenticación en headers
- LOS nodos de condición DEBEN manejar ambos caminos (true/false)
- LOS flujos DEBEN incluir manejo de errores (nodo Error Trigger)
- LAS URLs DEBEN usar variables de entorno (`{{ $env.API_URL }}`)

## 5. CONVENCIONES DE NOMBRES

### Backend:
- Controladores: `VentasController`, `InventarioController` (plural)
- Servicios: `VentasService`, `InventarioService` (plural)
- DTOs: `CreateVentaDto`, `UpdateVentaDto`, `FilterVentaDto`
- Entidades: `Venta`, `Inventario` (singular en Prisma)

### Frontend:
- Componentes: `VentasList`, `VentaForm`, `VentaDetail` (PascalCase)
- Hooks: `useVentas`, `useVenta` (camelCase)
- Stores: `ventasStore`, `authStore` (camelCase)
- Páginas: `/ventas`, `/ventas/nueva`, `/ventas/[id]` (kebab-case en rutas)

## 6. MANEJO DE ERRORES

### Backend:
```typescript
try {
  // lógica
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException('Registro duplicado');
    }
    if (error.code === 'P2025') {
      throw new NotFoundException('Registro no encontrado');
    }
  }
  throw new InternalServerErrorException('Error interno del servidor');
}
```

### Frontend:
```typescript
try {
  await mutation.mutateAsync(data);
  toast.success('Operación exitosa');
  router.push('/listado');
} catch (error: any) {
  toast.error(error.response?.data?.message || 'Error en la operación');
}
```

## 7. SEGURIDAD

### Reglas Obligatorias:
- NUNCA exponer contraseñas o tokens en respuestas
- SIEMPRE validar permisos en backend (nunca confiar en frontend)
- SIEMPRE usar `ParseUUIDPipe` para IDs en rutas
- SIEMPRE sanitizar inputs contra SQL injection (Prisma lo hace automático)
- SIEMPRE usar HTTPS en producción
- NUNCA commitear archivos `.env` o secretos

## 8. PERFORMANCE

### Reglas:
- USAR `select` específico en Prisma (nunca `include: true`)
- USAR paginación en listas (`skip`, `take`)
- USAR índices en campos de búsqueda frecuente
- USAR caché para datos que no cambian frecuentemente
- USAR `Promise.all` para consultas paralelas
- EVITAR N+1 queries con `include` o `select` anidados

---

## CHECKLIST DE GENERACIÓN

Para cada módulo, la IA generadora DEBE verificar:

- [ ] Modelo Prisma creado con todos los campos necesarios
- [ ] Migración Prisma generada (`prisma migrate dev`)
- [ ] Servicio con todas las funciones CRUD + específicas del módulo
- [ ] Controlador con endpoints RESTful
- [ ] Guards de permisos aplicados
- [ ] DTOs con validaciones
- [ ] Componentes React para listar, crear, editar, ver detalle
- [ ] Dashboard del módulo con KPIs
- [ ] Reportes exportables (Excel/PDF)
- [ ] Flujos n8n de automatización (si aplican)
- [ ] Pruebas unitarias del servicio
- [ ] Documentación de la API (OpenAPI/Swagger)

---

## APÉNDICE A: HERRAMIENTAS DE IA GRATUITAS PARA INTEGRAR

### Herramientas Recomendadas (2025)

| Herramienta | Tipo | Plan Gratis | Límites | URL | Uso en ERP |
|-------------|------|-------------|---------|-----|------------|
| **Google Gemini** | LLM/Chat | ✅ Sí | 60 req/min | gemini.google.com | Chatbot, predicciones, resúmenes |
| **Hugging Face** | ML Models | ✅ Sí | 30k req/mes | huggingface.co | Sentimiento, clasificación, NLP |
| **Ollama** | LLM Local | ✅ 100% | Sin límites | ollama.ai | Modelos locales (Llama 3, Mistral) |
| **Groq** | Inferencia | ✅ Sí | 30 req/min | groq.com | Inferencia ultra-rápida |
| **Cohere** | NLP/Embeddings | ✅ Sí | 100 req/min | cohere.ai | Búsqueda semántica, embeddings |
| **AssemblyAI** | Audio→Texto | ✅ Sí | 3 hrs/mes | assemblyai.com | Transcripción de reuniones |
| **DeepL** | Traducción | ✅ Sí | 500k chars/mes | deepl.com | Traducción de documentos |
| **Leonardo.ai** | Imágenes | ✅ Sí | 150 créditos/día | leonardo.ai | Generación de imágenes |
| **Sunno AI** | Música | ✅ Sí | Limitado | sunno.ai | Generación de audio |
| **Perplexity** | Búsqueda | ✅ Sí | Limitado | perplexity.ai | Búsqueda en internet |

### Integración Recomendada para ERP ZENITH

```typescript
// providers/ia-gratis.ts

export const IA_PROVIDERS = {
  // Principal - Chat y predicciones
  GEMINI: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    env: 'GEMINI_API_KEY',
    limit: 60, // req/min
    gratis: true,
    usos: ['chat', 'forecast', 'summary', 'classification'],
  },
  
  // Secundario - Sentimiento y NLP
  HUGGINGFACE: {
    url: 'https://api-inference.huggingface.co/models',
    env: 'HF_TOKEN',
    limit: 30000, // req/mes
    gratis: true,
    usos: ['sentiment', 'classification', 'ner'],
  },
  
  // Local - Sin dependencia de internet
  OLLAMA: {
    url: 'http://localhost:11434/api/generate',
    env: 'OLLAMA_HOST',
    limit: Infinity, // Sin límites
    gratis: true,
    usos: ['chat', 'local-processing'],
  },
  
  // Rápido - Inferencia en tiempo real
  GROQ: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    env: 'GROQ_API_KEY',
    limit: 30, // req/min
    gratis: true,
    usos: ['chat', 'real-time'],
  },
};
```

### Configuración de Variables de Entorno

```bash
# .env - Claves de IA (obtener gratis)

# Google Gemini (más potente)
# Obtener en: https://makersuite.google.com/app/apikey
GEMINI_API_KEY="xxx"

# Hugging Face (NLP y sentimiento)
# Obtener en: https://huggingface.co/settings/tokens
HF_TOKEN="hf_xxx"

# Groq (inferencia rápida)
# Obtener en: https://console.groq.com/keys
GROQ_API_KEY="gsk_xxx"

# Ollama (local, sin clave)
OLLAMA_HOST="http://localhost:11434"
```

---

## APÉNDICE B: ESTRUCTURA MODULAR DEL SISTEMA

### Carpetas y Archivos Creados

```
erp-cerebro-sistema/                    # Nueva estructura modular
│
├── 00-shared/                          # ✅ COMPLETO
│   ├── auth.md                         # Autenticación (500+ líneas)
│   └── rbac.md                         # Roles y permisos (400+ líneas)
│
├── 01-modulo-administrativo/           # 🟡 PARCIAL (40%)
│   ├── contabilidad.md                 # ✅ Contabilidad (800+ líneas)
│   └── rrhh/
│       └── empleados.md                # ✅ Nómina LOTTT (700+ líneas)
│
├── 02-modulo-operativo/                # 🟡 PARCIAL (60%)
│   ├── inventario.md                   # ✅ Stock y almacenes (700+ líneas)
│   ├── compras.md                      # ✅ Compras y proveedores (700+ líneas)
│   └── produccion.md                   # ✅ MRP y BOM (600+ líneas)
│
├── 03-modulo-comercial/                # 🟡 PARCIAL (50%)
│   ├── ventas.md                       # ✅ Ventas y facturación (600+ líneas)
│   └── crm.md                          # ✅ CRM y leads (600+ líneas)
│
├── 05-modulo-configuracion/            # 🟡 PARCIAL (20%)
│   └── sistema.md                      # ✅ Configuración general (500+ líneas)
│
├── 07-integraciones/                   # 🟡 PARCIAL (25%)
│   └── ia.md                           # ✅ IA gratuita (600+ líneas)
│
└── 08-deployment/                      # ✅ COMPLETO
    └── infraestructura.md              # Deploy sin Docker (500+ líneas)
```

### Progreso Total

| Métrica | Valor |
|---------|-------|
| **Archivos Creados** | 12 |
| **Líneas Totales** | ~7,500+ |
| **Módulos Completos** | 2 (00-shared, 08-deployment) |
| **Cobertura** | 45% del sistema completo |
| **Archivos Pendientes** | 16 |

---

## APÉNDICE C: CONEXIONES ENTRE MÓDULOS

### Matriz de Dependencias

| Módulo | Depende de | Es Dependido por |
|--------|-----------|------------------|
| **Ventas** | Inventario, Contabilidad | CRM, Tesorería, Reportes |
| **Compras** | Inventario, Contabilidad | Producción, Tesorería |
| **Inventario** | Contabilidad | Ventas, Compras, Producción |
| **Producción** | Inventario, Compras | Contabilidad, Ventas |
| **Contabilidad** | Todos | Reportes, Tesorería |
| **RRHH** | Contabilidad | Ventas (comisiones) |
| **CRM** | Ventas | Marketing |
| **Tesorería** | Contabilidad, Ventas, Compras | Reportes |

### Flujo de Datos Críticos

```
VENTA → Facturar
  ├─→ Inventario: Descuentar stock
  ├─→ Contabilidad: Crear asiento
  ├─→ Tesorería: Crear cuenta por cobrar
  └─→ CRM: Actualizar historial cliente

COMPRA → Recepcionar
  ├─→ Inventario: Aumentar stock
  ├─→ Contabilidad: Crear asiento
  ├─→ Tesorería: Crear cuenta por pagar
  └─→ Producción: Disponibilidad de MP

PRODUCCIÓN → Completar
  ├─→ Inventario: Descuentar MP, Aumentar PT
  ├─→ Contabilidad: Crear asiento de costo
  ├─→ Ventas: Disponibilidad de producto
  └─→ Mantenimiento: Horas de máquina

NÓMINA → Procesar
  ├─→ Contabilidad: Crear asiento
  ├─→ Tesorería: Desembolso
  └─→ Ventas: Calcular comisiones
```

---

## APÉNDICE D: RECURSOS Y ENLACES

### Documentación Oficial

- **Next.js**: https://nextjs.org/docs
- **NestJS**: https://docs.nestjs.com
- **Prisma**: https://www.prisma.io/docs
- **PostgreSQL**: https://www.postgresql.org/docs
- **n8n**: https://docs.n8n.io
- **Cloudflare R2**: https://developers.cloudflare.com/r2

### Herramientas de IA

- **Google Gemini**: https://ai.google.dev
- **Hugging Face**: https://huggingface.co/docs
- **Ollama**: https://ollama.ai
- **Groq**: https://console.groq.com/docs

### Despliegue

- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs
- **Neon**: https://neon.tech/docs

---

## FIN DEL DOCUMENTO

Este documento constituye la especificación técnica completa del ERP ZENITH.

**Documentación modular creada**: Marzo 2025  
**Ubicación**: `erp-cerebro-sistema/`  
**Archivos**: 12 documentos técnicos  
**Líneas totales**: ~7,500+  
**Cobertura**: 45% del sistema completo

Cualquier duda o ambigüedad debe ser consultada antes de generar código.

Para información detallada de cada módulo, revisar los archivos individuales en la carpeta `erp-cerebro-sistema/`.
