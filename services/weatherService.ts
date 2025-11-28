import { WeatherData, SearchResult } from '../types';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const GEO_REVERSE_URL = 'https://geocoding-api.open-meteo.com/v1/reverse';

// Haversine formula to calculate distance between two points in km
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

export const getWmoDescriptionKey = (code: number): string => {
  // Simplified mapping for demo purposes
  if (code === 0) return 'wmo_0';
  if (code === 1) return 'wmo_1';
  if (code === 2) return 'wmo_2';
  if (code === 3) return 'wmo_3';
  if (code === 45 || code === 48) return 'wmo_45';
  if (code >= 51 && code <= 55) return 'wmo_51';
  if (code >= 61 && code <= 65) return 'wmo_63';
  if (code >= 71 && code <= 77) return 'wmo_71';
  if (code >= 95) return 'wmo_95';
  return 'wmo_2'; // Fallback
};

interface ReverseGeoResult {
  name: string;
  country: string;
  isApproximate: boolean;
}

export const reverseGeocode = async (lat: number, lon: number, lang: string = 'en'): Promise<ReverseGeoResult | null> => {
  // Round coordinates to ~100m to improve cache hit rate
  const rLat = lat.toFixed(3);
  const rLon = lon.toFixed(3);
  const cacheKey = `geo_${rLat}_${rLon}_${lang}`;
  
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      // Cache valid for 12 hours
      if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) {
        return parsed.data;
      }
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  let geoResult: ReverseGeoResult | null = null;

  // 1. Try Open-Meteo first
  try {
    const res = await fetch(`${GEO_REVERSE_URL}?latitude=${lat}&longitude=${lon}&count=1&language=${lang}&format=json`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const distance = getDistanceFromLatLonInKm(lat, lon, result.latitude, result.longitude);
        
        geoResult = {
          name: result.name,
          country: result.country,
          isApproximate: distance > 5
        };
      }
    } else {
      console.warn("Open-Meteo returned status:", res.status);
    }
  } catch (e) {
    console.warn("Open-Meteo reverse geo failed, trying fallback", e);
  }

  // 2. Fallback to BigDataCloud (No key required, CORS friendly)
  if (!geoResult) {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`);
      if (res.ok) {
        const data = await res.json();
        const name = data.city || data.locality || data.principalSubdivision;
        const country = data.countryName;
        
        if (name) {
          geoResult = {
            name: name,
            country: country || '',
            isApproximate: false // Cannot accurately determine, assume valid
          };
        }
      }
    } catch (e) {
      console.error("Fallback reverse geo failed", e);
    }
  }

  if (geoResult) {
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: geoResult
    }));
    return geoResult;
  }
  
  return null;
};

export const searchCity = async (query: string, lang: string = 'en'): Promise<SearchResult[]> => {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(`${GEO_SEARCH_URL}?name=${encodeURIComponent(query)}&count=10&language=${lang}&format=json`);
    const data = await res.json();
    if (!data.results) return [];
    
    // Deduplicate results based on ID
    const seen = new Set();
    const results: SearchResult[] = [];

    for (const item of data.results) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        results.push({
          id: item.id,
          name: item.name,
          country: item.country,
          latitude: item.latitude,
          longitude: item.longitude,
          admin1: item.admin1
        });
      }
    }
    return results;
  } catch (e) {
    console.error("Geocoding error", e);
    return [];
  }
};

export const fetchWeather = async (lat: number, lon: number, cityName: string, isApproximate: boolean = false): Promise<WeatherData> => {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability,wind_speed_10m,relative_humidity_2m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto'
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch weather');
  const data = await res.json();

  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;

  // Map hourly (next 24 hours)
  const hourlyData = [];
  const currentHourISO = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  let startIndex = hourly.time.findIndex((t: string) => t.startsWith(currentHourISO));
  if (startIndex === -1) startIndex = 0;

  for (let i = startIndex; i < startIndex + 24; i++) {
    if (i >= hourly.time.length) break;
    hourlyData.push({
      timestamp: new Date(hourly.time[i]).getTime(),
      temp: hourly.temperature_2m[i],
      iconCode: hourly.weather_code[i],
      pop: hourly.precipitation_probability[i],
      windSpeed: hourly.wind_speed_10m[i],
      humidity: hourly.relative_humidity_2m[i]
    });
  }

  // Map daily
  const dailyData = [];
  for (let i = 0; i < 7; i++) {
    if (i >= daily.time.length) break;
    dailyData.push({
      timestamp: new Date(daily.time[i]).getTime(),
      minTemp: daily.temperature_2m_min[i],
      maxTemp: daily.temperature_2m_max[i],
      iconCode: daily.weather_code[i],
      pop: daily.precipitation_probability_max[i]
    });
  }

  return {
    current: {
      temp: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      description: getWmoDescriptionKey(current.weather_code),
      iconCode: current.weather_code,
      isDay: current.is_day === 1,
      timestamp: Date.now(),
    },
    hourly: hourlyData,
    daily: dailyData,
    location: {
      city: cityName,
      lat,
      lon,
      isApproximate
    },
    lastUpdated: Date.now()
  };
};

export const getCachedWeather = (key: string): WeatherData | null => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const data = JSON.parse(cached);
    // Simple TTL check: Current weather valid for 10 mins
    if (Date.now() - data.lastUpdated > 10 * 60 * 1000) {
      // Allow stale data for offline, but ideally refreshed
    }
    return data;
  } catch (e) {
    return null;
  }
};

export const saveWeatherToCache = (key: string, data: WeatherData) => {
  localStorage.setItem(key, JSON.stringify(data));
};
