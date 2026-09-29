import React, { useState } from 'react';
import { Download, CheckCircle, Terminal, FileCode, ShieldCheck, X } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloadStarted(true);
    // Direct link to the generated zip endpoint
    window.location.href = '/api/download-zip';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Download Complete SIH Project Package</h3>
            <p className="text-xs text-slate-500">File: <code className="text-emerald-700 font-mono">ResQ-GIS-SIH-READY.zip</code></p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            This package contains the entire production codebase prepared for Smart India Hackathon jury review:
          </p>

          <ul className="space-y-1.5 list-disc list-inside text-slate-600">
            <li><strong>Frontend & Fullstack:</strong> React 18, Vite, Tailwind CSS, Leaflet GIS engine, Express API</li>
            <li><strong>Python Alternative Backend:</strong> Flask REST API with PyTorch CNN & LSTM architecture simulations</li>
            <li><strong>Geospatial Bounds:</strong> Ray-casting Point-in-Polygon (PIP) engine strictly restricted to sovereign India</li>
            <li><strong>Historical Datasets:</strong> 25 years of verified GSI, CWC, and IMD records + SDMA shelter directories</li>
            <li><strong>Complete Scientific Docs:</strong> Data Sources, Risk Methodology, ML Benchmarks, and SIH Demo Guide in <code className="text-slate-800">/docs</code></li>
          </ul>
        </div>

        {/* Quick Run Commands */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span>Local Startup Commands (Windows / Linux / macOS)</span>
          </div>
          <pre className="font-mono text-[11px] text-slate-800 overflow-x-auto p-2 bg-white rounded border border-slate-200">
{`# 1. Extract ZIP and navigate to directory
unzip ResQ-GIS-SIH-READY.zip -d resq-gis
cd resq-gis

# 2. Install dependencies & launch application
npm install
npm run dev

# Open browser at: http://localhost:3000`}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloadStarted ? 'Downloading ZIP Archive...' : 'Download ResQ-GIS-SIH-READY.zip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
