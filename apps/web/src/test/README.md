# 🧪 Testing Guide - Violet ERP

## Configuración Completa

El sistema de testing está configurado con:
- **Vitest** - Test runner rápido y moderno
- **React Testing Library** - Testing de componentes React
- **jsdom** - Simulación de DOM para tests
- **@testing-library/jest-dom** - Matchers adicionales

## Estructura de Archivos

```
src/
├── test/
│   ├── setup.ts          # Configuración global de tests
│   ├── utils.tsx         # Utilidades y helpers
│   └── README.md         # Esta guía
├── hooks/
│   └── __tests__/
│       ├── useAuth.test.ts
│       └── useSystemConfig.test.ts
└── lib/
    └── __tests__/
        └── formatters.test.ts
```

## Comandos Disponibles

```bash
# Ejecutar tests en modo watch (recomendado para desarrollo)
npm test

# Ejecutar tests con UI interactiva
npm run test:ui

# Ejecutar tests una sola vez
npm run test:run

# Ejecutar tests con reporte de cobertura
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch
```

## Escribir Tests

### Test Básico de Hook

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useMyHook());
    
    expect(result.current.value).toBe(0);
  });

  it('should update value', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.setValue(10);
    });
    
    expect(result.current.value).toBe(10);
  });
});
```

### Test de Componente

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle click', async () => {
    const { user } = render(<MyComponent />);
    const button = screen.getByRole('button');
    
    await user.click(button);
    
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Test de Función Utilitaria

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../formatters';

describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    const result = formatCurrency(1000, 'USD');
    expect(result).toContain('1,000');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0, 'USD');
    expect(result).toContain('0');
  });
});
```

## Utilidades Disponibles

### Mock Data

```typescript
import { 
  mockUser, 
  mockSuperAdmin, 
  mockTenant, 
  mockProduct, 
  mockInvoice 
} from '@/test/utils';

// Usar en tests
const user = mockUser;
const admin = mockSuperAdmin;
```

### Setup Helpers

```typescript
import { setupAuthState, setupSystemConfigState } from '@/test/utils';

// Configurar estado de autenticación
setupAuthState(mockUser);

// Configurar estado del sistema
setupSystemConfigState(mockTenant);
```

### Custom Render

```typescript
import { render } from '@/test/utils';

// Renderiza con todos los providers necesarios
render(<MyComponent />);
```

## Mocks Globales

Los siguientes servicios están mockeados globalmente:

- **Supabase** - Todas las llamadas a la base de datos
- **Dexie/IndexedDB** - Base de datos local
- **Toast notifications** - Notificaciones
- **window.matchMedia** - Media queries
- **IntersectionObserver** - Observador de intersección
- **ResizeObserver** - Observador de tamaño

## Mejores Prácticas

### 1. Limpiar Estado Entre Tests

```typescript
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

### 2. Usar act() para Actualizaciones de Estado

```typescript
await act(async () => {
  await result.current.login('user', 'pass');
});
```

### 3. Esperar Actualizaciones Asíncronas

```typescript
await waitFor(() => {
  expect(result.current.data).toBeDefined();
});
```

### 4. Testear Casos de Error

```typescript
it('should handle errors', async () => {
  const { result } = renderHook(() => useMyHook());
  
  await act(async () => {
    const response = await result.current.doSomething();
    expect(response.success).toBe(false);
    expect(response.error).toBeTruthy();
  });
});
```

### 5. Testear Permisos

```typescript
it('should check permissions', () => {
  setupAuthState(mockUser);
  
  const { result } = renderHook(() => useAuth());
  
  expect(result.current.user?.permissions).toContain('view:dashboard');
});
```

## Cobertura de Tests

Objetivos de cobertura:
- **Líneas:** 80%
- **Funciones:** 80%
- **Branches:** 80%
- **Statements:** 80%

Ver reporte de cobertura:
```bash
npm run test:coverage
# Abre coverage/index.html en el navegador
```

## Tests Existentes

### ✅ useAuth.test.ts
- Initial state
- Login (super admin, mock users, invalid credentials)
- Logout
- Role checking
- Update user
- Session persistence

### ✅ useSystemConfig.test.ts
- Initial state
- Fetch tenants
- Set active tenant
- Exchange rate
- Maintenance mode
- Persistence

### ✅ formatters.test.ts
- formatCurrency
- formatDate
- getContrastColor

## Próximos Tests a Crear

### Prioridad Alta
- [ ] useInventory.test.ts
- [ ] useSales.test.ts
- [ ] useFinanceLogic.test.ts
- [ ] SyncEngine.test.ts

### Prioridad Media
- [ ] ProductCard.test.tsx
- [ ] InvoiceRow.test.tsx
- [ ] Dashboard.test.tsx

### Prioridad Baja
- [ ] validators.test.ts
- [ ] errorHandler.test.ts
- [ ] DataMapper.test.ts

## Debugging Tests

### Ver Tests en UI

```bash
npm run test:ui
```

Abre una interfaz web interactiva para ver y ejecutar tests.

### Ver Logs

```typescript
it('should debug', () => {
  const { result } = renderHook(() => useMyHook());
  
  console.log('Current state:', result.current);
  
  // O usar screen.debug() para componentes
  render(<MyComponent />);
  screen.debug();
});
```

### Ejecutar Test Específico

```bash
# Por nombre de archivo
npm test useAuth

# Por nombre de test
npm test -- -t "should login"
```

## Troubleshooting

### Error: "Cannot find module"

Verifica que los aliases estén configurados en `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### Error: "localStorage is not defined"

Ya está configurado en `setup.ts`. Si persiste, verifica que el test importe el setup.

### Error: "window.matchMedia is not a function"

Ya está mockeado en `setup.ts`. Verifica que el archivo se esté cargando.

### Tests Lentos

```bash
# Ejecutar en paralelo (por defecto)
npm test

# Ejecutar secuencialmente
npm test -- --no-threads
```

## Recursos

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contribuir

Al agregar nuevas funcionalidades:

1. Escribe el test primero (TDD)
2. Implementa la funcionalidad
3. Verifica que el test pase
4. Verifica la cobertura

```bash
npm run test:coverage
```

---

**¡Happy Testing!** 🧪✨
