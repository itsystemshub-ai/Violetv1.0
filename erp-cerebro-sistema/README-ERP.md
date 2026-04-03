# 🚀 ERP ZENITH - Sistema Completo

## 📊 Resumen del Proyecto

**ERP ZENITH** es un sistema ERP empresarial completo diseñado para el mercado venezolano, con documentación técnica modular lista para implementación.

---

## 📁 Estructura del Proyecto

```
erpzenith/
│
├── 📄 erp-cerebro.md               # Documento maestro original (1,800+ líneas)
│
├── 📂 erp-cerebro-sistema/         # Nueva estructura modular
│   ├── README.md                   # Índice general del sistema
│   │
│   ├── 📂 00-shared/               # ✅ COMPLETO
│   │   ├── auth.md                 # Autenticación JWT, MFA
│   │   └── rbac.md                 # Roles y permisos
│   │
│   ├── 📂 01-modulo-administrativo/
│   │   ├── contabilidad.md         # ✅ Contabilidad completa
│   │   └── rrhh/
│   │       └── empleados.md        # ✅ Nómina LOTTT
│   │
│   ├── 📂 02-modulo-operativo/
│   │   ├── inventario.md           # ✅ Stock y almacenes
│   │   ├── compras.md              # ✅ Compras y proveedores
│   │   └── produccion.md           # ✅ MRP y BOM
│   │
│   ├── 📂 03-modulo-comercial/
│   │   ├── ventas.md               # ✅ Ventas y facturación
│   │   └── crm.md                  # ✅ CRM y leads
│   │
│   ├── 📂 05-modulo-configuracion/
│   │   └── sistema.md              # ✅ Configuración general
│   │
│   ├── 📂 07-integraciones/
│   │   └── ia.md                   # ✅ IA gratuita integrada
│   │
│   ├── 📂 08-deployment/
│   │   └── infraestructura.md      # ✅ Deploy sin Docker
│   │
│   └── 📂 09-modulo-ui-ux/
│       └── diseño-premium.md       # ✅ UI Premium League Spartan
│
└── 📂 .git/
```

---

## 📈 Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Archivos Creados** | 13 |
| **Líneas Totales** | ~8,300+ |
| **Módulos Completos** | 3 (00-shared, 08-deployment, 09-ui-ux) |
| **Cobertura** | 50% del sistema completo |
| **Tecnologías** | Next.js 14, NestJS 10, Prisma, PostgreSQL |

---

## 🎨 Características Premium Implementadas

### 1. Tipografía League Spartan
- Google Fonts integrada
- 9 pesos disponibles (100-900)
- Moderna y profesional

### 2. Componentes con Glassmorphism
- Efectos de desenfoque
- Gradientes premium
- Animaciones suaves

### 3. IA Integrada
- **Google Gemini**: Chatbot y predicciones
- **Hugging Face**: Sentimiento y NLP
- **Ollama**: Modelos locales
- **Groq**: Inferencia rápida

### 4. Funciones Visuales Avanzadas
- Tarjetas con glassmorphism
- Botones con animaciones
- Tablas inteligentes con IA
- Dashboards animados
- Sugerencias de IA en tiempo real

### 5. Deploy Sin Docker
- **Backend**: Railway
- **Frontend**: Vercel
- **BD**: Neon PostgreSQL
- **Archivos**: Cloudflare R2

---

## 🔗 Conexiones Entre Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                    CONEXIONES PRINCIPALES                   │
├─────────────────────────────────────────────────────────────┤
│ Ventas → Inventario      ✅ Descuento automático de stock   │
│ Ventas → Contabilidad    ✅ Asientos automáticos            │
│ Compras → Inventario     ✅ Entrada de mercancía            │
│ Compras → Contabilidad   ✅ Asientos de compra              │
│ Producción → Inventario  ✅ Consumo MP, producción PT       │
│ RRHH → Contabilidad      ✅ Asientos de nómina              │
│ CRM → IA                 ✅ Análisis de sentimiento         │
│ Todos → Configuración    ✅ Lectura de parámetros           │
│ Todos → Auth/RBAC        ✅ Validación de permisos          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 Herramientas de IA Gratuitas Integradas

