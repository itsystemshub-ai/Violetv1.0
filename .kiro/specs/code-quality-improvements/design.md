# Diseño Técnico: Mejoras de Calidad del Código - Violet ERP

## Overview

Este documento define el diseño técnico para implementar mejoras sistemáticas de calidad del código en Violet ERP, un sistema ERP SaaS multi-empresa construido con React 18.3.1, TypeScript 5.5.3, Vite 5.4.1, y Supabase.

### Objetivos del Diseño

1. Eliminar los 87 warnings de ESLint existentes
2. Habilitar TypeScript strict mode de forma gradual y segura
3. Prevenir memory leaks en el sistema de gestión de tenants
4. Establecer patrones de código robustos y mantenibles
5. Optimizar el bundle size mediante tree-shaking efectivo
6. Crear un baseline de calidad medible y sostenible

### Alcance

El diseño cubre:
- Refactorización de código existente sin cambios funcionales
- Mejoras en configuración de herramientas (TypeScript, ESLint)
- Patrones de cleanup en hooks de React
- Optimización de imports y exports
- Documentación de seguridad y credenciales de desarrollo

### Restricciones

- No se modificará la funcionalidad existente
- Todos los cambios deben ser backward-compatible
- La aplicación debe funcionar correctamente después de cada cambio
- El proceso debe ser reversible mediante commits individuales

## Architecture

### Arquitectura Actual

```
violet-erp/
├── src/
│   ├── api/              # Clientes API (demo.ts)
│   ├── assets/           # Imágenes y recursos estáticos
│   ├── components/       # 8 componentes principales + 50 UI components
│   │   ├── AIChat.tsx
│   │   ├── Cards.tsx
│   │   ├── Charts.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── Forms.tsx
│   │   ├── Layout.tsx
│   │   ├── TenantBranding.tsx
│   │   ├── TenantSelector.tsx
│   │   └── ui/          # 50 shadcn/ui components
│   ├── data/            # Mock data (mockTenants, mockEmployees, etc.)
│   ├── hooks/           # 6 custom hooks
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   ├── useAI.ts
│   │   ├── useSecurity.ts
│   │   ├── useSystemConfig.ts
│   │   └── use-toast.ts
│   ├── lib/             # Utilities
│   │   ├── index.ts     # Types, constants, formatters
│   │   ├── motion.ts    # Framer Motion presets
│   │   ├── react-router-dom-proxy.tsx
│   │   └── utils.ts
│   ├── pages/           # 9 main pages
│   │   ├── Dashboard.tsx
│   │   ├── Finance.tsx
│   │   ├── HR.tsx
│   │   ├── Inventory.tsx
│   │   ├── Login.tsx
│   │   ├── Purchases.tsx
│   │   ├── Sales.tsx
│   │   └── Settings.tsx (incluye módulo de Seguridad)
│   └── App.tsx
├── tsconfig.json        # Root config (permissive)
├── tsconfig.app.json    # App config (strict: true)
├── tsconfig.node.json   # Node config (strict: true)
├── eslint.config.js     # ESLint config (warnings)
└── vite.config.ts       # Vite + custom CDN plugin
```

### Configuración Actual vs Objetivo

**TypeScript Configuration:**

Actual (tsconfig.json - root):
```json
{
  "noImplicitAny": false,
  "noUnusedParameters": false,
  "skipLibCheck": true,
  "allowJs": true,
  "noUnusedLocals": false,
  "strictNullChecks": false
}
```

