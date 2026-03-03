# 📸 Guía de Importación de Fotos - Violet ERP

## Descripción General

El sistema de importación de fotos permite asignar automáticamente imágenes a los productos del inventario basándose en el nombre del archivo.

## 🎯 Cómo Funciona

### Coincidencia Automática por Código

El sistema busca coincidencias entre el **nombre del archivo** (sin extensión) y los códigos del producto:

1. **Código CAUPLAS** (ej: 4778, 19935)
2. **Código TORFLEX** (ej: TX-1234)
3. **Código INDOMAX** (ej: MGM-5678)
4. **Código OEM** (ej: ABC123)

### Formatos de Nombre Aceptados

✅ **Coincidencia Exacta:**
- `4778.jpg` → Producto con CAUPLAS: 4778
- `19935.png` → Producto con CAUPLAS: 19935
- `TX-1234.jpg` → Producto con TORFLEX: TX-1234

✅ **Con Separadores (para múltiples fotos del mismo producto):**
- `4778_1.jpg` → Primera foto del producto 4778
- `4778_2.jpg` → Segunda foto del producto 4778
- `4778-frontal.jpg` → Foto frontal del producto 4778
- `4778 lateral.jpg` → Foto lateral del producto 4778

❌ **NO Aceptados:**
- `foto4778.jpg` (el código debe estar al inicio)
- `producto_4778_nuevo.jpg` (texto antes del código)

## 📋 Pasos para Importar Fotos

### Opción 1: Archivos Individuales

1. Click en el botón **"Importar Fotos"** en el header del inventario
2. En el diálogo, selecciona **"Individual"**
3. Selecciona una o varias imágenes (Ctrl+Click para múltiples)
4. El sistema procesará automáticamente las imágenes
5. Verás un mensaje de confirmación con el resultado

### Opción 2: Carpeta Completa (Bulk)

1. Click en el botón **"Importar Fotos"** en el header del inventario
2. En el diálogo, selecciona **"Carpeta Bulk"**
3. Selecciona la carpeta que contiene todas las imágenes
4. El sistema procesará todas las imágenes de la carpeta
5. Verás un mensaje de confirmación con el resultado

## 📁 Estructura Recomendada de Archivos

```
fotos_productos/
├── 4778.jpg
├── 4778_2.jpg
├── 19935.jpg
├── 19936.jpg
├── 13556_frontal.jpg
├── 13556_lateral.jpg
└── TX-1234.png
```

## 🔢 Límites y Restricciones

- **Máximo 3 fotos por producto**
- **Formatos aceptados:** JPG, JPEG, PNG, GIF, WEBP
- **Tamaño recomendado:** Menos de 2MB por imagen
- **Resolución recomendada:** 800x800px o similar

## ✅ Mensajes del Sistema

### Éxito
- `✅ X foto(s) importada(s) exitosamente` - Fotos asignadas correctamente

### Advertencias
- `⚠️ X foto(s) sin producto coincidente` - Archivos sin código válido
- `⚠️ Foto duplicada para: [Producto]` - La imagen ya existe

### Errores
- `❌ No se encontraron imágenes válidas` - Archivos no son imágenes
- `❌ No se encontró producto para: [archivo]` - Código no existe en inventario

## 🎨 Visualización de Fotos

### En la Tabla de Inventario

Las fotos aparecen en la columna **"FOTO"** con:
- Carrusel interactivo si hay múltiples fotos
- Botones de navegación (anterior/siguiente)
- Zoom al pasar el mouse
- Placeholder si no hay foto

### Navegación del Carrusel

- **Click izquierdo:** Foto anterior
- **Click derecho:** Foto siguiente
- **Hover:** Zoom suave de la imagen

## 🔧 Solución de Problemas

### Problema: "No se encontraron coincidencias"

**Causas posibles:**
1. El nombre del archivo no coincide con ningún código
2. El código está mal escrito
3. El producto no existe en el inventario

**Solución:**
- Verifica que el nombre del archivo sea exactamente el código del producto
- Revisa que el producto exista en el inventario
- Usa el formato correcto: `[CODIGO].jpg` o `[CODIGO]_[numero].jpg`

