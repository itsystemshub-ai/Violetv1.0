# 🔄 Eliminación de Dependencias Circulares

**Fecha:** 2026-03-13  
**Estado:** En Progreso  
**Objetivo:** Eliminar todas las dependencias circulares del bundle

---

## 📊 Análisis Inicial

### Dependencias Circulares Detectadas (Antes)

Con la configuración original:
1. `vendor-misc ↔ vendor-react` 
2. `vendor-react ↔ vendor-data`
3. `app-sales-inventory ↔ app-core`

**Total:** 3 dependencias circulares

### Dependencias Circulares Detectadas (Intento 1)

Con la configuración de capas:
1. `vendor-libs → vendor-utils → vendor-react-core → vendor-libs`
2. `app-shared-components ↔ app-core`
3. `app-core ↔ app-shared-utils`
4. `app-shared-components → app-core → app-shared-utils → feature-admin → app-shared-components`
5. `app-core → app-shared-utils → feature-admin → app-core`
6. Y 10 más...

**Total:** 15 dependencias circulares ❌ (empeoró)

---

## 🎯 Estrategia de Solución

### Fase 1: Análisis y Documentación ✅
- [x] Identificar dependencias circulares actuales
- [x] Documentar el problema
- [x] Crear plan de acción

### Fase 2: Simplificación de Vendor Chunks
**Objetivo:** Reducir la granularidad de vendor chunks para evitar circulares

**Estrategia:**
- Agrupar todas las librerías de React en un solo chunk
- Agrupar todas las utilidades en un solo chunk
- Mantener chunks grandes independientes (charts, state)

### Fase 3: Simplificación de App Chunks
**Objetivo:** Usar chunks más grandes y menos granulares

**Estrategia:**
- Un solo chunk para shared (utils + components)
- Un solo chunk para core
- Chunks por feature module (sin subdivisiones)

### Fase 4: Verificación y Optimización
**Objetivo:** Confirmar eliminación de circulares y optimizar tamaño

---

## 📝 Notas Técnicas

### Causa Raíz de las Dependencias Circulares

Las dependencias circulares ocurren cuando:
1. **Granularidad excesiva:** Dividir en demasiados chunks pequeños
2. **Imports cruzados:** Módulos que se importan mutuamente
3. **Shared dependencies:** Múltiples chunks dependen de las mismas utilidades

### Solución: Principio de Chunks Grandes

En lugar de muchos chunks pequeños con dependencias cruzadas:
- **Pocos chunks grandes** con dependencias claras
- **Agrupación por dominio** en lugar de por tipo
- **Lazy loading** para optimizar carga inicial

---

## 🚀 Implementación

### Estado Actual
- ❌ 15 dependencias circulares
- ⚠️ Configuración demasiado granular

### Próximo Paso
- Fase 2: Simplificar vendor chunks

