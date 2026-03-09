/**
 * LazyImage - Componente de imagen con lazy loading
 * Características:
 * - Lazy loading nativo
 * - Placeholder mientras carga
 * - Fade in suave
 * - Error handling
 * - Skeleton loader
 */

import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/core/shared/utils/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: 'skeleton' | 'icon' | 'blur';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  objectFit = 'cover',
  placeholder = 'skeleton',
  onLoad,
  onError,
  fallbackSrc,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // Intentar con fallback si existe
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      onError?.();
    }
  };

  // Placeholder mientras carga
  const renderPlaceholder = () => {
    if (placeholder === 'skeleton') {
      return (
        <div
          className={cn(
            'animate-pulse bg-muted',
            className
          )}
          style={{ width, height }}
        />
      );
    }

    if (placeholder === 'icon') {
      return (
        <div
          className={cn(
            'flex items-center justify-center bg-muted',
            className
          )}
          style={{ width, height }}
        >
          <ImageIcon className="h-1/3 w-1/3 text-muted-foreground/30" />
        </div>
      );
    }

    return null;
  };

  // Error state
  if (hasError) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <AlertCircle className="h-1/3 w-1/3 mb-2" />
        <span className="text-xs">Error al cargar</span>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      {/* Placeholder */}
      {isLoading && renderPlaceholder()}

      {/* Imagen real */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0 absolute inset-0' : 'opacity-100',
          className
        )}
        style={{
          width,
          height,
          objectFit,
        }}
      />
    </div>
  );
};

/**
 * LazyImageWithIntersectionObserver - Versión con Intersection Observer
 * Para mayor control sobre cuándo cargar la imagen
 */
export const LazyImageWithObserver: React.FC<LazyImageProps & {
  rootMargin?: string;
  threshold?: number;
}> = ({
  src,
  alt,
  className,
  width,
  height,
  objectFit = 'cover',
  placeholder = 'skeleton',
  rootMargin = '50px',
  threshold = 0.01,
  onLoad,
  onError,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      style={{ width, height }}
    >
      {!isVisible || isLoading ? (
        placeholder === 'skeleton' ? (
          <div className="animate-pulse bg-muted w-full h-full" />
        ) : (
          <div className="flex items-center justify-center bg-muted w-full h-full">
            <ImageIcon className="h-1/3 w-1/3 text-muted-foreground/30" />
          </div>
        )
      ) : null}

      {hasError ? (
        <div className="flex flex-col items-center justify-center bg-muted text-muted-foreground w-full h-full">
          <AlertCircle className="h-1/3 w-1/3 mb-2" />
          <span className="text-xs">Error al cargar</span>
        </div>
      ) : null}

      {isVisible && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          style={{
            width,
            height,
            objectFit,
          }}
        />
      )}
    </div>
  );
};

/**
 * LazyImageGrid - Grid de imágenes con lazy loading optimizado
 */
export const LazyImageGrid: React.FC<{
  images: Array<{ src: string; alt: string; id: string }>;
  columns?: number;
  gap?: number;
  imageClassName?: string;
  onImageClick?: (id: string) => void;
}> = ({
  images,
  columns = 4,
  gap = 4,
  imageClassName,
  onImageClick,
}) => {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 0.25}rem`,
      }}
    >
      {images.map((image) => (
        <div
          key={image.id}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onImageClick?.(image.id)}
        >
          <LazyImage
            src={image.src}
            alt={image.alt}
            className={cn('w-full aspect-square rounded-lg', imageClassName)}
            objectFit="cover"
            placeholder="skeleton"
          />
        </div>
      ))}
    </div>
  );
};
