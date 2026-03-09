/**
 * Weather Service - Stub para frontend
 */

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

export async function getCaraboboWeather(): Promise<WeatherData> {
  // Stub: retorna datos mock
  return {
    temperature: 28,
    condition: 'Soleado',
    humidity: 65,
    windSpeed: 15,
  };
}
