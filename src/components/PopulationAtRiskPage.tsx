import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldAlert,
  Layers,
  MapPin,
  Info,
  ArrowUpRight,
  BarChart3,
  FileDown,
  Building2,
  Filter,
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';
import { RiskZone } from '../types';
import { calculateRealisticPopulation, CENSUS_DISTRICT_DENSITIES } from '../utils/populationEstimation';
import { exportDemographicAssessmentPDF } from '../utils/pdfExport';

interface PopulationAtRiskPageProps {
  riskZones: RiskZone[];
}

export const PopulationAtRiskPage: React.FC<PopulationAtRiskPageProps> = ({ riskZones }) => {
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Compute realistic demographic exposure for every zone, resolving any 0-value placeholders
  const processedZones = useMemo(() => {
    return riskZones.map(zone => {
      const realistic = calculateRealisticPopulation(
        zone.district,
        zone.state,
        zone.hazardType,
        zone.currentRisk,
        zone.boundaryPolygon,
        zone.populationExposed?.area_sqkm
      );

      // If zone had 0 or missing values, replace with realistic census estimation
      const total = (zone.populationExposed && zone.populationExposed.total > 100)
        ? zone.populationExposed.total
        : realistic.total;

      const red = (zone.populationExposed && zone.populationExposed.red > 50)
        ? zone.populationExposed.red
        : realistic.red;

      const orange = (zone.populationExposed && zone.populationExposed.orange > 50)
        ? zone.populationExposed.orange
        : realistic.orange;

      const yellow = (zone.populationExposed && zone.populationExposed.yellow > 50)
        ? zone.populationExposed.yellow
        : realistic.yellow;

      const areaSqKm = (zone.populationExposed && zone.populationExposed.area_sqkm && zone.populationExposed.area_sqkm > 10)
        ? zone.populationExposed.area_sqkm
        : realistic.areaSqKm;

      const districtInfo = CENSUS_DISTRICT_DENSITIES[zone.district];

      return {
        id: zone.id,
        name: zone.name,
        district: zone.district,
        state: zone.state,
        hazardType: zone.hazardType,
        severity: zone.currentRisk,
        totalExposed: total,
        red,
        orange,
        yellow,
        areaSqKm,
        densityPerSqKm: realistic.densityPerSqKm,
        classification: districtInfo?.classification || (realistic.densityPerSqKm > 1000 ? 'Metropolitan Urban' : realistic.densityPerSqKm > 500 ? 'Dense Plains' : 'Hilly Valley'),
        demographics: realistic.demographics,
        boundaryPolygon: zone.boundaryPolygon
      };
    });
  }, [riskZones]);

  // Unique states for filtering
  const states = useMemo(() => {
    const list = Array.from(new Set(processedZones.map(z => z.state))).sort();
    return list;
  }, [processedZones]);

  // Filtered view
  const filteredZones = useMemo(() => {
    return processedZones.filter(z => {
      if (selectedHazard !== 'all' && z.hazardType !== selectedHazard) return false;
      if (selectedState !== 'all' && z.state !== selectedState) return false;
      return true;
    });
  }, [processedZones, selectedHazard, selectedState]);

  // Aggregates
  const aggregates = useMemo(() => {
    const totalExposed = filteredZones.reduce((acc, z) => acc + z.totalExposed, 0);
    const redExposed = filteredZones.reduce((acc, z) => acc + z.red, 0);
    const orangeExposed = filteredZones.reduce((acc, z) => acc + z.orange, 0);
    const yellowExposed = filteredZones.reduce((acc, z) => acc + z.yellow, 0);
    const totalAreaSqKm = filteredZones.reduce((acc, z) => acc + z.areaSqKm, 0);

    // Estimate vulnerable populations
    const estimatedChildren = Math.round(totalExposed * 0.115);
    const estimatedElderly = Math.round(totalExposed * 0.088);
    const estimatedKutchaHousing = Math.round(totalExposed * 0.22);

    return {
      totalExposed,
      redExposed,
      orangeExposed,
      yellowExposed,
      totalAreaSqKm,
      estimatedChildren,
      estimatedElderly,
      estimatedKutchaHousing
    };
  }, [filteredZones]);

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportDemographicAssessmentPDF(filteredZones, aggregates);
    } catch (err) {
      console.error('Demographic PDF export error:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                Census of India & WorldPop 1km² Engine
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Realistic Spatial Intersections
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5 mt-1.5">
              <Users className="w-6 h-6 text-indigo-600" />
              Demographic Exposure & Population-at-Risk Engine
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Census-calibrated population density distribution patterns (density/km² × hazard footprint area) replacing flat district approximations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={filteredZones.length === 0 || isExporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Download formal demographic assessment report in PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Export Demographic PDF'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Hazard:</span>
            <select
              value={selectedHazard}
              onChange={e => setSelectedHazard(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Hazards</option>
              <option value="landslide">Landslide</option>
              <option value="flood">Flood</option>
              <option value="cyclone">Cyclone</option>
              <option value="earthquake">Earthquake</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">State:</span>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All States</option>
              {states.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {(selectedHazard !== 'all' || selectedState !== 'all') && (
            <button
              onClick={() => { setSelectedHazard('all'); setSelectedState('all'); }}
              className="text-xs text-rose-600 hover:text-rose-700 underline cursor-pointer font-medium"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500">
            Assessing <strong className="text-slate-800 font-mono">{filteredZones.length}</strong> active hazard risk zones
          </div>
        </div>
      </div>

      {/* Aggregate Zonal Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Population Exposed</span>
          <span className="text-2xl font-bold font-mono text-slate-900">{(aggregates.totalExposed / 1000).toFixed(1)}k</span>
          <span className="text-[11px] text-slate-500 block font-mono">{aggregates.totalExposed.toLocaleString()} people</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <span className="text-xs text-rose-700 block font-semibold">Red Zone (Immediate Evac)</span>
          <span className="text-2xl font-bold font-mono text-rose-700">{(aggregates.redExposed / 1000).toFixed(1)}k</span>
          <span className="text-[11px] text-slate-500 block font-mono">{aggregates.redExposed.toLocaleString()} direct hazard</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <span className="text-xs text-amber-700 block font-semibold">Orange Zone (High Watch)</span>
          <span className="text-2xl font-bold font-mono text-amber-700">{(aggregates.orangeExposed / 1000).toFixed(1)}k</span>
          <span className="text-[11px] text-slate-500 block font-mono">{aggregates.orangeExposed.toLocaleString()} buffer corridors</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <span className="text-xs text-yellow-700 block font-semibold">Yellow Zone (Advisory)</span>
          <span className="text-2xl font-bold font-mono text-yellow-700">{(aggregates.yellowExposed / 1000).toFixed(1)}k</span>
          <span className="text-[11px] text-slate-500 block font-mono">{aggregates.yellowExposed.toLocaleString()} catchment basins</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 col-span-2 lg:col-span-1 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Footprint Area</span>
          <span className="text-2xl font-bold font-mono text-emerald-700">{aggregates.totalAreaSqKm.toFixed(0)} km²</span>
          <span className="text-[11px] text-slate-500 block">Calculated spatial envelope</span>
        </div>
      </div>

      {/* Vulnerability Breakdown Sub-Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <HeartHandshake className="w-4 h-4 text-rose-600" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Critical Vulnerability & Humanitarian Priority Subgroups
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-600 block text-[11px]">Infants & Children (&lt;5 yrs)</span>
            <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
              {(aggregates.estimatedChildren / 1000).toFixed(1)}k <span className="text-xs text-slate-500 font-normal">({aggregates.estimatedChildren.toLocaleString()})</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Requires pediatric medical kits & infant nutrition in shelters</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-600 block text-[11px]">Elderly & Mobility-Constrained (&gt;60 yrs)</span>
            <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
              {(aggregates.estimatedElderly / 1000).toFixed(1)}k <span className="text-xs text-slate-500 font-normal">({aggregates.estimatedElderly.toLocaleString()})</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Prioritized for vehicle-assisted evacuation before nightfall</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-600 block text-[11px]">High-Vulnerability Kutcha / Semi-Pucca Housing</span>
            <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
              {(aggregates.estimatedKutchaHousing / 1000).toFixed(1)}k <span className="text-xs text-slate-500 font-normal">({aggregates.estimatedKutchaHousing.toLocaleString()})</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Susceptible to structural collapse from hydrostatic and wind pressure</span>
          </div>
        </div>
      </div>

      {/* Scientific Methodology Explanation Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600" />
          Census-Based Distribution Formula (Why Flat District Population Counts are Rejected)
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          Standard portals quote entire district populations (e.g., claiming 800,000 people are in danger because a localized landslide occurred in Wayanad). This misallocates NDRF/SDRF assets.
          ResQ-GIS calculates population exposure using:
          <span className="block mt-1 font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
            Population Exposed = Zone Footprint Area (km²) × Census District Density (per km²) × Terrain Vulnerability Multiplier
          </span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <strong className="text-slate-800 block mb-1">1. 30-Metre DEM Extraction</strong>
            <span className="text-slate-600">Delineates slope runout paths and hydraulic inundation contours rather than arbitrary administrative boundaries.</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <strong className="text-slate-800 block mb-1">2. District Density Calibrations</strong>
            <span className="text-slate-600">Integrates verified Census of India district records (e.g., Wayanad: 384/km², Chennai: 26,553/km², Barpeta: 742/km²).</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <strong className="text-slate-800 block mb-1">3. Zonal Buffer Cohorts</strong>
            <span className="text-slate-600">Apportions population into Red (&ge;75 score), Orange (55-74), and Yellow (35-54) operational cohorts.</span>
          </div>
        </div>
      </div>

      {/* Zonal Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Hazard Footprint Demographic Breakdown</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Calculated per risk zone using spatial footprint geometry and census metrics</p>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Table PDF</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Risk Zone & Location</th>
                <th className="p-3">Hazard</th>
                <th className="p-3">Level</th>
                <th className="p-3">Footprint Area</th>
                <th className="p-3">Census Density</th>
                <th className="p-3">Terrain Type</th>
                <th className="p-3 text-rose-700 font-semibold">Red (Evac)</th>
                <th className="p-3 text-amber-700 font-semibold">Orange (Watch)</th>
                <th className="p-3 text-yellow-700 font-semibold">Yellow (Adv)</th>
                <th className="p-3 font-bold text-slate-900">Total Exposed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredZones.map(zone => (
                <tr key={zone.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-sans font-medium text-slate-900">
                    {zone.name}
                    <span className="block text-[10px] text-slate-500 font-normal">{zone.district}, {zone.state}</span>
                  </td>
                  <td className="p-3 uppercase">{zone.hazardType}</td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      zone.severity === 'RED' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {zone.severity}
                    </span>
                  </td>
                  <td className="p-3">{zone.areaSqKm.toFixed(0)} km²</td>
                  <td className="p-3 text-slate-700">{zone.densityPerSqKm} /km²</td>
                  <td className="p-3 font-sans text-[10px] text-slate-500">{zone.classification}</td>
                  <td className="p-3 text-rose-700 font-bold">{zone.red.toLocaleString()}</td>
                  <td className="p-3 text-amber-700">{zone.orange.toLocaleString()}</td>
                  <td className="p-3 text-yellow-700">{zone.yellow.toLocaleString()}</td>
                  <td className="p-3 font-bold text-slate-900 font-sans">{zone.totalExposed.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

