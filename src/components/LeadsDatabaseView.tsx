import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Lead } from '../types';

interface LeadsDatabaseViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onToggleContacted: (leadId: string, currentStatus: boolean) => Promise<void>;
  onExportXlsx: (leadsToExport: Lead[]) => void;
  onExportCsv: (leadsToExport: Lead[]) => void;
}

export const LeadsDatabaseView: React.FC<LeadsDatabaseViewProps> = ({
  leads,
  onSelectLead,
  onToggleContacted,
  onExportXlsx,
  onExportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrength, setFilterStrength] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [filterWebsiteStatus, setFilterWebsiteStatus] = useState<string>('ALL');
  const [filterEmailStatus, setFilterEmailStatus] = useState<string>('ALL');
  const [filterContacted, setFilterContacted] = useState<string>('ALL');
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

  // Filtering
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
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
          lead.salesOpportunity?.toLowerCase().includes(term);
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

      // Min Score
      if (lead.leadScore < minScore) return false;

      return true;
    });
  }, [
    leads,
    searchTerm,
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
      {/* Top Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Persistent Leads Database
          </h1>
          <p className="text-xs text-slate-400">
            {filteredLeads.length} of {leads.length} qualified leads matching active filters
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <>
              <button
                onClick={() => onExportXlsx(selectedLeads)}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Selected ({selectedIds.size}) XLSX</span>
              </button>
              <button
                onClick={() => onExportCsv(selectedLeads)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onExportXlsx(leads)}
                disabled={leads.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export All ({leads.length}) XLSX</span>
              </button>
              <button
                onClick={() => onExportCsv(leads)}
                disabled={leads.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
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
                <th className="py-3 px-3">Website &amp; Status</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Problem &amp; Opportunity</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-3 text-center">Contacted</th>
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

                      {/* Company Name */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white truncate max-w-[180px]">
                          {lead.companyName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                          {lead.canonicalDomain || 'No domain'}
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
                          <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{lead.phoneNumber}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Not Found</span>
                        )}
                        {lead.whatsAppStatus === 'Yes — Evidence' && (
                          <span className="inline-block mt-0.5 rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-300">
                            WhatsApp
                          </span>
                        )}
                      </td>

                      {/* Business Email */}
                      <td className="py-3 px-3">
                        {lead.businessEmail !== 'Not Found' ? (
                          <div className="flex items-center gap-1 text-[11px] text-cyan-300 truncate max-w-[160px]">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{lead.businessEmail}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Not Found</span>
                        )}
                      </td>

                      {/* Website & Status */}
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
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {lead.websiteStatus}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3">
                        <div className="text-slate-300 truncate max-w-[120px]">{lead.city}</div>
                        <div className="text-[10px] text-slate-500">{lead.country}</div>
                      </td>

                      {/* Problem & Opportunity */}
                      <td className="py-3 px-3">
                        <div className="text-indigo-300 font-medium text-[11px] truncate max-w-[180px]">
                          {lead.salesOpportunity}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {lead.businessProblem}
                        </div>
                      </td>

                      {/* Score & Strength */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            lead.leadStrength === 'A'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          Grade {lead.leadStrength}
                        </span>
                        <div className="mt-0.5 font-mono text-[11px] text-cyan-400 font-semibold">
                          {lead.leadScore}
                        </div>
                      </td>

                      {/* Contacted Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onToggleContacted(lead.id, lead.contacted)}
                          className={`rounded-lg p-1.5 text-xs transition-colors ${
                            lead.contacted
                              ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                              : 'text-slate-500 hover:text-slate-300 bg-slate-800/40'
                          }`}
                          title={lead.contacted ? 'Mark Uncontacted' : 'Mark as Contacted'}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
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
