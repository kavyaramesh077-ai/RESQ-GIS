import React, { useState } from 'react';
import {
  Shield,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Loader2,
  Building,
  CheckCircle2
} from 'lucide-react';

export interface OfficerSession {
  token: string;
  officer: {
    officerId: string;
    username: string;
    name: string;
    role: string;
    agency: string;
    securityClearance: string;
    loginTime: string;
  };
}

interface AdminLoginPageProps {
  onLoginSuccess: (session: OfficerSession) => void;
  onBackToDashboard?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToDashboard
}) => {
  const [username, setUsername] = useState('admin@resq.gov.in');
  const [password, setPassword] = useState('ResQ-Admin-2025');
  const [role, setRole] = useState('District Disaster Operations Officer (SDMA)');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fillDemoCredentials = (type: 'sdma' | 'ndma' | 'gis') => {
    if (type === 'sdma') {
      setUsername('rajesh.kumar@sdma.kerala.gov.in');
      setPassword('ResQ-Admin-2025');
      setRole('District Disaster Operations Officer (SDMA)');
    } else if (type === 'ndma') {
      setUsername('ananya.sen@ndma.gov.in');
      setPassword('ResQ-Admin-2025');
      setRole('NDMA National Operations Coordinator');
    } else {
      setUsername('gis.analyst@resq.gov.in');
      setPassword('ResQ-Admin-2025');
      setRole('Chief Geospatial & GIS Analyst');
    }
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both your Officer ID / Email and Security Passkey.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      const session: OfficerSession = {
        token: data.token,
        officer: data.officer
      };

      if (rememberMe) {
        localStorage.setItem('resq_admin_session', JSON.stringify(session));
      } else {
        sessionStorage.setItem('resq_admin_session', JSON.stringify(session));
      }

      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-lg space-y-6">
        {/* Return Button */}
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Dashboard</span>
          </button>
        )}

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header & Crest */}
          <div className="space-y-3 text-center sm:text-left border-b border-slate-100 pb-5">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Restricted Access
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">NDMA / SDMA</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                  Disaster Authority Admin Portal
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Authenticate using your official government credentials to review citizen hazard observations, manage evacuation shelters, and audit real-time GIS layers.
            </p>
          </div>

          {/* Quick Demo Credentials Pill Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                Quick Test Credentials (One-Click Auto-Fill)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => fillDemoCredentials('sdma')}
                className="px-2.5 py-1.5 text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors text-left truncate cursor-pointer shadow-2xs"
              >
                SDMA Nodal Officer
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('ndma')}
                className="px-2.5 py-1.5 text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors text-left truncate cursor-pointer shadow-2xs"
              >
                NDMA Coordinator
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('gis')}
                className="px-2.5 py-1.5 text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors text-left truncate cursor-pointer shadow-2xs"
              >
                Chief GIS Analyst
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Officer ID / Email */}
            <div className="space-y-1.5 text-xs">
              <label className="font-medium text-slate-700 block">
                Official Officer ID or Gov Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. admin@resq.gov.in"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pl-9 text-slate-800 focus:outline-none focus:border-emerald-500 placeholder:text-slate-400 font-mono text-xs"
                />
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Officer Role */}
            <div className="space-y-1.5 text-xs">
              <label className="font-medium text-slate-700 block">
                Operational Role & Jurisdiction
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pl-9 text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer text-xs"
                >
                  <option value="District Disaster Operations Officer (SDMA)">
                    District Disaster Operations Officer (SDMA)
                  </option>
                  <option value="NDMA National Operations Coordinator">
                    NDMA National Operations Coordinator
                  </option>
                  <option value="Chief Geospatial & GIS Analyst">
                    Chief Geospatial & GIS Analyst
                  </option>
                  <option value="District Collector / Incident Commander">
                    District Collector / Incident Commander
                  </option>
                </select>
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Security Passkey */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 block">
                  Security Passkey / Password
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Demo: ResQ-Admin-2025</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pl-9 pr-10 text-slate-800 focus:outline-none focus:border-emerald-500 placeholder:text-slate-400 font-mono text-xs"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? 'Hide passkey' : 'Show passkey'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Keep session active on this console</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-medium">Clearance Level-3</span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Security Token...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authenticate & Open Admin Console</span>
                </>
              )}
            </button>
          </form>

          {/* Legal / Civil Defense Advisory */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-normal space-y-1">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Statutory Compliance Notice</span>
            </div>
            <p>
              Access to this console is strictly restricted to designated officers authorized under Section 78 of the Disaster Management Act, 2005. All IP traces, polygon updates, and hazard verification actions are cryptographically logged for audit trail compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
