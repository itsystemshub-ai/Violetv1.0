# 🔍 Guía de Vista Previa de Fotos en Ventas

## ✅ Funcionalidades Implementadas

Se ha implementado un sistema completo de visualización de fotos en el módulo de ventas (POS) con las siguientes características:

### 1. Carrusel de Fotos en Ambas Vistas
- ✅ Vista de Tarjetas (Grid)
- ✅ Vista de Lista (Items)

### 2. Vista Previa Modal
- ✅ Click en la foto para abrir vista previa en pantalla completa
- ✅ Botón X para cerrar
- ✅ Tecla ESC para cerrar
- ✅ Click fuera del modal para cerrar
- ✅ Navegación entre fotos con botones
- ✅ Indicador de cantidad "1/3", "2/3", "3/3"
- ✅ Nombre del producto en la parte superior
- ✅ Icono de zoom al pasar el mouse

## 🎨 Características del Modal

### Diseño
- Fondo negro semi-transparente con blur
- Imagen centrada con tamaño máximo 90vh
- Botones circulares con efecto glassmorphism
- Animación de entrada suave (fade-in)
- Responsive en todos los tamaños de pantalla

### Controles
1. **Botón X (Cerrar)**: Esquina superior derecha
2. **Tecla ESC**: Cierra el modal
3. **Click fuera**: Cierra el modal
4. **Botones de navegación**: Izquierda/Derecha (solo si hay múltiples fotos)
5. **Indicador**: Muestra foto actual y total

### Información Mostrada
- Nombre del producto (esquina superior izquierda)
- Indicador de cantidad (parte inferior central)
- Imagen en alta resolución

## 🧪 Cómo Usar

### En Vista de Tarjetas (Grid)

1. **Navegar entre fotos**:
   - Pasar el mouse sobre la tarjeta
   - Aparecen botones circulares a los lados
   - Click en las flechas para cambiar de foto
   - Indicador "1/3" en esquina inferior derecha

2. **Abrir vista previa**:
   - Click en la imagen
   - Se abre modal en pantalla completa
   - Icono de lupa aparece al hacer hover

3. **En el modal**:
   - Navegar con botones izquierda/derecha
   - Cerrar con X, ESC o click fuera
   - Ver nombre del producto arriba
   - Ver indicador de cantidad abajo

### En Vista de Lista (Items)

1. **Navegar entre fotos**:
   - Pasar el mouse sobre la miniatura
   - Aparecen botones laterales
   - Click en las flechas para cambiar de foto
   - Indicador "1/3" en esquina inferior derecha

2. **Abrir vista previa**:
   - Click en la miniatura
   - Se abre modal en pantalla completa
   - Icono de lupa aparece al hacer hover

3. **En el modal**:
   - Mismas funcionalidades que en vista de tarjetas

## 🎯 Casos de Uso

### Producto con 3 Fotos (Ejemplo: 4778)

**Vista de Tarjetas**:
```
1. Buscar producto 4778
2. Pasar mouse sobre la imagen
3. Ver indicador "1/3"
4. Click en flecha derecha → "2/3"
5. Click en flecha derecha → "3/3"
6. Click en la imagen → Modal abierto
7. Navegar en el modal
8. Presionar ESC → Modal cerrado
```

**Vista de Lista**:
```
1. Cambiar a vista de lista
2. Buscar producto 4778
3. Pasar mouse sobre miniatura
4. Ver indicador "1/3"
5. Click en flecha derecha → "2/3"
6. Click en la miniatura → Modal abierto
7. Navegar en el modal
8. Click en X → Modal cerrado
```

### Producto con 1 Foto

```
1. Buscar producto con 1 foto
2. NO aparecen botones de navegación
3. NO aparece indicador
4. Click en la imagen → Modal abierto
5. Modal muestra solo esa foto
6. NO aparecen botones de navegación en modal
```

### Producto sin Fotos

```
1. Buscar producto sin fotos
2. Aparece imagen por defecto (AI_TECH_1)
3. NO aparecen botones ni indicador
4. Click en la imagen → Modal abierto
5. Modal muestra imagen por defecto
```

## 🔧 Componentes Técnicos

### ImagePreviewModal
```typescript
interface ImagePreviewModalProps {
  images: string[];           // Array de URLs de imágenes
  initialIndex: number;       // Índice inicial a mostrar
  onClose: () => void;        // Función para cerrar el modal
  productName: string;        // Nombre del producto
}
```

