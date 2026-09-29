import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Navigation, Phone, CheckCircle, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import { RelocationSite, RiskZone } from '../types';
import { VERIFIED_RELOCATION_SITES } from '../data/verifiedData';
import { realtimeClient } from '../services/realtimeClient';

interface RelocationSheltersPageProps {
  riskZones: RiskZone[];
}

export const RelocationSheltersPage: React.FC<RelocationSheltersPageProps> = ({ riskZones }) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(riskZones[0]?.id || '');
  const [customLat, setCustomLat] = useState<string>('11.5173');
  const [customLon, setCustomLon] = useState<string>('76.1368');
  const [useCustomLocation, setUseCustomLocation] = useState<boolean>(false);
  const [sheltersList, setSheltersList] = useState<RelocationSite[]>(VERIFIED_RELOCATION_SITES);
  const [nearestShelters, setNearestShelters] = useState<RelocationSite[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeZone = riskZones.find(z => z.id === selectedZoneId) || riskZones[0];
  const targetLat = useCustomLocation ? parseFloat(customLat) || 11.5173 : activeZone?.coordinates[0] || 11.5173;
  const targetLon = useCustomLocation ? parseFloat(customLon) || 76.1368 : activeZone?.coordinates[1] || 76.1368;

  const fetchLiveShelters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/relocation/nearest?lat=${targetLat}&lon=${targetLon}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        if (data.shelters && data.shelters.length > 0) {
          setNearestShelters(data.shelters.slice(0, 3));
          setSheltersList(data.shelters);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live shelters from database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveShelters();
  }, [targetLat, targetLon]);

  useEffect(() => {
    const unsub = realtimeClient.on('shelter', () => {
      fetchLiveShelters();
    });
    return () => unsub();
  }, [targetLat, targetLon]);

  const nearestThree = nearestShelters.length > 0 ? nearestShelters : sheltersList.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-emerald-600" />
          Emergency Relocation & Verified Evacuation Centres
        </h1>
        <p className="text-xs text-slate-500">
          Geospatial Haversine routing to SDMA-registered cyclone shelters, flood relief camps, and community safe havens
        </p>
      </div>

      {/* Target Hazard Zone Selector */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Route From Disaster Location:</span>
            <select
              value={useCustomLocation ? 'custom' : selectedZoneId}
              onChange={e => {
                if (e.target.value === 'custom') {
                  setUseCustomLocation(true);
                } else {
                  setUseCustomLocation(false);
                  setSelectedZoneId(e.target.value);
                }
              }}
              className="bg-slate-50 border border-slate-300 text-slate-800 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {riskZones.map(z => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.state}) — {z.hazardType.toUpperCase()}
                </option>
              ))}
              <option value="custom">+ Enter Custom Coordinates in India</option>
            </select>
          </div>

          {useCustomLocation && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.0001"
                placeholder="Lat"
                value={customLat}
                onChange={e => setCustomLat(e.target.value)}
                className="w-24 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Lon"
                value={customLon}
                onChange={e => setCustomLon(e.target.value)}
                className="w-24 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Nearest 3 Shelters Feature Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-600" />
            Nearest 3 Verified Shelters (Calculated via Haversine Distance)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Origin: {targetLat.toFixed(4)}°N, {targetLon.toFixed(4)}°E
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nearestThree.map((site: RelocationSite, index: number) => {
            const shelterImg = site.imageUrl || '/images/cyclone_relief_shelter_1790611389117.jpg';
            return (
              <div
                key={site.id}
                className="bg-white border border-slate-200 hover:border-emerald-500/60 rounded-xl transition-all shadow-xs relative overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Shelter Photo Banner */}
                  <div className="relative aspect-16/9 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={shelterImg}
                      alt={site.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-mono font-bold text-[10px] flex items-center justify-center shadow-xs">
                        #{index + 1}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                        {site.distanceKm !== undefined ? `${site.distanceKm} km away` : 'Active Hub'}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded shadow-xs ${
                        site.status === 'READY' || site.status === 'operational'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-400 text-slate-950'
                      }`}>
                        {site.status}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 text-[10px] font-mono text-slate-200 truncate">
                      🏢 Reinforced Multi-Hazard Safe-Haven
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{site.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {site.address}
                      </p>
                    </div>

                    {/* Occupancy and Capacity */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Occupancy: {site.currentOccupancy} / {site.capacity}</span>
                        <span className="font-mono text-slate-700 font-medium">
                          {Math.round((site.currentOccupancy / site.capacity) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (site.currentOccupancy / site.capacity) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Verified Amenities Chips */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">Verified Facilities</span>
                      <div className="flex flex-wrap gap-1">
                        {site.amenities.map((a: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-700 rounded border border-slate-200">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Officer Details */}
                <div className="p-4 pt-0">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
                    <div className="text-slate-600">
                      Officer: <strong className="text-slate-800">{site.contactPerson}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-mono">
                      <Phone className="w-3 h-3" />
                      <span>{site.contactPhone}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-200">
                      Last Inspected: {site.lastInspected || site.lastInspectionDate || 'Verified 2025'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete State Shelter Directory */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900">Full SDMA Emergency Shelter Registry</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Shelter Name</th>
                <th className="p-3">State</th>
                <th className="p-3">Type</th>
                <th className="p-3">Capacity</th>
                <th className="p-3">Occupancy</th>
                <th className="p-3">Status</th>
                <th className="p-3">Officer & Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {VERIFIED_RELOCATION_SITES.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">
                    {s.name}
                    <span className="block text-[10px] text-slate-500 font-normal">{s.address}</span>
                  </td>
                  <td className="p-3">{s.state}</td>
                  <td className="p-3 uppercase text-[10px] font-mono">{s.type.replace('_', ' ')}</td>
                  <td className="p-3 font-mono">{s.capacity}</td>
                  <td className="p-3 font-mono">{s.currentOccupancy}</td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-slate-800 block">{s.contactPerson}</span>
                    <span className="text-emerald-700 font-mono text-[10px]">{s.contactPhone}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
