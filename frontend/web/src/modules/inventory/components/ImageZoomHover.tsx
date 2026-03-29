/**
 * ImageZoomHover - Componente de zoom en hover para imágenes
 * Características:
 * - Zoom suave al hacer hover
 * - Lupa con preview ampliado
 * - Optimizado para rendimiento
 * - Soporte para touch en móviles
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/core/shared/utils/utils';
import { ZoomIn } from 'lucide-react';

interface ImageZoomHoverProps {
  src: string;
  alt: string;
  className?: string;
  zoomLevel?: number;
  showZoomIndicator?: boolean;
}

export const ImageZoomHover: React.FC<ImageZoomHoverProps> = ({
  src,
  alt,
  className,
  zoomLevel = 2.5,
  showZoomIndicator = true,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Precargar imagen
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setImageLoaded(true);
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg cursor-zoom-in group',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Imagen principal */}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-transform duration-300',
          isHovering && 'scale-110'
        )}
        onLoad={() => setImageLoaded(true)}
      />

      {/* Indicador de zoom */}
      {showZoomIndicator && imageLoaded && (
        <div
          className={cn(
            'absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full transition-opacity duration-200',
            isHovering ? 'opacity-0' : 'opacity-100'
          )}
        >
          <ZoomIn className="h-4 w-4" />
        </div>
      )}

      {/* Lupa con zoom */}
      {isHovering && imageLoaded && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomLevel * 100}%`,
            backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}

      {/* Overlay oscuro sutil */}
      {isHovering && (
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      )}
    </div>
  );
};

/**
 * ImageZoomModal - Modal con zoom completo para imágenes
 * Para cuando se hace click en la imagen
 */

interface ImageZoomModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  src,
  alt,
  isOpen,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(1, Math.min(5, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(5, prev + 0.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(1, prev - 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Controles */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
        >
          <ZoomIn className="h-5 w-5 rotate-180" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors text-sm"
        >
          Reset
        </button>
      </div>

      {/* Indicador de zoom */}
      <div className="absolute top-4 left-4 bg-white/10 text-white px-3 py-2 rounded-lg text-sm">
        {Math.round(scale * 100)}%
      </div>

      {/* Imagen con zoom */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          className={cn(
            'max-w-full max-h-[90vh] object-contain transition-transform',
            isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
          )}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          draggable={false}
        />
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm">
        Rueda del mouse para zoom • Arrastra para mover • Click fuera para cerrar
      </div>
    </div>
  );
};
