import { useState, useEffect, useCallback } from 'react';
import { realtimeClient } from '../services/realtimeClient';
import {
  WeatherTelemetryRecord,
  HazardAlertRecord,
  DatabaseStats,
  RealtimeStreamEvent
} from '../types';

export interface StreamEventItem {
  id: string;
  type: string;
  timestamp: string;
  summary: string;
  payload: any;
}

export function useRealtimeStream() {
  const [isConnected, setIsConnected] = useState<boolean>(() => realtimeClient.getStatus().isConnected);
  const [latencyMs, setLatencyMs] = useState<number>(() => realtimeClient.getStatus().latencyMs);
  const [activeClientsCount, setActiveClientsCount] = useState<number>(() => realtimeClient.getStatus().activeClientsCount);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [streamEvents, setStreamEvents] = useState<StreamEventItem[]>([]);
  const [liveTelemetry, setLiveTelemetry] = useState<Record<string, WeatherTelemetryRecord>>({});
  const [liveAlerts, setLiveAlerts] = useState<HazardAlertRecord[]>([]);
  const [latestBroadcast, setLatestBroadcast] = useState<{ title: string; message: string; severity: string; timestamp: string } | null>(null);

  // Load initial DB stats and alerts
  const loadInitialData = useCallback(async () => {
    try {
      const [stats, alerts] = await Promise.all([
        realtimeClient.fetchStats().catch(() => null),
        realtimeClient.fetchDbAlerts(true).catch(() => [])
      ]);
      if (stats) setDbStats(stats);
      if (alerts) setLiveAlerts(alerts);
    } catch (err) {
      console.warn('[useRealtimeStream] Initial fetch non-critical warn:', err);
    }
  }, []);

  const addEventToLog = useCallback((type: string, summary: string, payload: any) => {
    const item: StreamEventItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      timestamp: new Date().toISOString(),
      summary,
      payload
    };
    setStreamEvents((prev) => [item, ...prev.slice(0, 39)]); // keep last 40 events
  }, []);

  useEffect(() => {
    loadInitialData();

    // 1. Connection changes
    const unsubConn = realtimeClient.on('connectionChange', ({ isConnected }) => {
      setIsConnected(isConnected);
      if (isConnected) {
        addEventToLog('SYSTEM', 'Real-Time SSE Stream Connected to Sovereign GIS Gateway', {});
      } else {
        addEventToLog('SYSTEM', 'Real-Time Stream Disconnected (Attempting Reconnection)', {});
      }
    });

    // 2. Ping & heartbeat
    const unsubPing = realtimeClient.on('ping', ({ latencyMs, clientsCount }) => {
      setLatencyMs(latencyMs);
      setActiveClientsCount(clientsCount);
    });

    // 3. Handshake
    const unsubHandshake = realtimeClient.on('handshake', (data) => {
      setIsConnected(true);
      if (data.stats) setDbStats(data.stats);
      if (data.activeAlerts) setLiveAlerts(data.activeAlerts);
      addEventToLog('HANDSHAKE', `Initial SSE Sync: Handshake verified with database engine`, data);
    });

    // 4. Telemetry stream
    const unsubTelemetry = realtimeClient.on('telemetry', (record: WeatherTelemetryRecord) => {
      if (record && record.zoneId) {
        setLiveTelemetry((prev) => ({ ...prev, [record.zoneId]: record }));
        const summary = `Zone Telemetry: ${record.zoneName} (${record.temperature_c}°C, ${record.humidity_percent}% RH, ${record.rainfall24h_mm}mm rain)`;
        addEventToLog('TELEMETRY', summary, record);
      }
    });

    // 5. Alert stream
    const unsubAlert = realtimeClient.on('alert', (alert: HazardAlertRecord) => {
      if (alert && alert.id) {
        setLiveAlerts((prev) => {
          const filtered = prev.filter((a) => a.id !== alert.id);
          return [alert, ...filtered];
        });
        addEventToLog('ALERT', `Emergency Alert [${alert.severity}]: ${alert.title}`, alert);
      }
    });

    // 6. Citizen Report stream
    const unsubReport = realtimeClient.on('report', (reportPayload) => {
      const rep = reportPayload.data || reportPayload;
      addEventToLog('REPORT', `Citizen Report [${rep.severity || 'YELLOW'}]: ${rep.locationName} (${rep.hazardType})`, rep);
      // Refresh DB stats to update pending count
      realtimeClient.fetchStats().then(setDbStats).catch(() => {});
    });

    // 7. Shelter stream
    const unsubShelter = realtimeClient.on('shelter', (shelterPayload) => {
      const sh = shelterPayload.data || shelterPayload;
      addEventToLog('SHELTER', `Relocation Shelter Updated: ${sh.name} (${sh.district})`, sh);
    });

    // 8. Emergency broadcast stream
    const unsubBroadcast = realtimeClient.on('broadcast', (broadcastData) => {
      const b = broadcastData.alert || broadcastData;
      setLatestBroadcast({
        title: b.title || 'Emergency Operations Broadcast',
        message: broadcastData.message || b.description,
        severity: b.severity || 'RED',
        timestamp: new Date().toISOString()
      });
      addEventToLog('BROADCAST', `Emergency Operations Center Broadcast: ${b.title}`, broadcastData);
    });

    // 9. Database reset / system
    const unsubSystem = realtimeClient.on('system', (sysData) => {
      addEventToLog('SYSTEM', 'Database System State Resynced', sysData);
      loadInitialData();
    });

    return () => {
      unsubConn();
      unsubPing();
      unsubHandshake();
      unsubTelemetry();
      unsubAlert();
      unsubReport();
      unsubShelter();
      unsubBroadcast();
      unsubSystem();
    };
  }, [loadInitialData, addEventToLog]);

  const clearBroadcastNotice = useCallback(() => {
    setLatestBroadcast(null);
  }, []);

  const triggerManualSync = useCallback(async () => {
    try {
      const result = await realtimeClient.syncTelemetryNow();
      addEventToLog('MANUAL_SYNC', `Triggered sync across ${result.syncedZonesCount} monitored zones`, result);
      return result;
    } catch (err: any) {
      addEventToLog('ERROR', `Manual sync failed: ${err.message}`, {});
      throw err;
    }
  }, [addEventToLog]);

  const sendEmergencyBroadcast = useCallback(async (params: {
    title: string;
    message: string;
    severity?: string;
    zoneName?: string;
    hazardType?: string;
    dispatchedBy?: string;
  }) => {
    const res = await realtimeClient.sendBroadcast(params);
    addEventToLog('BROADCAST_SENT', `Dispatched broadcast to ${res.clientsReached} live connected clients`, res);
    return res;
  }, [addEventToLog]);

  const acknowledgeAlert = useCallback(async (alertId: string, officerName?: string) => {
    const updated = await realtimeClient.acknowledgeAlert(alertId, officerName);
    setLiveAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    addEventToLog('ACKNOWLEDGE', `Alert ${alertId} acknowledged`, updated);
    return updated;
  }, [addEventToLog]);

  return {
    isConnected,
    latencyMs,
    activeClientsCount,
    dbStats,
    streamEvents,
    liveTelemetry,
    liveAlerts,
    latestBroadcast,
    clearBroadcastNotice,
    triggerManualSync,
    sendEmergencyBroadcast,
    acknowledgeAlert,
    refreshStats: loadInitialData
  };
}
