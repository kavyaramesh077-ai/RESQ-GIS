import React, { useState } from 'react';
import {
  X,
  History,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  CloudRain,
  Sliders,
  Filter
} from 'lucide-react';
import { ToastAlertItem } from './SafetyNotificationToast';
import { HAZARD_SAFETY_THRESHOLDS } from '../data/riskThresholds';
import { HazardType } from '../types';

interface SafetyNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ToastAlertItem[];
  onClearHistory: () => void;
  onInspectZone: (zoneId: string) => void;
  onAcknowledgeAll: () => void;
}

export const SafetyNotificationDrawer: React.FC<SafetyNotificationDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onInspectZone,
  onAcknowledgeAll
}) => {
  const [selectedHazardFilter, setSelectedHazardFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'alerts' | 'matrix'>('alerts');

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => {
    if (selectedHazardFilter === 'all') return true;
    return item.hazardType === selectedHazardFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Weather Safety Notification Center
              </h2>
              <p className="text-xs text-slate-500">
                Auto-updating safety threshold excursion audit log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Alert Log ({history.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Safety Threshold Rules</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'alerts' ? (
            <>
              {/* Filter & Actions Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                  <select
                    value={selectedHazardFilter}
                    onChange={e => setSelectedHazardFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All Hazards ({history.length})</option>
                    <option value="cloudburst">Cloudburst</option>
                    <option value="landslide">Landslide</option>
                    <option value="flood">Flood</option>
                    <option value="cyclone">Cyclone</option>
                  </select>
                </div>

                {history.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onAcknowledgeAll}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                    >
                      Acknowledge All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={onClearHistory}
                      className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                      title="Clear notification history"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                )}
              </div>

              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 space-y-3 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/70" />
                  <p className="text-xs font-medium text-slate-600">No active threshold breaches</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    The auto-updating monitor is actively scanning zone weather metrics against IMD/NDMA safety criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map(item => {
                    const isCritical = item.severity === 'CRITICAL';
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border space-y-2 text-xs transition-colors ${
                          isCritical
                            ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                            : 'bg-amber-50/50 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase ${
                                  isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                                }`}
                              >
                                {item.severity}
                              </span>
                              <span className="font-semibold text-slate-900">{item.zoneName}</span>
                              {item.isSimulated && (
                                <span className="text-[9px] text-slate-500 font-mono bg-white border border-slate-200 px-1 rounded">
                                  SIMULATION
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {item.district}, {item.state} · <span className="uppercase font-mono font-medium text-slate-700">{item.hazardType}</span>
                            </p>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="font-mono text-xs text-slate-800 bg-white/80 p-2 rounded border border-slate-200/60">
                          {item.primaryBreachText}
                        </p>

                        {item.breaches.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-200/60">
                            {item.breaches.map((b, i) => (
                              <div key={i} className="flex items-center justify-between text-[11px] text-slate-600">
                                <span>{b.label}:</span>
                                <span className="font-mono font-semibold text-rose-700">
                                  {b.currentValue} {b.unit} ({b.formattedDifference})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-[11px] text-slate-600 italic">
                          <strong className="text-slate-700 not-italic font-medium">Protocol: </strong>
                          {item.advisory}
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              onInspectZone(item.zoneId);
                              onClose();
                            }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                          >
                            <CloudRain className="w-3 h-3" />
                            <span>Inspect Zone Weather →</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <strong>Government Safety Standards: </strong>
                Safety thresholds are defined in accordance with India Meteorological Department (IMD) early warning criteria and NDMA Disaster Guidelines. When weather telemetry exceeds critical values, an automated toast alert is dispatched.
              </div>

              {Object.values(HAZARD_SAFETY_THRESHOLDS).slice(0, 4).map(cfg => (
                <div key={cfg.hazardType} className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase font-mono">{cfg.hazardName}</h3>
                    <span className="text-[10px] text-slate-500 font-mono">{cfg.rules.length} monitored variables</span>
                  </div>
                  <div className="space-y-1.5">
                    {cfg.rules.map((rule, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-slate-200 text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{rule.label}</span>
                          <span className="font-mono font-bold text-rose-700">
                            {rule.condition === 'GREATER_THAN_OR_EQUAL' ? '≥ ' : '≤ '}
                            {rule.criticalThreshold} {rule.unit}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">{rule.rationale}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 italic">
                    <strong className="not-italic text-slate-700">Action: </strong>
                    {cfg.criticalAdvisory}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span>ResQ-GIS Automated Alert Engine</span>
          <span className="font-mono">Auto-Sync 30s</span>
        </div>
      </div>
    </div>
  );
};
