# 💜 Violet ERP

Sistema Empresarial con Base de Datos Firebird

## Estructura

```
violet-erp/
├── backend/
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── middleware/
│       │   └── server.js
│       └── package.json
├── frontend/
│   └── web/
│       ├── src/
│       └── package.json
├── database/
│   └── firebird/
│       ├── schema.sql
│       └── connection.js
├── .env.example
├── package.json
└── README.md
```

## Requisitos

- Node.js >= 20.0.0
- Firebird 3.0+
- pnpm o npm

## Instalación

```bash
# Instalar dependencias
pnpm install:all

# O por separado
cd backend/api && npm install
cd ../../frontend/web && npm install
```

## Configuración

```bash
# Copiar .env.example
cp .env.example .env

# Editar .env con tus datos de Firebird
FIREBIRD_DATABASE=C:/ruta/a/tu/base.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=tu-password
```

## Desarrollo

```bash
# Iniciar todo (backend + frontend)
pnpm dev

# O por separado
pnpm dev:backend
pnpm dev:frontend
```

## Producción

```bash
# Build
pnpm build

# Iniciar
pnpm start
```

## Base de Datos

El sistema usa Firebird. El esquema está en `database/firebird/schema.sql`.

```bash
# Inicializar (manual en IBExpert/Firebird)
# Ejecutar schema.sql
```

## Credenciales por Defecto

```
Email: admin@violet-erp.com
Password: admin123
```

## Licencia

MIT
