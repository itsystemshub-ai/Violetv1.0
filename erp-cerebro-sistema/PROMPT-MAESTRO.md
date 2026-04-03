# PROMPT MAESTRO — ERP ZENITH
## Sistema ERP Profesional para Venezuela | Versión 6.0 | Marzo 2025

> Este documento es el contexto maestro completo para implementar ERP ZENITH.
> Úsalo como prompt de sistema en cualquier agente de IA para obtener código correcto y coherente.

---

## 1. IDENTIDAD DEL SISTEMA

**Nombre:** ERP ZENITH
**Descripción:** Sistema ERP empresarial completo para el mercado venezolano.
**Cumplimiento legal:** LOTTT, IVA 16%, ISLR, SENIAT, IVSS, FAOV, INCES, BCV.
**Moneda:** Multimoneda VES/USD con tasa BCV automática.
**Principio clave:** Segregación total por roles — cada usuario SOLO ve su módulo asignado.


---

## 2. STACK TÉCNICO COMPLETO

### Frontend
- **Framework:** Next.js 14 (App Router, Server Components)
- **Lenguaje:** TypeScript 5
- **Estado global:** Zustand
- **Fetching/Cache:** React Query 5 (TanStack Query)
- **UI Components:** shadcn/ui
- **Estilos:** TailwindCSS
- **Animaciones:** Framer Motion
- **Gráficos:** Recharts
- **Tiempo real:** Socket.io-client
- **Tipografía:** League Spartan (Google Fonts)
- **Diseño:** Glassmorphism + Dark mode

### Backend
- **Framework:** NestJS 10
- **Lenguaje:** TypeScript 5
- **ORM:** Prisma 5
- **Base de datos:** PostgreSQL (Neon — serverless)
- **Autenticación:** JWT + Passport.js + MFA (TOTP)
- **Validación:** class-validator + class-transformer
- **Documentación API:** Swagger/OpenAPI
- **Tiempo real:** Socket.io (WebSockets)
- **Almacenamiento archivos:** Cloudflare R2 (S3-compatible)
- **Puerto:** 3001

### Infraestructura (SIN Docker)
- **Backend deploy:** Railway
- **Frontend deploy:** Vercel
- **Base de datos:** Neon (PostgreSQL serverless)
- **Archivos/Storage:** Cloudflare R2
- **Automatización:** n8n (self-hosted en Railway)
- **IA:** Google Gemini + Hugging Face + Ollama + Groq (todos gratuitos)

### Monorepo
- **Gestor:** Turborepo
- **Package manager:** npm workspaces
- **Estructura:** `apps/backend`, `apps/frontend`, `packages/shared-types`


---

## 3. ARQUITECTURA DEL MONOREPO

```
erpzenith/
├── apps/
│   ├── frontend/                     # Next.js 14 — Puerto 3000
│   │   ├── app/
│   │   │   ├── (auth)/               # Login, registro, recuperación
│   │   │   └── (dashboard)/          # Layout principal con sidebar dinámico
│   │   │       ├── layout.tsx        # Sidebar filtrado por rol
│   │   │       ├── page.tsx          # Dashboard principal
│   │   │       ├── operativo/        # inventario, compras, produccion, mantenimiento, calidad, flota
│   │   │       ├── comercial/        # ventas, pos, marketing
│   │   │       ├── rrhh/             # empleados, nomina, asistencia
│   │   │       ├── configuracion/    # sistema, seguridad, usuarios, tablas
│   │   │       └── reportes/         # dashboard-general, bi-avanzado
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui base
│   │   │   ├── layout/               # Sidebar, TopBar, Header
│   │   │   ├── modules/              # Componentes por módulo
│   │   │   └── charts/               # Gráficos Recharts
│   │   ├── stores/                   # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── moduleStore.ts
│   │   │   └── uiStore.ts
│   │   └── hooks/
│   │       ├── usePermissions.ts
│   │       └── useModules.ts
│   │
│   └── backend/                      # NestJS 10 — Puerto 3001
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── operativo/        # inventario, compras, produccion, mantenimiento, calidad, flota
│       │   │   ├── comercial/        # ventas, pos, marketing
│       │   │   ├── rrhh/             # empleados, nomina, asistencia
│       │   │   └── configuracion/    # sistema, seguridad, usuarios, tablas
│       │   ├── common/
│       │   │   ├── guards/           # JwtAuthGuard, PermissionsGuard
│       │   │   ├── decorators/       # @RequirePermissions, @CurrentUser
│       │   │   └── interceptors/
│       │   └── prisma/               # PrismaService, schema
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   └── shared-types/                 # Tipos TypeScript compartidos
│
└── n8n-workflows/                    # Flujos JSON de automatización
```


---

## 4. SISTEMA RBAC — ROLES Y PERMISOS

### Roles del Sistema (isSystem: true — no editables por usuarios)

| Rol | Color | Módulos Asignados |
|-----|-------|-------------------|
| ADMIN | #dc2626 (rojo) | Todos los módulos (`*`) |
| ALMACENISTA | #16a34a (verde) | inventario, almacen |
| PRODUCCION | #ea580c (naranja) | produccion, mrp, calidad |
| MANTENIMIENTO | #7c3aed (violeta) | mantenimiento |
| VENDEDOR | #db2777 (rosa) | ventas, pos |
| COMPRADOR | #0284c7 (sky) | compras, proveedores |
| RRHH | #c026d3 (fucsia) | empleados, nomina, asistencia |

> NOTA: Los roles CONTADOR, FINANZAS y CRM fueron eliminados del sistema activo.

### Acciones de Permisos
`create` | `read` | `update` | `delete` | `approve` | `export` | `report`

### Modelos Prisma — RBAC

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
  module    String
  action    String
  resource  String?
  createdAt DateTime @default(now())
  @@unique([roleId, module, action, resource])
}

