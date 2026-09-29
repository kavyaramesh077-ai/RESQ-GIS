// ResQ-GIS Core TypeScript Definitions

export type HazardType = 
  | 'flood'
  | 'landslide'
  | 'cyclone'
  | 'earthquake'
  | 'forest_fire'
  | 'extreme_rainfall'
  | 'drought'
  | 'heat_wave'
  | 'coastal_hazard'
  | 'severe_storm'
  | 'cloudburst';

export type RiskLevel = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';

export interface Provenance {
  source: string;
  datasetName: string;
  url: string;
  timestamp: string;
  observationDate: string;
  variable: string;
  unit: string;
  resolution?: string;
  processingMethod: string;
}

export interface RiskZone {
  id: string;
  name: string;
  state: string;
  district: string;
  hazardType: HazardType;
  coordinates: [number, number]; // [lat, lon]
  boundaryPolygon?: [number, number][]; // Spatial polygon for GIS rendering
  historicalSusceptibility: RiskLevel;
  historicalScore: number; // 0 - 100
  currentRisk: RiskLevel;
  currentScore: number; // 0 - 100
  populationExposed: {
    total: number;
    red: number;
    orange: number;
    yellow: number;
    area_sqkm?: number;
  };
  currentConditions: {
    rainfall24h_mm: number;
    rainfall3d_mm: number;
    rainfall7d_mm: number;
    rainfallAnomaly_percent?: number;
    soilMoisture_percent?: number;
    temperature_c?: number;
    windSpeed_kmh?: number;
    elevation_m?: number;
    slope_deg?: number;
  };
  historicalEvidence: {
    totalEventsRecorded: number;
    eventsLast5Years: number;
    latestEventDate: string;
    latestEventDescription: string;
    recurrenceTendency: string;
  };
  aiExplanation: string;
  recommendedAction: string;
  provenance: Provenance;
  lastUpdated: string;
  imageUrl?: string;
  imageCaption?: string;
  exactPlaceLocationDetails?: string;
}

export interface AlertItem {
  id: string;
  hazard: HazardType;
  severity: RiskLevel;
  location: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  riskScore: number;
  currentCondition: string;
  historicalEvidence: string;
  forecastEvidence: string;
  reason: string;
  recommendedAction: string;
  populationAtRisk: number;
  timestamp: string;
  dataSources: Provenance[];
  isActive: boolean;
}

export interface HistoricalEvent {
  id: string;
  hazard: HazardType;
  title: string;
  location: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  date: string;
  year: number;
  month: number;
  severity: RiskLevel;
  fatalities?: number;
  displaced?: number;
  economicImpact_inr_cr?: number;
  description: string;
  source: string;
  sourceUrl: string;
  rainfallRecord_mm?: number;
  rainfall_mm?: number;
  magnitude?: number; // for earthquakes
  cycloneCategory?: string; // for cyclones
  economicLoss_cr?: number;
  coordinates?: [number, number];
  imageUrl?: string;
  imageCaption?: string;
}

export interface RelocationSite {
  id: string;
  name: string;
  type: 'cyclone_shelter' | 'flood_relief_camp' | 'multi_purpose_evacuation_center' | 'school_community_shelter';
  state: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  status: 'operational' | 'standby' | 'active_evacuation' | 'full' | 'READY' | 'STANDBY' | 'FULL';
  contactPerson: string;
  contactPhone: string;
  amenities: string[];
  distanceKm?: number; // Calculated relative to search point
  verifiedBy: string;
  lastInspected: string;
  lastInspectionDate?: string;
  imageUrl?: string;
}

export interface CitizenReport {
  id: string;
  hazardType: HazardType;
  locationName: string;
  latitude: number;
  longitude: number;
  coordinates?: [number, number];
  district: string;
  state: string;
  description: string;
  severity: RiskLevel;
  reportedAt: string;
  reporterName: string;
  reporterContact?: string;
  reporterPhone?: string;
  photoUrl?: string;
  imageUrl?: string;
  imageCaption?: string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'VERIFIED' | 'REJECTED';
  adminNotes?: string;
  verifiedAt?: string;
}

export type CitizenHazardReport = CitizenReport;

