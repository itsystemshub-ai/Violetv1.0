# Módulo 05: CONFIGURACIÓN - Gestión de Usuarios

## Descripción

Módulo para gestión de usuarios del sistema, asignación de roles, permisos y control de acceso.

## 🔗 Conexiones

- **00-shared/auth** → Autenticación de usuarios
- **00-shared/rbac** → Roles y permisos
- **05-configuracion/seguridad** → Políticas de seguridad

---

## 📊 Modelo de Datos

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  username     String   @unique
  passwordHash String
  name         String
  firstName    String
  lastName     String
  cedula       String   @unique
  phone        String?
  avatar       String?
  roleId       String
  role         Role     @relation(fields: [roleId], references: [id])
  isActive     Boolean  @default(true)
  mfaEnabled   Boolean  @default(false)
  lastLogin    DateTime?
  sessions     Session[]
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  color       String
  icon        String
  isSystem    Boolean      @default(false)
  permissions Permission[]
  users       User[]
}

model Permission {
  id       String @id @default(cuid())
  roleId   String
  role     Role   @relation(fields: [roleId], references: [id])
  module   String
  action   String
  resource String?
}
```

---

## 📡 Endpoints Principales

```typescript
@Controller('usuarios')
export class UsuariosController {
  @Get()
  async getUsuarios(@Query('roleId') roleId?: string) { }
  
  @Post()
  async createUsuario(@Body() dto: CreateUsuarioDto) { }
  
  @Put(':id')
  async updateUsuario(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) { }
  
  @Delete(':id')
  async deleteUsuario(@Param('id') id: string) { }
  
  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string) { }
  
  @Get('roles')
  async getRoles() { }
  
  @Put('roles/:id/permisos')
  async updatePermisos(@Param('id') id: string, @Body() dto: UpdatePermisosDto) { }
}
```

---

## ⚠️ Reglas de Negocio

1. **Usuarios**: Email y cédula deben ser únicos
2. **Contraseñas**: Cumplir política de seguridad (mínimo 10 caracteres, mayúsculas, números, especiales)
3. **Roles**: Roles del sistema no se pueden eliminar
4. **Permisos**: Formato `modulo:accion` (ej. `ventas:create`)
5. **MFA**: Opcional pero recomendado para administradores
6. **Auditoría**: Registrar todos los cambios de usuarios

---

**Anterior**: `05-configuracion/seguridad.md` | **Siguiente**: `05-configuracion/tablas.md`
