import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RiskZone, HistoricalEvent, AlertItem, CitizenHazardReport } from '../types';

/**
 * PDF Export Utility for ResQ-GIS India Multi-Hazard Disaster Decision Support System
 */

// Format IST Date
function formatIST(isoDate?: string): string {
  if (!isoDate) return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
  try {
    return new Date(isoDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
  } catch {
    return isoDate;
  }
}

/**
 * Export a formatted PDF dossier for a Risk Zone or AI Risk Analysis
 */
export function exportRiskAnalysisPDF(
  zone: RiskZone,
  extraNotes?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ResQ-GIS: Sovereign Multi-Hazard Risk Dossier', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('National Disaster Early Warning & Evacuation Decision Support', 14, 21);
  doc.text(`Generated on: ${formatIST()} | Classification: Official Emergency Operation`, 14, 26);

  // Status Badge in Header
  const riskColor = zone.currentRisk === 'RED' ? [225, 29, 72] : zone.currentRisk === 'ORANGE' ? [217, 119, 6] : [202, 138, 4];
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.roundedRect(pageWidth - 58, 10, 44, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(zone.currentRisk, pageWidth - 36, 17, { align: 'center' });
  doc.setFontSize(7);
  doc.text(`SCORE: ${zone.currentScore}/100`, pageWidth - 36, 22, { align: 'center' });

  // Zone Identification Table
  autoTable(doc, {
    startY: 44,
    theme: 'grid',
    head: [['Attribute', 'Spatial & Environmental Specifications']],
    body: [
      ['Target Corridor', zone.name],
      ['Administrative Jurisdiction', `${zone.district}, ${zone.state} (Republic of India)`],
      ['Centroid Coordinates', `${zone.coordinates[0].toFixed(4)}°N, ${zone.coordinates[1].toFixed(4)}°E`],
      ['Primary Hazard Category', zone.hazardType.toUpperCase()],
      ['Current Activated Severity', `${zone.currentRisk} (Score: ${zone.currentScore}/100)`],
      ['Baseline Susceptibility (25yr)', `${zone.historicalSusceptibility} (Score: ${zone.historicalScore}/100)`],
      ['Physical Elevation & Slope', `${zone.currentConditions.elevation_m}m AMSL | ${zone.currentConditions.slope_deg}° Gradient`],
      ['Live Weather Telemetry', `24h Rain: ${zone.currentConditions.rainfall24h_mm}mm | 3d Rain: ${zone.currentConditions.rainfall3d_mm}mm | Soil Moisture: ${zone.currentConditions.soilMoisture_percent}%`]
    ],
    headStyles: { fillColor: [30, 41, 59], textColor: [248, 250, 252], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: [51, 65, 85] },
      1: { textColor: [15, 23, 42] }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // Population At Risk Breakdown
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Demographic Exposure & Population-at-Risk Assessment', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    theme: 'striped',
    head: [['Risk Sector', 'Exposed Inhabitants', 'Evacuation Priority', 'Demographic Source']],
    body: [
      ['Total Footprint Exposure', zone.populationExposed.total.toLocaleString(), 'Combined Zone', 'Census of India + WorldPop 1km²'],
      ['Red Zone (Immediate)', zone.populationExposed.red.toLocaleString(), 'Priority 1 - Immediate Evacuation', 'Critical Hazard Runout Envelope'],
      ['Orange Zone (Watch Buffer)', zone.populationExposed.orange.toLocaleString(), 'Priority 2 - Standby & Staged Evacuation', 'Secondary Inundation Corridor'],
      ['Yellow Zone (Advisory)', zone.populationExposed.yellow.toLocaleString(), 'Priority 3 - Caution & Readiness', 'Peripheral Catchment Basin']
    ],
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2.5 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Causal AI Inference & Physics Evidence
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Diagnostic Physics Evidence & Action Directives', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    theme: 'plain',
    body: [
      ['Causal Factor Analysis:', zone.aiExplanation],
      ['Recommended Civil Defense Action:', zone.recommendedAction],
      ['Historical Evidence Record:', `${zone.historicalEvidence.totalEventsRecorded} recorded occurrences in inventory. Latest: ${zone.historicalEvidence.latestEventDate} - ${zone.historicalEvidence.latestEventDescription}`]
    ],
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: [15, 23, 42] },
      1: { cellWidth: pageWidth - 75 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Data Provenance & Methodological Attribution
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Data Provenance & Scientific Attribution:', 14, currentY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const provText = `Primary Source: ${zone.provenance.source} | Dataset: ${zone.provenance.datasetName}\nMethodology: ${zone.provenance.processingMethod}\nOfficial Portal: ${zone.provenance.url} | Observation Date: ${zone.provenance.observationDate}`;
  doc.text(provText, 14, currentY + 5);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, footerY - 3, pageWidth - 14, footerY - 3);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('ResQ-GIS Decision Support • Strictly Constrained within Sovereign Territory of India • NDMA Guidelines Compliant', 14, footerY);

  // Download trigger
  const filename = `ResQ-GIS_RiskDossier_${zone.district}_${zone.hazardType}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export a formatted PDF document for a Historical Disaster Event
 */
export function exportHistoricalEventPDF(event: HistoricalEvent): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ResQ-GIS: Verified Historical Disaster Dossier', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('National Multi-Hazard Historical Inventory & Recovery Retrospective', 14, 21);
  doc.text(`Generated on: ${formatIST()} | Records 1999–2024 Verified`, 14, 26);

  // Event Severity Badge
  const badgeColor = event.severity === 'RED' ? [225, 29, 72] : event.severity === 'ORANGE' ? [217, 119, 6] : [202, 138, 4];
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(pageWidth - 58, 10, 44, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(event.severity, pageWidth - 36, 17, { align: 'center' });
  doc.setFontSize(7);
  doc.text(event.date, pageWidth - 36, 22, { align: 'center' });

  // Event Specifics Table
  autoTable(doc, {
    startY: 44,
    theme: 'grid',
    head: [['Event Metric', 'Official Documented Historical Record']],
    body: [
      ['Event Title', event.title],
      ['Occurrence Date', event.date],
      ['Hazard Classification', event.hazard.toUpperCase()],
      ['Geographic Location', `${event.location}, ${event.district}, ${event.state}`],
      ['Epicenter Coordinates', `${event.latitude.toFixed(4)}°N, ${event.longitude.toFixed(4)}°E (India)`],
      ['Fatalities Recorded', event.fatalities ? event.fatalities.toLocaleString() : 'Undetermined'],
      ['Displaced Population', event.displaced ? event.displaced.toLocaleString() : 'N/A'],
      ['Economic Loss Estimate', event.economicImpact_inr_cr ? `₹${event.economicImpact_inr_cr.toLocaleString()} Crores` : 'N/A'],
      ['Meteorological / Physical Trigger', event.rainfallRecord_mm ? `${event.rainfallRecord_mm} mm extreme rainfall` : event.magnitude ? `M${event.magnitude} Richter Magnitude` : event.cycloneCategory || 'Severe atmospheric or tectonic perturbation']
    ],
    headStyles: { fillColor: [30, 41, 59], textColor: [248, 250, 252], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: [51, 65, 85] },
      1: { textColor: [15, 23, 42] }
    }
  });

  const currentY = (doc as any).lastAutoTable.finalY + 8;

  // Narrative Description & Provenance
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Detailed Disaster Account & Investigation', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    theme: 'plain',
    body: [
      ['Incident Summary:', event.description],
      ['Data Source Citation:', event.source],
      ['Official Validation Portal:', event.sourceUrl || 'NDMA / GSI Archive']
    ],
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: [15, 23, 42] },
      1: { cellWidth: pageWidth - 65 }
    }
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, footerY - 3, pageWidth - 14, footerY - 3);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('ResQ-GIS Verified Historical Disaster Archive • Official India Decision Support Documentation', 14, footerY);

  const filename = `ResQ-GIS_Historical_${event.hazard}_${event.date.replace(/[^0-9]/g, '-')}.pdf`;
  doc.save(filename);
}

/**
 * Export Emergency Operations Center (EOC) Active Alerts Bulletin
 */
export function exportAlertsSummaryPDF(
  alerts: AlertItem[],
  filterContext?: { hazard?: string; severity?: string; minRisk?: number }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(225, 29, 72); // rose-600
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('EMERGENCY OPERATIONS CENTER (EOC) BULLETIN', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Active Alert Summary • Issue Date: ${formatIST()}`, 14, 22);

  const filterStr = filterContext
    ? `Filters: ${filterContext.hazard || 'All Hazards'} | Severity: ${filterContext.severity || 'All'} | Min Score: ${filterContext.minRisk || 0}`
    : 'All Active Real-Time Warnings';
  doc.text(filterStr, 14, 28);

  const alertRows = alerts.map((a, i) => [
    `${i + 1}`,
    a.severity,
    a.hazard.toUpperCase(),
    `${a.location}\n(${a.district}, ${a.state})`,
    `${a.riskScore}/100`,
    a.populationAtRisk ? `${(a.populationAtRisk / 1000).toFixed(1)}k` : 'N/A',
    a.recommendedAction
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['#', 'Level', 'Hazard', 'Location & District', 'Score', 'Pop.', 'Mandated Action Directive']],
    body: alertRows,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 16, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 42 },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 'auto' }
    }
  });

  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Automated Early Warning Bulletin • ResQ-GIS India • Field Response Document', 14, footerY);

  doc.save(`ResQ-GIS_ActiveAlerts_Bulletin_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export Citizen Report Receipt
 */
export function exportCitizenReportPDF(report: CitizenHazardReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Citizen Hazard Observation Docket', 14, 15);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Official Receipt ID: ${report.id} • Submitted: ${formatIST(report.reportedAt)}`, 14, 22);

  autoTable(doc, {
    startY: 38,
    theme: 'grid',
    head: [['Field', 'Observation Details']],
    body: [
      ['Incident Tracking ID', report.id],
      ['Hazard Category', report.hazardType.toUpperCase()],
      ['Assigned Severity', report.severity],
      ['Location Name', report.locationName],
      ['District & State', `${report.district}, ${report.state}`],
      ['Coordinates', `${report.latitude.toFixed(4)}°N, ${report.longitude.toFixed(4)}°E`],
      ['Reporter Name', report.reporterName],
      ['Contact Info', report.reporterContact || 'Not provided'],
      ['Verification Status', report.status],
      ['Citizen Observation Text', report.description],
      ['Official Admin Verification Notes', report.adminNotes || 'Under review by District Control Room']
    ],
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [51, 65, 85] }
    }
  });

  doc.save(`ResQ-GIS_IncidentReceipt_${report.id}.pdf`);
}

