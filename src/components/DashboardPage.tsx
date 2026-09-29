import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  Map as MapIcon,
  Activity,
  ArrowRight,
  TrendingUp,
  CloudRain,
  Compass,
  Cpu,
  FileDown,
  Sparkles,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  Flame,
  Zap,
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { RiskZone, AlertItem, HistoricalEvent, ZoneWeatherDetails } from '../types';
import { exportRiskAnalysisPDF, exportHistoricalEventPDF, exportAlertsSummaryPDF } from '../utils/pdfExport';
import { WeatherWidget } from './WeatherWidget';
import {
  SafetyToastContainer,
  ToastAlertItem,
  playAlertChime
} from './SafetyNotificationToast';
import { SafetyNotificationDrawer } from './SafetyNotificationDrawer';
import {
  evaluateWeatherSafetyThresholds,
  SafetyEvaluationResult,
  HAZARD_SAFETY_THRESHOLDS
} from '../data/riskThresholds';

interface DashboardPageProps {
  riskZones: RiskZone[];
  activeAlerts: AlertItem[];
  historicalEvents: HistoricalEvent[];
  onNavigate: (page: string) => void;
  onSelectZoneForAI: (zone: RiskZone) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  riskZones,
  activeAlerts,
  historicalEvents,
  onNavigate,
  onSelectZoneForAI
}) => {
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(() => riskZones[0] || null);
  const activeMonitoredZone = selectedZone || riskZones[0] || null;

  // --- Auto-Updating Notification System State ---
  const [autoMonitorActive, setAutoMonitorActive] = useState<boolean>(true);
  const [scanIntervalSec] = useState<number>(30); // 30s auto-scan cycle
  const [countdownSec, setCountdownSec] = useState<number>(30);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [activeToasts, setActiveToasts] = useState<ToastAlertItem[]>([]);
  const [toastHistory, setToastHistory] = useState<ToastAlertItem[]>([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [isScanningNow, setIsScanningNow] = useState<boolean>(false);
  const [safetyEvaluation, setSafetyEvaluation] = useState<SafetyEvaluationResult | null>(null);
  const [activeSimulationMode, setActiveSimulationMode] = useState<string>('live');

  // Track last alerted time per zone to prevent spamming
  const lastAlertTimeRef = useRef<Record<string, number>>({});
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const redZones = riskZones.filter(z => z.currentRisk === 'RED');
  const orangeZones = riskZones.filter(z => z.currentRisk === 'ORANGE');
  const yellowZones = riskZones.filter(z => z.currentRisk === 'YELLOW');

  const totalExposedPop = riskZones.reduce((acc, z) => acc + z.populationExposed.total, 0);
  const totalRedPop = riskZones.reduce((acc, z) => acc + z.populationExposed.red, 0);

  // Helper to dispatch a toast notification
  const dispatchToastAlert = (
    zone: RiskZone,
    evalResult: SafetyEvaluationResult,
    isSimulation = false
  ) => {
    const now = Date.now();
    const lastAlert = lastAlertTimeRef.current[zone.id] || 0;

    // Deduplicate: if an alert for this zone fired in last 35 seconds and not a simulation, avoid duplicate
    if (!isSimulation && now - lastAlert < 35000 && activeToasts.some(t => t.zoneId === zone.id)) {
      return;
    }

    lastAlertTimeRef.current[zone.id] = now;

    const newToast: ToastAlertItem = {
      id: `toast-${zone.id}-${now}`,
      zoneId: zone.id,
      zoneName: zone.name,
      district: zone.district,
      state: zone.state,
      hazardType: zone.hazardType,
      severity: evalResult.status === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      timestamp: new Date().toISOString(),
      primaryBreachText: evalResult.primaryBreachText,
      breaches: evalResult.breaches,
      advisory: evalResult.advisory,
      isSimulated: isSimulation,
      autoDismissRemainingSec: 20
    };

    // Play chime if enabled
    if (soundEnabledRef.current) {
      playAlertChime(newToast.severity);
    }

    // Prepend to active toasts (cap at 3 visible)
    setActiveToasts(prev => [newToast, ...prev.filter(t => t.zoneId !== zone.id)].slice(0, 3));
    // Prepend to history (cap at 50)
    setToastHistory(prev => [newToast, ...prev].slice(0, 50));
  };

  // Perform safety threshold evaluation on a zone with specific metrics
  const evaluateZoneSafety = (
    zone: RiskZone,
    metrics: Partial<ZoneWeatherDetails['current']>,
    isSimulation = false
  ) => {
    const evalResult = evaluateWeatherSafetyThresholds({
      zone,
      metrics
    });

    setSafetyEvaluation(evalResult);

    if (evalResult.isBreached) {
      dispatchToastAlert(zone, evalResult, isSimulation);
    }
  };

  // Callback from WeatherWidget when live weather details are fetched
  const handleLiveWeatherFetched = (data: ZoneWeatherDetails) => {
    if (activeSimulationMode === 'live' && activeMonitoredZone) {
      evaluateZoneSafety(activeMonitoredZone, data.current, false);
    }
  };

  // Manual or automatic refresh trigger
  const triggerManualSafetyScan = async () => {
    if (!activeMonitoredZone) return;
    setIsScanningNow(true);

    try {
      const query = new URLSearchParams({
        lat: activeMonitoredZone.coordinates[0].toString(),
        lon: activeMonitoredZone.coordinates[1].toString(),
        zoneId: activeMonitoredZone.id,
        zoneName: activeMonitoredZone.name,
        district: activeMonitoredZone.district,
        state: activeMonitoredZone.state,
        hazardType: activeMonitoredZone.hazardType
      });

      const res = await fetch(`/api/weather/zone-weather?${query.toString()}`);
      if (res.ok) {
        const data: ZoneWeatherDetails = await res.json();
        if (activeSimulationMode === 'live') {
          evaluateZoneSafety(activeMonitoredZone, data.current, false);
        }
      }
    } catch (err) {
      console.warn('Manual safety scan error:', err);
    } finally {
      setTimeout(() => setIsScanningNow(false), 500);
    }
  };

  // Preset Simulation Scenarios for testing the auto-notification system
  const triggerSimulationSpike = (type: string) => {
    if (!activeMonitoredZone) return;
    setActiveSimulationMode(type);

    let simulatedMetrics: Partial<ZoneWeatherDetails['current']> = {};

    if (type === 'cloudburst_spike') {
      simulatedMetrics = {
        humidity_percent: 92,
        temperature_c: 17.5,
        windSpeed_kmh: 36.5,
        windGusts_kmh: 52.0,
        rainCurrent_mm: 32.0,
        rain24h_mm: 98.0,
        surfacePressure_hpa: 1002.0
      };
    } else if (type === 'landslide_spike') {
      simulatedMetrics = {
        humidity_percent: 91,
        temperature_c: 21.0,
        windSpeed_kmh: 28.0,
        windGusts_kmh: 46.0,
        rainCurrent_mm: 14.5,
        rain24h_mm: 92.0,
        soilMoisture_percent: 91.0
      };
    } else if (type === 'cyclone_spike') {
      simulatedMetrics = {
        humidity_percent: 95,
        temperature_c: 27.0,
        windSpeed_kmh: 54.0,
        windGusts_kmh: 76.0,
        rainCurrent_mm: 25.0,
        rain24h_mm: 110.0,
        surfacePressure_hpa: 992.0
      };
    } else if (type === 'flood_spike') {
      simulatedMetrics = {
        humidity_percent: 94,
        temperature_c: 29.5,
        windSpeed_kmh: 22.0,
        windGusts_kmh: 38.0,
        rainCurrent_mm: 22.0,
        rain24h_mm: 104.0,
        soilMoisture_percent: 94.0
      };
    }

    evaluateZoneSafety(activeMonitoredZone, simulatedMetrics, true);
  };

  const revertToLiveStream = () => {
    setActiveSimulationMode('live');
    if (activeMonitoredZone) {
      triggerManualSafetyScan();
    }
  };

  // 1-second interval for countdown & toast auto-dismiss progress
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Toast countdown
      setActiveToasts(prev =>
        prev
          .map(t => ({
            ...t,
            autoDismissRemainingSec: t.autoDismissRemainingSec - 1
          }))
          .filter(t => t.autoDismissRemainingSec > 0)
      );

      // 2. Auto-scan countdown
      if (autoMonitorActive) {
        setCountdownSec(prev => {
          if (prev <= 1) {
            triggerManualSafetyScan();
            return scanIntervalSec;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [autoMonitorActive, scanIntervalSec, activeMonitoredZone?.id, activeSimulationMode]);

  // Initial evaluation on zone change
  useEffect(() => {
    if (activeMonitoredZone) {
      if (activeSimulationMode === 'live') {
        // Initial evaluation using baseline risk data while live weather loads
        evaluateZoneSafety(
          activeMonitoredZone,
          {
            humidity_percent: activeMonitoredZone.currentConditions.soilMoisture_percent || 75,
            temperature_c: activeMonitoredZone.currentConditions.temperature_c,
            windSpeed_kmh: activeMonitoredZone.currentConditions.windSpeed_kmh,
            rain24h_mm: activeMonitoredZone.currentConditions.rainfall24h_mm,
            soilMoisture_percent: activeMonitoredZone.currentConditions.soilMoisture_percent
          },
          false
        );
      } else {
        triggerSimulationSpike(activeSimulationMode);
      }
    }
  }, [activeMonitoredZone?.id]);

  // Toast actions
  const handleDismissToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAcknowledgeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
    setToastHistory(prev =>
      prev.map(t => (t.id === id ? { ...t, isAcknowledged: true } : t))
    );
  };

  const handleInspectZoneFromToast = (zoneId: string) => {
    const target = riskZones.find(z => z.id === zoneId);
    if (target) {
      setSelectedZone(target);
    }
    const weatherElement = document.getElementById('resq-weather-widget');
    if (weatherElement) {
      weatherElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExportExecutiveBriefing = () => {
    exportAlertsSummaryPDF(activeAlerts, {
      hazard: 'All Sovereign Hazards',
      severity: 'Executive Disaster Briefing',
      minRisk: 0
    });
  };

  const isCriticalBreached = safetyEvaluation?.status === 'CRITICAL';
  const isWarningBreached = safetyEvaluation?.status === 'WARNING';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-800 relative">
      {/* Floating Toast Notification Container */}
      <SafetyToastContainer
        toasts={activeToasts}
        onDismissToast={handleDismissToast}
        onAcknowledgeToast={handleAcknowledgeToast}
        onInspectZone={handleInspectZoneFromToast}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
      />

      {/* Slide-out Safety Notification Drawer */}
      <SafetyNotificationDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        history={toastHistory}
        onClearHistory={() => setToastHistory([])}
        onInspectZone={handleInspectZoneFromToast}
        onAcknowledgeAll={() => {
          setToastHistory(prev => prev.map(t => ({ ...t, isAcknowledged: true })));
          setActiveToasts([]);
        }}
      />

      {/* Header Overview Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-600" />
            National Disaster Risk & Multi-Hazard Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time synoptic intelligence coupled with Open-Meteo atmospheric forecasts and Copernicus 30m terrain models
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExecutiveBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Export full executive disaster briefing dossier"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Executive Briefing (PDF)</span>
          </button>
          <button
            onClick={() => onNavigate('map')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Open GIS Map</span>
          </button>
          <button
            onClick={() => onNavigate('alerts')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>View Alerts ({activeAlerts.length})</span>
          </button>
        </div>
      </div>

      {/* --- AUTOMATED SAFETY NOTIFICATION & THRESHOLD MONITORING CONTROL CONSOLE --- */}
      <div className={`p-4 rounded-xl border transition-all ${
        isCriticalBreached
          ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
          : isWarningBreached
          ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
          : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Real-Time Auto-Monitor Status */}
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              isCriticalBreached
                ? 'bg-rose-600 text-white shadow-xs'
                : isWarningBreached
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              {isCriticalBreached ? (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              ) : isWarningBreached ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isCriticalBreached ? 'bg-rose-500' : isWarningBreached ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      isCriticalBreached ? 'bg-rose-600' : isWarningBreached ? 'bg-amber-600' : 'bg-emerald-600'
                    }`}></span>
                  </span>
                  Auto-Updating Weather Safety Sentinel
                </span>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  isCriticalBreached
                    ? 'bg-rose-200 text-rose-900 border border-rose-300'
                    : isWarningBreached
                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isCriticalBreached ? 'Critical Threshold Breached' : isWarningBreached ? 'Warning Limit Active' : 'Normal Envelope'}
                </span>

                {activeSimulationMode !== 'live' && (
                  <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded font-semibold">
                    Simulation Active: {activeSimulationMode.replace('_spike', '')}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-1">
                Monitored Zone: <strong className="text-slate-900 font-semibold">{activeMonitoredZone?.name}</strong>
                {' '}({activeMonitoredZone?.district}, {activeMonitoredZone?.state})
                {' · '}
                <span className="font-mono text-slate-500">
                  {autoMonitorActive ? `Auto-evaluating every ${scanIntervalSec}s (Next in ${countdownSec}s)` : 'Auto-scan paused'}
                </span>
              </p>

              {safetyEvaluation && safetyEvaluation.isBreached && (
                <p className="text-xs font-mono font-medium text-rose-700 mt-1">
                  Alert: {safetyEvaluation.primaryBreachText}
                </p>
              )}
            </div>
          </div>

          {/* Right: Interactive Controls Bar */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {/* Simulation Scenario Trigger Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
              <span className="text-[10px] font-semibold uppercase text-slate-400 pl-1 hidden sm:inline">
                Test Trigger:
              </span>
              <select
                value={activeSimulationMode}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'live') {
                    revertToLiveStream();
                  } else {
                    triggerSimulationSpike(val);
                  }
                }}
                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                title="Simulate realistic severe weather conditions to test auto-updating toast alerts"
              >
                <option value="live">Live Telemetry (Real-Time)</option>
                <option value="cloudburst_spike">⚡ Cloudburst Convection Spike (48km/h, 92% RH)</option>
                <option value="landslide_spike">⛰️ Landslide Pore Pressure (91% RH, 92mm)</option>
                <option value="cyclone_spike">🌀 Cyclone Gale Force Front (76km/h, 992hPa)</option>
                <option value="flood_spike">🌊 Flood Runoff Inflow (104mm, 94% Saturation)</option>
              </select>
            </div>

            {/* Scan Now Button */}
            <button
              onClick={triggerManualSafetyScan}
              disabled={isScanningNow}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Execute immediate safety threshold telemetry scan"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isScanningNow ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isScanningNow ? 'Scanning...' : 'Scan Now'}</span>
            </button>

            {/* Auto-Monitor Play/Pause */}
            <button
              onClick={() => setAutoMonitorActive(prev => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                autoMonitorActive
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title={autoMonitorActive ? 'Pause auto-monitoring' : 'Resume auto-monitoring'}
            >
              {autoMonitorActive ? <Pause className="w-3.5 h-3.5 text-emerald-600" /> : <Play className="w-3.5 h-3.5 text-slate-600" />}
              <span>{autoMonitorActive ? 'Active' : 'Paused'}</span>
            </button>

            {/* Sound Chime Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) {
                  playAlertChime('WARNING');
                }
              }}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
              title={soundEnabled ? 'Alert chimes ENABLED (click to mute)' : 'Alert chimes MUTED (click to enable)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification History Drawer Toggle */}
            <button
              onClick={() => setIsHistoryDrawerOpen(true)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border shadow-2xs ${
                activeToasts.length > 0
                  ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700 animate-pulse'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Open Weather Safety Alert History Log"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Alerts</span>
              {toastHistory.length > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  activeToasts.length > 0 ? 'bg-white text-rose-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {toastHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Red Very High Risk */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Very High Risk Areas</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">{redZones.length}</div>
          <p className="text-[11px] text-slate-500">Immediate evacuation vigilance</p>
        </div>

        {/* Orange High Risk */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">High Risk Watch</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">{orangeZones.length}</div>
          <p className="text-[11px] text-slate-500">Active monitoring of triggers</p>
        </div>

        {/* Moderate Risk */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Moderate Advisory</span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-yellow-600">{yellowZones.length}</div>
          <p className="text-[11px] text-slate-500">Prepositioning civic assets</p>
        </div>

        {/* Population Exposed */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Population at Risk</span>
            <Users className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-700">
            {(totalExposedPop / 1000).toFixed(1)}k
          </div>
          <p className="text-[11px] text-slate-500">
            {(totalRedPop / 1000).toFixed(1)}k in high-severity sectors
          </p>
        </div>
      </div>

      {/* Real-Time Synoptic Weather & Atmospheric Trend Monitor */}
      <div id="resq-weather-widget">
        <WeatherWidget
          selectedZone={activeMonitoredZone}
          allZones={riskZones}
          onSelectZone={setSelectedZone}
          onWeatherFetched={handleLiveWeatherFetched}
          safetyEvaluation={safetyEvaluation}
        />
      </div>

      {/* Two Column Layout: Active Risk Zones & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monitored Risk Zones */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              Active Monitored Risk Zones Across India
            </h2>
            <button
              onClick={() => onNavigate('map')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View On Map</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {riskZones.map(zone => {
              const isCurrentlySelected = activeMonitoredZone?.id === zone.id;
              return (
                <div
                  key={zone.id}
                  className={`bg-white border rounded-xl transition-all space-y-3 shadow-xs p-4 ${
                    isCurrentlySelected
                      ? 'border-indigo-400 ring-2 ring-indigo-400/20 shadow-sm bg-gradient-to-r from-indigo-50/20 via-white to-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {zone.hazardType}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          zone.currentRisk === 'RED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : zone.currentRisk === 'ORANGE'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                        }`}>
                          Current: {zone.currentRisk} ({zone.currentScore}/100)
                        </span>
                        {isCurrentlySelected && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <CloudRain className="w-3 h-3 text-indigo-600" />
                            <span>Active in Weather Monitor</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 hidden sm:inline">
                          Historical: <strong className="text-slate-700">{zone.historicalSusceptibility}</strong>
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{zone.name}</h3>
                      <p className="text-xs text-slate-500">{zone.district}, {zone.state}</p>
                    </div>

                    <div className="self-start sm:self-center flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedZone(zone);
                          const widgetEl = document.getElementById('resq-weather-widget');
                          if (widgetEl) {
                            widgetEl.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                          isCurrentlySelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                        }`}
                        title="Display current humidity, temperature, and wind trends for this hazard zone"
                      >
                        <CloudRain className="w-3.5 h-3.5" />
                        <span>{isCurrentlySelected ? 'Monitoring Weather' : 'Inspect Weather'}</span>
                      </button>
                      <button
                        onClick={() => exportRiskAnalysisPDF(zone)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        title="Download formatted PDF dossier for offline field documentation"
                      >
                        <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                        <span>PDF Dossier</span>
                      </button>
                      <button
                        onClick={() => onSelectZoneForAI(zone)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Cpu className="w-3.5 h-3.5 text-blue-600" />
                        <span>Run AI Analysis</span>
                      </button>
                    </div>
                  </div>

                  {/* Evidence Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block">24h Rainfall</span>
                      <span className="font-mono font-semibold text-slate-800">{zone.currentConditions.rainfall24h_mm} mm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">3d Cumulative</span>
                      <span className="font-mono font-semibold text-slate-800">{zone.currentConditions.rainfall3d_mm} mm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Terrain Slope</span>
                      <span className="font-mono font-semibold text-slate-800">{zone.currentConditions.slope_deg}°</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Population</span>
                      <span className="font-mono font-semibold text-slate-800">{zone.populationExposed.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800 font-medium">AI Assessment:</strong> {zone.aiExplanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Severe Weather & Recent Historical Feed */}
        <div className="space-y-6">
          {/* Active Warnings Alert Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Active Early Warnings ({activeAlerts.length})
              </h3>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                View Feed →
              </button>
            </div>

            <div className="space-y-2.5">
              {activeAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase font-mono">{alert.hazard}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      alert.severity === 'RED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{alert.location}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{alert.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Hotspot Feed */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Historical Event Records
              </h3>
              <button
                onClick={() => onNavigate('historical')}
                className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Catalog →
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {historicalEvents.slice(0, 4).map(e => (
                <div key={e.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{e.date}</span>
                    <span className="uppercase font-mono text-emerald-700 font-bold">{e.hazard}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-xs">{e.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{e.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                    <span>Source: {e.source}</span>
                    <button
                      onClick={() => exportHistoricalEventPDF(e)}
                      className="flex items-center gap-1 text-[10px] font-medium text-indigo-700 hover:text-indigo-800 px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer"
                      title="Download formatted historical disaster record PDF"
                    >
                      <FileDown className="w-3 h-3 text-indigo-600" />
                      <span>PDF Record</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
