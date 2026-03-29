/**
 * useCurrencyStore - Global currency state for USD/BS toggle
 * Used across all modules to display values in Dólares or Bolívares
 */

import { create } from "zustand";

const DEFAULT_RATE = 86.88;

interface CurrencyState {
  currency: "USD" | "BS";
  exchangeRate: number;
  toggleCurrency: () => void;
  setCurrency: (c: "USD" | "BS") => void;
  setExchangeRate: (rate: number) => void;
  /** Format a value based on the current currency */
  formatMoney: (value: number) => string;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: "USD",
  exchangeRate: DEFAULT_RATE,

  toggleCurrency: () =>
    set((state) => ({
      currency: state.currency === "USD" ? "BS" : "USD",
    })),

  setCurrency: (c) => set({ currency: c }),

  setExchangeRate: (rate) => set({ exchangeRate: rate }),

  formatMoney: (value: number) => {
    const { currency, exchangeRate } = get();
    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
      return currency === "USD" ? "$0,00" : "Bs. 0,00";
    }
    if (currency === "BS") {
      const bsValue = value * exchangeRate;
      return `Bs. ${bsValue.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `$${value.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
}));
