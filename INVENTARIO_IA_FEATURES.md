# 🤖 Funcionalidades de IA en Inventario - Violet ERP

## Descripción General

El módulo de inventario ahora cuenta con un **Asistente de IA** potenciado por **Groq (Llama 3)** que proporciona análisis inteligente, predicciones y optimizaciones en tiempo real.

## 🎯 Funcionalidades Implementadas

### 1. **Análisis General del Inventario**
- Evalúa el estado general del inventario (saludable, crítico, óptimo)
- Identifica productos que requieren atención inmediata
- Proporciona recomendaciones para optimizar el stock
- Detecta oportunidades de mejora en la gestión

**Uso:** Click en "Análisis General" en el panel de IA

### 2. **Detección de Anomalías**
- Identifica productos con patrones inusuales:
  - Stock excesivo (ratio > 10x del mínimo)
  - Productos sin movimiento con alto valor
  - Stock negativo o inconsistencias
- Prioriza anomalías por urgencia
- Sugiere acciones correctivas específicas

**Uso:** Click en "Detectar Anomalías" en el panel de IA

### 3. **Análisis de Tendencias de Ventas**
- Identifica productos estrella (top sellers)
- Detecta tendencias de crecimiento o decrecimiento
- Proporciona recomendaciones de compra para el próximo período
- Identifica productos en declive

**Uso:** Click en "Tendencias de Ventas" en el panel de IA

### 4. **Chat Inteligente con el Inventario**
- Responde preguntas en lenguaje natural sobre el inventario
- Ejemplos de preguntas:
  - "¿Qué productos debo reordenar?"
  - "¿Cuáles son mis productos más rentables?"
  - "¿Qué categorías tienen más stock?"
  - "¿Hay productos con riesgo de obsolescencia?"

**Uso:** Escribe tu pregunta en el campo de texto y presiona Enter o click en el botón

### 5. **Sugerencias de Reorden Automático**
- Calcula cantidad óptima de reorden por producto
- Determina punto de reorden recomendado
- Considera factores como rotación, estacionalidad y costos

**Uso:** Disponible mediante API en `useInventoryAI.suggestReorderQuantity(product)`

### 6. **Optimización de Categorías**
- Analiza la estructura actual de categorías
- Identifica productos mal categorizados
- Sugiere fusión o creación de nuevas categorías
- Propone estructura optimizada

**Uso:** Disponible mediante API en `useInventoryAI.optimizeCategories(products)`

### 7. **Generación de Descripciones Inteligentes**
- Crea descripciones profesionales y técnicas automáticamente
- Basado en códigos (CAUPLAS, TORFLEX, OEM)
- Incluye aplicaciones y compatibilidades

**Uso:** Disponible mediante API en `useInventoryAI.generateProductDescription(productData)`

## 📊 Datos Analizados

La IA tiene acceso a:
- **2,282 productos** del inventario
- Códigos: CAUPLAS, TORFLEX, INDOMAX, OEM
- Historial de ventas (2023, 2024, 2025)
- Rankings de productos
- Tipo de combustible (DIESEL, GASOLINA, GAS)
- Nuevos items (BOLETIN #30, #31, etc.)
- Stock actual y mínimo
- Precios y valores totales
- Categorías y marcas de vehículos

## 🔧 Configuración

### Requisitos
1. **API Key de Groq**: Configurar en Configuración > IA
2. **Proxy corriendo**: El servidor proxy debe estar activo en puerto 3001
3. **Conexión a internet**: Requerida para consultas a la IA

### Iniciar el Sistema Completo
```bash
# Opción 1: Usando el script batch
VIOLET_ERP.bat > Opción 1

# Opción 2: Comando directo
npm run dev:full
```

## 💡 Casos de Uso

### Caso 1: Optimización de Compras
1. Click en "Análisis General"
2. Revisa productos con stock bajo
3. Pregunta: "¿Qué productos debo comprar esta semana?"
4. La IA sugiere cantidades y prioridades

### Caso 2: Detección de Problemas
1. Click en "Detectar Anomalías"
2. Revisa productos con patrones inusuales
3. Toma acciones correctivas sugeridas

### Caso 3: Planificación Estratégica
1. Click en "Tendencias de Ventas"
2. Identifica productos estrella
3. Ajusta estrategia de inventario basada en datos

### Caso 4: Consultas Rápidas
1. Escribe: "¿Cuántos productos DIESEL tengo?"
2. La IA responde con datos precisos del inventario
3. Toma decisiones informadas al instante

## 🎨 Interfaz

El panel de IA se encuentra en:
- **Ubicación**: Dashboard de Inventario (primera pestaña)
- **Posición**: Debajo de los KPIs principales
- **Diseño**: Card con backdrop blur y border primary

### Elementos Visuales
- 🧠 Icono de cerebro para IA
- 📊 Botones de análisis rápido
- 💬 Chat interactivo
- ✨ Respuestas destacadas con formato
- 🔄 Indicador de carga animado

## 🚀 Ventajas

1. **Decisiones Basadas en Datos**: Análisis objetivo del inventario
2. **Ahorro de Tiempo**: Respuestas instantáneas a consultas complejas
3. **Prevención de Problemas**: Detección temprana de anomalías
4. **Optimización Continua**: Sugerencias proactivas de mejora
5. **Accesibilidad**: Interfaz en lenguaje natural, sin necesidad de SQL

## 🔒 Seguridad

- API Keys cifradas con AES-256
- Datos sensibles no se envían a la IA
- Análisis local cuando es posible
- Logs de auditoría de todas las consultas

## 📈 Métricas de Rendimiento

- **Tiempo de respuesta**: 2-5 segundos promedio
- **Precisión**: Alta (basada en Llama 3)
- **Disponibilidad**: 99.9% (dependiente de Groq)
- **Costo**: Gratuito con límites de Groq

## 🛠️ Desarrollo Futuro

### Próximas Funcionalidades
- [ ] Predicción de demanda con ML
- [ ] Alertas automáticas por WhatsApp/Email
- [ ] Integración con proveedores para reorden automático
- [ ] Dashboard de insights históricos
- [ ] Exportación de reportes de IA a PDF

### Mejoras Planificadas
- [ ] Cache de respuestas frecuentes
- [ ] Modo offline con análisis básico
- [ ] Personalización de prompts por usuario
- [ ] Integración con otros módulos (Ventas, Compras)

## 📞 Soporte

Para problemas o sugerencias:
1. Revisa los logs en consola del navegador
2. Verifica que el proxy esté corriendo
3. Confirma que la API Key esté configurada
4. Contacta al equipo de desarrollo

---

**Versión**: 1.0.0  
**Última actualización**: 2 de marzo de 2026  
**Powered by**: Groq (Llama 3) + Violet ERP AI
