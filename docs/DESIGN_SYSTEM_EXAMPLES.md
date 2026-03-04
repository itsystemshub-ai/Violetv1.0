# Ejemplos de Aplicación del Sistema de Diseño

## 🎨 Sistema de Diseño Violet ERP

Este documento muestra ejemplos prácticos de cómo aplicar el sistema de diseño generado por UI/UX Pro Max a los componentes de Violet ERP.

## 📋 Tabla de Contenidos

1. [Configuración de Tailwind](#configuración-de-tailwind)
2. [Componentes de Botones](#componentes-de-botones)
3. [Componentes de Cards](#componentes-de-cards)
4. [Componentes de Formularios](#componentes-de-formularios)
5. [Dashboard Components](#dashboard-components)
6. [Módulos Específicos](#módulos-específicos)

---

## Configuración de Tailwind

Actualizar `tailwind.config.js` con los colores y tipografía del sistema de diseño:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3B0764',
        },
        secondary: {
          DEFAULT: '#A78BFA',
          light: '#C4B5FD',
          dark: '#7C3AED',
        },
        cta: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
        },
        background: {
          DEFAULT: '#FAF5FF',
          light: '#FEFCFF',
        },
        text: {
          DEFAULT: '#4C1D95',
          muted: '#6D28D9',
        },
      },
      fontFamily: {
        heading: ['Lexend', 'sans-serif'],
        body: ['Source Sans 3', 'sans-serif'],
      },
      spacing: {
        xs: '0.25rem',  // 4px
        sm: '0.5rem',   // 8px
        md: '1rem',     // 16px
        lg: '1.5rem',   // 24px
        xl: '2rem',     // 32px
        '2xl': '3rem',  // 48px
        '3xl': '4rem',  // 64px
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.15)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
};
```

---

## Componentes de Botones

### Button.tsx - Actualizado con Sistema de Diseño

```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'font-heading font-semibold',
          'rounded-lg',
          'transition-all duration-200',
          'cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          
          // Variant styles
          {
            // Primary - CTA Orange
            'bg-cta text-white hover:bg-cta-hover hover:-translate-y-0.5 shadow-md hover:shadow-lg':
              variant === 'primary',
            
            // Secondary - Primary Purple Border
            'bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white':
              variant === 'secondary',
            
            // Ghost
            'bg-transparent text-primary hover:bg-primary/10':
              variant === 'ghost',
          },
          
          // Size styles
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Ejemplo de Uso

```tsx
import { Button } from '@/shared/components/ui/Button';

function Example() {
  return (
    <div className="space-x-4">
      <Button variant="primary">Contact Sales</Button>
      <Button variant="secondary">Login</Button>
      <Button variant="ghost">Learn More</Button>
    </div>
  );
}
```

---

## Componentes de Cards

### Card.tsx - Actualizado con Sistema de Diseño

```tsx
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'bg-background rounded-xl p-6',
          'shadow-md',
          'transition-all duration-200',
          
          // Hoverable styles
          hoverable && [
            'cursor-pointer',
            'hover:shadow-lg hover:-translate-y-1',
          ],
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

// Card Title
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'font-heading text-2xl font-semibold text-text',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

// Card Content
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-body text-text-muted', className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';
```

### Ejemplo de Uso

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';

function DashboardCard() {
  return (
    <Card hoverable>
      <CardHeader>
        <CardTitle>Total Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-primary">$45,231.89</p>
        <p className="text-sm text-text-muted">+20.1% from last month</p>
      </CardContent>
    </Card>
  );
}
```

---

## Componentes de Formularios

### Input.tsx - Actualizado con Sistema de Diseño

```tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-text font-body">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            // Base styles
            'w-full px-4 py-3',
            'font-body text-base',
            'bg-white',
            'border border-gray-200 rounded-lg',
            'transition-all duration-200',
            
            // Focus styles
            'focus:outline-none',
            'focus:border-primary',
            'focus:ring-2 focus:ring-primary/20',
            
            // Error styles
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            
            // Disabled styles
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500 font-body">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### Ejemplo de Uso

```tsx
import { Input } from '@/shared/components/ui/Input';

function LoginForm() {
  return (
    <form className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
      />
      <Button variant="primary" className="w-full">
        Login
      </Button>
    </form>
  );
}
```

---

## Dashboard Components

### KPI Card con Animación de Pulso

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

export function KPICard({ title, value, change, icon }: KPICardProps) {
  const isPositive = change >= 0;
  
  return (
    <Card hoverable className="relative overflow-hidden">
      {/* Pulse animation for metrics */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent animate-pulse" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      
      <CardContent>
        <div className="text-3xl font-bold text-text font-heading">{value}</div>
        <div className="flex items-center gap-1 text-sm">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(change)}%
          </span>
          <span className="text-text-muted">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Badge Component con Hover Effect

```tsx
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center px-3 py-1',
        'text-xs font-semibold font-body',
        'rounded-full',
        'transition-all duration-200',
        'cursor-pointer',
        
        // Badge hover effect
        'hover:scale-105 hover:shadow-md',
        
        // Variant styles
        {
          'bg-primary/10 text-primary hover:bg-primary/20': variant === 'default',
          'bg-green-100 text-green-700 hover:bg-green-200': variant === 'success',
          'bg-yellow-100 text-yellow-700 hover:bg-yellow-200': variant === 'warning',
          'bg-red-100 text-red-700 hover:bg-red-200': variant === 'error',
        },
        
        className
      )}
    >
      {children}
    </span>
  );
}
```

---

## Módulos Específicos

### Finance Module - Ledger Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { DollarSign } from 'lucide-react';

export function LedgerCard() {
  return (
    <Card hoverable>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Libro Mayor</CardTitle>
          <div className="p-2 bg-primary/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Total Activos</span>
          <span className="text-lg font-semibold text-text">$125,430.00</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Total Pasivos</span>
          <span className="text-lg font-semibold text-text">$45,230.00</span>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text">Patrimonio</span>
            <span className="text-xl font-bold text-primary">$80,200.00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Inventory Module - Stock Alert

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/shared/components/ui/Badge';

export function StockAlertCard() {
  const alerts = [
    { product: 'Producto A', stock: 5, min: 10 },
    { product: 'Producto B', stock: 2, min: 15 },
    { product: 'Producto C', stock: 8, min: 20 },
  ];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-cta" />
          <CardTitle>Alertas de Stock</CardTitle>
          <Badge variant="warning">{alerts.length}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors duration-200 cursor-pointer"
            >
              <div>
                <p className="font-medium text-text">{alert.product}</p>
                <p className="text-sm text-text-muted">
                  Stock: {alert.stock} / Mínimo: {alert.min}
                </p>
              </div>
              <Badge variant="warning">Bajo</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## CSS Global Styles

Agregar a `src/index.css`:

```css
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Colors */
    --color-primary: #7C3AED;
    --color-secondary: #A78BFA;
    --color-cta: #F97316;
    --color-background: #FAF5FF;
    --color-text: #4C1D95;
    
    /* Spacing */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    --space-2xl: 3rem;
    --space-3xl: 4rem;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
    --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
  }
  
  body {
    @apply font-body text-text bg-background;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}

@layer utilities {
  /* Smooth stat reveal animation */
  @keyframes stat-reveal {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-stat-reveal {
    animation: stat-reveal 0.5s ease-out;
  }
  
  /* Metric pulse animation */
  @keyframes metric-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }
  
  .animate-metric-pulse {
    animation: metric-pulse 2s ease-in-out infinite;
  }
  
  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

---

## Checklist de Implementación

Al implementar estos componentes, verificar:

- [ ] ✅ Colores del sistema de diseño aplicados
- [ ] ✅ Tipografía Lexend/Source Sans 3 configurada
- [ ] ✅ Espaciado consistente usando tokens
- [ ] ✅ Sombras apropiadas para profundidad
- [ ] ✅ Transiciones suaves (200ms)
- [ ] ✅ Estados hover con feedback visual
- [ ] ✅ Estados focus visibles
- [ ] ✅ cursor-pointer en elementos clickeables
- [ ] ✅ Íconos SVG (Lucide/Heroicons)
- [ ] ✅ Responsive en todos los breakpoints
- [ ] ✅ prefers-reduced-motion respetado

---

**Última actualización:** 3 de marzo de 2026  
**Sistema de Diseño:** Violet ERP v1.0  
**Generado por:** UI/UX Pro Max
