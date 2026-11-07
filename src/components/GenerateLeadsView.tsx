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
  Compass,
  Instagram,
  Facebook,
  Phone,
  Briefcase,
  AlertCircle,
  FileCheck,
  Target,
  Award,
  Database,
  Building2,
  Scale,
} from 'lucide-react';
import {
  COUNTRIES,
  POPULAR_NICHES,
  PAKISTAN_PROVINCES,
  ALL_PAKISTAN_SYSTEMATIC_CITIES,
  MARKET_OPTIONS,
  UK_REGIONS,
  US_STATES,
  CLIENT_BRIDGE_NICHES,
} from '../lib/countries';
import { PAKISTAN_TARGET_INDUSTRIES, PAKISTAN_ECOMMERCE_CATEGORIES, isECommerceNiche } from '../lib/pakistanIndustries';
import { getApiUrl } from '../lib/apiConfig';
import { ResearchRun, SearchPlan } from '../types';

interface GenerateLeadsViewProps {
  onExecuteRun: (params: {
    country: string;
    niche: string;
    subNiche?: string;
    province?: string;
    location?: string;
    customSearchTerms?: string[];
    leadCount: number;
    freshLeadsOnly: boolean;
    excludeContacted: boolean;
    minimumScore: number;
    targetStrength: 'A' | 'B' | 'ALL';
    researchDepth: 'Standard' | 'Deep';
    requireNoWebsite?: boolean;
    allowWeakWebsite?: boolean;
    requireHiring?: boolean;
    requiredContactDetails?: 'any' | 'phone_only' | 'email_only' | 'both';
    opportunityType?: string;
    onlyGenuineEcommerce?: boolean;
    ecommerceWebsiteOpportunitiesOnly?: boolean;
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
  const [country, setCountry] = useState('Pakistan');
  const [province, setProvince] = useState('');
  const [niche, setNiche] = useState('Dental Clinics');
  const [subNiche, setSubNiche] = useState('General Dentistry');
  const [location, setLocation] = useState('');
  const [customKeywords, setCustomKeywords] = useState('');
  const [leadCount, setLeadCount] = useState<number>(10);
  const [customCount, setCustomCount] = useState('');
  const [freshLeadsOnly, setFreshLeadsOnly] = useState(true);
  const [excludeContacted, setExcludeContacted] = useState(true);
  const [minimumScore, setMinimumScore] = useState(60);
  const [targetStrength, setTargetStrength] = useState<'A' | 'B' | 'ALL'>('ALL');
  const [researchDepth, setResearchDepth] = useState<'Standard' | 'Deep'>('Standard');
  const [requireNoWebsite, setRequireNoWebsite] = useState(false);
  const [allowWeakWebsite, setAllowWeakWebsite] = useState(true);
  const [requireHiring, setRequireHiring] = useState(false);
  const [requiredContactDetails, setRequiredContactDetails] = useState<'any' | 'phone_only' | 'email_only' | 'both'>('any');
  const [opportunityTypeFilter, setOpportunityTypeFilter] = useState<string>('ALL');
  const [onlyGenuineEcommerce, setOnlyGenuineEcommerce] = useState(false);
  const [ecommerceWebsiteOpportunitiesOnly, setEcommerceWebsiteOpportunitiesOnly] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search plan preview
  const [planPreview, setPlanPreview] = useState<SearchPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const selectedCountryObj = COUNTRIES.find((c) => c.name === country);
  const isPakistan = country.toLowerCase() === 'pakistan';
  const isUK = country.toLowerCase().includes('united kingdom') || country.toLowerCase() === 'gb';
  const isUS = country.toLowerCase().includes('united states') || country.toLowerCase() === 'us';
  const isCombinedUKUSA = country.toLowerCase().includes('uk + usa');
  const isAllEnabledMarkets = country.toLowerCase().includes('all enabled');
  const selectedProvinceObj = isPakistan ? PAKISTAN_PROVINCES.find((p) => p.name === province) : null;

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
      const guestId = localStorage.getItem('leadpulse_guest_id') || `guest_${Date.now()}`;
      const customSearchTerms = customKeywords
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const resp = await fetch(getApiUrl('/api/research/plan'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Session': guestId,
        },
        body: JSON.stringify({
          country,
          niche,
          subNiche: subNiche.trim() || undefined,
          province: province || undefined,
          location: location.trim() || undefined,
          customSearchTerms: customSearchTerms.length > 0 ? customSearchTerms : undefined,
          leadCount,
          requireNoWebsite,
          allowWeakWebsite,
          requireHiring,
          minimumScore,
          onlyGenuineEcommerce,
          ecommerceWebsiteOpportunitiesOnly,
        }),
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
    const customSearchTerms = customKeywords
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    onExecuteRun({
      country,
      niche,
      subNiche: subNiche.trim() || undefined,
      province: province || undefined,
      location: location.trim() || undefined,
      customSearchTerms: customSearchTerms.length > 0 ? customSearchTerms : undefined,
      leadCount,
      freshLeadsOnly,
      excludeContacted,
      minimumScore,
      targetStrength,
      researchDepth,
      requireNoWebsite,
      allowWeakWebsite,
      requireHiring,
      requiredContactDetails,
      opportunityType: opportunityTypeFilter !== 'ALL' ? opportunityTypeFilter : undefined,
      onlyGenuineEcommerce,
      ecommerceWebsiteOpportunitiesOnly,
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
                <span>Target Market &amp; Country</span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {isPakistan
                    ? 'Pakistan-First Core Hub (Dial code: +92)'
                    : isUK
                    ? 'UK PECR & UK GDPR Ready (Dial code: +44)'
                    : isUS
                    ? 'US CAN-SPAM & TCPA Ready (Dial code: +1)'
                    : isCombinedUKUSA
                    ? 'UK + USA Dual-Market Engine'
                    : isAllEnabledMarkets
                    ? 'All Enabled Markets (PK + GB + US)'
                    : selectedCountryObj
                    ? `Dial code: +${selectedCountryObj.dialCode}`
                    : ''}
                </span>
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setProvince('');
                    setLocation('');
                  }}
                  disabled={isRunning}
                  className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <optgroup label="Enabled Agency Markets (Client Bridge)">
                    {MARKET_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m === 'Pakistan'
                          ? 'Pakistan (PK) — Domestic Hub & Leading Zero Preservation'
                          : m === 'United Kingdom'
                          ? 'United Kingdom (GB) — 4 Nations & English Regions'
                          : m === 'United States'
                          ? 'United States (US) — 50 States & Major Metros'
                          : m === 'UK + USA'
                          ? 'UK + USA — Dual-Market Parallel Run'
                          : 'All Enabled Markets — (Pakistan + UK + USA)'}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other International Markets">
                    {COUNTRIES.filter(
                      (c) => c.name !== 'Pakistan' && c.name !== 'United Kingdom' && c.name !== 'United States'
                    ).map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name} ({c.code}) - {c.region}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Market Compliance & Safeguard Banner */}
            {(isUK || isUS || isCombinedUKUSA || isAllEnabledMarkets) && (
              <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3 space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-blue-300">
                  <Scale className="h-4 w-4 text-blue-400" />
                  <span>
                    {isUK
                      ? 'United Kingdom Regulatory Guard (PECR & UK GDPR)'
                      : isUS
                      ? 'United States Regulatory Guard (CAN-SPAM & TCPA)'
                      : 'Multi-Market Coordinated Safeguards'}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {isUK
                    ? 'Corporate subscribers (Ltd/LLP) permit B2B email marketing with simple opt-out. Individual subscribers/sole traders are flagged for consent review. CTPS/TPS screening reminders active.'
                    : isUS
                    ? 'Entity types (LLC/Corp/Sole Prop) isolated. CAN-SPAM disclosures required on email. TCPA safeguards prohibit automated dialers without prior express written consent.'
                    : 'Independent sub-jobs executed per market. Leads carry their real country label without cross-contamination. If one sub-job finishes or errors, the other is preserved.'}
                </p>
              </div>
            )}

            {/* Pakistan Province Selector (Shown when Pakistan is selected) */}
            {isPakistan && (
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>Province / Administrative Territory (Pakistan)</span>
                  <span className="text-[11px] text-slate-400">Optional regional focus</span>
                </label>
                <div className="relative">
                  <select
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      if (e.target.value) {
                        const p = PAKISTAN_PROVINCES.find((x) => x.name === e.target.value);
                        if (p && p.cities.length > 0) {
                          setLocation(p.cities[0]);
                        }
                      }
                    }}
                    disabled={isRunning}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Pakistan (National Multi-City Strategy)</option>
                    {PAKISTAN_PROVINCES.map((p) => (
                      <option key={p.code} value={p.name}>
                        {p.name} ({p.cities.length} key commercial cities)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>
            )}

            {/* UK Nation / Region Selector (Shown when UK is selected) */}
            {isUK && (
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>UK Nation &amp; English Region</span>
                  <span className="text-[11px] text-slate-400">England, Scotland, Wales, NI</span>
                </label>
                <div className="relative">
                  <select
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      if (e.target.value) {
                        const reg = UK_REGIONS.find((r) => r.name === e.target.value);
                        if (reg && reg.majorCities.length > 0) {
                          setLocation(reg.majorCities[0]);
                        }
                      }
                    }}
                    disabled={isRunning}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All United Kingdom (Nationwide Search)</option>
                    {UK_REGIONS.map((r) => (
                      <option key={r.code} value={r.name}>
                        {r.name} ({r.nation}) — {r.majorCities.slice(0, 3).join(', ')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>
            )}

            {/* US State Selector (Shown when United States is selected) */}
            {isUS && (
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>State / Territory (United States)</span>
                  <span className="text-[11px] text-slate-400">50 States + District of Columbia</span>
                </label>
                <div className="relative">
                  <select
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      if (e.target.value) {
                        const st = US_STATES.find((s) => s.name === e.target.value);
                        if (st && st.majorCities.length > 0) {
                          setLocation(st.majorCities[0]);
                        }
                      }
                    }}
                    disabled={isRunning}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All United States (National Multi-State Coverage)</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code}) — {s.region}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>
            )}

            {/* Pakistan High-Intent Priority Target Industries (Client Bridge) */}
            {isPakistan && (
              <div className="rounded-xl border border-blue-900/40 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Client Bridge Target Industries (Pakistan)
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">9 Dedicated Sectors</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PAKISTAN_TARGET_INDUSTRIES.map((ind) => {
                    const isSelected = niche === ind.name;
                    return (
                      <button
                        type="button"
                        key={ind.id}
                        onClick={() => {
                          setNiche(ind.name);
                          setSubNiche(ind.subcategories[0]);
                        }}
                        disabled={isRunning}
                        className={`text-left rounded-xl p-2.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/30 border-blue-500 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">{ind.name}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{ind.subcategories.slice(0, 2).join(', ')}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Subcategory Selector for Selected Industry */}
                {(() => {
                  const currentTarget = PAKISTAN_TARGET_INDUSTRIES.find((ind) => ind.name === niche);
                  if (!currentTarget) return null;
                  return (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                        <span>Select Sub-Niche for {currentTarget.shortLabel}:</span>
                        <span className="text-[10px] text-emerald-400">{currentTarget.subcategories.length} Specialized Subcategories</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentTarget.subcategories.map((sub) => (
                          <button
                            type="button"
                            key={sub}
                            onClick={() => setSubNiche(sub)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                              subNiche === sub
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                      <div className="text-[11px] text-blue-300/90 bg-blue-950/40 border border-blue-900/40 rounded-lg p-2 leading-relaxed">
                        <span className="font-semibold text-white">Agency Strategy: </span>
                        {currentTarget.exampleRecommendation}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Niche / Industry Custom Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Target Niche / Industry Name
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                disabled={isRunning}
                placeholder="e.g. Dental Clinics, Real Estate, E-Commerce and Clothing Brands"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              {/* Niche Quick Pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {POPULAR_NICHES.slice(0, 9).map((pop) => (
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

            {/* Dedicated E-Commerce Categories Selector (Part C.2) */}
            {isECommerceNiche(niche) && (
              <div className="rounded-xl border border-purple-900/50 bg-gradient-to-br from-purple-950/30 via-slate-900 to-indigo-950/20 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      E-Commerce Brand Categories (Part C.2)
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-300 font-mono font-semibold">7 Specialized Sectors</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PAKISTAN_ECOMMERCE_CATEGORIES.map((cat) => {
                    const isSelected = subNiche === cat.name || niche.toLowerCase().includes(cat.shortLabel.toLowerCase());
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => {
                          setNiche(cat.name);
                          setSubNiche(cat.subcategories[0]);
                        }}
                        disabled={isRunning}
                        className={`text-left rounded-xl p-2.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600/30 border-purple-500 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-500'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">{cat.shortLabel}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{cat.subcategories.slice(0, 2).join(', ')}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Subcategories for selected e-commerce category */}
                {(() => {
                  const activeCat =
                    PAKISTAN_ECOMMERCE_CATEGORIES.find(
                      (c) => c.name === niche || niche.toLowerCase().includes(c.shortLabel.toLowerCase())
                    ) || PAKISTAN_ECOMMERCE_CATEGORIES[0];
                  return (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                        <span>Select Subcategory for {activeCat.shortLabel}:</span>
                        <span className="text-[10px] text-purple-300">{activeCat.subcategories.length} Subcategories</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeCat.subcategories.map((sub) => (
                          <button
                            type="button"
                            key={sub}
                            onClick={() => setSubNiche(sub)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                              subNiche === sub
                                ? 'bg-purple-600/40 text-purple-200 border border-purple-500/50'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Sub-Niche / Specialization */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Sub-Niche &amp; Commercial Angle (Optional)</span>
                <span className="text-[11px] text-slate-400">Enhances search depth</span>
              </label>
              <input
                type="text"
                value={subNiche}
                onChange={(e) => setSubNiche(e.target.value)}
                disabled={isRunning}
                placeholder="e.g. With driver, self drive, IELTS preparation, UI UX design, COD clothing"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Location (City / Multiple Cities / Regions) */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>City or Multiple Cities (Comma-separated)</span>
                <span className="text-[11px] text-slate-400">
                  Leave blank for {isPakistan ? 'systematic All Pakistan matrix' : 'country-wide search'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isRunning}
                  placeholder={
                    isPakistan
                      ? 'e.g. Karachi, Lahore, Islamabad (or leave blank for All Pakistan)'
                      : 'e.g. London, Manchester, New York'
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <MapPin className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-500" />
              </div>

              {/* Quick Location Pills */}
              {isPakistan && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Major Commercial Hubs:</span>
                    {[
                      'Karachi',
                      'Lahore',
                      'Islamabad',
                      'Rawalpindi',
                      'Faisalabad',
                      'Multan',
                      'Peshawar',
                      'Quetta',
                      'Sialkot',
                      'Gujranwala',
                      'Hyderabad',
                      'Sargodha',
                      'Bahawalpur',
                      'Abbottabad',
                      'Sukkur',
                      'Mardan',
                      'Gujrat',
                      'Sheikhupura',
                      'Jhelum',
                    ].map((city) => (
                      <button
                        type="button"
                        key={city}
                        onClick={() => setLocation(city)}
                        className={`rounded-lg px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                          location === city
                            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setLocation('All Pakistan')}
                      className={`rounded-lg px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                        location === 'All Pakistan'
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                          : 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800 border border-emerald-900/50'
                      }`}
                    >
                      All Pakistan (Multi-City Matrix)
                    </button>
                  </div>

                  {/* Province Specific Commercial Zones */}
                  {selectedProvinceObj?.keyCommercialZones && (
                    <div className="flex flex-wrap gap-1 items-center pt-1">
                      <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Zones:</span>
                      {selectedProvinceObj.keyCommercialZones.slice(0, 4).map((zone) => (
                        <button
                          type="button"
                          key={zone}
                          onClick={() => setLocation(zone)}
                          className="rounded-lg px-2 py-0.5 text-[10px] bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                        >
                          {zone}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Worldwide Country Quick Location Pills (when not Pakistan) */}
              {!isPakistan && selectedCountryObj?.majorCities && selectedCountryObj.majorCities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Popular:</span>
                  {selectedCountryObj.majorCities.slice(0, 6).map((city) => (
                    <button
                      type="button"
                      key={city}
                      onClick={() => setLocation(city)}
                      className={`rounded-lg px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                        location === city
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                          : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                  {location && (
                    <button
                      type="button"
                      onClick={() => setLocation('')}
                      className="rounded-lg px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-300 underline"
                    >
                      All
                    </button>
                  )}
                </div>
              )}
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

                  {/* Qualification Criteria Controls */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-blue-400" />
                      <span>Commercial Qualification &amp; Need Gating</span>
                    </div>

                    {/* Mandatory No Website */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-white font-medium">Mandatory: Businesses With NO Official Website</div>
                        <div className="text-[11px] text-slate-400">
                          Prioritize businesses operating solely via phone, social or Google Maps for web development pitching
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireNoWebsite}
                        onChange={(e) => setRequireNoWebsite(e.target.checked)}
                        disabled={isRunning}
                        className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {/* Allow Weak Websites */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-white font-medium">Allow Weak / Outdated Websites</div>
                        <div className="text-[11px] text-slate-400">
                          Include businesses whose sites have observable technical problems (broken SSL, missing viewport, outdated copyright)
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowWeakWebsite}
                        onChange={(e) => setAllowWeakWebsite(e.target.checked)}
                        disabled={isRunning}
                        className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {/* Require Hiring Evidence */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-white font-medium">Require Public Hiring Evidence</div>
                        <div className="text-[11px] text-slate-400">
                          Only qualify businesses with active confirmed public recruitment signals
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireHiring}
                        onChange={(e) => setRequireHiring(e.target.checked)}
                        disabled={isRunning}
                        className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {/* Dedicated E-Commerce Qualification Filters (Part C) */}
                    <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-3 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        <span>Dedicated E-Commerce Brand Gating (Part C.5)</span>
                      </div>

                      {/* Only Genuine E-Commerce Brands */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-white font-medium">Only Genuine E-Commerce Brands</div>
                          <div className="text-[11px] text-slate-400">
                            Exclude physical-only retailers, wholesalers, and general marketplaces. Keep only verified direct-to-consumer online brands and social commerce sellers.
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={onlyGenuineEcommerce}
                          onChange={(e) => setOnlyGenuineEcommerce(e.target.checked)}
                          disabled={isRunning}
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                        />
                      </div>

                      {/* E-Commerce Website Gaps Only */}
                      <div className="flex items-start justify-between gap-3 pt-2 border-t border-purple-900/30">
                        <div>
                          <div className="text-xs text-white font-medium">E-Commerce Website Gaps Only (Web Dev Prospects)</div>
                          <div className="text-[11px] text-slate-400">
                            Prioritize brands with missing official websites, social-only DM ordering, catalog without checkout, or broken online stores.
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={ecommerceWebsiteOpportunitiesOnly}
                          onChange={(e) => setEcommerceWebsiteOpportunitiesOnly(e.target.checked)}
                          disabled={isRunning}
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* Required Contact Details Filter (Section 7) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Contact Details Gating
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 'any', label: 'Any Public Contact' },
                          { id: 'phone_only', label: 'Public Phone Only' },
                          { id: 'email_only', label: 'Public Email Only' },
                          { id: 'both', label: 'Phone & Email Both' },
                        ].map((opt) => (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => setRequiredContactDetails(opt.id as any)}
                            className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold transition-all ${
                              requiredContactDetails === opt.id
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opportunity Type Filter (Section 6) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Opportunity Type Priority
                      </label>
                      <select
                        value={opportunityTypeFilter}
                        onChange={(e) => setOpportunityTypeFilter(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="ALL">All Opportunity Types</option>
                        <option value="new_website">New Website Development (No Site Found)</option>
                        <option value="website_redesign">Website Redesign &amp; Mobile Modernization</option>
                        <option value="booking_system">Online Appointment &amp; Booking System</option>
                        <option value="property_portal">Searchable Property Portal &amp; CRM</option>
                        <option value="ecommerce">E-Commerce Store &amp; COD Cart Checkout</option>
                        <option value="student_portal">Student Portal &amp; Online Admissions</option>
                        <option value="mobile_app">Mobile Application (iOS &amp; Android)</option>
                        <option value="crm">Lead Capture &amp; Customer Management CRM</option>
                        <option value="seo">Local SEO &amp; Google Rankings</option>
                        <option value="digital_marketing">Social Media Marketing &amp; Meta Ads</option>
                      </select>
                    </div>

                    {/* Custom Keywords */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Custom Search Keywords / Terminology (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={customKeywords}
                        onChange={(e) => setCustomKeywords(e.target.value)}
                        disabled={isRunning}
                        placeholder="e.g. COD delivery, corporate fleet, spoken english, IELTS coaching"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
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

              {/* Multi-Market Breakdown (When UK + USA or multi-country is active) */}
              {currentRun?.marketBreakdown && Object.keys(currentRun.marketBreakdown).length > 1 && (
                <div className="rounded-xl border border-blue-900/50 bg-slate-950/80 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe2 className="h-3.5 w-3.5 text-blue-400" />
                      <span>Market Breakdown &amp; Sub-Job Isolation</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Parallel Isolation</span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(currentRun.marketBreakdown).map(([mName, mData]) => (
                      <div key={mName} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white">{mName}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              mData.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : mData.status === 'failed'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                            }`}
                          >
                            {mData.status || 'pending'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Target: {mData.requested}</span>
                          <span>Candidates: {mData.candidates}</span>
                          <span className="text-emerald-400 font-bold font-mono">Qualified: {mData.qualified}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 12-Step Lead Intelligence Pipeline Mini-Tracker */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 uppercase tracking-wider">12-Step Intelligence Stages</span>
                  <span className="font-mono text-cyan-400 font-semibold">{currentRun?.progress || 0}% Complete</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 text-[10px]">
                  {[
                    { num: '1', name: 'Google/Discovery', stageMatch: 'CANDIDATE_DISCOVERY', minPct: 15 },
                    { num: '2', name: 'Website Audit', stageMatch: 'WEBSITE_RESEARCH', minPct: 30 },
                    { num: '3', name: 'Facebook', stageMatch: 'SOCIAL_RESEARCH', minPct: 40 },
                    { num: '4', name: 'Instagram', stageMatch: 'SOCIAL_RESEARCH', minPct: 45 },
                    { num: '5', name: 'Contacts', stageMatch: 'CONTACT_RESEARCH', minPct: 55 },
                    { num: '6', name: 'Business Research', stageMatch: 'BUSINESS_RESEARCH', minPct: 65 },
                    { num: '7', name: 'Problem', stageMatch: 'OPPORTUNITY_ANALYSIS', minPct: 75 },
                    { num: '8', name: 'Evidence', stageMatch: 'EVIDENCE_VALIDATION', minPct: 80 },
                    { num: '9', name: 'Opportunity', stageMatch: 'OPPORTUNITY_ANALYSIS', minPct: 85 },
                    { num: '10', name: 'A/B Grade', stageMatch: 'A_B_QUALIFICATION', minPct: 90 },
                    { num: '11', name: 'Database', stageMatch: 'DATABASE_SAVE', minPct: 95 },
                    { num: '12', name: 'Excel', stageMatch: 'COMPLETED', minPct: 100 },
                  ].map((st) => {
                    const isDone = (currentRun?.progress || 0) >= st.minPct || currentRun?.status === 'completed';
                    const isCurrent = currentRun?.stage === st.stageMatch || (!isDone && (currentRun?.progress || 0) >= st.minPct - 15);
                    return (
                      <div
                        key={st.num}
                        className={`rounded px-1.5 py-1 flex items-center gap-1 border truncate ${
                          isDone
                            ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                            : isCurrent
                            ? 'border-blue-500/50 bg-blue-950/40 text-blue-200 animate-pulse'
                            : 'border-slate-800 bg-slate-900/40 text-slate-500'
                        }`}
                      >
                        <span className="font-mono text-[9px] opacity-75">{st.num}.</span>
                        <span className="truncate">{st.name}</span>
                      </div>
                    );
                  })}
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
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 text-slate-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Globe2 className="h-4 w-4 text-blue-400" />
                  <span>12-Step Lead Intelligence Pipeline</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  100% OK
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { step: '01', name: 'Google/Discovery', desc: 'Grounds operating local businesses via Google Places & Search' },
                  { step: '02', name: 'Website Audit', desc: 'Validates HTTP/HTTPS, response speed, mobile responsiveness' },
                  { step: '03', name: 'Facebook', desc: 'Extracts official Facebook page from website HTML' },
                  { step: '04', name: 'Instagram', desc: 'Extracts official Instagram profile from website HTML' },
                  { step: '05', name: 'Contacts', desc: 'Extracts verified phone (E.164), email, address, decision-maker' },
                  { step: '06', name: 'Business Research', desc: 'Confirms company name identity and active commercial status' },
                  { step: '07', name: 'Problem', desc: 'Measures observable digital gap directly from HTML evidence' },
                  { step: '08', name: 'Evidence', desc: 'Pairs claim with verifiable URL and timestamped record' },
                  { step: '09', name: 'Opportunity', desc: 'Maps tailored agency service pitch based on technical gap' },
                  { step: '10', name: 'A/B Scoring', desc: 'Grades lead A (Prime Opportunity) or B (Viable Prospect)' },
                  { step: '11', name: 'Database', desc: 'Saves multi-tenant lead records into persistent Firestore' },
                  { step: '12', name: 'Excel Export', desc: 'Generates sanitised multi-sheet XLSX and clean CSV files' },
                ].map((p) => (
                  <div key={p.step} className="flex items-start gap-2.5 rounded-lg border border-slate-850 bg-slate-950/50 p-2">
                    <span className="font-mono text-[10px] text-blue-400 font-bold mt-0.5">{p.step}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-200 text-[11px] leading-tight">{p.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
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