model ModuleAccess {
  id          String   @id @default(cuid())
  roleId      String
  role        Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  moduleGroup String
  moduleName  String
  canView     Boolean  @default(true)
  canEdit     Boolean  @default(false)
  canDelete   Boolean  @default(false)
  canExport   Boolean  @default(false)
  canReport   Boolean  @default(true)
  createdAt   DateTime @default(now())
  @@unique([roleId, moduleName])
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  username     String    @unique
  passwordHash String
  name         String
  firstName    String
  lastName     String
  cedula       String    @unique
  phone        String?
  avatar       String?
  roleId       String
  role         Role      @relation(fields: [roleId], references: [id])
  isActive     Boolean   @default(true)
  isVerified   Boolean   @default(false)
  mfaSecret    String?
  mfaEnabled   Boolean   @default(false)
  lastLogin    DateTime?
  lastLoginIP  String?
  sessions     Session[]
  auditLogs    AuditLog[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  @@index([roleId])
  @@index([isActive])
}
```

### Guard de Permisos — NestJS

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(), context.getClass(),
    ]);
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    const userRole = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      include: { permissions: true },
    });

    if (userRole?.name === 'ADMIN') return true;

    const userPerms = userRole.permissions.map(p => `${p.module}:${p.action}`);
    const hasAll = required.every(perm => {
      if (perm.endsWith(':*')) {
        const mod = perm.split(':')[0];
        return userPerms.some(p => p.startsWith(`${mod}:`));
      }
      return userPerms.includes(perm);
    });

    if (!hasAll) throw new ForbiddenException(`Permiso requerido: ${required.join(', ')}`);
    return true;
  }
}

// Decorador
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
```


---

## 5. MÓDULOS ACTIVOS DEL SISTEMA

> ⚠️ MÓDULOS ELIMINADOS (NO implementar): tesorería, activos-fijos, presupuesto, contabilidad, CRM.

### Módulos Activos por Grupo

#### OPERATIVO
- `inventario` — Control de stock, multi-almacén, PEPS, lotes, trazabilidad
- `compras` — Órdenes de compra, proveedores, solicitudes de compra
- `produccion` — MRP, BOM, órdenes de producción
- `mantenimiento` — CMMS, órdenes de trabajo, activos
- `calidad` — Inspecciones, no conformidades, trazabilidad de lotes
- `flota` — Vehículos, choferes, rutas, combustible

#### COMERCIAL
- `ventas` — Facturación, cotizaciones, pedidos, CxC
- `pos` — Punto de venta táctil, sesiones de caja
- `marketing` — Campañas, email marketing, segmentación

#### RRHH
- `empleados` — Expedientes, contratos, documentos
- `nomina` — Cálculo nómina LOTTT, recibos de pago, provisiones
- `asistencia` — Control de asistencia, horarios, vacaciones

#### CONFIGURACIÓN
- `sistema` — Parámetros generales, datos de empresa
- `seguridad` — Auditoría, logs, políticas de acceso
- `usuarios` — Gestión de usuarios, roles, permisos
- `tablas` — Catálogos del sistema

#### REPORTES
- `dashboard-general` — KPIs generales, gráficos en tiempo real
- `bi-avanzado` — OLAP, análisis predictivo, reportes ejecutivos


---

## 6. MÓDULO OPERATIVO — DETALLE

### Inventario

**Funciones clave:**
- Multi-almacén con ubicaciones (pasillo, estante, nivel)
- Métodos de valuación: PEPS (FIFO), Promedio Ponderado
- Control de lotes y fechas de vencimiento
- Trazabilidad completa de movimientos
- Alertas de stock mínimo/máximo
- Inventario físico con ajustes

**Endpoints principales:**
```
GET    /inventario/productos          # Lista con filtros y paginación
POST   /inventario/productos          # Crear producto
GET    /inventario/productos/:id      # Detalle con stock por almacén
PUT    /inventario/productos/:id      # Actualizar
POST   /inventario/movimientos        # Entrada/salida/traslado
GET    /inventario/stock              # Stock actual por almacén
GET    /inventario/alertas            # Productos bajo stock mínimo
POST   /inventario/inventario-fisico  # Iniciar conteo físico
GET    /inventario/kardex/:id         # Kardex del producto
```

**Modelos Prisma clave:**
```prisma
model Producto {
  id              String   @id @default(cuid())
  codigo          String   @unique
  nombre          String
  descripcion     String?
  categoriaId     String
  unidadMedida    String
  stockActual     Decimal  @default(0)
  stockMinimo     Decimal  @default(0)
  stockMaximo     Decimal  @default(0)
  precioCompra    Decimal  @default(0)
  precioVenta     Decimal  @default(0)
  precioVentaUSD  Decimal  @default(0)
  metodoValuacion String   @default("PEPS")
  controlLotes    Boolean  @default(false)
  activo          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model MovimientoInventario {
  id          String   @id @default(cuid())
  productoId  String
  almacenId   String
  tipo        String   // ENTRADA, SALIDA, TRASLADO, AJUSTE
  cantidad    Decimal
  costo       Decimal
  referencia  String?
  lote        String?
  vencimiento DateTime?
  usuarioId   String
  createdAt   DateTime @default(now())
}
```

### Compras

**Funciones clave:**
- Solicitudes de compra con aprobación por niveles
- Órdenes de compra con seguimiento de estado
- Recepción parcial de mercancía
- Evaluación de proveedores
- Comparación de cotizaciones

**Endpoints principales:**
```
GET    /compras/solicitudes           # Lista solicitudes
POST   /compras/solicitudes           # Crear solicitud
PUT    /compras/solicitudes/:id/aprobar
POST   /compras/ordenes               # Crear OC desde solicitud
GET    /compras/ordenes/:id           # Detalle OC
POST   /compras/recepciones           # Registrar recepción
GET    /compras/proveedores           # Lista proveedores
POST   /compras/proveedores           # Crear proveedor
```

### Producción

**Funciones clave:**
- Lista de materiales (BOM) multinivel
- Planificación de requerimientos de materiales (MRP)
- Órdenes de producción con seguimiento
- Control de desperdicios y mermas
- Costos de producción

**Endpoints principales:**
```
GET    /produccion/bom                # Lista de materiales
POST   /produccion/bom                # Crear BOM
POST   /produccion/ordenes            # Crear orden de producción
PUT    /produccion/ordenes/:id/iniciar
PUT    /produccion/ordenes/:id/completar
GET    /produccion/mrp                # Calcular MRP
GET    /produccion/costos/:id         # Costos de orden
```

### Mantenimiento

**Funciones clave:**
- Registro de activos con historial
- Mantenimiento preventivo con calendario
- Órdenes de trabajo correctivo
- Control de repuestos y costos
- Indicadores OEE, MTBF, MTTR

**Endpoints principales:**
```
GET    /mantenimiento/activos         # Lista activos
POST   /mantenimiento/activos         # Registrar activo
POST   /mantenimiento/ordenes-trabajo # Crear OT
PUT    /mantenimiento/ordenes-trabajo/:id/completar
GET    /mantenimiento/calendario      # Mantenimientos programados
GET    /mantenimiento/indicadores     # OEE, MTBF, MTTR
```

### Calidad

**Funciones clave:**
- Inspecciones de entrada, proceso y salida
- Registro de no conformidades
- Acciones correctivas y preventivas
- Trazabilidad por lote
- Certificados de calidad

### Flota

**Funciones clave:**
- Registro de vehículos con documentación
- Asignación de choferes y rutas
- Control de combustible y rendimiento
- Mantenimiento vehicular
- Costos por kilómetro


---

## 7. MÓDULO COMERCIAL — DETALLE

### Ventas

**Funciones clave:**
- Cotizaciones → Pedidos → Facturas (flujo completo)
- Facturación en VES y USD con tasa BCV
- Notas de crédito y débito
- Cuentas por cobrar (CxC)
- Descuentos por cliente, producto o campaña
- Integración con POS e inventario

**Endpoints principales:**
```
POST   /ventas/cotizaciones           # Crear cotización
PUT    /ventas/cotizaciones/:id/convertir  # Convertir a pedido
POST   /ventas/facturas               # Crear factura
GET    /ventas/facturas               # Lista con filtros
PUT    /ventas/facturas/:id/anular    # Anular factura
GET    /ventas/cxc                    # Cuentas por cobrar
POST   /ventas/cobros                 # Registrar cobro
GET    /ventas/clientes               # Lista clientes
POST   /ventas/clientes               # Crear cliente
```

**Modelos Prisma clave:**
```prisma
model Factura {
  id            String   @id @default(cuid())
  numero        String   @unique
  clienteId     String
  fecha         DateTime @default(now())
  fechaVence    DateTime
  subtotal      Decimal
  descuento     Decimal  @default(0)
  baseImponible Decimal
  iva           Decimal
  total         Decimal
  totalUSD      Decimal
  tasaBCV       Decimal
  moneda        String   @default("VES")
  estado        String   @default("PENDIENTE") // PENDIENTE, PAGADA, ANULADA, VENCIDA
  usuarioId     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### POS (Punto de Venta)

**Funciones clave:**
- Interfaz táctil optimizada
- Sesiones de caja con apertura/cierre
- Múltiples métodos de pago (efectivo VES/USD, transferencia, punto)
- Impresión de tickets
- Descuentos en tiempo real
- Sincronización con inventario

**Endpoints principales:**
```
POST   /pos/sesiones                  # Abrir sesión de caja
PUT    /pos/sesiones/:id/cerrar       # Cerrar sesión
POST   /pos/ventas                    # Registrar venta POS
GET    /pos/sesiones/:id/resumen      # Resumen de caja
GET    /pos/productos                 # Catálogo para POS
```

### Marketing

**Funciones clave:**
- Campañas de email marketing
- Segmentación de clientes
- Seguimiento de conversiones
- Integración con módulo de ventas


---

## 8. MÓDULO RRHH — DETALLE (LOTTT Venezuela)

### Empleados

**Funciones clave:**
- Expediente digital completo
- Tipos de contrato: determinado, indeterminado, obra
- Cargos y departamentos
- Documentos adjuntos en Cloudflare R2
- Historial de cambios salariales

### Nómina (LOTTT)

**Cálculos obligatorios Venezuela:**
```typescript
// Salario base + beneficios
const calcularNomina = (empleado: Empleado) => {
  const salarioBase = empleado.salarioBase;
  
  // Cestaticket: 0.5 UTVE por día hábil (mínimo 15 días)
  const cestaticket = UTVE * 0.5 * diasHabiles;
  
  // Bono de alimentación (si aplica)
  const bonoAlimentacion = salarioBase * 0.25; // 25% mínimo
  
  // Horas extras: 50% recargo diurno, 100% nocturno
  const horasExtras = calcularHorasExtras(empleado.horasExtras);
  
  // Deducciones
  const ivss = salarioBase * 0.04;        // 4% empleado
  const faov = salarioBase * 0.01;        // 1% empleado
  const inces = salarioBase * 0.005;      // 0.5% empleado
  const islr = calcularISLR(salarioBase); // Tabla SENIAT
  
  // Prestaciones sociales (Art. 142 LOTTT)
  // 15 días por año los primeros 2 años
  // 45 días por año a partir del 3er año
  const prestaciones = calcularPrestaciones(empleado);
  
  return {
    salarioBase,
    cestaticket,
    bonoAlimentacion,
    horasExtras,
    totalBruto: salarioBase + cestaticket + bonoAlimentacion + horasExtras,
    deducciones: { ivss, faov, inces, islr },
    totalNeto: totalBruto - ivss - faov - inces - islr,
    prestaciones,
  };
};
```

**Endpoints principales:**
```
GET    /rrhh/empleados                # Lista empleados
POST   /rrhh/empleados                # Crear empleado
GET    /rrhh/empleados/:id            # Expediente completo
POST   /rrhh/nomina/calcular          # Calcular nómina del período
GET    /rrhh/nomina/:periodoId        # Ver nómina calculada
POST   /rrhh/nomina/:periodoId/aprobar
GET    /rrhh/nomina/:periodoId/recibos # Recibos de pago
GET    /rrhh/asistencia               # Control de asistencia
POST   /rrhh/vacaciones               # Solicitar vacaciones
GET    /rrhh/prestaciones/:empleadoId # Cálculo prestaciones
```

**Modelos Prisma clave:**
```prisma
model Empleado {
  id              String   @id @default(cuid())
  cedula          String   @unique
  nombre          String
  apellido        String
  email           String   @unique
  telefono        String?
  fechaNacimiento DateTime
  fechaIngreso    DateTime
  cargoId         String
  departamentoId  String
  salarioBase     Decimal
  tipoContrato    String   // DETERMINADO, INDETERMINADO, OBRA
  estado          String   @default("ACTIVO")
  ivss            String?  // Número IVSS
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model PeriodoNomina {
  id          String   @id @default(cuid())
  nombre      String
  fechaInicio DateTime
  fechaFin    DateTime
  estado      String   @default("BORRADOR") // BORRADOR, CALCULADO, APROBADO, PAGADO
  totalBruto  Decimal  @default(0)
  totalNeto   Decimal  @default(0)
  createdAt   DateTime @default(now())
}
```


---

## 9. MÓDULO CONFIGURACIÓN

### Sistema
- Datos de empresa (RIF, razón social, dirección fiscal)
- Parámetros generales (moneda base, zona horaria, idioma)
- Configuración de correo SMTP
- Parámetros fiscales (IVA %, ISLR, UTVE)

### Seguridad
- Logs de auditoría de todas las acciones
- Políticas de contraseñas
- Sesiones activas y revocación
- Alertas de seguridad

### Usuarios
- CRUD de usuarios con asignación de roles
- Activar/desactivar usuarios
- Reseteo de contraseñas
- Historial de accesos

### Tablas del Sistema
- Catálogos: categorías, unidades de medida, departamentos, cargos
- Bancos venezolanos
- Tipos de documentos
- Parámetros configurables

**Endpoints principales:**
```
GET    /configuracion/empresa         # Datos empresa
PUT    /configuracion/empresa         # Actualizar empresa
GET    /configuracion/usuarios        # Lista usuarios
POST   /configuracion/usuarios        # Crear usuario
PUT    /configuracion/usuarios/:id    # Actualizar usuario
DELETE /configuracion/usuarios/:id    # Desactivar usuario
GET    /configuracion/auditoria       # Logs de auditoría
GET    /configuracion/tablas/:tipo    # Obtener catálogo
POST   /configuracion/tablas/:tipo    # Agregar ítem al catálogo
```

---

## 10. MÓDULO REPORTES Y BI

### Dashboard General
- KPIs en tiempo real via WebSockets
- Gráficos con Recharts (líneas, barras, pie, área)
- Filtros por período, módulo, usuario
- Exportación a Excel y PDF

**KPIs por módulo:**
- Ventas: facturación del día/mes, top clientes, productos más vendidos
- Inventario: stock crítico, rotación, valor del inventario
- Compras: órdenes pendientes, gasto del mes
- RRHH: headcount, nómina del mes, ausentismo
- Producción: eficiencia, órdenes completadas, desperdicios

### BI Avanzado
- Análisis OLAP multidimensional
- Tendencias y proyecciones
- Comparativas período vs período
- Reportes ejecutivos automáticos
- Exportación a múltiples formatos

**Endpoints principales:**
```
GET    /reportes/dashboard            # KPIs generales
GET    /reportes/ventas               # Reporte ventas detallado
GET    /reportes/inventario           # Reporte inventario
GET    /reportes/rrhh                 # Reporte RRHH
GET    /reportes/produccion           # Reporte producción
GET    /reportes/exportar/:tipo       # Exportar Excel/PDF
GET    /reportes/bi/tendencias        # Análisis de tendencias
```


---

## 11. INTEGRACIONES IA GRATUITA

### 4 Proveedores Configurados

```typescript
// ─── GOOGLE GEMINI ───────────────────────────────────────────────────────────
// Límite: 60 req/min | Modelo: gemini-1.5-flash (gratuito)
// Uso: análisis de documentos, predicciones, resúmenes ejecutivos
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ─── HUGGING FACE ────────────────────────────────────────────────────────────
// Límite: 30,000 req/mes | Inference API gratuita
// Uso: clasificación de texto, análisis de sentimientos, NLP
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// ─── OLLAMA (LOCAL) ──────────────────────────────────────────────────────────
// Sin límites | Modelos: llama3, mistral, codellama
// Uso: procesamiento local sin enviar datos a la nube
const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });

