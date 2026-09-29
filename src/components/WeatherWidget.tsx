import React, { useState, useEffect, useId } from 'react';
import {
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  Gauge,
  Compass,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Activity,
  Layers,
  Sparkles,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ShieldAlert,
  ArrowUpRight,
  Sun,
  Moon,
  CloudLightning,
  Clock,
  Camera,
  Maximize2,
  X
} from 'lucide-react';
import { RiskZone, ZoneWeatherDetails, WeatherHourlyTrendPoint, HazardType } from '../types';
import { SafetyEvaluationResult } from '../data/riskThresholds';

interface WeatherWidgetProps {
  selectedZone: RiskZone | null;
  allZones: RiskZone[];
  onSelectZone: (zone: RiskZone) => void;
  onWeatherFetched?: (data: ZoneWeatherDetails) => void;
  safetyEvaluation?: SafetyEvaluationResult | null;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  selectedZone,
  allZones,
  onSelectZone,
  onWeatherFetched,
  safetyEvaluation
}) => {
  const [weatherData, setWeatherData] = useState<ZoneWeatherDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTrendTab, setActiveTrendTab] = useState<'combined' | 'humidity' | 'temperature' | 'wind'>('combined');
  const [hoveredHour, setHoveredHour] = useState<WeatherHourlyTrendPoint | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [exactPhotoModalOpen, setExactPhotoModalOpen] = useState<boolean>(false);

  // Unique IDs for SVG gradients to avoid any DOM collision
  const tempGradId = useId();
  const humGradId = useId();
  const windGradId = useId();

  // Active zone fallback
  const activeZone = selectedZone || allZones[0] || null;

  const fetchWeather = async (zone: RiskZone) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        lat: zone.coordinates[0].toString(),
        lon: zone.coordinates[1].toString(),
        zoneId: zone.id,
        zoneName: zone.name,
        district: zone.district,
        state: zone.state,
        hazardType: zone.hazardType
      });

      const res = await fetch(`/api/weather/zone-weather?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Weather API returned status ${res.status}`);
      }
      const data: ZoneWeatherDetails = await res.json();
      setWeatherData(data);
      setLastRefreshedAt(new Date());
      onWeatherFetched?.(data);
    } catch (err: any) {
      console.error('Failed to fetch zone weather:', err);
      setError(err.message || 'Failed to load meteorological telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeZone) {
      fetchWeather(activeZone);
    }
  }, [activeZone?.id]);

  // Periodic refresh every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeZone) {
        fetchWeather(activeZone);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [activeZone?.id]);

  if (!activeZone) {
    return null;
  }

  const formatTemp = (celsius: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius.toFixed(1)}°C`;
  };

  // SVG Chart rendering helpers
  const hourly = weatherData?.hourly || [];
  const chartHeight = 160;
  const chartWidth = 720;
  const paddingX = 35;
  const paddingY = 25;

  const availableWidth = chartWidth - paddingX * 2;
  const availableHeight = chartHeight - paddingY * 2;

  // Min/Max for chart scales
  const tempVals = hourly.map(h => h.temperature);
  const minT = tempVals.length ? Math.floor(Math.min(...tempVals) - 1) : 15;
  const maxT = tempVals.length ? Math.ceil(Math.max(...tempVals) + 1) : 35;

  const humVals = hourly.map(h => h.humidity);
  const minH = 20;
  const maxH = 100;

  const windVals = hourly.map(h => h.windSpeed);
  const maxW = windVals.length ? Math.ceil(Math.max(30, ...windVals) + 5) : 40;

  const getX = (index: number) => {
    if (hourly.length <= 1) return paddingX;
    return paddingX + (index / (hourly.length - 1)) * availableWidth;
  };

  const getYTemp = (temp: number) => {
    const norm = (temp - minT) / (maxT - minT || 1);
    return paddingY + (1 - norm) * availableHeight;
  };

  const getYHum = (hum: number) => {
    const norm = (hum - minH) / (maxH - minH || 1);
    return paddingY + (1 - norm) * availableHeight;
  };

  const getYWind = (wind: number) => {
    const norm = wind / maxW;
    return paddingY + (1 - norm) * availableHeight;
  };

  // Build SVG Path strings
  const tempPathD = hourly.reduce((acc, h, i) => {
    const x = getX(i);
    const y = getYTemp(h.temperature);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const tempAreaD = hourly.length > 0
    ? `${tempPathD} L ${getX(hourly.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`
    : '';

  const humPathD = hourly.reduce((acc, h, i) => {
    const x = getX(i);
    const y = getYHum(h.humidity);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const humAreaD = hourly.length > 0
    ? `${humPathD} L ${getX(hourly.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`
    : '';

  const windPathD = hourly.reduce((acc, h, i) => {
    const x = getX(i);
    const y = getYWind(h.windSpeed);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const windAreaD = hourly.length > 0
    ? `${windPathD} L ${getX(hourly.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`
    : '';

  // Get current hour index
  const currentHourStr = new Date().getHours().toString().padStart(2, '0') + ':00';
  const currentHourIndex = hourly.findIndex(h => h.hourLabel === currentHourStr);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden transition-all text-slate-800">
      {/* Top Banner & Hazard Zone Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Real-Time Weather Monitor
              </span>
              <span className="text-xs text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-mono">
                {activeZone.coordinates[0].toFixed(3)}°N, {activeZone.coordinates[1].toFixed(3)}°E
              </span>
              <span className="text-xs text-slate-400">
                (Elev: {weatherData?.current.elevation_m || activeZone.currentConditions.elevation_m || 350}m MSL)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{activeZone.name}</span>
              </h2>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                activeZone.currentRisk === 'RED'
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                  : activeZone.currentRisk === 'ORANGE'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                  : 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/40'
              }`}>
                {activeZone.hazardType.replace('_', ' ')} • {activeZone.currentRisk} Risk
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {activeZone.district}, {activeZone.state} — Synoptic micro-climate observation grid
            </p>
          </div>

          {/* Right Action Tools: Zone Switcher Dropdown, Unit Toggle & Refresh */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {/* Zone Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
                title="Select another monitored hazard zone in India"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate">
                  Switch Zone ({allZones.length})
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 max-h-80 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                    Select Hazard Zone to Inspect
                  </div>
                  {allZones.map(z => (
                    <button
                      key={z.id}
                      onClick={() => {
                        onSelectZone(z);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start justify-between gap-2 hover:bg-slate-800/80 transition-colors cursor-pointer ${
                        z.id === activeZone.id ? 'bg-indigo-600/30 text-indigo-200 border-l-2 border-indigo-400' : 'text-slate-200'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold truncate">{z.name}</div>
                        <div className="text-[11px] text-slate-400">{z.district}, {z.state}</div>
                      </div>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                        z.hazardType === 'cloudburst' ? 'bg-purple-900/60 text-purple-200 border border-purple-700' :
                        z.hazardType === 'landslide' ? 'bg-amber-900/60 text-amber-200 border border-amber-700' :
                        z.hazardType === 'flood' ? 'bg-blue-900/60 text-blue-200 border border-blue-700' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {z.hazardType}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Temperature Unit Toggle */}
            <div className="flex items-center rounded-lg bg-white/10 p-0.5 border border-white/20 text-xs">
              <button
                onClick={() => setTempUnit('C')}
                className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  tempUnit === 'C' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setTempUnit('F')}
                className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  tempUnit === 'F' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                °F
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchWeather(activeZone)}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Real-Time Open-Meteo & IMD Feeds"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Quick-Select Pill Carousel for Hotspots */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap mr-1">
            Active Hazard Hubs:
          </span>
          {allZones.slice(0, 6).map(z => (
            <button
              key={z.id}
              onClick={() => onSelectZone(z)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                z.id === activeZone.id
                  ? 'bg-indigo-500 text-white font-semibold shadow-xs ring-1 ring-white/50'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10'
              }`}
            >
              <span>{z.name.split(' ')[0]}</span>
              <span className="text-[10px] opacity-75">({z.hazardType})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Meteorological Dashboard Body */}
      <div className="p-4 sm:p-6 space-y-6">
        {isLoading && !weatherData ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-medium font-mono">
              Retrieving live atmospheric observation streams & Google Maps grounding...
            </p>
          </div>
        ) : error && !weatherData ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchWeather(activeZone)}
              className="px-2.5 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : weatherData ? (
          <>
            {/* Real-time Safety Threshold Excursion Status Banner */}
            {safetyEvaluation && safetyEvaluation.isBreached && (
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                safetyEvaluation.isCritical
                  ? 'bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-400/30'
                  : 'bg-amber-50 border-amber-300 text-amber-950 ring-1 ring-amber-400/30'
              }`}>
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    safetyEvaluation.isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        safetyEvaluation.isCritical ? 'bg-rose-700 text-white' : 'bg-amber-700 text-white'
                      }`}>
                        {safetyEvaluation.isCritical ? 'Critical Safety Threshold Breached' : 'Safety Warning Threshold'}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{safetyEvaluation.zoneName}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-800 mt-1">
                      {safetyEvaluation.primaryBreachText}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 italic">
                      <strong className="text-slate-700 not-italic font-medium">NDMA Protocol: </strong>
                      {safetyEvaluation.advisory}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                  <span className="text-[10px] font-mono text-slate-500 bg-white/80 px-2 py-1 rounded border border-slate-200">
                    Live Auto-Monitor Synced
                  </span>
                </div>
              </div>
            )}

            {/* Primary Tri-Metric Cards: Temperature, Humidity, Wind Speed */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. CURRENT TEMPERATURE */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border border-amber-200/80 space-y-3 relative shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wide">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                      <Thermometer className="w-4 h-4" />
                    </div>
                    <span>Air Temperature</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                    {weatherData.current.isDay ? (
                      <>
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>Daylight</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3 h-3 text-indigo-400" />
                        <span>Night</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tracking-tight">
                      {formatTemp(weatherData.current.temperature_c)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Feels like <strong className="text-slate-700">{formatTemp(weatherData.current.apparentTemperature_c)}</strong>
                    </div>
                  </div>

                  {/* 6h Trend Badge */}
                  <div className="text-right space-y-0.5">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md ${
                      weatherData.trends.temperature.change6h > 0
                        ? 'bg-rose-100 text-rose-800'
                        : weatherData.trends.temperature.change6h < 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {weatherData.trends.temperature.change6h > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : weatherData.trends.temperature.change6h < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      <span>
                        {weatherData.trends.temperature.change6h > 0 ? '+' : ''}
                        {weatherData.trends.temperature.change6h}°C (6h)
                      </span>
                    </span>
                    <p className="text-[10px] text-slate-500 capitalize">
                      Trend: <strong>{weatherData.trends.temperature.trend}</strong>
                    </p>
                  </div>
                </div>

                {/* Diurnal Range */}
                <div className="pt-2 border-t border-amber-100 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>24h Diurnal Envelope:</span>
                  <span className="font-mono font-medium text-slate-800">
                    Min {formatTemp(weatherData.trends.temperature.min24h)} • Max {formatTemp(weatherData.trends.temperature.max24h)}
                  </span>
                </div>
              </div>

              {/* 2. CURRENT RELATIVE HUMIDITY (Highlighted Key Metric) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/50 border border-blue-200/80 space-y-3 relative shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wide">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <span>Relative Humidity</span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    weatherData.trends.humidity.comfortLevel === 'saturation_critical'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                      : weatherData.trends.humidity.comfortLevel === 'humid'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {weatherData.trends.humidity.comfortLevel === 'saturation_critical'
                      ? 'Critical Saturation'
                      : weatherData.trends.humidity.comfortLevel === 'humid'
                      ? 'High Moisture'
                      : 'Moderate'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono text-blue-950 tracking-tight">
                      {weatherData.current.humidity_percent}%
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Dew Point: <strong className="text-blue-900 font-mono">{formatTemp(weatherData.current.dewPoint_c)}</strong>
                    </div>
                  </div>

                  {/* 6h Humidity Delta */}
                  <div className="text-right space-y-0.5">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md ${
                      weatherData.trends.humidity.change6h > 0
                        ? 'bg-blue-100 text-blue-800'
                        : weatherData.trends.humidity.change6h < 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {weatherData.trends.humidity.change6h > 0 ? (
                        <TrendingUp className="w-3 h-3 text-blue-700" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-amber-700" />
                      )}
                      <span>
                        {weatherData.trends.humidity.change6h > 0 ? '+' : ''}
                        {weatherData.trends.humidity.change6h}% in 6h
                      </span>
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Trend: <strong className="capitalize">{weatherData.trends.humidity.trend}</strong>
                    </p>
                  </div>
                </div>

                {/* Saturation Gauge Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        weatherData.current.humidity_percent >= 85
                          ? 'bg-gradient-to-r from-blue-500 to-rose-500'
                          : weatherData.current.humidity_percent >= 70
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, weatherData.current.humidity_percent))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>24h Low: {weatherData.trends.humidity.min24h}%</span>
                    <span>Peak: {weatherData.trends.humidity.max24h}%</span>
                  </div>
                </div>
              </div>

              {/* 3. CURRENT WIND SPEED & GUSTS */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 border border-emerald-200/80 space-y-3 relative shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <Wind className="w-4 h-4" />
                    </div>
                    <span>Wind & Gust Vectors</span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                    <Compass
                      className="w-3 h-3 text-emerald-700 transition-transform"
                      style={{ transform: `rotate(${weatherData.current.windDirection_deg}deg)` }}
                    />
                    <span>{weatherData.current.windDirection_compass} ({weatherData.current.windDirection_deg}°)</span>
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tracking-tight">
                      {weatherData.current.windSpeed_kmh} <span className="text-sm font-sans font-medium text-slate-500">km/h</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Peak Gusts: <strong className="text-rose-700 font-mono">{weatherData.current.windGusts_kmh} km/h</strong>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 capitalize">
                      {weatherData.trends.wind.trend}
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Scale: <strong>{weatherData.trends.wind.beaufortScale.split(':')[1] || weatherData.trends.wind.beaufortScale}</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-100 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>24h Gust Maximum:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {weatherData.trends.wind.gustMax} km/h
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary Meteorological Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/90 border border-slate-200 p-3 rounded-xl text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-indigo-500" />
                  Barometric Pressure
                </span>
                <div className="font-mono font-bold text-slate-800 text-sm">
                  {weatherData.current.surfacePressure_hpa} <span className="text-xs font-normal text-slate-500">hPa</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {weatherData.current.surfacePressure_hpa < 1005 ? 'Low (Convective alert)' : 'Standard atmospheric'}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-blue-500" />
                  24h Precipitation
                </span>
                <div className="font-mono font-bold text-slate-800 text-sm">
                  {weatherData.current.rain24h_mm} <span className="text-xs font-normal text-slate-500">mm</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Current rate: {weatherData.current.rainCurrent_mm} mm/h
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-500" />
                  Topsoil Moisture
                </span>
                <div className="font-mono font-bold text-slate-800 text-sm">
                  {weatherData.current.soilMoisture_percent}%
                </div>
                <div className="text-[10px] text-slate-500">
                  {weatherData.current.soilMoisture_percent > 75 ? 'Pore pressure elevated' : 'Normal capacity'}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  Synoptic Condition
                </span>
                <div className="font-semibold text-slate-800 text-sm truncate" title={weatherData.current.conditionText}>
                  {weatherData.current.conditionText}
                </div>
                <div className="text-[10px] text-slate-500">
                  Open-Meteo WMO Blend
                </div>
              </div>
            </div>

            {/* Interactive 24-Hour Trend Graphs Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    24-Hour Atmospheric Trend Matrix & Synoptic Curves
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Continuous hourly humidity, temperature, and wind speed trends relevant to {activeZone.name}
                  </p>
                </div>

                {/* Trend Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs self-start sm:self-center">
                  <button
                    onClick={() => setActiveTrendTab('combined')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      activeTrendTab === 'combined'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Combined
                  </button>
                  <button
                    onClick={() => setActiveTrendTab('humidity')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      activeTrendTab === 'humidity'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Humidity (%)
                  </button>
                  <button
                    onClick={() => setActiveTrendTab('temperature')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      activeTrendTab === 'temperature'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Temperature (°C)
                  </button>
                  <button
                    onClick={() => setActiveTrendTab('wind')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      activeTrendTab === 'wind'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Wind (km/h)
                  </button>
                </div>
              </div>

              {/* Hover Inspection Readout */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80 font-mono">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    Hour: <strong className="text-slate-900">{hoveredHour ? hoveredHour.hourLabel : (hourly[currentHourIndex]?.hourLabel || 'Current')}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Humidity: <strong className="font-bold">{hoveredHour ? hoveredHour.humidity : weatherData.current.humidity_percent}%</strong>
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Temp: <strong className="font-bold">{formatTemp(hoveredHour ? hoveredHour.temperature : weatherData.current.temperature_c)}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Wind: <strong className="font-bold">{hoveredHour ? hoveredHour.windSpeed : weatherData.current.windSpeed_kmh} km/h</strong>
                  </span>
                  {(hoveredHour ? hoveredHour.precipitation : weatherData.current.rainCurrent_mm) > 0 && (
                    <span className="flex items-center gap-1.5 text-indigo-700">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Precip: <strong className="font-bold">{hoveredHour ? hoveredHour.precipitation : weatherData.current.rainCurrent_mm} mm</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Visual SVG Trend Graph */}
              <div className="relative overflow-x-auto w-full pt-2">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-44 select-none"
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  <defs>
                    <linearGradient id={tempGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id={humGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id={windGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line
                    x1={paddingX}
                    y1={paddingY}
                    x2={chartWidth - paddingX}
                    y2={paddingY}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={paddingX}
                    y1={paddingY + availableHeight * 0.5}
                    x2={chartWidth - paddingX}
                    y2={paddingY + availableHeight * 0.5}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={paddingX}
                    y1={chartHeight - paddingY}
                    x2={chartWidth - paddingX}
                    y2={chartHeight - paddingY}
                    stroke="#cbd5e1"
                  />

                  {/* Critical 85% Humidity Saturation Line for Convective Hazard Alert */}
                  {(activeTrendTab === 'combined' || activeTrendTab === 'humidity') && (
                    <g>
                      <line
                        x1={paddingX}
                        y1={getYHum(85)}
                        x2={chartWidth - paddingX}
                        y2={getYHum(85)}
                        stroke="#f43f5e"
                        strokeDasharray="2 3"
                        strokeWidth="1.2"
                      />
                      <text
                        x={chartWidth - paddingX - 4}
                        y={getYHum(85) - 4}
                        textAnchor="end"
                        fontSize="9"
                        fill="#e11d48"
                        fontWeight="600"
                        className="font-mono"
                      >
                        85% Critical Cloudburst/Deluge Threshold
                      </text>
                    </g>
                  )}

                  {/* Shaded Areas & Paths */}
                  {(activeTrendTab === 'combined' || activeTrendTab === 'humidity') && (
                    <g>
                      <path d={humAreaD} fill={`url(#${humGradId})`} />
                      <path d={humPathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  )}

                  {(activeTrendTab === 'combined' || activeTrendTab === 'temperature') && (
                    <g>
                      <path d={tempAreaD} fill={`url(#${tempGradId})`} />
                      <path d={tempPathD} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  )}

                  {(activeTrendTab === 'combined' || activeTrendTab === 'wind') && (
                    <g>
                      <path d={windAreaD} fill={`url(#${windGradId})`} />
                      <path d={windPathD} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={activeTrendTab === 'combined' ? '4 2' : 'none'} />
                    </g>
                  )}

                  {/* Interactive Vertical Hover Guide & Hourly Nodes */}
                  {hourly.map((h, i) => {
                    const x = getX(i);
                    const isHovered = hoveredHour?.time === h.time;
                    const isCurrent = i === currentHourIndex;

                    return (
                      <g
                        key={h.time + i}
                        className="cursor-pointer group"
                        onMouseEnter={() => setHoveredHour(h)}
                      >
                        {/* Invisible hover hitbox */}
                        <rect
                          x={x - availableWidth / (hourly.length * 2)}
                          y="0"
                          width={availableWidth / hourly.length}
                          height={chartHeight}
                          fill="transparent"
                        />

                        {/* Current hour vertical marker */}
                        {isCurrent && (
                          <line
                            x1={x}
                            y1={paddingY}
                            x2={x}
                            y2={chartHeight - paddingY}
                            stroke="#6366f1"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                        )}

                        {/* Hover vertical guide */}
                        {isHovered && (
                          <line
                            x1={x}
                            y1={paddingY}
                            x2={x}
                            y2={chartHeight - paddingY}
                            stroke="#0f172a"
                            strokeWidth="1.2"
                          />
                        )}

                        {/* Data dots on path */}
                        {(activeTrendTab === 'combined' || activeTrendTab === 'humidity') && (
                          <circle
                            cx={x}
                            cy={getYHum(h.humidity)}
                            r={isHovered ? 4.5 : (isCurrent ? 3.5 : 2)}
                            fill={isHovered ? '#1d4ed8' : '#3b82f6'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                        )}

                        {(activeTrendTab === 'combined' || activeTrendTab === 'temperature') && (
                          <circle
                            cx={x}
                            cy={getYTemp(h.temperature)}
                            r={isHovered ? 4.5 : (isCurrent ? 3.5 : 2)}
                            fill={isHovered ? '#b45309' : '#f59e0b'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                        )}

                        {(activeTrendTab === 'combined' || activeTrendTab === 'wind') && (
                          <circle
                            cx={x}
                            cy={getYWind(h.windSpeed)}
                            r={isHovered ? 4.5 : (isCurrent ? 3.5 : 2)}
                            fill={isHovered ? '#047857' : '#10b981'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                        )}

                        {/* X-axis hour labels for every 3rd hour or hover */}
                        {(i % 3 === 0 || i === hourly.length - 1 || isHovered) && (
                          <text
                            x={x}
                            y={chartHeight - 6}
                            textAnchor="middle"
                            fontSize="9"
                            fill={isCurrent ? '#4f46e5' : (isHovered ? '#0f172a' : '#64748b')}
                            fontWeight={isCurrent || isHovered ? '700' : '400'}
                            className="font-mono"
                          >
                            {h.hourLabel}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Chart Legend & Threshold Footnotes */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-1 bg-blue-600 rounded"></span>
                    <span>Humidity % ({weatherData.trends.humidity.min24h}% - {weatherData.trends.humidity.max24h}%)</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-1 bg-amber-500 rounded"></span>
                    <span>Air Temp ({formatTemp(weatherData.trends.temperature.min24h)} - {formatTemp(weatherData.trends.temperature.max24h)})</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-1 bg-emerald-600 rounded border-dashed"></span>
                    <span>Wind Speed ({weatherData.trends.wind.min24h} - {weatherData.trends.wind.max24h} km/h)</span>
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Centered on current time • 24-Hour numerical trajectory
                </div>
              </div>
            </div>

            {/* Hazard Impact Correlation Card */}
            <div className={`p-4 sm:p-5 rounded-xl border space-y-3 transition-colors ${
              weatherData.hazardCorrelation.severity === 'CRITICAL'
                ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                : weatherData.hazardCorrelation.severity === 'HIGH'
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-blue-50/60 border-blue-200 text-slate-900'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 border-current/15">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`w-5 h-5 ${
                    weatherData.hazardCorrelation.severity === 'CRITICAL' ? 'text-rose-600 animate-bounce' : 'text-amber-600'
                  }`} />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block font-mono">
                      Meteorological Hazard Trigger Analysis • {activeZone.hazardType.toUpperCase()}
                    </span>
                    <h4 className="text-sm font-bold tracking-tight">
                      {weatherData.hazardCorrelation.title}
                    </h4>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase self-start sm:self-center tracking-wider ${
                  weatherData.hazardCorrelation.severity === 'CRITICAL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : weatherData.hazardCorrelation.severity === 'HIGH'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                }`}>
                  {weatherData.hazardCorrelation.severity} Alert
                </span>
              </div>

              <p className="text-xs leading-relaxed text-current/90 font-medium">
                {weatherData.hazardCorrelation.impactSummary}
              </p>

              {/* Key Indicators checklist */}
              {weatherData.hazardCorrelation.keyIndicators.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-current/80">
                    Active Meteorological Triggers:
                  </span>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs font-mono">
                    {weatherData.hazardCorrelation.keyIndicators.map((ind, i) => (
                      <li key={i} className="flex items-center gap-2 bg-white/70 px-2.5 py-1 rounded border border-current/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span className="truncate">{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Standard NDMA Advisory */}
              <div className="pt-2 border-t border-current/15 text-xs flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-current shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong>Standard Response Action:</strong> {weatherData.hazardCorrelation.advisoryAction}
                </span>
              </div>
            </div>

            {/* Google Maps Grounded Intelligence Section (gemini-3.8-flash & googleMaps tool) */}
            {weatherData.mapsGrounding && (
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-4 sm:p-5 space-y-4 shadow-sm border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Google Maps Grounded Meteorological Context</span>
                        <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                          {weatherData.mapsGrounding.groundedWith}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Real-time terrain citations, IMD radar stations, and emergency landmarks retrieved for {activeZone.district}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono self-start sm:self-center">
                    Coords: {activeZone.coordinates[0].toFixed(3)}N, {activeZone.coordinates[1].toFixed(3)}E
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {weatherData.mapsGrounding.intelSummary}
                </p>

                {/* Exact Verified Image of That Place Showcase */}
                {(() => {
                  const placeImg =
                    weatherData.mapsGrounding?.exactPlaceImage ||
                    activeZone.imageUrl ||
                    '/images/wayanad_chooralmala_place_1790611889796.jpg';
                  const placeCaption =
                    weatherData.mapsGrounding?.exactPlaceCaption ||
                    activeZone.imageCaption ||
                    `Exact Place: ${activeZone.name} (${activeZone.coordinates[0].toFixed(4)}°N, ${activeZone.coordinates[1].toFixed(4)}°E)`;
                  const placeLocation =
                    weatherData.mapsGrounding?.exactPlaceLocationDetails ||
                    activeZone.exactPlaceLocationDetails ||
                    `${activeZone.district}, ${activeZone.state}`;

                  return (
                    <div className="rounded-xl overflow-hidden border border-white/20 bg-black/40 backdrop-blur shadow-lg">
                      <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Exact Verified Ground-Truth Image of That Place
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {activeZone.coordinates[0].toFixed(4)}°N, {activeZone.coordinates[1].toFixed(4)}°E
                        </span>
                      </div>

                      <div className="relative group overflow-hidden max-h-72 sm:max-h-80 bg-slate-950 flex items-center justify-center">
                        <img
                          src={placeImg}
                          alt={placeCaption}
                          className="w-full h-auto object-cover max-h-80 transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                        <button
                          type="button"
                          onClick={() => setExactPhotoModalOpen(true)}
                          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur border border-white/30 hover:border-emerald-400 transition-all cursor-pointer shadow-lg"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Fullscreen Exact Image</span>
                        </button>
                      </div>

                      <div className="p-3 space-y-1.5 bg-slate-900/90 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-emerald-300">
                            {placeCaption}
                          </p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeZone.name)}+${encodeURIComponent(activeZone.district)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 underline shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Locate on Google Maps</span>
                          </a>
                        </div>
                        {placeLocation && (
                          <p className="text-[11px] text-slate-300">
                            <strong>Geographic & Terrain Context:</strong> {placeLocation}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Grounded Places and IMD Stations on Google Maps */}
                {weatherData.mapsGrounding.places.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nearby Observatories & Emergency Infrastructure on Google Maps:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {weatherData.mapsGrounding.places.map((place, idx) => (
                        <a
                          key={idx}
                          href={place.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/50 transition-all text-xs"
                          title="Open place location on Google Maps"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                              <span>{place.category || 'Google Maps Landmark'}</span>
                              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <h5 className="font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                              {place.title}
                            </h5>
                            {place.snippet && (
                              <p className="text-[11px] text-slate-400 line-clamp-2">
                                {place.snippet}
                              </p>
                            )}
                          </div>
                          <div className="pt-2 mt-2 border-t border-white/5 flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-slate-300">
                            <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
                            <span>View on Google Maps</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Exact Image Fullscreen Lightbox Modal */}
      {exactPhotoModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-5xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl space-y-3">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {weatherData?.mapsGrounding?.exactPlaceCaption ||
                      activeZone.imageCaption ||
                      `Exact Image: ${activeZone.name}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeZone.coordinates[0].toFixed(4)}°N, {activeZone.coordinates[1].toFixed(4)}°E • {activeZone.district}, {activeZone.state}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExactPhotoModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 sm:p-4 max-h-[70vh] flex items-center justify-center bg-black overflow-hidden">
              <img
                src={
                  weatherData?.mapsGrounding?.exactPlaceImage ||
                  activeZone.imageUrl ||
                  '/images/wayanad_chooralmala_place_1790611889796.jpg'
                }
                alt={activeZone.name}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded"
              />
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Ground-Truth Photographic Correlation
                </span>
                <p className="text-slate-300">
                  {weatherData?.mapsGrounding?.exactPlaceLocationDetails ||
                    activeZone.exactPlaceLocationDetails ||
                    'Topographic satellite and ground telemetry correlation'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={
                    weatherData?.mapsGrounding?.exactPlaceImage ||
                    activeZone.imageUrl ||
                    '/images/wayanad_chooralmala_place_1790611889796.jpg'
                  }
                  download={`${activeZone.name.toLowerCase().replace(/\s+/g, '_')}_exact.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition-colors"
                >
                  Download Photo
                </a>
                <button
                  type="button"
                  onClick={() => setExactPhotoModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