export interface MLModelMetrics {
  modelName: string;
  architecture: string;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  testSamples: number;
  trainingDataset: string;
  validationSplit: string;
  status: 'operational' | 'validated' | 'experimental_research';
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
}

export interface AIRiskAnalysisResult {
  location: {
    name: string;
    latitude: number;
    longitude: number;
    state: string;
    district: string;
    isInsideIndia: boolean;
  };
  hazardType: HazardType;
  aiRiskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  historicalSusceptibility: RiskLevel;
  historicalScore: number;
  modelInference: {
    cnnSpatialScore: number;
    lstmSequenceScore: number;
    resnetFeatureStatus: string;
    ensembleConfidence: number; // actual calculated ensemble agreement
    modelWeights: {
      cnnSpatial: number;
      lstmTemporal: number;
      geospatialPhysics: number;
      historicalPrior: number;
    };
  };
  currentConditions: {
    rainfall24h_mm: number;
    rainfall3d_mm: number;
    rainfall7d_mm: number;
    rainfallForecast24h_mm: number;
    soilMoisture_percent: number;
    temperature_c: number;
    windSpeed_kmh: number;
    elevation_m: number;
    slope_deg: number;
  };
  historicalEvidence: {
    nearbyHistoricalEventsCount: number;
    latestEventDate: string;
    latestEventTitle: string;
    recurrenceRatePerDecade: number;
    seasonalityPeakMonth: string;
  };
  populationExposed: {
    totalAtRisk: number;
    redZone: number;
    orangeZone: number;
    yellowZone: number;
    gridResolution: string;
    dataSource: string;
  };
  aiExplanation: string;
  recommendedAction: string;
  nearestShelters: RelocationSite[];
  provenance: Provenance[];
  timestamp: string;
}

export interface PopulationAtRiskSummary {
  nationalRedPopulation: number;
  nationalOrangePopulation: number;
  nationalYellowPopulation: number;
  totalPopulationAtRisk: number;
  totalAreaAffectedKm2: number;
  dataset: string;
  datasetYear: number;
  resolution: string;
  calculatedAt: string;
  stateBreakdown: {
    state: string;
    hazard: HazardType;
    riskLevel: RiskLevel;
    population: number;
    areaKm2: number;
  }[];
}

export interface WeatherHourlyTrendPoint {
  time: string;
  hourLabel: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGusts?: number;
  precipitation: number;
  surfacePressure?: number;
}

export interface GroundedPlace {
  title: string;
  uri: string;
  category?: string;
  snippet?: string;
}

export interface ZoneWeatherDetails {
  zoneId: string;
  zoneName: string;
  district: string;
  state: string;
  hazardType: HazardType;
  coordinates: [number, number];
  current: {
    temperature_c: number;
    apparentTemperature_c: number;
    humidity_percent: number;
    windSpeed_kmh: number;
    windGusts_kmh: number;
    windDirection_deg: number;
    windDirection_compass: string;
    surfacePressure_hpa: number;
    rainCurrent_mm: number;
    rain24h_mm: number;
    soilMoisture_percent: number;
    elevation_m: number;
    dewPoint_c: number;
    conditionText: string;
    isDay: boolean;
  };
  trends: {
    temperature: {
      min24h: number;
      max24h: number;
      change6h: number;
      trend: 'rising' | 'falling' | 'stable';
    };
    humidity: {
      min24h: number;
      max24h: number;
      change6h: number;
      trend: 'rising' | 'falling' | 'stable';
      comfortLevel: 'dry' | 'optimal' | 'humid' | 'saturation_critical';
    };
    wind: {
      min24h: number;
      max24h: number;
      gustMax: number;
      trend: 'strengthening' | 'calming' | 'steady' | 'gusty';
      beaufortScale: string;
    };
  };
  hourly: WeatherHourlyTrendPoint[];
  hazardCorrelation: {
    severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    title: string;
    impactSummary: string;
    keyIndicators: string[];
    advisoryAction: string;
  };
  mapsGrounding?: {
    intelSummary: string;
    places: GroundedPlace[];
    groundedWith: string;
    timestamp: string;
    exactPlaceImage?: string;
    exactPlaceCaption?: string;
    exactPlaceLocationDetails?: string;
  };
  provenance: Provenance;
}

