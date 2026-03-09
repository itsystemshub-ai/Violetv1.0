# Violet ERP v1.0

Sistema de gestión empresarial (ERP) diseñado para pequeñas y medianas empresas, con módulos integrados de Ventas, Inventario, Finanzas, Compras, CRM y RRHH. Disponible como aplicación de escritorio (Electron) y web.

---

## 🚀 Características

- **Dashboard** — KPIs en tiempo real, clima y tipo de cambio BCV
- **Ventas** — POS, facturas, pedidos y reportes
- **Inventario** — Gestión de productos, stock y movimientos
- **Finanzas** — Cuentas por cobrar/pagar, flujo de caja
- **Compras** — Órdenes de compra y proveedores
- **CRM** — Gestión de clientes y seguimiento
- **RRHH** — Empleados, nómina y asistencia
- **Configuración** — Empresa, impuestos, roles y permisos
- **IA Self-Healing** — Diagnóstico y reparación automática del sistema

---

## 🛠 Tecnologías

| Frontend              | Backend                 | Desktop          |
| --------------------- | ----------------------- | ---------------- |
| React 18 + TypeScript | Express 5 + Node.js     | Electron         |
| Vite 6                | SQLite (better-sqlite3) | electron-builder |
| Tailwind CSS v4       | Socket.IO               |                  |
| Zustand + React Query | JWT Auth                |                  |
| shadcn/ui + Radix UI  | Bcrypt                  |                  |

---

## ⚙️ Instalación

### Requisitos

- Node.js 20+ (ver `.nvmrc`)
- npm 10+

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/itsystemshub-ai/Violetv1.0.git
cd Violetv1.0

# 2. Instalar dependencias del frontend
npm install

# 3. Instalar dependencias del servidor
cd server && npm install && cd ..

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys reales
```

---

## 🔑 Variables de Entorno

Copia `.env.example` como `.env` y completa los valores:

| Variable                | Descripción                              | Requerida |
| ----------------------- | ---------------------------------------- | --------- |
| `VITE_GROQ_API_KEY`     | Groq AI (Self-Healing primario)          | ✅        |
| `VITE_GEMINI_API_KEY`   | Gemini 2.0 Flash (Self-Healing fallback) | ✅        |
| `VITE_RESEND_API_KEY`   | Email transaccional (Resend)             | Opcional  |
| `VITE_CALLMEBOT_APIKEY` | Notificaciones WhatsApp                  | Opcional  |

> ⚠️ **NUNCA** subas el archivo `.env` real a GitHub.

---

## 🖥 Scripts Disponibles

```bash
# Desarrollo (web + proxy)
npm run dev

# Desarrollo con Electron
npm run electron:dev

# Compilar para producción (web)
npm run build

# Compilar instalador Windows (.exe)
npm run electron:dist

# Ejecutar tests
npm test

# Verificar tipos TypeScript
npm run typecheck

# Linting
npm run lint
```

---

## 📁 Estructura del Proyecto

```
Violetv1.0/
├── src/              # Código fuente frontend (React)
│   ├── modules/      # Módulos del ERP
│   ├── components/   # Componentes reutilizables
│   ├── hooks/        # Custom hooks
│   └── stores/       # Estado global (Zustand)
├── backend/          # API REST Express
├── electron/         # Configuración Electron
├── server/           # Servidor proxy local
├── scripts/          # Scripts de build y migración
└── .env.example      # Plantilla de variables de entorno
```

---

## 📄 Licencia

Privado — Copyright © 2026 Violet ERP / IT Systems Hub AI
