import { HazardType, RiskZone } from '../types';

export interface MetricThresholdRule {
  metricKey: 'humidity_percent' | 'temperature_c' | 'windSpeed_kmh' | 'windGusts_kmh' | 'rainCurrent_mm' | 'rain24h_mm' | 'soilMoisture_percent' | 'surfacePressure_hpa' | 'dewPointDepression_c';
  label: string;
  unit: string;
  criticalThreshold: number;
  warningThreshold?: number;
  condition: 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN_OR_EQUAL';
  rationale: string;
}

export interface HazardSafetyThresholdConfig {
  hazardType: HazardType;
  hazardName: string;
  rules: MetricThresholdRule[];
  defaultAdvisory: string;
  criticalAdvisory: string;
}

export interface BreachedMetric {
  metricKey: string;
  label: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
  severity: 'CRITICAL' | 'WARNING';
  difference: number;
  formattedDifference: string;
  rationale: string;
}

export interface SafetyEvaluationResult {
  zoneId: string;
  zoneName: string;
  hazardType: HazardType;
  status: 'CRITICAL' | 'WARNING' | 'NORMAL';
  isCritical: boolean;
  isBreached: boolean;
  breaches: BreachedMetric[];
  highestSeverity: 'CRITICAL' | 'WARNING' | 'NORMAL';
  primaryBreachText: string;
  advisory: string;
  evaluatedAt: string;
}

/**
 * Standard Multi-Hazard Safety Thresholds Matrix
 * Defined based on IMD (India Meteorological Department), CWC, and NDMA early warning criteria.
 */
