import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './components/HomePage';
import { DashboardPage } from './components/DashboardPage';
import { LiveAlertsPage } from './components/LiveAlertsPage';
import { MapView } from './components/MapView';
import { AIRiskAnalyzerPage } from './components/AIRiskAnalyzerPage';
import { HistoricalHazardsPage } from './components/HistoricalHazardsPage';
import { PopulationAtRiskPage } from './components/PopulationAtRiskPage';
import { RelocationSheltersPage } from './components/RelocationSheltersPage';
import { ReportHazardPage } from './components/ReportHazardPage';
import { AdminPanelPage } from './components/AdminPanelPage';
import { RealtimeDatabasePage } from './components/RealtimeDatabasePage';
import { DownloadModal } from './components/DownloadModal';
import { realtimeClient } from './services/realtimeClient';

import { RiskZone, AlertItem, HistoricalEvent, CitizenHazardReport } from './types';
import { VERIFIED_HISTORICAL_EVENTS, BASELINE_HAZARD_ZONES } from './data/verifiedData';
import { generateActiveAlerts } from './services/dataOrchestrator';
import { Loader2 } from 'lucide-react';

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [riskZones, setRiskZones] = useState<RiskZone[]>(BASELINE_HAZARD_ZONES);
  const [alerts, setAlerts] = useState<AlertItem[]>(() => generateActiveAlerts());
  const [historicalEvents, setHistoricalEvents] = useState<HistoricalEvent[]>(VERIFIED_HISTORICAL_EVENTS);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(1);
  const [selectedZoneForAI, setSelectedZoneForAI] = useState<RiskZone | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch initial GIS layers and alerts from the Express server
  const loadData = async () => {
    try {
      const [zonesRes, alertsRes, reportsRes] = await Promise.all([
        fetch('/api/map/risk-zones'),
        fetch('/api/alerts'),
        fetch('/api/admin/reports')
      ]);

      if (zonesRes.ok) {
        const zData = await zonesRes.json();
        const loadedZones = zData.zones || zData.data;
        if (Array.isArray(loadedZones) && loadedZones.length > 0) {
          setRiskZones(loadedZones);
        }
      }
      if (alertsRes.ok) {
        const aData = await alertsRes.json();
        const loadedAlerts = aData.alerts || aData.data;
        if (Array.isArray(loadedAlerts) && loadedAlerts.length > 0) {
          setAlerts(loadedAlerts);
        }
      }
      if (reportsRes.ok) {
        const rData = await reportsRes.json();
        const pending = (rData.reports || []).filter((r: CitizenHazardReport) => r.status === 'PENDING_VERIFICATION');
        setPendingReportsCount(pending.length);
      }
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Attach live SSE stream event handlers to keep application state in sync in real time
    const unsubAlert = realtimeClient.on('alert', (newAlert) => {
      if (newAlert && newAlert.id) {
        setAlerts((prev) => {
          if (prev.some(a => a.id === newAlert.id)) return prev;
          const formattedAlert: AlertItem = {
            id: newAlert.id,
            hazard: newAlert.hazardType,
            severity: newAlert.severity,
            location: newAlert.zoneName || 'Monitored Sector',
            state: 'India',
            district: 'Operations District',
            latitude: 11.5173,
            longitude: 76.1368,
            riskScore: newAlert.severity === 'RED' ? 92 : 75,
            currentCondition: newAlert.description,
            historicalEvidence: 'IMD Verified High-Risk Basin',
            forecastEvidence: 'Threshold Sentinel Breach',
            reason: newAlert.description,
            recommendedAction: 'Immediate protective measures active.',
            populationAtRisk: 35000,
            timestamp: newAlert.timestamp || new Date().toISOString(),
            dataSources: [],
            isActive: true
          };
          return [formattedAlert, ...prev];
        });
      }
    });

    const unsubReport = realtimeClient.on('report', () => {
      setPendingReportsCount((prev) => prev + 1);
    });

    const unsubBroadcast = realtimeClient.on('broadcast', (broadcastData) => {
      const b = broadcastData.alert || broadcastData;
      if (b && b.id) {
        setAlerts((prev) => {
          if (prev.some(a => a.id === b.id)) return prev;
          const formattedAlert: AlertItem = {
            id: b.id,
            hazard: b.hazardType || 'severe_storm',
            severity: b.severity || 'RED',
            location: b.zoneName || 'National Operational Command',
            state: 'India',
            district: 'All Sectors',
            latitude: 20.5937,
            longitude: 78.9629,
            riskScore: 98,
            currentCondition: broadcastData.message || b.description,
            historicalEvidence: 'Official Emergency Broadcast Directive',
            forecastEvidence: 'NDMA Incident Command',
            reason: broadcastData.message || b.description,
            recommendedAction: 'Adhere to state evacuation guidelines immediately.',
            populationAtRisk: 150000,
            timestamp: new Date().toISOString(),
            dataSources: [],
            isActive: true
          };
          return [formattedAlert, ...prev];
        });
      }
    });

    return () => {
      unsubAlert();
      unsubReport();
      unsubBroadcast();
    };
  }, []);

  const handleSelectZoneForAI = (zone: RiskZone) => {
    setSelectedZoneForAI(zone);
    setCurrentPage('ai-analyzer');
  };

  const redAlertCount = alerts.filter(a => a.severity === 'RED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar
        activeAlerts={alerts}
        onNavigate={setCurrentPage}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
      />

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          redAlertCount={redAlertCount}
          pendingReportsCount={pendingReportsCount}
        />

        {/* Dynamic Page View Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs font-mono">Initializing India Sovereign GIS & Sensor Streams...</p>
            </div>
          ) : (
            <>
              {currentPage === 'home' && (
                <HomePage
                  riskZones={riskZones}
                  activeAlerts={alerts}
                  onNavigate={setCurrentPage}
                  onOpenDownload={() => setIsDownloadModalOpen(true)}
                />
              )}

              {currentPage === 'dashboard' && (
                <DashboardPage
                  riskZones={riskZones}
                  activeAlerts={alerts}
                  historicalEvents={historicalEvents}
                  onNavigate={setCurrentPage}
                  onSelectZoneForAI={handleSelectZoneForAI}
                />
              )}

              {currentPage === 'realtime-db' && (
                <RealtimeDatabasePage
                  onNavigateToMap={() => setCurrentPage('map')}
                />
              )}

              {currentPage === 'map' && (
                <MapView
                  riskZones={riskZones}
                  onSelectLocationForAI={handleSelectZoneForAI}
                />
              )}

              {currentPage === 'alerts' && (
                <LiveAlertsPage
                  alerts={alerts}
                  onNavigateToMap={() => setCurrentPage('map')}
                />
              )}

              {currentPage === 'ai-analyzer' && (
                <AIRiskAnalyzerPage
                  initialZone={selectedZoneForAI}
                  onNavigateToShelters={() => setCurrentPage('relocation')}
                  onNavigateToTraining={() => setCurrentPage('model-training')}
                />
              )}

              {currentPage === 'model-training' && (
                <ModelTrainingStudioPage
                  onNavigateToAnalyzer={() => setCurrentPage('ai-analyzer')}
                />
              )}

              {currentPage === 'historical' && (
                <HistoricalHazardsPage
                  historicalEvents={historicalEvents}
                  onNavigateToMap={() => setCurrentPage('map')}
                />
              )}

              {currentPage === 'population' && (
                <PopulationAtRiskPage riskZones={riskZones} />
              )}

              {currentPage === 'relocation' && (
                <RelocationSheltersPage riskZones={riskZones} />
              )}

              {currentPage === 'report' && (
                <ReportHazardPage
                  onSubmitSuccess={() => {
                    loadData();
                  }}
                />
              )}

              {currentPage === 'admin' && (
                <AdminPanelPage onNavigate={setCurrentPage} />
              )}
            </>
          )}
        </main>
      </div>

      {/* SIH Download Package Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}

export default App;
