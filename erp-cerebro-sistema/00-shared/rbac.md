# Módulo 00-SHARED: Roles y Permisos (RBAC)

## Descripción

Este documento define el sistema de Roles y Permisos (RBAC - Role Based Access Control) que controla el acceso a TODOS los módulos del ERP.

## 🔗 Conexión con auth.md

Este archivo complementa `auth.md`. Mientras `auth.md` maneja la autenticación (quién eres), este archivo maneja la autorización (qué puedes hacer).

---

## 📋 Roles Predefinidos del Sistema

### Tabla de Roles

| ID | Nombre | Descripción | Color | Icono | Módulos |
|----|--------|-------------|-------|-------|---------|
| ADMIN | Administrador del Sistema | Acceso completo a todo | #dc2626 | crown | * |
| CONTADOR | Contador | Gestión contable y financiera | #2563eb | calculator | contabilidad, finanzas, tesoreria, impuestos |
| FINANZAS | Analista Financiero | Gestión financiera | #0891b2 | trending-up | finanzas, tesoreria, presupuesto |
| ALMACENISTA | Almacenista | Control de inventario | #16a34a | package | inventario, almacen |
| COMPRADOR | Comprador | Gestión de compras | #0284c7 | shopping-bag | compras, proveedores |
| VENDEDOR | Vendedor | Ventas y clientes | #db2777 | shopping-cart | ventas, crm, pos |
| RRHH | Recursos Humanos | Nómina y empleados | #c026d3 | users | rrhh, nomina, asistencia |
| PRODUCCION | Jefe de Producción | Órdenes de producción | #ea580c | factory | produccion, mrp, calidad |
| MANTENIMIENTO | Mantenimiento | Activos y mantenimiento | #7c3aed | wrench | mantenimiento, activos-fijos |

---

## 📊 Modelo de Datos - Roles

```prisma
model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  color       String       @default("#6366f1")
  icon        String       @default("shield")
  isSystem    Boolean      @default(false)
  permissions Permission[]
  users       User[]
  modules     ModuleAccess[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Permission {
  id        String   @id @default(cuid())
  roleId    String
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  module    String   // Módulo: ventas, compras, contabilidad, rrhh
  action    String   // Acción: create, read, update, delete, approve, export, report
  resource  String?  // Recurso específico (opcional)
  createdAt DateTime @default(now())

  @@unique([roleId, module, action, resource])
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
}
```

---

## 🎭 Definición Completa de Roles

### ADMIN - Administrador del Sistema

```typescript
{
  id: 'admin',
  name: 'ADMIN',
  description: 'Acceso completo a todos los módulos y configuraciones',
  color: '#dc2626',
  icon: 'crown',
  isSystem: true,
  permissions: ['*:*'], // Todas las acciones en todos los módulos
  modules: ['*'], // Todos los módulos
}
```

**Permisos**:
- `*:*` - Acceso total

**Módulos Visibles**:
- TODOS los módulos

---

### CONTADOR - Contador

```typescript
{
  id: 'contador',
  name: 'CONTADOR',
  description: 'Gestión contable y financiera',
  color: '#2563eb',
  icon: 'calculator',
  isSystem: true,
  permissions: [
    'contabilidad:*',
    'finanzas:*',
    'tesoreria:*',
    'presupuesto:*',
    'activos-fijos:*',
    'impuestos:*',
    'reportes-contables:read',
    'configuracion-empresa:read',
  ],
  modules: [
    { group: 'administrativo', name: 'contabilidad', canView: true, canEdit: true, canDelete: false, canExport: true, canReport: true },
    { group: 'administrativo', name: 'finanzas', canView: true, canEdit: true, canDelete: false, canExport: true, canReport: true },
    { group: 'administrativo', name: 'tesoreria', canView: true, canEdit: true, canDelete: false, canExport: true, canReport: true },
    { group: 'administrativo', name: 'presupuesto', canView: true, canEdit: true, canDelete: false, canExport: true, canReport: true },
    { group: 'administrativo', name: 'activos-fijos', canView: true, canEdit: true, canDelete: false, canExport: true, canReport: true },
    { group: 'administrativo', name: 'impuestos', canView: true, canEdit: true, canDelete: false, canExport: true, canReport: true },
    { group: 'reportes', name: 'reportes-contables', canView: true, canEdit: false, canDelete: false, canExport: true, canReport: true },
  ],
}
```

**Permisos Detallados**:
- `contabilidad:create` - Crear asientos contables
- `contabilidad:read` - Ver asientos y cuentas
- `contabilidad:update` - Editar asientos (no posteados)
- `contabilidad:delete` - Eliminar asientos (solo borradores)
- `contabilidad:post` - Postear asientos
- `contabilidad:export` - Exportar libros legales
- `finanzas:*` - Todas las acciones de finanzas
- `tesoreria:*` - Todas las acciones de tesorería
- `impuestos:declare` - Generar declaraciones

