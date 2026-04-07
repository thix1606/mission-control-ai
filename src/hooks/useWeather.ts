// ============================================================
// HOOK — CLIMA VIA GEOLOCALIZAÇÃO + OPEN-METEO (API PÚBLICA)
// ============================================================
// Nenhuma chave de API necessária. Usa:
//   1. navigator.geolocation → coordenadas do browser
//   2. Open-Meteo API → dados meteorológicos
//   3. Nominatim (OpenStreetMap) → nome da cidade (reverse geocoding)
// ============================================================

import { useState, useEffect } from 'react';
import type { WeatherData } from '../types';

const WMO_CODES: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Principalmente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina com gelo',
  51: 'Chuvisco leve',
  53: 'Chuvisco moderado',
  55: 'Chuvisco denso',
  61: 'Chuva leve',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  71: 'Neve leve',
  73: 'Neve moderada',
  75: 'Neve forte',
  80: 'Chuva passageira leve',
  81: 'Chuva passageira moderada',
  82: 'Chuva passageira forte',
  95: 'Tempestade',
  96: 'Tempestade com granizo',
  99: 'Tempestade com granizo forte',
};

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste navegador.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Busca clima na Open-Meteo
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const weatherJson = await weatherRes.json();
          const cw = weatherJson.current_weather;

          // Reverse geocoding via Nominatim
          let city = 'Localização atual';
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'Accept-Language': 'pt-BR' } }
            );
            const geoJson = await geoRes.json();
            city =
              geoJson.address?.city ||
              geoJson.address?.town ||
              geoJson.address?.village ||
              geoJson.address?.state ||
              'Localização atual';
          } catch {
            // silencia erro de geocoding — não é crítico
          }

          setWeather({
            temperature: Math.round(cw.temperature),
            weatherCode: cw.weathercode,
            windspeed: Math.round(cw.windspeed),
            city,
          });
        } catch {
          setError('Não foi possível obter dados do clima.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Permissão de localização negada.');
        setLoading(false);
      }
    );
  }, []);

  const getDescription = (code: number) =>
    WMO_CODES[code] ?? 'Condição desconhecida';

  const getIcon = (code: number): string => {
    if (code === 0) return '☀️';
    if (code <= 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code <= 48) return '🌫️';
    if (code <= 55) return '🌦️';
    if (code <= 65) return '🌧️';
    if (code <= 75) return '❄️';
    if (code <= 82) return '🌧️';
    return '⛈️';
  };

  return { weather, loading, error, getDescription, getIcon };
}