// ─── GROQ ────────────────────────────────────────────────────────────────────
// Límite: 30 req/min | Modelos: llama3-8b, mixtral-8x7b (ultra rápido)
// Uso: respuestas en tiempo real, chatbot de soporte
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
```

### Casos de Uso por Módulo

| Módulo | Función IA | Proveedor |
|--------|-----------|-----------|
| Inventario | Predicción de demanda | Gemini |
| Compras | Análisis de proveedores | Gemini |
| Ventas | Predicción de ventas | Groq |
| RRHH | Análisis de CV | HuggingFace |
| Reportes | Resúmenes ejecutivos | Gemini |
| POS | Recomendaciones de productos | Groq |
| Mantenimiento | Predicción de fallas | Gemini |
| General | Chatbot de soporte | Groq/Ollama |

### Servicio IA — NestJS

```typescript
@Injectable()
export class IAService {
  private gemini: GoogleGenerativeAI;
  private groq: Groq;
  private hf: HfInference;

  constructor(private config: ConfigService) {
    this.gemini = new GoogleGenerativeAI(config.get('GEMINI_API_KEY'));
    this.groq = new Groq({ apiKey: config.get('GROQ_API_KEY') });
    this.hf = new HfInference(config.get('HUGGINGFACE_API_KEY'));
  }

