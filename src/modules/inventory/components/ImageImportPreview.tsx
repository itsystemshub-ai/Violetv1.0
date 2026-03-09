/**
 * ImageImportPreview - Preview de imágenes antes de importar
 * Características:
 * - Vista previa de todas las imágenes
 * - Validación automática
 * - Compresión opcional
 * - Drag & drop
 * - Eliminación de imágenes individuales
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  FileImage,
  Trash2,
  ZoomIn,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { cn } from '@/core/shared/utils/utils';
import {
  validateImage,
  compressImage,
  generateThumbnail,
  formatFileSize,
  estimateCompressedSize,
  type ImageValidationResult,
} from '@/shared/utils/imageCompression';
import { ImageZoomModal } from './ImageZoomHover';

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
  validation: ImageValidationResult;
  compressed?: Blob;
  thumbnail?: Blob;
  status: 'pending' | 'validating' | 'valid' | 'invalid' | 'compressing' | 'ready';
  error?: string;
}

interface ImageImportPreviewProps {
  onImport: (images: { file: File; compressed: Blob; thumbnail: Blob }[]) => void;
  maxFiles?: number;
  autoCompress?: boolean;
  compressionQuality?: number;
  className?: string;
}

export const ImageImportPreview: React.FC<ImageImportPreviewProps> = ({
  onImport,
  maxFiles = 20,
  autoCompress = true,
  compressionQuality = 0.85,
  className,
}) => {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Drag & drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Limitar número de archivos
    const filesToProcess = acceptedFiles.slice(0, maxFiles - images.length);

    // Crear previews iniciales
    const newImages: ImagePreview[] = filesToProcess.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      validation: { valid: false },
      status: 'pending',
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Validar y comprimir en paralelo
    await processImages(newImages);
  }, [images.length, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    },
    maxFiles: maxFiles - images.length,
    disabled: images.length >= maxFiles || isProcessing,
  });

  // Procesar imágenes (validar y comprimir)
  const processImages = async (imagesToProcess: ImagePreview[]) => {
    setIsProcessing(true);
    let completed = 0;

    for (const image of imagesToProcess) {
      try {
        // Actualizar estado: validando
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id ? { ...img, status: 'validating' } : img
          )
        );

        // Validar imagen
        const validation = await validateImage(image.file);

        if (!validation.valid) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id
                ? { ...img, status: 'invalid', validation, error: validation.error }
                : img
            )
          );
          completed++;
          setProgress((completed / imagesToProcess.length) * 100);
          continue;
        }

        // Actualizar estado: válida
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id ? { ...img, status: 'valid', validation } : img
          )
        );

        // Comprimir si está habilitado
        if (autoCompress) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id ? { ...img, status: 'compressing' } : img
            )
          );

          const compressed = await compressImage(image.file, {
            quality: compressionQuality,
            format: 'webp',
          });

          const thumbnail = await generateThumbnail(image.file);

          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id
                ? { ...img, status: 'ready', compressed, thumbnail }
                : img
            )
          );
        } else {
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id ? { ...img, status: 'ready' } : img
            )
          );
        }

        completed++;
        setProgress((completed / imagesToProcess.length) * 100);
      } catch (error) {
        console.error(`Error procesando ${image.file.name}:`, error);
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? { ...img, status: 'invalid', error: 'Error al procesar la imagen' }
              : img
          )
        );
        completed++;
        setProgress((completed / imagesToProcess.length) * 100);
      }
    }

    setIsProcessing(false);
    setProgress(0);
  };

  // Eliminar imagen
  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  // Importar imágenes válidas
  const handleImport = () => {
    const validImages = images
      .filter((img) => img.status === 'ready' && img.compressed && img.thumbnail)
      .map((img) => ({
        file: img.file,
        compressed: img.compressed!,
        thumbnail: img.thumbnail!,
      }));

    if (validImages.length > 0) {
      onImport(validImages);
      // Limpiar previews
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
    }
  };

  // Limpiar todo
  const handleClear = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const validCount = images.filter((img) => img.status === 'ready').length;
  const invalidCount = images.filter((img) => img.status === 'invalid').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zona de drop */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/50',
          (images.length >= maxFiles || isProcessing) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium">Suelta las imágenes aquí...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Arrastra imágenes aquí o haz click para seleccionar
            </p>
            <p className="text-sm text-muted-foreground">
              Formatos: JPG, PNG, WebP, GIF • Máximo: {maxFiles} imágenes
            </p>
            {images.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {images.length} / {maxFiles} imágenes cargadas
              </p>
            )}
          </>
        )}
      </div>

      {/* Barra de progreso */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Procesando imágenes...</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Estadísticas */}
      {images.length > 0 && (
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <FileImage className="h-3 w-3" />
            Total: {images.length}
          </Badge>
          {validCount > 0 && (
            <Badge variant="default" className="gap-1">
              <Check className="h-3 w-3" />
              Válidas: {validCount}
            </Badge>
          )}
          {invalidCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Inválidas: {invalidCount}
            </Badge>
          )}
        </div>
      )}

      {/* Grid de previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                {/* Preview de imagen */}
                <div
                  className="aspect-square rounded-lg overflow-hidden bg-muted relative cursor-pointer"
                  onClick={() => setSelectedImage(image.preview)}
                >
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay con estado */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </div>

                  {/* Indicador de estado */}
                  <div className="absolute top-2 right-2">
                    {image.status === 'validating' && (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    )}
                    {image.status === 'compressing' && (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    )}
                    {image.status === 'valid' && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {image.status === 'ready' && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {image.status === 'invalid' && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id);
                    }}
                    className="absolute top-2 left-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Info */}
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium truncate" title={image.file.name}>
                    {image.file.name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(image.file.size)}</span>
                    {image.validation.width && image.validation.height && (
                      <span>
                        {image.validation.width}x{image.validation.height}
                      </span>
                    )}
                  </div>
                  {image.compressed && (
                    <p className="text-xs text-green-600">
                      Comprimida: {formatFileSize(image.compressed.size)}
                    </p>
                  )}
                  {image.error && (
                    <p className="text-xs text-destructive">{image.error}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Acciones */}
      {images.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Todo
          </Button>

          <Button
            onClick={handleImport}
            disabled={validCount === 0 || isProcessing}
          >
            <Check className="h-4 w-4 mr-2" />
            Importar {validCount} {validCount === 1 ? 'Imagen' : 'Imágenes'}
          </Button>
        </div>
      )}

      {/* Modal de zoom */}
      {selectedImage && (
        <ImageZoomModal
          src={selectedImage}
          alt="Preview"
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};
