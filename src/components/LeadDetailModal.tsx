import React from 'react';
import {
  X,
  Building,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Award,
  Calendar,
  Share2,
  FileText,
  Activity,
} from 'lucide-react';
import { Lead } from '../types';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onToggleContacted: (leadId: string, currentStatus: boolean) => Promise<void>;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onToggleContacted,
}) => {
  if (!lead) return null;

  const factors = lead.scoreFactors || {
    nicheRelevance: 0,
    businessLegitimacy: 0,
    digitalOpportunity: 0,
    websiteCondition: 0,
    recentNeedSignal: 0,
    evidenceQuality: 0,
    contactCompleteness: 0,
    decisionMakerConfidence: 0,
    dataQuality: 0,
  };

  const factorList = [
    { label: 'Niche & Country Relevance', value: factors.nicheRelevance, max: 15 },
    { label: 'Business Legitimacy & Reputation', value: factors.businessLegitimacy, max: 15 },
    { label: 'Digital Opportunity Gap', value: factors.digitalOpportunity, max: 15 },
    { label: 'Website Audit Condition', value: factors.websiteCondition, max: 15 },
    { label: 'Recent Need Signal', value: factors.recentNeedSignal, max: 10 },
    { label: 'Evidence & Source Quality', value: factors.evidenceQuality, max: 10 },
    { label: 'Contact Data Completeness', value: factors.contactCompleteness, max: 10 },
    { label: 'Decision-Maker Confidence', value: factors.decisionMakerConfidence, max: 5 },
    { label: 'Traceability & Data Quality', value: factors.dataQuality, max: 5 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Top Header */}
        <div className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
                  {lead.companyName}
                </h2>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    lead.leadStrength === 'A'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  Grade {lead.leadStrength}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{lead.industry}</span>
                <span>&bull;</span>
                <span>{lead.city}, {lead.country}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleContacted(lead.id, lead.contacted)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                lead.contacted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>{lead.contacted ? 'Marked Contacted' : 'Mark as Contacted'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Business Problem */}
            <div className="rounded-xl border border-red-950/60 bg-red-950/20 p-4">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Identified Business Problem</span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed font-medium">
                {lead.businessProblem}
              </div>
            </div>

            {/* Sales Opportunity */}
            <div className="rounded-xl border border-blue-900/60 bg-blue-950/20 p-4">
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                <span>Agency Sales Opportunity</span>
              </div>
              <div className="text-xs text-blue-200 font-semibold mb-1">
                {lead.salesOpportunity}
              </div>
              <div className="text-[11px] text-slate-400">
                Directly actionable service offering matched to observed evidence.
              </div>
            </div>

            {/* Overall Score */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Composite Score</span>
                <span className="font-mono text-cyan-400 text-lg font-bold">{lead.leadScore}/100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                  style={{ width: `${lead.leadScore}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                <span>Researched: {lead.researchDate}</span>
                <span>Signal: {lead.signalDate}</span>
              </div>
            </div>
          </div>

          {/* Contact Details & Website Audit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Person & Channels */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-blue-400" />
                <span>Public Decision-Maker &amp; Contacts</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Contact Full Name:</span>
                  <span className="text-white font-medium">
                    {lead.contactFullName !== 'Not Found' ? lead.contactFullName : (
                      <span className="text-slate-500 italic">Not Found (Zero Guessing)</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Job Title / Role:</span>
                  <span className="text-slate-200">
                    {lead.jobTitle !== 'Not Found' ? lead.jobTitle : 'Not Found'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Business Email:</span>
                  <span className="text-cyan-300 font-mono">
                    {lead.businessEmail !== 'Not Found' ? lead.businessEmail : 'Not Found'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Email Status:</span>
                  <span className="text-slate-300">{lead.emailStatus}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Phone Number (Text):</span>
                  <span className="text-emerald-400 font-mono font-medium">
                    {lead.phoneNumber !== 'Not Found' ? lead.phoneNumber : 'Not Found'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400">WhatsApp Status:</span>
                  <span className={lead.whatsAppStatus === 'Yes — Evidence' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    {lead.whatsAppStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Digital Presence & Audit */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-blue-400" />
                <span>Website Audit &amp; Online Footprint</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Official Website:</span>
                  {lead.website !== 'No Website Found' ? (
                    <a
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 max-w-[200px] truncate"
                    >
                      <span className="truncate">{lead.website}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-amber-400 font-medium">No Website Found</span>
                  )}
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Website Condition:</span>
                  <span className="text-slate-200 font-medium">{lead.websiteStatus}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Full Address:</span>
                  <span className="text-slate-300 text-right max-w-[220px] truncate">{lead.fullAddress}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Commercial Verification:</span>
                  <span className="text-emerald-400 font-medium">
                    {lead.commercialVerification || 'Verified Operational Website'}
                  </span>
                </div>

                {lead.googlePlaceId && (
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Google Place Signal:</span>
                    <span className="text-slate-400 font-mono text-[11px] truncate max-w-[180px]">
                      {lead.googlePlaceId}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Recent Need Signal:</span>
                  <span className="text-slate-200">{lead.recentNeedSignal}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Social Footprint:</span>
                  <div className="flex items-center gap-2 text-slate-400">
                    {lead.facebook !== 'Not Found' && <span className="text-blue-400">FB</span>}
                    {lead.instagram !== 'Not Found' && <span className="text-pink-400">IG</span>}
                    {lead.linkedin !== 'Not Found' && <span className="text-sky-400">LI</span>}
                    {lead.facebook === 'Not Found' && lead.instagram === 'Not Found' && lead.linkedin === 'Not Found' && (
                      <span className="text-slate-500 italic">None Recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Traceable Grounding Evidence */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              <span>Traceable Research Evidence</span>
            </h3>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Observed Need Evidence:</span>
                <span className="text-[11px] text-slate-400">{lead.signalDate}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lead.needEvidence}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Source: {lead.source}</span>
                {lead.source && lead.source.startsWith('http') && (
                  <a
                    href={lead.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Grounded Source</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Transparent Score Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>Explainable Score Breakdown (Total: {lead.leadScore}/100)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {factorList.map((f) => (
                <div key={f.label} className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 truncate max-w-[170px]">{f.label}</span>
                    <span className="font-mono text-cyan-300 font-semibold">{f.value}/{f.max}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${Math.round((f.value / f.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-3 flex items-center justify-between text-xs text-slate-400">
          <span>Internal Lead ID: <code className="font-mono text-slate-500">{lead.leadId}</code></span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-semibold text-slate-200 hover:bg-slate-700"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