  async analizarConGemini(prompt: string, contexto?: string): Promise<string> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(contexto ? `${contexto}\n\n${prompt}` : prompt);
    return result.response.text();
  }

  async chatConGroq(messages: ChatMessage[]): Promise<string> {
    const completion = await this.groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 1024,
    });
    return completion.choices[0].message.content;
  }

  async predecirDemanda(productoId: string, historial: number[]): Promise<number[]> {
    const prompt = `Analiza este historial de ventas y predice los próximos 3 meses: ${historial.join(', ')}. Responde solo con 3 números separados por coma.`;
    const respuesta = await this.analizarConGemini(prompt);
    return respuesta.split(',').map(Number);
  }
}
```


---

## 12. AUTOMATIZACIÓN n8n — 10 FLUJOS

### Flujos Configurados

| # | Nombre | Trigger | Descripción |
|---|--------|---------|-------------|
| 1 | Facturación SENIAT | Webhook POST /facturas | Envía factura al portal SENIAT automáticamente |
| 2 | Nómina Automática | Cron: último día del mes | Calcula y genera recibos de nómina |
| 3 | Alerta Stock Crítico | Cron: cada 6 horas | Notifica por email/Telegram cuando stock < mínimo |
| 4 | Conciliación Bancaria | Cron: diario 8am | Descarga movimientos bancarios y concilia |
| 5 | Backup R2 | Cron: diario 2am | Backup de BD a Cloudflare R2 |
| 6 | Sync Tasa BCV | Cron: cada hora | Actualiza tasa BCV desde API oficial |
| 7 | Recordatorio Cobranza | Cron: diario 9am | Envía recordatorios de facturas vencidas |
| 8 | Aprobación Compras | Webhook POST /compras/solicitudes | Notifica aprobadores por email |
| 9 | Reportes Automáticos | Cron: lunes 7am | Genera y envía reporte semanal ejecutivo |
| 10 | Webhook Ventas | Webhook POST /ventas | Sincroniza ventas con sistemas externos |

### Configuración n8n

```bash
# Variables de entorno para n8n en Railway
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<password-seguro>
WEBHOOK_URL=https://n8n.tu-dominio.railway.app
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=<neon-host>
DB_POSTGRESDB_DATABASE=n8n
```

### Flujo Sync BCV (ejemplo estructura JSON n8n)

```json
{
  "name": "Sync Tasa BCV",
  "nodes": [
    {
      "name": "Cron",
      "type": "n8n-nodes-base.cron",
      "parameters": { "triggerTimes": { "item": [{ "hour": "*", "minute": "0" }] } }
    },
    {
      "name": "Obtener Tasa BCV",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://ve.dolarapi.com/v1/dolares/oficial",
        "method": "GET"
      }
    },
    {
      "name": "Actualizar en ERP",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.erpzenith.com/configuracion/tasa-bcv",
        "method": "PUT",
        "body": "={{ { tasa: $json.promedio, fecha: $now } }}"
      }
    }
  ]
}
```


---

## 13. DEPLOY SIN DOCKER — Railway + Vercel + Neon + R2

### Backend en Railway

```bash
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
```

```bash
# Variables de entorno en Railway (backend)
DATABASE_URL=postgresql://user:pass@neon-host/erpzenith?sslmode=require
JWT_SECRET=<secret-256-bits>
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://erpzenith.vercel.app
CLOUDFLARE_R2_ACCOUNT_ID=<account-id>
CLOUDFLARE_R2_ACCESS_KEY=<access-key>
CLOUDFLARE_R2_SECRET_KEY=<secret-key>
CLOUDFLARE_R2_BUCKET=erpzenith-files
GEMINI_API_KEY=<gemini-key>
GROQ_API_KEY=<groq-key>
HUGGINGFACE_API_KEY=<hf-key>
```

### Frontend en Vercel

```bash
# Variables de entorno en Vercel
NEXT_PUBLIC_API_URL=https://erpzenith-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://erpzenith-backend.railway.app
NEXT_PUBLIC_APP_NAME=ERP ZENITH
```

### Base de Datos — Neon PostgreSQL

```bash
# Neon connection string
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/erpzenith?sslmode=require"

