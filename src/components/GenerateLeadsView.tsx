import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Globe2,
  ChevronDown,
  Info,
  Loader2,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { COUNTRIES, POPULAR_NICHES } from '../lib/countries';
import { ResearchRun, SearchPlan } from '../types';

interface GenerateLeadsViewProps {
  onExecuteRun: (params: {
    country: string;
    niche: string;
    location?: string;
    leadCount: number;
    freshLeadsOnly: boolean;
    excludeContacted: boolean;
    minimumScore: number;
    targetStrength: 'A' | 'B' | 'ALL';
    researchDepth: 'Standard' | 'Deep';
  }) => Promise<void>;
  currentRun: ResearchRun | null;
  isRunning: boolean;
  onNavigateTab: (tab: string) => void;
  onExportRun: () => void;
}

export const GenerateLeadsView: React.FC<GenerateLeadsViewProps> = ({
  onExecuteRun,
  currentRun,
  isRunning,
  onNavigateTab,
  onExportRun,
}) => {
  const [country, setCountry] = useState('United Kingdom');
  const [niche, setNiche] = useState('Builders & Construction');
  const [location, setLocation] = useState('');
  const [leadCount, setLeadCount] = useState<number>(10);
  const [customCount, setCustomCount] = useState('');
  const [freshLeadsOnly, setFreshLeadsOnly] = useState(true);
  const [excludeContacted, setExcludeContacted] = useState(true);
  const [minimumScore, setMinimumScore] = useState(60);
  const [targetStrength, setTargetStrength] = useState<'A' | 'B' | 'ALL'>('ALL');
  const [researchDepth, setResearchDepth] = useState<'Standard' | 'Deep'>('Standard');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search plan preview
  const [planPreview, setPlanPreview] = useState<SearchPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const selectedCountryObj = COUNTRIES.find((c) => c.name === country);

  const handleLeadCountChange = (count: number) => {
    setLeadCount(count);
    setCustomCount('');
  };

  const handleCustomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setCustomCount(e.target.value);
    if (!isNaN(val) && val > 0) {
      setLeadCount(Math.min(250, val));
    }
  };

  const handlePreviewPlan = async () => {
    if (!country || !niche) return;
    setLoadingPlan(true);
    try {
      const resp = await fetch('/api/research/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, niche, location, leadCount }),
      });
      const data = await resp.json();
      setPlanPreview(data);
    } catch (err) {
      console.error('Plan preview failed:', err);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country || !niche || isRunning) return;
    onExecuteRun({
      country,
      niche,
      location: location.trim() || undefined,
      leadCount,
      freshLeadsOnly,
      excludeContacted,
      minimumScore,
      targetStrength,
      researchDepth,
    });
  };

  const stageLabels: Record<string, string> = {
    SEARCH_PLANNING: 'Creating Search Plan & Local Terminology',
    CANDIDATE_DISCOVERY: 'Discovering Operating Businesses via Google Search Grounding',
    DEDUPLICATION: 'Normalizing & Removing Historical/Current Duplicates',
    BUSINESS_RESEARCH: 'Grounding Business Identity & Web Presence',
    WEBSITE_RESEARCH: 'Auditing Website & Technical Conversion Gaps',
    CONTACT_RESEARCH: 'Verifying Public Decision-Maker & Company Contacts',
    SOCIAL_RESEARCH: 'Validating Public Social Profiles',
    OPPORTUNITY_ANALYSIS: 'Mapping Digital Need Signals & Opportunities',
    EVIDENCE_VALIDATION: 'Validating Citations & Traceable Evidence',
    A_B_QUALIFICATION: 'Computing Transparent Score & A/B Strength',
    FINAL_QC: 'Executing 20-Point Integrity Quality Control',
    DATABASE_SAVE: 'Persisting to Firestore Lead & History Collections',
    COMPLETED: 'Research Completed & Verified',
    FAILED: 'Research Execution Halted',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
          Generate Verified B2B Leads
        </h1>
        <p className="mt-1 text-xs text-slate-400 max-w-3xl">
          Configure country, niche, and target parameters. The research engine constructs regional query
          variations, discovers genuine operating businesses via Google Search grounding, audits websites,
          verifies public contacts, and qualifies only evidence-backed leads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Panel */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Country Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Country Target (Worldwide)</span>
                <span className="text-[11px] text-blue-400">
                  {selectedCountryObj ? `Dial code: +${selectedCountryObj.dialCode}` : ''}
                </span>
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isRunning}
                  className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name} ({c.code}) - {c.region}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Niche / Industry */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Niche / Industry
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                disabled={isRunning}
                placeholder="e.g. Builders, Roofing, Dental Clinics, Plumbers"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              {/* Niche Quick Pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {POPULAR_NICHES.slice(0, 6).map((pop) => (
                  <button
                    type="button"
                    key={pop}
                    onClick={() => setNiche(pop)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                      niche === pop
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'
                    }`}
                  >
                    {pop}
                  </button>
                ))}
              </div>
            </div>

            {/* Location (City / Region) */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Specific City or Region (Optional)</span>
                <span className="text-[11px] text-slate-400">
                  Leave blank for country-wide multi-city search
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isRunning}
                  placeholder={
                    selectedCountryObj?.majorCities.length
                      ? `e.g. ${selectedCountryObj.majorCities.slice(0, 3).join(', ')}`
                      : 'e.g. London, Manchester, New York'
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <MapPin className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>

            {/* Lead Count Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Target Lead Count</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {leadCount} leads requested
                </span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[10, 25, 50, 100, 250].map((cnt) => (
                  <button
                    type="button"
                    key={cnt}
                    onClick={() => handleLeadCountChange(cnt)}
                    disabled={isRunning}
                    className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                      leadCount === cnt && !customCount
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Custom target:</span>
                <input
                  type="number"
                  min="1"
                  max="250"
                  value={customCount}
                  onChange={handleCustomCountChange}
                  disabled={isRunning}
                  placeholder="e.g. 15"
                  className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">(Max 250 per run)</span>
              </div>
            </div>

            {/* Deduplication & History Rules */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Lead History &amp; Deduplication Rules</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white font-medium">Fresh Leads Only</div>
                  <div className="text-[11px] text-slate-400">
                    Exclude businesses previously discovered or exported
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={freshLeadsOnly}
                  onChange={(e) => setFreshLeadsOnly(e.target.checked)}
                  disabled={isRunning}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                  <div className="text-xs text-white font-medium">Exclude Contacted</div>
                  <div className="text-[11px] text-slate-400">
                    Never return businesses marked as contacted in previous runs
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={excludeContacted}
                  onChange={(e) => setExcludeContacted(e.target.checked)}
                  disabled={isRunning}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Qualification Filters'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-4">
                  {/* Minimum Score Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                      <span>Minimum Lead Score</span>
                      <span className="font-mono text-cyan-400 font-bold">{minimumScore}/100</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="90"
                      step="5"
                      value={minimumScore}
                      onChange={(e) => setMinimumScore(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                      <span>40 (Broad)</span>
                      <span>60 (Balanced)</span>
                      <span>80 (High Confidence)</span>
                    </div>
                  </div>

                  {/* Target Strength */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Lead Strength Filter
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['ALL', 'A', 'B'] as const).map((str) => (
                        <button
                          type="button"
                          key={str}
                          onClick={() => setTargetStrength(str)}
                          className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                            targetStrength === str
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {str === 'ALL' ? 'All (A & B)' : `Grade ${str} Only`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Research Depth */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Research Depth
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Standard', 'Deep'] as const).map((depth) => (
                        <button
                          type="button"
                          key={depth}
                          onClick={() => setResearchDepth(depth)}
                          className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                            researchDepth === depth
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {depth} Research
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isRunning}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Researching Leads ({currentRun?.progress || 0}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Start Grounded Research Run</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePreviewPlan}
                disabled={isRunning || loadingPlan}
                className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
              >
                {loadingPlan ? 'Planning...' : 'Preview Search Strategy'}
              </button>
            </div>
          </form>
        </div>

        {/* Status & Live Progress Side Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Job Progress */}
          {isRunning || (currentRun && currentRun.status !== 'pending') ? (
            <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-b from-blue-950/40 to-slate-900 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {currentRun?.status === 'completed'
                      ? 'Research Run Completed'
                      : currentRun?.status === 'partial'
                      ? 'Completed with Shortfall'
                      : 'Live Research Pipeline'}
                  </span>
                </div>
                <span className="font-mono text-xs text-blue-300 font-bold">
                  {currentRun?.progress || 0}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${currentRun?.progress || 0}%` }}
                />
              </div>

              {/* Stage Description */}
              <div className="rounded-xl border border-blue-900/50 bg-slate-950/80 p-3">
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                  Current Pipeline Stage
                </div>
                <div className="mt-0.5 text-xs font-semibold text-white">
                  {stageLabels[currentRun?.stage || 'SEARCH_PLANNING'] || currentRun?.stage}
                </div>
              </div>

              {/* Metric Counters Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Target</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {currentRun?.requestedCount || leadCount}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Found</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono">
                    {currentRun?.candidatesFound || 0}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Duplicates</div>
                  <div className="text-sm font-bold text-amber-400 font-mono">
                    {currentRun?.duplicatesRemoved || 0}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Rejected</div>
                  <div className="text-sm font-bold text-red-400 font-mono">
                    {currentRun?.rejectedCount || 0}
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-2">
                  <div className="text-[10px] text-emerald-400 font-medium">Qualified</div>
                  <div className="text-sm font-bold text-emerald-300 font-mono">
                    {currentRun?.qualifiedCount || 0}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Shortfall</div>
                  <div className="text-sm font-bold text-slate-300 font-mono">
                    {currentRun?.shortfall || 0}
                  </div>
                </div>
              </div>

              {/* Zero Hallucination Callout */}
              <div className="flex items-start gap-2 rounded-xl border border-blue-900/40 bg-blue-950/30 p-3 text-[11px] text-slate-300 leading-relaxed">
                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Zero-Fabrication Policy: </span>
                  Target is a goal, not permission to invent businesses. If legitimate sources yield 8
                  qualified leads instead of 10, exactly 8 are saved and 2 shortfall is reported.
                </div>
              </div>

              {/* Actions upon finish */}
              {!isRunning && currentRun?.status === 'completed' && (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => onNavigateTab('database')}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-md cursor-pointer"
                  >
                    <span>View Database</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={onExportRun}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>XLSX</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 text-slate-400">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Globe2 className="h-4 w-4 text-blue-400" />
                <span>Multi-Stage Intelligence Pipeline</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Breaks country into localized regional search plans.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Retrieves active operating businesses with Google Search grounding.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Deduplicates against previous historical research runs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Audits website, contact person, phone &amp; WhatsApp status.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Applies 20-point quality control before persistence.</span>
                </li>
              </ul>
            </div>
          )}

          {/* Search Plan Preview Drawer if requested */}
          {planPreview && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Search Plan Preview</span>
                <span className="text-[10px] text-blue-400 font-mono">
                  Candidate Target: {planPreview.candidateTargetPoolSize}
                </span>
              </div>

              <div className="text-[11px] text-slate-300">
                <span className="text-slate-500 font-medium">Targeted Regions: </span>
                {planPreview.regions.join(', ')}
              </div>

              {planPreview.localTerminologyUsed.length > 0 && (
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-500 font-medium">Localized Terminology: </span>
                  {planPreview.localTerminologyUsed.join(', ')}
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Planned Queries:
                </span>
                {planPreview.queries.slice(0, 3).map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] text-slate-300 truncate"
                    title={q.query}
                  >
                    {q.query}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