export const HAZARD_SAFETY_THRESHOLDS: Record<HazardType, HazardSafetyThresholdConfig> = {
  landslide: {
    hazardType: 'landslide',
    hazardName: 'Landslide / Debris Flow Hazard',
    rules: [
      {
        metricKey: 'humidity_percent',
        label: 'Relative Humidity',
        unit: '%',
        criticalThreshold: 82,
        warningThreshold: 75,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Suppresses slope evapotranspiration, preventing drainage of moisture-laden overburden.'
      },
      {
        metricKey: 'rain24h_mm',
        label: '24h Cumulative Precipitation',
        unit: 'mm',
        criticalThreshold: 65,
        warningThreshold: 40,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Fills sub-surface shear fissures and drastically elevates destabilizing pore-water pressure.'
      },
      {
        metricKey: 'soilMoisture_percent',
        label: 'Soil Moisture Saturation',
        unit: '%',
        criticalThreshold: 80,
        warningThreshold: 70,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Reduces soil internal shear friction angle below critical equilibrium threshold.'
      },
      {
        metricKey: 'windGusts_kmh',
        label: 'Peak Wind Gusts',
        unit: 'km/h',
        criticalThreshold: 42,
        warningThreshold: 30,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'High scarp wind turbulence exerts mechanical drag on tree canopy root-anchors.'
      }
    ],
    defaultAdvisory: 'Monitor slope piezometers and culvert cascades along arterial ghat transport corridors.',
    criticalAdvisory: 'CRITICAL EVACUATION PROTOCOL: Immediate halt to hillside tea estate operations; evacuate precariously perched settlements.'
  },

  cloudburst: {
    hazardType: 'cloudburst',
    hazardName: 'Orographic Cloudburst & Flash Surge',
    rules: [
      {
        metricKey: 'humidity_percent',
        label: 'Atmospheric Saturation',
        unit: '%',
        criticalThreshold: 85,
        warningThreshold: 78,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Provides boundless latent heat and precipitable water for severe orographic convection.'
      },
      {
        metricKey: 'windGusts_kmh',
        label: 'Convective Wind Gusts',
        unit: 'km/h',
        criticalThreshold: 35,
        warningThreshold: 25,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Indicates strong orographic updraft shear funneling moisture into high-altitude mountain amphitheaters.'
      },
      {
        metricKey: 'rainCurrent_mm',
        label: 'Instantaneous Rain Rate',
        unit: 'mm/h',
        criticalThreshold: 15,
        warningThreshold: 6,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Exceeds mountain valley surface infiltration capacity, generating instantaneous torrent surges.'
      },
      {
        metricKey: 'rain24h_mm',
        label: '24h Inflow Accumulation',
        unit: 'mm',
        criticalThreshold: 75,
        warningThreshold: 50,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Catchment riverbanks saturated; subsequent showers trigger immediate violent flash floods.'
      }
    ],
    defaultAdvisory: 'Maintain Doppler radar telemetry vigilance for sudden convective cloud tops.',
    criticalAdvisory: 'IMMEDIATE SIREN EVACUATION: Sound river corridor alarm sirens, clear all riverside camping and pilgrimage paths.'
  },

  flood: {
    hazardType: 'flood',
    hazardName: 'Hydrological River & Urban Inundation',
    rules: [
      {
        metricKey: 'humidity_percent',
        label: 'Relative Humidity',
        unit: '%',
        criticalThreshold: 85,
        warningThreshold: 78,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Persistent cloud cover and air saturation maintain active watershed runoff.'
      },
      {
        metricKey: 'rain24h_mm',
        label: '24h Rainfall Sum',
        unit: 'mm',
        criticalThreshold: 70,
        warningThreshold: 45,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Exceeds urban stormwater channel discharge capacity and triggers reservoir surplus outflows.'
      },
      {
        metricKey: 'soilMoisture_percent',
        label: 'Ground Saturation',
        unit: '%',
        criticalThreshold: 85,
        warningThreshold: 72,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Zero absorption in riparian floodplains directs 100% of precipitable volume directly into river stage.'
      },
      {
        metricKey: 'rainCurrent_mm',
        label: 'Hourly Rain Intensity',
        unit: 'mm/h',
        criticalThreshold: 12,
        warningThreshold: 5,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Overwhelms gravity drainage canal sluices during high sea tide windows.'
      }
    ],
    defaultAdvisory: 'Keep municipal pump stations on hot standby and inspect primary discharge sluices.',
    criticalAdvisory: 'INUNDATION CONTINGENCY: Activate storm dewatering pumps, sound levee breach warnings, open flood shelters.'
  },

  cyclone: {
    hazardType: 'cyclone',
    hazardName: 'Tropical Cyclone & Coastal Storm Surge',
    rules: [
      {
        metricKey: 'windSpeed_kmh',
        label: 'Sustained Wind Speed',
        unit: 'km/h',
        criticalThreshold: 45,
        warningThreshold: 30,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'IMD Gale Force criteria: rips unanchored tin roofs and uproots vulnerable tree species.'
      },
      {
        metricKey: 'windGusts_kmh',
        label: 'Peak Cyclonic Gusts',
        unit: 'km/h',
        criticalThreshold: 60,
        warningThreshold: 45,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Severe structural load damage threshold for telecommunication towers and power lines.'
      },
      {
        metricKey: 'surfacePressure_hpa',
        label: 'Barometric Pressure',
        unit: 'hPa',
        criticalThreshold: 998,
        warningThreshold: 1004,
        condition: 'LESS_THAN_OR_EQUAL',
        rationale: 'Deep cyclonic depression center driving destructive maritime storm surge onto low-lying coasts.'
      },
      {
        metricKey: 'humidity_percent',
        label: 'Maritime Air Saturation',
        unit: '%',
        criticalThreshold: 88,
        warningThreshold: 80,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Sustained tropical cyclone eyewall convection fed by warm maritime moisture.'
      }
    ],
    defaultAdvisory: 'Enforce sea-entry warnings for non-mechanized fishing craft; verify emergency gensets.',
    criticalAdvisory: 'COASTAL DEFENSE LOCKDOWN: Enforce total maritime ban; transfer vulnerable coastal settlements into concrete shelters.'
  },

  earthquake: {
    hazardType: 'earthquake',
    hazardName: 'Seismotectonic Slip & Aftershock Hazard',
    rules: [
      {
        metricKey: 'rain24h_mm',
        label: 'Rainfall Infiltration Load',
        unit: 'mm',
        criticalThreshold: 50,
        warningThreshold: 25,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Rainwater infiltration lubricates active Himalayan fault scarps and triggers compound coseismic rockslides.'
      },
      {
        metricKey: 'windGusts_kmh',
        label: 'High-Altitude Wind Force',
        unit: 'km/h',
        criticalThreshold: 45,
        warningThreshold: 30,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Severe wind complicates emergency search-and-rescue helicopter sorties in high Himalayan passes.'
      }
    ],
    defaultAdvisory: 'Maintain real-time broadband seismograph mesh telemetry and emergency bridge inspection schedules.',
    criticalAdvisory: 'POST-SEISMIC WARNING: Inspect compromised structural masonry; prohibit transit through narrow fracture gorges.'
  },

  extreme_rainfall: {
    hazardType: 'extreme_rainfall',
    hazardName: 'Extreme Torrential Monsoonal Rainfall',
    rules: [
      {
        metricKey: 'rain24h_mm',
        label: '24-Hour Rainfall Rate',
        unit: 'mm',
        criticalThreshold: 75,
        warningThreshold: 45,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'IMD Heavy-to-Very-Heavy precipitation classification criteria.'
      },
      {
        metricKey: 'humidity_percent',
        label: 'Relative Humidity',
        unit: '%',
        criticalThreshold: 85,
        warningThreshold: 78,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Total atmospheric moisture saturation sustains non-stop rainbands.'
      }
    ],
    defaultAdvisory: 'Preposition civic response machinery at historical waterlogging bottlenecks.',
    criticalAdvisory: 'RED RAINFALL ALERT: Suspend non-essential transit; activate regional multi-hazard crisis command.'
  },

  heat_wave: {
    hazardType: 'heat_wave',
    hazardName: 'Severe Thermal Heat Wave',
    rules: [
      {
        metricKey: 'temperature_c',
        label: 'Ambient Air Temperature',
        unit: '°C',
        criticalThreshold: 41,
        warningThreshold: 38,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'IMD Severe Heat Wave threshold for plains and urban micro-heat islands.'
      },
      {
        metricKey: 'humidity_percent',
        label: 'Heat Index Humidity Factor',
        unit: '%',
        criticalThreshold: 65,
        warningThreshold: 55,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'High humidity combined with elevated ambient temperature creates lethal wet-bulb conditions.'
      }
    ],
    defaultAdvisory: 'Advise citizens to limit strenuous outdoor labor between 11:00 AM and 4:00 PM.',
    criticalAdvisory: 'MEDICAL EMERGENCY: Open public cooling centers; deploy emergency hydration tankers across dense settlements.'
  },

  drought: {
    hazardType: 'drought',
    hazardName: 'Agricultural & Meteorological Drought',
    rules: [
      {
        metricKey: 'humidity_percent',
        label: 'Air Humidity',
        unit: '%',
        criticalThreshold: 25,
        warningThreshold: 35,
        condition: 'LESS_THAN_OR_EQUAL',
        rationale: 'Critically dry air accelerates soil desiccation and reservoir evaporation.'
      },
      {
        metricKey: 'soilMoisture_percent',
        label: 'Root Zone Moisture',
        unit: '%',
        criticalThreshold: 20,
        warningThreshold: 30,
        condition: 'LESS_THAN_OR_EQUAL',
        rationale: 'Below permanent wilting point for staple agricultural crops.'
      }
    ],
    defaultAdvisory: 'Schedule rotational canal irrigation releases to conserve multi-purpose reservoir storage.',
    criticalAdvisory: 'DROUGHT ALERT: Enforce emergency agricultural water preservation and fodder relief depots.'
  },

  forest_fire: {
    hazardType: 'forest_fire',
    hazardName: 'Forest Wildfire Spread Risk',
    rules: [
      {
        metricKey: 'temperature_c',
        label: 'Ambient Air Temperature',
        unit: '°C',
        criticalThreshold: 38,
        warningThreshold: 34,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Extreme heat rapidly dries forest floor combustible leaf-litter fuel beds.'
      },
      {
        metricKey: 'humidity_percent',
        label: 'Relative Humidity',
        unit: '%',
        criticalThreshold: 30,
        warningThreshold: 40,
        condition: 'LESS_THAN_OR_EQUAL',
        rationale: 'Low relative humidity allows sparks and fire brands to ignite instantaneously.'
      },
      {
        metricKey: 'windSpeed_kmh',
        label: 'Fire Spreading Wind',
        unit: 'km/h',
        criticalThreshold: 30,
        warningThreshold: 20,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'High wind vectors rapidly propagate crown fires across ridge lines.'
      }
    ],
    defaultAdvisory: 'Clear forest firelines and activate thermal satellite infrared hotspot surveillance.',
    criticalAdvisory: 'WILDFIRE RAPID CONTAGION: Deploy air-dropped retardant sorties; evacuate forest fringe tribal hamlets.'
  },

  coastal_hazard: {
    hazardType: 'coastal_hazard',
    hazardName: 'Coastal Incursion & High Swell',
    rules: [
      {
        metricKey: 'windSpeed_kmh',
        label: 'Onshore Wind Speed',
        unit: 'km/h',
        criticalThreshold: 40,
        warningThreshold: 28,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Drives severe high swell waves and coastal littoral erosion.'
      },
      {
        metricKey: 'humidity_percent',
        label: 'Maritime Moisture Load',
        unit: '%',
        criticalThreshold: 85,
        warningThreshold: 75,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Dense maritime spray degrading coastal electrical installations.'
      }
    ],
    defaultAdvisory: 'Position emergency sandbag revetments along vulnerable beach road washouts.',
    criticalAdvisory: 'HIGH SURF EMERGENCY: Bar tourist promenade access; secure fishing boat beach moorings.'
  },

  severe_storm: {
    hazardType: 'severe_storm',
    hazardName: 'Severe Convective Thunderstorm & Squall',
    rules: [
      {
        metricKey: 'windGusts_kmh',
        label: 'Squall Line Peak Gusts',
        unit: 'km/h',
        criticalThreshold: 55,
        warningThreshold: 38,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Destructive downburst wind vectors capable of snapping high-tension lines.'
      },
      {
        metricKey: 'rainCurrent_mm',
        label: 'Torrential Precipitation Burst',
        unit: 'mm/h',
        criticalThreshold: 18,
        warningThreshold: 8,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Causes instant flash waterlogging and zero road visibility.'
      },
      {
        metricKey: 'humidity_percent',
        label: 'Moisture Saturation',
        unit: '%',
        criticalThreshold: 85,
        warningThreshold: 75,
        condition: 'GREATER_THAN_OR_EQUAL',
        rationale: 'Deep convective atmospheric column supporting severe microbursts.'
      }
    ],
    defaultAdvisory: 'Broadcast lightning safety announcements; shelter in lightning-grounded permanent buildings.',
    criticalAdvisory: 'SQUALL PROTOCOL: Ground aviation departures; disconnect vulnerable outdoor electrical substations.'
  }
};