**Características**:
- Estado interno para índice actual
- Navegación circular (última → primera)
- Event listeners para tecla ESC
- Click en backdrop para cerrar
- Prevención de propagación de eventos

### ProductGalleryCard (Vista de Tarjetas)
```typescript
const [showPreview, setShowPreview] = useState(false);
```

**Características**:
- Estado para controlar visibilidad del modal
- onClick en contenedor de imagen
- Icono de zoom con overlay
- Modal renderizado condicionalmente

### ProductListRow (Vista de Lista)
```typescript
const [showPreview, setShowPreview] = useState(false);
```

**Características**:
- Estado para controlar visibilidad del modal
- onClick en contenedor de miniatura
- Icono de zoom con overlay
- Modal renderizado condicionalmente

## 🎨 Estilos y Animaciones

### Modal
- `z-50`: Z-index alto para estar sobre todo
- `bg-black/90`: Fondo negro 90% opacidad
- `backdrop-blur-sm`: Efecto blur en el fondo
- `animate-in fade-in duration-200`: Animación de entrada

### Botones
- `bg-white/10 hover:bg-white/20`: Efecto glassmorphism
- `backdrop-blur-md`: Blur en los botones
- `border border-white/20`: Borde semi-transparente
- `shadow-xl`: Sombra pronunciada

### Imagen
- `max-w-full max-h-full`: Responsive
- `object-contain`: Mantiene proporción
- `rounded-2xl`: Bordes redondeados
- `shadow-2xl`: Sombra grande

### Icono de Zoom
- `opacity-0 group-hover:opacity-100`: Aparece al hover
- `bg-black/20`: Overlay semi-transparente
- `w-12 h-12`: Tamaño grande
- `drop-shadow-lg`: Sombra en el icono

## 📊 Flujo de Interacción

```
Usuario pasa mouse sobre imagen
    ↓
Aparece icono de lupa
    ↓
Usuario hace click en imagen
    ↓
setShowPreview(true)
    ↓
Modal se renderiza
    ↓
Usuario navega/cierra
    ↓
setShowPreview(false)
    ↓
Modal se desmonta
```

## 🐛 Debugging

### Logs en Consola

**Al abrir modal**:
```
🖼️ ProductGalleryCard - [Nombre] (4778): 3 foto(s)
✅ Imagen 1/3 cargada para [Nombre] (4778)
```

**Al navegar en modal**:
```
✅ Imagen 2/3 cargada para [Nombre] (4778)
✅ Imagen 3/3 cargada para [Nombre] (4778)
```

### Verificación de Estado

1. **Abrir DevTools** (F12)
2. **React DevTools** > Components
3. Buscar `ProductGalleryCard` o `ProductListRow`
4. Verificar estado `showPreview`
5. Verificar estado `currentImageIndex`

## 🚀 Mejoras Futuras (Opcionales)

- [ ] Zoom con rueda del mouse
- [ ] Arrastrar para navegar (swipe)
- [ ] Miniaturas en la parte inferior
- [ ] Descarga de imagen
- [ ] Compartir imagen
- [ ] Rotación de imagen
- [ ] Zoom con pinch en móvil

## 📦 Archivos Modificados

- `src/components/Sales/SalesPOS.tsx`:
  - Agregado componente `ImagePreviewModal`
  - Agregado estado `showPreview` en `ProductGalleryCard`
  - Agregado estado `showPreview` en `ProductListRow`
  - Agregado onClick en imágenes
  - Agregado icono de zoom
  - Agregados imports: `X`, `ZoomIn`

## ✨ Resultado Final

### Vista de Tarjetas
- Carrusel funcional con navegación
- Click en imagen abre modal
- Icono de lupa al hover
- Modal con navegación completa

### Vista de Lista
- Carrusel funcional en miniatura
- Click en miniatura abre modal
- Icono de lupa al hover
- Modal con navegación completa

### Modal
- Pantalla completa con fondo oscuro
- Navegación entre fotos
- Múltiples formas de cerrar
- Información del producto
- Diseño elegante y moderno

---

**Fecha**: 2 de marzo de 2026  
**Sistema**: Violet ERP v2.0.0  
**Módulo**: Ventas - POS  
**Estado**: ✅ Completamente implementado
