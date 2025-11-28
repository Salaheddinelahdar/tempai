import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sun, Moon, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, 
  MapPin, Search, Navigation, Calendar, Wind, Droplets, Thermometer,
  Menu, X, Sparkles, AlertCircle, Loader2, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { enUS, fr, arMA } from 'date-fns/locale';
import AskAI from './components/AskAI';
import Button from './components/Button';
import { fetchWeather, searchCity, getCachedWeather, saveWeatherToCache, getWmoDescriptionKey, reverseGeocode } from './services/weatherService';
import { WeatherData, SearchResult, Theme, Language } from './types';
console.log("App.tsx loaded");
// --- Icons Component ---
const WeatherIcon: React.FC<{ code: number; className?: string }> = ({ code, className = "w-6 h-6" }) => {
  if (code === 0 || code === 1) return <Sun className={`${className} text-yellow-500`} />;
  if (code === 2) return <Cloud className={`${className} text-yellow-400`} />; // Partly
  if (code === 3) return <Cloud className={`${className} text-gray-400`} />; // Overcast
  if ([45, 48].includes(code)) return <CloudFog className={`${className} text-slate-400`} />;
  if (code >= 51 && code <= 67) return <CloudRain className={`${className} text-blue-400`} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={`${className} text-cyan-200`} />;
  if (code >= 95) return <CloudLightning className={`${className} text-purple-500`} />;
  return <Cloud className={className} />;
};

// --- Helper Functions ---
const getDateLocale = (lang: string) => {
  switch (lang) {
    case 'fr': return fr;
    case 'ar': return arMA;
    default: return enUS;
  }
};

const formatTime = (timestamp: number, lang: string) => {
  return new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: 'numeric' }).format(new Date(timestamp));
};

const formatDay = (timestamp: number, lang: string) => {
  return format(new Date(timestamp), 'EEEE', { locale: getDateLocale(lang) });
};

// --- Components ---

