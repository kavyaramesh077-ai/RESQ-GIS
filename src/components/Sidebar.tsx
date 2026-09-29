import React from 'react';
import {
  Home,
  LayoutDashboard,
  Bell,
  Map as MapIcon,
  Cpu,
  History,
  Users,
  Building2,
  Megaphone,
  Settings,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  redAlertCount: number;
  pendingReportsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  redAlertCount,
  pendingReportsCount
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, badge: null },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'realtime-db', label: 'Live APIs & Database', icon: Radio, badge: 'SSE / DB', badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
    { id: 'alerts', label: 'Live Alerts', icon: Bell, badge: redAlertCount > 0 ? `${redAlertCount} RED` : null, badgeColor: 'bg-rose-100 text-rose-800 border border-rose-200' },
    { id: 'map', label: 'GIS Map', icon: MapIcon, badge: 'Live GIS', badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
    { id: 'ai-analyzer', label: 'AI Risk Analyzer', icon: Cpu, badge: 'CNN/LSTM', badgeColor: 'bg-blue-100 text-blue-800 border border-blue-200' },
    { id: 'historical', label: 'Historical Hazards', icon: History, badge: '25 yrs', badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200' },
    { id: 'population', label: 'Population at Risk', icon: Users, badge: 'WorldPop', badgeColor: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
    { id: 'relocation', label: 'Relocation & Shelters', icon: Building2, badge: 'Nearest 3', badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    { id: 'report', label: 'Report a Hazard', icon: Megaphone, badge: null },
    { id: 'admin', label: 'Admin Panel', icon: Settings, badge: pendingReportsCount > 0 ? `${pendingReportsCount} pending` : null, badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200' }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sovereign India Verification Footnote */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-start gap-2 text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">Geospatial Integrity</p>
            <p className="text-[10px] leading-tight text-slate-500">
              Clipped strictly to India sovereign territory via Ray-Casting PIP. Zero fake data.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
