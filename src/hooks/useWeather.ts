import { useState, useEffect, useCallback } from 'react';

interface WeatherData {
  temperature: number;
  location: string;
  humidity: number;
  description: string;
  icon: string;
  error?: string;
}

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '68f05abccccf00df45ceae49495918d9';
const UPDATE_INTERVAL = 30 * 60 * 1000;

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(async (latitude: number, longitude: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      
      setWeather({
        temperature: Math.round(data.main.temp),
        location: data.name,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeather({
        temperature: 0,
        location: 'Localização desconhecida',
        humidity: 0,
        description: 'Erro ao carregar',
        icon: '01d',
        error: 'Erro ao carregar dados meteorológicos',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setWeather({
        temperature: 0,
        location: 'Geolocalização não disponível',
        humidity: 0,
        description: 'N/A',
        icon: '01d',
        error: 'Geolocalização não suportada',
      });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setWeather({
          temperature: 0,
          location: 'Permissão negada',
          humidity: 0,
          description: 'Ative a geolocalização',
          icon: '01d',
          error: 'Erro ao obter localização',
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [fetchWeather]);

  useEffect(() => {
    getLocation();

    const interval = setInterval(() => {
      getLocation();
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [getLocation]);

  return { weather, loading };
}