### Problema: "La foto no aparece después de importar"

**Causas posibles:**
1. El navegador tiene caché
2. La imagen es muy grande
3. Error en la conversión a base64

**Solución:**
- Refresca la página (F5)
- Reduce el tamaño de la imagen
- Intenta con otro formato (JPG en lugar de PNG)

### Problema: "Solo se importó 1 foto de 3"

**Causas posibles:**
1. Las otras 2 fotos tienen nombres incorrectos
2. Ya hay 3 fotos asignadas al producto

**Solución:**
- Verifica los nombres de las otras fotos
- Elimina fotos antiguas si quieres reemplazarlas

## 💡 Mejores Prácticas

### Nomenclatura de Archivos

1. **Usa el código exacto del producto**
   - ✅ `4778.jpg`
   - ❌ `manguera_4778.jpg`

2. **Para múltiples fotos, usa sufijos**
   - ✅ `4778_1.jpg`, `4778_2.jpg`, `4778_3.jpg`
   - ✅ `4778-frontal.jpg`, `4778-lateral.jpg`

3. **Mantén consistencia**
   - Usa siempre el mismo separador (`_` o `-`)
   - Usa minúsculas o mayúsculas consistentemente

### Organización de Fotos

1. **Crea una carpeta dedicada**
   ```
   C:/Violet_ERP/fotos_productos/
   ```

2. **Agrupa por categoría (opcional)**
   ```
   fotos_productos/
   ├── radiador/
   ├── refrigeracion/
   └── gases/
   ```

3. **Mantén backups**
   - Guarda una copia de las fotos originales
   - No dependas solo de la base de datos

### Optimización de Imágenes

1. **Reduce el tamaño antes de importar**
   - Usa herramientas como TinyPNG o Squoosh
   - Objetivo: 200-500KB por imagen

2. **Usa resolución adecuada**
   - 800x800px es suficiente para la mayoría de casos
   - No uses fotos de 4K o superiores

3. **Formato recomendado**
   - JPG para fotos reales
   - PNG para imágenes con transparencia
   - WEBP para mejor compresión (si es compatible)

## 📊 Ejemplo Completo

### Escenario: Importar fotos de 10 productos

1. **Preparar archivos:**
   ```
   4778.jpg
   4778_2.jpg
   19935.jpg
   19936.jpg
   13556.jpg
   4961.jpg
   4706.jpg
   4538.jpg
   4719.jpg
   13744.jpg
   ```

2. **Importar:**
   - Click en "Importar Fotos"
   - Seleccionar "Carpeta Bulk"
   - Elegir la carpeta con las 10 imágenes

3. **Resultado esperado:**
   ```
   ✅ 10 foto(s) importada(s) exitosamente
   ```

4. **Verificar:**
   - Ir a "Base de Datos" en el inventario
   - Buscar los productos por código
   - Verificar que las fotos aparezcan en la columna FOTO

## 🚀 Funcionalidades Avanzadas

### Importación Masiva

Para importar cientos de fotos:

1. Organiza todas las fotos en una carpeta
2. Asegúrate de que los nombres sean correctos
3. Usa "Carpeta Bulk" para procesar todo de una vez
4. El sistema procesará todas las imágenes automáticamente

### Actualización de Fotos

Para reemplazar fotos existentes:

1. Las fotos se agregan hasta un máximo de 3
2. Si ya hay 3 fotos, las nuevas se ignoran
3. Para reemplazar, primero elimina las fotos antiguas manualmente

### Logs de Consola

Para debugging, abre la consola del navegador (F12):

```javascript
✅ Foto asignada a producto: MANGUERA RADIADOR (4778)
❌ No se encontró producto para: 9999
⚠️ Foto duplicada para: MANGUERA REFRIGERACION
```

## 📞 Soporte

Si tienes problemas:

1. Revisa esta guía completa
2. Verifica los logs en la consola (F12)
3. Asegúrate de que los códigos existan en el inventario
4. Contacta al equipo de desarrollo con capturas de pantalla

---

**Versión**: 2.0.0  
**Última actualización**: 2 de marzo de 2026  
**Sistema**: Violet ERP - Módulo de Inventario
