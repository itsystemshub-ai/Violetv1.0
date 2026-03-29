import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  zoomLevel: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoom: (level: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      zoomLevel: 1.0,
      zoomIn: () =>
        set((state) => ({
          zoomLevel: Math.min(state.zoomLevel + 0.1, 2.0),
        })),
      zoomOut: () =>
        set((state) => ({
          zoomLevel: Math.max(state.zoomLevel - 0.1, 0.5),
        })),
      resetZoom: () => set({ zoomLevel: 1.0 }),
      setZoom: (level: number) => set({ zoomLevel: level }),
    }),
    {
      name: "violet-ui-storage",
    }
  )
);
