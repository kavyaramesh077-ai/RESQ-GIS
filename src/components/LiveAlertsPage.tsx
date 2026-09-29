import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Filter,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  FileDown,
  Sliders,
  Flame,
  Waves,
  Wind,
  Activity,
  CloudLightning,
  Layers,
  Search,
  Share2,
  Users
} from 'lucide-react';
import { AlertItem, HazardType, RiskLevel } from '../types';
import { exportAlertsSummaryPDF, exportRiskAnalysisPDF } from '../utils/pdfExport';
import { BASELINE_HAZARD_ZONES } from '../data/verifiedData';

interface LiveAlertsPageProps {
  alerts: AlertItem[];
  onNavigateToMap: () => void;
}

export const LiveAlertsPage: React.FC<LiveAlertsPageProps> = ({
  alerts,
  onNavigateToMap
}) => {
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [minRiskScore, setMinRiskScore] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: alerts.length,
      cloudburst: 0,
      landslide: 0,
      flood: 0,
      cyclone: 0,
      earthquake: 0
    };
    alerts.forEach(a => {
      if (counts[a.hazard] !== undefined) {
        counts[a.hazard]++;
      }
    });
    return counts;
  }, [alerts]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (selectedHazard !== 'all' && a.hazard !== selectedHazard) return false;
      if (selectedSeverity !== 'all' && a.severity !== selectedSeverity) return false;
      if (a.riskScore < minRiskScore) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLoc = a.location.toLowerCase().includes(q) ||
          a.district.toLowerCase().includes(q) ||
          a.state.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q);
        if (!matchesLoc) return false;
      }
      return true;
    }).sort((a, b) => b.riskScore - a.riskScore); // Highest stakes first
  }, [alerts, selectedHazard, selectedSeverity, minRiskScore, searchQuery]);

  const totalFilteredPopulation = useMemo(() => {
    return filteredAlerts.reduce((sum, a) => sum + (a.populationAtRisk || 0), 0);
  }, [filteredAlerts]);

  const redCount = filteredAlerts.filter(a => a.severity === 'RED').length;
  const orangeCount = filteredAlerts.filter(a => a.severity === 'ORANGE').length;

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportAlertsSummaryPDF(filteredAlerts, {
        hazard: selectedHazard === 'all' ? 'All Hazard Categories' : selectedHazard.toUpperCase(),
        severity: selectedSeverity === 'all' ? 'All Severity Levels' : selectedSeverity,
        minRisk: minRiskScore
      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const handleExportSingleAlert = (alert: AlertItem) => {
    // Find matching baseline zone if available, or generate synthetic zone
    const matchedZone = BASELINE_HAZARD_ZONES.find(z => z.id.includes(alert.hazard) || z.name === alert.location);
    if (matchedZone) {
      exportRiskAnalysisPDF(matchedZone);
    } else {
      exportAlertsSummaryPDF([alert], {
        hazard: alert.hazard.toUpperCase(),
        severity: alert.severity,
        minRisk: alert.riskScore
      });
    }
  };

  const hazardCategories = [
    { id: 'all', label: 'All Categories', icon: Layers, count: categoryCounts.all },
    { id: 'cloudburst', label: 'Cloudbursts', icon: CloudLightning, count: categoryCounts.cloudburst },
    { id: 'flood', label: 'Floods', icon: Waves, count: categoryCounts.flood },
    { id: 'landslide', label: 'Landslides', icon: Flame, count: categoryCounts.landslide },
    { id: 'cyclone', label: 'Cyclones', icon: Wind, count: categoryCounts.cyclone },
    { id: 'earthquake', label: 'Earthquakes', icon: Activity, count: categoryCounts.earthquake }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 uppercase tracking-wider">
                Emergency Response Feeds
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Live Sensor Trigger Integration
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5 mt-1.5">
              <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
              Automated Multi-Hazard Early Warning Bulletins
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Active advisories prioritized by severity thresholds, numerical weather prediction, and population exposure
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportPDF}
              disabled={filteredAlerts.length === 0 || isExporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Export formatted PDF bulletin for offline field documentation"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Export Bulletin (PDF)'}</span>
            </button>
            <button
              onClick={onNavigateToMap}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inspect on GIS Map</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="pt-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Hazard Category Filter</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hazardCategories.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedHazard === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedHazard(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs border border-rose-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Severity Slider & Filter Control Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          {/* Severity Slider */}
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Priority Severity Slider (Risk Score Threshold)</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Score ≥ {minRiskScore}/100
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minRiskScore}
              onChange={e => setMinRiskScore(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <button
                onClick={() => setMinRiskScore(0)}
                className={`hover:text-slate-900 cursor-pointer ${minRiskScore === 0 ? 'text-emerald-700 font-bold' : ''}`}
              >
                All (0+)
              </button>
              <button
                onClick={() => setMinRiskScore(45)}
                className={`hover:text-slate-900 cursor-pointer ${minRiskScore === 45 ? 'text-yellow-700 font-bold' : ''}`}
              >
                Moderate (45+)
              </button>
              <button
                onClick={() => setMinRiskScore(65)}
                className={`hover:text-slate-900 cursor-pointer ${minRiskScore === 65 ? 'text-amber-700 font-bold' : ''}`}
              >
                High Watch (65+)
              </button>
              <button
                onClick={() => setMinRiskScore(75)}
                className={`hover:text-slate-900 cursor-pointer ${minRiskScore === 75 ? 'text-rose-700 font-bold' : ''}`}
              >
                Evacuation RED (75+)
              </button>
            </div>
          </div>

          {/* Quick Severity Grade Dropdown & Text Search */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Severity Level</label>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="RED">RED (Immediate Evacuation)</option>
              <option value="ORANGE">ORANGE (High Watch Alert)</option>
              <option value="YELLOW">YELLOW (Moderate Advisory)</option>
            </select>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Location Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="District, location, state..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Live Filter Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-600">
              Showing <strong className="text-slate-900 font-mono">{filteredAlerts.length}</strong> prioritized notifications
            </span>
            {redCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                {redCount} RED Evacuation Alert{redCount > 1 ? 's' : ''}
              </span>
            )}
            {orangeCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {orangeCount} ORANGE Watch
              </span>
            )}
            <span className="text-slate-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Pop. in Active Footprint: <strong className="text-slate-900 font-mono">{(totalFilteredPopulation / 1000).toFixed(1)}k</strong>
            </span>
          </div>

          {(selectedHazard !== 'all' || selectedSeverity !== 'all' || minRiskScore > 0 || searchQuery) && (
            <button
              onClick={() => {
                setSelectedHazard('all');
                setSelectedSeverity('all');
                setMinRiskScore(0);
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 underline cursor-pointer font-medium"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Alerts Cards List */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
          <CheckCircle className="w-9 h-9 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No Active Warnings Matching Applied Criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting the hazard category, lowering the priority severity slider (currently ≥ {minRiskScore}), or clearing the search query.
          </p>
          <button
            onClick={() => {
              setSelectedHazard('all');
              setSelectedSeverity('all');
              setMinRiskScore(0);
              setSearchQuery('');
            }}
            className="mt-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 border border-slate-300 transition-colors cursor-pointer"
          >
            Show All Warnings
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alert => {
            const isRed = alert.severity === 'RED';
            const isOrange = alert.severity === 'ORANGE';

            const borderColor = isRed
              ? 'border-rose-300 bg-white shadow-xs'
              : isOrange
              ? 'border-amber-300 bg-white shadow-xs'
              : 'border-yellow-300 bg-white shadow-xs';

            const badgeBg = isRed
              ? 'bg-rose-600 text-white'
              : isOrange
              ? 'bg-amber-600 text-white'
              : 'bg-yellow-500 text-slate-950 font-bold';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-xl border transition-all space-y-4 shadow-xs ${borderColor} relative`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${badgeBg}`}>
                        {alert.severity} — {isRed ? 'VERY HIGH RISK' : isOrange ? 'HIGH RISK' : 'MODERATE ADVISORY'}
                      </span>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {alert.hazard}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700">
                        Priority Score: <strong className="text-slate-900">{alert.riskScore}/100</strong>
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      {alert.location}
                      <span className="text-xs font-normal text-slate-500">
                        ({alert.district}, {alert.state})
                      </span>
                    </h2>
                  </div>

                  <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-start gap-2">
                    <div className="text-left sm:text-right space-y-0.5">
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 sm:justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(alert.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Coords: {alert.latitude.toFixed(4)}°N, {alert.longitude.toFixed(4)}°E
                      </div>
                    </div>

                    <button
                      onClick={() => handleExportSingleAlert(alert)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                      title="Download formatted PDF documentation for this alert"
                    >
                      <FileDown className="w-3 h-3 text-indigo-600" />
                      <span>PDF Dossier</span>
                    </button>
                  </div>
                </div>

                {/* Visual Hazard Reconnaissance Banner */}
                {(() => {
                  const getHazardPhoto = (h: HazardType) => {
                    switch (h) {
                      case 'landslide':
                        return { url: '/images/wayanad_landslide_1790611336595.jpg', label: 'GSI Field Profile: Steep Slope Liquefaction & Debris Channel' };
                      case 'cloudburst':
                        return { url: '/images/kedarnath_flood_1790611348435.jpg', label: 'IMD Climatology: High-Altitude Convective Deluge & Basin Torrent' };
                      case 'flood':
                        return { url: '/images/chennai_monsoon_flood_1790611360990.jpg', label: 'CWC Hydrological Profile: Urban Lowland Catchment Inundation' };
                      case 'cyclone':
                        return { url: '/images/cyclone_storm_surge_1790611376168.jpg', label: 'IMD Coastal Radar: High Gale Landfall & Storm Tide Barrier' };
                      default:
                        return { url: '/images/wayanad_landslide_1790611336595.jpg', label: 'Disaster Reconnaissance Profile' };
                    }
                  };
                  const photo = getHazardPhoto(alert.hazard);
                  return (
                    <div className="relative aspect-24/7 sm:aspect-28/7 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={photo.url}
                        alt={photo.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent" />
                      <div className="absolute inset-0 p-3 flex items-center justify-between text-white">
                        <div className="space-y-0.5 max-w-lg">
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold block uppercase">
                            📷 Field Reconnaissance Reference
                          </span>
                          <span className="text-xs font-semibold text-slate-100 block">
                            {photo.label}
                          </span>
                        </div>
                        <span className="hidden sm:inline-block text-[10px] font-mono text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded border border-white/10">
                          {alert.location}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Evidence Grid: Current, Historical, Forecast */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                      1. Current Physical Conditions
                    </span>
                    <p className="text-slate-700 leading-relaxed">{alert.currentCondition}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                      2. Historical Hazard Recurrence
                    </span>
                    <p className="text-slate-700 leading-relaxed">{alert.historicalEvidence}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                      3. Forecast Progression
                    </span>
                    <p className="text-slate-700 leading-relaxed">{alert.forecastEvidence}</p>
                  </div>
                </div>

                {/* Physical Reason & Civil Defense Action */}
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <strong className="text-slate-800 block mb-1">Causal Trigger Analysis:</strong>
                    <p className="text-slate-700 leading-relaxed">{alert.reason}</p>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <strong className="text-emerald-800 block mb-1">Recommended Response Action:</strong>
                    <p className="text-emerald-900 leading-relaxed">{alert.recommendedAction}</p>
                  </div>
                </div>

                {/* Footer: Population Exposed & Provenance */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  <div>
                    Population in Risk Zone: <strong className="text-slate-800 font-mono">{alert.populationAtRisk.toLocaleString()}</strong> (WorldPop 1km estimation)
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                    <span>Source: {alert.dataSources[0]?.source || 'Open-Meteo & Copernicus DEM'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
