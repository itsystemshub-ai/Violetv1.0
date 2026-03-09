/**
 * ImageEditor - Editor de imágenes integrado
 * Características:
 * - Crop (recortar)
 * - Rotate (rotar)
 * - Flip (voltear)
 * - Zoom
 * - Filtros básicos
 * - Preview en tiempo real
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  ZoomIn,
  ZoomOut,
  Download,
  X,
  Check,
  Undo,
  Redo,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Slider } from '@/shared/components/ui/slider';
import { cn } from '@/core/shared/utils/utils';

interface ImageEditorProps {
  src: string;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
  className?: string;
}

interface Transform {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  zoom: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  src,
  onSave,
  onCancel,
  className,
}) => {
  const [transform, setTransform] = useState<Transform>({
    rotation: 0,
    flipH: false,
    flipV: false,
    zoom: 1,
    crop: null,
  });
  const [history, setHistory] = useState<Transform[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Cargar imagen
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current = img;
        drawImage();
      }
    };
  }, [src]);

  // Redibujar cuando cambian las transformaciones
  useEffect(() => {
    drawImage();
  }, [transform]);

  // Dibujar imagen en canvas
  const drawImage = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamaño del canvas
    canvas.width = 800;
    canvas.height = 600;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Guardar estado
    ctx.save();

    // Centrar
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Aplicar transformaciones
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(
      transform.zoom * (transform.flipH ? -1 : 1),
      transform.zoom * (transform.flipV ? -1 : 1)
    );

    // Dibujar imagen
    const scale = Math.min(
      canvas.width / img.width,
      canvas.height / img.height
    ) * 0.8;
    const width = img.width * scale;
    const height = img.height * scale;

    ctx.drawImage(img, -width / 2, -height / 2, width, height);

    // Dibujar área de crop si está activa
    if (transform.crop) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        transform.crop.x - width / 2,
        transform.crop.y - height / 2,
        transform.crop.width,
        transform.crop.height
      );
    }

    // Restaurar estado
    ctx.restore();
  };

  // Agregar al historial
  const addToHistory = (newTransform: Transform) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTransform);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setTransform(newTransform);
  };

  // Rotar
  const rotate = (degrees: number) => {
    addToHistory({
      ...transform,
      rotation: (transform.rotation + degrees) % 360,
    });
  };

  // Voltear
  const flip = (direction: 'h' | 'v') => {
    addToHistory({
      ...transform,
      flipH: direction === 'h' ? !transform.flipH : transform.flipH,
      flipV: direction === 'v' ? !transform.flipV : transform.flipV,
    });
  };

  // Zoom
  const handleZoom = (value: number[]) => {
    setTransform({
      ...transform,
      zoom: value[0],
    });
  };

  // Iniciar crop
  const startCrop = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCropStart({ x, y });
  };

  // Crop en movimiento
  const moveCrop = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping || !cropStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTransform({
      ...transform,
      crop: {
        x: Math.min(cropStart.x, x),
        y: Math.min(cropStart.y, y),
        width: Math.abs(x - cropStart.x),
        height: Math.abs(y - cropStart.y),
      },
    });
  };

  // Finalizar crop
  const endCrop = () => {
    if (transform.crop) {
      addToHistory(transform);
    }
    setCropStart(null);
  };

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTransform(history[historyIndex - 1]);
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTransform(history[historyIndex + 1]);
    }
  };

  // Guardar imagen editada
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/png');
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {/* Historial */}
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Rotar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => rotate(-90)}
            title="Rotar izquierda"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => rotate(90)}
            title="Rotar derecha"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Voltear */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => flip('h')}
            title="Voltear horizontal"
          >
            <FlipHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => flip('v')}
            title="Voltear vertical"
          >
            <FlipVertical className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Crop */}
          <Button
            variant={isCropping ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setIsCropping(!isCropping)}
            title="Recortar"
          >
            <Crop className="h-4 w-4" />
          </Button>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
        <canvas
          ref={canvasRef}
          className={cn(
            'border border-border rounded-lg shadow-lg bg-white',
            isCropping && 'cursor-crosshair'
          )}
          onMouseDown={startCrop}
          onMouseMove={moveCrop}
          onMouseUp={endCrop}
          onMouseLeave={endCrop}
        />
      </div>

      {/* Controles inferiores */}
      <div className="p-4 border-t space-y-4">
        {/* Zoom */}
        <div className="flex items-center gap-4">
          <ZoomOut className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[transform.zoom]}
            onValueChange={handleZoom}
            min={0.5}
            max={3}
            step={0.1}
            className="flex-1"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground w-12 text-right">
            {Math.round(transform.zoom * 100)}%
          </span>
        </div>

        {/* Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Rotación: {transform.rotation}°</span>
          {transform.crop && (
            <span>
              Crop: {Math.round(transform.crop.width)} x{' '}
              {Math.round(transform.crop.height)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * ImageEditorModal - Modal con editor de imágenes
 */
export const ImageEditorModal: React.FC<{
  src: string;
  isOpen: boolean;
  onSave: (blob: Blob) => void;
  onClose: () => void;
}> = ({ src, isOpen, onSave, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        <ImageEditor
          src={src}
          onSave={(blob) => {
            onSave(blob);
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};
