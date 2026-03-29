import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ImageIcon,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/core/shared/utils/utils";
import { useImageConverter } from "@/shared/hooks/useImageConverter";
import { ImageZoomHover } from "./ImageZoomHover";

/**
 * ImagePreviewModal - A premium lightbox for product photos
 */
const ImagePreviewModal = ({
  images,
  initialIndex,
  onClose,
  productName,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  productName: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 select-none"
      onClick={handleBackdropClick}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-20 px-6 flex items-center justify-between text-white bg-linear-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex flex-col pointer-events-auto">
          <h3 className="font-bold text-lg md:text-xl drop-shadow-md">
            {productName}
          </h3>
          <p className="text-sm opacity-70">Vista de Galería</p>
        </div>

        <button
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/20 pointer-events-auto shadow-xl"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="max-w-full max-h-[85vh] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <ImageZoomHover
              src={images[currentIndex]}
              alt={`${productName} - ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh]"
              zoomLevel={2.5}
              showZoomIndicator={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10 backdrop-blur-sm"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10 backdrop-blur-sm"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnails / Info */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4">
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto max-w-full px-4 py-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all opacity-50 hover:opacity-100",
                  idx === currentIndex
                    ? "border-primary opacity-100 scale-110 shadow-lg"
                    : "border-transparent",
                )}
              >
                <img
                  src={img}
                  className="w-full h-full object-contain p-1 bg-white/5"
                  alt=""
                />
              </button>
            ))}
          </div>
        )}
        <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white/90 text-sm font-medium">
          Imagen {currentIndex + 1} de {images.length}
        </div>
      </div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};

interface ProductImageCarouselProps {
  images: string[];
  productName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * ProductImageCarousel - The standard way to display product photos in tables/lists
 * Memoized to prevent heavy re-renders in large grids/lists.
 */
export const ProductImageCarousel: React.FC<ProductImageCarouselProps> =
  React.memo(({ images, productName = "Producto", size = "md", className }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Clean and robust images - Only run when images array actually changes
    const { images: convertedImages } = useImageConverter(images);
    const displayImages = useMemo(() => {
      return convertedImages.length > 0 ? convertedImages : [];
    }, [convertedImages]);

    useEffect(() => {
      if (currentIndex >= displayImages.length) {
        setCurrentIndex(0);
      }
    }, [displayImages.length, currentIndex]);

    const next = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % displayImages.length);
      setImageError(false);
    };

    const prev = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentIndex(
        (prev) => (prev - 1 + displayImages.length) % displayImages.length,
      );
      setImageError(false);
    };

    const carouselSizes = {
      sm: "w-10 h-10 rounded-lg",
      md: "w-14 h-14 rounded-xl",
      lg: "w-20 h-20 rounded-2xl",
    };

    if (!displayImages || displayImages.length === 0) {
      return (
        <div
          className={cn(
            carouselSizes[size],
            "bg-muted flex items-center justify-center border border-border/50 shrink-0",
            className,
          )}
        >
          <ImageIcon className="w-1/2 h-1/2 text-muted-foreground/30" />
        </div>
      );
    }

    return (
      <>
        <div
          className={cn(
            carouselSizes[size],
            "relative overflow-hidden group border border-border/50 shadow-sm bg-muted/20 shrink-0 cursor-zoom-in transition-all hover:ring-2 hover:ring-primary/20",
            className,
          )}
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}
        >
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-1/2 h-1/2 text-muted-foreground/30" />
            </div>
          ) : (
            <img
              src={displayImages[currentIndex]}
              alt={productName}
              className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}

          {/* Zoom Indicator */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
            <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
          </div>

          {/* Simple Pagination Indicator */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded font-bold z-10 pointer-events-none">
              {currentIndex + 1}/{displayImages.length}
            </div>
          )}

          {/* Quick Nav Controls */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-0 top-0 bottom-0 w-4 bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/50 z-20"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={next}
                className="absolute right-0 top-0 bottom-0 w-4 bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/50 z-20"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        <AnimatePresence>
          {showModal && (
            <ImagePreviewModal
              images={displayImages}
              initialIndex={currentIndex}
              onClose={() => setShowModal(false)}
              productName={productName}
            />
          )}
        </AnimatePresence>
      </>
    );
  });
