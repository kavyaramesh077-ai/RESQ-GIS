import React, { useState, useEffect } from 'react';
import { ShieldAlert, Download, Radio, MapPin, Clock } from 'lucide-react';
import { AlertItem } from '../types';

interface NavbarProps {
  activeAlerts: AlertItem[];
  onNavigate: (page: string) => void;
  onOpenDownload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeAlerts,
  onNavigate,
  onOpenDownload
}) => {
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to Indian Standard Time (IST)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      };
      setIstTime(new Intl.DateTimeFormat('en-IN', options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const redAlertsCount = activeAlerts.filter(a => a.severity === 'RED').length;
  const orangeAlertsCount = activeAlerts.filter(a => a.severity === 'ORANGE').length;

  return (
    <header className="bg-white/95 border-b border-slate-200 text-slate-800 sticky top-0 z-40 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-emerald-700 transition-colors">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                ResQ-GIS
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold">
                INDIA ONLY
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Multi-Hazard Early Warning & AI Decision Support
            </p>
          </div>
        </div>

        {/* Live Operational Status & Clock */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-slate-700 font-mono font-medium">Open-Meteo & USGS Live Sync</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700 font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{istTime || 'IST Syncing...'}</span>
          </div>
        </div>

        {/* Action Controls & Alert Counter */}
        <div className="flex items-center gap-3">
          {/* Live Real-Time & Database Indicator */}
          <button
            onClick={() => onNavigate('realtime-db')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Real-Time APIs & Persistent Database Explorer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-semibold font-mono text-[11px]">Live API & DB</span>
          </button>

          {/* Active Warnings Pill */}
          <button
            onClick={() => onNavigate('alerts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              redAlertsCount > 0
                ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                : orangeAlertsCount > 0
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${redAlertsCount > 0 ? 'text-rose-600 animate-pulse' : 'text-amber-600'}`} />
            <span className="font-semibold">
              {activeAlerts.length} Active {activeAlerts.length === 1 ? 'Alert' : 'Alerts'}
            </span>
            {redAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-bold text-[10px]">
                {redAlertsCount} RED
              </span>
            )}
          </button>

          {/* SIH ZIP Download Button */}
          <button
            onClick={onOpenDownload}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Download Complete SIH Project Package (ResQ-GIS-SIH-READY.zip)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download ZIP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
