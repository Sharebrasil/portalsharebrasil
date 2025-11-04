import { Cloud, CloudRain, Sun, Wind } from "lucide-react";
import { useEffect, useState } from "react";

interface WeatherData {
  temperature?: number;
  condition?: string;
  humidity?: number;
  windSpeed?: number;
}

export function WeatherDisplay() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-23.5505&longitude=-46.6333&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=America/Sao_Paulo"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather");
        }

        const data = await response.json();
        const current = data.current;

        setWeather({
          temperature: Math.round(current.temperature_2m),
          condition: getWeatherCondition(current.weather_code),
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
        });
        setError(null);
      } catch (err) {
        setError("Unable to load weather");
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);

    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = () => {
    if (!weather?.condition) return <Cloud className="h-5 w-5" />;

    if (weather.condition.includes("rain")) {
      return <CloudRain className="h-5 w-5 text-blue-400" />;
    }
    if (weather.condition.includes("clear") || weather.condition.includes("sunny")) {
      return <Sun className="h-5 w-5 text-yellow-400" />;
    }
    return <Cloud className="h-5 w-5 text-gray-400" />;
  };

  if (loading || error || !weather) {
    return null;
  }

  return (
    <div className="hidden lg:flex items-center space-x-2 px-3 py-2 rounded-lg bg-accent/50 text-sm">
      {getWeatherIcon()}
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">{weather.temperature}°C</span>
        <span className="text-xs text-muted-foreground">
          {weather.humidity}% • {weather.windSpeed} km/h
        </span>
      </div>
    </div>
  );
}

function getWeatherCondition(code: number): string {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "cloudy";
  if (code === 3) return "overcast";
  if ([45, 48].includes(code)) return "foggy";
  if ([51, 53, 55, 61, 63, 65, 71, 73, 75, 80, 81, 82].includes(code)) return "rain";
  if ([85, 86].includes(code)) return "rain shower";
  if ([80, 81, 82].includes(code)) return "rain";
  return "cloudy";
}