# Comandos Prisma
npx prisma migrate deploy    # Aplicar migraciones en producción
npx prisma db seed           # Sembrar datos iniciales
npx prisma generate          # Generar cliente Prisma
```

### Cloudflare R2 — Almacenamiento

```typescript
// Configuración R2 (compatible con AWS S3 SDK)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
  },
});

// Subir archivo
const uploadFile = async (key: string, body: Buffer, contentType: string) => {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return `https://files.erpzenith.com/${key}`;
};
```

### Comandos de Deploy

```bash
# Backend — Railway CLI
railway login
railway link <project-id>
railway up

# Frontend — Vercel CLI
vercel --prod

# Migraciones en producción
railway run npx prisma migrate deploy
```


---

## 14. UI/UX PREMIUM

### Sistema de Diseño

```css
/* Tipografía — League Spartan */
@import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@300;400;500;600;700;800;900&display=swap');

:root {
  --font-primary: 'League Spartan', sans-serif;
  
  /* Colores principales */
  --color-primary: #6366f1;      /* Indigo */
  --color-secondary: #8b5cf6;    /* Violet */
  --color-accent: #06b6d4;       /* Cyan */
  --color-success: #10b981;      /* Emerald */
  --color-warning: #f59e0b;      /* Amber */
  --color-danger: #ef4444;       /* Red */
  
  /* Dark mode base */
  --bg-primary: #0f172a;         /* Slate 900 */
  --bg-secondary: #1e293b;       /* Slate 800 */
  --bg-card: rgba(30, 41, 59, 0.8);
  
  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: blur(20px);
}
```

### Componente Card Glassmorphism

```tsx
// components/ui/GlassCard.tsx
export function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl',
      'shadow-xl shadow-black/20',
      'transition-all duration-300 hover:border-white/20 hover:bg-white/8',
      className
    )}>
      {children}
    </div>
  );
}
```

### Animaciones con Framer Motion

```tsx
// Variantes de animación reutilizables
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

// Uso en componentes
<motion.div variants={staggerContainer} initial="initial" animate="animate">
  {items.map(item => (
    <motion.div key={item.id} variants={fadeInUp}>
      <GlassCard>{item.content}</GlassCard>
    </motion.div>
  ))}
</motion.div>
```

### KPI Card Component

```tsx
// components/dashboard/KPICard.tsx
interface KPICardProps {
  title: string;
  value: string | number;
  change: number;       // % cambio vs período anterior
  icon: LucideIcon;
  color: string;
}

export function KPICard({ title, value, change, icon: Icon, color }: KPICardProps) {
  const isPositive = change >= 0;
  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1" style={{ fontFamily: 'League Spartan' }}>
            {value}
          </p>
          <div className={cn('flex items-center gap-1 mt-2 text-sm', isPositive ? 'text-emerald-400' : 'text-red-400')}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(change)}% vs mes anterior</span>
          </div>
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </GlassCard>
  );
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['League Spartan', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: '#6366f1', dark: '#4f46e5' },
        glass: { DEFAULT: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
      },
      backdropBlur: { xl: '20px' },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```


---

## 15. NORMATIVAS VENEZOLANAS

### IVA (Impuesto al Valor Agregado)

```typescript
// Tasa vigente: 16% (alícuota general)
// Tasa reducida: 8% (alimentos, medicamentos)
// Tasa cero: 0% (exportaciones, productos exentos)

export const calcularIVA = (monto: Decimal, alicuota: number = 16): IVAResult => {
  const baseImponible = monto;
  const iva = baseImponible.mul(alicuota / 100);
  const total = baseImponible.add(iva);
  return { baseImponible, iva, total, alicuota };
};

// Retenciones IVA (agentes de retención SENIAT)
// 75% del IVA para contribuyentes ordinarios
// 100% del IVA para contribuyentes especiales
export const calcularRetencionIVA = (iva: Decimal, esEspecial: boolean): Decimal => {
  return iva.mul(esEspecial ? 1.0 : 0.75);
};
```

### ISLR (Impuesto Sobre la Renta)

```typescript
// Tabla ISLR personas naturales (en UT - Unidades Tributarias)
export const TABLA_ISLR = [
  { desde: 0,    hasta: 1000,  porcentaje: 6,  sustraendo: 0 },
  { desde: 1000, hasta: 1500,  porcentaje: 9,  sustraendo: 30 },
  { desde: 1500, hasta: 2000,  porcentaje: 12, sustraendo: 75 },
  { desde: 2000, hasta: 2500,  porcentaje: 16, sustraendo: 155 },
  { desde: 2500, hasta: 3000,  porcentaje: 20, sustraendo: 255 },
  { desde: 3000, hasta: 4000,  porcentaje: 24, sustraendo: 375 },
  { desde: 4000, hasta: 6000,  porcentaje: 29, sustraendo: 575 },
  { desde: 6000, hasta: Infinity, porcentaje: 34, sustraendo: 875 },
];

export const calcularISLR = (enriquecimientoNeto: Decimal, UT: Decimal): Decimal => {
  const enUT = enriquecimientoNeto.div(UT);
  const tramo = TABLA_ISLR.find(t => enUT.gte(t.desde) && enUT.lt(t.hasta));
  if (!tramo) return new Decimal(0);
  return enUT.mul(tramo.porcentaje / 100).sub(tramo.sustraendo).mul(UT);
};
```

### Contribuciones Parafiscales

```typescript
// IVSS — Instituto Venezolano de los Seguros Sociales
export const IVSS = {
  empleado: 0.04,    // 4% del salario
  patrono: 0.09,     // 9% del salario (mínimo)
  tope: 5,           // Tope: 5 salarios mínimos
};

// FAOV — Fondo de Ahorro Obligatorio para la Vivienda
export const FAOV = {
  empleado: 0.01,    // 1% del salario
  patrono: 0.02,     // 2% del salario
};

// INCES — Instituto Nacional de Capacitación y Educación Socialista
export const INCES = {
  patrono: 0.02,     // 2% de la nómina total
  empleado: 0.005,   // 0.5% de utilidades
};

