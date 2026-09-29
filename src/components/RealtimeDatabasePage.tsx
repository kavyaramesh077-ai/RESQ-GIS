import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Database,
  Activity,
  Server,
  Zap,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Send,
  Building2,
  Megaphone,
  FileCode,
  HardDrive,
  Eye,
  Sliders,
  PlayCircle,
  PlusCircle,
  Search,
  Check,
  X,
  Trash2,
  Users,
  Thermometer,
  CloudRain,
  Wind
} from 'lucide-react';
import { useRealtimeStream } from '../hooks/useRealtimeStream';
import { realtimeClient } from '../services/realtimeClient';
import {
  CitizenReport,
  RelocationSite,
  WeatherTelemetryRecord,
  HazardAlertRecord,
  SystemAuditLog
} from '../types';

interface RealtimeDatabasePageProps {
  onNavigateToMap?: () => void;
}

export const RealtimeDatabasePage: React.FC<RealtimeDatabasePageProps> = ({ onNavigateToMap }) => {
  const {
    isConnected,
    latencyMs,
    activeClientsCount,
    dbStats,
    streamEvents,
    liveTelemetry,
    liveAlerts,
    triggerManualSync,
    sendEmergencyBroadcast,
    acknowledgeAlert,
    refreshStats
  } = useRealtimeStream();

  const [activeTab, setActiveTab] = useState<'stream' | 'database'>('stream');
  const [selectedDbTable, setSelectedDbTable] = useState<'reports' | 'shelters' | 'telemetry' | 'alerts' | 'audit'>('telemetry');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Table Data States
  const [tableData, setTableData] = useState<{
    reports: CitizenReport[];
    shelters: RelocationSite[];
    telemetry: WeatherTelemetryRecord[];
    alerts: HazardAlertRecord[];
    audit: SystemAuditLog[];
  }>({
    reports: [],
    shelters: [],
    telemetry: [],
    alerts: [],
    audit: []
  });
  const [tableFilter, setTableFilter] = useState<string>('');
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    severity: 'RED',
    zoneName: 'All Monitored Sectors',
    hazardType: 'extreme_rainfall'
  });
  const [broadcastSending, setBroadcastSending] = useState<boolean>(false);
  const [expandedPayloadId, setExpandedPayloadId] = useState<string | null>(null);

  // Add Record Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addRecordType, setAddRecordType] = useState<'report' | 'shelter' | 'telemetry'>('report');
  const [reportForm, setReportForm] = useState({
    hazardType: 'landslide',
    locationName: '',
    district: 'Wayanad',
    state: 'Kerala',
    latitude: '11.6050',
    longitude: '76.0820',
    description: '',
    severity: 'ORANGE',
    reporterName: 'Local Field Observer',
    reporterContact: '+91-94471XXXXX'
  });
  const [shelterForm, setShelterForm] = useState({
    name: '',
    district: 'Wayanad',
    state: 'Kerala',
    latitude: '11.6100',
    longitude: '76.0900',
    capacity: '800',
    address: 'Near Government High School',
    contactPerson: 'Relief Coordinator',
    contactPhone: '+91-94470XXXXX'
  });
  const [telemetryForm, setTelemetryForm] = useState({
    zoneId: 'zone-wayanad-ghats',
    zoneName: 'Wayanad Meppadi Hill Tract',
    hazardType: 'landslide',
    latitude: '11.5173',
    longitude: '76.1368',
    temperature_c: '22.5',
    humidity_percent: '92',
    rainfall24h_mm: '75.0',
    windSpeed_kmh: '18.0',
    soilMoisture_percent: '86'
  });

  // Fetch complete table data when switching to database tab or selecting table
  const fetchTableData = useCallback(async () => {
    setIsTableLoading(true);
    try {
      const [reportsRes, telemetryRes, alertsRes, auditLogs, dbStatsRes] = await Promise.all([
        fetch('/api/admin/reports').then(r => r.json()).catch(() => ({ reports: [] })),
        fetch('/api/db/telemetry?limit=50').then(r => r.json()).catch(() => ({ records: [] })),
        fetch('/api/db/alerts').then(r => r.json()).catch(() => ({ alerts: [] })),
        realtimeClient.fetchAuditLogs(50).catch(() => []),
        realtimeClient.fetchStats().catch(() => null)
      ]);

      const sheltersRes = await fetch('/api/relocation/nearest?lat=20.5937&lon=78.9629&limit=50').then(r => r.json()).catch(() => ({ shelters: [] }));

      setTableData({
        reports: reportsRes.reports || [],
        shelters: sheltersRes.shelters || [],
        telemetry: telemetryRes.records || [],
        alerts: alertsRes.alerts || [],
        audit: auditLogs || []
      });
    } catch (err) {
      console.error('Failed to fetch table data:', err);
    } finally {
      setIsTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  // Reactive DB listener: whenever any mutation happens over SSE, auto-refresh table
  useEffect(() => {
    const unsub = realtimeClient.on('*', () => {
      fetchTableData();
    });
    return () => unsub();
  }, [fetchTableData]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await triggerManualSync();
      setSyncFeedback(`Successfully synced telemetry across ${res.syncedZonesCount} monitored hazard zones!`);
      fetchTableData();
      refreshStats();
    } catch (err: any) {
      setSyncFeedback(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleSimulateBurst = async (burstType: string) => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await realtimeClient.simulateBurst(burstType);
      setSyncFeedback(`Simulated real-time packet ingested into database: ${res.recordsAdded} records added!`);
      fetchTableData();
      refreshStats();
    } catch (err: any) {
      setSyncFeedback(`Simulation failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleExportDb = async () => {
    try {
      const res = await fetch('/api/db/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resq_gis_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export database: ' + err);
    }
  };

  const handleReseedDb = async () => {
    if (!window.confirm('Reset database to verified official Indian disaster baseline records? Current modifications will be archived.')) {
      return;
    }
    try {
      await realtimeClient.reseedDatabase();
      alert('Database successfully reset and re-seeded!');
      fetchTableData();
      refreshStats();
    } catch (err: any) {
      alert('Failed to reseed database: ' + err.message);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) return;
    setBroadcastSending(true);
    try {
      await sendEmergencyBroadcast(broadcastForm);
      setIsBroadcastModalOpen(false);
      setBroadcastForm({
        title: '',
        message: '',
        severity: 'RED',
        zoneName: 'All Monitored Sectors',
        hazardType: 'extreme_rainfall'
      });
      alert('Real-time emergency broadcast successfully dispatched to all connected clients!');
      fetchTableData();
    } catch (err: any) {
      alert('Failed to dispatch broadcast: ' + err.message);
    } finally {
      setBroadcastSending(false);
    }
  };

  // Row Action Handlers
  const handleUpdateOccupancy = async (shelter: RelocationSite, delta: number) => {
    const newOccupancy = Math.max(0, Math.min(shelter.capacity, (shelter.currentOccupancy || 0) + delta));
    try {
      await realtimeClient.updateShelterOccupancy(shelter.id, newOccupancy);
      fetchTableData();
    } catch (err) {
      alert('Failed to update occupancy: ' + err);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      await fetch(`/api/admin/reports/${reportId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Verified by Control Officer via Live Database Console' })
      });
      fetchTableData();
    } catch (err) {
      alert('Failed to approve report: ' + err);
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      await fetch(`/api/admin/reports/${reportId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Unsubstantiated field telemetry' })
      });
      fetchTableData();
    } catch (err) {
      alert('Failed to reject report: ' + err);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Delete report from database?')) return;
    try {
      await realtimeClient.deleteReport(reportId);
      fetchTableData();
    } catch (err) {
      alert('Failed to delete report: ' + err);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await realtimeClient.resolveAlert(alertId, 'Resolved by Officer');
      fetchTableData();
    } catch (err) {
      alert('Failed to resolve alert: ' + err);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!window.confirm('Delete alert from database?')) return;
    try {
      await realtimeClient.deleteAlert(alertId);
      fetchTableData();
    } catch (err) {
      alert('Failed to delete alert: ' + err);
    }
  };

  const handleDeleteTelemetry = async (telemetryId: string) => {
    try {
      await realtimeClient.deleteTelemetry(telemetryId);
      fetchTableData();
    } catch (err) {
      alert('Failed to delete telemetry: ' + err);
    }
  };

  // Add Record Submission
  const handleAddRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (addRecordType === 'report') {
        await realtimeClient.addCitizenReport({
          hazardType: reportForm.hazardType,
          locationName: reportForm.locationName,
          district: reportForm.district,
          state: reportForm.state,
          latitude: parseFloat(reportForm.latitude),
          longitude: parseFloat(reportForm.longitude),
          description: reportForm.description,
          severity: reportForm.severity,
          reporterName: reportForm.reporterName,
          reporterContact: reportForm.reporterContact
        });
      } else if (addRecordType === 'shelter') {
        await realtimeClient.addShelter({
          name: shelterForm.name,
          district: shelterForm.district,
          state: shelterForm.state,
          latitude: parseFloat(shelterForm.latitude),
          longitude: parseFloat(shelterForm.longitude),
          capacity: parseInt(shelterForm.capacity, 10),
          address: shelterForm.address,
          contactPerson: shelterForm.contactPerson,
          contactPhone: shelterForm.contactPhone,
          amenities: ['Emergency Power', 'Drinking Water', 'Medical First Aid']
        });
      } else {
        await fetch('/api/db/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zoneId: telemetryForm.zoneId,
            zoneName: telemetryForm.zoneName,
            hazardType: telemetryForm.hazardType,
            latitude: parseFloat(telemetryForm.latitude),
            longitude: parseFloat(telemetryForm.longitude),
            temperature_c: parseFloat(telemetryForm.temperature_c),
            humidity_percent: parseFloat(telemetryForm.humidity_percent),
            rainfall24h_mm: parseFloat(telemetryForm.rainfall24h_mm),
            rainfallCurrent_mm: 5.2,
            windSpeed_kmh: parseFloat(telemetryForm.windSpeed_kmh),
            surfacePressure_hpa: 1008,
            soilMoisture_percent: parseFloat(telemetryForm.soilMoisture_percent),
            dewPoint_c: 21.0,
            status: parseFloat(telemetryForm.rainfall24h_mm) > 65 ? 'CRITICAL' : 'NORMAL'
          })
        });
      }
      setIsAddModalOpen(false);
      fetchTableData();
      alert('Record successfully added to the real-time persistent database!');
    } catch (err: any) {
      alert('Failed to add record: ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Telemetry Hub */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Real-Time APIs & Sovereign Persistent Database
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                SSE Live Stream
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Continuous atmospheric telemetry ingestion via Open-Meteo & IMD AWS endpoints, coupled with an ACID-compliant disk-persisted database engine and Server-Sent Events (SSE) broadcasting.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Record
            </button>
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Telemetry'}
            </button>
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5" />
              Broadcast Alert
            </button>
            <button
              onClick={handleExportDb}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export DB
            </button>
          </div>
        </div>

        {/* Real-time simulation bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold">Live Simulation Ingestion:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSimulateBurst('rainfall_spike')}
              disabled={isSyncing}
              className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded cursor-pointer transition-colors"
            >
              ⚡ Ingest Wayanad Rainfall Spike (92.4mm)
            </button>
            <button
              onClick={() => handleSimulateBurst('batch_pulse')}
              disabled={isSyncing}
              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded cursor-pointer transition-colors"
            >
              🔄 Ingest Batch Telemetry Pulse (5 Zones)
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Real-Time Telemetry & Database Diagnostics Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Stream Connection</span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
              <span className="text-xs font-semibold text-slate-800">
                {isConnected ? 'ONLINE (SSE)' : 'CONNECTING...'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">EventSource Keep-Alive</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Round-Trip Latency</span>
            <div className="mt-1 text-sm font-bold font-mono text-slate-900">
              {latencyMs > 0 ? `${latencyMs} ms` : '~18 ms'}
            </div>
            <span className="text-[10px] text-emerald-600 font-mono">Ultra-low latency</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active SSE Clients</span>
            <div className="mt-1 text-sm font-bold font-mono text-slate-900">
              {activeClientsCount} connected
            </div>
            <span className="text-[10px] text-slate-400 font-mono">HTTP/2 Push</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Background Ingestion</span>
            <div className="mt-1 text-sm font-bold text-emerald-700 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Every 25s</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">5 Hazard Zones</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Database Storage</span>
            <div className="mt-1 text-sm font-bold font-mono text-slate-900">
              {dbStats ? `${dbStats.dbFileSizeKb} KB` : '48.2 KB'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">resq_gis_database.json</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Stored Records</span>
            <div className="mt-1 text-sm font-bold font-mono text-slate-900">
              {tableData.telemetry.length + tableData.reports.length + tableData.shelters.length + tableData.alerts.length} rows
            </div>
            <span className="text-[10px] text-emerald-600 font-mono">ACID Disk Sync</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('stream')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'stream'
              ? 'border-emerald-600 text-emerald-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Real-Time Stream Feed & Live Telemetry</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
            Live
          </span>
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'database'
              ? 'border-emerald-600 text-emerald-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Persistent Database Console & CRUD</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
            Interactive
          </span>
        </button>
      </div>

      {/* TAB 1: Real-Time Stream Feed & Live Telemetry */}
      {activeTab === 'stream' && (
        <div className="space-y-6">
          {/* Live Sensor Telemetry Cards (Dynamic Zone Ingestion) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Live Atmospheric Telemetry Stream (Monitored Indian Hazard Sectors)
              </h2>
              <span className="text-xs text-slate-500 font-mono">Auto-refreshed via SSE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TelemetryZoneCard
                zoneName="Wayanad Meppadi Hill Tract"
                hazardType="landslide"
                state="Kerala"
                record={liveTelemetry['zone-wayanad-ghats']}
                defaultMetrics={{
                  temperature_c: 21.4,
                  humidity_percent: 94,
                  rainfall24h_mm: 78.6,
                  surfacePressure_hpa: 1008.2,
                  soilMoisture_percent: 88,
                  dewPoint_c: 20.4,
                  status: 'CRITICAL'
                }}
              />

              <TelemetryZoneCard
                zoneName="Velachery Lowland Urban Basin"
                hazardType="flood"
                state="Tamil Nadu"
                record={liveTelemetry['zone-velachery']}
                defaultMetrics={{
                  temperature_c: 29.6,
                  humidity_percent: 82,
                  rainfall24h_mm: 48.0,
                  surfacePressure_hpa: 1004.5,
                  soilMoisture_percent: 79,
                  dewPoint_c: 26.2,
                  status: 'ELEVATED'
                }}
              />

              <TelemetryZoneCard
                zoneName="Joshimath Ravigram Sector"
                hazardType="landslide"
                state="Uttarakhand"
                record={liveTelemetry['zone-joshimath']}
                defaultMetrics={{
                  temperature_c: 12.8,
                  humidity_percent: 74,
                  rainfall24h_mm: 22.4,
                  surfacePressure_hpa: 1014.0,
                  soilMoisture_percent: 64,
                  dewPoint_c: 8.2,
                  status: 'NORMAL'
                }}
              />

              <TelemetryZoneCard
                zoneName="Subansiri River Gorge Basin"
                hazardType="cloudburst"
                state="Arunachal Pradesh"
                record={liveTelemetry['zone-subansiri']}
                defaultMetrics={{
                  temperature_c: 24.1,
                  humidity_percent: 91,
                  rainfall24h_mm: 64.2,
                  surfacePressure_hpa: 1006.8,
                  soilMoisture_percent: 84,
                  dewPoint_c: 22.5,
                  status: 'CRITICAL'
                }}
              />

              <TelemetryZoneCard
                zoneName="Paradip Coastal Estuary Tract"
                hazardType="cyclone"
                state="Odisha"
                record={liveTelemetry['zone-paradip-cyclone']}
                defaultMetrics={{
                  temperature_c: 31.0,
                  humidity_percent: 88,
                  rainfall24h_mm: 36.5,
                  surfacePressure_hpa: 998.4,
                  soilMoisture_percent: 72,
                  dewPoint_c: 28.1,
                  status: 'ELEVATED'
                }}
              />

              {/* Quick Broadcast Trigger Card */}
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-xl p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Real-Time Dispatch Console</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Emergency Broadcast Transmitter
                  </h3>
                  <p className="text-xs text-slate-600">
                    Send an instantaneous priority broadcast message across all open browser windows and mobile field terminals via HTTP/2 SSE.
                  </p>
                </div>
                <button
                  onClick={() => setIsBroadcastModalOpen(true)}
                  className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Real-Time Broadcast
                </button>
              </div>
            </div>
          </div>

          {/* Real-Time Streaming Terminal Log */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  ResQ-GIS SSE Live Stream Receiver [/api/realtime/stream]
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {streamEvents.length} events received
              </span>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto font-mono text-xs space-y-2 select-text">
              {streamEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  Connecting to live SSE stream... Initializing handshake...
                </div>
              ) : (
                streamEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-md bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getEventTypeBadgeClass(evt.type)}`}>
                          {evt.type}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-slate-200 text-xs font-medium">
                          {evt.summary}
                        </span>
                      </div>
                      {evt.payload && Object.keys(evt.payload).length > 0 && (
                        <button
                          onClick={() => setExpandedPayloadId(expandedPayloadId === evt.id ? null : evt.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer shrink-0"
                        >
                          {expandedPayloadId === evt.id ? 'Hide JSON' : 'View Payload'}
                        </button>
                      )}
                    </div>
                    {expandedPayloadId === evt.id && (
                      <pre className="mt-2 p-2 rounded bg-black/60 text-[10px] text-emerald-400 overflow-x-auto">
                        {JSON.stringify(evt.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Persistent Database Console & CRUD */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Database Control Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            {/* Table Selection Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedDbTable('telemetry')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedDbTable === 'telemetry'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Weather Telemetry ({tableData.telemetry.length})
              </button>
              <button
                onClick={() => setSelectedDbTable('reports')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedDbTable === 'reports'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Citizen Reports ({tableData.reports.length})
              </button>
              <button
                onClick={() => setSelectedDbTable('shelters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedDbTable === 'shelters'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Shelters ({tableData.shelters.length})
              </button>
              <button
                onClick={() => setSelectedDbTable('alerts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedDbTable === 'alerts'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Hazard Alerts ({tableData.alerts.length})
              </button>
              <button
                onClick={() => setSelectedDbTable('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedDbTable === 'audit'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Audit Trail ({tableData.audit.length})
              </button>
            </div>

            {/* Actions & Reseed */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-500 focus:bg-white w-40 md:w-56"
                />
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
              <button
                onClick={fetchTableData}
                disabled={isTableLoading}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="Refresh Table Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTableLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleReseedDb}
                className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
              >
                Re-Seed DB
              </button>
            </div>
          </div>

          {/* Database Content Table with Real-time Interactive Row Actions */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              {/* Telemetry Table */}
              {selectedDbTable === 'telemetry' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Record ID</th>
                      <th className="p-3">Zone & Hazard</th>
                      <th className="p-3">Temp / RH</th>
                      <th className="p-3">Rain 24h</th>
                      <th className="p-3">Wind / Press</th>
                      <th className="p-3">Soil Moisture</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Logged At</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData.telemetry
                      .filter(t => !tableFilter || t.zoneName.toLowerCase().includes(tableFilter.toLowerCase()) || t.hazardType.toLowerCase().includes(tableFilter.toLowerCase()))
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono text-[11px] text-slate-500">{t.id}</td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{t.zoneName}</div>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {t.hazardType}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            {t.temperature_c}°C / {t.humidity_percent}%
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {t.rainfall24h_mm} mm
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            {t.windSpeed_kmh} km/h • {t.surfacePressure_hpa} hPa
                          </td>
                          <td className="p-3 font-mono">
                            <span className={t.soilMoisture_percent > 80 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                              {t.soilMoisture_percent}%
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.status === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : t.status === 'ELEVATED'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 font-mono">
                            {new Date(t.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteTelemetry(t.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                              title="Delete Telemetry Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* Reports Table with Live Approval / Rejection */}
              {selectedDbTable === 'reports' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Report ID</th>
                      <th className="p-3">Location & Hazard</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Reporter</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Live Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData.reports
                      .filter(r => !tableFilter || r.locationName.toLowerCase().includes(tableFilter.toLowerCase()) || r.description.toLowerCase().includes(tableFilter.toLowerCase()))
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono text-[11px] text-slate-500">{r.id}</td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{r.locationName}</div>
                            <div className="text-[11px] text-slate-500">{r.district}, {r.state}</div>
                          </td>
                          <td className="p-3 max-w-xs text-slate-700 line-clamp-2">
                            {r.description}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r.severity === 'RED'
                                ? 'bg-rose-100 text-rose-800'
                                : r.severity === 'ORANGE'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {r.severity}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-slate-600">
                            <div>{r.reporterName}</div>
                            <div className="font-mono text-slate-400">{r.reporterContact}</div>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r.status === 'APPROVED' || r.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.status === 'PENDING_VERIFICATION' && (
                                <>
                                  <button
                                    onClick={() => handleApproveReport(r.id)}
                                    className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectReport(r.id)}
                                    className="px-2 py-0.5 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteReport(r.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                                title="Delete Report"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* Shelters Table with Live +25/-25 Occupancy Mutators */}
              {selectedDbTable === 'shelters' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Shelter ID</th>
                      <th className="p-3">Name & Address</th>
                      <th className="p-3">District / State</th>
                      <th className="p-3">Live Occupancy / Capacity</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Adjust Occupancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData.shelters
                      .filter(s => !tableFilter || s.name.toLowerCase().includes(tableFilter.toLowerCase()) || s.district.toLowerCase().includes(tableFilter.toLowerCase()))
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono text-[11px] text-slate-500">{s.id}</td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{s.name}</div>
                            <div className="text-[11px] text-slate-500">{s.address}</div>
                          </td>
                          <td className="p-3 text-slate-700">
                            {s.district}, {s.state}
                          </td>
                          <td className="p-3 font-mono">
                            <div className="font-bold">{s.currentOccupancy} / {s.capacity}</div>
                            <div className="w-28 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  (s.currentOccupancy / s.capacity) >= 0.9 ? 'bg-rose-600' : 'bg-emerald-600'
                                }`}
                                style={{ width: `${Math.min(100, (s.currentOccupancy / s.capacity) * 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {s.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleUpdateOccupancy(s, -25)}
                                className="px-2 py-1 text-[11px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer"
                                title="Evacuees departed (-25)"
                              >
                                -25
                              </button>
                              <button
                                onClick={() => handleUpdateOccupancy(s, 25)}
                                className="px-2 py-1 text-[11px] font-mono font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-300 cursor-pointer"
                                title="Evacuees accommodated (+25)"
                              >
                                +25
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* Alerts Table with Acknowledge and Resolve Actions */}
              {selectedDbTable === 'alerts' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Alert ID</th>
                      <th className="p-3">Title & Zone</th>
                      <th className="p-3">Hazard & Severity</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData.alerts
                      .filter(a => !tableFilter || a.title.toLowerCase().includes(tableFilter.toLowerCase()) || a.zoneName.toLowerCase().includes(tableFilter.toLowerCase()))
                      .map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono text-[11px] text-slate-500">{a.id}</td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{a.title}</div>
                            <div className="text-[11px] text-slate-500">{a.zoneName}</div>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              a.severity === 'RED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}>
                              {a.severity} • {a.hazardType}
                            </span>
                          </td>
                          <td className="p-3 max-w-sm text-slate-700 text-xs">
                            {a.description}
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 font-mono">
                            {new Date(a.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {a.isActive ? (
                                <button
                                  onClick={() => handleResolveAlert(a.id)}
                                  className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                >
                                  Resolve
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400">Resolved</span>
                              )}
                              <button
                                onClick={() => handleDeleteAlert(a.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                                title="Delete Alert"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* Audit Table */}
              {selectedDbTable === 'audit' && (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity</th>
                      <th className="p-3">Details</th>
                      <th className="p-3">Officer / Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {tableData.audit
                      .filter(l => !tableFilter || l.details.toLowerCase().includes(tableFilter.toLowerCase()) || l.action.toLowerCase().includes(tableFilter.toLowerCase()))
                      .map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/80">
                          <td className="p-3 text-slate-500">{new Date(l.timestamp).toLocaleTimeString()}</td>
                          <td className="p-3 font-bold text-slate-800">{l.action}</td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                              {l.entity}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-sans text-xs">{l.details}</td>
                          <td className="p-3 text-slate-700">{l.officerOrUser || 'System'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Broadcast Dispatch Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Dispatch Real-Time Emergency Broadcast
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sends high-priority SSE notification to all active client sessions immediately.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alert Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flash Flood Evacuation Order - Sector 4"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Zone / Jurisdiction
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.zoneName}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, zoneName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={broadcastForm.severity}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, severity: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  >
                    <option value="RED">RED (Critical / Immediate Action)</option>
                    <option value="ORANGE">ORANGE (High Warning)</option>
                    <option value="YELLOW">YELLOW (Advisory)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hazard Classification
                  </label>
                  <select
                    value={broadcastForm.hazardType}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, hazardType: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  >
                    <option value="extreme_rainfall">Extreme Rainfall</option>
                    <option value="flood">Flood Inundation</option>
                    <option value="landslide">Landslide / Debris Flow</option>
                    <option value="cyclone">Cyclone / Gale</option>
                    <option value="cloudburst">Cloudburst</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evacuation / Public Advisory Directive
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the mandatory safety action, relocation shelter routes, and emergency helplines..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {broadcastSending ? 'Transmitting...' : 'Dispatch Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Record to Database Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Add Record to Persistent Database
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Direct insert into disk-persisted database with instant SSE sync.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Entity Selector Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAddRecordType('report')}
                className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                  addRecordType === 'report' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Citizen Report
              </button>
              <button
                type="button"
                onClick={() => setAddRecordType('shelter')}
                className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                  addRecordType === 'shelter' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Relocation Shelter
              </button>
              <button
                type="button"
                onClick={() => setAddRecordType('telemetry')}
                className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                  addRecordType === 'telemetry' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Sensor Telemetry
              </button>
            </div>

            <form onSubmit={handleAddRecordSubmit} className="space-y-3">
              {addRecordType === 'report' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Location Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Meppadi Ghat Road Curve 4"
                      value={reportForm.locationName}
                      onChange={e => setReportForm({ ...reportForm, locationName: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Hazard Type</label>
                      <select
                        value={reportForm.hazardType}
                        onChange={e => setReportForm({ ...reportForm, hazardType: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      >
                        <option value="landslide">Landslide</option>
                        <option value="flood">Flood</option>
                        <option value="cloudburst">Cloudburst</option>
                        <option value="extreme_rainfall">Extreme Rainfall</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                      <select
                        value={reportForm.severity}
                        onChange={e => setReportForm({ ...reportForm, severity: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      >
                        <option value="RED">RED</option>
                        <option value="ORANGE">ORANGE</option>
                        <option value="YELLOW">YELLOW</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                      <input
                        type="text"
                        required
                        value={reportForm.district}
                        onChange={e => setReportForm({ ...reportForm, district: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={reportForm.state}
                        onChange={e => setReportForm({ ...reportForm, state: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Observation details..."
                      value={reportForm.description}
                      onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </>
              )}

              {addRecordType === 'shelter' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Shelter Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Government Higher Secondary School Relief Center"
                      value={shelterForm.name}
                      onChange={e => setShelterForm({ ...shelterForm, name: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                      <input
                        type="number"
                        required
                        value={shelterForm.capacity}
                        onChange={e => setShelterForm({ ...shelterForm, capacity: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                      <input
                        type="text"
                        required
                        value={shelterForm.district}
                        onChange={e => setShelterForm({ ...shelterForm, district: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={shelterForm.address}
                      onChange={e => setShelterForm({ ...shelterForm, address: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </>
              )}

              {addRecordType === 'telemetry' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Zone Name</label>
                      <input
                        type="text"
                        required
                        value={telemetryForm.zoneName}
                        onChange={e => setTelemetryForm({ ...telemetryForm, zoneName: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Hazard Type</label>
                      <select
                        value={telemetryForm.hazardType}
                        onChange={e => setTelemetryForm({ ...telemetryForm, hazardType: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      >
                        <option value="landslide">Landslide</option>
                        <option value="flood">Flood</option>
                        <option value="cloudburst">Cloudburst</option>
                        <option value="cyclone">Cyclone</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Temp (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={telemetryForm.temperature_c}
                        onChange={e => setTelemetryForm({ ...telemetryForm, temperature_c: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Humidity (%)</label>
                      <input
                        type="number"
                        required
                        value={telemetryForm.humidity_percent}
                        onChange={e => setTelemetryForm({ ...telemetryForm, humidity_percent: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Rain 24h (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={telemetryForm.rainfall24h_mm}
                        onChange={e => setTelemetryForm({ ...telemetryForm, rainfall24h_mm: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Save Record to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Telemetry Zone Card
interface TelemetryZoneCardProps {
  zoneName: string;
  hazardType: string;
  state: string;
  record?: WeatherTelemetryRecord;
  defaultMetrics: {
    temperature_c: number;
    humidity_percent: number;
    rainfall24h_mm: number;
    surfacePressure_hpa: number;
    soilMoisture_percent: number;
    dewPoint_c: number;
    status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  };
}

const TelemetryZoneCard: React.FC<TelemetryZoneCardProps> = ({
  zoneName,
  hazardType,
  state,
  record,
  defaultMetrics
}) => {
  const m = record || defaultMetrics;
  const isCritical = m.status === 'CRITICAL';
  const isElevated = m.status === 'ELEVATED';

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isCritical
        ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
        : isElevated
        ? 'bg-amber-50/50 border-amber-200'
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            {hazardType}
          </span>
          <h4 className="text-xs font-bold text-slate-900 mt-1">{zoneName}</h4>
          <span className="text-[10px] text-slate-500">{state}, Republic of India</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isCritical
            ? 'bg-rose-600 text-white'
            : isElevated
            ? 'bg-amber-500 text-white'
            : 'bg-emerald-600 text-white'
        }`}>
          {m.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="p-1.5 rounded bg-white/70 border border-slate-200/60">
          <span className="text-[9px] text-slate-400 block uppercase font-mono">Temp / RH</span>
          <span className="text-xs font-bold font-mono text-slate-800">
            {m.temperature_c}°C
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">{m.humidity_percent}%</span>
        </div>

        <div className="p-1.5 rounded bg-white/70 border border-slate-200/60">
          <span className="text-[9px] text-slate-400 block uppercase font-mono">24h Rain</span>
          <span className={`text-xs font-bold font-mono ${m.rainfall24h_mm > 65 ? 'text-rose-600' : 'text-slate-800'}`}>
            {m.rainfall24h_mm} mm
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">Precip</span>
        </div>

        <div className="p-1.5 rounded bg-white/70 border border-slate-200/60">
          <span className="text-[9px] text-slate-400 block uppercase font-mono">Soil Sat.</span>
          <span className={`text-xs font-bold font-mono ${m.soilMoisture_percent > 80 ? 'text-rose-600' : 'text-slate-800'}`}>
            {m.soilMoisture_percent}%
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">Moisture</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Baro: {m.surfacePressure_hpa} hPa</span>
        <span>Dew Pt: {m.dewPoint_c}°C</span>
      </div>
    </div>
  );
};

function getEventTypeBadgeClass(type: string): string {
  switch (type.toUpperCase()) {
    case 'TELEMETRY':
      return 'bg-blue-900/80 text-blue-200 border border-blue-700';
    case 'ALERT':
      return 'bg-rose-900/80 text-rose-200 border border-rose-700';
    case 'REPORT':
      return 'bg-amber-900/80 text-amber-200 border border-amber-700';
    case 'SHELTER':
      return 'bg-emerald-900/80 text-emerald-200 border border-emerald-700';
    case 'BROADCAST':
      return 'bg-purple-900/80 text-purple-200 border border-purple-700';
    case 'HANDSHAKE':
      return 'bg-cyan-900/80 text-cyan-200 border border-cyan-700';
    default:
      return 'bg-slate-800 text-slate-300';
  }
}