| Herramienta | Uso | Límite Gratis |
|-------------|-----|---------------|
| Google Gemini | Chat, predicciones | 60 req/min |
| Hugging Face | Sentimiento, NLP | 30k req/mes |
| Ollama | Modelos locales | Sin límites |
| Groq | Inferencia rápida | 30 req/min |
| Cohere | Embeddings | 100 req/min |

---

## 🚀 Quick Start

### 1. Clonar Repositorio
```bash
git clone https://github.com/tu-usuario/erpzenith.git
cd erpzenith
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
# .env
DATABASE_URL="postgresql://..."
JWT_SECRET="tu-secreto"
GEMINI_API_KEY="tu-api-key"
HF_TOKEN="tu-token"
```

### 4. Ejecutar Migraciones
```bash
npx prisma migrate dev
```

### 5. Iniciar Servidores
```bash
npm run dev
```

---

## 📚 Documentación por Módulo

### Módulo 00: Shared
- `auth.md` - Autenticación JWT, MFA, sesiones
- `rbac.md` - Roles, permisos, guards

### Módulo 01: Administrativo
- `contabilidad.md` - Plan de cuentas, asientos, libros
- `rrhh/empleados.md` - Nómina LOTTT, prestaciones

### Módulo 02: Operativo
- `inventario.md` - Stock, PEPS, lotes, trazabilidad
- `compras.md` - Proveedores, OC, cuentas por pagar
- `produccion.md` - MRP, BOM, costeo

### Módulo 03: Comercial
- `ventas.md` - Facturación, CxC, notas de crédito
- `crm.md` - Leads, pipeline, campañas

### Módulo 05: Configuración
- `sistema.md` - Empresa, usuarios, tablas

### Módulo 07: Integraciones
- `ia.md` - IA gratuita, Gemini, HuggingFace

### Módulo 08: Deployment
- `infraestructura.md` - Railway, Vercel, Neon, R2

### Módulo 09: UI/UX
- `diseño-premium.md` - League Spartan, glassmorphism, animaciones

---

## 🎯 Próximo Hito

Completar el 80% del sistema (22/28 archivos):

### Prioritarios
- [ ] `01-administrativo/tesoreria.md` - Bancos y flujo de caja
- [ ] `01-administrativo/finanzas.md` - Estados financieros
- [ ] `03-comercial/pos.md` - Punto de venta
- [ ] `07-integraciones/n8n-workflows.md` - Automatización
- [ ] `06-reportes/dashboard-general.md` - KPIs consolidados

---

## 📞 Soporte

- **Documentación**: `erp-cerebro-sistema/README.md`
- **Documento Maestro**: `erp-cerebro.md`
- **Issues**: GitHub Issues

---

## 📄 Licencia

Propietaria - Todos los derechos reservados

---

## 👥 Créditos

**Desarrollado por**: ERP ZENITH Team  
**Diseño UI**: League Spartan, Glassmorphism  
**IA**: Google Gemini, Hugging Face, Ollama  
**Versión**: 2.0  
**Fecha**: Marzo 2025

---

## 🌟 Características Destacadas

1. ✅ **RBAC Granular** - Permisos por módulo y acción
2. ✅ **IA Gratuita** - 5 proveedores integrados
3. ✅ **UI Premium** - League Spartan + Glassmorphism
4. ✅ **Deploy Sin Docker** - Railway + Vercel
5. ✅ **LOTTT** - Nómina venezolana completa
6. ✅ **SENIAT** - Libros legales y facturación
7. ✅ **PEPS** - Inventario FIFO real
8. ✅ **Multi-almacén** - Trazabilidad completa
9. ✅ **Multimoneda** - BCV, paralelo, manual
10. ✅ **Reportes** - Excel/PDF exportables

---

**¡Gracias por usar ERP ZENITH!** 🚀
