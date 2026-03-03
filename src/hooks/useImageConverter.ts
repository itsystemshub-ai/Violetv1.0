import { useState, useEffect } from 'react';
import { convertImagePathToBase64 } from '@/utils/imageConverter';

/**
 * Hook para convertir automáticamente rutas de archivo a base64
 * Útil para mostrar imágenes que están guardadas como rutas
 */
export const useImageConverter = (images: string[] | undefined) => {
  const [convertedImages, setConvertedImages] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const convertImages = async () => {
      if (!images || images.length === 0) {
        setConvertedImages([]);
        return;
      }

      console.log(`🔄 useImageConverter: Procesando ${images.length} imagen(es)...`);

      setIsConverting(true);
      setError(null);

      try {
        const converted: string[] = [];

        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          console.log(`  📸 Imagen ${i + 1}/${images.length}:`, image.substring(0, 50));
          
          // Si ya es base64, usar tal cual
          if (image.startsWith('data:image/')) {
            console.log(`    ✅ Ya es base64, agregando...`);
            converted.push(image);
            continue;
          }

          // Si es URL http/https o blob, usar tal cual
          if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('blob:')) {
            console.log(`    ✅ Es URL, agregando...`);
            converted.push(image);
            continue;
          }

          // Si es ruta de archivo, convertir a base64
          if (image.startsWith('/') || image.includes('mangueras/')) {
            console.log(`    🔄 Es ruta de archivo, convirtiendo...`);
            const base64 = await convertImagePathToBase64(image);
            if (base64) {
              console.log(`    ✅ Convertida exitosamente`);
              converted.push(base64);
            } else {
              console.warn(`    ❌ No se pudo convertir imagen: ${image}`);
            }
            continue;
          }

          // Si no coincide con ningún formato, omitir
          console.warn(`    ⚠️ Formato no reconocido, omitiendo: ${image.substring(0, 50)}`);
        }

        console.log(`✅ useImageConverter: ${converted.length}/${images.length} imágenes procesadas`);
        setConvertedImages(converted);
      } catch (err) {
        console.error('Error convirtiendo imágenes:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsConverting(false);
      }
    };

    convertImages();
  }, [images]);

  return {
    images: convertedImages,
    isConverting,
    error,
    hasImages: convertedImages.length > 0,
  };
};
