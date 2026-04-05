// Weather Service using Open-Meteo (free, no API key needed)
// + Dynamic theme application based on weather conditions

import { applyTheme, themes, TerminalTheme } from './themes';

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  isDay: boolean;
  description: string;
  city: string;
}

// WMO Weather interpretation codes
const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
};

type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';

const getWeatherType = (code: number): WeatherType => {
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'fog';
  if (code <= 67) return 'rain';
  if (code <= 86) return 'snow';
  return 'storm';
};

// Weather-reactive themes
export const weatherThemes: Record<string, TerminalTheme> = {
  'weather-clear-day': {
    id: 'weather-clear-day',
    name: 'Sunny Day',
    description: 'Warm clear sky',
    colors: {
      background: '45 30% 8%',
      foreground: '45 80% 75%',
      primary: '40 95% 55%',
      secondary: '25 90% 55%',
      accent: '200 70% 60%',
      muted: '45 20% 12%',
      mutedForeground: '45 50% 50%',
      error: '0 70% 55%',
      success: '80 70% 50%',
      warning: '40 95% 55%',
      info: '200 70% 60%',
      glow: '40 95% 55%',
    },
  },
  'weather-clear-night': {
    id: 'weather-clear-night',
    name: 'Starry Night',
    description: 'Clear night sky',
    colors: {
      background: '230 25% 5%',
      foreground: '220 40% 75%',
      primary: '220 70% 65%',
      secondary: '270 50% 60%',
      accent: '190 60% 55%',
      muted: '230 20% 10%',
      mutedForeground: '220 30% 50%',
      error: '0 65% 50%',
      success: '150 50% 50%',
      warning: '45 80% 55%',
      info: '220 70% 65%',
      glow: '220 70% 65%',
    },
  },
  'weather-rain': {
    id: 'weather-rain',
    name: 'Rainy',
    description: 'Moody rain atmosphere',
    colors: {
      background: '210 20% 6%',
      foreground: '200 30% 65%',
      primary: '200 60% 50%',
      secondary: '180 40% 45%',
      accent: '195 70% 55%',
      muted: '210 15% 11%',
      mutedForeground: '200 20% 45%',
      error: '0 60% 50%',
      success: '160 50% 45%',
      warning: '45 70% 50%',
      info: '200 60% 50%',
      glow: '200 60% 50%',
    },
  },
  'weather-snow': {
    id: 'weather-snow',
    name: 'Snowy',
    description: 'Frosty winter',
    colors: {
      background: '210 15% 8%',
      foreground: '200 20% 85%',
      primary: '200 30% 80%',
      secondary: '195 40% 70%',
      accent: '210 50% 75%',
      muted: '210 10% 14%',
      mutedForeground: '200 15% 55%',
      error: '0 50% 55%',
      success: '160 40% 55%',
      warning: '45 60% 55%',
      info: '200 30% 80%',
      glow: '200 30% 80%',
    },
  },
  'weather-storm': {
    id: 'weather-storm',
    name: 'Thunderstorm',
    description: 'Electric storm',
    colors: {
      background: '260 20% 5%',
      foreground: '280 30% 70%',
      primary: '270 80% 65%',
      secondary: '300 60% 55%',
      accent: '50 90% 60%',
      muted: '260 15% 10%',
      mutedForeground: '280 20% 45%',
      error: '0 70% 55%',
      success: '120 50% 50%',
      warning: '50 90% 60%',
      info: '270 80% 65%',
      glow: '50 90% 60%',
    },
  },
  'weather-cloudy': {
    id: 'weather-cloudy',
    name: 'Overcast',
    description: 'Grey cloudy sky',
    colors: {
      background: '220 10% 7%',
      foreground: '220 15% 65%',
      primary: '220 30% 55%',
      secondary: '200 25% 50%',
      accent: '210 40% 55%',
      muted: '220 8% 12%',
      mutedForeground: '220 12% 45%',
      error: '0 55% 50%',
      success: '140 40% 45%',
      warning: '45 60% 50%',
      info: '220 30% 55%',
      glow: '220 30% 55%',
    },
  },
  'weather-fog': {
    id: 'weather-fog',
    name: 'Foggy',
    description: 'Misty atmosphere',
    colors: {
      background: '200 8% 9%',
      foreground: '200 10% 60%',
      primary: '200 20% 50%',
      secondary: '180 15% 45%',
      accent: '190 25% 50%',
      muted: '200 6% 13%',
      mutedForeground: '200 8% 42%',
      error: '0 45% 50%',
      success: '150 30% 45%',
      warning: '45 50% 48%',
      info: '200 20% 50%',
      glow: '200 20% 50%',
    },
  },
};