Actual (tsconfig.app.json - aplicación):
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "strictNullChecks": true
}
```

**Observación Crítica:** Existe una discrepancia entre tsconfig.json (permisivo) y tsconfig.app.json (strict). El root config sobrescribe las configuraciones del app config, resultando en modo permisivo efectivo.

**Objetivo:** Alinear tsconfig.json con tsconfig.app.json para habilitar strict mode en todo el proyecto.

**ESLint Configuration:**

Actual:
```javascript
rules: {
  "@typescript-eslint/no-unused-vars": "warn",
  "@typescript-eslint/no-empty-object-type": "warn",
  "@typescript-eslint/no-explicit-any": "warn",
  "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
}
```

Objetivo:
```javascript
rules: {
  "@typescript-eslint/no-unused-vars": ["error", {
    "argsIgnorePattern": "^_",
    "varsIgnorePattern": "^_"
  }],
  "@typescript-eslint/no-empty-object-type": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "react-refresh/only-export-components": "error",
  "react-hooks/exhaustive-deps": "error"
}
```

### Problemas Identificados por Categoría

**1. Código No Utilizado (~40 warnings)**
- Imports: X, AvatarImage, Calendar, CreditCard, Search, Command, TrendingUp, Wallet, etc.
- Variables: activeTab, error, formatDate, fadeInUp, actionTypes
- Parámetros: _props (calendar.tsx, textarea.tsx), _ (chart.tsx), e (useAI.ts)

**2. Uso de `any` (~20 ubicaciones)**
- Stripe CheckoutForm: 3 usos en event handlers
- Forms.tsx: 4 usos en form handlers
- react-router-dom-proxy.tsx: 5 usos en routing logic
- vite.config.ts: 5 usos en CDN plugin
- Páginas individuales: 1 uso cada una

**3. Fast Refresh Violations (~10 archivos)**
- UI Components: badge.tsx, button.tsx, form.tsx, navigation-menu.tsx, sidebar.tsx, sonner.tsx, toggle.tsx
- Examples: CheckoutForm.tsx (4 constantes exportadas)

**4. Hook Dependencies (~2 ubicaciones críticas)**
- useSecurity.ts línea 27: `handleInactivity` falta en dependencias de `resetTimer`
- react-router-dom-proxy.tsx línea 97: `props.children` falta en dependencias

**5. Memory Leaks Potenciales**
- useTenant.ts: Listeners globales sin verificación de montaje
- useSecurity.ts: Timers sin cleanup garantizado
- use-toast.ts: Listeners sin verificación de montaje

**6. Interfaces Vacías (~7 ubicaciones)**
- command.tsx línea 24
- textarea.tsx línea 5

## Components and Interfaces

### Sistema de Gestión de Tenants (useTenant)

**Implementación Actual:**

```typescript
// Estado global fuera del hook
let globalActiveTenant: Tenant = NEUTRAL_TENANT;
const listeners: Set<(tenant: Tenant) => void> = new Set();

const broadcast = (tenant: Tenant) => {
  globalActiveTenant = tenant;
  listeners.forEach((listener) => listener(tenant));
};