const CurrentWeatherCard: React.FC<{ weather: WeatherData; onAskAI: () => void }> = ({ weather, onAskAI }) => {
  const { t, i18n } = useTranslation();
  
  return (
    <div className="relative overflow-hidden bg-white dark:bg-card rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="text-center md:text-start rtl:md:text-right">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2 justify-center md:justify-start rtl:md:justify-end flex-wrap">
            <MapPin className="w-6 h-6 text-primary" />
            {weather.location.city}
          </h2>
          {weather.location.isApproximate && (
             <div className="flex items-center justify-center md:justify-start rtl:md:justify-end gap-1 mt-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
               <Info className="w-3 h-3" />
               <span>{t('location.approxLabel')}</span>
             </div>
          )}
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg capitalize">
            {format(new Date(weather.current.timestamp), 'EEEE, d MMMM', { locale: getDateLocale(i18n.language) })}
          </p>
          
          <div className="mt-6 flex items-center justify-center md:justify-start rtl:md:justify-end gap-4">
             <span className="text-7xl font-bold text-gray-900 dark:text-white tracking-tighter">
               {Math.round(weather.current.temp)}°
             </span>
             <div className="flex flex-col items-center">
                <WeatherIcon code={weather.current.iconCode} className="w-12 h-12" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
                  {t(weather.current.description)}
                </span>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl">
             <div className="flex flex-col items-center gap-1">
                <Wind className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-bold dark:text-gray-200">{weather.current.windSpeed} <span className="text-xs font-normal">{t('kmh')}</span></span>
                <span className="text-xs text-gray-500">{t('wind')}</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <Droplets className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-bold dark:text-gray-200">{weather.current.humidity}%</span>
                <span className="text-xs text-gray-500">{t('humidity')}</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <Thermometer className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-bold dark:text-gray-200">{Math.round(weather.current.feelsLike)}°</span>
                <span className="text-xs text-gray-500">{t('feels_like')}</span>
             </div>
          </div>
          
          <Button
            variant="action"
            fullWidth
            onClick={onAskAI}
            aria-label={t('askTempAI.button')}
            title={t('askTempAI.hint')}
            icon={<Sparkles className="w-5 h-5" />}
          >
            {t('askTempAI.button')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const HourlyForecastStrip: React.FC<{ data: WeatherData['hourly'] }> = ({ data }) => {
  const { t, i18n } = useTranslation();
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <div className="w-1 h-6 bg-primary rounded-full"></div>
        {t('hourly_forecast')}
      </h3>
      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar touch-pan-x" style={{ scrollbarWidth: 'none' }}>
        {data.map((hour, idx) => (
          <div key={idx} className="flex-shrink-0 min-w-[70px] flex flex-col items-center p-3 rounded-2xl bg-white dark:bg-card border border-gray-100 dark:border-gray-700 hover:border-primary/50 transition-colors cursor-pointer group">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {formatTime(hour.timestamp, i18n.language)}
            </span>
            <WeatherIcon code={hour.iconCode} className="w-8 h-8 my-3 group-hover:scale-110 transition-transform" />
            <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{Math.round(hour.temp)}°</span>
            <div className="flex items-center gap-1 mt-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-500 font-medium">{hour.pop}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DailyForecastList: React.FC<{ data: WeatherData['daily'] }> = ({ data }) => {
  const { t, i18n } = useTranslation();
  return (
    <div className="space-y-4">
       <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <div className="w-1 h-6 bg-accent rounded-full"></div>
        {t('daily_forecast')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((day, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-xl">
                 <WeatherIcon code={day.iconCode} className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                  {idx === 0 ? t('current_weather') : formatDay(day.timestamp, i18n.language)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {t(getWmoDescriptionKey(day.iconCode))}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex gap-2 text-sm font-bold">
                <span className="text-gray-800 dark:text-white">{Math.round(day.maxTemp)}°</span>
                <span className="text-gray-400">{Math.round(day.minTemp)}°</span>
              </div>
              {day.pop > 0 && (
                 <div className="flex items-center gap-1 mt-1">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-500 font-medium">{day.pop}%</span>
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(Theme.SYSTEM);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === Theme.DARK || (theme === Theme.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  // Handle direction changes
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const loadWeather = useCallback(async (lat: number, lon: number, city: string, isApproximate: boolean = false) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setSearchQuery('');
    try {
      const data = await fetchWeather(lat, lon, city, isApproximate);
      setWeather(data);
      saveWeatherToCache('last_weather', data);
    } catch (err) {
      setError(t('error_weather'));
      // Try fallback to cache
      const cached = getCachedWeather('last_weather');
      if (cached) setWeather(cached);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Search Debounce Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const results = await searchCity(searchQuery, i18n.language);
          setSearchResults(results);
        } catch (e) {
          console.error("Search failed", e);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, i18n.language]);

  const handleUseGPS = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setError(t('error_location'));
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geoData = await reverseGeocode(latitude, longitude, i18n.language);
          
          let cityName = t('location.unknownLabel');
          // If we have no geoData, we default to approximate as we only have coords
          let isApproximate = true; 

          if (geoData) {
            const prefix = geoData.isApproximate ? `${t('near')} ` : '';
            cityName = `${prefix}${geoData.name}, ${geoData.country}`;
            isApproximate = geoData.isApproximate;
          }
          
          loadWeather(latitude, longitude, cityName, isApproximate);
          setIsMenuOpen(false); // Close menu on success
        } catch (e) {
          console.error(e);
          // Fallback if reverse geo fails but we have coords
          loadWeather(pos.coords.latitude, pos.coords.longitude, t('location.unknownLabel'), true);
          setIsMenuOpen(false);
        }
      },
      (err) => {
        console.error(err);
        setError(t('error_location'));
        setLoading(false);
      }
    );
  };

  // Initial load
  useEffect(() => {
    const cached = getCachedWeather('last_weather');
    if (cached) {
      setWeather(cached);
      setLoading(false);
    } else {
      loadWeather(51.5074, -0.1278, "London, United Kingdom"); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 font-sans ${i18n.language === 'ar' ? 'font-arabic' : ''}`}>
      
      {/* Header / Navbar */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                 <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white hidden sm:block">TempAI</span>
            </div>

            {/* Search Bar - Centered */}
            <div className="flex-1 max-w-lg mx-4 relative group">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-full pl-10 pr-10 py-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-2.5 w-5 h-5 text-primary animate-spin" />
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {(searchQuery.length > 2) && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-card rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {isSearching ? (
                     <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                       {t('searching')}
                     </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => {
                          const displayName = city.admin1 ? `${city.name}, ${city.country}` : city.name;
                          loadWeather(city.latitude, city.longitude, displayName);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex flex-col">
                           <span className="text-gray-800 dark:text-gray-200 font-medium">{city.name}</span>
                           <span className="text-xs text-gray-500 group-hover:text-primary">
                             {[city.admin1, city.country].filter(Boolean).join(', ')}
                           </span>
                        </div>
                        <MapPin className="w-4 h-4 text-gray-300 group-hover:text-primary" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                       {t('no_results')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button onClick={handleUseGPS} className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors hidden sm:block" title={t('my_current_location')}>
                <Navigation className="w-5 h-5" />
              </button>
              
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg md:hidden">
                <Menu className="w-6 h-6" />
              </button>

              <div className="hidden md:flex items-center gap-3">
                 {/* Theme Toggle */}
                 <button 
                  onClick={() => setTheme(prev => prev === Theme.DARK ? Theme.LIGHT : Theme.DARK)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"
                 >
                   {theme === Theme.DARK ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                 </button>
                 
                 {/* Lang Switch */}
                 <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                    {[Language.EN, Language.FR, Language.AR].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => i18n.changeLanguage(lang)}
                        className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${i18n.language === lang ? 'bg-white dark:bg-slate-600 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-card px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
             <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('settings')}</span>
                <button onClick={() => setIsMenuOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
             </div>
             
             <div className="flex items-center justify-between">
               <span className="text-gray-800 dark:text-gray-200">{t('theme')}</span>
               <div className="flex gap-3 bg-gray-50 dark:bg-slate-800/50 p-1 rounded-full border border-gray-100 dark:border-gray-700">
                 <button 
                  onClick={() => setTheme(Theme.LIGHT)} 
                  className={`p-2 rounded-full transition-all ${theme === Theme.LIGHT ? 'bg-white shadow-sm text-yellow-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                 >
                   <Sun className="w-5 h-5"/>
                 </button>
                 <button 
                  onClick={() => setTheme(Theme.DARK)} 
                  className={`p-2 rounded-full transition-all ${theme === Theme.DARK ? 'bg-slate-700 shadow-sm text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                 >
                   <Moon className="w-5 h-5"/>
                 </button>
               </div>
             </div>

             <div className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-200">{t('language')}</span>
                <div className="flex gap-2">
                  {[Language.EN, Language.FR, Language.AR].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => i18n.changeLanguage(lang)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${i18n.language === lang ? 'border-primary text-primary bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
             </div>
             
             <Button
               variant="primary"
               fullWidth
               onClick={handleUseGPS}
               isLoading={loading}
               aria-label={t('my_current_location')}
               title={t('my_current_location')}
               icon={<Navigation className={`w-5 h-5 ${i18n.language === 'ar' ? 'scale-x-[-1]' : ''}`} />}
             >
               {t('my_current_location')}
             </Button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {loading && !weather && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Cloud className="w-16 h-16 text-gray-300 dark:text-slate-700 mb-4" />
            <p className="text-gray-500">{t('loading')}</p>
          </div>
        )}

        {error && !loading && (
           <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
             <AlertCircle className="w-5 h-5" />
             {error}
           </div>
        )}

        {!loading && weather && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Offline Indicator */}
             {(Date.now() - weather.lastUpdated > 15 * 60 * 1000) && (
               <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                 <CloudFog className="w-4 h-4" />
                 {t('offline_mode')} • {formatTime(weather.lastUpdated, i18n.language)}
               </div>
             )}

             <CurrentWeatherCard weather={weather} onAskAI={() => setIsAiOpen(true)} />
             <HourlyForecastStrip data={weather.hourly} />
             <DailyForecastList data={weather.daily} />
          </div>
        )}

      </main>

      {weather && (
        <AskAI 
          weather={weather} 
          isOpen={isAiOpen} 
          onClose={() => setIsAiOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
