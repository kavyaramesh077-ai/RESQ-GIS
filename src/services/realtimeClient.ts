import {
  RealtimeStreamEvent,
  WeatherTelemetryRecord,
  HazardAlertRecord,
  DatabaseStats,
  CitizenReport,
  RelocationSite
} from '../types';

type EventCallback<T = any> = (payload: T) => void;

class RealtimeServiceClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnected: boolean = false;
  private reconnectTimeout: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private lastPingTime: number = Date.now();
  private latencyMs: number = 0;
  private activeClientsCount: number = 1;

  constructor() {
    this.connect();
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      return;
    }

    try {
      this.eventSource = new EventSource('/api/realtime/stream');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connectionChange', { isConnected: true });
      };

      this.eventSource.onerror = (err) => {
        this.isConnected = false;
        this.emit('connectionChange', { isConnected: false });
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        this.scheduleReconnect();
      };

      // Built-in SSE event handlers
      this.eventSource.addEventListener('handshake', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          this.emit('handshake', parsed.data);
        } catch {}
      });

      this.eventSource.addEventListener('ping', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.clientsCount !== undefined) {
            this.activeClientsCount = parsed.clientsCount;
          }
          this.latencyMs = Math.max(5, Math.min(250, Math.round(Math.random() * 20 + 15)));
          this.emit('ping', { timestamp: parsed.timestamp, latencyMs: this.latencyMs, clientsCount: this.activeClientsCount });
        } catch {}
      });

      this.eventSource.addEventListener('telemetry', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          this.emit('telemetry', parsed.data);
        } catch {}
      });

      this.eventSource.addEventListener('alert', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          this.emit('alert', parsed.data);
        } catch {}
      });

      this.eventSource.addEventListener('report', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          this.emit('report', parsed.data);
        } catch {}
      });

      this.eventSource.addEventListener('shelter', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          this.emit('shelter', parsed.data);
        } catch {}
      });

      this.eventSource.addEventListener('broadcast', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          this.emit('broadcast', parsed.data);
        } catch {}
      });

      this.eventSource.addEventListener('system', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          this.emit('system', parsed.data);
        } catch {}
      });

    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[RealtimeClient] Error in listener for ${event}:`, err);
        }
      });
    }
    // Also emit to universal wildcard listener
    const all = this.listeners.get('*');
    if (all) {
      all.forEach((cb) => cb({ event, data, timestamp: new Date().toISOString() }));
    }
  }

  public getStatus() {
    return {
      isConnected: this.isConnected,
      latencyMs: this.latencyMs,
      activeClientsCount: this.activeClientsCount,
      readyState: this.eventSource?.readyState ?? EventSource.CLOSED
    };
  }

  // --- REST Helpers for Database & Real-Time APIs ---

  public async fetchStats(): Promise<DatabaseStats> {
    const res = await fetch('/api/db/stats');
    if (!res.ok) throw new Error('Failed to fetch DB stats');
    return res.json();
  }

  public async fetchTelemetryHistory(zoneId?: string, limit: number = 30): Promise<WeatherTelemetryRecord[]> {
    const url = zoneId ? `/api/db/telemetry?zoneId=${encodeURIComponent(zoneId)}&limit=${limit}` : `/api/db/telemetry?limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch telemetry history');
    const data = await res.json();
    return data.records || [];
  }

  public async fetchDbAlerts(activeOnly: boolean = false): Promise<HazardAlertRecord[]> {
    const res = await fetch(`/api/db/alerts?activeOnly=${activeOnly}`);
    if (!res.ok) throw new Error('Failed to fetch alerts from DB');
    const data = await res.json();
    return data.alerts || [];
  }

  public async acknowledgeAlert(alertId: string, officerName?: string): Promise<HazardAlertRecord> {
    const res = await fetch(`/api/db/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officer: officerName || 'Duty Emergency Controller' })
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    const data = await res.json();
    return data.alert;
  }

  public async sendBroadcast(payload: {
    title: string;
    message: string;
    severity?: string;
    zoneName?: string;
    hazardType?: string;
    dispatchedBy?: string;
  }): Promise<any> {
    const res = await fetch('/api/realtime/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to dispatch broadcast');
    return res.json();
  }

  public async syncTelemetryNow(): Promise<any> {
    const res = await fetch('/api/realtime/sync-telemetry', {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to sync telemetry');
    return res.json();
  }

  public async reseedDatabase(): Promise<DatabaseStats> {
    const res = await fetch('/api/db/seed', {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reseed database');
    const data = await res.json();
    return data.stats;
  }

  public async fetchAuditLogs(limit: number = 50): Promise<any[]> {
    const res = await fetch(`/api/db/audit-logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const data = await res.json();
    return data.logs || [];
  }

  public async updateShelterOccupancy(shelterId: string, currentOccupancy: number, officer?: string): Promise<RelocationSite> {
    const res = await fetch(`/api/db/shelters/${shelterId}/occupancy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentOccupancy, officer })
    });
    if (!res.ok) throw new Error('Failed to update shelter occupancy');
    const data = await res.json();
    return data.shelter;
  }

  public async resolveAlert(alertId: string, notes?: string, officer?: string): Promise<HazardAlertRecord> {
    const res = await fetch(`/api/db/alerts/${alertId}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, officer })
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    const data = await res.json();
    return data.alert;
  }

  public async deleteAlert(alertId: string): Promise<void> {
    const res = await fetch(`/api/db/alerts/${alertId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete alert');
  }

  public async deleteTelemetry(telemetryId: string): Promise<void> {
    const res = await fetch(`/api/db/telemetry/${telemetryId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete telemetry record');
  }

  public async deleteReport(reportId: string): Promise<void> {
    const res = await fetch(`/api/db/reports/${reportId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete citizen report');
  }

  public async simulateBurst(burstType: string, zoneId?: string): Promise<any> {
    const res = await fetch('/api/db/simulate-burst', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ burstType, zoneId })
    });
    if (!res.ok) throw new Error('Failed to trigger simulation burst');
    return res.json();
  }

  public async addCitizenReport(reportData: any): Promise<CitizenReport> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    if (!res.ok) throw new Error('Failed to add citizen report');
    const data = await res.json();
    return data.report;
  }

  public async addShelter(shelterData: any): Promise<RelocationSite> {
    const res = await fetch('/api/admin/relocation-sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shelterData)
    });
    if (!res.ok) throw new Error('Failed to add relocation shelter');
    const data = await res.json();
    return data.site;
  }
}

export const realtimeClient = new RealtimeServiceClient();
