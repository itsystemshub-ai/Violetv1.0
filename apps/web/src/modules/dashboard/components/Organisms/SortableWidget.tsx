import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grid } from "lucide-react";

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  isEditMode: boolean;
  className?: string;
}

export function SortableWidget({
  id,
  children,
  isEditMode,
  className = "",
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? "drop-shadow-2xl scale-[1.02]" : ""} ${className}`}
    >
      {/* Drag Handle - Only visible in edit mode */}
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-50 hover:scale-110 transition-transform"
          title="Arrastrar para mover"
        >
          <Grid size={16} />
        </div>
      )}

      {/* Overlays during edit mode to prevent interacting with the content while dragging */}
      {isEditMode && (
        <div className="absolute inset-0 bg-transparent z-40" />
      )}

      {children}
    </div>
  );
}
