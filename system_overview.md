# Violet ERP V1.0 - Especificaciones Técnicas Avanzadas

## � Visión General de la Infraestructura

Violet ERP está construido sobre una arquitectura **Hybrid-Cloud / Offline-First**. Utiliza un stack moderno de React + TypeScript con una capa de persistencia local masiva y un orquestador de microservicios basado en n8n.

---

## 🏗️ Persistencia Avanzada: `localDb` (IndexedDB)

El sistema implementa una base de datos local robusta utilizando **Dexie.js**, diseñada para manejar miles de registros con latencia cero.

### 1. Evolución del Esquema (Versioning)

La base de datos se encuentra actualmente en la **Versión 18**, habiendo evolucionado a través de hitos críticos:

- **V6:** Implementación de **Soft Deletes** (`deleted_at`) y control de versiones de registros.
- **V10-V12:** Introducción de lógica financiera para Venezuela (SENIAT), incluyendo **IGTF**, Moneda Dual y Diferencial Cambiario.
- **V18:** Optimización mediante **Índices Compuestos**. Ejemplo: `[tenant_id+type]` en movimientos de inventario para filtrado instantáneo por empresa y categoría sin escaneo de tabla completa.

### 2. Protocolo de Sincronización Optimista

Cada registro posee metadatos de sincronización:

- `is_dirty`: Flag booleano que indica que el registro local es más reciente que el de la nube.
- `last_sync`: Timestamp de la última comunicación exitosa con el backend.
- `version`: Contador incremental para resolución de conflictos (Last-Writer-Wins).

---

## 📡 Orquestación de Automatización: `AutomationHub`

El `AutomationHub` no es un simple cliente HTTP; es un **Middleware de Resiliencia**.

### 1. Self-Healing & Queue Management

Utiliza una tabla dedicada (`automation_queue`) para garantizar la entrega de datos:

- **Garantía de Entrega:** Los webhooks hacia n8n no fallan si hay pérdida de internet; se retoman automáticamente cada 30 segundos una vez detectada la conexión (`navigator.onLine`).
- **Decoración Contextual:** Antes de enviar un payload, el Hub inyecta metadatos del entorno (versión de app, timezone, tenant_id), permitiendo que los workflows de n8n ejecuten lógica de IA sin re-consultar la base de datos principal.

---

## 📦 Lógica de Negocio e Inteligencia de Módulos

### �️ Motor de Inventario Heurístico

El hook `useInventoryLogic` implementa motores de decisión avanzados:

- **Detección de Marcas por Prefijo:** Clasificación automática basada en patrones (TX = Torflex, MGM = Indomax).
- **Heurística de Vehículos:** Escaneo de cadenas de texto contra un diccionario de 50+ marcas (Chevrolet, Ford, etc.) para auto-categorización de aplicaciones.
- **Procesamiento por Lotes (Batching):** La importación de fotos procesa imágenes en bloques de 20 (Batch Size) para evitar el bloqueo del main thread del navegador.

### 🧮 Cumplimiento Fiscal (VENEZUELA SENIAT)

El sistema está parametrizado para manejar la complejidad fiscal venezolana:

- **IGTF (3%):** Cálculo automático en facturación sobre pagos en divisas.
- **Moneda Dual:** Almacenamiento de precios en USD con conversión dinámica a BS basada en la tasa del día configurada en `useCurrencyStore`.
- **Libro de Ventas:** Generación automática de registros para cumplimiento tributario.

---

## 🎨 Sistema de Diseño "Stitch" & Persistent Layout

### 1. Arquitectura de Layout Persistente

Implementado mediante un wrapper de alto nivel en `AppRouter.tsx`:

- **Shell Reactivity:** El sidebar y el HUD superior son componentes memoizados (`React.memo`) que nunca se desmontan durante la navegación por `Outlet`.
- **Estado de UI Global:** Gestión de visualización (dark mode, estados de colapso) mediante `zustand` para persistencia entre sesiones.

### 2. Optimización de Renderizado

- **Clock Extraction:** El reloj y la fecha del sistema están fuera del ciclo de renderizado principal del layout para evitar que toda la aplicación se actualice cada segundo.
- **Virtualization Ready:** Las tablas de inventario están diseñadas para manejar paginación optimizada (50 ítems por página) con filtrado en memoria de alta velocidad (O(n) reducido mediante `useMemo`).

---

## 🤖 Integración de IA Contextual

Cada módulo cuenta con un `ModuleAIAssistant` que consume:

1. **Contexto de Módulo:** Metadatos específicos de la página actual.
2. **Snapshot de Datos:** Resumen de KPIs (Total productos, stock bajo, saldos pendientes).
3. **Forecasting Engine:** Algoritmos de predicción integrados para sugerencias de compra basadas en el historial de rotación.

---

**Arquitecto de Sistema:** Violet Dev Team
**Documentación de Ingeniería:** V1.0-ADV
**Fecha de corte:** Marzo 2026
