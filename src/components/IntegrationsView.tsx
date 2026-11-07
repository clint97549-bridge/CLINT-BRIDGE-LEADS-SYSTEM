import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Shield,
  Key,
  RefreshCw,
  ExternalLink,
  Layers,
  Lock,
  Server,
  Globe,
  Share2,
  ShoppingBag,
  Database,
  Cpu,
  Info,
} from 'lucide-react';
import { IntegrationProvider } from '../types';
import { getApiUrl } from '../lib/apiConfig';

export const IntegrationsView: React.FC = () => {
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchIntegrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(getApiUrl('/api/integrations'));
      if (!resp.ok) {
        throw new Error(`Failed to load integrations (HTTP ${resp.status})`);
      }
      const data = await resp.json();
      setProviders(data.providers || []);
      setLastRefreshed(data.timestamp || new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch integrations status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const getStatusBadge = (status: IntegrationProvider['status']) => {
    switch (status) {
      case 'Connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        );
      case 'Quota Limited':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Quota Limited (429)
          </span>
        );
      case 'Authorization Required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Key className="w-3.5 h-3.5" />
            Auth Required
          </span>
        );
      case 'Not Configured':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Info className="w-3.5 h-3.5" />
            Not Configured
          </span>
        );
      case 'Failed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
    }
  };

  const getCategoryIcon = (category: IntegrationProvider['category']) => {
    switch (category) {
      case 'Search & Discovery':
        return <Globe className="w-5 h-5 text-blue-400" />;
      case 'Social Intelligence':
        return <Share2 className="w-5 h-5 text-purple-400" />;
      case 'Technical Auditing':
        return <Server className="w-5 h-5 text-emerald-400" />;
      case 'Data Persistence':
        return <Database className="w-5 h-5 text-amber-400" />;
      default:
        return <Layers className="w-5 h-5 text-slate-400" />;
    }
  };

  const categories = ['all', 'Search & Discovery', 'Social Intelligence', 'Technical Auditing', 'Data Persistence'];

  const filteredProviders =
    selectedCategory === 'all'
      ? providers
      : providers.filter((p) => p.category === selectedCategory);

  const connectedCount = providers.filter((p) => p.status === 'Connected').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-400 uppercase">
              <Shield className="w-4 h-4" />
              Truth-in-Discovery Architecture
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
              Provider Integrations & Security
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time audit of discovery providers, Meta Graph API boundaries, website verification engines, and
              database persistence. Zero credentials or keys are exposed to the browser.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-center">
              <span className="block text-2xl font-bold text-white font-mono">{connectedCount} / {providers.length}</span>
              <span className="text-[11px] font-medium text-slate-400">Providers Active</span>
            </div>
            <button
              onClick={fetchIntegrations}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              Refresh Status
            </button>
          </div>
        </div>
      </div>

      {/* Boundary Transparency Notice */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:p-5 flex items-start gap-4">
        <Lock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white block">Honest Integration & API Policy Compliance:</span>
          Official Meta (Facebook/Instagram) and Google Places APIs enforce strict platform boundaries.
          LeadPulse AI never executes unauthorized scraping, session hijacking, or CAPTCHA bypass. Social profiles
          and business identities are attached strictly through verified official website links, registered Page/Business tokens,
          and public external anchors.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {cat === 'all' ? 'All Integrations' : cat}
          </button>
        ))}
        {lastRefreshed && (
          <span className="ml-auto text-[11px] text-slate-500">
            Last audited: {new Date(lastRefreshed).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Providers Grid */}
      {loading && providers.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-slate-400">Auditing active provider integrations and credentials...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-300">{error}</p>
          <button
            onClick={fetchIntegrations}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
          >
            Retry Connection Audit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProviders.map((provider) => (
            <div
              key={provider.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700/80 p-5 space-y-4 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      {getCategoryIcon(provider.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm tracking-tight">{provider.name}</h3>
                      <span className="text-[11px] text-slate-400">{provider.category}</span>
                    </div>
                  </div>
                  {getStatusBadge(provider.status)}
                </div>

                {/* Safe Details */}
                {provider.safeDetails && (
                  <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 text-xs text-slate-300">
                    <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider mb-1">
                      Live Status Audit
                    </span>
                    <p className="leading-relaxed">{provider.safeDetails}</p>
                  </div>
                )}

                {/* Capabilities */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Available Capabilities
                  </span>
                  <ul className="grid grid-cols-1 gap-1 text-xs text-slate-300">
                    {provider.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold mt-0.5">•</span>
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Permissions */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Granted Permissions / Scopes
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {provider.permissions.map((perm, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Setup Instructions */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                  Setup & Configuration
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">{provider.setupInstructions}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