// Cálculo completo de cargas sociales
export const calcularCargasSociales = (salario: Decimal) => ({
  ivssEmpleado: salario.mul(IVSS.empleado),
  ivssPatrono: salario.mul(IVSS.patrono),
  faovEmpleado: salario.mul(FAOV.empleado),
  faovPatrono: salario.mul(FAOV.patrono),
  incesPatrono: salario.mul(INCES.patrono),
});
```

### Prestaciones Sociales (Art. 142 LOTTT)

```typescript
export const calcularPrestaciones = (empleado: Empleado): Decimal => {
  const años = calcularAñosServicio(empleado.fechaIngreso);
  const salarioIntegral = calcularSalarioIntegral(empleado);
  
  // Garantía: 15 días por año (primeros 2 años)
  // Garantía: 45 días por año (a partir del 3er año)
  // Adicional: 2 días por año adicional (máx 30 días)
  
  let diasGarantia: number;
  if (años <= 2) {
    diasGarantia = años * 15;
  } else {
    diasGarantia = (2 * 15) + ((años - 2) * 45);
  }
  
  const diasAdicionales = Math.min((años - 1) * 2, 30);
  const totalDias = diasGarantia + diasAdicionales;
  
  return salarioIntegral.mul(totalDias).div(30);
};
```

### Multimoneda VES/USD con Tasa BCV

```typescript
// Servicio de tasa BCV
@Injectable()
export class TasaBCVService {
  private tasaActual: Decimal = new Decimal(0);
  private ultimaActualizacion: Date;

  // Actualizado automáticamente por n8n cada hora
  async getTasaActual(): Promise<Decimal> {
    const config = await this.prisma.configuracion.findFirst({
      where: { clave: 'TASA_BCV' },
    });
    return new Decimal(config?.valor || 0);
  }

  convertirAUSD(montoBs: Decimal, tasa: Decimal): Decimal {
    return montoBs.div(tasa);
  }

  convertirABs(montoUSD: Decimal, tasa: Decimal): Decimal {
    return montoUSD.mul(tasa);
  }
}

// Fuente oficial: https://ve.dolarapi.com/v1/dolares/oficial
// Actualización: cada hora via n8n workflow #6
```

### Libros Fiscales SENIAT

```typescript
// Libro de Ventas — Formato SENIAT
interface LibroVentas {
  rif: string;
  razonSocial: string;
  periodo: string;           // MM/YYYY
  facturas: {
    numero: string;
    fecha: string;
    rifCliente: string;
    nombreCliente: string;
    baseImponible: Decimal;
    alicuota: number;
    iva: Decimal;
    total: Decimal;
    tipoOperacion: 'GRAVADA' | 'EXENTA' | 'EXPORTACION';
  }[];
  totales: {
    baseImponible: Decimal;
    iva: Decimal;
    total: Decimal;
  };
}

// Libro de Compras — Formato SENIAT
interface LibroCompras {
  // Estructura similar al libro de ventas
  // con datos del proveedor en lugar del cliente
}
```


---

## 16. VARIABLES DE ENTORNO COMPLETAS

### Backend — `apps/backend/.env`

```env
# ─── BASE DE DATOS ────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/erpzenith?sslmode=require"

# ─── AUTENTICACIÓN ────────────────────────────────────────────────────────────
JWT_SECRET="tu-secret-de-256-bits-aqui"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="tu-refresh-secret-aqui"
JWT_REFRESH_EXPIRES_IN="30d"

# ─── SERVIDOR ─────────────────────────────────────────────────────────────────
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# ─── CLOUDFLARE R2 ────────────────────────────────────────────────────────────
CLOUDFLARE_R2_ACCOUNT_ID="tu-account-id"
CLOUDFLARE_R2_ACCESS_KEY="tu-access-key"
CLOUDFLARE_R2_SECRET_KEY="tu-secret-key"
CLOUDFLARE_R2_BUCKET="erpzenith-files"
CLOUDFLARE_R2_PUBLIC_URL="https://files.erpzenith.com"

# ─── IA GRATUITA ──────────────────────────────────────────────────────────────
GEMINI_API_KEY="AIza..."
GROQ_API_KEY="gsk_..."
HUGGINGFACE_API_KEY="hf_..."
OLLAMA_HOST="http://localhost:11434"

# ─── n8n ──────────────────────────────────────────────────────────────────────
N8N_WEBHOOK_URL="https://n8n.tu-dominio.railway.app"
N8N_API_KEY="tu-n8n-api-key"

# ─── EMAIL (SMTP) ─────────────────────────────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="erp@tuempresa.com"
SMTP_PASS="tu-app-password"
SMTP_FROM="ERP ZENITH <erp@tuempresa.com>"

# ─── SENIAT / BCV ─────────────────────────────────────────────────────────────
BCV_API_URL="https://ve.dolarapi.com/v1/dolares/oficial"
SENIAT_RIF="J-XXXXXXXXX-X"
```

### Frontend — `apps/frontend/.env`

```env
# ─── API ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# ─── APP ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="ERP ZENITH"
NEXT_PUBLIC_APP_VERSION="6.0"
NEXT_PUBLIC_COMPANY_NAME="Tu Empresa C.A."

# ─── FEATURES ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_ENABLE_IA=true
NEXT_PUBLIC_ENABLE_N8N=true
NEXT_PUBLIC_ENABLE_DARK_MODE=true
```


---

## 17. AUTENTICACIÓN JWT + MFA

### Flujo de Autenticación

```
1. POST /auth/login { email, password }
   → Valida credenciales
   → Si MFA habilitado → retorna { requiresMFA: true, tempToken }
   → Si MFA no habilitado → retorna { accessToken, refreshToken, user }

2. POST /auth/mfa/verify { tempToken, code }
   → Valida código TOTP
   → Retorna { accessToken, refreshToken, user }

3. POST /auth/refresh { refreshToken }
   → Renueva accessToken

4. POST /auth/logout
   → Invalida sesión en BD
