import React from 'react';
import {
  Sparkles,
  Users,
  Award,
  Layers,
  CheckCircle,
  PhoneCall,
  Search,
  ArrowRight,
  TrendingUp,
  Globe,
  FileSpreadsheet,
} from 'lucide-react';
import { Lead, ResearchRun } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  runs: ResearchRun[];
  onStartSearch: (country: string, niche: string, count: number) => void;
  onNavigateTab: (tab: string) => void;
  onSelectLead: (lead: Lead) => void;
  onExportAll: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  runs,
  onStartSearch,
  onNavigateTab,
  onSelectLead,
  onExportAll,
}) => {
  const totalLeads = leads.length;
  const aGradeCount = leads.filter((l) => l.leadStrength === 'A').length;
  const bGradeCount = leads.filter((l) => l.leadStrength === 'B').length;
  const contactedCount = leads.filter((l) => l.contacted).length;
  const freshCount = totalLeads - contactedCount;
  const totalRuns = runs.length;

  const presets = [
    { country: 'United Kingdom', niche: 'Builders & Construction', count: 10, flag: '🇬🇧' },
    { country: 'United States', niche: 'Roofing Contractors', count: 10, flag: '🇺🇸' },
    { country: 'Canada', niche: 'Dental Clinics', count: 10, flag: '🇨🇦' },
    { country: 'Australia', niche: 'Plumbers & Heating', count: 10, flag: '🇦🇺' },
    { country: 'United Arab Emirates', niche: 'HVAC & Air Conditioning', count: 10, flag: '🇦🇪' },
  ];

  // Group by service opportunity
  const opportunityBreakdown: Record<string, number> = {};
  for (const lead of leads) {
    const opp = lead.salesOpportunity || 'Web Development';
    opportunityBreakdown[opp] = (opportunityBreakdown[opp] || 0) + 1;
  }

  const topOpportunities = Object.entries(opportunityBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Quick Action */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 md:p-8">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            B2B Lead Research &amp; Qualification Engine
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Discover real local businesses backed by live Google web search grounding.
            Conduct automated website audits, identify verified decision-makers, score digital
            opportunities, and export ready-to-contact leads directly into Excel.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('generate')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer"
            >
              <Search className="h-4 w-4" />
              <span>Launch New Lead Research</span>
            </button>
            <button
              onClick={() => onNavigateTab('database')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              <span>Browse Lead Database ({totalLeads})</span>
            </button>
            {totalLeads > 0 && (
              <button
                onClick={onExportAll}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs sm:text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export XLSX</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative Grid BG */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Leads</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">{totalLeads}</div>
          <div className="mt-1 text-[11px] text-slate-400">Persistent Firestore</div>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Grade-A Leads</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-300 font-['Plus_Jakarta_Sans']">{aGradeCount}</div>
          <div className="mt-1 text-[11px] text-emerald-400/80">Strong opportunity &amp; contact</div>
        </div>

        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-medium">Grade-B Leads</span>
            <CheckCircle className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-300 font-['Plus_Jakarta_Sans']">{bGradeCount}</div>
          <div className="mt-1 text-[11px] text-blue-400/80">Opportunity identified</div>
        </div>

        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-medium">Fresh Leads</span>
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-cyan-300 font-['Plus_Jakarta_Sans']">{freshCount}</div>
          <div className="mt-1 text-[11px] text-cyan-400/80">Uncontacted records</div>
        </div>

        <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-4">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-medium">Contacted</span>
            <PhoneCall className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-300 font-['Plus_Jakarta_Sans']">{contactedCount}</div>
          <div className="mt-1 text-[11px] text-purple-400/80">Outreach in progress</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Research Runs</span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">{totalRuns}</div>
          <div className="mt-1 text-[11px] text-slate-400">Job executions</div>
        </div>
      </div>

      {/* Preset Quick Runs */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
              Recommended Search Presets
            </h2>
            <p className="text-xs text-slate-400">
              One-click research execution with pre-tested localized search planning
            </p>
          </div>
          <span className="text-xs text-blue-400 font-medium">10 Verified Leads</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((preset) => (
            <button
              key={`${preset.country}-${preset.niche}`}
              onClick={() => onStartSearch(preset.country, preset.niche, preset.count)}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="text-xl mb-1">{preset.flag}</div>
                <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {preset.country}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{preset.niche}</div>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-blue-400 font-medium">
                <span>Start Research</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Two Columns: Recent Leads & Top Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Qualified Leads */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                Recent Qualified Leads
              </h2>
              <p className="text-xs text-slate-400">
                Latest discoveries with evidence-backed digital gaps
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('database')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All ({totalLeads}) &rarr;
            </button>
          </div>

          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-12 text-center">
              <Globe className="h-10 w-10 text-slate-600 mb-2" />
              <p className="text-xs font-medium text-slate-300">No leads generated yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                Run your first search above to discover verified local businesses in your target niche and country.
              </p>
              <button
                onClick={() => onNavigateTab('generate')}
                className="mt-4 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Generate First 10 Leads
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white truncate">
                        {lead.companyName}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                          lead.leadStrength === 'A'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        Grade {lead.leadStrength}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {lead.leadScore}/100
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{lead.city}, {lead.country}</span>
                      <span>&bull;</span>
                      <span className="text-indigo-300 truncate max-w-[200px]">
                        {lead.salesOpportunity}
                      </span>
                      <span>&bull;</span>
                      <span className="text-slate-500">{lead.websiteStatus}</span>
                    </div>
                  </div>

                  <div className="ml-4 shrink-0 text-right">
                    <div className="text-[11px] font-medium text-slate-300">
                      {lead.contactFullName !== 'Not Found' ? lead.contactFullName : 'Contact Unlisted'}
                    </div>
                    <div className="text-[10px] text-slate-500">{lead.researchDate}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agency Service Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
              Service Opportunity Focus
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Distribution of digital gaps identified across discovered businesses
            </p>

            {topOpportunities.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Service breakdown will appear once leads are researched.
              </div>
            ) : (
              <div className="space-y-3">
                {topOpportunities.map(([opp, count]) => {
                  const pct = Math.round((count / Math.max(1, totalLeads)) * 100);
                  return (
                    <div key={opp}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 truncate max-w-[180px]">{opp}</span>
                        <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-blue-900/30 bg-blue-950/20 p-3 text-[11px] text-slate-400">
            <span className="font-semibold text-blue-300 block mb-0.5">Integrity &amp; Anti-Fabrication:</span>
            Every sales opportunity is strictly deduced from actual website status, mobile responsiveness,
            and missing feature evidence.
          </div>
        </div>
      </div>
    </div>
  );
};
