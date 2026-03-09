# Carrusel de Fotos en Punto de Venta

## Implementación Completada

Se ha implementado el carrusel de fotos en el Punto de Venta para que cada producto muestre hasta 3 fotos con navegación interactiva.

## Características del Carrusel

### 1. Múltiples Imágenes por Producto
✅ Cada producto puede tener hasta 3 fotos  
✅ Las fotos se muestran en un carrusel interactivo  
✅ Navegación con flechas izquierda/derecha  
✅ Indicadores de posición (dots)  

### 2. Vistas Disponibles

#### Vista Grid (Tarjetas)
```
┌─────────────────┐
│  ← [Foto] →     │  ← Carrusel con flechas
│  • • ○          │  ← Indicadores
│                 │
│  Producto Name  │
│  $150.00        │
└─────────────────┘
```

#### Vista Lista (Tabla)
```
┌──────┬──────────────────────────────┐
│ [📷] │ Código | Producto | Precio  │
│  ←→  │ CAU-001| Manguera | $150.00 │
└──────┴──────────────────────────────┘
```

### 3. Modal de Vista Ampliada
✅ Click en la imagen abre modal fullscreen  
✅ Navegación con teclado (← → Esc)  
✅ Zoom y vista detallada  
✅ Animaciones suaves  

## Código Implementado

### 1. Hook usePOS - Mapeo de Imágenes

```typescript
.map(p => ({
  id: p.id,
  codigo: p.cauplas || p.id.substring(0, 8),
  nombre: p.descripcionManguera || p.name || 'Sin nombre',
  precio: p.precioFCA || p.price || 0,
  stock: p.stock || 0,
  categoria: p.category || 'General',
  imagen: p.images?.[0], // Primera imagen para compatibilidad
  images: p.images || [], // Array completo de imágenes (hasta 3)
  // ... otros campos
}))
```

### 2. Vista Grid - Carrusel en Tarjetas

```tsx
<ProductImageCarousel
  images={
    product.images?.length
      ? product.images
      : (product as any).imagen
        ? [(product as any).imagen]
        : []
  }
  productName={product.nombre}
  size="md"
  className="w-full h-full border-none shadow-none bg-transparent"
/>
```

### 3. Vista Lista - Carrusel Compacto

```tsx
<ProductImageCarousel
  images={
    product.images?.length
      ? product.images
      : (product as any).imagen
        ? [(product as any).imagen]
        : []
  }
  productName={product.nombre}
  size="xs"
  className="w-full h-full border-none shadow-none bg-transparent"
/>
```

## Funcionalidades del Carrusel

### Navegación
- **Flechas:** Click en ← o → para cambiar de foto
- **Dots:** Click en los indicadores para ir a foto específica
- **Teclado:** ← → para navegar, Esc para cerrar modal
- **Touch:** Swipe en dispositivos móviles

### Tamaños
| Tamaño | Uso | Dimensiones |
|--------|-----|-------------|
| `xs` | Lista compacta | 48x48px |
| `sm` | Tarjetas pequeñas | 80x80px |
| `md` | Tarjetas normales | 120x120px |
| `lg` | Vista ampliada | 200x200px |

### Estados
- **Sin fotos:** Muestra icono de imagen placeholder
- **1 foto:** Muestra la foto sin navegación
- **2-3 fotos:** Muestra carrusel completo con navegación

## Flujo de Uso

### Escenario 1: Producto con 3 Fotos
```
1. Usuario ve producto en grid
   ↓
2. Carrusel muestra foto 1 de 3
   ↓
3. Usuario hace click en flecha derecha
   ↓
4. Carrusel muestra foto 2 de 3
   ↓
5. Usuario hace click en la imagen
   ↓
6. Se abre modal fullscreen con las 3 fotos
```

### Escenario 2: Producto sin Fotos
```
1. Usuario ve producto en grid
   ↓
2. Se muestra icono placeholder
   ↓
3. Usuario puede agregar al carrito normalmente
```

## Integración con Importación de Fotos

### Cómo se Asignan las Fotos

