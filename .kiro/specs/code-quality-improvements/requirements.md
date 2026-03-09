# Requirements Document

## Introduction

Este documento define los requisitos para mejorar la calidad del código del proyecto Violet ERP, un sistema ERP SaaS multi-empresa construido con React 18.3.1, TypeScript 5.5.3, Vite 5.4.1, y Supabase.

### Estado Actual del Proyecto

**Arquitectura:**
- 9 páginas principales (Dashboard, Finance, HR, Inventory, Sales, Purchases, Settings, Security, Login)
- 8 componentes principales + 50 componentes UI (shadcn/ui)
- 6 hooks personalizados (useAuth, useTenant, useAI, useSecurity, useSystemConfig, use-toast)
- Sistema multi-tenant con branding dinámico
- Integración con IA (Groq API) para análisis empresarial

**Problemas Identificados:**
- 87 warnings de ESLint distribuidos en múltiples categorías
- Configuración de TypeScript en modo permisivo (strict: false)
- Posibles memory leaks en sistema de listeners globales (useTenant)
- Dependencias faltantes en hooks de React
- Constantes exportadas junto con componentes (Fast Refresh)
- Uso de tipo `any` en ~20 ubicaciones
- Interfaces vacías o redundantes

**Objetivo:**
Eliminar todos los warnings, fortalecer el tipado, prevenir memory leaks, y establecer patrones de código robustos sin comprometer la funcionalidad existente del sistema ERP.

## Glossary

- **Violet_ERP**: Sistema ERP SaaS multi-empresa con 9 módulos principales (Dashboard, Finance, HR, Inventory, Sales, Purchases, Settings, Security, Login)
- **ESLint**: Herramienta de análisis estático configurada con typescript-eslint y react-hooks plugins
- **TypeScript_Compiler**: Compilador TypeScript 5.5.3 actualmente en modo permisivo
- **Code_Quality_System**: Conjunto de herramientas (ESLint + TypeScript + Vitest) que garantizan la calidad del código
- **Tenant_Management_System**: Sistema multi-tenant con listeners globales para sincronización de estado entre componentes (implementado en useTenant.ts)
- **Fast_Refresh**: Característica de Vite + React que permite hot module replacement sin perder estado
- **Memory_Leak**: Situación donde listeners, subscripciones o timers no se limpian correctamente al desmontar componentes
- **Unused_Code**: Variables, imports o funciones declaradas pero nunca utilizadas (detectadas por ESLint)
- **Type_Safety**: Garantía de que las operaciones sobre datos respetan los tipos declarados (actualmente debilitada por configuración permisiva)
- **Hook_Dependencies**: Array de dependencias en useEffect, useCallback y useMemo que debe incluir todas las variables/funciones usadas dentro del hook
- **Groq_API**: Servicio de IA integrado en el hook useAI para análisis empresarial y chat inteligente
- **Zustand**: Librería de state management usada para auth, tenant y system config con persistencia en localStorage

## Requirements

### Requirement 1: Eliminar Código No Utilizado

**User Story:** Como desarrollador, quiero eliminar todo el código no utilizado para reducir el bundle size, mejorar la mantenibilidad y facilitar la navegación del código.

**Contexto:** El análisis de ESLint identifica aproximadamente 40 warnings relacionados con código no utilizado distribuidos en:
- Componentes principales: AIChat.tsx (X, AvatarImage), CommandPalette.tsx (Calendar, CreditCard, Search), Forms.tsx (X, Invoice, USER_ROLES), Layout.tsx (X, Command)
- Páginas: Dashboard.tsx (TrendingUp), Finance.tsx (Wallet, TrendingDown, PieChart, ROUTE_PATHS, FinancialAccount), HR.tsx (Users, Mail, Phone, Briefcase, fadeInUp), Inventory.tsx (AlertTriangle, ROUTE_PATHS, Product, fadeInUp), Login.tsx (error), Purchases.tsx (Truck, activeTab), Sales.tsx (ROUTE_PATHS, Invoice), Settings.tsx (Bell)
- Hooks: useAuth.ts (ROUTE_PATHS), useAI.ts (e), use-toast.ts (actionTypes)
- Componentes UI: badge.tsx, button.tsx, calendar.tsx (_props), chart.tsx (_), command.tsx, form.tsx, navigation-menu.tsx, sidebar.tsx, sonner.tsx, textarea.tsx, toggle.tsx

