export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    description: string;
    iconCode: number;
    isDay: boolean;
    timestamp: number;
  };
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  location: {
    city: string;
    lat: number;
    lon: number;
    isApproximate?: boolean;
  };
  lastUpdated: number;
}

export interface HourlyForecast {
  timestamp: number;
  temp: number;
  iconCode: number;
  pop: number; // Probability of precipitation
  windSpeed?: number;
  humidity?: number;
}

export interface DailyForecast {
  timestamp: number;
  minTemp: number;
  maxTemp: number;
  iconCode: number;
  pop: number;
  description?: string;
}

export enum Language {
  EN = 'en',
  FR = 'fr',
  AR = 'ar',
}

export enum Theme {
  SYSTEM = 'system',
  LIGHT = 'light',
  DARK = 'dark',
}

export interface UserPreferences {
  language: Language;
  theme: Theme;
  units: 'metric' | 'imperial';
}

export interface SearchResult {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

export interface AISuggestion {
  outfit: string;
  activities: string;
  summary: string;
}