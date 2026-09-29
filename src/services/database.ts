import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import {
  CitizenReport,
  RelocationSite,
  HazardType,
  RiskLevel,
  WeatherTelemetryRecord,
  HazardAlertRecord,
  SystemAuditLog,
  DatabaseStats
} from '../types';
import { VERIFIED_RELOCATION_SITES } from '../data/verifiedData';

export interface DatabasePayload {
  version: string;
  created: string;
  lastPersisted: string;
  citizenReports: CitizenReport[];
  shelters: RelocationSite[];
  telemetryRecords: WeatherTelemetryRecord[];
  alerts: HazardAlertRecord[];
  auditLogs: SystemAuditLog[];
}

class PersistentDatabaseManager extends EventEmitter {
  private dataDir: string;
  private dbFilePath: string;
  private data: DatabasePayload;
  private isWriting: boolean = false;
  private pendingWrite: boolean = false;

  constructor() {
    super();
    const basePath = typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.';
    this.dataDir = path.join(basePath, 'data');
    this.dbFilePath = path.join(this.dataDir, 'resq_gis_database.json');
    this.data = this.initializeDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private createSeedData(): DatabasePayload {
    const now = new Date();

    const baselineReports: CitizenReport[] = [
      {
        id: 'rep-001',
        hazardType: 'landslide',
        locationName: 'Pulpally Ghat Road, Wayanad',
        latitude: 11.7820,
        longitude: 76.1620,
        district: 'Wayanad',
        state: 'Kerala',
        description: 'Fresh minor rockfall and tension crack visible along cut slope after morning heavy downpour. Culvert is partially blocked.',
        severity: 'ORANGE',
        reportedAt: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
        reporterName: 'Arjun Das (Local Resident)',
        reporterContact: '+91-94471XXXXX',
        status: 'PENDING_VERIFICATION'
      },
      {
        id: 'rep-002',
        hazardType: 'flood',
        locationName: 'Velachery Lake Low-Lying Sector, Chennai',
        latitude: 12.9810,
        longitude: 80.2190,
        district: 'Chennai',
        state: 'Tamil Nadu',
        description: 'Water accumulation of 1.5 feet on residential cross street due to reverse flow from lake surplus canal.',
        severity: 'YELLOW',
        reportedAt: new Date(now.getTime() - 8 * 3600 * 1000).toISOString(),
        reporterName: 'P. Vengatesh',
        reporterContact: '+91-98402XXXXX',
        status: 'APPROVED',
        adminNotes: 'Verified by Greater Chennai Corporation Zonal Officer. Standby dewatering pump activated.',
        verifiedAt: new Date(now.getTime() - 5 * 3600 * 1000).toISOString()
      },
      {
        id: 'rep-003',
        hazardType: 'cloudburst',
        locationName: 'Dharali Catchment, Bhagirathi Valley, Uttarkashi',
        latitude: 31.0264,
        longitude: 78.7351,
        district: 'Uttarkashi',
        state: 'Uttarakhand',
        description: 'Sudden high-intensity squall and muddy stream surge crossing Gangotri Highway. Local SDRF alerted.',
        severity: 'RED',
        reportedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
        reporterName: 'Rameshwar Rawat (Gram Pradhan)',
        reporterContact: '+91-94120XXXXX',
        status: 'APPROVED',
        adminNotes: 'Confirmed by District Emergency Operations Center (DEOC). Evacuation advisory issued.',
        verifiedAt: new Date(now.getTime() - 40 * 60 * 1000).toISOString()
      }
    ];

    const baselineTelemetry: WeatherTelemetryRecord[] = [
      {
        id: 'tel-wayanad-01',
        zoneId: 'zone-wayanad-ghats',
        zoneName: 'Wayanad Meppadi Hill Tract',
        hazardType: 'landslide',
        latitude: 11.5173,
        longitude: 76.1368,
        temperature_c: 21.4,
        humidity_percent: 94,
        rainfall24h_mm: 78.6,
        rainfallCurrent_mm: 8.2,
        windSpeed_kmh: 18.4,
        windGusts_kmh: 29.1,
        surfacePressure_hpa: 1008.2,
        soilMoisture_percent: 88,
        dewPoint_c: 20.4,
        status: 'CRITICAL',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        source: 'Open-Meteo Synoptic Feed & IMD AWS Calibrated'
      },
      {
        id: 'tel-joshimath-01',
        zoneId: 'zone-joshimath',
        zoneName: 'Joshimath Ravigram Sector',
        hazardType: 'landslide',
        latitude: 30.5564,
        longitude: 79.5678,
        temperature_c: 12.8,
        humidity_percent: 74,
        rainfall24h_mm: 22.4,
        rainfallCurrent_mm: 0.0,
        windSpeed_kmh: 14.0,
        windGusts_kmh: 22.5,
        surfacePressure_hpa: 1014.0,
        soilMoisture_percent: 64,
        dewPoint_c: 8.2,
        status: 'ELEVATED',
        timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        source: 'Open-Meteo Synoptic Feed'
      },
      {
        id: 'tel-velachery-01',
        zoneId: 'zone-velachery',
        zoneName: 'Velachery Lowland Urban Basin',
        hazardType: 'flood',
        latitude: 12.9810,
        longitude: 80.2190,
        temperature_c: 29.6,
        humidity_percent: 82,
        rainfall24h_mm: 48.0,
        rainfallCurrent_mm: 4.5,
        windSpeed_kmh: 24.0,
        windGusts_kmh: 38.0,
        surfacePressure_hpa: 1004.5,
        soilMoisture_percent: 79,
        dewPoint_c: 26.2,
        status: 'ELEVATED',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        source: 'Open-Meteo Synoptic Feed'
      },
      {
        id: 'tel-subansiri-01',
        zoneId: 'zone-subansiri',
        zoneName: 'Subansiri River Gorge Basin',
        hazardType: 'cloudburst',
        latitude: 27.5312,
        longitude: 94.2541,
        temperature_c: 24.1,
        humidity_percent: 91,
        rainfall24h_mm: 64.2,
        rainfallCurrent_mm: 12.0,
        windSpeed_kmh: 16.5,
        windGusts_kmh: 26.0,
        surfacePressure_hpa: 1006.8,
        soilMoisture_percent: 84,
        dewPoint_c: 22.5,
        status: 'CRITICAL',
        timestamp: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
        source: 'Open-Meteo Synoptic Feed'
      }
    ];

    const baselineAlerts: HazardAlertRecord[] = [
      {
        id: 'alt-wayanad-01',
        title: 'High Slope Saturation & Excessive Rainfall',
        zoneId: 'zone-wayanad-ghats',
        zoneName: 'Wayanad Meppadi Hill Tract',
        hazardType: 'landslide',
        severity: 'RED',
        description: 'Cumulative 24h rainfall exceeded 75mm (recorded 78.6mm) and soil moisture reached 88%. Slope failure probability high in cut slopes.',
        timestamp: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
        isActive: true,
        acknowledged: false,
        source: 'IMD / NDMA Multi-Hazard Threshold Engine',
        metricsBreached: ['rainfall24h: 78.6mm (threshold 65mm)', 'soilMoisture: 88% (threshold 80%)']
      },
      {
        id: 'alt-subansiri-01',
        title: 'Intense Convective Precipitation Advisory',
        zoneId: 'zone-subansiri',
        zoneName: 'Subansiri River Gorge Basin',
        hazardType: 'cloudburst',
        severity: 'ORANGE',
        description: 'Current rain rate of 12.0 mm/h with 91% relative humidity creates potential for sudden flash floods along steep tributaries.',
        timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        isActive: true,
        acknowledged: false,
        source: 'CWC River Monitoring & Radar Synthesis',
        metricsBreached: ['rainRate: 12.0 mm/h (threshold 10mm/h)']
      }
    ];

    const baselineAuditLogs: SystemAuditLog[] = [
      {
        id: 'aud-001',
        timestamp: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
        action: 'DATABASE_INITIALIZATION',
        entity: 'SYSTEM',
        details: 'ResQ-GIS Sovereign India Persistent Database initialized with verified baseline schemas and datasets.',
        officerOrUser: 'System Administrator'
      },
      {
        id: 'aud-002',
        timestamp: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
        action: 'VERIFY_REPORT',
        entity: 'REPORT',
        details: 'Citizen report rep-002 verified for Velachery Urban Basin. Relief pumps deployed.',
        officerOrUser: 'NDMA-CHENNAI-OFFICER'
      }
    ];

    return {
      version: '2.5.0-SIH',
      created: now.toISOString(),
      lastPersisted: now.toISOString(),
      citizenReports: baselineReports,
      shelters: [...VERIFIED_RELOCATION_SITES],
      telemetryRecords: baselineTelemetry,
      alerts: baselineAlerts,
      auditLogs: baselineAuditLogs
    };
  }

  private initializeDatabase(): DatabasePayload {
    this.ensureDirectory();

    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.citizenReports) && Array.isArray(parsed.shelters)) {
          // Ensure all array properties exist
          if (!Array.isArray(parsed.telemetryRecords)) parsed.telemetryRecords = [];
          if (!Array.isArray(parsed.alerts)) parsed.alerts = [];
          if (!Array.isArray(parsed.auditLogs)) parsed.auditLogs = [];
          return parsed;
        }
      } catch (err) {
        console.error('[Database] Failed to parse existing database file, falling back to verified seed:', err);
      }
    }

    const seed = this.createSeedData();
    this.saveToDisk(seed);
    return seed;
  }

  private saveToDisk(payload?: DatabasePayload) {
    const toSave = payload || this.data;
    toSave.lastPersisted = new Date().toISOString();

    if (this.isWriting) {
      this.pendingWrite = true;
      return;
    }

    this.isWriting = true;
    try {
      this.ensureDirectory();
      const tempPath = `${this.dbFilePath}.tmp-${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(toSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.dbFilePath);
    } catch (err) {
      console.error('[Database] Error persisting data to disk:', err);
    } finally {
      this.isWriting = false;
      if (this.pendingWrite) {
        this.pendingWrite = false;
        this.saveToDisk();
      }
    }
  }

  // --- Reports CRUD ---
  public getReports(): CitizenReport[] {
    return [...this.data.citizenReports];
  }

  public getReportById(id: string): CitizenReport | undefined {
    return this.data.citizenReports.find(r => r.id === id);
  }

  public addReport(report: Omit<CitizenReport, 'id' | 'reportedAt'>): CitizenReport {
    const newReport: CitizenReport = {
      ...report,
      id: `rep-${Date.now().toString().slice(-6)}`,
      reportedAt: new Date().toISOString()
    };
    this.data.citizenReports.unshift(newReport);
    this.saveToDisk();

    this.logAudit('SUBMIT_REPORT', 'REPORT', `New report ${newReport.id} (${newReport.hazardType}) submitted for ${newReport.locationName}`, newReport.reporterName);
    this.emit('mutation', { entity: 'REPORT', action: 'CREATE', data: newReport });
    return newReport;
  }

  public updateReportStatus(id: string, status: CitizenReport['status'], notes?: string, verifiedBy?: string): CitizenReport | null {
    const report = this.data.citizenReports.find(r => r.id === id);
    if (!report) return null;

    report.status = status;
    if (notes) report.adminNotes = notes;
    if (status === 'APPROVED' || status === 'VERIFIED') {
      report.verifiedAt = new Date().toISOString();
    }
    this.saveToDisk();

    this.logAudit('UPDATE_REPORT_STATUS', 'REPORT', `Report ${id} updated to ${status}. Notes: ${notes || 'none'}`, verifiedBy || 'Officer');
    this.emit('mutation', { entity: 'REPORT', action: 'UPDATE', data: report });
    return report;
  }

  public deleteReport(id: string, user?: string): boolean {
    const index = this.data.citizenReports.findIndex(r => r.id === id);
    if (index === -1) return false;
    const removed = this.data.citizenReports.splice(index, 1)[0];
    this.saveToDisk();

    this.logAudit('DELETE_REPORT', 'REPORT', `Report ${id} deleted from database`, user || 'Officer');
    this.emit('mutation', { entity: 'REPORT', action: 'DELETE', data: removed });
    return true;
  }

  // --- Shelters CRUD ---
  public getShelters(): RelocationSite[] {
    return this.data.shelters.map(s => ({
      ...s,
      imageUrl: s.imageUrl || '/images/cyclone_relief_shelter_1790611389117.jpg'
    }));
  }

  public addShelter(site: Omit<RelocationSite, 'id'>, user?: string): RelocationSite {
    const newSite: RelocationSite = {
      ...site,
      id: `sh-adm-${Date.now().toString().slice(-5)}`
    };
    this.data.shelters.push(newSite);
    this.saveToDisk();

    this.logAudit('ADD_SHELTER', 'SHELTER', `New shelter ${newSite.name} registered in ${newSite.district}, capacity: ${newSite.capacity}`, user || 'Admin');
    this.emit('mutation', { entity: 'SHELTER', action: 'CREATE', data: newSite });
    return newSite;
  }

  public updateShelterOccupancy(id: string, currentOccupancy: number, user?: string): RelocationSite | null {
    const shelter = this.data.shelters.find(s => s.id === id);
    if (!shelter) return null;

    shelter.currentOccupancy = Math.max(0, currentOccupancy);
    if (shelter.currentOccupancy >= shelter.capacity) {
      shelter.status = 'full';
    } else if (shelter.currentOccupancy > 0) {
      shelter.status = 'active_evacuation';
    } else {
      shelter.status = 'operational';
    }
    this.saveToDisk();

    this.logAudit('UPDATE_SHELTER_OCCUPANCY', 'SHELTER', `Shelter ${shelter.name} occupancy updated to ${currentOccupancy}/${shelter.capacity}`, user || 'Field Operator');
    this.emit('mutation', { entity: 'SHELTER', action: 'UPDATE', data: shelter });
    return shelter;
  }

  public deleteShelter(id: string, user?: string): boolean {
    const index = this.data.shelters.findIndex(s => s.id === id);
    if (index === -1) return false;
    const removed = this.data.shelters.splice(index, 1)[0];
    this.saveToDisk();

    this.logAudit('DELETE_SHELTER', 'SHELTER', `Shelter ${removed.name} removed from registry`, user || 'Admin');
    this.emit('mutation', { entity: 'SHELTER', action: 'DELETE', data: removed });
    return true;
  }

  // --- Telemetry Time-Series ---
  public getTelemetry(zoneId?: string, limit: number = 50): WeatherTelemetryRecord[] {
    let list = this.data.telemetryRecords;
    if (zoneId) {
      list = list.filter(t => t.zoneId === zoneId);
    }
    return list.slice(0, limit);
  }

  public addTelemetry(record: Omit<WeatherTelemetryRecord, 'id'>): WeatherTelemetryRecord {
    const newRecord: WeatherTelemetryRecord = {
      ...record,
      id: `tel-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`
    };
    // Keep max 500 time-series telemetry records to maintain optimum size
    this.data.telemetryRecords.unshift(newRecord);
    if (this.data.telemetryRecords.length > 500) {
      this.data.telemetryRecords = this.data.telemetryRecords.slice(0, 500);
    }
    this.saveToDisk();

    this.emit('mutation', { entity: 'TELEMETRY', action: 'CREATE', data: newRecord });
    return newRecord;
  }

  // --- Hazard Alerts ---
  public getAlerts(activeOnly: boolean = false): HazardAlertRecord[] {
    if (activeOnly) {
      return this.data.alerts.filter(a => a.isActive);
    }
    return [...this.data.alerts];
  }

  public addAlert(alert: Omit<HazardAlertRecord, 'id' | 'timestamp'>): HazardAlertRecord {
    const newAlert: HazardAlertRecord = {
      ...alert,
      id: `alt-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString()
    };
    this.data.alerts.unshift(newAlert);
    this.saveToDisk();

    this.logAudit('TRIGGER_ALERT', 'ALERT', `[${newAlert.severity}] ${newAlert.title} for ${newAlert.zoneName}`, newAlert.source);
    this.emit('mutation', { entity: 'ALERT', action: 'CREATE', data: newAlert });
    return newAlert;
  }

  public acknowledgeAlert(id: string, officer: string = 'Duty Officer'): HazardAlertRecord | null {
    const alert = this.data.alerts.find(a => a.id === id);
    if (!alert) return null;
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    this.saveToDisk();

    this.logAudit('ACKNOWLEDGE_ALERT', 'ALERT', `Alert ${id} acknowledged by officer`, officer);
    this.emit('mutation', { entity: 'ALERT', action: 'UPDATE', data: alert });
    return alert;
  }

  public resolveAlert(id: string, notes?: string, officer: string = 'Duty Officer'): HazardAlertRecord | null {
    const alert = this.data.alerts.find(a => a.id === id);
    if (!alert) return null;
    alert.isActive = false;
    alert.acknowledged = true;
    this.saveToDisk();

    this.logAudit('RESOLVE_ALERT', 'ALERT', `Alert ${id} marked resolved. ${notes || ''}`, officer);
    this.emit('mutation', { entity: 'ALERT', action: 'UPDATE', data: alert });
    return alert;
  }

  public deleteAlert(id: string, user: string = 'Officer'): boolean {
    const index = this.data.alerts.findIndex(a => a.id === id);
    if (index === -1) return false;
    const removed = this.data.alerts.splice(index, 1)[0];
    this.saveToDisk();

    this.logAudit('DELETE_ALERT', 'ALERT', `Alert ${id} removed from database`, user);
    this.emit('mutation', { entity: 'ALERT', action: 'DELETE', data: removed });
    return true;
  }

  public deleteTelemetry(id: string, user: string = 'Officer'): boolean {
    const index = this.data.telemetryRecords.findIndex(t => t.id === id);
    if (index === -1) return false;
    const removed = this.data.telemetryRecords.splice(index, 1)[0];
    this.saveToDisk();

    this.logAudit('DELETE_TELEMETRY', 'TELEMETRY', `Telemetry record ${id} removed`, user);
    this.emit('mutation', { entity: 'TELEMETRY', action: 'DELETE', data: removed });
    return true;
  }

  // --- Audit Logs ---
  public getAuditLogs(limit: number = 100): SystemAuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  public logAudit(action: string, entity: SystemAuditLog['entity'], details: string, officerOrUser?: string): void {
    const log: SystemAuditLog = {
      id: `aud-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      details,
      officerOrUser: officerOrUser || 'System'
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.saveToDisk();
  }

  // --- Database Stats & Admin ---
  public getStats(): DatabaseStats {
    let fileSizeKb = 0;
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const stat = fs.statSync(this.dbFilePath);
        fileSizeKb = Number((stat.size / 1024).toFixed(2));
      }
    } catch {
      fileSizeKb = 0;
    }

    const pendingReports = this.data.citizenReports.filter(r => r.status === 'PENDING_VERIFICATION').length;
    const approvedReports = this.data.citizenReports.filter(r => r.status === 'APPROVED' || r.status === 'VERIFIED').length;
    const operationalShelters = this.data.shelters.filter(s => s.status === 'operational' || s.status === 'active_evacuation').length;
    const activeAlerts = this.data.alerts.filter(a => a.isActive).length;

    return {
      totalReports: this.data.citizenReports.length,
      pendingReports,
      approvedReports,
      totalShelters: this.data.shelters.length,
      operationalShelters,
      totalTelemetryRecords: this.data.telemetryRecords.length,
      activeAlerts,
      auditLogCount: this.data.auditLogs.length,
      dbFileSizeKb: fileSizeKb,
      lastPersisted: this.data.lastPersisted,
      diskPath: this.dbFilePath,
      engine: 'ResQ-GIS Sovereign JSON-ACID Embedded DB Engine',
      status: 'ONLINE'
    };
  }

  public exportDatabase(): DatabasePayload {
    return JSON.parse(JSON.stringify(this.data));
  }

  public resetAndSeed(): DatabaseStats {
    this.data = this.createSeedData();
    this.saveToDisk();
    this.logAudit('DATABASE_RESET_SEED', 'SYSTEM', 'Database reset to official verified Indian baseline datasets', 'Administrator');
    this.emit('mutation', { entity: 'SYSTEM', action: 'RESET', data: { timestamp: new Date().toISOString() } });
    return this.getStats();
  }
}

export const dbManager = new PersistentDatabaseManager();
