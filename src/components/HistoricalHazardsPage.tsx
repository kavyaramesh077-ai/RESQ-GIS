import React, { useState } from 'react';
import {
  History,
  Filter,
  Search,
  Calendar,
  MapPin,
  Database,
  ArrowUpRight,
  Maximize2,
  X,
  ExternalLink,
  ShieldAlert,
  Camera,
  Layers,
  AlertTriangle,
  Flame,
  CloudRain,
  Waves,
  Wind,
  Info,
  Globe2,
  Copy,
  Check,
  ZoomIn
} from 'lucide-react';
import { HistoricalEvent, HazardType } from '../types';

interface HistoricalHazardsPageProps {
  historicalEvents: HistoricalEvent[];
  onNavigateToMap: () => void;
}

// Generate ESRI World Imagery satellite URL for the exact coordinates
export const getExactSatelliteUrl = (lat: number, lon: number, delta: number = 0.015) => {
  const minLon = (lon - delta).toFixed(4);
  const minLat = (lat - delta).toFixed(4);
  const maxLon = (lon + delta).toFixed(4);
  const maxLat = (lat + delta).toFixed(4);
  return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=${minLon},${minLat},${maxLon},${maxLat}&bboxSR=4326&imageSR=4326&size=1000,562&format=png&f=image`;
};

export const HistoricalHazardsPage: React.FC<HistoricalHazardsPageProps> = ({
  historicalEvents,
  onNavigateToMap
}) => {
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhotoEvent, setSelectedPhotoEvent] = useState<HistoricalEvent | null>(null);
  const [globalViewMode, setGlobalViewMode] = useState<'photo' | 'satellite'>('photo');
  const [modalTab, setModalTab] = useState<'photo' | 'satellite'>('photo');
  const [satelliteZoomDelta, setSatelliteZoomDelta] = useState<number>(0.015);
  const [hasCopiedCoords, setHasCopiedCoords] = useState<boolean>(false);

  const filtered = historicalEvents.filter(e => {
    if (hazardFilter !== 'all' && e.hazard !== hazardFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.state.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.imageCaption && e.imageCaption.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Featured highlight events with dedicated photography
  const featuredEvents = historicalEvents.filter(e =>
    e.id === 'hist-ls-2024-wayanad' ||
    e.id === 'hist-cb-2013-kedarnath' ||
    e.id === 'hist-fl-2015-chennai' ||
    e.id === 'hist-eq-2001-bhuj' ||
    e.id === 'hist-cb-2010-leh'
  );

  const getHazardBadge = (hazard: HazardType) => {
    switch (hazard) {
      case 'landslide':
        return { label: 'Landslide', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: Flame };
      case 'cloudburst':
        return { label: 'Cloudburst', color: 'bg-blue-100 text-blue-900 border-blue-300', icon: CloudRain };
      case 'flood':
        return { label: 'River Flood', color: 'bg-cyan-100 text-cyan-900 border-cyan-300', icon: Waves };
      case 'cyclone':
        return { label: 'Cyclone', color: 'bg-purple-100 text-purple-900 border-purple-300', icon: Wind };
      case 'earthquake':
        return { label: 'Earthquake', color: 'bg-rose-100 text-rose-900 border-rose-300', icon: AlertTriangle };
      default:
        return { label: hazard, color: 'bg-slate-100 text-slate-900 border-slate-300', icon: AlertTriangle };
    }
  };

  const handleCopyCoordinates = (lat: number, lon: number) => {
    navigator.clipboard.writeText(`${lat}, ${lon}`);
    setHasCopiedCoords(true);
    setTimeout(() => setHasCopiedCoords(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <History className="w-6 h-6 text-emerald-600" />
              Verified Historical Multi-Hazard Inventories (1999 – 2024)
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Exact ground documentary photography coupled with true high-resolution satellite imagery (ESRI / Sentinel Earth Observation) for peer-reviewed disaster locations across India.
            </p>
          </div>
          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>View Spatial GIS Layer</span>
          </button>
        </div>
      </div>

      {/* Featured Landmark Hazard Photography Showcase */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Landmark Disaster Place Showcase (Exact Ground & Satellite Archive)</span>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              onClick={() => setGlobalViewMode('photo')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                globalViewMode === 'photo'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exact Place Photos</span>
            </button>
            <button
              onClick={() => setGlobalViewMode('satellite')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                globalViewMode === 'satellite'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              <span>True Satellite Imagery</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {featuredEvents.map(event => {
            const badge = getHazardBadge(event.hazard);
            const Icon = badge.icon;
            const imgSrc = globalViewMode === 'satellite'
              ? getExactSatelliteUrl(event.latitude, event.longitude, 0.018)
              : (event.imageUrl || getExactSatelliteUrl(event.latitude, event.longitude, 0.018));

            return (
              <div
                key={`feat-${event.id}`}
                onClick={() => {
                  setSelectedPhotoEvent(event);
                  setModalTab(globalViewMode);
                }}
                className="group relative bg-slate-900 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer border border-slate-200 hover:border-emerald-500 aspect-16/11 flex flex-col justify-end"
              >
                <img
                  src={imgSrc}
                  alt={event.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                {/* Top overlay pills */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border backdrop-blur-md flex items-center gap-1 ${badge.color}`}>
                    <Icon className="w-2.5 h-2.5" />
                    {badge.label}
                  </span>
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-600/90 text-white backdrop-blur-md">
                    {event.fatalities ? `${event.fatalities.toLocaleString()} Deaths` : event.severity}
                  </span>
                </div>

                {/* Bottom text info */}
                <div className="relative z-10 p-2.5 text-white space-y-0.5">
                  <span className="text-[9px] font-mono text-emerald-400 block font-semibold">{event.date} • {event.state}</span>
                  <h4 className="text-xs font-bold leading-tight text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                    {event.location}
                  </h4>
                  <p className="text-[9px] text-slate-300 truncate">
                    {event.latitude}°N, {event.longitude}°E
                  </p>
                  <div className="pt-0.5 flex items-center justify-between text-[9px] text-emerald-300 font-mono">
                    <span>{globalViewMode === 'satellite' ? '🛰️ Exact Satellite' : '📍 Exact Landmark'}</span>
                    <span className="flex items-center gap-0.5 group-hover:underline">
                      <Maximize2 className="w-2.5 h-2.5" /> Inspect
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-700 font-semibold">Filter Hazard:</span>
            <select
              value={hazardFilter}
              onChange={e => setHazardFilter(e.target.value)}
              className="bg-slate-50 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
            >
              <option value="all">All Verified Disasters ({historicalEvents.length})</option>
              <option value="landslide">Landslides (GSI Catalog)</option>
              <option value="cloudburst">Cloudbursts (Himalayan Convective Deluges)</option>
              <option value="flood">Floods (CWC Records)</option>
              <option value="cyclone">Cyclones (IMD e-Atlas)</option>
              <option value="earthquake">Earthquakes (USGS/NCS)</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search disaster, state, coordinates, or place..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Historical Records Grid with Dual Exact Photo & True Satellite */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(item => {
          const badge = getHazardBadge(item.hazard);
          const Icon = badge.icon;
          const displayImage = globalViewMode === 'satellite'
            ? getExactSatelliteUrl(item.latitude, item.longitude, 0.015)
            : (item.imageUrl || getExactSatelliteUrl(item.latitude, item.longitude, 0.015));

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-xs flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Event Photo with overlay and expand button */}
                <div
                  onClick={() => {
                    setSelectedPhotoEvent(item);
                    setModalTab(globalViewMode);
                  }}
                  className="relative aspect-16/9 w-full bg-slate-900 cursor-pointer overflow-hidden border-b border-slate-200"
                >
                  <img
                    src={displayImage}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/30" />

                  {/* Overlay Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border backdrop-blur-md flex items-center gap-1 shadow-xs ${badge.color}`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                      {globalViewMode === 'satellite' ? '🛰️ ESRI Satellite' : '📍 Exact Place'}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded shadow-xs ${
                      item.severity === 'RED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-slate-950'
                    }`}>
                      {item.severity} LEVEL
                    </span>
                  </div>

                  {/* Image Caption & Expand Affordance */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                    <span className="font-mono text-[10px] text-slate-200 truncate pr-2">
                      {globalViewMode === 'satellite'
                        ? `🛰️ True Satellite Earth Observation: ${item.latitude}°N, ${item.longitude}°E`
                        : (item.imageCaption || `📷 Exact Place: ${item.location}`)}
                    </span>
                    <span className="bg-slate-900/85 hover:bg-slate-900 text-white font-mono text-[10px] px-2 py-0.5 rounded flex items-center gap-1 shrink-0 backdrop-blur-xs border border-white/20">
                      <Maximize2 className="w-2.5 h-2.5" /> Full Place Dossier
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{item.date}</span>
                      <span>•</span>
                      <span>Year {item.year}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {item.location}, {item.state} ({item.district} District)
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Impact Metric Tags */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {item.fatalities !== undefined && (
                      <div>
                        <span className="text-[10px] text-slate-500 block">Fatalities</span>
                        <span className="font-mono font-bold text-rose-700">{item.fatalities.toLocaleString()}</span>
                      </div>
                    )}
                    {item.displaced !== undefined && (
                      <div>
                        <span className="text-[10px] text-slate-500 block">Displaced</span>
                        <span className="font-mono font-bold text-amber-700">{item.displaced.toLocaleString()}</span>
                      </div>
                    )}
                    {(item.rainfallRecord_mm || item.rainfall_mm) && (
                      <div>
                        <span className="text-[10px] text-slate-500 block">Peak Rainfall</span>
                        <span className="font-mono font-bold text-blue-700">{item.rainfallRecord_mm || item.rainfall_mm} mm</span>
                      </div>
                    )}
                    {item.cycloneCategory && (
                      <div>
                        <span className="text-[10px] text-slate-500 block">Category</span>
                        <span className="font-mono font-bold text-purple-700 truncate block">{item.cycloneCategory.split(' ')[0]}</span>
                      </div>
                    )}
                    {item.magnitude && (
                      <div>
                        <span className="text-[10px] text-slate-500 block">Magnitude</span>
                        <span className="font-mono font-bold text-amber-700">M {item.magnitude}</span>
                      </div>
                    )}
                    {item.economicImpact_inr_cr && (
                      <div>
                        <span className="text-[10px] text-slate-500 block">Est. Loss</span>
                        <span className="font-mono font-bold text-slate-800">₹{item.economicImpact_inr_cr} Cr</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Official Provenance & Spatial Action */}
              <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1 truncate max-w-[65%]" title={item.source}>
                  <Database className="w-3 h-3 text-slate-400 shrink-0" />
                  {item.source}
                </span>
                <button
                  onClick={() => {
                    setSelectedPhotoEvent(item);
                    setModalTab(globalViewMode);
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Exact Place & Coords</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* High-Resolution Exact Place & True Satellite Lightbox Modal */}
      {selectedPhotoEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedPhotoEvent(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Image Header with Switchable Views */}
            <div className="relative aspect-16/9 sm:aspect-21/9 w-full bg-slate-950 overflow-hidden rounded-t-2xl">
              <img
                src={
                  modalTab === 'satellite'
                    ? getExactSatelliteUrl(selectedPhotoEvent.latitude, selectedPhotoEvent.longitude, satelliteZoomDelta)
                    : (selectedPhotoEvent.imageUrl || getExactSatelliteUrl(selectedPhotoEvent.latitude, selectedPhotoEvent.longitude, 0.015))
                }
                alt={selectedPhotoEvent.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedPhotoEvent(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 z-20"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Dual View Toggle in Modal */}
              <div className="absolute top-4 left-4 z-20 inline-flex items-center rounded-lg bg-slate-900/85 p-0.5 border border-white/20 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setModalTab('photo')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                    modalTab === 'photo'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Exact Landmark View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('satellite')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                    modalTab === 'satellite'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>True Satellite Image</span>
                </button>
              </div>

              {/* Satellite Zoom Level Pills if in Satellite Mode */}
              {modalTab === 'satellite' && (
                <div className="absolute top-14 left-4 z-20 flex items-center gap-1.5 bg-slate-900/85 px-2.5 py-1 rounded-lg border border-white/20 text-[10px] font-mono text-white backdrop-blur-md">
                  <ZoomIn className="w-3 h-3 text-emerald-400" />
                  <span className="text-slate-300">Satellite Range:</span>
                  <button
                    onClick={() => setSatelliteZoomDelta(0.006)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      satelliteZoomDelta === 0.006 ? 'bg-emerald-500 text-slate-950 font-bold' : 'hover:bg-white/20'
                    }`}
                  >
                    500m (Close)
                  </button>
                  <button
                    onClick={() => setSatelliteZoomDelta(0.015)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      satelliteZoomDelta === 0.015 ? 'bg-emerald-500 text-slate-950 font-bold' : 'hover:bg-white/20'
                    }`}
                  >
                    2km (District)
                  </button>
                  <button
                    onClick={() => setSatelliteZoomDelta(0.05)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      satelliteZoomDelta === 0.05 ? 'bg-emerald-500 text-slate-950 font-bold' : 'hover:bg-white/20'
                    }`}
                  >
                    10km (Regional)
                  </button>
                </div>
              )}

              {/* Bottom Image Info */}
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1 z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                    {selectedPhotoEvent.hazard}
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    {selectedPhotoEvent.date}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-600 text-white">
                    {selectedPhotoEvent.severity} SEVERITY
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-bold leading-tight text-white">
                  {selectedPhotoEvent.title}
                </h2>
                <p className="text-xs text-emerald-300 font-mono flex items-center gap-1.5 pt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {modalTab === 'satellite'
                    ? `True Satellite Earth Observation: ${selectedPhotoEvent.latitude}°N, ${selectedPhotoEvent.longitude}°E`
                    : (selectedPhotoEvent.imageCaption || `Exact Place: ${selectedPhotoEvent.location}`)}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700">
              {/* Location & Coordinates Banner with Quick-Copy */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Exact Geographic Location</span>
                  <span className="font-semibold text-slate-900 text-xs">{selectedPhotoEvent.location}</span>
                  <span className="text-slate-500 block">{selectedPhotoEvent.district}, {selectedPhotoEvent.state}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Exact GPS Coordinates</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {selectedPhotoEvent.latitude}°N, {selectedPhotoEvent.longitude}°E
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCoordinates(selectedPhotoEvent.latitude, selectedPhotoEvent.longitude)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                      title="Copy coordinates"
                    >
                      {hasCopiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-emerald-700 text-[10px] block font-mono">Sovereign India Territory</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Incident Catalog ID</span>
                  <span className="font-mono font-semibold text-slate-900 text-xs">{selectedPhotoEvent.id}</span>
                  <span className="text-slate-500 text-[10px] block font-mono">GSI / CWC Peer-Reviewed</span>
                </div>
              </div>

              {/* Forensic Event Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  Forensic Disaster Analysis & Failure Mechanism
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-200">
                  {selectedPhotoEvent.description}
                </p>
              </div>

              {/* Quantified Impact Metrics Table */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Validated Impact & Meteorological Data
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-rose-800 font-medium block">Total Fatalities</span>
                    <span className="text-base font-bold font-mono text-rose-700">
                      {selectedPhotoEvent.fatalities?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-amber-800 font-medium block">Displaced Population</span>
                    <span className="text-base font-bold font-mono text-amber-700">
                      {selectedPhotoEvent.displaced?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-blue-800 font-medium block">Peak Rainfall Record</span>
                    <span className="text-base font-bold font-mono text-blue-700">
                      {selectedPhotoEvent.rainfallRecord_mm || selectedPhotoEvent.rainfall_mm ? `${selectedPhotoEvent.rainfallRecord_mm || selectedPhotoEvent.rainfall_mm} mm` : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-700 font-medium block">Est. Economic Impact</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      ₹{selectedPhotoEvent.economicImpact_inr_cr ? `${selectedPhotoEvent.economicImpact_inr_cr} Cr` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provenance and Citation */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    Official Provenance & Citation:
                  </span>
                  {selectedPhotoEvent.sourceUrl && (
                    <a
                      href={selectedPhotoEvent.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-mono text-[11px] flex items-center gap-1 underline"
                    >
                      Official Source Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-mono">
                  {selectedPhotoEvent.source}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setSelectedPhotoEvent(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                >
                  Close Dossier
                </button>
                <button
                  onClick={() => {
                    setSelectedPhotoEvent(null);
                    onNavigateToMap();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Locate Incident on GIS Map</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
