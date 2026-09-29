import React, { useState } from 'react';
import {
  Cpu,
  Search,
  MapPin,
  Sparkles,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ExternalLink,
  Info,
  Clock,
  Camera,
  Maximize2
} from 'lucide-react';
import { HazardType, AIRiskAnalysisResult, RiskZone } from '../types';
import { analyzeLocationRisk } from '../services/dataOrchestrator';
import { isPointInIndia, getIndiaSpatialValidation } from '../data/indiaBoundary';
import { lookupExactPlaceEvidence } from '../data/exactPlaceEvidence';

interface AIRiskAnalyzerPageProps {
  initialZone?: RiskZone | null;
  onNavigateToShelters: () => void;
}

export const AIRiskAnalyzerPage: React.FC<AIRiskAnalyzerPageProps> = ({
  initialZone,
  onNavigateToShelters
}) => {
  const [latInput, setLatInput] = useState<string>(
    initialZone ? initialZone.coordinates[0].toString() : '11.5173'
  );
  const [lonInput, setLonInput] = useState<string>(
    initialZone ? initialZone.coordinates[1].toString() : '76.1368'
  );
  const [selectedHazard, setSelectedHazard] = useState<HazardType>(
    initialZone ? initialZone.hazardType : 'landslide'
  );
  const [locationName, setLocationName] = useState<string>(
    initialZone ? initialZone.name : 'Wayanad Meppadi Hill Tract'
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIRiskAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick preset locations in India
  const presetLocations = [
    { name: 'Kullu, Himachal Pradesh (Beas Gorge Cloudburst)', lat: 31.9579, lon: 77.1095, hazard: 'cloudburst' as HazardType },
    { name: 'Wayanad, Kerala (Mountain Debris Flow)', lat: 11.5173, lon: 76.1368, hazard: 'landslide' as HazardType },
    { name: 'Munnar, Idukki, Kerala (High Slope Escarpment)', lat: 10.0889, lon: 77.0595, hazard: 'landslide' as HazardType },
    { name: 'Chennai, Tamil Nadu (Low-Lying Urban Basin)', lat: 13.0827, lon: 80.2707, hazard: 'flood' as HazardType },
    { name: 'Barpeta, Assam (Brahmaputra Riparian Plain)', lat: 26.3214, lon: 91.0062, hazard: 'flood' as HazardType },
    { name: 'Puri, Odisha (Coastal Cyclone Corridor)', lat: 19.8135, lon: 85.8312, hazard: 'cyclone' as HazardType },
    { name: 'Chamoli, Uttarakhand (Himalayan Seismic Belt)', lat: 30.4070, lon: 79.4180, hazard: 'earthquake' as HazardType }
  ];

  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);

    if (isNaN(lat) || isNaN(lon)) {
      setErrorMessage('Please enter valid numerical latitude and longitude coordinates.');
      return;
    }

    // Strict India sovereign check
    const validation = getIndiaSpatialValidation(lat, lon);
    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    setIsLoading(true);
    try {
      const res = await analyzeLocationRisk(lat, lon, selectedHazard, locationName);
      setAnalysisResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete AI Risk Analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (preset: typeof presetLocations[0]) => {
    setLatInput(preset.lat.toString());
    setLonInput(preset.lon.toString());
    setSelectedHazard(preset.hazard);
    setLocationName(preset.name.split('(')[0].trim());
    setErrorMessage(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-blue-600" />
          AI Risk Analyzer & Hybrid Deep Learning Inference
        </h1>
        <p className="text-xs text-slate-500">
          Coupled multi-scale spatial CNN, temporal LSTM sequence models, and physical hydrodynamic equations for any coordinate in India
        </p>
      </div>

      {/* Preset Quick Selectors */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-600">Sample Indian Hazard Corridors:</span>
        <div className="flex flex-wrap gap-2">
          {presetLocations.map(p => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Query Form */}
      <form onSubmit={handleRunAnalysis} className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-600 font-medium block mb-1">Location / Sector Name</label>
            <input
              type="text"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Munnar Ghat Sector"
            />
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Latitude (°N)</label>
            <input
              type="number"
              step="0.0001"
              value={latInput}
              onChange={e => setLatInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              placeholder="e.g. 10.0889"
            />
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Longitude (°E)</label>
            <input
              type="number"
              step="0.0001"
              value={lonInput}
              onChange={e => setLonInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              placeholder="e.g. 77.0595"
            />
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Target Hazard</label>
            <select
              value={selectedHazard}
              onChange={e => setSelectedHazard(e.target.value as HazardType)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="cloudburst">Cloudburst (Orographic Convective Deluge)</option>
              <option value="landslide">Landslide (Hill Escarpment)</option>
              <option value="flood">Flood (Basin Inundation)</option>
              <option value="cyclone">Cyclone (Coastal Surge)</option>
              <option value="earthquake">Earthquake (Seismic PGA)</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Querying Atmospheric & Terrain Sensors...' : 'Run AI Multi-Hazard Analysis'}</span>
          </button>
        </div>
      </form>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Top Score Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                    analysisResult.aiRiskLevel === 'RED'
                      ? 'bg-rose-600 text-white'
                      : analysisResult.aiRiskLevel === 'ORANGE'
                      ? 'bg-amber-600 text-white'
                      : 'bg-yellow-500 text-slate-950 font-bold'
                  }`}>
                    {analysisResult.aiRiskLevel} — RISK SCORE: {analysisResult.riskScore}/100
                  </span>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {analysisResult.hazardType}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {analysisResult.location.name}
                  <span className="text-xs font-normal text-slate-500 font-mono">
                    ({analysisResult.location.latitude.toFixed(4)}°N, {analysisResult.location.longitude.toFixed(4)}°E)
                  </span>
                </h2>
              </div>

              <div className="text-left sm:text-right text-xs font-mono space-y-1">
                <div className="text-slate-500">
                  Historical Susceptibility: <strong className="text-slate-800">{analysisResult.historicalSusceptibility} ({analysisResult.historicalScore}/100)</strong>
                </div>
                <div className="text-slate-500">
                  Ensemble Confidence: <strong className="text-emerald-700 font-bold">{Math.round(analysisResult.modelInference.ensembleConfidence * 100)}%</strong>
                </div>
              </div>
            </div>

            {/* Model Architecture Inference Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">ResQ-Spatial-CNN Score</span>
                <span className="text-xl font-bold font-mono text-blue-600">{analysisResult.modelInference.cnnSpatialScore}/100</span>
                <p className="text-[10px] text-slate-500">Multi-scale 2D terrain slope & elevation gradient</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">ResQ-Hydro-LSTM Score</span>
                <span className="text-xl font-bold font-mono text-emerald-600">{analysisResult.modelInference.lstmSequenceScore}/100</span>
                <p className="text-[10px] text-slate-500">7-day hydro-meteorological antecedent accumulation</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">ResNet-50 Vision Feature Extractor</span>
                <span className="text-xs font-bold text-slate-800 block">{analysisResult.modelInference.resnetFeatureStatus}</span>
                <p className="text-[10px] text-slate-500">Validated on Sentinel-2 optical multi-spectral bands</p>
              </div>
            </div>

            {/* Exact Ground-Truth Photographic Evidence for Analyzed Sector */}
            {(() => {
              const exactEvidence = lookupExactPlaceEvidence(
                analysisResult.location.name,
                '',
                '',
                analysisResult.hazardType
              );

              return (
                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-md">
                  <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                        Exact Verified Ground-Truth Photography & Micro-Basin Profile
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {analysisResult.location.latitude.toFixed(4)}°N, {analysisResult.location.longitude.toFixed(4)}°E
                    </span>
                  </div>

                  <div className="relative group overflow-hidden max-h-72 bg-black flex items-center justify-center">
                    <img
                      src={exactEvidence.imageUrl}
                      alt={exactEvidence.imageCaption}
                      className="w-full h-auto object-cover max-h-72 transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-semibold drop-shadow-sm">
                        {exactEvidence.imageCaption}
                      </span>
                      <a
                        href={exactEvidence.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-black/70 hover:bg-black/90 text-white text-[11px] font-medium border border-white/20 hover:border-emerald-400 flex items-center gap-1 transition-all"
                      >
                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                        <span>Inspect High-Res</span>
                      </a>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 text-xs border-t border-slate-800 flex items-center justify-between gap-3 text-slate-300">
                    <p className="text-[11px]">
                      <strong>Terrain & Geomorphic Domain:</strong> {exactEvidence.exactPlaceLocationDetails}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(analysisResult.location.name)}+${analysisResult.location.latitude}+${analysisResult.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline shrink-0 text-[11px] flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>Open in Google Maps</span>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Current Conditions vs Historical Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live Environmental Metrics */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Live Atmospheric & Terrain Telemetry
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">24h Rainfall</span>
                  <span className="font-mono font-bold text-slate-800">{analysisResult.currentConditions.rainfall24h_mm} mm</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">3-Day Rainfall Accumulation</span>
                  <span className="font-mono font-bold text-slate-800">{analysisResult.currentConditions.rainfall3d_mm} mm</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">7-Day Rainfall Total</span>
                  <span className="font-mono font-bold text-slate-800">{analysisResult.currentConditions.rainfall7d_mm} mm</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Soil Moisture Saturation</span>
                  <span className="font-mono font-bold text-slate-800">{analysisResult.currentConditions.soilMoisture_percent}%</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Copernicus 30m Elevation</span>
                  <span className="font-mono font-bold text-slate-800">{analysisResult.currentConditions.elevation_m} m</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Terrain Slope Angle</span>
                  <span className="font-mono font-bold text-slate-800">{analysisResult.currentConditions.slope_deg}°</span>
                </div>
              </div>
            </div>

            {/* Historical Evidence & Population */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Historical Evidence & Population Exposure
              </h3>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Verified Past Events in Vicinity</span>
                  <p className="text-slate-800">
                    <strong className="text-emerald-700 font-mono font-bold">{analysisResult.historicalEvidence.nearbyHistoricalEventsCount}</strong> past documented events within 140km.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Latest Event: {analysisResult.historicalEvidence.latestEventDate} ({analysisResult.historicalEvidence.latestEventTitle})
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">WorldPop Gridded Population Exposure</span>
                  <p className="text-slate-800 font-mono">
                    Total Exposed: <strong className="text-slate-900 font-bold">{analysisResult.populationExposed.totalAtRisk.toLocaleString()}</strong>
                  </p>
                  <div className="flex gap-2 text-[10px] text-slate-600 font-mono pt-1">
                    <span className="text-rose-700 font-semibold">Red: {analysisResult.populationExposed.redZone.toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-amber-700 font-semibold">Orange: {analysisResult.populationExposed.orangeZone.toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-yellow-700 font-semibold">Yellow: {analysisResult.populationExposed.yellowZone.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Explainable AI Causal Analysis & Action */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Evidence-Based AI Explanation: WHY This Location is at Risk
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {analysisResult.aiExplanation}
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Recommended Civil Defense Action
              </h4>
              <p className="text-xs text-emerald-900 leading-relaxed bg-emerald-50 p-3.5 rounded-lg border border-emerald-200">
                {analysisResult.recommendedAction}
              </p>
            </div>
          </div>

          {/* Nearest 3 Verified Relocation Shelters */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Nearest 3 Verified Emergency Evacuation Shelters
              </h3>
              <button
                onClick={onNavigateToShelters}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
              >
                View Directory →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {analysisResult.nearestShelters.map((sh, idx) => (
                <div key={sh.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-700">
                      #{idx + 1} • {sh.distanceKm} km
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 uppercase font-medium">
                      {sh.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">{sh.name}</h4>
                  <p className="text-[11px] text-slate-500">{sh.address}</p>
                  <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-200 font-mono">
                    Capacity: <strong>{sh.capacity} persons</strong>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Contact: {sh.contactPerson} ({sh.contactPhone})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Provenance Table */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-xs shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              Dataset Provenance & Observation Timestamps (Zero Fake Data Guarantee)
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] text-slate-600 font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-800">
                    <th className="pb-1">Variable</th>
                    <th className="pb-1">Source / Dataset</th>
                    <th className="pb-1">Resolution</th>
                    <th className="pb-1">Observation Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysisResult.provenance.map((p, i) => (
                    <tr key={i}>
                      <td className="py-1 text-slate-800">{p.variable}</td>
                      <td className="py-1">{p.source}</td>
                      <td className="py-1">{p.resolution || 'N/A'}</td>
                      <td className="py-1">{p.observationDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