**NOTA:** SecurityDashboard.tsx fue removido - el módulo de Seguridad ahora está integrado en Settings.

#### Acceptance Criteria

1. THE Code_Quality_System SHALL identify all unused variables, imports, and parameters across the codebase using ESLint rule `@typescript-eslint/no-unused-vars`
2. WHEN all unused code is removed, THE ESLint SHALL report zero warnings related to unused variables or imports
3. FOR ALL intentionally unused parameters (e.g., in callbacks), THE codebase SHALL use underscore prefix convention (e.g., `_event`, `_props`)
4. WHEN the build process completes, THE bundle size SHALL be equal to or smaller than the baseline size
5. FOR ALL removed unused code, THE Violet_ERP SHALL maintain 100% of its existing functionality verified by manual testing of all 9 modules
6. THE codebase SHALL document any parameters that must remain for interface compliance using comments (e.g., `// Required by interface but not used`)

### Requirement 2: Fortalecer Tipado TypeScript

**User Story:** Como desarrollador, quiero eliminar todos los usos de tipo `any` y habilitar strict mode gradualmente, para que el compilador detecte errores de tipo en tiempo de compilación y mejore la seguridad del código.

**Contexto:** El proyecto tiene configuración permisiva en tsconfig.json:
```json
{
  "noImplicitAny": false,
  "strictNullChecks": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```

Aproximadamente 20 usos explícitos de `any` identificados en:
- examples/third-party-integrations/stripe/CheckoutForm.tsx (3 usos)
- src/components/Cards.tsx (1 uso)
- src/components/Forms.tsx (4 usos)
- src/components/Layout.tsx (1 uso)
- src/hooks/useSecurity.ts (1 uso)
- src/lib/react-router-dom-proxy.tsx (5 usos)
- src/pages/Login.tsx (1 uso)
- src/pages/Purchases.tsx (1 uso)
- src/pages/Sales.tsx (1 uso)
- src/pages/Settings.tsx (1 uso)
- vite.config.ts (5 usos en plugin CDN)

**NOTA:** SecurityDashboard.tsx fue removido - el módulo de Seguridad ahora está integrado en Settings.

#### Acceptance Criteria

1. THE TypeScript_Compiler SHALL have strict mode enabled through gradual migration: first `noUnusedLocals` and `noUnusedParameters`, then `strictNullChecks`, then `noImplicitAny`, finally full `strict: true`
2. WHEN TypeScript compilation completes with strict mode enabled, THE TypeScript_Compiler SHALL report zero errors
3. FOR ALL explicit `any` types identified by ESLint, THE codebase SHALL replace them with specific types or proper generic types
4. WHERE third-party libraries lack type definitions, THE codebase SHALL provide custom type declarations in `src/types/vendor.d.ts`
5. FOR ALL API responses and data models, THE codebase SHALL have explicit interface definitions in `src/types/` directory
6. THE codebase SHALL use type guards (e.g., `typeof`, `instanceof`, custom predicates) where runtime type checking is necessary
7. WHERE temporary type suppressions are unavoidable during migration, THE codebase SHALL use `@ts-expect-error` with TODO comments including target resolution date
8. FOR ALL Zustand stores (auth, tenant, system config), THE codebase SHALL have complete type definitions for state and actions

### Requirement 3: Corregir Warnings de Fast Refresh

**User Story:** Como desarrollador, quiero separar las constantes de los componentes React para que Fast Refresh funcione correctamente durante el desarrollo y no pierda el estado de la aplicación.

