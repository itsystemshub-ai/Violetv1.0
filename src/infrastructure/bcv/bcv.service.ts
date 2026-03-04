/**
 * BCV Service - Stub para frontend
 */

export interface BCVRate {
  rate: number;
  date: string;
  source: string;
}

export async function fetchBCVRate(): Promise<BCVRate> {
  // Stub: retorna tasa mock
  return {
    rate: 36.50,
    date: new Date().toISOString(),
    source: 'BCV',
  };
}
