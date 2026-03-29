/**
 * imageCompression - Utilidades para compresión y optimización de imágenes
 * Características:
 * - Compresión automática de imágenes grandes
 * - Conversión a formatos optimizados (WebP)
 * - Redimensionamiento inteligente
 * - Validación de formatos
 * - Generación de thumbnails
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxSizeMB?: number;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  format?: string;
  size?: number;
  width?: number;
  height?: number;
}

const DEFAULT_OPTIONS: ImageCompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  format: 'webp',
  maxSizeMB: 2,
};

/**
 * Valida si un archivo es una imagen válida
 */
export async function validateImage(file: File): Promise<ImageValidationResult> {
  // Validar tipo de archivo
  const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!validFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Formato no válido. Formatos aceptados: JPG, PNG, WebP, GIF`,
    };
  }

  // Validar tamaño del archivo (máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Archivo muy grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 10MB`,
    };
  }

  // Validar dimensiones de la imagen
  try {
    const dimensions = await getImageDimensions(file);
    
    // Validar dimensiones mínimas
    if (dimensions.width < 100 || dimensions.height < 100) {
      return {
        valid: false,
        error: `Imagen muy pequeña (${dimensions.width}x${dimensions.height}px). Mínimo: 100x100px`,
      };
    }

    // Validar dimensiones máximas
    if (dimensions.width > 10000 || dimensions.height > 10000) {
      return {
        valid: false,
        error: `Imagen muy grande (${dimensions.width}x${dimensions.height}px). Máximo: 10000x10000px`,
      };
    }

    return {
      valid: true,
      format: file.type,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Error al leer la imagen. Archivo corrupto o inválido.',
    };
  }
}

/**
 * Obtiene las dimensiones de una imagen
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = url;
  });
}

/**
 * Comprime una imagen según las opciones especificadas
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Cargar imagen
  const img = await loadImage(file);

  // Calcular nuevas dimensiones
  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    opts.maxWidth!,
    opts.maxHeight!
  );

  // Crear canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo crear el contexto del canvas');
  }

  // Configurar calidad de renderizado
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Dibujar imagen redimensionada
  ctx.drawImage(img, 0, 0, width, height);

  // Convertir a blob con compresión
  const mimeType = opts.format === 'webp' ? 'image/webp' : 
                   opts.format === 'png' ? 'image/png' : 'image/jpeg';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Error al comprimir la imagen'));
        }
      },
      mimeType,
      opts.quality
    );
  });
}

/**
 * Genera un thumbnail de una imagen
 */
export async function generateThumbnail(
  file: File,
  size: number = 200
): Promise<Blob> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.8,
    format: 'webp',
  });
}

/**
 * Carga una imagen desde un archivo
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = url;
  });
}

/**
 * Calcula las nuevas dimensiones manteniendo el aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Si la imagen es más pequeña que el máximo, no redimensionar
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // Calcular ratio
  const ratio = Math.min(maxWidth / width, maxHeight / height);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Convierte un Blob a Base64
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Error al convertir blob a base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convierte Base64 a Blob
 */
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Procesa múltiples imágenes en paralelo con límite de concurrencia
 */
export async function processImagesInBatch(
  files: File[],
  options: ImageCompressionOptions = {},
  onProgress?: (current: number, total: number) => void,
  concurrency: number = 3
): Promise<{ file: File; compressed: Blob; thumbnail: Blob }[]> {
  const results: { file: File; compressed: Blob; thumbnail: Blob }[] = [];
  let completed = 0;

  // Procesar en lotes
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        try {
          const compressed = await compressImage(file, options);
          const thumbnail = await generateThumbnail(file);
          
          completed++;
          onProgress?.(completed, files.length);
          
          return { file, compressed, thumbnail };
        } catch (error) {
          console.error(`Error procesando ${file.name}:`, error);
          throw error;
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Estima el tamaño final después de la compresión
 */
export function estimateCompressedSize(
  originalSize: number,
  quality: number = 0.85
): number {
  // Estimación aproximada basada en la calidad
  const compressionRatio = quality * 0.7; // WebP típicamente comprime ~30% mejor que JPEG
  return Math.round(originalSize * compressionRatio);
}

/**
 * Formatea el tamaño de archivo para mostrar
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