**Contexto:** Aproximadamente 10 archivos tienen violaciones de Fast Refresh:
- examples/third-party-integrations/stripe/CheckoutForm.tsx (4 exports de constantes)
- src/components/ui/badge.tsx (badgeVariants)
- src/components/ui/button.tsx (buttonVariants)
- src/components/ui/form.tsx (useFormField)
- src/components/ui/navigation-menu.tsx (navigationMenuTriggerStyle)
- src/components/ui/sidebar.tsx (SIDEBAR_COOKIE_NAME, etc.)
- src/components/ui/sonner.tsx (Toaster config)
- src/components/ui/toggle.tsx (toggleVariants)

#### Acceptance Criteria

1. WHEN a file exports both React components and non-component constants, THE Code_Quality_System SHALL identify it as a Fast Refresh violation using ESLint rule `react-refresh/only-export-components`
2. THE codebase SHALL create a new directory structure `src/constants/` for shared constants and `src/constants/ui/` for UI-related constants
3. FOR ALL component files with constant exports, THE constants SHALL be moved to dedicated files (e.g., `badge.tsx` constants → `src/constants/ui/badge.ts`)
4. WHEN ESLint analysis completes, THE ESLint SHALL report zero `react-refresh/only-export-components` warnings
5. FOR ALL separated constants, THE import paths SHALL be updated automatically using find-and-replace or IDE refactoring tools
6. WHEN a component file is modified during development, THE Fast_Refresh SHALL reload the component without losing application state (verified by manual testing)
7. THE codebase SHALL maintain backward compatibility by ensuring all constant exports are still accessible through their new paths

### Requirement 4: Corregir Dependencias de Hooks

**User Story:** Como desarrollador, quiero que todos los hooks tengan las dependencias correctas para prevenir bugs sutiles causados por closures obsoletos y garantizar que los efectos se ejecuten cuando deben.

**Contexto:** Identificados warnings de `react-hooks/exhaustive-deps` en:
- src/hooks/useSecurity.ts (línea 27: `resetTimer` falta en dependencias de useCallback)
- src/lib/react-router-dom-proxy.tsx (línea 97: `props.children` falta en dependencias, línea 148: supresión intencional con eslint-disable)

Riesgo de loops infinitos al agregar dependencias en:
- Hooks que modifican su propio estado basado en props
- Efectos que llaman funciones que a su vez actualizan dependencias
- Callbacks que dependen de estado que cambia frecuentemente

#### Acceptance Criteria

1. WHEN ESLint analyzes hook dependencies, THE ESLint SHALL report zero `react-hooks/exhaustive-deps` warnings (excepto supresiones documentadas)
2. FOR ALL `useEffect` hooks, THE dependency array SHALL include all variables, functions, and props used within the effect body
3. FOR ALL `useCallback` hooks, THE dependency array SHALL include all variables, functions, and props used within the callback
4. FOR ALL `useMemo` hooks, THE dependency array SHALL include all variables, functions, and props used within the memoization
5. WHERE adding a dependency would cause infinite loops, THE codebase SHALL use one of these patterns:
   - Use `useRef` to store values that shouldn't trigger re-renders
   - Split the effect into multiple effects with different dependencies
   - Use functional updates for setState (e.g., `setState(prev => prev + 1)`)
   - Extract stable functions outside the component or wrap them in `useCallback`
6. WHERE dependencies are intentionally omitted for valid reasons, THE codebase SHALL document with `// eslint-disable-next-line react-hooks/exhaustive-deps` and explanatory comment
7. WHEN a component re-renders, THE hooks SHALL have access to current values of their dependencies without stale closures (verified by unit tests)
8. THE codebase SHALL add unit tests for critical hooks (useAuth, useTenant, useSecurity) to verify correct dependency behavior

### Requirement 5: Prevenir Memory Leaks en Tenant Management

