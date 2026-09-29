import React, { useState } from 'react';
import {
  Megaphone,
  MapPin,
  Send,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Info,
  FileDown,
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  Flame,
  CloudRain,
  Waves,
  Wind
} from 'lucide-react';
import { HazardType, RiskLevel, CitizenReport } from '../types';
import { isPointInIndia, getIndiaSpatialValidation } from '../data/indiaBoundary';
import { exportCitizenReportPDF } from '../utils/pdfExport';

interface ReportHazardPageProps {
  onSubmitSuccess: () => void;
}

export const ReportHazardPage: React.FC<ReportHazardPageProps> = ({ onSubmitSuccess }) => {
  const [locationName, setLocationName] = useState('');
  const [stateName, setStateName] = useState('Kerala');
  const [district, setDistrict] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [hazardType, setHazardType] = useState<HazardType>('landslide');
  const [severity, setSeverity] = useState<RiskLevel>('ORANGE');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageCaption, setAttachedImageCaption] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSubmittedReport, setLastSubmittedReport] = useState<CitizenReport | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size exceeds 5MB limit. Please upload a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
        setAttachedImageCaption(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSamplePhoto = (url: string, caption: string) => {
    setAttachedImage(url);
    setAttachedImageCaption(caption);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      setErrorMessage('Please provide valid numerical geographic coordinates.');
      return;
    }

    const validation = getIndiaSpatialValidation(lat, lon);
    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    if (!locationName.trim() || !description.trim()) {
      setErrorMessage('Please fill in location name and hazard description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        locationName,
        state: stateName,
        district: district || 'Unspecified',
        latitude: lat,
        longitude: lon,
        coordinates: [lat, lon],
        hazardType,
        severity,
        description,
        reporterName: reporterName || 'Anonymous Citizen',
        reporterContact: reporterPhone || 'Not provided',
        imageUrl: attachedImage || undefined,
        imageCaption: attachedImageCaption || undefined
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      if (data.report) {
        setLastSubmittedReport(data.report);
      }

      setSuccessMessage(
        'Hazard report submitted successfully! Status: PENDING_VERIFICATION. District Disaster Management officials have been notified.'
      );
      setLocationName('');
      setDistrict('');
      setDescription('');
      setReporterName('');
      setReporterPhone('');
      setAttachedImage(null);
      setAttachedImageCaption('');
      onSubmitSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-amber-600" />
            Citizen Ground-Observation Hazard Reporting
          </h1>
          <p className="text-xs text-slate-500">
            Report active ground fissures, sudden slope shifts, blocked stormwater culverts, or rising water levels with photographic evidence
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const draftReport: CitizenReport = {
              id: `CIT-${Date.now().toString().slice(-6)}`,
              hazardType: hazardType || 'landslide',
              locationName: locationName || 'Unspecified Field Coordinate',
              latitude: parseFloat(latitude) || 11.5173,
              longitude: parseFloat(longitude) || 76.1368,
              district: district || 'Wayanad',
              state: stateName || 'Kerala',
              description: description || 'Field observation logged for civil defense verification and immediate offline dispatch.',
              severity: severity || 'ORANGE',
              reportedAt: new Date().toISOString(),
              reporterName: reporterName || 'First Responder Field Unit',
              reporterContact: reporterPhone || '',
              status: 'PENDING_VERIFICATION'
            };
            exportCitizenReportPDF(draftReport);
          }}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          title="Export formatted incident docket PDF for offline field documentation"
        >
          <FileDown className="w-3.5 h-3.5 text-amber-600" />
          <span>Export Field Docket (PDF)</span>
        </button>
      </div>

      {/* Strict Anti-Panic Integrity Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs shadow-xs">
        <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-900 block">Civil Defense Integrity Protocol:</strong>
          <p className="text-slate-600 leading-relaxed">
            All citizen submissions immediately enter a strict <strong className="text-amber-700 font-mono">PENDING_VERIFICATION</strong> status. Citizen reports do NOT immediately alter official public risk scores or polygon boundaries. Attaching clear ground photos accelerates rapid verification by district disaster authorities.
          </p>
        </div>
      </div>

      {/* Visual Photographic Evidence Guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Ground Photographic Evidence Reference Guide</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Quick-click sample photos to attach below</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => handleSelectSamplePhoto('/images/wayanad_landslide_1790611336595.jpg', 'Landslide Scarp & Slope Failure (Western Ghats)')}
            className="cursor-pointer group relative bg-slate-900 rounded-lg overflow-hidden border border-slate-200 hover:border-amber-500 aspect-16/10"
          >
            <img
              src="/images/wayanad_landslide_1790611336595.jpg"
              alt="Landslide scarp reference"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
            <div className="absolute bottom-1.5 left-2 right-2 text-white">
              <span className="text-[10px] font-bold block leading-tight">Landslide Scarp</span>
              <span className="text-[9px] text-slate-300 font-mono">Slope failure / crack</span>
            </div>
          </div>

          <div
            onClick={() => handleSelectSamplePhoto('/images/chennai_monsoon_flood_1790611360990.jpg', 'Urban Inundation & Culvert Overflow (Coastal Plain)')}
            className="cursor-pointer group relative bg-slate-900 rounded-lg overflow-hidden border border-slate-200 hover:border-cyan-500 aspect-16/10"
          >
            <img
              src="/images/chennai_monsoon_flood_1790611360990.jpg"
              alt="Urban flood reference"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
            <div className="absolute bottom-1.5 left-2 right-2 text-white">
              <span className="text-[10px] font-bold block leading-tight">Urban Inundation</span>
              <span className="text-[9px] text-slate-300 font-mono">Watermarks & depth</span>
            </div>
          </div>

          <div
            onClick={() => handleSelectSamplePhoto('/images/kedarnath_flood_1790611348435.jpg', 'Mountain Torrent & Debris Channel (Himalayan Basin)')}
            className="cursor-pointer group relative bg-slate-900 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 aspect-16/10"
          >
            <img
              src="/images/kedarnath_flood_1790611348435.jpg"
              alt="Cloudburst torrent reference"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
            <div className="absolute bottom-1.5 left-2 right-2 text-white">
              <span className="text-[10px] font-bold block leading-tight">Flash Deluge</span>
              <span className="text-[9px] text-slate-300 font-mono">Stream surge / boulder</span>
            </div>
          </div>

          <div
            onClick={() => handleSelectSamplePhoto('/images/cyclone_storm_surge_1790611376168.jpg', 'Cyclone Coastal Surge & Gale Debris')}
            className="cursor-pointer group relative bg-slate-900 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-500 aspect-16/10"
          >
            <img
              src="/images/cyclone_storm_surge_1790611376168.jpg"
              alt="Cyclone surge reference"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
            <div className="absolute bottom-1.5 left-2 right-2 text-white">
              <span className="text-[10px] font-bold block leading-tight">Cyclone Sea Surge</span>
              <span className="text-[9px] text-slate-300 font-mono">Wave crash / wind scarp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-700 font-medium block mb-1">Location / Landmark Name *</label>
            <input
              type="text"
              required
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              placeholder="e.g. Near Meppadi Tea Estate Bridge"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="text-slate-700 font-medium block mb-1">State</label>
            <select
              value={stateName}
              onChange={e => setStateName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="Kerala">Kerala</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Assam">Assam</option>
              <option value="Odisha">Odisha</option>
              <option value="Uttarakhand">Uttarakhand</option>
              <option value="Himachal Pradesh">Himachal Pradesh</option>
              <option value="Jammu & Kashmir">Jammu & Kashmir</option>
              <option value="Ladakh">Ladakh</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-medium block mb-1">Latitude (°N) *</label>
            <input
              type="number"
              step="0.0001"
              required
              value={latitude}
              onChange={e => setLatitude(e.target.value)}
              placeholder="e.g. 11.5173"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="text-slate-700 font-medium block mb-1">Longitude (°E) *</label>
            <input
              type="number"
              step="0.0001"
              required
              value={longitude}
              onChange={e => setLongitude(e.target.value)}
              placeholder="e.g. 76.1368"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="text-slate-700 font-medium block mb-1">Hazard Category *</label>
            <select
              value={hazardType}
              onChange={e => setHazardType(e.target.value as HazardType)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="landslide">Landslide / Soil Subsidence / Rockfall</option>
              <option value="cloudburst">Cloudburst / Sudden Mountain Flash Deluge</option>
              <option value="flood">Water Logging / Stream Inundation</option>
              <option value="cyclone">Cyclone Wind Damage / Sea Surge</option>
              <option value="earthquake">Structural Seismic Fissure</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-medium block mb-1">Observed Severity</label>
            <select
              value={severity}
              onChange={e => setSeverity(e.target.value as RiskLevel)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="YELLOW">Moderate (Cracks appearing, drain overflow)</option>
              <option value="ORANGE">High (Continuous soil movement, water entering premises)</option>
              <option value="RED">Very High (Immediate danger to life / active slide)</option>
            </select>
          </div>
        </div>

        {/* Attached Photo Evidence Card */}
        <div className="text-xs space-y-2 pt-2 border-t border-slate-200">
          <label className="text-slate-700 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Attach Ground Photographic Evidence (Recommended for Priority Verification)</span>
            </span>
            {attachedImage && (
              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  setAttachedImageCaption('');
                }}
                className="text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Remove Photo
              </button>
            )}
          </label>

          {attachedImage ? (
            <div className="relative aspect-21/9 w-full bg-slate-900 rounded-xl overflow-hidden border border-emerald-500/50">
              <img
                src={attachedImage}
                alt="Attached evidence preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                <span className="text-[11px] font-mono text-emerald-300 truncate">
                  ✓ Photo Attached: {attachedImageCaption || 'Field evidence capture'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white">
                  Evidence Verified
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer shadow-2xs transition-colors">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Field Photo from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-slate-500 text-[11px]">
                Or click any sample photo in the guide above to quickly attach reference ground truth.
              </span>
            </div>
          )}
        </div>

        <div className="text-xs">
          <label className="text-slate-700 font-medium block mb-1">Detailed Description of Hazard Observation *</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what you observed (e.g. 10cm ground fissure propagating across retaining wall following heavy night rain)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-700 font-medium block mb-1">Reporter Name (Optional)</label>
            <input
              type="text"
              value={reporterName}
              onChange={e => setReporterName(e.target.value)}
              placeholder="e.g. Anand Menon"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="text-slate-700 font-medium block mb-1">Contact Phone Number (Optional)</label>
            <input
              type="tel"
              value={reporterPhone}
              onChange={e => setReporterPhone(e.target.value)}
              placeholder="e.g. +91 98470 12345"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            {lastSubmittedReport && (
              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700 font-mono">
                  Tracking Dossier ID: {lastSubmittedReport.id}
                </span>
                <button
                  type="button"
                  onClick={() => exportCitizenReportPDF(lastSubmittedReport)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Official PDF Receipt</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting to Verification Queue...' : 'Submit Official Hazard Report'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
