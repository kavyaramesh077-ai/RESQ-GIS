import React, { useState, useEffect } from 'react';
import {
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  Building2,
  FileCheck,
  AlertTriangle,
  Clock,
  Database,
  LogOut,
  UserCheck,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { CitizenHazardReport, RelocationSite } from '../types';
import { AdminLoginPage, OfficerSession } from './AdminLoginPage';

interface AdminPanelPageProps {
  onNavigate?: (page: string) => void;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ onNavigate }) => {
  const [session, setSession] = useState<OfficerSession | null>(() => {
    try {
      const stored = localStorage.getItem('resq_admin_session') || sessionStorage.getItem('resq_admin_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [reports, setReports] = useState<CitizenHazardReport[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New shelter form state
  const [newShelterName, setNewShelterName] = useState('');
  const [newShelterState, setNewShelterState] = useState('Kerala');
  const [newShelterLat, setNewShelterLat] = useState('');
  const [newShelterLon, setNewShelterLon] = useState('');
  const [newShelterCapacity, setNewShelterCapacity] = useState('500');
  const [newShelterContact, setNewShelterContact] = useState('');
  const [newShelterPhone, setNewShelterPhone] = useState('');

  const fetchAdminData = async () => {
    try {
      const [reportsRes, statusRes] = await Promise.all([
        fetch('/api/admin/reports'),
        fetch('/api/admin/system-status')
      ]);
      if (reportsRes.ok) {
        const rData = await reportsRes.json();
        setReports(rData.reports || []);
      }
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setSystemStatus(sData);
      }
    } catch (err) {
      console.error('Failed to fetch admin telemetry', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAdminData();
    }
  }, [session]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('resq_admin_session');
    sessionStorage.removeItem('resq_admin_session');
    setSession(null);
  };

  // If not authenticated, display the Admin Login Page
  if (!session) {
    return (
      <AdminLoginPage
        onLoginSuccess={(newSession) => setSession(newSession)}
        onBackToDashboard={onNavigate ? () => onNavigate('dashboard') : undefined}
      />
    );
  }

  const handleApproveReport = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: 'Verified via ground officer inspection' })
      });
      if (res.ok) {
        setActionMessage(`Report ${id} approved.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectReport = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: 'Unsubstantiated / false alarm' })
      });
      if (res.ok) {
        setActionMessage(`Report ${id} rejected.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshCache = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/refresh-data', { method: 'POST' });
      if (res.ok) {
        setActionMessage('Data cache successfully cleared and re-synced.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newShelterName,
        state: newShelterState,
        coordinates: [parseFloat(newShelterLat), parseFloat(newShelterLon)],
        capacity: parseInt(newShelterCapacity) || 400,
        contactPerson: newShelterContact,
        contactPhone: newShelterPhone
      };
      const res = await fetch('/api/admin/relocation-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setActionMessage('New emergency shelter added to directory.');
        setNewShelterName('');
        setNewShelterLat('');
        setNewShelterLon('');
        setNewShelterContact('');
        setNewShelterPhone('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800">
      {/* Officer Clearance & Authentication Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">{session.officer.name}</span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {session.officer.officerId}
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Active Clearance: {session.officer.securityClearance?.split(' ')[0] || 'Level-3'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {session.officer.role} • {session.officer.agency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={handleRefreshCache}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Force refresh live sensor caches"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isRefreshing ? 'Re-Syncing...' : 'Re-Sync Live Feeds'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Terminate officer session and return to login"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Console Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-slate-700" />
          ResQ-GIS Administrative & Verification Console
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Official dashboard for reviewing citizen hazard reports, managing emergency shelters, and auditing API telemetry
        </p>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>
      )}

      {/* System Health Telemetry */}
      {systemStatus && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            Live Backend Telemetry & Sensor Health
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Open-Meteo Weather API</span>
              <span className="font-mono font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {systemStatus.apis?.openMeteo?.status || 'ONLINE'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">USGS Seismic Feed</span>
              <span className="font-mono font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {systemStatus.apis?.usgsEarthquakes?.status || 'ONLINE'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Copernicus 30m DEM</span>
              <span className="font-mono font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {systemStatus.apis?.copernicusDem?.status || 'ONLINE'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Server In-Memory Cache</span>
              <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                {systemStatus.server?.cachedWeatherEntries} entries
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Citizen Hazard Verification Queue */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-600" />
            Citizen Hazard Observation Queue ({reports.length})
          </h2>
          <span className="text-xs text-slate-500">Review ground observations before GIS layer promotion</span>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No citizen reports in queue.</div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div
                key={report.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {report.hazardType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        report.severity === 'RED' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {report.severity}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        report.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : report.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        STATUS: {report.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{report.locationName}</h3>
                    <p className="text-[11px] text-slate-500">
                      {report.district}, {report.state} • Coords: {report.latitude}°N, {report.longitude}°E
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Reported by: <strong className="text-slate-800">{report.reporterName}</strong> ({report.reporterContact || report.reporterPhone || 'N/A'})
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                  {report.description}
                </p>

                {report.imageUrl && (
                  <div className="relative aspect-21/9 sm:aspect-28/7 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={report.imageUrl}
                      alt={report.imageCaption || 'Attached field evidence'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[10px] font-mono">
                      <span>📷 Evidence Photo: {report.imageCaption || 'Ground-truth observation capture'}</span>
                      <span className="bg-emerald-600/90 text-white px-2 py-0.5 rounded">Attached by Citizen</span>
                    </div>
                  </div>
                )}

                {report.status === 'PENDING_VERIFICATION' && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleRejectReport(report.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject (False Alarm)</span>
                    </button>
                    <button
                      onClick={() => handleApproveReport(report.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve & Promote to GIS Layer</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Emergency Shelter Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          Register New Verified Disaster Shelter
        </h2>

        <form onSubmit={handleAddShelter} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-700 block mb-1 font-medium">Shelter Name *</label>
            <input
              type="text"
              required
              value={newShelterName}
              onChange={e => setNewShelterName(e.target.value)}
              placeholder="e.g. Kozhikode Coastal Relief Centre"
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-medium">Latitude (°N) *</label>
            <input
              type="number"
              step="0.0001"
              required
              value={newShelterLat}
              onChange={e => setNewShelterLat(e.target.value)}
              placeholder="e.g. 11.2588"
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-medium">Longitude (°E) *</label>
            <input
              type="number"
              step="0.0001"
              required
              value={newShelterLon}
              onChange={e => setNewShelterLon(e.target.value)}
              placeholder="e.g. 75.7804"
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-medium">Capacity (Persons)</label>
            <input
              type="number"
              value={newShelterCapacity}
              onChange={e => setNewShelterCapacity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-medium">Nodal Officer Name</label>
            <input
              type="text"
              value={newShelterContact}
              onChange={e => setNewShelterContact(e.target.value)}
              placeholder="e.g. District Tahsildar"
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-medium">Contact Phone</label>
            <input
              type="tel"
              value={newShelterPhone}
              onChange={e => setNewShelterPhone(e.target.value)}
              placeholder="e.g. +91 495 2371234"
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Add Verified Shelter to Directory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
