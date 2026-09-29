import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RiskZone, HazardType, RiskLevel } from '../types';
import { INDIA_BOUNDARY_COORDS, INDIA_MAP_CENTER, INDIA_MAP_DEFAULT_ZOOM, isPointInIndia } from '../data/indiaBoundary';
import { Layers, Search, Compass, Eye, Filter, Sparkles, AlertTriangle, Camera, ExternalLink } from 'lucide-react';

interface MapViewProps {
  riskZones: RiskZone[];
  onSelectLocationForAI: (zone: RiskZone) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  riskZones,
  onSelectLocationForAI
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [activeHazardFilter, setActiveHazardFilter] = useState<string>('all');
  const [riskMode, setRiskMode] = useState<'current' | 'historical'>('current');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Leaflet map centered strictly on India
    const map = L.map(mapContainerRef.current, {
      center: INDIA_MAP_CENTER,
      zoom: INDIA_MAP_DEFAULT_ZOOM,
      minZoom: 4,
      maxZoom: 14,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Standard OpenStreetMap base tile layer (crisp, professional, real cartography)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Survey of India references',
      maxZoom: 19
    }).addTo(map);

    // Render India Sovereign Boundary Outline (Clean Golden/Emerald outline)
    const boundaryPolygon = L.polygon(INDIA_BOUNDARY_COORDS, {
      color: '#10b981',
      weight: 2,
      dashArray: '4, 4',
      fill: false,
      interactive: false
    }).addTo(map);

