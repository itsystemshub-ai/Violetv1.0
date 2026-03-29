import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WidgetId =
  | "revenue_chart"
  | "top_products"
  | "financial_balance"
  | "critical_stock"
  | "human_resources"
  | "ai_purchase_suggestions";

interface DashboardState {
  widgetOrder: WidgetId[];
  hiddenWidgets: WidgetId[];
  setWidgetOrder: (order: WidgetId[]) => void;
  toggleWidgetVisibility: (id: WidgetId) => void;
  resetLayout: () => void;
}

const DEFAULT_LAYOUT: WidgetId[] = [
  "revenue_chart",
  "top_products",
  "financial_balance",
  "critical_stock",
  "human_resources",
  "ai_purchase_suggestions",
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgetOrder: [...DEFAULT_LAYOUT],
      hiddenWidgets: [],

      setWidgetOrder: (order) => set({ widgetOrder: order }),

      toggleWidgetVisibility: (id) =>
        set((state) => {
          const isHidden = state.hiddenWidgets.includes(id);
          return {
            hiddenWidgets: isHidden
              ? state.hiddenWidgets.filter((w) => w !== id)
              : [...state.hiddenWidgets, id],
          };
        }),

      resetLayout: () =>
        set({
          widgetOrder: [...DEFAULT_LAYOUT],
          hiddenWidgets: [],
        }),
    }),
    {
      name: "violet-dashboard-layout",
    },
  ),
);
