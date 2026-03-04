# UI/UX Pro Max - Integración con Violet ERP

## 🎨 Descripción

UI/UX Pro Max es una skill de inteligencia de diseño que proporciona recomendaciones profesionales para construir interfaces de usuario de alta calidad. Ha sido integrada al sistema Violet ERP para mejorar la consistencia y calidad del diseño.

## 📦 Instalación

La skill ya está instalada en `.kiro/steering/ui-ux-pro-max/`

### Verificar Instalación

```bash
# Verificar Python
python --version

# Probar la skill
python .kiro/steering/ui-ux-pro-max/scripts/search.py "test" --design-system
```

## 🚀 Cómo Usar

### 1. Generar Sistema de Diseño (Recomendado)

Siempre comienza generando un sistema de diseño completo:

```bash
python .kiro/steering/ui-ux-pro-max/scripts/search.py "<tipo_producto> <industria> <keywords>" --design-system -p "Nombre Proyecto"
```

**Ejemplo para Violet ERP:**
```bash
python .kiro/steering/ui-ux-pro-max/scripts/search.py "ERP enterprise business management finance inventory" --design-system -p "Violet ERP"
```

### 2. Búsquedas por Dominio

Obtén recomendaciones específicas por dominio:

```bash
# Estilos UI
python .kiro/steering/ui-ux-pro-max/scripts/search.py "glassmorphism dark mode" --domain style

# Paletas de colores
python .kiro/steering/ui-ux-pro-max/scripts/search.py "fintech" --domain color

# Tipografía
python .kiro/steering/ui-ux-pro-max/scripts/search.py "elegant professional" --domain typography

# Tipos de gráficos
python .kiro/steering/ui-ux-pro-max/scripts/search.py "dashboard analytics" --domain chart

# Guías UX
python .kiro/steering/ui-ux-pro-max/scripts/search.py "animation accessibility" --domain ux
```

### 3. Guías por Stack

Obtén mejores prácticas específicas del stack:

```bash
# React (nuestro stack principal)
python .kiro/steering/ui-ux-pro-max/scripts/search.py "performance optimization" --stack react

# Next.js
python .kiro/steering/ui-ux-pro-max/scripts/search.py "SSR routing" --stack nextjs

# HTML + Tailwind (default)
python .kiro/steering/ui-ux-pro-max/scripts/search.py "responsive layout" --stack html-tailwind
```

## 📊 Sistema de Diseño Recomendado para Violet ERP

Basado en el análisis de la skill, estas son las recomendaciones para Violet ERP:

### Patrón de Diseño
**Enterprise Gateway**
- Logo carousel
- Tab switching para industrias
- Mega menu navigation
- Trust signals prominentes
- CTA: Contact Sales (Primary) + Login (Secondary)

### Estilo Visual
**Trust & Authority**
- Certificados/badges visibles
- Credenciales de expertos
- Casos de estudio con métricas
- Reconocimiento de industria
- Security badges

### Paleta de Colores

```css
/* Colores Principales */
--primary: #7C3AED;      /* Purple - Excitement */
--secondary: #A78BFA;    /* Light Purple */
--cta: #F97316;          /* Orange - Action */
--background: #FAF5FF;   /* Warm White */
--text: #4C1D95;         /* Dark Purple */
```

### Tipografía

**Fonts:** Lexend / Source Sans 3

