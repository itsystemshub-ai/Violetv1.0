import { useState, useEffect } from 'react';
import { convertImagePathToBase64 } from '@/utils/imageConverter';

/**
 * Hook para convertir autom├íticamente rutas de archivo a base64
 * ├Ütil para mostrar im├ígenes que est├ín guardadas como rutas
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

      console.log(`­ƒöä useImageConverter: Procesando ${images.length} imagen(es)...`);

      setIsConverting(true);
      setError(null);

      try {
        const converted: string[] = [];

        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          console.log(`  ­ƒô© Imagen ${i + 1}/${images.length}:`, image.substring(0, 50));
          
          // Si ya es base64, usar tal cual
          if (image.startsWith('data:image/')) {
            console.log(`    Ô£à Ya es base64, agregando...`);
            converted.push(image);
            continue;
          }

          // Si es URL http/https o blob, usar tal cual
          if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('blob:')) {
            console.log(`    Ô£à Es URL, agregando...`);
            converted.push(image);
            continue;
          }

          // Si es ruta de archivo, convertir a base64
          if (image.startsWith('/') || image.includes('mangueras/')) {
            console.log(`    ­ƒöä Es ruta de archivo, convirtiendo...`);
            const base64 = await convertImagePathToBase64(image);
            if (base64) {
              console.log(`    Ô£à Convertida exitosamente`);
              converted.push(base64);
            } else {
              console.warn(`    ÔØî No se pudo convertir imagen: ${image}`);
            }
            continue;
          }

          // Si no coincide con ning├║n formato, omitir
          console.warn(`    ÔÜá´©Å Formato no reconocido, omitiendo: ${image.substring(0, 50)}`);
        }

        console.log(`Ô£à useImageConverter: ${converted.length}/${images.length} im├ígenes procesadas`);
        setConvertedImages(converted);
      } catch (err) {
        console.error('Error convirtiendo im├ígenes:', err);
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
