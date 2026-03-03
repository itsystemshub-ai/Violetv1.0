/**
 * weatherService.ts
 * Obtiene el pronóstico del tiempo para Valencia, Carabobo.
 * Usa Open-Meteo API — 100% gratuita, sin API key, 10,000 req/día.
 */

// Coordenadas de Valencia, Carabobo, Venezuela
const LAT = 10.18;
const LON = -67.99;

export interface WeatherData {
  temperature: number;
  windspeed: number;
  isRaining: boolean;
  rainExpectedToday: boolean;
  precipitationMm: number;
  weatherCode: number;
}

export const getCaraboboWeather = async (): Promise<WeatherData | null> => {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${LAT}&longitude=${LON}` +
        `&current_weather=true` +
        `&daily=precipitation_sum,weathercode` +
        `&timezone=America%2FCaracas`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const current = data.current_weather;
    const rainToday = data.daily?.precipitation_sum?.[0] ?? 0;

    return {
      temperature: current?.temperature ?? 0,
      windspeed: current?.windspeed ?? 0,
      // WMO codes 51-67 = lluvia / 80-82 = chubascos
      isRaining: [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(
        current?.weathercode
      ),
      rainExpectedToday: rainToday > 5, // >5mm = lluvia significativa
      precipitationMm: rainToday,
      weatherCode: current?.weathercode ?? 0,
    };
  } catch (err) {
    console.warn("[weatherService] Error al obtener clima:", err);
    return null;
  }
};