export interface WeatherTelemetryRecord {
  id: string;
  zoneId: string;
  zoneName: string;
  hazardType: HazardType;
  latitude: number;
  longitude: number;
  temperature_c: number;
  humidity_percent: number;
  rainfall24h_mm: number;
  rainfallCurrent_mm: number;
  windSpeed_kmh: number;
  windGusts_kmh?: number;
  surfacePressure_hpa: number;
  soilMoisture_percent: number;
  dewPoint_c: number;
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  timestamp: string;
  source: string;
}

export interface HazardAlertRecord {
  id: string;
  title: string;
  zoneId: string;
  zoneName: string;
  hazardType: HazardType;
  severity: RiskLevel;
  description: string;
  timestamp: string;
  isActive: boolean;
  acknowledged: boolean;
  acknowledgedAt?: string;
  source: string;
  metricsBreached?: string[];
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  action: string;
  entity: 'REPORT' | 'SHELTER' | 'TELEMETRY' | 'ALERT' | 'SYSTEM';
  details: string;
  officerOrUser?: string;
}

export interface DatabaseStats {
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  totalShelters: number;
  operationalShelters: number;
  totalTelemetryRecords: number;
  activeAlerts: number;
  auditLogCount: number;
  dbFileSizeKb: number;
  lastPersisted: string;
  diskPath: string;
  engine: string;
  status: 'ONLINE' | 'DEGRADED';
}

export interface RealtimeStreamEvent<T = any> {
  type: 'handshake' | 'ping' | 'telemetry' | 'alert' | 'report' | 'shelter' | 'system';
  timestamp: string;
  data: T;
}

export interface RealtimeStatus {
  connected: boolean;
  activeConnectionsCount: number;
  eventsEmittedCount: number;
  lastEventTimestamp: string | null;
  pollerActive: boolean;
  pollerIntervalSeconds: number;
}

export interface TrainingFeatureMeta {
  name: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  importanceWeight: number;
}

export interface TrainingDataset {
  id: string;
  name: string;
  hazardType: HazardType | 'multi_hazard';
  recordCount: number;
  featureNames: string[];
  targetColumn: string;
  description: string;
  provenance: string;
  temporalCoverage: string;
  geographicRegion: string;
  features: TrainingFeatureMeta[];
  sampleRows: Record<string, number | string>[];
  positiveRate: number; // percentage of target=1
}

export interface TrainingHyperparameters {
  epochs: number;
  learningRate: number;
  batchSize: number;
  optimizer: 'adam' | 'sgd' | 'rmsprop';
  lossFunction: 'binary_crossentropy' | 'focal_loss' | 'mse';
  validationSplit: number; // 0.1, 0.2, 0.3
  l2Regularization: number;
}

export interface TrainingEpochRecord {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  trainAccuracy: number;
  valAccuracy: number;
  f1Score: number;
  precision: number;
  recall: number;
  rocAuc: number;
  learningRate: number;
}

export interface ActiveTrainedWeights {
  modelId: string;
  modelName: string;
  datasetId: string;
  datasetName: string;
  version: string;
  trainedAt: string;
  cnnSpatialWeight: number;
  lstmTemporalWeight: number;
  geospatialPhysicsWeight: number;
  historicalPriorWeight: number;
  triggerThreshold: number;
  featureWeights: Record<string, number>;
  f1Score: number;
  rocAuc: number;
  precision: number;
  recall: number;
  validationAccuracy: number;
}

export interface TrainedModelSession {
  sessionId: string;
  modelId: string;
  modelName: string;
  datasetId: string;
  datasetName: string;
  hyperparameters: TrainingHyperparameters;
  status: 'idle' | 'training' | 'completed' | 'paused' | 'failed';
  currentEpoch: number;
  totalEpochs: number;
  history: TrainingEpochRecord[];
  finalMetrics?: {
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc: number;
    finalLoss: number;
    valAccuracy: number;
    confusionMatrix: {
      truePositive: number;
      falsePositive: number;
      trueNegative: number;
      falseNegative: number;
    };
    featureImportance: { feature: string; label: string; weight: number }[];
  };
  learnedWeights: ActiveTrainedWeights;
}