**User Story:** Como desarrollador, quiero garantizar que los listeners globales y subscripciones se limpien correctamente para prevenir memory leaks en aplicaciones de larga duración y mejorar la estabilidad del sistema multi-tenant.

**Contexto:** El hook `useTenant` implementa un sistema de listeners globales para sincronizar cambios de tenant entre componentes:
```typescript
// Estado global fuera del hook
let globalActiveTenant: Tenant = NEUTRAL_TENANT;
const listeners: Set<(tenant: Tenant) => void> = new Set();

// En el hook
useEffect(() => {
  const listener = (newTenant: Tenant) => setInternalTenant(newTenant);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}, []);
```

Problemas identificados:
1. No hay verificación de si el componente sigue montado antes de llamar setState
2. Operaciones DOM (localStorage, style.setProperty) sin verificación de montaje
3. No hay cancelación de operaciones async
4. El hook `useSecurity` tiene timers que necesitan cleanup
5. Zustand stores con persistencia podrían tener subscripciones sin cleanup

#### Acceptance Criteria

1. WHEN a component using `useTenant` unmounts, THE Tenant_Management_System SHALL remove all associated event listeners from the global Set
2. WHEN a component using `useTenant` unmounts during an async operation, THE component SHALL NOT attempt to update state (verified by `isMountedRef` pattern)
3. THE `useTenant` hook SHALL implement cleanup logic in all `useEffect` return functions including:
   - Removing listeners from global Set
   - Restoring original DOM values (CSS variables, document.title)
   - Cancelling pending localStorage operations if necessary
4. THE `useSecurity` hook SHALL properly cleanup all event listeners and timers on unmount
5. WHEN the application runs for extended periods (>1 hour), THE memory usage SHALL remain stable without continuous growth (verified by Chrome DevTools Memory Profiler)
6. FOR ALL global event listeners, THE codebase SHALL use `isMountedRef` pattern to prevent setState on unmounted components
7. WHERE Zustand stores are used with subscriptions, THE subscriptions SHALL be properly unsubscribed on component unmount
8. THE codebase SHALL add unit tests to verify listener cleanup using `@testing-library/react` renderHook and unmount
9. THE codebase SHALL document the listener pattern in code comments explaining the cleanup strategy

### Requirement 6: Eliminar Interfaces Vacías y Redundantes

**User Story:** Como desarrollador, quiero eliminar interfaces vacías o equivalentes a sus supertipos para que el código sea más limpio, el tipado más preciso y se reduzca la complejidad innecesaria.

**Contexto:** Identificadas aproximadamente 7 interfaces problemáticas:
- src/components/ui/command.tsx (línea 24: interface vacía)
- src/components/ui/textarea.tsx (línea 5: interface vacía que extiende HTMLTextareaElement)
- Posibles interfaces redundantes en otros componentes UI que solo extienden tipos de React sin agregar propiedades

#### Acceptance Criteria

1. WHEN ESLint analyzes type definitions, THE ESLint SHALL report zero `@typescript-eslint/no-empty-object-type` warnings
2. FOR ALL empty interfaces without properties, THE codebase SHALL either:
   - Add meaningful properties if the interface serves a purpose
   - Remove the interface and use the parent type directly
   - Convert to a type alias if it's meant as a semantic marker
3. WHERE an interface extends a single type without adding properties, THE codebase SHALL use the parent type directly unless there's a documented reason for the wrapper
4. WHERE an interface is used as a marker type for semantic purposes, THE codebase SHALL document the reason with a comment explaining why the empty interface exists
5. FOR ALL component prop interfaces, THE codebase SHALL ensure they add value beyond just extending React types
6. WHEN TypeScript compilation completes, THE type system SHALL provide meaningful type checking without redundant definitions
7. THE codebase SHALL prefer type aliases over interfaces for simple type compositions (e.g., `type Props = HTMLAttributes<HTMLDivElement> & { variant: string }`)
8. WHERE interfaces are removed, THE codebase SHALL verify that all usages are updated and no type errors are introduced

