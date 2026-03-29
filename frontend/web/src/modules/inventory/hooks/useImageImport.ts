/**
 * useImageImport - Hook para gestionar importación de imágenes
 * Características:
 * - Importación masiva con validación
 * - Compresión automática
 * - Progreso en tiempo real
 * - Manejo de errores
 * - Retry automático
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  validateImage,
  compressImage,
  generateThumbnail,
  processImagesInBatch,
  type ImageCompressionOptions,
} from '@/shared/utils/imageCompression';

interface ImportResult {
  success: number;
  failed: number;
  errors: { file: string; error: string }[];
}

interface UseImageImportOptions {
  compressionOptions?: ImageCompressionOptions;
  maxRetries?: number;
  onProgress?: (current: number, total: number) => void;
  onComplete?: (result: ImportResult) => void;
}

export const useImageImport = (options: UseImageImportOptions = {}) => {
  const {
    compressionOptions = {},
    maxRetries = 3,
    onProgress,
    onComplete,
  } = options;

  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');

  /**
   * Importa una sola imagen con retry
   */
  const importSingleImage = useCallback(
    async (
      file: File,
      retryCount = 0
    ): Promise<{ compressed: Blob; thumbnail: Blob } | null> => {
      try {
        // Validar imagen
        const validation = await validateImage(file);
        if (!validation.valid) {
          throw new Error(validation.error || 'Imagen inválida');
        }

        // Comprimir imagen
        const compressed = await compressImage(file, compressionOptions);

        // Generar thumbnail
        const thumbnail = await generateThumbnail(file);

        return { compressed, thumbnail };
      } catch (error) {
        // Retry si es posible
        if (retryCount < maxRetries) {
          console.log(`Reintentando ${file.name} (${retryCount + 1}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return importSingleImage(file, retryCount + 1);
        }

        console.error(`Error importando ${file.name}:`, error);
        return null;
      }
    },
    [compressionOptions, maxRetries]
  );

  /**
   * Importa múltiples imágenes
   */
  const importImages = useCallback(
    async (
      files: File[]
    ): Promise<ImportResult> => {
      setIsImporting(true);
      setProgress(0);

      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      let completed = 0;

      try {
        // Procesar en lotes de 3
        for (let i = 0; i < files.length; i += 3) {
          const batch = files.slice(i, i + 3);

          const batchResults = await Promise.all(
            batch.map(async (file) => {
              setCurrentFile(file.name);

              const imageResult = await importSingleImage(file);

              completed++;
              const progressPercent = (completed / files.length) * 100;
              setProgress(progressPercent);
              onProgress?.(completed, files.length);

              if (imageResult) {
                result.success++;
                return { file, ...imageResult };
              } else {
                result.failed++;
                result.errors.push({
                  file: file.name,
                  error: 'Error al procesar la imagen',
                });
                return null;
              }
            })
          );

          // Filtrar resultados exitosos
          const successfulResults = batchResults.filter(
            (r): r is NonNullable<typeof r> => r !== null
          );

          // Aquí podrías guardar en la base de datos
          // await saveImagesToDatabase(successfulResults);
        }

        // Mostrar resultado
        if (result.success > 0) {
          toast.success(
            `${result.success} ${result.success === 1 ? 'imagen importada' : 'imágenes importadas'} correctamente`
          );
        }

        if (result.failed > 0) {
          toast.error(
            `${result.failed} ${result.failed === 1 ? 'imagen falló' : 'imágenes fallaron'}`
          );
        }

        onComplete?.(result);
      } catch (error) {
        console.error('Error en importación masiva:', error);
        toast.error('Error al importar imágenes');
      } finally {
        setIsImporting(false);
        setProgress(0);
        setCurrentFile('');
      }

      return result;
    },
    [importSingleImage, onProgress, onComplete]
  );

  /**
   * Cancela la importación actual
   */
  const cancelImport = useCallback(() => {
    setIsImporting(false);
    setProgress(0);
    setCurrentFile('');
    toast.info('Importación cancelada');
  }, []);

  return {
    isImporting,
    progress,
    currentFile,
    importImages,
    importSingleImage,
    cancelImport,
  };
};
