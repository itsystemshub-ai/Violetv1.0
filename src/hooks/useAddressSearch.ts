/**
 * useAddressSearch.ts
 * Hook para autocompletar direcciones venezolanas.
 * Usa Nominatim / OpenStreetMap — 100% gratuito, sin API key.
 * Límite: 1 req/segundo (debounce incluido).
 */

import { useState, useEffect } from "react";

export interface AddressResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    state?: string;
    city?: string;
    town?: string;
    suburb?: string;
  };
}

export const useAddressSearch = (query: string): AddressResult[] => {
  const [results, setResults] = useState<AddressResult[]>([]);

  useEffect(() => {
    if (!query || query.length < 4) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query + ", Venezuela")}` +
            `&countrycodes=ve&format=json&addressdetails=1&limit=5`,
          {
            headers: { "Accept-Language": "es" },
          }
        );
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.warn("[useAddressSearch] Error:", err);
        setResults([]);
      }
    }, 600); // debounce 600ms — respeta el límite de 1 req/seg

    return () => clearTimeout(timeout);
  }, [query]);

  return results;
};