```

### Modelos Prisma — Auth

```prisma
model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String   @unique
  refreshToken String   @unique
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  @@index([userId])
  @@index([token])
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT
  module     String
  resourceId String?
  oldData    Json?
  newData    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  @@index([userId])
  @@index([module])
  @@index([createdAt])
}
```

### Auth Service — NestJS

```typescript
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    if (user.mfaEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, type: 'mfa-pending' },
        { expiresIn: '5m' }
      );
      return { requiresMFA: true, tempToken };
    }

    return this.generateTokens(user);
  }

  async generateTokens(user: User & { role: Role & { permissions: Permission[] } }) {
    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: user.role.permissions.map(p => `${p.module}:${p.action}`),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
      this.jwtService.signAsync({ sub: user.id, type: 'refresh' }, { expiresIn: '30d' }),
    ]);

    await this.prisma.session.create({
      data: { userId: user.id, token: accessToken, refreshToken, expiresAt: addDays(new Date(), 7) },
    });

    return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role.name } };
  }
}
```


---

## 18. ESTRUCTURA PRISMA SCHEMA — MODELOS BASE

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── CONFIGURACIÓN DEL SISTEMA ────────────────────────────────────────────────
model Configuracion {
  id        String   @id @default(cuid())
  clave     String   @unique
  valor     String
  tipo      String   @default("STRING") // STRING, NUMBER, BOOLEAN, JSON
  modulo    String   @default("sistema")
  updatedAt DateTime @updatedAt
}

// ─── EMPRESA ──────────────────────────────────────────────────────────────────
model Empresa {
  id            String  @id @default(cuid())
  rif           String  @unique
  razonSocial   String
  nombreComercial String?
  direccion     String
  telefono      String?
  email         String?
  logo          String?
  monedaBase    String  @default("VES")
  tasaBCV       Decimal @default(0)
  updatedAt     DateTime @updatedAt
}

// ─── NOTIFICACIONES ───────────────────────────────────────────────────────────
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  titulo    String
  mensaje   String
  tipo      String   @default("INFO") // INFO, WARNING, ERROR, SUCCESS
  leida     Boolean  @default(false)
  modulo    String?
  link      String?
  createdAt DateTime @default(now())
  @@index([userId, leida])
}

// ─── INVENTARIO ───────────────────────────────────────────────────────────────
model Categoria {
  id        String     @id @default(cuid())
  nombre    String     @unique
  descripcion String?
  padre     Categoria? @relation("CategoriaHijos", fields: [padreId], references: [id])
  padreId   String?
  hijos     Categoria[] @relation("CategoriaHijos")
  productos Producto[]
  createdAt DateTime   @default(now())
}

model Almacen {
  id          String   @id @default(cuid())
  codigo      String   @unique
  nombre      String
  direccion   String?
  responsable String?
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
}

// ─── CLIENTES Y PROVEEDORES ───────────────────────────────────────────────────
model Cliente {
  id          String    @id @default(cuid())
  rif         String?   @unique
  cedula      String?   @unique
  nombre      String
  email       String?
  telefono    String?
  direccion   String?
  tipoCliente String    @default("NATURAL") // NATURAL, JURIDICO
  credito     Decimal   @default(0)
  activo      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Proveedor {
  id          String   @id @default(cuid())
  rif         String   @unique
  nombre      String
  email       String?
  telefono    String?
  direccion   String?
  condPago    String   @default("CONTADO")
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── RRHH ─────────────────────────────────────────────────────────────────────
model Departamento {
  id        String     @id @default(cuid())
  nombre    String     @unique
  descripcion String?
  empleados Empleado[]
  createdAt DateTime   @default(now())
}

model Cargo {
  id          String     @id @default(cuid())
  nombre      String     @unique
  descripcion String?
  salarioBase Decimal    @default(0)
  empleados   Empleado[]
  createdAt   DateTime   @default(now())
}
```


---

## 19. PATRONES DE CÓDIGO — CONVENCIONES

### Estructura de un Módulo NestJS (patrón estándar)

```
src/modules/[modulo]/
├── [modulo].module.ts
├── [modulo].controller.ts
├── [modulo].service.ts
├── dto/
│   ├── create-[modulo].dto.ts
│   ├── update-[modulo].dto.ts
│   └── query-[modulo].dto.ts
└── entities/
    └── [modulo].entity.ts
```

### DTO con Validación

```typescript
// dto/create-producto.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({ example: 'PROD-001' })
  @IsString()
  codigo: string;

  @ApiProperty({ example: 'Producto de ejemplo' })
  @IsString()
  nombre: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 'cat-id-123' })
  @IsString()
  categoriaId: string;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsNumber()
  @Min(0)
  stockMinimo: number;

  @ApiProperty({ example: 100, minimum: 0 })
  @IsNumber()
  @Min(0)
  precioVenta: number;
}
```

### Servicio con Paginación

```typescript
// [modulo].service.ts
@Injectable()
export class ProductoService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductoDto) {
    const { page = 1, limit = 20, search, categoriaId, activo } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductoWhereInput = {
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { codigo: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoriaId && { categoriaId }),
      ...(activo !== undefined && { activo }),
    };

    const [data, total] = await Promise.all([
      this.prisma.producto.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.producto.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateProductoDto, userId: string) {
    const producto = await this.prisma.producto.create({ data: dto });
    await this.auditLog(userId, 'CREATE', 'inventario', producto.id, null, producto);
    return producto;
  }

  private async auditLog(userId: string, action: string, module: string, resourceId: string, oldData: any, newData: any) {
    await this.prisma.auditLog.create({
      data: { userId, action, module: module, resourceId, oldData, newData },
    });
  }
}
```

### Hook React Query (Frontend)

```typescript
// hooks/useProductos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useProductos = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['productos', params],
    queryFn: () => api.get('/inventario/productos', { params }).then(r => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCreateProducto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductoDto) => api.post('/inventario/productos', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
};
```

### Zustand Auth Store

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (accessToken, user) => set({ accessToken, user, isAuthenticated: true }),

      logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        if (permission.endsWith(':*')) {
          const mod = permission.split(':')[0];
          return user.permissions?.some(p => p.startsWith(`${mod}:`)) ?? false;
        }
        return user.permissions?.includes(permission) ?? false;
      },
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user, accessToken: state.accessToken }) }
  )
);
```


---

## 20. WEBSOCKETS — TIEMPO REAL

### Gateway NestJS

```typescript
// notifications.gateway.ts
@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private userSockets = new Map<string, string>(); // userId → socketId

  handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) this.userSockets.set(userId, client.id);
  }

  handleDisconnect(client: Socket) {
    this.userSockets.forEach((socketId, userId) => {
      if (socketId === client.id) this.userSockets.delete(userId);
    });
  }

  // Enviar notificación a usuario específico
  notifyUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) this.server.to(socketId).emit(event, data);
  }

  // Broadcast a todos los usuarios de un rol
  notifyRole(roleName: string, event: string, data: any) {
    this.server.to(`role:${roleName}`).emit(event, data);
  }

  // Eventos en tiempo real
  emitStockAlert(productoId: string, stockActual: number) {
    this.server.emit('stock:alert', { productoId, stockActual, timestamp: new Date() });
  }

  emitNuevaVenta(venta: any) {
    this.server.emit('ventas:nueva', venta);
  }

  emitKPIUpdate(modulo: string, kpis: any) {
    this.server.emit(`kpi:${modulo}`, kpis);
  }
}
```

### Cliente WebSocket — Frontend

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    socketRef.current = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token: accessToken, userId: user?.id },
      transports: ['websocket'],
    });

    socketRef.current.on('stock:alert', (data) => {
      // Mostrar notificación toast
      toast.warning(`Stock crítico: ${data.productoId}`);
    });

    socketRef.current.on('ventas:nueva', (venta) => {
      // Actualizar dashboard en tiempo real
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'ventas'] });
    });

    return () => { socketRef.current?.disconnect(); };
  }, [accessToken]);

  return socketRef.current;
};
```