export const useTenant = () => {
  const [tenant, setInternalTenant] = useState<Tenant>(globalActiveTenant);
  const { activeTenantId } = useSystemConfig();

  // ⚠️ Problema 1: No hay verificación de montaje
  useEffect(() => {
    const listener = (newTenant: Tenant) => setInternalTenant(newTenant);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // ⚠️ Problema 2: Operaciones DOM sin verificación
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('violet_tenant_active', JSON.stringify(tenant));
    
    const root = document.documentElement;
    if (tenant.primaryColor) {
      root.style.setProperty('--primary', tenant.primaryColor);
      root.style.setProperty('--ring', tenant.primaryColor);
      document.title = tenant.id === 'none'
        ? 'Violet ERP'
        : `${tenant.name} | Violet ERP`;
    }
  }, [tenant]);

  const switchTenant = useCallback((tenantId: string) => {
    // Lógica de cambio
  }, []);

  return { tenant, switchTenant, /* ... */ };
};
```

**Problemas Identificados:**
1. No hay `isMountedRef` para prevenir setState en componentes desmontados
2. Operaciones DOM (localStorage, style.setProperty) sin verificación de montaje
3. No hay cleanup de valores DOM originales
4. Broadcast puede llamar listeners de componentes desmontados

**Solución Propuesta:**

```typescript
export const useTenant = () => {
  const [tenant, setInternalTenant] = useState<Tenant>(globalActiveTenant);
  const { activeTenantId } = useSystemConfig();
  const isMountedRef = useRef(true);

  // ✅ Solución 1: Verificación de montaje en listener
  useEffect(() => {
    isMountedRef.current = true;
    
    const listener = (newTenant: Tenant) => {
      if (isMountedRef.current) {
        setInternalTenant(newTenant);
      }
    };
    
    listeners.add(listener);
    
    return () => {
      isMountedRef.current = false;
      listeners.delete(listener);
    };
  }, []);

  // ✅ Solución 2: Cleanup de operaciones DOM
  useEffect(() => {
    if (!isMountedRef.current || typeof window === 'undefined') return;
    
    // Guardar valores originales
    const root = document.documentElement;
    const originalPrimary = root.style.getPropertyValue('--primary');
    const originalRing = root.style.getPropertyValue('--ring');
    const originalTitle = document.title;
    
    // Aplicar nuevos valores
    localStorage.setItem('violet_tenant_active', JSON.stringify(tenant));
    if (tenant.primaryColor) {
      root.style.setProperty('--primary', tenant.primaryColor);
      root.style.setProperty('--ring', tenant.primaryColor);
      document.title = tenant.id === 'none'
        ? 'Violet ERP'
        : `${tenant.name} | Violet ERP`;
    }
    
    // ✅ Cleanup: restaurar valores originales
    return () => {
      if (originalPrimary) root.style.setProperty('--primary', originalPrimary);
      if (originalRing) root.style.setProperty('--ring', originalRing);
      document.title = originalTitle;
    };
  }, [tenant]);

  const switchTenant = useCallback((tenantId: string) => {
    if (!isMountedRef.current) return;
    // Lógica de cambio
  }, []);

  return { tenant, switchTenant, /* ... */ };
};
```

### Sistema de Seguridad (useSecurity)

**Implementación Actual:**

```typescript
export const useSecurity = () => {
  const { logout, isAuthenticated } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ⚠️ Problema: handleInactivity no está en dependencias de resetTimer
  const handleInactivity = useCallback(() => {
    toast.warning('Sesión cerrada por inactividad');
    logout();
  }, [logout]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (isAuthenticated) {
      timerRef.current = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, handleInactivity]); // ⚠️ handleInactivity falta

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    resetTimer();
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, resetTimer]);

  return {
    isSecureConnection: window.location.protocol === 'https:',
    lastActivity: new Date().toISOString(),
  };
};
```

**Solución Propuesta:**

```typescript
export const useSecurity = () => {
  const { logout, isAuthenticated } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInactivity = useCallback(() => {
    toast.warning('Sesión cerrada por inactividad', {
      description: 'Por seguridad, hemos cerrado tu sesión tras 15 minutos de inactividad.',
      duration: 5000,
    });
    logout();
  }, [logout]);

  // ✅ Solución: Incluir handleInactivity en dependencias
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (isAuthenticated) {
      timerRef.current = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, handleInactivity]); // ✅ Dependencia agregada

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    resetTimer();
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // ✅ Cleanup completo
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, resetTimer]);

  return {
    isSecureConnection: window.location.protocol === 'https:',
    lastActivity: new Date().toISOString(),
  };
};
```

## Patrones de Refactorización

### Patrón 1: Eliminación de Código No Utilizado

**Antes:**
```typescript
// src/components/AIChat.tsx
import { 
  Send, Bot, User, Sparkles, X, Maximize2, Minimize2, 
  BrainCircuit, Info, RefreshCcw 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// ⚠️ AvatarImage nunca se usa

export function AIChat({ className }: AIChatProps) {
  // ... código que solo usa AvatarFallback
}
```

**Después:**
```typescript
// src/components/AIChat.tsx
import { 
  Send, Bot, User, Sparkles, Maximize2, Minimize2, 
  BrainCircuit, Info, RefreshCcw 
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// ✅ Solo imports necesarios

export function AIChat({ className }: AIChatProps) {
  // ... código sin cambios
}
```

### Patrón 2: Reemplazo de `any` con Tipos Específicos

**Antes:**
```typescript
// src/components/Forms.tsx
const handleSubmit = (data: any) => {
  console.log(data);
};

// src/pages/Login.tsx
const handleLogin = async (e: any) => {
  e.preventDefault();
  // ...
};
```

**Después:**
```typescript
// src/components/Forms.tsx
interface FormData {
  name: string;
  email: string;
  // ... otros campos
}

const handleSubmit = (data: FormData) => {
  console.log(data);
};

// src/pages/Login.tsx
const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};
```

### Patrón 3: Separación de Constantes de Componentes

**Antes:**
```typescript
// src/components/ui/badge.tsx
import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full...",
  {
    variants: {
      variant: {
        default: "bg-primary...",
        secondary: "bg-secondary...",
      },
    },
  }
);

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

**Después:**
```typescript
// src/constants/ui/badge.ts
import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full...",
  {
    variants: {
      variant: {
        default: "bg-primary...",
        secondary: "bg-secondary...",
      },
    },
  }
);

// src/components/ui/badge.tsx
import { type VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/constants/ui/badge";

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

### Patrón 4: Eliminación de Interfaces Vacías

**Antes:**
```typescript
// src/components/ui/command.tsx
interface CommandEmptyProps {}