1. **Importación Individual:**
   - Usuario selecciona hasta 3 fotos
   - Se asocian por código CAUPLAS
   - Se guardan en `product.images[]`

2. **Importación Masiva:**
   - Usuario selecciona carpeta con fotos
   - Nombres de archivo deben coincidir con CAUPLAS
   - Ejemplo: `CAU-001.jpg`, `CAU-001-2.jpg`, `CAU-001-3.jpg`
   - Se procesan en paralelo (20 a la vez)

3. **Almacenamiento:**
   - Fotos se guardan en base64 en localDb
   - Array `images: string[]` con máximo 3 elementos
   - Primera foto en `images[0]`, segunda en `images[1]`, etc.

## Ejemplo de Datos

### Producto con 3 Fotos
```json
{
  "id": "prod-123",
  "cauplas": "CAU-001",
  "nombre": "MANGUERA HIDRAULICA",
  "precio": 150.00,
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // Foto 1
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // Foto 2
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."  // Foto 3
  ]
}
```

### Producto sin Fotos
```json
{
  "id": "prod-456",
  "cauplas": "CAU-002",
  "nombre": "MANGUERA NEUMATICA",
  "precio": 120.00,
  "images": [] // Array vacío
}
```

## Componente ProductImageCarousel

### Props
```typescript
interface ProductImageCarouselProps {
  images: string[];           // Array de URLs o base64
  productName: string;        // Nombre del producto
  size?: 'xs' | 'sm' | 'md' | 'lg'; // Tamaño del carrusel
  className?: string;         // Clases CSS adicionales
}
```

### Características
- ✅ Animaciones suaves con Framer Motion
- ✅ Lazy loading de imágenes
- ✅ Fallback a placeholder si no hay fotos
- ✅ Responsive en todos los dispositivos
- ✅ Accesible con teclado
- ✅ Touch gestures en móviles

## Archivos Modificados

### 1. `src/modules/sales/hooks/usePOS.ts`
**Cambio:** Agregado campo `images` al mapeo de productos
```typescript
images: p.images || [], // Array completo de imágenes
```

### 2. `src/modules/sales/pages/POSPage.tsx`
**Ya implementado:** Uso de `ProductImageCarousel` en ambas vistas
- Vista Grid: Carrusel tamaño `md`
- Vista Lista: Carrusel tamaño `xs`

### 3. `src/modules/inventory/components/ProductImageCarousel.tsx`
**Ya implementado:** Componente completo con todas las funcionalidades

## Beneficios

### Para el Usuario
✅ **Visual:** Ve todas las fotos del producto antes de comprar  
✅ **Confianza:** Puede verificar el producto desde múltiples ángulos  
✅ **Rápido:** Navegación fluida entre fotos  

### Para el Vendedor
✅ **Profesional:** Presentación visual de calidad  
✅ **Eficiente:** Menos preguntas sobre el producto  
✅ **Ventas:** Mayor conversión con fotos de calidad  

## Testing

### Casos Probados
- ✅ Producto con 3 fotos → Carrusel completo
- ✅ Producto con 2 fotos → Carrusel con 2 fotos
- ✅ Producto con 1 foto → Foto única sin navegación
- ✅ Producto sin fotos → Placeholder
- ✅ Navegación con flechas → Funciona
- ✅ Navegación con dots → Funciona
- ✅ Modal fullscreen → Funciona
- ✅ Navegación con teclado → Funciona
- ✅ Touch gestures → Funciona en móviles

## Build Status

✅ **Build exitoso**  
✅ **Sin errores de TypeScript**  
✅ **Solo warnings de estilo (no críticos)**  

## Próximas Mejoras (Opcional)

- [ ] Zoom en hover sobre la imagen
- [ ] Thumbnails de todas las fotos
- [ ] Drag & drop para reordenar fotos
- [ ] Edición de fotos (crop, rotate)
- [ ] Compresión automática de imágenes
- [ ] Carga progresiva (progressive loading)
- [ ] Lazy loading más agresivo
- [ ] Cache de imágenes en memoria
