import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Phone,
  Mail,
  ExternalLink,
  SlidersHorizontal,
  RefreshCw,
  MessageSquare,
  Globe,
  Scale,
  Sparkles,
  Building,
  Layers,
  BookmarkCheck,
  Bookmark,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Lead } from '../types';
import {
  buildClientBridgeWorkbook,
  generateClientBridgeCsvString,
  downloadFile,
} from '../lib/export';
import { PAKISTAN_TARGET_INDUSTRIES } from '../lib/pakistanIndustries';

interface LeadsDatabaseViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onToggleContacted: (leadId: string, currentStatus: boolean) => Promise<void>;
  onToggleReviewed?: (leadId: string, currentStatus: boolean) => Promise<void>;
  onExportXlsx: (leadsToExport: Lead[]) => void;
  onExportCsv: (leadsToExport: Lead[]) => void;
  currentRun?: import('../types').ResearchRun | null;
  totalHistoricalLeadsCount?: number;
  onShowAllHistoricalLeads?: () => void;
}

export const LeadsDatabaseView: React.FC<LeadsDatabaseViewProps> = ({
  leads,
  onSelectLead,
  onToggleContacted,
  onToggleReviewed,
  onExportXlsx,
  onExportCsv,
  currentRun,
  totalHistoricalLeadsCount,
  onShowAllHistoricalLeads,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarket, setFilterMarket] = useState<'ALL' | 'PK' | 'GB' | 'US'>('ALL');
  const [filterIndustry, setFilterIndustry] = useState<string>('ALL');
  const [filterCity, setFilterCity] = useState<string>('ALL');
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [filterOpportunityType, setFilterOpportunityType] = useState<string>('ALL');
  const [filterStrength, setFilterStrength] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [filterWebsiteStatus, setFilterWebsiteStatus] = useState<string>('ALL');
  const [filterEmailStatus, setFilterEmailStatus] = useState<string>('ALL');
  const [filterContacted, setFilterContacted] = useState<string>('ALL');
  const [filterReviewStatus, setFilterReviewStatus] = useState<string>('ALL');
  const [filterMissingWebsite, setFilterMissingWebsite] = useState(false);
  const [filterMissingBooking, setFilterMissingBooking] = useState(false);
  const [filterMissingEcommerce, setFilterMissingEcommerce] = useState(false);
  const [filterGenuineEcommerce, setFilterGenuineEcommerce] = useState(false);
  const [filterEcommerceGaps, setFilterEcommerceGaps] = useState(false);
  const [showIndustryMenu, setShowIndustryMenu] = useState(false);
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'score' | 'company' | 'date'>('score');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Selected lead IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Distinct countries in dataset
  const availableCountries = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.country) s.add(l.country);
    });
    return Array.from(s).sort();
  }, [leads]);

  // Distinct industries in dataset
  const availableIndustries = useMemo(() => {
    const s = new Set<string>();
    PAKISTAN_TARGET_INDUSTRIES.forEach((i) => s.add(i.name));
    leads.forEach((l) => {
      if (l.industry && l.industry !== 'Unknown') s.add(l.industry);
    });
    return Array.from(s).sort();
  }, [leads]);

  // Distinct cities in dataset
  const availableCities = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.city && l.city !== 'Unknown') s.add(l.city);
    });
    return Array.from(s).sort();
  }, [leads]);

  // Dedicated Client Bridge Export Handlers
  const handleExportPakistanXlsx = (leadsToExport: Lead[], title = 'Pakistan Qualified Leads') => {
    const wb = buildClientBridgeWorkbook(leadsToExport, currentRun || undefined, title);
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadFile(
      buf,
      `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  };

  const handleExportPakistanCsv = (leadsToExport: Lead[], title = 'Pakistan Qualified Leads') => {
    const csv = generateClientBridgeCsvString(leadsToExport);
    downloadFile(
      csv,
      `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handleExportByIndustry = (industryName: string) => {
    const indLeads = leads.filter((l) =>
      (l.industry || '').toLowerCase().includes(industryName.toLowerCase())
    );
    if (indLeads.length === 0) {
      alert(`No qualified leads found in current view for ${industryName}.`);
      return;
    }
    handleExportPakistanXlsx(indLeads, `${industryName} Leads`);
    setShowIndustryMenu(false);
  };

  // Filtering
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Market filter
      if (filterMarket !== 'ALL') {
        const cLower = (lead.country || '').toLowerCase();
        if (filterMarket === 'PK' && !cLower.includes('pakistan') && lead.marketCode !== 'PK') return false;
        if (filterMarket === 'GB' && !cLower.includes('united kingdom') && cLower !== 'uk' && cLower !== 'gb' && lead.marketCode !== 'GB') return false;
        if (filterMarket === 'US' && !cLower.includes('united states') && cLower !== 'us' && cLower !== 'usa' && lead.marketCode !== 'US') return false;
      }

      // Industry filter
      if (filterIndustry !== 'ALL' && lead.industry !== filterIndustry) {
        return false;
      }

      // City filter
      if (filterCity !== 'ALL' && lead.city !== filterCity) {
        return false;
      }

      // Grade filter (A+, A, B, C)
      if (filterGrade !== 'ALL') {
        const grade =
          lead.leadGrade ||
          (lead.leadScore >= 90 ? 'A+' : lead.leadScore >= 80 ? 'A' : lead.leadScore >= 65 ? 'B' : 'C');
        if (grade !== filterGrade) return false;
      }

      // Opportunity Type filter
      if (filterOpportunityType !== 'ALL' && lead.opportunityType !== filterOpportunityType) {
        return false;
      }

      // Missing Website Quick Filter
      if (filterMissingWebsite && lead.websiteStatus !== 'No Website Found') {
        return false;
      }

      // Missing Booking Quick Filter
      if (
        filterMissingBooking &&
        (lead.bookingWorkflowDetected || (lead.websiteStatus !== 'No Website Found' && !lead.opportunityType?.includes('booking')))
      ) {
        return false;
      }

      // Missing E-Commerce Quick Filter
      if (
        filterMissingEcommerce &&
        (lead.ecommerceStorefrontDetected || (lead.websiteStatus !== 'No Website Found' && !lead.opportunityType?.includes('ecommerce')))
      ) {
        return false;
      }

      // Review Status
      if (filterReviewStatus === 'reviewed' && !lead.isReviewed) return false;
      if (filterReviewStatus === 'unreviewed' && lead.isReviewed) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches =
          lead.companyName?.toLowerCase().includes(term) ||
          lead.contactFullName?.toLowerCase().includes(term) ||
          lead.city?.toLowerCase().includes(term) ||
          lead.phoneNumber?.includes(term) ||
          lead.canonicalDomain?.toLowerCase().includes(term) ||
          lead.businessProblem?.toLowerCase().includes(term) ||
          lead.salesOpportunity?.toLowerCase().includes(term) ||
          lead.recommendedService?.toLowerCase().includes(term);
        if (!matches) return false;
      }

      // Strength
      if (filterStrength !== 'ALL' && lead.leadStrength !== filterStrength) {
        return false;
      }

      // Country
      if (filterCountry !== 'ALL' && lead.country !== filterCountry) {
        return false;
      }

      // Website Status
      if (filterWebsiteStatus !== 'ALL' && lead.websiteStatus !== filterWebsiteStatus) {
        return false;
      }

      // Email Status
      if (filterEmailStatus !== 'ALL') {
        if (filterEmailStatus === 'Available' && lead.businessEmail === 'Not Found') return false;
        if (filterEmailStatus === 'Not Found' && lead.businessEmail !== 'Not Found') return false;
      }

      // Contacted
      if (filterContacted === 'contacted' && !lead.contacted) return false;
      if (filterContacted === 'uncontacted' && lead.contacted) return false;

      // Dedicated E-Commerce Filters
      if (filterGenuineEcommerce) {
        const isEcom =
          lead.isGenuineEcommerce ||
          lead.businessType === 'ecommerce_brand' ||
          lead.businessType === 'social_commerce_brand' ||
          lead.businessType === 'online_retailer' ||
          lead.businessType === 'manufacturer_with_online_sales';
        if (!isEcom) return false;
      }

      if (filterEcommerceGaps) {
        const hasGap =
          lead.opportunityType === 'ecommerce' ||
          lead.storeFunctionalityStatus === 'catalog_only_no_checkout' ||
          lead.storeFunctionalityStatus === 'dm_ordering_only' ||
          lead.storeFunctionalityStatus === 'broken_checkout' ||
          lead.websiteStatus === 'No Website Found';
        if (!hasGap) return false;
      }

      // Min Score
      if (lead.leadScore < minScore) return false;

      return true;
    });
  }, [
    leads,
    searchTerm,
    filterMarket,
    filterIndustry,
    filterCity,
    filterGrade,
    filterOpportunityType,
    filterMissingWebsite,
    filterMissingBooking,
    filterMissingEcommerce,
    filterGenuineEcommerce,
    filterEcommerceGaps,
    filterReviewStatus,
    filterStrength,
    filterCountry,
    filterWebsiteStatus,
    filterEmailStatus,
    filterContacted,
    minScore,
  ]);

  // Sorting
  const sortedLeads = useMemo(() => {
    const list = [...filteredLeads];
    list.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'score') comp = a.leadScore - b.leadScore;
      if (sortBy === 'company') comp = a.companyName.localeCompare(b.companyName);
      if (sortBy === 'date') comp = (a.researchDate || '').localeCompare(b.researchDate || '');
      return sortAsc ? comp : -comp;
    });
    return list;
  }, [filteredLeads, sortBy, sortAsc]);

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const currentPageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, page]);

  // Bulk selection handlers
  const handleSelectAllCurrent = () => {
    const next = new Set(selectedIds);
    const allSelected = currentPageItems.every((item) => next.has(item.id));
    if (allSelected) {
      currentPageItems.forEach((item) => next.delete(item.id));
    } else {
      currentPageItems.forEach((item) => next.add(item.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectedLeads = useMemo(() => {
    return leads.filter((l) => selectedIds.has(l.id));
  }, [leads, selectedIds]);

  return (
    <div className="space-y-4">
      {/* Active Run Banner when viewing specific completed or selected run */}
      {currentRun && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <span className="font-bold text-white">Active Run Results: </span>
              <span className="font-mono text-cyan-300 font-semibold">{currentRun.runId}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="text-slate-200">{currentRun.niche} in {currentRun.country} {currentRun.location ? `(${currentRun.location})` : ''}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="font-semibold text-emerald-400">{leads.length} Qualified Leads</span>
            </div>
          </div>
          {onShowAllHistoricalLeads && totalHistoricalLeadsCount !== undefined && totalHistoricalLeadsCount > leads.length && (
            <button
              onClick={onShowAllHistoricalLeads}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline cursor-pointer shrink-0"
            >
              View All Historical Leads ({totalHistoricalLeadsCount})
            </button>
          )}
        </div>
      )}

      {/* Top Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            {currentRun ? 'Fresh Leads (Current Run)' : 'Persistent Leads Database'}
          </h1>
          <p className="text-xs text-slate-400">
            {filteredLeads.length} of {leads.length} qualified leads matching active filters
          </p>
        </div>

          <div className="relative">
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPakistanXlsx(selectedLeads, 'Selected Leads')}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export Selected ({selectedIds.size}) Agency XLSX</span>
                </button>
                <button
                  onClick={() => onExportCsv(selectedLeads)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {/* Dedicated Client Bridge Pakistan 23-Col Export */}
                <button
                  onClick={() => handleExportPakistanXlsx(leads, 'Pakistan Qualified Leads')}
                  disabled={leads.length === 0}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 cursor-pointer"
                  title="Export with strict leading zeros & 23 Client Bridge columns"
                >
                  <Sparkles className="h-4 w-4 text-emerald-200" />
                  <span>Export Pakistan Agency XLSX (23-Col)</span>
                </button>

                {/* Industry Exports Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowIndustryMenu(!showIndustryMenu)}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-600/20 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-600/30 transition-all cursor-pointer"
                  >
                    <Layers className="h-4 w-4 text-blue-400" />
                    <span>Industry Export Packs</span>
                  </button>

                  {showIndustryMenu && (
                    <div className="absolute right-0 mt-2 z-50 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800">
                        Export Separate Industry Sheet
                      </div>
                      {PAKISTAN_TARGET_INDUSTRIES.map((ind) => (
                        <button
                          key={ind.id}
                          onClick={() => handleExportByIndustry(ind.name)}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between transition-colors"
                        >
                          <span className="truncate">{ind.name}</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold ml-2">
                            {leads.filter((l) => (l.industry || '').toLowerCase().includes(ind.name.toLowerCase())).length}
                          </span>
                        </button>
                      ))}
                      <div className="pt-1 border-t border-slate-800">
                        <button
                          onClick={() => {
                            handleExportPakistanXlsx(leads, 'All Pakistan Qualified Leads');
                            setShowIndustryMenu(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:bg-emerald-950/40 flex items-center justify-between"
                        >
                          <span>All Pakistan Leads</span>
                          <span className="font-mono">{leads.length}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Standard Full 30-Column Export */}
                <button
                  onClick={() => onExportXlsx(leads)}
                  disabled={leads.length === 0}
                  className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                  title="Export standard 30-column format"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                  <span>Standard 30-Col XLSX</span>
                </button>

                <button
                  onClick={() => handleExportPakistanCsv(leads)}
                  disabled={leads.length === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        {/* Market Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2.5 border-b border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            Market:
          </span>
          {[
            { id: 'ALL', label: 'All Enabled Markets' },
            { id: 'PK', label: 'Pakistan (PK)' },
            { id: 'GB', label: 'United Kingdom (GB)' },
            { id: 'US', label: 'United States (US)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterMarket(tab.id as any);
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                filterMarket === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Secondary Filter Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Industry Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Industry</label>
            <select
              value={filterIndustry}
              onChange={(e) => {
                setFilterIndustry(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Industries</option>
              {availableIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">City</label>
            <select
              value={filterCity}
              onChange={(e) => {
                setFilterCity(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Cities</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Filter (Section 6) */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Lead Grade</label>
            <select
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Grades (A+, A, B, C)</option>
              <option value="A+">Grade A+ (90-100 Exceptional)</option>
              <option value="A">Grade A (80-89 High Priority)</option>
              <option value="B">Grade B (65-79 Good Lead)</option>
              <option value="C">Grade C (50-64 Needs Research)</option>
            </select>
          </div>

          {/* Opportunity Type Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Opportunity Type</label>
            <select
              value={filterOpportunityType}
              onChange={(e) => {
                setFilterOpportunityType(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Opportunity Types</option>
              <option value="new_website">New Website</option>
              <option value="website_redesign">Website Redesign</option>
              <option value="booking_system">Booking System</option>
              <option value="property_portal">Property Portal</option>
              <option value="ecommerce">E-Commerce Store</option>
              <option value="student_portal">Student Portal</option>
              <option value="mobile_app">Mobile App</option>
              <option value="crm">Lead CRM</option>
              <option value="seo">SEO</option>
              <option value="digital_marketing">Digital Marketing</option>
            </select>
          </div>

          {/* Website Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Website Status</label>
            <select
              value={filterWebsiteStatus}
              onChange={(e) => {
                setFilterWebsiteStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Website Status</option>
              <option value="No Website Found">No Website Found</option>
              <option value="Active but Weak">Active but Weak</option>
              <option value="Outdated Indicators">Outdated Indicators</option>
              <option value="Broken">Broken</option>
              <option value="Unreachable">Unreachable</option>
              <option value="Active">Active Modern</option>
            </select>
          </div>

          {/* Review Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Review Status</label>
            <select
              value={filterReviewStatus}
              onChange={(e) => {
                setFilterReviewStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Review Status</option>
              <option value="reviewed">Reviewed Only</option>
              <option value="unreviewed">Unreviewed Only</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
          <span className="text-[10px] uppercase font-bold text-slate-400">Quick Need Gaps:</span>
          <button
            onClick={() => setFilterMissingWebsite(!filterMissingWebsite)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
              filterMissingWebsite
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
            }`}
          >
            No Official Website
          </button>
          <button
            onClick={() => setFilterMissingBooking(!filterMissingBooking)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
              filterMissingBooking
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
            }`}
          >
            Missing Booking System
          </button>
          <button
            onClick={() => setFilterMissingEcommerce(!filterMissingEcommerce)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
              filterMissingEcommerce
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
            }`}
          >
            Missing E-Commerce Store
          </button>
          <button
            onClick={() => setFilterGenuineEcommerce(!filterGenuineEcommerce)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
              filterGenuineEcommerce
                ? 'bg-purple-600/40 text-purple-200 border border-purple-500/60 shadow-sm shadow-purple-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
            }`}
          >
            Genuine E-Commerce Brands
          </button>
          <button
            onClick={() => setFilterEcommerceGaps(!filterEcommerceGaps)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
              filterEcommerceGaps
                ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/60 shadow-sm shadow-indigo-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
            }`}
          >
            Store / Website Gaps Only
          </button>
          {(filterIndustry !== 'ALL' || filterCity !== 'ALL' || filterGrade !== 'ALL' || filterOpportunityType !== 'ALL' || filterMissingWebsite || filterMissingBooking || filterMissingEcommerce || filterGenuineEcommerce || filterEcommerceGaps) && (
            <button
              onClick={() => {
                setFilterIndustry('ALL');
                setFilterCity('ALL');
                setFilterGrade('ALL');
                setFilterOpportunityType('ALL');
                setFilterMissingWebsite(false);
                setFilterMissingBooking(false);
                setFilterMissingEcommerce(false);
                setFilterGenuineEcommerce(false);
                setFilterEcommerceGaps(false);
                setPage(1);
              }}
              className="text-[11px] text-blue-400 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by company, contact, city, phone, domain, problem..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Strength */}
            <select
              value={filterStrength}
              onChange={(e) => {
                setFilterStrength(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Strengths (A &amp; B)</option>
              <option value="A">Grade A Only</option>
              <option value="B">Grade B Only</option>
            </select>

            {/* Country */}
            <select
              value={filterCountry}
              onChange={(e) => {
                setFilterCountry(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Email Status */}
            <select
              value={filterEmailStatus}
              onChange={(e) => {
                setFilterEmailStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Email Status</option>
              <option value="Available">Email Found</option>
              <option value="Not Found">Email Not Found</option>
            </select>

            {/* Contacted Filter */}
            <select
              value={filterContacted}
              onChange={(e) => {
                setFilterContacted(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Contact States</option>
              <option value="uncontacted">Fresh / Uncontacted</option>
              <option value="contacted">Contacted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-8">
                  <button
                    onClick={handleSelectAllCurrent}
                    className="text-slate-400 hover:text-white"
                  >
                    {currentPageItems.length > 0 &&
                    currentPageItems.every((item) => selectedIds.has(item.id)) ? (
                      <CheckSquare className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Company &amp; Domain</th>
                <th className="py-3 px-3">Contact Person</th>
                <th className="py-3 px-3">Phone (Text)</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Website &amp; Socials</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Opportunity &amp; Problem</th>
                <th className="py-3 px-3 text-center">Score &amp; Grade</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {currentPageItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 text-xs">
                    No leads found matching current criteria.
                  </td>
                </tr>
              ) : (
                currentPageItems.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);
                  const displayGrade =
                    lead.leadGrade ||
                    (lead.leadScore >= 90
                      ? 'A+'
                      : lead.leadScore >= 80
                      ? 'A'
                      : lead.leadScore >= 65
                      ? 'B'
                      : 'C');
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleSelectOne(lead.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Company Name & Domain */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                              (lead.country || '').toLowerCase().includes('united kingdom') || lead.marketCode === 'GB'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : (lead.country || '').toLowerCase().includes('united states') || lead.marketCode === 'US'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {lead.marketCode ||
                              ((lead.country || '').toLowerCase().includes('united kingdom')
                                ? 'GB'
                                : (lead.country || '').toLowerCase().includes('united states')
                                ? 'US'
                                : 'PK')}
                          </span>
                          <div className="font-semibold text-white truncate max-w-[160px]">
                            {lead.companyName}
                          </div>
                        </div>

                        {/* Subcategory or Industry */}
                        {lead.subcategory && (
                          <div className="mt-1">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800 text-teal-300 border border-slate-700/60 truncate max-w-[170px]">
                              {lead.subcategory}
                            </span>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px] mt-0.5">
                          {lead.canonicalDomain || 'No domain'}
                        </div>

                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {lead.verificationStatus && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${
                                lead.verificationStatus === 'Verified'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {lead.verificationStatus}
                            </span>
                          )}
                          {lead.complianceReviewStatus && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-medium ${
                                lead.complianceReviewStatus.includes('PECR')
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : lead.complianceReviewStatus.includes('CAN-SPAM')
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {lead.complianceReviewStatus}
                            </span>
                          )}
                          {lead.businessType && lead.businessType !== 'unknown_business_type' && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${
                                lead.businessType === 'ecommerce_brand'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : lead.businessType === 'social_commerce_brand'
                                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                                  : lead.businessType === 'online_retailer'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              {lead.businessType === 'ecommerce_brand'
                                ? 'E-Com Brand'
                                : lead.businessType === 'social_commerce_brand'
                                ? 'Social Seller'
                                : lead.businessType === 'online_retailer'
                                ? 'Online Retailer'
                                : 'D2C Maker'}
                            </span>
                          )}
                          {lead.storeFunctionalityStatus && lead.storeFunctionalityStatus !== 'not_tested' && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-medium ${
                                lead.storeFunctionalityStatus === 'catalog_only_no_checkout'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : lead.storeFunctionalityStatus === 'dm_ordering_only'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : lead.storeFunctionalityStatus === 'broken_checkout'
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                  : lead.storeFunctionalityStatus === 'no_store'
                                  ? 'bg-slate-700/50 text-slate-300 border border-slate-600/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {lead.storeFunctionalityStatus === 'catalog_only_no_checkout'
                                ? 'Catalog (No Cart)'
                                : lead.storeFunctionalityStatus === 'dm_ordering_only'
                                ? 'DM Orders'
                                : lead.storeFunctionalityStatus === 'broken_checkout'
                                ? 'Broken Cart'
                                : lead.storeFunctionalityStatus === 'no_store'
                                ? 'No Store'
                                : 'Full Store'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact Person */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">
                          {lead.contactFullName !== 'Not Found' ? lead.contactFullName : (
                            <span className="text-slate-500 italic">Unlisted</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                          {lead.jobTitle !== 'Not Found' ? lead.jobTitle : ''}
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="py-3 px-3">
                        {lead.phoneNumber !== 'Not Found' ? (
                          <div>
                            <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-semibold">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{lead.phoneNumber}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {(() => {
                                const cleanDigits = lead.phoneNumber.replace(/\D/g, '');
                                let wa = cleanDigits;
                                if (cleanDigits.startsWith('03') && cleanDigits.length === 11) {
                                  wa = '92' + cleanDigits.substring(1);
                                } else if (cleanDigits.startsWith('0092')) {
                                  wa = cleanDigits.substring(2);
                                } else if (cleanDigits.startsWith('021') || cleanDigits.startsWith('042') || cleanDigits.startsWith('051')) {
                                  wa = '92' + cleanDigits.substring(1);
                                }
                                return wa ? (
                                  <a
                                    href={`https://wa.me/${wa}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 transition-colors"
                                    title="Open WhatsApp chat"
                                  >
                                    <MessageSquare className="h-2.5 w-2.5" />
                                    <span>WhatsApp</span>
                                  </a>
                                ) : null;
                              })()}
                              {lead.phoneAccuracyStatus && (
                                <span className="text-[8px] font-mono text-slate-400 px-1 py-0.2 rounded bg-slate-800">
                                  {lead.phoneAccuracyStatus.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Not Found</span>
                        )}
                      </td>

                      {/* Business Email */}
                      <td className="py-3 px-3">
                        {lead.businessEmail !== 'Not Found' ? (
                          <div>
                            <div className="flex items-center gap-1 text-[11px] text-cyan-300 truncate max-w-[160px]">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{lead.businessEmail}</span>
                            </div>
                            {lead.emailAccuracyStatus && (
                              <div className="mt-0.5">
                                <span className="text-[8px] font-mono text-cyan-400/80 px-1 py-0.2 rounded bg-cyan-950/40 border border-cyan-800/30">
                                  {lead.emailAccuracyStatus.replace(/_/g, ' ')}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Not Found</span>
                        )}
                      </td>

                      {/* Website & Socials */}
                      <td className="py-3 px-3">
                        {lead.website !== 'No Website Found' ? (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline truncate max-w-[140px]"
                          >
                            <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-amber-400/90 font-medium">
                            No Website Found
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                          <span className="text-slate-500">{lead.websiteStatus}</span>
                          {lead.facebook !== 'Not Found' && (
                            <a
                              href={lead.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 font-bold text-[9px] px-1 bg-indigo-950/60 rounded border border-indigo-800/40"
                              title="Verified Facebook"
                            >
                              FB
                            </a>
                          )}
                          {lead.instagram !== 'Not Found' && (
                            <a
                              href={lead.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-400 hover:text-pink-300 font-bold text-[9px] px-1 bg-pink-950/60 rounded border border-pink-800/40"
                              title="Verified Instagram"
                            >
                              IG
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3">
                        <div className="text-slate-300 truncate max-w-[120px]">
                          {lead.area ? `${lead.area}, ` : ''}{lead.city}
                        </div>
                        <div className="text-[10px] text-slate-500">{lead.country}</div>
                      </td>

                      {/* Opportunity & Problem */}
                      <td className="py-3 px-3">
                        {lead.opportunityType && (
                          <div className="mb-1">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {lead.opportunityType.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                        {lead.recommendedService && (
                          <div className="text-emerald-400 font-semibold text-[11px] truncate max-w-[180px]">
                            {lead.recommendedService}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                          {lead.identifiedProblem || lead.businessProblem || lead.salesOpportunity}
                        </div>
                      </td>

                      {/* Score & Grade */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                              displayGrade === 'A+'
                                ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-400/60 font-extrabold shadow-sm shadow-emerald-500/20'
                                : displayGrade === 'A'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : displayGrade === 'B'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            Grade {displayGrade}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                              (lead.opportunityTier || (lead.leadScore >= 75 ? 'High' : lead.leadScore >= 55 ? 'Medium' : 'Low')) === 'High'
                                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                : (lead.opportunityTier || (lead.leadScore >= 75 ? 'High' : lead.leadScore >= 55 ? 'Medium' : 'Low')) === 'Medium'
                                ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                                : 'text-slate-400 bg-slate-800 border border-slate-700'
                            }`}
                          >
                            {lead.opportunityTier || (lead.leadScore >= 75 ? 'High' : lead.leadScore >= 55 ? 'Medium' : 'Low')}
                          </span>
                          <div className="mt-0.5 font-mono text-[11px] text-cyan-400 font-semibold">
                            {lead.leadScore}/100
                          </div>
                        </div>
                      </td>

                      {/* Status (Review & Contacted) */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Review Toggle */}
                          <button
                            onClick={() => onToggleReviewed && onToggleReviewed(lead.id, !!lead.isReviewed)}
                            className={`rounded-lg p-1.5 text-xs transition-colors cursor-pointer ${
                              lead.isReviewed
                                ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30'
                                : 'text-slate-500 hover:text-slate-300 bg-slate-800/40 border border-slate-700/30'
                            }`}
                            title={lead.isReviewed ? 'Lead Reviewed (Click to unmark)' : 'Mark as Reviewed'}
                          >
                            {lead.isReviewed ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                          </button>

                          {/* Contacted Toggle */}
                          <button
                            onClick={() => onToggleContacted(lead.id, lead.contacted)}
                            className={`rounded-lg p-1.5 text-xs transition-colors cursor-pointer ${
                              lead.contacted
                                ? 'text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30'
                                : 'text-slate-500 hover:text-slate-300 bg-slate-800/40 border border-slate-700/30'
                            }`}
                            title={lead.contacted ? 'Contacted (Click to unmark)' : 'Mark as Contacted'}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
          <div>
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, sortedLeads.length)} of {sortedLeads.length} leads
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg p-1 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg p-1 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