### Requirement 7: Documentar Patrones de Seguridad

**User Story:** Como desarrollador, quiero que las credenciales de desarrollo y patrones de seguridad estén claramente documentados para que los nuevos desarrolladores entiendan el modelo de seguridad y no cometan errores en producción.

**Contexto:** El proyecto tiene:
- Credenciales hardcodeadas en `useAuth.ts` para super admin (username: 'superadmin', password: 'Violet@2026!')
- Archivo `CREDENTIALS.md` existente que necesita actualización
- Integración con Supabase que requiere configuración de variables de entorno
- Sistema de autenticación mock para desarrollo
- Hook `useSecurity` que implementa timeout de inactividad (15 minutos)

#### Acceptance Criteria

1. THE codebase SHALL maintain an updated `CREDENTIALS.md` file documenting:
   - All development credentials with clear warnings that they are for development only
   - Super admin credentials (username: 'superadmin', password: 'Violet@2026!')
   - Mock user credentials for testing
   - Supabase development credentials
2. THE `useAuth.ts` file SHALL include prominent comments explaining:
   - That hardcoded credentials are ONLY for development
   - How production authentication works (Supabase Auth + JWT)
   - Reference to CREDENTIALS.md for more information
3. THE documentation SHALL provide step-by-step instructions for configuring production authentication including:
   - Required environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
   - How to configure secrets in deployment platforms (Vercel, Netlify, Railway)
   - Row Level Security (RLS) configuration in Supabase
4. WHERE environment variables are used, THE `.env.development` file SHALL include example values with comments
5. THE documentation SHALL include explicit warnings against:
   - Committing production credentials to version control
   - Using development credentials in production
   - Sharing API keys in public repositories
6. WHERE Supabase credentials are used, THE documentation SHALL explain:
   - The difference between anon key and service role key
   - When to use each type of key
   - How RLS protects data even with exposed anon keys
7. THE `useSecurity` hook SHALL be documented explaining:
   - Inactivity timeout mechanism (15 minutes)
   - Events monitored for activity detection
   - How to configure timeout duration
8. THE codebase SHALL include a security checklist in README.md for production deployment

### Requirement 8: Configurar Análisis Estático Progresivo

**User Story:** Como desarrollador, quiero habilitar las reglas de TypeScript de forma gradual, para que pueda corregir errores sin bloquear el desarrollo.

#### Acceptance Criteria

1. THE Code_Quality_System SHALL provide a migration plan for enabling strict TypeScript rules in 4 phases
2. WHERE strict rules are enabled, THE codebase SHALL compile without errors before proceeding to next phase
3. THE migration plan SHALL prioritize high-impact files (hooks, API clients, state management) for early strict mode adoption
4. WHEN a strict rule is enabled, THE documentation SHALL record the date and rationale in a migration log
5. THE Code_Quality_System SHALL allow temporary `@ts-expect-error` comments with explanatory notes and target resolution dates
6. WHERE `@ts-expect-error` is used, THE comment SHALL include a TODO with a target resolution date (e.g., `// TODO(2024-12-31): Add proper type`)
7. THE codebase SHALL track progress of strict mode migration with metrics (number of files compliant, number of suppressions remaining)
8. WHEN all phases are complete, THE tsconfig.json SHALL have `strict: true` enabled with zero compilation errors

### Requirement 9: Optimizar Imports y Exports

**User Story:** Como desarrollador, quiero que los imports sean consistentes y optimizados, para que el tree-shaking funcione correctamente y el bundle sea más pequeño.

#### Acceptance Criteria

