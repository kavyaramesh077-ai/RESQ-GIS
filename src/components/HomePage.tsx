import React from 'react';
import {
  ShieldAlert,
  MapPin,
  Cpu,
  Layers,
  Building2,
  CheckCircle2,
  ArrowRight,
  Database,
  Radio,
  ExternalLink,
  Users
} from 'lucide-react';
import { RiskZone, AlertItem } from '../types';

interface HomePageProps {
  riskZones: RiskZone[];
  activeAlerts: AlertItem[];
  onNavigate: (page: string) => void;
  onOpenDownload: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  riskZones,
  activeAlerts,
  onNavigate,
  onOpenDownload
}) => {
  const redAlerts = activeAlerts.filter(a => a.severity === 'RED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-slate-800">
      {/* Hero / System Mission Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Smart India Hackathon (SIH) Ready Production Architecture
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            ResQ-GIS — India Multi-Hazard GIS, AI Risk Analysis & Early Warning System
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            A real-world decision-support system designed to reduce loss of life from natural hazards across the Republic of India.
            Operating under a strict <strong className="text-emerald-700 font-semibold">Zero Fake Data</strong> protocol, ResQ-GIS continuously couples live atmospheric forecasts with 30m Copernicus terrain gradients, GSI/CWC historical hazard inventories, and WorldPop gridded demographic exposure models.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('map')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Open India GIS Map</span>
            </button>

            <button
              onClick={() => onNavigate('ai-analyzer')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>Launch AI Risk Analyzer</span>
            </button>
          </div>
        </div>

        {/* Live System Telemetry Badge Card */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200 pt-6 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px] block font-medium">Sovereign Jurisdiction</span>
            <span className="font-bold text-slate-800 font-mono">Republic of India</span>
            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">Strict Point-in-Polygon Check</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px] block font-medium">Atmospheric Feed</span>
            <span className="font-bold text-slate-800 font-mono">Open-Meteo NWP</span>
            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">24h / 3d / 7d Live Hourly</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px] block font-medium">Seismic Observation</span>
            <span className="font-bold text-slate-800 font-mono">USGS Catalog</span>
            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">Real-Time Indian Coordinates</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[11px] block font-medium">Population Model</span>
            <span className="font-bold text-slate-800 font-mono">WorldPop 2025</span>
            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">1 km Gridded Spatial Density</span>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Architectural Distinctions</h2>
          <p className="text-xs text-slate-500">Engineering principles separating ResQ-GIS from generic dashboard templates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-800">The Two Types of Risk</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Distinguishes between <strong className="text-slate-800 font-medium">Type A (Historical Susceptibility)</strong> and <strong className="text-slate-800 font-medium">Type B (Current Dynamic Activation)</strong>. A mountain tract in Wayanad or a low-lying basin in Chennai retains permanent historical susceptibility even during dry spells, with risk elevating dynamically when 24h/3d rainfall triggers are breached.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-800">India Sovereign Boundary Clipping</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every coordinate, hazard polygon, alert, and gridded population count is verified with ray-casting point-in-polygon checks. Neighboring sovereign nations (Pakistan, China, Nepal, Bhutan, Bangladesh, Myanmar, Sri Lanka) receive zero alerts or risk tags.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-sm font-bold text-slate-800">Zero Fake Data Protocol</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Never invents synthetic disasters or hard-codes cities as red for visual effect. Every metric contains verifiable scientific provenance: data source name, live query URL, timestamp, observation date, and processing methodology.
            </p>
          </div>
        </div>
      </section>

      {/* Disaster Photographic Evidence & Ground Truth Showcase */}
      <section className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white space-y-5 relative overflow-hidden border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider block">
              📷 Sovereign Disaster Documentation Archive
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Verified Ground-Truth Hazard & Shelter Photography
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Photographic field documentation cataloging major Indian debris flows, Himalayan cloudbursts, urban deluge events, and coastal cyclone shelters.
            </p>
          </div>
          <button
            onClick={() => onNavigate('historical')}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Browse Full Photo Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigate('historical')}
            className="group relative aspect-16/10 rounded-xl overflow-hidden cursor-pointer bg-slate-850 border border-white/10 hover:border-emerald-400 transition-all"
          >
            <img
              src="/images/wayanad_landslide_1790611336595.jpg"
              alt="Wayanad Landslide"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
              <span className="text-[10px] font-bold block leading-tight">Wayanad Debris Flow</span>
              <span className="text-[9px] text-emerald-300 font-mono">2024 • 572mm Deluge</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('historical')}
            className="group relative aspect-16/10 rounded-xl overflow-hidden cursor-pointer bg-slate-850 border border-white/10 hover:border-emerald-400 transition-all"
          >
            <img
              src="/images/kedarnath_flood_1790611348435.jpg"
              alt="Kedarnath Cloudburst"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
              <span className="text-[10px] font-bold block leading-tight">Kedarnath Cloudburst</span>
              <span className="text-[9px] text-blue-300 font-mono">2013 • Glacial Deluge</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('historical')}
            className="group relative aspect-16/10 rounded-xl overflow-hidden cursor-pointer bg-slate-850 border border-white/10 hover:border-emerald-400 transition-all"
          >
            <img
              src="/images/chennai_monsoon_flood_1790611360990.jpg"
              alt="Chennai Urban Flood"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
              <span className="text-[10px] font-bold block leading-tight">Chennai Inundation</span>
              <span className="text-[9px] text-cyan-300 font-mono">2015 • 494mm 24h Rain</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('relocation')}
            className="group relative aspect-16/10 rounded-xl overflow-hidden cursor-pointer bg-slate-850 border border-white/10 hover:border-emerald-400 transition-all"
          >
            <img
              src="/images/cyclone_relief_shelter_1790611389117.jpg"
              alt="Disaster Evacuation Shelter"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
              <span className="text-[10px] font-bold block leading-tight">Reinforced Shelters</span>
              <span className="text-[9px] text-emerald-300 font-mono">SDMA Evacuation Hubs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Dedicated Decision-Support Modules</h2>
          <p className="text-xs text-slate-500">Ten purpose-built operational interfaces for emergency managers, researchers, and citizens</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            onClick={() => onNavigate('dashboard')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                Overview Dashboard
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500">National multi-hazard risk distribution, active alert summaries, and population exposure overview.</p>
          </div>

          <div 
            onClick={() => onNavigate('alerts')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 group-hover:text-rose-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Live Alerts Engine
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500">Automated warning bulletins with complete physical evidence, forecast triggers, and recommended civil defense protocols.</p>
          </div>

          <div 
            onClick={() => onNavigate('ai-analyzer')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                AI Risk Analyzer
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500">Deep scientific inference for any coordinate in India using coupled CNN/LSTM models and physical terrain derivatives.</p>
          </div>

          <div 
            onClick={() => onNavigate('historical')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600" />
                Historical Hazards
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500">25 years of documented Indian disaster events from GSI, CWC, and IMD with seasonality and recurrence analytics.</p>
          </div>

          <div 
            onClick={() => onNavigate('population')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Population at Risk
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500">WorldPop gridded population density intersections calculating Red, Orange, and Yellow exposed communities.</p>
          </div>

          <div 
            onClick={() => onNavigate('relocation')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Relocation & Shelters
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500">Haversine distance routing to nearest 3 verified multi-purpose cyclone shelters and flood relief camps.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