export const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  CommandEmptyProps
>((props, ref) => {
  return <div ref={ref} {...props} />;
});
```

**Después:**
```typescript
// src/components/ui/command.tsx
export const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  return <div ref={ref} {...props} />;
});
```

### Patrón 5: Parámetros Intencionales No Usados

**Antes:**
```typescript
// src/components/ui/calendar.tsx
const DayContent = (props) => {  // ⚠️ Warning: props no usado
  return <div>Day</div>;
};
```

**Después:**
```typescript
// src/components/ui/calendar.tsx
const DayContent = (_props: DayContentProps) => {  // ✅ Prefijo _ indica intencional
  return <div>Day</div>;
};
```

## Plan de Migración de TypeScript Strict Mode

### Fase 1: Alinear Configuraciones (Día 1)

**Problema:** tsconfig.json (root) sobrescribe tsconfig.app.json

**Acción:**
```json
// tsconfig.json - ANTES
{
  "compilerOptions": {
    "noImplicitAny": false,
    "strictNullChecks": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}

// tsconfig.json - DESPUÉS
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
    // ✅ Remover overrides, dejar que tsconfig.app.json controle
  }
}
```

### Fase 2: Verificar Compilación Strict (Día 2-3)

```bash
# Ejecutar compilación con strict mode
npx tsc --noEmit -p tsconfig.app.json

# Analizar errores
npx tsc --noEmit -p tsconfig.app.json 2>&1 | tee typescript-errors.log

# Contar errores por tipo
grep "error TS" typescript-errors.log | cut -d':' -f4 | sort | uniq -c
```

**Resultado Esperado:** 
- Errores de strictNullChecks: ~50-100
- Errores de noImplicitAny: ~20-30
- Errores de noUnusedLocals: ~40

### Fase 3: Corrección Gradual por Prioridad

**Prioridad 1: Hooks Críticos**
- useAuth.ts
- useTenant.ts
- useSecurity.ts
- useAI.ts

**Prioridad 2: Componentes Principales**
- Layout.tsx
- TenantBranding.tsx
- AIChat.tsx
- Forms.tsx

**Prioridad 3: Páginas**
- Dashboard.tsx
- Finance.tsx
- HR.tsx
- Inventory.tsx
- Sales.tsx
- Purchases.tsx
- Settings.tsx (incluye módulo de Seguridad integrado)
- Login.tsx

**NOTA:** SecurityDashboard.tsx fue removido - funcionalidad integrada en Settings.

**Prioridad 4: Componentes UI**
- Corregir solo los que tienen errores críticos
- Usar `@ts-expect-error` temporal para shadcn/ui components complejos

### Fase 4: Validación Final

```bash
# Verificar 0 errores
npx tsc --noEmit

# Verificar 0 warnings de ESLint
npm run lint

# Build de producción
npm run build