/**
 * Export Demographic Exposure & Population-at-Risk Assessment PDF
 */
export function exportDemographicAssessmentPDF(
  zonesData: Array<{
    name: string;
    state: string;
    district: string;
    hazardType: string;
    severity: string;
    areaSqKm: number;
    densityPerSqKm: number;
    totalExposed: number;
    red: number;
    orange: number;
    yellow: number;
    classification?: string;
  }>,
  aggregates: {
    totalExposed: number;
    redExposed: number;
    orangeExposed: number;
    yellowExposed: number;
    totalAreaSqKm: number;
  }
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ResQ-GIS: Demographic Exposure & Population-at-Risk Assessment', 14, 13);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Official Demographic Assessment • Generated: ${formatIST()} • Census of India & WorldPop 1km² Calibrated`, 14, 21);

  // Summary Metrics Bar
  autoTable(doc, {
    startY: 34,
    theme: 'plain',
    head: [['TOTAL EXPOSED POPULATION', 'RED ZONE (IMMEDIATE EVAC)', 'ORANGE ZONE (HIGH WATCH)', 'YELLOW ZONE (ADVISORY)', 'TOTAL FOOTPRINT AREA']],
    body: [
      [
        `${(aggregates.totalExposed / 1000).toFixed(1)}k (${aggregates.totalExposed.toLocaleString()})`,
        `${(aggregates.redExposed / 1000).toFixed(1)}k (${aggregates.redExposed.toLocaleString()})`,
        `${(aggregates.orangeExposed / 1000).toFixed(1)}k (${aggregates.orangeExposed.toLocaleString()})`,
        `${(aggregates.yellowExposed / 1000).toFixed(1)}k (${aggregates.yellowExposed.toLocaleString()})`,
        `${aggregates.totalAreaSqKm.toFixed(0)} km²`
      ]
    ],
    headStyles: { fillColor: [30, 41, 59], textColor: [203, 213, 225], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fillColor: [241, 245, 249], fontStyle: 'bold', fontSize: 9, textColor: [15, 23, 42] },
    styles: { cellPadding: 3, halign: 'center' }
  });

  // Detailed Zone Breakdown Table
  const tableRows = zonesData.map(z => [
    `${z.name} (${z.district}, ${z.state})`,
    z.hazardType.toUpperCase(),
    z.severity,
    `${z.areaSqKm} km²`,
    `${z.densityPerSqKm}/km²`,
    z.red.toLocaleString(),
    z.orange.toLocaleString(),
    z.yellow.toLocaleString(),
    z.totalExposed.toLocaleString(),
    z.classification || 'Regional'
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    theme: 'striped',
    head: [[
      'Risk Zone & Location',
      'Hazard',
      'Level',
      'Area (km²)',
      'Census Density',
      'Red (Evac)',
      'Orange (Watch)',
      'Yellow (Adv)',
      'Total Exposed',
      'Terrain Classification'
    ]],
    body: tableRows,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      5: { textColor: [225, 29, 72], fontStyle: 'bold' },
      6: { textColor: [217, 119, 6], fontStyle: 'bold' },
      8: { fontStyle: 'bold', textColor: [15, 23, 42] }
    }
  });

  // Methodology and Footer
  const footerY = (doc as any).lastAutoTable.finalY + 8;
  if (footerY < doc.internal.pageSize.getHeight() - 15) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Methodology Note: Population values reflect spatial raster-vector zonal intersection of 1km² WorldPop demographic grids constrained by 30m DEM slope/elevation runout footprints.', 14, footerY);
    doc.text('ResQ-GIS Sovereign Decision Support System • Government of India and State Disaster Management Authorities (SDMAs)', 14, footerY + 5);
  }

  doc.save(`ResQ-GIS_Demographic_Exposure_${new Date().toISOString().split('T')[0]}.pdf`);
}

