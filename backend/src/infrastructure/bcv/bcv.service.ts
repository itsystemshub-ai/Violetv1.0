/**
 * bcvService.ts
 * Obtiene la tasa de cambio BCV (BsS/USD) desde pydolarve.org
 * Gratuita — sin API key.
 */

const BCV_URL = "https://pydolarve.org/api/v1/dollar?page=bcv";

export interface BCVRate {
  price: number;
  lastUpdate: string;
}

export const fetchBCVRate = async (): Promise<BCVRate | null> => {
  try {
    const res = await fetch(BCV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      price: data?.price ?? 0,
      lastUpdate: data?.last_update ?? new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[bcvService] No se pudo obtener la tasa BCV:", err);
    return null;
  }
};