1. FOR ALL imports, THE codebase SHALL use named imports instead of namespace imports where possible (e.g., `import { useState }` not `import * as React`)
2. WHERE barrel exports (`index.ts`) are used, THE exports SHALL be explicit and not re-export everything with wildcards
3. THE codebase SHALL avoid circular dependencies between modules (verified by build process)
4. WHEN Vite builds the application, THE build process SHALL successfully tree-shake unused exports (verified by bundle analysis)
5. FOR ALL component imports, THE codebase SHALL use consistent import ordering: React imports, third-party imports, local imports, type imports
6. WHERE dynamic imports are beneficial for code splitting, THE codebase SHALL use lazy loading for route components
7. THE codebase SHALL use ESLint rule `no-restricted-imports` to enforce import patterns and prevent problematic imports
8. WHEN bundle is analyzed with vite-bundle-visualizer, THE unused code SHALL be minimal (<5% of total bundle)

### Requirement 10: Establecer Baseline de Calidad

**User Story:** Como desarrollador, quiero establecer métricas de calidad de código, para que pueda medir el progreso y prevenir regresiones.

#### Acceptance Criteria

1. THE Code_Quality_System SHALL report zero ESLint warnings after all improvements are applied
2. THE Code_Quality_System SHALL report zero TypeScript errors after all improvements are applied
3. THE codebase SHALL maintain a quality metrics document (`quality-metrics.json`) tracking warning counts over time
4. WHEN new code is added, THE ESLint pre-commit hook SHALL prevent commits with new warnings or errors
5. THE CI/CD pipeline SHALL fail builds that introduce TypeScript errors or ESLint warnings
6. WHERE quality metrics are tracked, THE documentation SHALL include graphs or reports showing improvement trends
7. THE codebase SHALL establish baseline metrics before starting improvements: ESLint warnings (87), TypeScript errors (0 with permissive config), bundle size (~1.25 MB)
8. WHEN all improvements are complete, THE final metrics SHALL show: ESLint warnings (0), TypeScript errors (0 with strict mode), bundle size (≤1.20 MB)

## Implementation Notes

### Priority Order

Las mejoras deben implementarse en el siguiente orden para minimizar conflictos y riesgos:

1. **Eliminar código no utilizado** (Semana 1)
   - Riesgo: Bajo
   - Impacto: Alto en claridad del código
   - Archivos afectados: ~30 archivos con imports/variables no usados
   - Beneficio: Reduce bundle size, mejora navegación del código

2. **Separar constantes de componentes** (Semana 2)
   - Riesgo: Bajo
   - Impacto: Alto en Developer Experience
   - Archivos afectados: ~10 archivos UI + CheckoutForm.tsx
   - Beneficio: Fast Refresh funcional, mejor organización

3. **Corregir dependencias de hooks** (Semana 3)
   - Riesgo: Medio (posibles loops infinitos)
   - Impacto: Alto en prevención de bugs
   - Archivos afectados: useSecurity.ts, react-router-dom-proxy.tsx
   - Beneficio: Previene bugs sutiles de closures obsoletos

4. **Prevenir memory leaks** (Semana 4)
   - Riesgo: Medio
   - Impacto: Crítico para producción
   - Archivos afectados: useTenant.ts, useSecurity.ts
   - Beneficio: Estabilidad en aplicaciones de larga duración

5. **Eliminar interfaces vacías** (Semana 4)
   - Riesgo: Bajo
   - Impacto: Medio en limpieza de código
   - Archivos afectados: command.tsx, textarea.tsx
   - Beneficio: Código más limpio y directo

6. **Fortalecer tipado TypeScript** (Semanas 5-6)
   - Riesgo: Alto (muchos cambios, posibles errores)
   - Impacto: Muy alto en seguridad de tipos
   - Archivos afectados: Todos los archivos .ts/.tsx
   - Beneficio: Detección de errores en compile-time
   - Fases:
     - Fase 1: noUnusedLocals, noUnusedParameters
     - Fase 2: strictNullChecks
     - Fase 3: noImplicitAny
     - Fase 4: strict: true completo

