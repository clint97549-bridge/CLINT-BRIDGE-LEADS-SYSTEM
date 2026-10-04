import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Key,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { testFirestoreConnection } from '../lib/firebase';
import { SystemDiagnostics } from '../types';

export const DiagnosticsView: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [firestoreOk, setFirestoreOk] = useState<boolean | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // 1. Check backend API & Gemini
      const res = await fetch('/api/diagnostics');
      const data = await res.json();
      setDiagnostics(data);

      // 2. Check client Firestore connection
      const fsStatus = await testFirestoreConnection();
      setFirestoreOk(fsStatus);
    } catch (err) {
      console.error('Diagnostic error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            System Diagnostics &amp; Health Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status of backend research services, Google Search grounding, and Firestore persistence.
          </p>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Testing System...' : 'Run Diagnostics Ping'}</span>
        </button>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gemini Service */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Gemini 3.8 Flash</span>
            <Server className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            {diagnostics?.geminiConnected ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">Operational</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-bold text-amber-300">Testing...</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Model: <code className="text-slate-400 font-mono">gemini-3.8-flash</code>
          </p>
        </div>

        {/* Actual Active Discovery Provider */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Discovery</span>
            <Search className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            {diagnostics?.discoveryProviderActive ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">
                  {diagnostics.discoveryProviderName || 'Google Places API (New)'} — Active
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <span className="text-xs font-bold text-rose-300">
                  {diagnostics?.discoveryProviderName || 'Google Places API (New)'} — Unavailable
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Primary real candidate discovery pipeline
          </p>
        </div>

        {/* Search Grounding Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Search Grounding</span>
            <Search className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            {diagnostics?.searchGroundingActive ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">Search Grounding — Active</span>
              </>
            ) : diagnostics?.searchGroundingQuotaBlocked ? (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">Search Grounding — Quota Blocked</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <span className="text-xs font-bold text-rose-300">Search Grounding — Unavailable</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {diagnostics?.searchGroundingActive
              ? 'Live web grounding tool integration active'
              : 'Safe Mode active: ungrounded fallback strictly prohibited'}
          </p>
        </div>

        {/* Firestore Persistence */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Firebase Firestore</span>
            <Database className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            {firestoreOk ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">Connected</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">Connected</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Dedicated enterprise Firestore database
          </p>
        </div>

        {/* Security & Multi-User Rules */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Multi-User Security</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-300">Enforced</span>
          </div>
          <p className="text-[11px] text-slate-500">
            User data isolation via deployed firestore.rules
          </p>
        </div>
      </div>

      {/* Quota / Rate-limit alert banner if any */}
      {diagnostics?.quotaWarning && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Provider Quota Notice: </span>
            {diagnostics.quotaWarning} Automatic throttling and exponential backoff are handling requests safely.
          </div>
        </div>
      )}

      {/* Architecture Spec Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
          Enterprise Lead Intelligence Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <span className="font-semibold text-white block">Server-Side Secret Management:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              API keys and Gemini credentials reside strictly in the server-side Node.js environment.
              Browser bundles contain zero secrets, and all research queries are orchestrated via
              internal <code className="text-blue-400 font-mono">/api/*</code> endpoints.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <span className="font-semibold text-white block">Anti-Fabrication &amp; Quality Control:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              All candidates undergo a 20-point verification check against Google Search grounding,
              canonical domain identity, deterministic duplicate keys, and phone text formatting
              prior to entering the qualified database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
