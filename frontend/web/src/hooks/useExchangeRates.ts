/**
 * useExchangeRates - Hook global para tasas de cambio
 * Integra con el sistema de configuración y proporciona tasas actualizadas
 */

import { useState, useEffect } from 'react';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';

export interface ExchangeRates {
  bcv: number;           // Tasa BCV oficial USD a Bs
  bcvEuro: number;       // Tasa BCV oficial EUR a Bs
  binance: number;       // Tasa Binance USD a Bs
  promedio: number;      // Tasa promedio calculada
}

const STORAGE_KEY = 'violet_exchange_rates';
const STORAGE_EVENT = 'violet_rates_updated';

export const useExchangeRates = () => {
  const { exchangeRate } = useSystemConfig();
  
  // Cargar tasas desde localStorage o usar valores por defecto
  const loadRates = (): ExchangeRates => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading exchange rates:', error);
    }
    return {
      bcv: 36.50,
      bcvEuro: 499.62,
      binance: 36.80,
      promedio: 36.65,
    };
  };

  const [rates, setRates] = useState<ExchangeRates>(loadRates);

  // Escuchar cambios en localStorage desde otros componentes
  useEffect(() => {
    const handleStorageChange = () => {
      const newRates = loadRates();
      setRates(newRates);
    };

    // Escuchar evento personalizado para actualizaciones en tiempo real
    window.addEventListener(STORAGE_EVENT, handleStorageChange);
    
    // Escuchar cambios en localStorage (para otras pestañas)
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        handleStorageChange();
      }
    });

    return () => {
      window.removeEventListener(STORAGE_EVENT, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Actualizar tasas cuando cambia el exchangeRate del sistema
  useEffect(() => {
    if (exchangeRate && exchangeRate > 1) {
      setRates(prev => {
        const newRates = { ...prev, bcv: exchangeRate };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRates));
        // Disparar evento para notificar a otros componentes
        window.dispatchEvent(new Event(STORAGE_EVENT));
        return newRates;
      });
    }
  }, [exchangeRate]);

  const updateRate = (type: keyof ExchangeRates, value: number) => {
    setRates(prev => {
      const newRates = { ...prev, [type]: value };
      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRates));
      // Disparar evento para notificar a otros componentes
      window.dispatchEvent(new Event(STORAGE_EVENT));
      return newRates;
    });
  };

  const getRateForPaymentMethod = (method: string): number => {
    switch (method) {
      case 'efectivo':
      case 'transferencia-bs':
        return rates.bcv;
      case 'binance':
        return rates.binance;
      default:
        return rates.promedio;
    }
  };

  return {
    rates,
    updateRate,
    getRateForPaymentMethod,
  };
};