7. **Documentar seguridad** (Semana 6)
   - Riesgo: Ninguno
   - Impacto: Alto en onboarding
   - Archivos afectados: CREDENTIALS.md, README.md, useAuth.ts
   - Beneficio: Mejor comprensión del modelo de seguridad

8. **Optimizar imports** (Semana 6)
   - Riesgo: Bajo
   - Impacto: Medio en performance
   - Archivos afectados: Todos los archivos con imports
   - Beneficio: Mejor tree-shaking, bundle más pequeño

9. **Establecer baseline** (Semana 6)
   - Riesgo: Ninguno
   - Impacto: Alto en proceso
   - Archivos afectados: CI/CD, pre-commit hooks
   - Beneficio: Previene regresiones futuras

### Testing Strategy

**Por Cada Fase:**
1. Ejecutar suite de tests existente (si existe)
2. Verificar que la aplicación funcione correctamente en desarrollo
3. Realizar build de producción y verificar que no haya errores
4. Probar funcionalidad de multi-tenant manualmente:
   - Login como super admin
   - Cambio de tenant activo
   - Branding dinámico (colores, logo)
   - Navegación entre módulos
5. Monitorear uso de memoria en navegador con Chrome DevTools (para fases 4-5)
6. Verificar Fast Refresh funciona correctamente (para fase 2)

**Tests Específicos por Módulo:**
- Dashboard: Verificar métricas y gráficos se renderizan
- Finance: Verificar cálculos de totales y balance
- HR: Verificar listado de empleados y cálculo de nómina
- Inventory: Verificar alertas de stock bajo
- Sales/Purchases: Verificar creación de facturas
- Settings: Verificar cambio de configuración
- Security: Verificar logs de auditoría
- Login: Verificar autenticación con credenciales de desarrollo

### Rollback Plan

**Estrategia de Commits:**
- Cada requisito debe implementarse en una rama separada
- Commits atómicos por tipo de cambio (ej: "Remove unused imports from components")
- Merge a main solo después de validación completa
- Tags de versión para cada fase completada

**Si un cambio causa problemas:**
1. Identificar el commit específico que causó el problema
2. Revertir el commit: `git revert <commit-hash>`
3. Analizar el problema en una rama separada
4. Aplicar fix y re-testear antes de merge
5. Documentar el problema y la solución en CHANGELOG.md

**Backup de Configuración:**
- Mantener copias de tsconfig.json, eslint.config.js antes de cada cambio
- Documentar cada cambio de configuración con fecha y razón
- Mantener historial de métricas de calidad para comparación

### Métricas de Éxito

**Baseline Actual (Estimado):**
- ESLint warnings: 87
- ESLint errors: 0
- TypeScript errors: 0 (con strict: false)
- Bundle size: ~1.25 MB
- Gzipped: ~425 KB

**Objetivo Final:**
- ESLint warnings: 0
- ESLint errors: 0
- TypeScript errors: 0 (con strict: true)
- Bundle size: ≤1.20 MB (reducción de ~4%)
- Gzipped: ≤400 KB (reducción de ~6%)
- Test coverage: ≥70% para hooks críticos
- Memory leaks: 0 detectados en pruebas de 1 hora

### Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Loops infinitos al corregir hooks | Media | Alto | Tests exhaustivos, useRef para valores estables, revisión de código |
| Errores de tipo al habilitar strict | Alta | Alto | Migración gradual, @ts-expect-error temporal con TODOs |
| Romper Fast Refresh al separar constantes | Baja | Medio | Verificación manual después de cada cambio |
| Memory leaks no detectados | Media | Alto | Tests con Chrome DevTools, pruebas de larga duración |
| Aumento de bundle size | Baja | Medio | Monitoreo continuo, análisis con vite-bundle-visualizer |
| Breaking changes en dependencias | Baja | Alto | Lock versions en package.json, test antes de actualizar |
| Tiempo de migración excede estimado | Media | Medio | Priorización clara, posibilidad de posponer fases no críticas |