// Get user location via browser geolocation
export const getUserLocation = (): Promise<{ lat: number; lon: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(new Error(`Location access denied: ${err.message}`)),
      { timeout: 10000 }
    );
  });
};

// Reverse geocode to get city name
const getCityName = async (lat: number, lon: number): Promise<string> => {
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=_&count=1&latitude=${lat}&longitude=${lon}`);
    // Open-Meteo doesn't have reverse geocoding, so we approximate
    return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  } catch {
    return 'Unknown';
  }
};

// Fetch weather from Open-Meteo
export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather API request failed');

  const data = await res.json();
  const current = data.current;

  return {
    temperature: current.temperature_2m,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    humidity: current.relative_humidity_2m,
    isDay: current.is_day === 1,
    description: weatherDescriptions[current.weather_code] || 'Unknown',
    city: await getCityName(lat, lon),
  };
};

// Apply weather-based theme
export const applyWeatherTheme = (weather: WeatherData): string => {
  const type = getWeatherType(weather.weatherCode);

  let themeId: string;
  if (type === 'clear') {
    themeId = weather.isDay ? 'weather-clear-day' : 'weather-clear-night';
  } else {
    themeId = `weather-${type}`;
  }

  const theme = weatherThemes[themeId];
  if (!theme) return 'matrix';

  // Register and apply the weather theme dynamically
  themes[themeId] = theme;
  applyTheme(themeId);
  return themeId;
};

// Render weather ASCII art
export const renderWeatherArt = (weather: WeatherData): string => {
  const type = getWeatherType(weather.weatherCode);

  const arts: Record<WeatherType, string> = {
    clear: weather.isDay
      ? `    \\   |   /
      .─────.
    ─(  ☀️   )─
      '─────'
    /   |   \\`
      : `       ✦  ·    ✦
    ·    ✦    ·  ✦
      ✦   🌙   ·
    ·  ✦    ·   ✦
       ·  ✦   ·`,
    cloudy: `       .-~~~-.
  .- ~ ~-( )_ _)-~ ~-.
 {        ☁️          }
  '-. .~ ~-._ _.-~ ~.-'
      '-. ~ .-'`,
    rain: `       .-~~~-.
  .- ~ ~-(  ☁  )-~ ~-.
   '-. .~ ~-.-~ ~.-'
     │ │ │ │ │ │
     │ │ │ │ │ │`,
    snow: `       .-~~~-.
  .- ~ ~-(  ☁  )-~ ~-.
   '-. .~ ~-.-~ ~.-'
     ❄ * ❄ * ❄ *
     * ❄ * ❄ * ❄`,
    storm: `       .-~~~-.
  .- ~ ~-(  ⛈  )-~ ~-.
   '-. .~ ~-.-~ ~.-'
     ⚡│ │⚡│ │⚡│
     │⚡│ │ │⚡│ │`,
    fog: `  ═══════════════
  ~ ~ ~ ~ ~ ~ ~ ~
  ═══════════════
  ~ ~ ~ ~ ~ ~ ~ ~
  ═══════════════`,
  };

  const art = arts[type];
  const tempUnit = '°C';

  return `
${art}

  📍 Location:    ${weather.city}
  🌡  Temperature: ${weather.temperature}${tempUnit}
  💨 Wind:        ${weather.windSpeed} km/h
  💧 Humidity:    ${weather.humidity}%
  🌤  Condition:   ${weather.description}
  ${weather.isDay ? '☀️  Daytime' : '🌙 Nighttime'}

  Theme auto-adjusted to match weather conditions.`;
};
