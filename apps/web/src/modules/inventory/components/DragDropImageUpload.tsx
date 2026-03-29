/**
 * DragDropImageUpload - Componente simple de drag & drop para imágenes
 * Versión simplificada para integración rápida
 */

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/core/shared/utils/utils';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { formatFileSize } from '@/shared/utils/imageCompression';

interface DragDropImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string[];
  disabled?: boolean;
  className?: string;
}

export const DragDropImageUpload: React.FC<DragDropImageUploadProps> = ({
  onFilesSelected,
  maxFiles = 20,
  maxSizeMB = 10,
  accept = ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  disabled = false,
  className,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<{ file: File; error: string }[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      // Validar tamaño
      const validFiles: File[] = [];
      const invalid: { file: File; error: string }[] = [];

      acceptedFiles.forEach((file) => {
        const sizeMB = file.size / 1024 / 1024;
        if (sizeMB > maxSizeMB) {
          invalid.push({
            file,
            error: `Archivo muy grande (${sizeMB.toFixed(2)}MB). Máximo: ${maxSizeMB}MB`,
          });
        } else {
          validFiles.push(file);
        }
      });

      // Agregar rechazados por dropzone
      fileRejections.forEach(({ file, errors }) => {
        invalid.push({
          file,
          error: errors.map((e: any) => e.message).join(', '),
        });
      });

      setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, maxFiles));
      setRejectedFiles((prev) => [...prev, ...invalid]);

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [maxFiles, maxSizeMB, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': accept,
    },
    maxFiles,
    disabled,
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeRejected = (index: number) => {
    setRejectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setRejectedFiles([]);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zona de drop */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-accent/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          {isDragActive ? (
            <div>
              <p className="text-lg font-semibold">Suelta las imágenes aquí</p>
              <p className="text-sm text-muted-foreground mt-1">
                Se procesarán automáticamente
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold">
                Arrastra imágenes aquí o haz click
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {accept.join(', ')} • Máximo {maxFiles} archivos • {maxSizeMB}MB por archivo
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Archivos seleccionados */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Archivos Seleccionados ({selectedFiles.length})
            </h4>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Limpiar Todo
            </Button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatFileSize(file.size)}
                  </Badge>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors shrink-0"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archivos rechazados */}
      {rejectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            Archivos Rechazados ({rejectedFiles.length})
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {rejectedFiles.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <p className="text-xs text-destructive">{item.error}</p>
                </div>
                <button
                  onClick={() => removeRejected(index)}
                  className="p-1 hover:bg-destructive/20 rounded transition-colors shrink-0"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Versión compacta para usar en modales pequeños
 */
export const DragDropImageUploadCompact: React.FC<DragDropImageUploadProps> = ({
  onFilesSelected,
  maxFiles = 10,
  disabled = false,
  className,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles.slice(0, maxFiles));
    },
    [maxFiles, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
    },
    maxFiles,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-accent/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium">
        {isDragActive ? 'Suelta aquí' : 'Arrastra o haz click'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Máximo {maxFiles} imágenes
      </p>
    </div>
  );
};