**Módulos Visibles**:
- ✅ contabilidad
- ✅ finanzas
- ✅ tesoreria
- ✅ presupuesto
- ✅ activos-fijos
- ✅ impuestos
- ✅ reportes-contables

**Módulos Ocultos**:
- ❌ ventas
- ❌ compras
- ❌ inventario
- ❌ produccion
- ❌ rrhh
- ❌ configuracion-usuarios

---

### VENDEDOR - Vendedor

```typescript
{
  id: 'vendedor',
  name: 'VENDEDOR',
  description: 'Gestión de ventas y clientes',
  color: '#db2777',
  icon: 'shopping-cart',
  isSystem: true,
  permissions: [
    'ventas:create',
    'ventas:read',
    'ventas:update',
    'ventas:delete',
    'ventas:export',
    'crm:*',
    'pos:*',
    'clientes:*',
    'reportes-ventas:read',
  ],
  modules: [
    { group: 'comercial', name: 'ventas', canView: true, canEdit: true, canDelete: true, canExport: true, canReport: true },
    { group: 'comercial', name: 'crm', canView: true, canEdit: true, canDelete: true, canExport: true, canReport: true },
    { group: 'comercial', name: 'pos', canView: true, canEdit: true, canDelete: false, canExport: false, canReport: true },
    { group: 'comercial', name: 'clientes', canView: true, canEdit: true, canDelete: false, canExport: true, canReport: true },
    { group: 'reportes', name: 'reportes-ventas', canView: true, canEdit: false, canDelete: false, canExport: true, canReport: true },
  ],
}
```

**Permisos Detallados**:
- `ventas:create` - Crear ventas y cotizaciones
- `ventas:read` - Ver ventas propias y generales
- `ventas:update` - Editar ventas (solo borradores)
- `ventas:delete` - Eliminar ventas (solo propias en borrador)
- `ventas:export` - Exportar lista de ventas
- `crm:*` - Todas las acciones de CRM
- `pos:*` - Todas las acciones de POS
- `clientes:create` - Crear clientes
- `clientes:read` - Ver clientes
- `clientes:update` - Editar clientes
- `reportes-ventas:read` - Ver dashboard de ventas

**Módulos Visibles**:
- ✅ ventas
- ✅ crm
- ✅ pos
- ✅ clientes
- ✅ reportes-ventas

**Módulos Ocultos**:
- ❌ contabilidad
- ❌ finanzas
- ❌ tesoreria
- ❌ compras
- ❌ inventario (solo puede consultar stock, no editar)
- ❌ rrhh
- ❌ configuracion

**Restricciones Especiales**:
- NO puede ver costos de productos (solo precios de venta)
- NO puede ver asientos contables
- NO puede modificar configuración del sistema
- SOLO puede eliminar sus propias ventas en estado BORRADOR

---

### ALMACENISTA - Almacenista

```typescript
{
  id: 'almacenista',
  name: 'ALMACENISTA',
  description: 'Gestión de inventario y almacén',
  color: '#16a34a',
  icon: 'package',
  isSystem: true,
  permissions: [
    'inventario:*',
    'almacen:*',
    'productos:read',
    'productos:update',
    'movimientos-inventario:create',
    'movimientos-inventario:read',
    'compras:read', // Solo para ver qué llegará
    'reportes-inventario:read',
  ],
  modules: [
    { group: 'operativo', name: 'inventario', canView: true, canEdit: true, canDelete: false, canExport: true, canReport: true },
    { group: 'operativo', name: 'almacen', canView: true, canEdit: true, canDelete: false, canExport: true, canReport: true },
    { group: 'operativo', name: 'productos', canView: true, canEdit: true, canDelete: false, canExport: true, canReport: true },
    { group: 'operativo', name: 'compras', canView: true, canEdit: false, canDelete: false, canExport: false, canReport: false },
    { group: 'reportes', name: 'reportes-inventario', canView: true, canEdit: false, canDelete: false, canExport: true, canReport: true },
  ],
}
```

**Permisos Detallados**:
- `inventario:*` - Todas las acciones de inventario
- `almacen:*` - Todas las acciones de almacén
- `productos:read` - Ver productos
- `productos:update` - Editar productos (solo datos no financieros)
- `movimientos-inventario:create` - Registrar entradas/salidas
- `movimientos-inventario:read` - Ver movimientos
- `compras:read` - Ver compras para recepción
- `reportes-inventario:read` - Ver reportes de inventario

**Módulos Visibles**:
- ✅ inventario
- ✅ almacen
- ✅ productos
- ✅ compras (solo lectura)
- ✅ reportes-inventario

**Módulos Ocultos**:
- ❌ ventas (no puede ver ventas)
- ❌ contabilidad
- ❌ finanzas
- ❌ rrhh
- ❌ configuracion

**Restricciones Especiales**:
- NO puede ver precios de venta (solo costos)
- NO puede eliminar productos
- NO puede crear asientos contables
- PUEDE recibir compras
- PUEDE hacer ajustes de inventario (con razón)

---

## 🛡️ Guards de Permisos