    // Track mouse coordinates over India
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lon: Number(e.latlng.lng.toFixed(4))
      });
    });

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Hazard Polygons on map based on filters & risk mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const filteredZones = riskZones.filter(z => {
      if (!isPointInIndia(z.coordinates[0], z.coordinates[1])) return false;
      if (activeHazardFilter !== 'all' && z.hazardType !== activeHazardFilter) return false;
      return true;
    });

    filteredZones.forEach(zone => {
      const riskLevel: RiskLevel = riskMode === 'current' ? zone.currentRisk : zone.historicalSusceptibility;
      const riskScore = riskMode === 'current' ? zone.currentScore : zone.historicalScore;

      // Color coding as per SIH requirement:
      // RED = VERY HIGH, ORANGE = HIGH, YELLOW = MODERATE, GREEN = LOW
      let fillColor = '#22c55e'; // GREEN
      let borderColor = '#16a34a';
      if (riskLevel === 'RED') {
        fillColor = '#ef4444';
        borderColor = '#b91c1c';
      } else if (riskLevel === 'ORANGE') {
        fillColor = '#f97316';
        borderColor = '#c2410c';
      } else if (riskLevel === 'YELLOW') {
        fillColor = '#eab308';
        borderColor = '#ca8a04';
      }

      // Draw spatial polygon if defined, otherwise precise spatial buffer polygon
      const polygonCoords = zone.boundaryPolygon || [
        [zone.coordinates[0] - 0.08, zone.coordinates[1] - 0.08],
        [zone.coordinates[0] + 0.08, zone.coordinates[1] - 0.08],
        [zone.coordinates[0] + 0.08, zone.coordinates[1] + 0.08],
        [zone.coordinates[0] - 0.08, zone.coordinates[1] + 0.08]
      ];

      const polygon = L.polygon(polygonCoords, {
        color: borderColor,
        fillColor: fillColor,
        fillOpacity: riskLevel === 'RED' ? 0.65 : 0.45,
        weight: 2
      });

      // Interactive popup on zone click
      polygon.on('click', () => {
        setSelectedZone(zone);
      });

      polygon.bindTooltip(
        `<strong>${zone.name}</strong><br/>${zone.hazardType.toUpperCase()} — ${riskMode === 'current' ? 'Current' : 'Historical'}: ${riskLevel} (${riskScore}/100)`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );

      layerGroup.addLayer(polygon);

      // Centroid marker with clean badge
      const marker = L.circleMarker(zone.coordinates, {
        radius: 6,
        color: borderColor,
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2
      });

      marker.on('click', () => setSelectedZone(zone));
      layerGroup.addLayer(marker);
    });
  }, [riskZones, activeHazardFilter, riskMode]);

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    const query = searchQuery.toLowerCase();
    const match = riskZones.find(z =>
      z.name.toLowerCase().includes(query) ||
      z.district.toLowerCase().includes(query) ||
      z.state.toLowerCase().includes(query)
    );

    if (match) {
      mapInstanceRef.current.setView(match.coordinates, 9, { animate: true });
      setSelectedZone(match);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-100">
      {/* Top Map Control Overlay Bar */}
      <div className="absolute top-4 left-4 z-[500] max-w-xl w-full flex flex-col gap-2 pointer-events-auto">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Indian hazard zones (e.g. Wayanad, Munnar, Chennai, Barpeta)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/95 text-slate-800 text-xs rounded-lg border border-slate-200 shadow-md backdrop-blur focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Locate
          </button>
        </form>

        {/* Hazard and Risk-Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-white/95 p-2 rounded-lg border border-slate-200 backdrop-blur shadow-md text-xs">
          <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={activeHazardFilter}
              onChange={e => setActiveHazardFilter(e.target.value)}
              className="bg-slate-50 text-slate-800 text-xs px-2 py-1 rounded border border-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Hazards</option>
              <option value="cloudburst">Cloudbursts</option>
              <option value="landslide">Landslides</option>
              <option value="flood">Floods</option>
              <option value="cyclone">Cyclones</option>
              <option value="earthquake">Earthquakes</option>
            </select>
          </div>

          {/* Current vs Historical Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setRiskMode('current')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                riskMode === 'current'
                  ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current Active Risk
            </button>
            <button
              onClick={() => setRiskMode('historical')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                riskMode === 'historical'
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Historical Susceptibility
            </button>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Bottom Coordinates & Legend HUD */}
      <div className="absolute bottom-4 left-4 z-[500] pointer-events-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Lat/Lon Readout */}
        <div className="flex items-center gap-2 bg-white/95 text-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 backdrop-blur font-mono shadow-md">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {mouseCoords
              ? `${mouseCoords.lat}° N, ${mouseCoords.lon}° E (India)`
              : 'Hover map for coordinates'}
          </span>
        </div>

        {/* Risk Color Legend */}
        <div className="flex items-center gap-2 bg-white/95 text-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 backdrop-blur shadow-md">
          <span className="text-slate-500 font-medium">Severity:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-[11px] font-medium">Red</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-[11px] font-medium">Orange</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <span className="text-[11px] font-medium">Yellow</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-medium">Green</span>
          </span>
        </div>
      </div>

      {/* Zone Detail Modal / Popup Sidebar */}
      {selectedZone && (
        <div className="absolute top-4 right-4 z-[500] w-80 md:w-96 bg-white/95 border border-slate-200 rounded-xl shadow-2xl p-4 backdrop-blur-md pointer-events-auto animate-in fade-in slide-in-from-right-4">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {selectedZone.hazardType}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  selectedZone.currentRisk === 'RED'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : selectedZone.currentRisk === 'ORANGE'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}>
                  {selectedZone.currentRisk} ({selectedZone.currentScore}/100)
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedZone.name}</h3>
              <p className="text-xs text-slate-500">{selectedZone.district}, {selectedZone.state}</p>
            </div>
            <button
              onClick={() => setSelectedZone(null)}
              className="text-slate-400 hover:text-slate-600 text-sm p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Exact Place Photo in Map View */}
          {selectedZone.imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
              <div className="relative group">
                <img
                  src={selectedZone.imageUrl}
                  alt={selectedZone.name}
                  className="w-full h-32 sm:h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-white text-[10px]">
                  <span className="flex items-center gap-1 font-semibold text-emerald-300">
                    <Camera className="w-3 h-3 text-emerald-400" />
                    <span>Exact Place Photo</span>
                  </span>
                  <a
                    href={selectedZone.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-slate-300 hover:text-white flex items-center gap-0.5 text-[9px]"
                  >
                    <span>Full size</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
              {selectedZone.imageCaption && (
                <p className="p-2 text-[10px] text-slate-700 bg-slate-50 border-t border-slate-200 leading-tight">
                  {selectedZone.imageCaption}
                </p>
              )}
            </div>
          )}

          {/* Telemetry Metrics */}
          <div className="py-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">24h Rainfall</span>
                <span className="font-mono font-bold text-slate-800">{selectedZone.currentConditions.rainfall24h_mm} mm</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">3-Day Cumulative</span>
                <span className="font-mono font-bold text-slate-800">{selectedZone.currentConditions.rainfall3d_mm} mm</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Terrain Slope</span>
                <span className="font-mono font-bold text-slate-800">{selectedZone.currentConditions.slope_deg}°</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Elevation</span>
                <span className="font-mono font-bold text-slate-800">{selectedZone.currentConditions.elevation_m} m</span>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Historical Baseline</span>
              <p className="text-[11px] text-slate-700">
                {selectedZone.historicalEvidence.totalEventsRecorded} recorded disaster events. {selectedZone.historicalEvidence.recurrenceTendency}
              </p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Population Exposed</span>
              <p className="text-[11px] text-slate-700 font-mono">
                Total: <strong className="text-slate-900">{selectedZone.populationExposed.total.toLocaleString()}</strong> ({selectedZone.populationExposed.red.toLocaleString()} in Red Zone)
              </p>
            </div>
          </div>

          {/* Deep Action Button */}
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={() => onSelectLocationForAI(selectedZone)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze This Location with AI</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