---

## 21. REGLAS CRÍTICAS DE IMPLEMENTACIÓN

### ⚠️ REGLAS OBLIGATORIAS

1. **NUNCA implementar módulos eliminados:** tesorería, activos-fijos, presupuesto, contabilidad, CRM. Si se solicita código de estos módulos, rechazar y redirigir a los módulos activos.

2. **SIEMPRE usar Decimal.js** para cálculos monetarios. Nunca usar `number` nativo para montos en VES/USD.
   ```typescript
   // ✅ CORRECTO
   import { Decimal } from '@prisma/client/runtime/library';
   const total = new Decimal(precio).mul(cantidad);
   
   // ❌ INCORRECTO
   const total = precio * cantidad; // Errores de punto flotante
   ```

3. **SIEMPRE incluir auditoría** en operaciones CREATE, UPDATE, DELETE de datos críticos.

4. **SIEMPRE validar permisos** con `@RequirePermissions()` en cada endpoint del controlador.

5. **NUNCA exponer passwordHash** en respuestas de API. Usar `select` de Prisma para excluirlo.
   ```typescript
   const user = await this.prisma.user.findUnique({
     where: { id },
     select: { id: true, name: true, email: true, role: true }, // Sin passwordHash
   });
   ```

6. **SIEMPRE manejar multimoneda:** toda factura debe tener `totalVES`, `totalUSD` y `tasaBCV` al momento de la transacción.

7. **SIEMPRE usar transacciones Prisma** para operaciones que afecten múltiples tablas:
   ```typescript
   await this.prisma.$transaction(async (tx) => {
     const factura = await tx.factura.create({ data: facturaData });
     await tx.movimientoInventario.createMany({ data: movimientos });
     await tx.cliente.update({ where: { id }, data: { saldoPendiente: { increment: factura.total } } });
   });
   ```

8. **SIEMPRE paginar** resultados de listas. Límite por defecto: 20 registros. Máximo: 100.

9. **SIEMPRE usar variables de entorno** para credenciales. Nunca hardcodear API keys, passwords o secrets.

10. **Deploy SIN Docker:** Railway para backend, Vercel para frontend. No crear Dockerfile ni docker-compose para el ERP principal.

### Estructura de Respuesta API Estándar

```typescript
// Respuesta exitosa
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}

// Respuesta de error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo email es requerido",
    "details": [{ "field": "email", "message": "email must be an email" }]
  }
}
```

### Interceptor de Respuesta Global

```typescript
// common/interceptors/response.interceptor.ts
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data: data?.data ?? data,
        meta: data?.meta,
        timestamp: new Date().toISOString(),
      }))
    );
  }
}
```


---

## 22. COMANDOS DE DESARROLLO

```bash
# ─── INSTALACIÓN ──────────────────────────────────────────────────────────────
npm install                          # Instalar dependencias (raíz del monorepo)

# ─── DESARROLLO ───────────────────────────────────────────────────────────────
npm run dev                          # Levantar frontend + backend con Turbo
# O por separado:
cd apps/backend && npm run start:dev  # Backend en puerto 3001
cd apps/frontend && npm run dev       # Frontend en puerto 3000

# ─── BASE DE DATOS ────────────────────────────────────────────────────────────
cd apps/backend
npx prisma migrate dev --name <nombre>   # Crear migración
npx prisma migrate deploy                # Aplicar en producción
npx prisma db seed                       # Sembrar datos iniciales
npx prisma studio                        # GUI de base de datos
npx prisma generate                      # Regenerar cliente Prisma

# ─── BUILD ────────────────────────────────────────────────────────────────────
npm run build                        # Build completo con Turbo

# ─── DEPLOY ───────────────────────────────────────────────────────────────────
railway up                           # Deploy backend a Railway
vercel --prod                        # Deploy frontend a Vercel
```

---

## 23. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1 — Base del Sistema
- [ ] Configurar monorepo Turborepo
- [ ] Configurar Prisma + Neon PostgreSQL
- [ ] Implementar módulo Auth (JWT + MFA)
- [ ] Implementar RBAC (roles, permisos, guards)
- [ ] Implementar módulo Configuración (empresa, usuarios, tablas)
- [ ] Crear sidebar dinámico por rol en frontend
- [ ] Configurar Cloudflare R2

### Fase 2 — Módulo Operativo
- [ ] Inventario (productos, almacenes, movimientos, kardex)
- [ ] Compras (solicitudes, órdenes, recepciones, proveedores)
- [ ] Producción (BOM, MRP, órdenes de producción)
- [ ] Mantenimiento (activos, órdenes de trabajo, preventivo)
- [ ] Calidad (inspecciones, no conformidades)
- [ ] Flota (vehículos, choferes, combustible)

### Fase 3 — Módulo Comercial
- [ ] Ventas (cotizaciones, facturas, CxC, clientes)
- [ ] POS (sesiones de caja, ventas táctiles)
- [ ] Marketing (campañas, segmentación)

### Fase 4 — RRHH
- [ ] Empleados (expedientes, contratos)
- [ ] Nómina (cálculo LOTTT, recibos, prestaciones)
- [ ] Asistencia (horarios, vacaciones)

### Fase 5 — Integraciones y Reportes
- [ ] Dashboard general con WebSockets
- [ ] BI Avanzado (Recharts, exportación)
- [ ] Integración IA (Gemini, Groq, HuggingFace, Ollama)
- [ ] Flujos n8n (10 automatizaciones)
- [ ] Sync tasa BCV automática

### Fase 6 — Deploy
- [ ] Configurar Railway (backend + n8n)
- [ ] Configurar Vercel (frontend)
- [ ] Migraciones en producción
- [ ] Variables de entorno en producción
- [ ] Dominio personalizado

---

## 24. MÉTRICAS DEL SISTEMA

| Métrica | Valor |
|---------|-------|
| Módulos activos | 18 |
| Módulos eliminados | 5 (tesorería, activos-fijos, presupuesto, contabilidad, CRM) |
| Endpoints estimados | 400+ |
| Modelos Prisma | 80+ |
| Flujos n8n | 10 |
| Proveedores IA | 4 (todos gratuitos) |
| Roles del sistema | 8 |
| Normativas venezolanas | LOTTT, IVA, ISLR, SENIAT, IVSS, FAOV, INCES, BCV |

---

*ERP ZENITH — Sistema ERP Profesional para Venezuela*
*Versión 6.0 | Stack: Next.js 14 + NestJS 10 + Prisma + PostgreSQL + n8n + IA Gratuita*
*Deploy: Railway + Vercel + Neon + Cloudflare R2 (SIN Docker)*