### Cómo Funciona el Guard

```typescript
// apps/backend/src/common/guards/permissions.guard.ts

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Obtener permisos requeridos del decorador
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) return true;

    // 2. Obtener usuario del request (inyectado por JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // 3. Si es ADMIN, permitir todo
    if (user.role === 'ADMIN') return true;

    // 4. Obtener permisos actualizados de la BD
    const userRole = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      include: { permissions: true, modules: true },
    });

    // 5. Convertir a array de strings "modulo:accion"
    const userPermissions = userRole.permissions.map(p => `${p.module}:${p.action}`);

    // 6. Verificar cada permiso requerido
    const hasAllPermissions = requiredPermissions.every(permission => {
      // Soportar wildcard: ventas:* = todas las acciones de ventas
      if (permission.endsWith(':*')) {
        const module = permission.split(':')[0];
        return userPermissions.some(p => p.startsWith(`${module}:`));
      }
      return userPermissions.includes(permission);
    });

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Acceso denegado. Requerido: ${requiredPermissions.join(', ')}`
      );
    }

    // 7. Verificar acceso al módulo
    const moduleName = this.extractModuleName(context);
    const hasModuleAccess = userRole.modules.some(m => 
      m.moduleName === moduleName && m.canView
    );

    if (!hasModuleAccess) {
      throw new ForbiddenException(`No tienes acceso al módulo ${moduleName}`);
    }

    return true;
  }
}
```

---

## 📝 Cómo Asignar Permisos

### Ejemplo: Crear Nuevo Rol

```typescript
// apps/backend/src/modules/config/roles.service.ts

async createRole(data: CreateRoleDto) {
  // 1. Crear rol
  const role = await this.prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      isSystem: false,
    },
  });

  // 2. Crear permisos
  if (data.permissions?.length) {
    await this.prisma.permission.createMany({
      data: data.permissions.map(p => ({
        roleId: role.id,
        module: p.module,
        action: p.action,
        resource: p.resource,
      })),
    });
  }

  // 3. Crear acceso a módulos
  if (data.modules?.length) {
    await this.prisma.moduleAccess.createMany({
      data: data.modules.map(m => ({
        roleId: role.id,
        moduleGroup: m.group,
        moduleName: m.name,
        canView: m.canView,
        canEdit: m.canEdit,
        canDelete: m.canDelete,
        canExport: m.canExport,
        canReport: m.canReport,
      })),
    });
  }

  return role;
}
```

---

## 🔗 Conexiones con Otros Módulos

| Módulo | Conexión | Descripción |
|--------|----------|-------------|
| 01-administrativo | ModuleAccess | Define qué roles ven contabilidad |
| 02-operativo | ModuleAccess | Define qué roles ven inventario |
| 03-comercial | ModuleAccess | Define qué roles ven ventas |
| 04-rrhh | ModuleAccess | Define qué roles ven nómina |
| 05-configuracion | Role CRUD | Gestiona creación de roles |
| TODOS | PermissionsGuard | Valida permisos en cada endpoint |

---

## 📊 Matriz de Permisos por Módulo

### Módulo de Ventas

| Acción | ADMIN | CONTADOR | VENDEDOR | ALMACENISTA | RRHH |
|--------|-------|----------|----------|-------------|------|
| create | ✅ | ❌ | ✅ | ❌ | ❌ |
| read | ✅ | ❌ | ✅ | ❌ | ❌ |
| update | ✅ | ❌ | ✅ | ❌ | ❌ |
| delete | ✅ | ❌ | ✅ (borradores) | ❌ | ❌ |
| export | ✅ | ✅ | ✅ | ❌ | ❌ |
| report | ✅ | ✅ | ✅ | ❌ | ❌ |
| approve | ✅ | ✅ | ❌ | ❌ | ❌ |

### Módulo de Inventario

| Acción | ADMIN | CONTADOR | VENDEDOR | ALMACENISTA | COMPRADOR |
|--------|-------|----------|----------|-------------|-----------|
| create | ✅ | ❌ | ❌ | ✅ | ❌ |
| read | ✅ | ✅ (costos) | ✅ (stock) | ✅ | ✅ |
| update | ✅ | ❌ | ❌ | ✅ | ❌ |
| delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| export | ✅ | ✅ | ❌ | ✅ | ❌ |
| report | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## ⚠️ Reglas Críticas

1. **NUNCA** hardcodear roles en el código. Usar permisos dinámicos.
2. **SIEMPRE** verificar permisos en backend, nunca confiar en frontend.
3. **SIEMPRE** usar `@RequirePermissions()` en cada endpoint.
4. **NUNCA** permitir que un rol no-system tenga `*:*`.
5. **SIEMPRE** registrar auditoría cuando se deniega acceso.

---

## 📁 Archivos Relacionados

- `auth.md` - Autenticación y JWT
- `prisma-schema.md` - Modelos de datos
- `types.md` - Tipos TypeScript

**Anterior**: `auth.md` | **Siguiente**: `prisma-schema.md`
