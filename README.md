# 🟣 Violet ERP - Sistema ERP Completo para Venezuela

> **Next Generation Enterprise Resource Planning**  
> Basado en ValeryProfesional + Analis Técnico Completo

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/violet-erp)
[![Firebird](https://img.shields.io/badge/database-Firebird%202.5.2-red.svg)](https://firebirdsql.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)

---

## 📋 Descripción

**Violet ERP** es un sistema empresarial completo diseñado específicamente para el mercado venezolano, con adaptación a la normativa fiscal del SENIAT.

Basado en el análisis técnico completo de **ValeryProfesional 7.1.77**, este sistema migra toda la funcionalidad del ERP original a una arquitectura moderna con:

- **Base de Datos:** Firebird SQL 2.5.2
- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express
- **Desktop:** Electron
- **Arquitectura:** Monorepo con npm workspaces

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  Web App    │ │  Electron   │ │  Mobile     │       │
│  │  (React)    │ │  (Desktop)  │ │  (Future)   │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE NEGOCIO                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Node.js + Express API                          │    │
│  │  • Servicios Fiscales (IVA, IGTF, Retenciones) │    │
│  │  • Reglas de Negocio                           │    │
│  │  • Validaciones                                │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Firebird SQL 2.5.2                             │    │
│  │  • 80+ Tablas                                   │    │
│  │  • 16+ Stored Procedures                        │    │
│  │  • 50+ Triggers (Por implementar)               │    │
│  │  • 50+ Índices                                  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Módulos del ERP

### Módulos Principales (13)

| # | Módulo | Estado | Descripción |
|---|--------|--------|-------------|
| 1 | **Clientes (CXC)** | ✅ | Gestión de clientes y cuentas por cobrar |
| 2 | **Proveedores (CXP)** | ✅ | Gestión de proveedores y cuentas por pagar |
| 3 | **Productos** | ✅ | Catálogo de productos y servicios |
| 4 | **Ventas** | ✅ | Facturación y gestión de ventas |
| 5 | **Compras** | ✅ | Gestión de compras a proveedores |
| 6 | **Inventario** | ✅ | Control de existencias y almacenes |
| 7 | **Banco** | ✅ | Conciliación y movimientos bancarios |
| 8 | **Caja** | ✅ | Ingresos, egresos y cierre de caja |
| 9 | **Nómina** | ✅ | Gestión de empleados y pagos |
| 10 | **Contabilidad** | ✅ | Plan de cuentas y asientos |
| 11 | **Reportes** | ⏳ | Generación de reportes gerenciales |
| 12 | **Usuarios** | ✅ | Gestión de usuarios y permisos |
| 13 | **Configuración** | ✅ | Parámetros del sistema |

### Estado de Implementación

- ✅ **Completado** - 100% funcional
- ⏳ **En Desarrollo** - Requiere trabajo adicional
- ❌ **Pendiente** - No iniciado

---

## 🗄️ Base de Datos Firebird SQL

### Especificaciones

- **Motor:** Firebird 2.5.2
- **Character Set:** UTF8
- **Collation:** UNICODE_CI_AI
- **Page Size:** 16384 bytes
- **Ubicación:** `C:\VIOLET_ERP\VIOLET3.FDB`

### Estadísticas de la Base de Datos

| Componente | Cantidad |
|------------|----------|
| **Tablas** | 80+ |
| **Stored Procedures** | 16 |
| **Vistas** | 3 |
| **Índices** | 50+ |
| **Triggers** | 0 (Por implementar) |
| **UDF Functions** | 0 (Por implementar) |

### Scripts de Base de Datos

Los scripts SQL están ubicados en `packages/database/firebird/`:

```
packages/database/firebird/
├── 01_schema_basicas.sql         # Configuración, Clientes, Proveedores
├── 02_schema_ventas_compras.sql  # Ventas, Compras, Inventario
├── 03_schema_banco_caja_nomina.sql # Banco, Caja, Nómina
├── 04_schema_contabilidad.sql    # Contabilidad, Auditoría
└── 05_stored_procedures.sql      # Procedimientos almacenados
```

### Instalación de la Base de Datos

```bash
# 1. Instalar Firebird 2.5.2
# Descargar de: https://firebirdsql.org/en/firebird-2-5/

# 2. Crear la base de datos
# Usar ISQL o FlameRobin para ejecutar los scripts en orden:

# 3. Ejecutar scripts en orden
isql -user SYSDBA -password masterkey
SQL> INPUT 'packages/database/firebird/01_schema_basicas.sql';
SQL> INPUT 'packages/database/firebird/02_schema_ventas_compras.sql';
SQL> INPUT 'packages/database/firebird/03_schema_banco_caja_nomina.sql';
SQL> INPUT 'packages/database/firebird/04_schema_contabilidad.sql';
SQL> INPUT 'packages/database/firebird/05_stored_procedures.sql';
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Firebird 2.5.2
- Git

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/your-org/violet-erp.git
cd violet-erp

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Configurar base de datos Firebird
# Ver sección de Base de Datos más arriba
```

### Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar web + server
npm run dev:web          # Solo web app
npm run dev:server       # Solo servidor
npm run dev:electron     # App de escritorio

# Build
npm run build            # Construir todo
npm run build:packages   # Construir paquetes compartidos
npm run build:web        # Construir web app
npm run build:electron   # Construir Electron

# Base de Datos
npm run migrate          # Ejecutar migraciones
npm run seed             # Cargar datos iniciales

# Utilidades
npm run lint             # Linting
npm run test             # Tests
npm run typecheck        # Type checking
```

---

## 🧮 Servicios Fiscales Venezolanos

El sistema incluye servicios fiscales completos para Venezuela:

### Cálculo de IVA

```typescript
import { calcularIVA } from '@violet/services/fiscal';

// Calcular IVA al 16%
const result = calcularIVA({ 
  baseImponible: 1000, 
  alicuota: 16 
});
// Result: { baseImponible: 1000, montoIVA: 160, total: 1160 }
```

### Cálculo de IGTF (3% en divisas)

```typescript
import { calcularIGTF } from '@violet/services/fiscal';

// Calcular IGTF
const result = calcularIGTF({ 
  totalOperacion: 1160, 
  esPagoEnDivisas: true 
});
// Result: { montoIGTF: 34.80, total: 1194.80 }
```

### Cálculo de Retenciones

```typescript
import { calcularRetencionIVA, calcularRetencionISLR } from '@violet/services/fiscal';

// Retención de IVA (75% o 100%)
const retEspecial = calcularRetencionIVA(160, { 
  esContribuyenteEspecial: true 
});
// { montoRetenido: 160, porcentaje: 100 }

// Retención de ISLR
const retISLR = calcularRetencionISLR(1000, 'HONORARIOS_PROFESIONALES');
// { montoRetenido: 30, porcentaje: 3 }
```

---

## 📊 Reportes Fiscales (SENIAT)

El sistema genera los siguientes reportes fiscales:

### Libros Fiscales
- ✅ Libro de Ventas
- ✅ Libro de Compras
- ⏳ Resumen de IVA
- ⏳ Retenciones de IVA
- ⏳ Retenciones de ISLR

### Reportes Gerenciales
- ✅ Balance de Comprobación
- ✅ Libro Diario
- ✅ Libro Mayor
- ⏳ Estado de Resultados
- ⏳ Balance General

---

## 📁 Estructura del Monorepo

```
violet-erp/
├── apps/
│   ├── web/                    # React frontend
│   ├── server/                 # Express backend
│   └── electron/               # Desktop app
│
├── packages/
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utility functions
│   ├── config/                 # Configuration
│   ├── database/               # Firebird SQL scripts
│   │   └── firebird/
│   │       ├── 01_schema_basicas.sql
│   │       ├── 02_schema_ventas_compras.sql
│   │       ├── 03_schema_banco_caja_nomina.sql
│   │       ├── 04_schema_contabilidad.sql
│   │       └── 05_stored_procedures.sql
│   └── services/               # Shared services
│       └── fiscal/             # Venezuelan fiscal services
│
├── docs/
│   ├── FIREBIRD_MIGRATION_COMPLETE.md
│   ├── EQUIVALENCIA_VALERYPRO.md
│   └── VERIFICATION_STATUS.md
│
└── README.md
```

---

## 🔧 Configuración

### Variables de Entorno

```env
# Base de Datos
DATABASE_HOST=localhost
DATABASE_PORT=3050
DATABASE_USER=SYSDBA
DATABASE_PASSWORD=masterkey
DATABASE_PATH=C:\VIOLET_ERP\VIOLET3.FDB

# API
VITE_API_URL=http://localhost:3001

# Seguridad
VITE_JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# Fiscal
ALICUOTA_IVA=16
TASA_IGTF=3
PORC_RETENCION_IVA=75
PORC_RETENCION_IVA_ESPECIAL=100
```

---

## 📈 Roadmap

### Q2 2026
- [x] Migrar estructura de base de datos
- [x] Crear stored procedures
- [ ] Implementar triggers (50+)
- [ ] Crear UDF functions

### Q3 2026
- [ ] Conectar aplicaciones a Firebird
- [ ] Implementar 89 reportes
- [ ] Sistema de impresión fiscal
- [ ] Pruebas de integración

### Q4 2026
- [ ] Módulo de producción
- [ ] Módulo de CRM
- [ ] Integración con APIs externas
- [ ] Mobile app

---

## 📝 Documentación Adicional

- [Análisis Técnico Completo](ANALISIS_TECNICO_COMPLETO.md)
- [Migración a Firebird SQL](docs/FIREBIRD_MIGRATION_COMPLETE.md)
- [Equivalencia con ValeryProfesional](docs/EQUIVALENCIA_VALERYPRO.md)
- [Estado de Verificación](docs/VERIFICATION_STATUS.md)

---

## 🤝 Contribución

Este es un proyecto privado. Para acceso o contribuciones, contactar al administrador del sistema.

---

## 📄 Licencia

UNLICENSED - Software propietario

---

## 👥 Equipo

Desarrollado por **Violet ERP Team**

Basado en el análisis técnico de **ValeryProfesional 7.1.77**

---

**Hecho con ❤️ para Venezuela**