```html
<!-- Google Fonts Import -->
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

```css
/* CSS Variables */
--font-heading: 'Lexend', sans-serif;
--font-body: 'Source Sans 3', sans-serif;
```

**Características:**
- Corporate, trustworthy, accessible
- Ideal para: Enterprise, government, healthcare, finance
- Performance: Excelente
- Accessibility: WCAG AAA

### Efectos Clave
- Badge hover effects
- Metric pulse animations
- Certificate carousel
- Smooth stat reveal

### Anti-Patrones a Evitar
❌ Diseño juguetón (playful design)
❌ Credenciales ocultas
❌ Gradientes AI purple/pink

## ✅ Checklist Pre-Entrega

Antes de entregar cualquier componente UI, verificar:

### Visual Quality
- [ ] No usar emojis como íconos (usar SVG: Heroicons/Lucide)
- [ ] Todos los íconos del mismo set consistente
- [ ] Logos de marca correctos (verificar en Simple Icons)
- [ ] Hover states no causan layout shift
- [ ] Usar colores del tema directamente (bg-primary)

### Interacción
- [ ] Todos los elementos clickeables tienen `cursor-pointer`
- [ ] Hover states con feedback visual claro
- [ ] Transiciones suaves (150-300ms)
- [ ] Focus states visibles para navegación por teclado

### Light/Dark Mode
- [ ] Texto en light mode con contraste suficiente (4.5:1 mínimo)
- [ ] Elementos glass/transparentes visibles en light mode
- [ ] Bordes visibles en ambos modos
- [ ] Probar ambos modos antes de entregar

### Layout
- [ ] Elementos flotantes con spacing apropiado
- [ ] No hay contenido oculto detrás de navbars fijos
- [ ] Responsive en 375px, 768px, 1024px, 1440px
- [ ] Sin scroll horizontal en mobile

### Accesibilidad
- [ ] Todas las imágenes tienen alt text
- [ ] Inputs de formulario tienen labels
- [ ] Color no es el único indicador
- [ ] `prefers-reduced-motion` respetado

## 🎯 Casos de Uso en Violet ERP

### 1. Dashboard Principal

```bash
python .kiro/steering/ui-ux-pro-max/scripts/search.py "enterprise dashboard analytics KPI" --design-system -p "Violet Dashboard"
```

### 2. Módulo de Finanzas

```bash
python .kiro/steering/ui-ux-pro-max/scripts/search.py "fintech accounting ledger" --design-system -p "Finance Module"
```

### 3. Módulo de Inventario

```bash
python .kiro/steering/ui-ux-pro-max/scripts/search.py "inventory management warehouse" --design-system -p "Inventory Module"
```

### 4. Módulo de Ventas

```bash
python .kiro/steering/ui-ux-pro-max/scripts/search.py "sales CRM pipeline" --design-system -p "Sales Module"
```

### 5. Módulo de RRHH

```bash
python .kiro/steering/ui-ux-pro-max/scripts/search.py "HR payroll employee management" --design-system -p "HR Module"
```

## 📚 Recursos Disponibles

La skill incluye:

- **67 Estilos UI** - Glassmorphism, Minimalism, Dark Mode, etc.
- **96 Paletas de Colores** - Por industria y tipo de producto
- **57 Pairings de Fuentes** - Combinaciones curadas con Google Fonts
- **25 Tipos de Gráficos** - Para dashboards y analytics
- **13 Tech Stacks** - React, Next.js, Vue, etc.
- **99 Guías UX** - Best practices y anti-patterns
- **100 Reglas de Razonamiento** - Específicas por industria

## 🔄 Persistir Sistema de Diseño

Para guardar el sistema de diseño y reutilizarlo:

```bash
# Crear MASTER.md con el sistema global
python .kiro/steering/ui-ux-pro-max/scripts/search.py "ERP enterprise" --design-system --persist -p "Violet ERP"

# Crear override específico para una página
python .kiro/steering/ui-ux-pro-max/scripts/search.py "dashboard analytics" --design-system --persist -p "Violet ERP" --page "dashboard"
```

Esto crea:
```
design-system/
├── MASTER.md              # Sistema de diseño global
└── pages/
    └── dashboard.md       # Overrides específicos de página
```

## 💡 Tips para Mejores Resultados

1. **Sé específico con keywords** - "healthcare SaaS dashboard" > "app"
2. **Busca múltiples veces** - Diferentes keywords revelan diferentes insights
3. **Combina dominios** - Style + Typography + Color = Sistema completo
4. **Siempre revisa UX** - Busca "animation", "accessibility" para issues comunes
5. **Usa stack flag** - Obtén mejores prácticas específicas de implementación
6. **Itera** - Si la primera búsqueda no coincide, prueba diferentes keywords

## 🎨 Integración con Componentes Existentes

### Actualizar Componentes UI

Al crear o actualizar componentes, usa la skill para:

1. **Verificar estilos** - Asegurar consistencia con el sistema de diseño
2. **Validar colores** - Usar la paleta recomendada
3. **Revisar tipografía** - Aplicar font pairings correctos
4. **Implementar efectos** - Agregar animaciones apropiadas
5. **Evitar anti-patterns** - Revisar lista de qué NO hacer

### Ejemplo: Actualizar Card Component

```bash
# 1. Buscar recomendaciones de estilo
python .kiro/steering/ui-ux-pro-max/scripts/search.py "card component glassmorphism" --domain style

# 2. Verificar guías UX
python .kiro/steering/ui-ux-pro-max/scripts/search.py "hover animation" --domain ux

# 3. Obtener mejores prácticas de React
python .kiro/steering/ui-ux-pro-max/scripts/search.py "component optimization" --stack react
```

## 🚀 Próximos Pasos

1. **Aplicar sistema de diseño** - Actualizar componentes existentes con las recomendaciones
2. **Crear design tokens** - Definir variables CSS con los colores y tipografía
3. **Documentar patrones** - Crear guía de estilo basada en las recomendaciones
4. **Configurar linter** - Enforcar reglas de UI/UX en el código
5. **Capacitar equipo** - Compartir mejores prácticas con desarrolladores

## 📞 Soporte

Para más información sobre la skill:
- **Documentación:** `.kiro/steering/ui-ux-pro-max/SKILL.md`
- **GitHub:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **Marketplace:** LobeHub Skills Marketplace

---

**Última actualización:** 3 de marzo de 2026  
**Versión:** 2.0+  
**Integrado por:** Kiro AI Assistant
