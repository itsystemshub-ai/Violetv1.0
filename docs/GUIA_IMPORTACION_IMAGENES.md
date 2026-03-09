# Guía de Importación de Imágenes

## Fecha: 2026-03-09
## Versión: 2.1.0

---

## 📋 Resumen

Sistema completo de importación de imágenes con:
- ✅ Compresión automática (reduce 60-70% tamaño)
- ✅ Validación de formatos y dimensiones
- ✅ Preview antes de importar
- ✅ Drag & drop intuitivo
- ✅ Retry automático
- ✅ Procesamiento por lotes

---

## 🚀 Uso Rápido

### Opción 1: Componente Completo con Preview

```tsx
import { ImageImportPreview } from '@/modules/inventory/components/ImageImportPreview';

function ImportPage() {
  const handleImport = async (images) => {
    // images contiene: { file, compressed, thumbnail }[]
    for (const img of images) {
      await saveToDatabase({
        original: img.file,
        compressed: img.compressed,
        thumbnail: img.thumbnail,
      });
    }
  };

  return (
    <ImageImportPreview
      onImport={handleImport}
      maxFiles={20}
      autoCompress={true}
      compressionQuality={0.85}
    />
  );
}
```

### Opción 2: Drag & Drop Simple

```tsx
import { DragDropImageUpload } from '@/modules/inventory/components/DragDropImageUpload';

function SimpleImport() {
  const handleFiles = async (files: File[]) => {
    // Procesar archivos
    for (const file of files) {
      await processImage(file);
    }
  };

  return (
    <DragDropImageUpload
      onFilesSelected={handleFiles}
      maxFiles={10}
      maxSizeMB={10}
    />
  );
}
```

### Opción 3: Hook Personalizado

```tsx
import { useImageImport } from '@/modules/inventory/hooks/useImageImport';

function CustomImport() {
  const { isImporting, progress, importImages } = useImageImport({
    compressionOptions: {
      quality: 0.85,
      format: 'webp',
      maxWidth: 1920,
      maxHeight: 1920,
    },
    maxRetries: 3,
    onProgress: (current, total) => {
      console.log(`${current}/${total}`);
    },
    onComplete: (result) => {
      console.log(`Success: ${result.success}, Failed: ${result.failed}`);
    },
  });

  const handleImport = async (files: File[]) => {
    const result = await importImages(files);
    // Procesar resultado
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleImport(Array.from(e.target.files || []))}
      />
      {isImporting && <Progress value={progress} />}
    </div>
  );
}
```

---

## 🔧 Utilidades de Compresión

### Validar Imagen

```tsx
import { validateImage } from '@/shared/utils/imageCompression';

const validation = await validateImage(file);

if (validation.valid) {
  console.log('Imagen válida:', {
    format: validation.format,
    size: validation.size,
    width: validation.width,
    height: validation.height,
  });
} else {
  console.error('Error:', validation.error);
}
```

### Comprimir Imagen

```tsx
import { compressImage } from '@/shared/utils/imageCompression';

const compressed = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  format: 'webp',
  maxSizeMB: 2,
});

// compressed es un Blob
console.log('Tamaño original:', file.size);
console.log('Tamaño comprimido:', compressed.size);
console.log('Reducción:', ((1 - compressed.size / file.size) * 100).toFixed(1) + '%');
```

### Generar Thumbnail

```tsx
import { generateThumbnail } from '@/shared/utils/imageCompression';

const thumbnail = await generateThumbnail(file, 200); // 200x200px

// Convertir a base64 para guardar
import { blobToBase64 } from '@/shared/utils/imageCompression';
const base64 = await blobToBase64(thumbnail);
```

### Procesar Múltiples Imágenes

```tsx
import { processImagesInBatch } from '@/shared/utils/imageCompression';

const results = await processImagesInBatch(
  files,
  {
    quality: 0.85,
    format: 'webp',
  },
  (current, total) => {
    console.log(`Procesando ${current}/${total}`);
  },
  3 // Concurrencia: 3 imágenes simultáneas
);

// results: { file, compressed, thumbnail }[]
```

---

## 📊 Exportación de Reportes

### Botón de Exportación Completo

```tsx
import { ExportReportButton } from '@/modules/inventory/components/ExportReportButton';

function InventoryPage() {
  const { products } = useInventory();

  return (
    <div>
      <ExportReportButton
        products={products}
        variant="outline"
        size="default"
      />
    </div>
  );
}
```

### Exportación Programática

```tsx
import {
  exportProductsWithoutPhotos,
  exportPhotoAuditReport,
  exportInventoryReport,
  exportLowStockReport,
} from '@/modules/inventory/utils/reportExporter';

// Productos sin fotos
exportProductsWithoutPhotos(products, 'excel');

// Auditoría de fotos
exportPhotoAuditReport(products);

// Inventario completo
exportInventoryReport(products, {
  includePhotos: true,
  includeStock: true,
  includePrices: true,
});

// Bajo stock
exportLowStockReport(products);
```

### Estadísticas de Fotos