# Verificar bundle size
ls -lh dist/assets/*.js
```

## Estructura de Directorios Propuesta

```
src/
├── constants/
│   ├── ui/
│   │   ├── badge.ts          # badgeVariants
│   │   ├── button.ts         # buttonVariants
│   │   ├── form.ts           # useFormField
│   │   ├── navigation-menu.ts # navigationMenuTriggerStyle
│   │   ├── sidebar.ts        # SIDEBAR_COOKIE_NAME, etc.
│   │   └── toggle.ts         # toggleVariants
│   ├── dashboard.ts          # Dashboard constants
│   ├── finance.ts            # Finance constants
│   └── common.ts             # Shared constants
├── types/
│   ├── api.ts                # API response types
│   ├── vendor.d.ts           # Third-party library types
│   └── index.ts              # Re-exports
└── [existing structure]
```

## Scripts de Automatización

### Script 1: Remover Imports No Usados

```bash
# Usando eslint --fix
npx eslint . --fix --rule '@typescript-eslint/no-unused-vars: error'

# O manualmente con find
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '/^import.*from/d'
```

### Script 2: Recolectar Métricas

```typescript
// scripts/collect-metrics.ts
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const metrics = {
  timestamp: new Date().toISOString(),
  eslint: {
    warnings: 0,
    errors: 0
  },
  typescript: {
    errors: 0
  },
  bundle: {
    size: 0
  }
};

// Ejecutar ESLint
try {
  const eslintOutput = execSync('npx eslint . --format json', { encoding: 'utf-8' });
  const results = JSON.parse(eslintOutput);
  metrics.eslint.warnings = results.reduce((sum: number, file: any) => 
    sum + file.warningCount, 0);
  metrics.eslint.errors = results.reduce((sum: number, file: any) => 
    sum + file.errorCount, 0);
} catch (error) {
  console.error('ESLint failed');
}

// Ejecutar TypeScript
try {
  execSync('npx tsc --noEmit', { encoding: 'utf-8' });
  metrics.typescript.errors = 0;
} catch (error: any) {
  const output = error.stdout || '';
  metrics.typescript.errors = (output.match(/error TS/g) || []).length;
}

// Build y medir bundle
try {
  execSync('npm run build', { stdio: 'ignore' });
  const stats = execSync('du -sb dist', { encoding: 'utf-8' });
  metrics.bundle.size = parseInt(stats.split('\t')[0]);
} catch (error) {
  console.error('Build failed');
}

writeFileSync('quality-metrics.json', JSON.stringify(metrics, null, 2));
console.log('Metrics collected:', metrics);
```

### Script 3: Pre-commit Hook

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running quality checks..."

# ESLint
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint failed. Please fix errors before committing."
  exit 1
fi

# TypeScript
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed. Please fix errors before committing."
  exit 1
fi

echo "✅ All checks passed!"
```

## Testing Strategy

### Unit Tests para Hooks

```typescript
// tests/unit/useTenant.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useTenant } from '@/hooks/useTenant';

describe('useTenant', () => {
  it('should cleanup listeners on unmount', () => {
    const { unmount } = renderHook(() => useTenant());
    
    // Verificar que el listener fue agregado
    const listenersBefore = getListenersCount();
    expect(listenersBefore).toBeGreaterThan(0);
    
    // Desmontar componente
    unmount();
    
    // Verificar que el listener fue removido
    const listenersAfter = getListenersCount();
    expect(listenersAfter).toBe(listenersBefore - 1);
  });

  it('should not update state after unmount', async () => {
    const { result, unmount } = renderHook(() => useTenant());
    const consoleSpy = vi.spyOn(console, 'error');
    
    unmount();
    
    // Intentar actualizar después de unmount
    act(() => {
      result.current.switchTenant('test-tenant');
    });
    
    // No debería haber warnings de React
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Can't perform a React state update")
    );
  });
});
```

### Integration Tests

```typescript
// tests/integration/multi-tenant.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';

describe('Multi-tenant functionality', () => {
  it('should change branding when switching tenant', async () => {
    render(<App />);
    
    // Login como super admin
    const usernameInput = screen.getByPlaceholderText(/usuario/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    
    await userEvent.type(usernameInput, 'superadmin');
    await userEvent.type(passwordInput, 'Violet@2026!');
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    
    // Verificar que llegamos al dashboard
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
    
    // Cambiar tenant
    const tenantSelector = screen.getByRole('combobox');
    await userEvent.click(tenantSelector);
    await userEvent.click(screen.getByText(/Distribuidora del Norte/i));
    
    // Verificar que el branding cambió
    await waitFor(() => {
      const root = document.documentElement;
      const primaryColor = root.style.getPropertyValue('--primary');
      expect(primaryColor).toBe('#10B981'); // Color de Distribuidora del Norte
    });
  });
});
```

## Métricas y Validación

### Baseline Actual

```json
{
  "timestamp": "2024-02-24T00:00:00Z",
  "eslint": {
    "warnings": 87,
    "errors": 0,
    "breakdown": {
      "no-unused-vars": 40,
      "exhaustive-deps": 2,
      "react-refresh": 10,
      "no-explicit-any": 20,
      "no-empty-object-type": 7
    }
  },
  "typescript": {
    "errors": 0,
    "config": {
      "strict": false,
      "effectiveStrict": false
    }
  },
  "bundle": {
    "size": 1310720,
    "gzipped": 434176
  }
}
```

### Objetivo Final

```json
{
  "timestamp": "2024-04-15T00:00:00Z",
  "eslint": {
    "warnings": 0,
    "errors": 0,
    "breakdown": {
      "no-unused-vars": 0,
      "exhaustive-deps": 0,
      "react-refresh": 0,
      "no-explicit-any": 0,
      "no-empty-object-type": 0
    }
  },
  "typescript": {
    "errors": 0,
    "config": {
      "strict": true,
      "effectiveStrict": true
    }
  },
  "bundle": {
    "size": 1258291,
    "gzipped": 419430
  }
}
```

## Conclusión

Este diseño técnico proporciona una ruta clara y segura para mejorar la calidad del código de Violet ERP. La estrategia gradual minimiza el riesgo mientras maximiza el valor entregado en cada fase.

### Próximos Pasos

1. Revisar y aprobar este diseño
2. Crear ramas para cada fase
3. Comenzar implementación siguiendo el plan de 6 semanas
4. Monitorear métricas semanalmente
5. Ajustar plan según sea necesario

### Riesgos Principales

1. **Discrepancia de configuración TypeScript**: Resolver primero
2. **Memory leaks en useTenant**: Crítico para producción
3. **Hook dependencies**: Riesgo de loops infinitos

### Beneficios Esperados

- Código más mantenible y limpio
- Menos bugs gracias a tipado estricto
- Mejor performance (bundle más pequeño)
- Developer Experience mejorado (Fast Refresh funcional)
- Baseline de calidad sostenible
