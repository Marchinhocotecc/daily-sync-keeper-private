import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Thermometer } from 'lucide-react';
import { LifeSyncCard } from './LifeSyncCard';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  location: string;
}

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 22,
    condition: 'Soleggiato',
    humidity: 65,
    location: 'Milano'
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'soleggiato':
      case 'sereno':
        return <Sun className="text-warning" size={24} />;
      case 'nuvoloso':
        return <Cloud className="text-muted-foreground" size={24} />;
      case 'pioggia':
        return <CloudRain className="text-info" size={24} />;
      default:
        return <Sun className="text-warning" size={24} />;
    }
  };

  return (
    <LifeSyncCard className="mobile-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            {getWeatherIcon(weather.condition)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-foreground">
                {weather.temp}°
              </span>
              <div className="text-sm text-muted-foreground">
                <div>{weather.condition}</div>
                <div>{weather.location}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Thermometer size={16} />
            <span>Umidità {weather.humidity}%</span>
          </div>
        </div>
      </div>
    </LifeSyncCard>
  );
};

export { WeatherWidget };