```tsx
import { generatePhotoStats } from '@/modules/inventory/utils/reportExporter';

const stats = generatePhotoStats(products);

console.log({
  total: stats.total,
  withPhotos: stats.withPhotos,
  withoutPhotos: stats.withoutPhotos,
  partial: stats.partial,
  complete: stats.complete,
  percentage: stats.percentage.toFixed(1) + '%',
});
```

---

## 🎯 Ejemplo Completo: Modal de Importación

```tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { ImageImportPreview } from '@/modules/inventory/components/ImageImportPreview';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';

function ImportPhotosModal({ isOpen, onClose, productId }) {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (images) => {
    setIsImporting(true);

    try {
      // Guardar imágenes en la base de datos
      for (const img of images) {
        // Convertir a base64
        const compressedBase64 = await blobToBase64(img.compressed);
        const thumbnailBase64 = await blobToBase64(img.thumbnail);

        // Guardar en localDb
        await db.products.update(productId, {
          FOTO1: compressedBase64,
          FOTO1_THUMB: thumbnailBase64,
          UPDATED_AT: new Date().toISOString(),
        });
      }

      toast.success(`${images.length} imágenes importadas correctamente`);
      onClose();
    } catch (error) {
      console.error('Error importando imágenes:', error);
      toast.error('Error al importar imágenes');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Fotos del Producto</DialogTitle>
        </DialogHeader>

        <ImageImportPreview
          onImport={handleImport}
          maxFiles={3}
          autoCompress={true}
          compressionQuality={0.85}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## ⚙️ Configuración Avanzada

### Opciones de Compresión

```tsx
const compressionOptions = {
  maxWidth: 1920,        // Ancho máximo en píxeles
  maxHeight: 1920,       // Alto máximo en píxeles
  quality: 0.85,         // Calidad (0.0 - 1.0)
  format: 'webp',        // 'jpeg' | 'png' | 'webp'
  maxSizeMB: 2,          // Tamaño máximo en MB
};
```

### Validación Personalizada

```tsx
const validation = await validateImage(file);

// Validaciones incluidas:
// - Formato válido (JPG, PNG, WebP, GIF)
// - Tamaño máximo (10MB)
// - Dimensiones mínimas (100x100px)
// - Dimensiones máximas (10000x10000px)
// - Archivo no corrupto
```

### Procesamiento por Lotes

```tsx
// Procesar 20 imágenes, 3 simultáneas
const results = await processImagesInBatch(
  files,
  compressionOptions,
  (current, total) => {
    setProgress((current / total) * 100);
  },
  3 // Concurrencia
);
```

---

## 📝 Mejores Prácticas

### 1. Validar Antes de Comprimir

```tsx
const validation = await validateImage(file);
if (!validation.valid) {
  toast.error(validation.error);
  return;
}

const compressed = await compressImage(file);
```

### 2. Mostrar Progreso al Usuario

```tsx
const { isImporting, progress, currentFile } = useImageImport({
  onProgress: (current, total) => {
    console.log(`${current}/${total}: ${currentFile}`);
  },
});

return (
  <div>
    {isImporting && (
      <div>
        <Progress value={progress} />
        <p>Procesando: {currentFile}</p>
      </div>
    )}
  </div>
);
```

### 3. Manejar Errores Gracefully

```tsx
try {
  const result = await importImages(files);
  
  if (result.failed > 0) {
    console.error('Errores:', result.errors);
    toast.error(`${result.failed} imágenes fallaron`);
  }
  
  if (result.success > 0) {
    toast.success(`${result.success} imágenes importadas`);
  }
} catch (error) {
  toast.error('Error al importar imágenes');
}
```

### 4. Usar Thumbnails para Listas

```tsx
// Guardar thumbnail para listas
const thumbnail = await generateThumbnail(file, 200);

// Usar thumbnail en tablas/grids
<img src={thumbnailUrl} alt="Preview" className="w-12 h-12" />

// Cargar imagen completa solo al hacer click
<img src={fullImageUrl} alt="Full" className="w-full" />
```

### 5. Optimizar Almacenamiento

```tsx
// Convertir a WebP para mejor compresión
const compressed = await compressImage(file, {
  format: 'webp',
  quality: 0.85,
});

// Reducción típica: 60-70% del tamaño original
console.log('Ahorro:', formatFileSize(file.size - compressed.size));
```

---

## 🐛 Troubleshooting

### Imagen no se comprime

- Verificar que el formato sea compatible
- Revisar que las dimensiones sean mayores a 100x100px
- Comprobar que el archivo no esté corrupto

### Error "File too large"

- Reducir `maxSizeMB` en opciones
- Aumentar compresión (reducir `quality`)
- Redimensionar antes de comprimir

### Compresión muy lenta

- Reducir `maxWidth` y `maxHeight`
- Disminuir concurrencia en procesamiento por lotes
- Procesar menos imágenes simultáneamente

### Pérdida de calidad

- Aumentar `quality` (0.85 - 0.95)
- Usar formato PNG en lugar de WebP/JPEG
- Evitar redimensionar si no es necesario

---

**Última actualización:** 2026-03-09  
**Versión:** 2.1.0  
**Estado:** ✅ Listo para producción
