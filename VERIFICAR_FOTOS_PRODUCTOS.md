# 🔍 Guía de Verificación de Fotos en Productos

## 📋 Pasos para Verificar

### 1. Abrir DevTools
- Presiona `F12` o `Ctrl + Shift + I`
- Ve a la pestaña **Console**

### 2. Buscar Logs del Producto 4778
Busca estos mensajes en la consola:

```
🔍 Producto 4778 encontrado: {
  id: "...",
  cauplas: "4778",
  name: "...",
  images: [...],
  imageCount: X,
  hasImages: true/false
}
```

O:
```
⚠️ Producto 4778 NO encontrado en la base de datos
```

### 3. Verificar en Componentes
Busca estos mensajes:

```
🖼️ ProductGalleryCard - [Nombre] (4778): X foto(s)
```

O:
```
⚠️ ProductGalleryCard - Producto 4778 SIN imágenes: {...}
```

### 4. Verificar en IndexedDB Directamente

1. En DevTools, ve a la pestaña **Application**
2. En el panel izquierdo, expande **IndexedDB**
3. Expande **localDb**
4. Click en **products**
5. Busca el producto con `cauplas: "4778"` o `cauplas: 4778`
6. Verifica el campo `images` o `image_urls`

### 5. Ejecutar Script de Verificación

Copia y pega este código en la consola:

```javascript
// Verificar producto 4778
(async () => {
  const db = await window.indexedDB.open('localDb');
  
  db.onsuccess = async (event) => {
    const database = event.target.result;
    const transaction = database.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const products = request.result;
      const product4778 = products.find(p => 
        p.cauplas === '4778' || 
        p.cauplas === 4778 || 
        String(p.cauplas) === '4778'
      );
      
      if (product4778) {
        console.log('✅ Producto 4778 encontrado:', {
          id: product4778.id,
          cauplas: product4778.cauplas,
          name: product4778.name,
          descripcionManguera: product4778.descripcionManguera,
          images: product4778.images,
          image_urls: product4778.image_urls,
          imageCount: product4778.images?.length || 0,
          hasImages: !!(product4778.images && product4778.images.length > 0)
        });
        
        // Verificar cada imagen
        if (product4778.images && product4778.images.length > 0) {
          console.log('📸 Imágenes del producto 4778:');
          product4778.images.forEach((img, index) => {
            console.log(`  ${index + 1}. ${img.substring(0, 100)}...`);
          });
        } else {
          console.warn('⚠️ El producto 4778 NO tiene imágenes en el campo "images"');
        }
        
        if (product4778.image_urls && product4778.image_urls.length > 0) {
          console.log('📸 image_urls del producto 4778:');
          product4778.image_urls.forEach((img, index) => {
            console.log(`  ${index + 1}. ${img.substring(0, 100)}...`);
          });
        }
      } else {
        console.error('❌ Producto 4778 NO encontrado en IndexedDB');
        console.log('Productos disponibles con código similar:');
        const similar = products.filter(p => 
          String(p.cauplas).includes('4778') ||
          String(p.cauplas).includes('478')
        );
        console.table(similar.map(p => ({
          cauplas: p.cauplas,
          name: p.name,
          hasImages: !!(p.images && p.images.length > 0)
        })));
      }
    };
  };
})();
```

### 6. Comparar con Producto 13647

Ejecuta el mismo script pero para el producto 13647:

```javascript
// Verificar producto 13647
(async () => {
  const db = await window.indexedDB.open('localDb');
  
  db.onsuccess = async (event) => {
    const database = event.target.result;
    const transaction = database.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const products = request.result;
      const product13647 = products.find(p => 
        p.cauplas === '13647' || 
        p.cauplas === 13647 || 
        String(p.cauplas) === '13647'
      );
      
      if (product13647) {
        console.log('✅ Producto 13647 encontrado:', {
          id: product13647.id,
          cauplas: product13647.cauplas,
          name: product13647.name,
          descripcionManguera: product13647.descripcionManguera,
          images: product13647.images,
          image_urls: product13647.image_urls,
          imageCount: product13647.images?.length || 0,
          hasImages: !!(product13647.images && product13647.images.length > 0)
        });
        
        // Verificar cada imagen
        if (product13647.images && product13647.images.length > 0) {
          console.log('📸 Imágenes del producto 13647:');
          product13647.images.forEach((img, index) => {
            console.log(`  ${index + 1}. ${img.substring(0, 100)}...`);
          });
        }
      } else {
        console.error('❌ Producto 13647 NO encontrado en IndexedDB');
      }
    };
  };
})();
```

## 🔧 Posibles Problemas y Soluciones

### Problema 1: Producto 4778 no tiene imágenes en la BD
**Solución**: Importar las fotos nuevamente usando el botón "Importar Fotos"

### Problema 2: Las imágenes están en `image_urls` pero no en `images`
**Solución**: El mapeo en `useInventory.ts` debería convertir `image_urls` a `images`

### Problema 3: Las imágenes son URLs inválidas
**Solución**: Verificar que las imágenes sean base64 válidas o URLs accesibles

### Problema 4: El producto 4778 no existe en la BD
**Solución**: Verificar que el producto esté importado correctamente desde el Excel

## 📊 Comparación de Resultados

Después de ejecutar los scripts, compara:

| Campo | Producto 4778 | Producto 13647 |
|-------|---------------|----------------|
| Existe en BD | ¿Sí/No? | ¿Sí/No? |
| Tiene `images` | ¿Sí/No? | ¿Sí/No? |
| Cantidad de imágenes | X | X |
| Formato de imágenes | base64/URL | base64/URL |

## 🚀 Siguiente Paso

Una vez que tengas los resultados de la consola, podremos:
1. Identificar si el problema es con el producto 4778 específicamente
2. Verificar si las imágenes están en la base de datos
3. Corregir el mapeo si es necesario
4. Re-importar las fotos si faltan

---

**Instrucciones**: 
1. Abre la consola (F12)
2. Ejecuta los scripts de verificación
3. Copia los resultados
4. Comparte los logs para diagnosticar el problema
