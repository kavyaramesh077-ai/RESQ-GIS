import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Flame,
  CloudRain,
  Wind,
  Droplets,
  Clock,
  History,
  Info
} from 'lucide-react';
import { HazardType, RiskZone } from '../types';
import { BreachedMetric, SafetyEvaluationResult } from '../data/riskThresholds';

export interface ToastAlertItem {
  id: string;
  zoneId: string;
  zoneName: string;
  district: string;
  state: string;
  hazardType: HazardType;
  severity: 'CRITICAL' | 'WARNING';
  timestamp: string;
  primaryBreachText: string;
  breaches: BreachedMetric[];
  advisory: string;
  isSimulated?: boolean;
  isAcknowledged?: boolean;
  autoDismissRemainingSec: number;
}

interface SafetyNotificationToastProps {
  toasts: ToastAlertItem[];
  onDismissToast: (id: string) => void;
  onAcknowledgeToast: (id: string) => void;
  onInspectZone: (zoneId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function playAlertChime(severity: 'CRITICAL' | 'WARNING') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (severity === 'CRITICAL') {
      // 2-tone urgent alert ping (high frequency siren motif)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(698, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.10, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch {
    // Non-blocking fallback if browser policy blocks autoplay
  }
}

export const SafetyToastContainer: React.FC<SafetyNotificationToastProps> = ({
  toasts,
  onDismissToast,
  onAcknowledgeToast,
  onInspectZone,
  soundEnabled,
  onToggleSound
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3 max-w-md w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map(toast => {
        const isCritical = toast.severity === 'CRITICAL';
        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto w-full rounded-xl bg-white border shadow-xl transition-all duration-300 transform translate-y-0 overflow-hidden ${
              isCritical
                ? 'border-rose-400 ring-2 ring-rose-500/20 shadow-rose-900/10'
                : 'border-amber-300 ring-2 ring-amber-400/20 shadow-amber-900/10'
            }`}
          >
            {/* Top Critical Header Banner */}
            <div
              className={`px-4 py-2.5 flex items-center justify-between gap-3 text-white ${
                isCritical
                  ? 'bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800'
                  : 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider font-mono truncate">
                  {isCritical ? 'Critical Safety Threshold Exceeded' : 'Safety Warning Threshold'}
                </span>
                {toast.isSimulated && (
                  <span className="text-[9px] font-mono uppercase bg-black/30 px-1.5 py-0.5 rounded text-white/90">
                    Test Simulated
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={onToggleSound}
                  title={soundEnabled ? 'Mute alert chimes' : 'Enable alert chimes'}
                  className="p-1 rounded hover:bg-white/20 text-white/90 transition-colors cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-white/60" />}
                </button>
                <button
                  onClick={() => onDismissToast(toast.id)}
                  title="Dismiss notification"
                  className="p-1 rounded hover:bg-white/20 text-white/90 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Toast Body */}
            <div className="p-4 space-y-3 bg-white text-slate-800">
              {/* Location & Hazard Meta */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">{toast.zoneName}</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>{toast.district}, {toast.state}</span>
                  <span aria-hidden="true">·</span>
                  <span className="uppercase font-mono font-semibold text-rose-700">{toast.hazardType}</span>
                </div>
              </div>

              {/* Primary Breach Highlight */}
              <div className={`p-2.5 rounded-lg border text-xs leading-snug ${
                isCritical ? 'bg-rose-50/70 border-rose-200 text-rose-950' : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}>
                <div className="font-semibold flex items-center gap-1.5 mb-1 text-slate-900">
                  <AlertTriangle className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
                  <span>Threshold Excursion Detected</span>
                </div>
                <p className="font-mono text-xs">{toast.primaryBreachText}</p>
              </div>

              {/* Specific Breached Metrics Strip */}
              {toast.breaches.length > 0 && (
                <div className="space-y-1.5 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Telemetry Trigger Breakdown
                  </span>
                  <div className="space-y-1">
                    {toast.breaches.map((b, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-medium truncate max-w-[170px]">{b.label}:</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-rose-700">{b.currentValue} {b.unit}</span>
                          <span className="text-slate-400 text-[10px]">(limit {b.thresholdValue})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advisory Protocol */}
              <p className="text-[11px] text-slate-600 italic line-clamp-2">
                <strong className="text-slate-700 not-italic font-medium">NDMA Protocol: </strong>
                {toast.advisory}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onInspectZone(toast.zoneId)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>Inspect Weather</span>
                </button>
                <button
                  onClick={() => onAcknowledgeToast(toast.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Acknowledge
                </button>
              </div>
            </div>

            {/* Auto-Dismiss Countdown Bar */}
            <div className="h-1 w-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  isCritical ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, (toast.autoDismissRemainingSec / 20) * 100))}%`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