/**
 * Evaluates weather metrics against verified risk safety thresholds.
 */
export function evaluateWeatherSafetyThresholds(params: {
  zone: RiskZone;
  metrics: {
    humidity_percent?: number;
    temperature_c?: number;
    windSpeed_kmh?: number;
    windGusts_kmh?: number;
    rainCurrent_mm?: number;
    rain24h_mm?: number;
    soilMoisture_percent?: number;
    surfacePressure_hpa?: number;
    dewPoint_c?: number;
  };
}): SafetyEvaluationResult {
  const { zone, metrics } = params;
  const hazardType = zone.hazardType || 'landslide';
  const config = HAZARD_SAFETY_THRESHOLDS[hazardType] || HAZARD_SAFETY_THRESHOLDS.landslide;

  const breaches: BreachedMetric[] = [];

  // Computed metric: dewPointDepression (T - Td)
  const temp = metrics.temperature_c ?? zone.currentConditions.temperature_c ?? 25;
  const dewPoint = metrics.dewPoint_c ?? (temp - 2.5);
  const dewPointDepression = Number((temp - dewPoint).toFixed(1));

  const resolvedMetrics: Record<string, number> = {
    humidity_percent: metrics.humidity_percent ?? 75,
    temperature_c: metrics.temperature_c ?? zone.currentConditions.temperature_c ?? 25,
    windSpeed_kmh: metrics.windSpeed_kmh ?? zone.currentConditions.windSpeed_kmh ?? 15,
    windGusts_kmh: metrics.windGusts_kmh ?? (metrics.windSpeed_kmh ? metrics.windSpeed_kmh * 1.5 : 25),
    rainCurrent_mm: metrics.rainCurrent_mm ?? 0,
    rain24h_mm: metrics.rain24h_mm ?? zone.currentConditions.rainfall24h_mm ?? 30,
    soilMoisture_percent: metrics.soilMoisture_percent ?? zone.currentConditions.soilMoisture_percent ?? 60,
    surfacePressure_hpa: metrics.surfacePressure_hpa ?? 1008,
    dewPointDepression_c: dewPointDepression
  };

  for (const rule of config.rules) {
    const val = resolvedMetrics[rule.metricKey];
    if (val === undefined || isNaN(val)) continue;

    let isCritical = false;
    let isWarning = false;
    let thresholdApplied = rule.criticalThreshold;

    if (rule.condition === 'GREATER_THAN_OR_EQUAL') {
      if (val >= rule.criticalThreshold) {
        isCritical = true;
        thresholdApplied = rule.criticalThreshold;
      } else if (rule.warningThreshold !== undefined && val >= rule.warningThreshold) {
        isWarning = true;
        thresholdApplied = rule.warningThreshold;
      }
    } else if (rule.condition === 'LESS_THAN_OR_EQUAL') {
      if (val <= rule.criticalThreshold) {
        isCritical = true;
        thresholdApplied = rule.criticalThreshold;
      } else if (rule.warningThreshold !== undefined && val <= rule.warningThreshold) {
        isWarning = true;
        thresholdApplied = rule.warningThreshold;
      }
    }

    if (isCritical || isWarning) {
      const diff = Number(Math.abs(val - thresholdApplied).toFixed(1));
      const formattedDiff = rule.condition === 'GREATER_THAN_OR_EQUAL'
        ? `+${diff} ${rule.unit} above threshold`
        : `-${diff} ${rule.unit} below threshold`;

      breaches.push({
        metricKey: rule.metricKey,
        label: rule.label,
        currentValue: val,
        thresholdValue: thresholdApplied,
        unit: rule.unit,
        severity: isCritical ? 'CRITICAL' : 'WARNING',
        difference: diff,
        formattedDifference: formattedDiff,
        rationale: rule.rationale
      });
    }
  }

  // Also check if zone itself has RED risk status with elevated rainfall
  if (zone.currentRisk === 'RED' && resolvedMetrics.rain24h_mm > 60 && !breaches.some(b => b.metricKey === 'rain24h_mm')) {
    breaches.push({
      metricKey: 'rain24h_mm',
      label: 'Zone Sovereign Inflow Limit',
      currentValue: resolvedMetrics.rain24h_mm,
      thresholdValue: 60,
      unit: 'mm',
      severity: 'CRITICAL',
      difference: Number((resolvedMetrics.rain24h_mm - 60).toFixed(1)),
      formattedDifference: `+${(resolvedMetrics.rain24h_mm - 60).toFixed(1)} mm above zone baseline limit`,
      rationale: 'Active RED risk tier zone exceeding baseline 24h stability tolerance.'
    });
  }

  const hasCritical = breaches.some(b => b.severity === 'CRITICAL');
  const hasWarning = breaches.some(b => b.severity === 'WARNING');

  const status: 'CRITICAL' | 'WARNING' | 'NORMAL' = hasCritical
    ? 'CRITICAL'
    : hasWarning
    ? 'WARNING'
    : 'NORMAL';

  let primaryBreachText = 'All monitored meteorological metrics are within sovereign safety thresholds.';
  if (breaches.length > 0) {
    const criticalBreaches = breaches.filter(b => b.severity === 'CRITICAL');
    const primary = criticalBreaches[0] || breaches[0];
    primaryBreachText = `${primary.label} reached ${primary.currentValue}${primary.unit} (Safety Limit: ${primary.thresholdValue}${primary.unit})`;
    if (breaches.length > 1) {
      primaryBreachText += ` and ${breaches.length - 1} other metric${breaches.length > 2 ? 's' : ''} breached`;
    }
  }

  const advisory = hasCritical ? config.criticalAdvisory : (hasWarning ? config.defaultAdvisory : 'Continuous automated telemetry active. No emergency triggers observed.');

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    hazardType,
    status,
    isCritical: hasCritical,
    isBreached: breaches.length > 0,
    breaches,
    highestSeverity: status,
    primaryBreachText,
    advisory,
    evaluatedAt: new Date().toISOString()
  };
}
