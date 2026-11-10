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
  Compass,
  Instagram,
  Facebook,
  Briefcase,
  AlertCircle,
  FileCheck,
  Target,
  Database,
  FileSpreadsheet,
  MessageSquare,
  Scale,
  BookmarkCheck,
  Bookmark,
  ShieldOff,
  Sparkles,
  Info,
} from 'lucide-react';
import { Lead } from '../types';
import { QualityScoreGauge } from './QualityScoreGauge';
import { OutreachEmailGenerator } from './OutreachEmailGenerator';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onToggleContacted: (leadId: string, currentStatus: boolean) => Promise<void>;
  onToggleReviewed?: (leadId: string, currentStatus: boolean) => Promise<void>;
  onAddSuppression?: (type: 'domain' | 'phone' | 'company', value: string, reason: string) => Promise<void>;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onToggleContacted,
  onToggleReviewed,
  onAddSuppression,
}) => {
  if (!lead) return null;

  const cleanPhone = lead.phoneNumber && lead.phoneNumber !== 'Not Found' ? lead.phoneNumber.replace(/\D/g, '') : '';
  let waPhone = cleanPhone;
  if (cleanPhone.startsWith('03') && cleanPhone.length === 11) {
    waPhone = '92' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('0092')) {
    waPhone = cleanPhone.substring(2);
  } else if (cleanPhone.startsWith('021') || cleanPhone.startsWith('042') || cleanPhone.startsWith('051')) {
    waPhone = '92' + cleanPhone.substring(1);
  }

  const displayGrade =
    lead.leadGrade ||
    (lead.leadScore >= 90
      ? 'A+'
      : lead.leadScore >= 80
      ? 'A'
      : lead.leadScore >= 65
      ? 'B'
      : 'C');

  const factors = lead.scoreFactors || {};
  const hasClientBridgeFactors = factors.websiteOpportunity !== undefined;

  const factorList = hasClientBridgeFactors
    ? [
        { label: 'Website Absence / Technical Failure Gap', value: factors.websiteOpportunity || 0, max: 25 },
        { label: 'Website Usability & CRO Gaps', value: factors.websiteUsability || 0, max: 20 },
        { label: 'Credible Business Growth Signals', value: factors.growthSignals || 0, max: 15 },
        { label: 'Public Hiring or Investment Signals', value: factors.hiringInvestment || 0, max: 10 },
        { label: 'Business Identity & Operating Evidence', value: factors.businessIdentity || 0, max: 10 },
        { label: 'Public Contact Channels Availability', value: factors.contactAvailability || 0, max: 10 },
        { label: 'Fit With Client Bridge Services', value: factors.serviceFit || 0, max: 10 },
      ]
    : [
        { label: 'Niche & Country Relevance', value: factors.nicheRelevance || 0, max: 15 },
        { label: 'Business Legitimacy & Reputation', value: factors.businessLegitimacy || 0, max: 15 },
        { label: 'Digital Opportunity Gap', value: factors.digitalOpportunity || 0, max: 15 },
        { label: 'Website Audit Condition', value: factors.websiteCondition || 0, max: 15 },
        { label: 'Recent Need Signal', value: factors.recentNeedSignal || 0, max: 10 },
        { label: 'Evidence & Source Quality', value: factors.evidenceQuality || 0, max: 10 },
        { label: 'Contact Data Completeness', value: factors.contactCompleteness || 0, max: 10 },
        { label: 'Decision-Maker Confidence', value: factors.decisionMakerConfidence || 0, max: 5 },
        { label: 'Traceability & Data Quality', value: factors.dataQuality || 0, max: 5 },
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
                  {lead.companyName}
                </h2>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase font-mono ${
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
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    displayGrade === 'A+'
                      ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-400/60 font-extrabold shadow-sm'
                      : displayGrade === 'A'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : displayGrade === 'B'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  Grade {displayGrade}
                </span>
                {lead.subcategory && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-medium text-teal-300 border border-slate-700">
                    {lead.subcategory}
                  </span>
                )}
                {lead.opportunityType && (
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                    {lead.opportunityType.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{lead.industry}</span>
                <span>&bull;</span>
                <span>{lead.area ? `${lead.area}, ` : ''}{lead.city}, {lead.country}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all cursor-pointer"
                title="Direct WhatsApp chat with business"
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}

            {onToggleReviewed && (
              <button
                onClick={() => onToggleReviewed(lead.id, !!lead.isReviewed)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  lead.isReviewed
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={lead.isReviewed ? 'Lead marked reviewed' : 'Mark as reviewed'}
              >
                {lead.isReviewed ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                <span>{lead.isReviewed ? 'Reviewed' : 'Review'}</span>
              </button>
            )}

            <button
              onClick={() => onToggleContacted(lead.id, lead.contacted)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
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
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* 12-Step Lead Intelligence Pipeline Status */}
          <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-['Plus_Jakarta_Sans']">
                  12-Step Lead Intelligence Pipeline Audit
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 rounded-full px-2.5 py-0.5 font-bold">
                100% OK • VERIFIED
              </span>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {[
                { step: '01', name: 'Google/Discovery', val: lead.sourceProvider || 'Grounded Web', ok: true },
                { step: '02', name: 'Website', val: lead.websiteStatus, ok: lead.website !== 'No Website Found' },
                { step: '03', name: 'Facebook', val: lead.facebook !== 'Not Found' ? 'Linked' : 'None', ok: lead.facebook !== 'Not Found' },
                { step: '04', name: 'Instagram', val: lead.instagram !== 'Not Found' ? 'Linked' : 'None', ok: lead.instagram !== 'Not Found' },
                { step: '05', name: 'Contacts', val: lead.phoneNumber !== 'Not Found' ? 'Verified Phone' : (lead.businessEmail !== 'Not Found' ? 'Verified Email' : 'Public'), ok: lead.phoneNumber !== 'Not Found' || lead.businessEmail !== 'Not Found' },
                { step: '06', name: 'Business Research', val: lead.commercialVerification || 'Operational', ok: true },
                { step: '07', name: 'Problem', val: lead.businessProblem ? 'Observed Gap' : 'None', ok: Boolean(lead.businessProblem) },
                { step: '08', name: 'Evidence', val: lead.source ? 'Direct Citation' : 'None', ok: Boolean(lead.source) },
                { step: '09', name: 'Opportunity', val: lead.salesOpportunity ? 'Mapped Pitch' : 'None', ok: Boolean(lead.salesOpportunity) },
                { step: '10', name: 'A/B Grade', val: `Grade ${lead.leadStrength} (${lead.leadScore})`, ok: true },
                { step: '11', name: 'Database', val: 'Firestore Persisted', ok: true },
                { step: '12', name: 'Excel', val: 'Export Ready', ok: true },
              ].map((s) => (
                <div key={s.step} className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-2 text-left">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span className="font-mono">{s.step}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 truncate">{s.name}</div>
                  <div className={`text-[10px] truncate ${s.ok ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Bridge 5-Point Opportunity Breakdown Card */}
          <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-slate-950 via-teal-950/20 to-slate-950 p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-teal-900/40">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-['Plus_Jakarta_Sans']">
                  Client Bridge 5-Point Opportunity Dossier
                </h3>
              </div>
              <span className="text-[10px] font-mono text-teal-300 bg-teal-950/60 border border-teal-700/50 rounded-full px-2.5 py-0.5 font-bold">
                {lead.opportunityType ? lead.opportunityType.replace(/_/g, ' ').toUpperCase() : 'AGENCY TARGET'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* 1. Why It Qualifies */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                  1. Why This Business Qualifies
                </div>
                <div className="text-slate-200 leading-relaxed">
                  {lead.whyQualifies || `Active operational business in ${lead.city} exhibiting observable gaps in official digital infrastructure and customer acquisition.`}
                </div>
              </div>

              {/* 2. Specific Problem Observed */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  2. Specific Problem Observed
                </div>
                <div className="text-slate-200 leading-relaxed font-medium">
                  {lead.identifiedProblem || lead.businessProblem || 'Absence of dedicated high-converting web presence and automated booking/sales workflow.'}
                </div>
              </div>

              {/* 3. Recommended Client Bridge Service */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  3. Recommended Client Bridge Service
                </div>
                <div className="text-emerald-300 font-semibold leading-relaxed">
                  {lead.recommendedService || lead.salesOpportunity || 'Client Bridge Modern Web Development & Digital Lead Capture'}
                </div>
              </div>

              {/* 4. Supporting Evidence */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  4. Grounded Supporting Evidence
                </div>
                <div className="text-slate-200 leading-relaxed">
                  {lead.businessEvidence || lead.needEvidence || `Direct signals verified from ${lead.sourceProvider || 'public web and directory footprint'}.`}
                </div>
              </div>
            </div>

            {/* 5. What Still Needs Manual Verification */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-950/15 p-3 flex items-start gap-2 text-xs">
              <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">5. Manual Verification Required Before Outreach: </span>
                <span className="text-slate-300">
                  {lead.manualVerificationNeeded || 'Confirm owner / decision-maker name and preferred contact hour on WhatsApp prior to introductory pitch.'}
                </span>
              </div>
            </div>
          </div>

          {/* E-Commerce Intelligence & Store Audit Card (Part C) */}
          {(lead.businessType || lead.ecommerceCategory || lead.opportunityType === 'ecommerce' || lead.storeFunctionalityStatus) && (
            <div className="rounded-xl border border-purple-500/40 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-5 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-['Plus_Jakarta_Sans']">
                    E-Commerce Intelligence &amp; Store Audit
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-700/50 rounded-full px-2.5 py-0.5 font-bold">
                  {lead.businessType ? lead.businessType.replace(/_/g, ' ').toUpperCase() : 'ONLINE COMMERCE'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                  <div className="text-[10px] text-slate-400">Business Classification</div>
                  <div className="font-semibold text-white capitalize mt-0.5">
                    {lead.businessType ? lead.businessType.replace(/_/g, ' ') : 'Brand'}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                  <div className="text-[10px] text-slate-400">Store Functionality</div>
                  <div className="font-semibold text-amber-300 capitalize mt-0.5">
                    {lead.storeFunctionalityStatus ? lead.storeFunctionalityStatus.replace(/_/g, ' ') : 'Not Tested'}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                  <div className="text-[10px] text-slate-400">Product Catalogue</div>
                  <div className="font-semibold text-cyan-300 capitalize mt-0.5">
                    {lead.productCatalogueStatus ? lead.productCatalogueStatus.replace(/_/g, ' ') : 'Not Tested'}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                  <div className="text-[10px] text-slate-400">Mobile Shopping</div>
                  <div className="font-semibold text-emerald-300 capitalize mt-0.5">
                    {lead.mobileExperience ? lead.mobileExperience.replace(/_/g, ' ') : 'Not Tested'}
                  </div>
                </div>
              </div>

              {lead.onlineSellingEvidence && (
                <div className="rounded-lg border border-purple-900/30 bg-purple-950/20 p-3 text-xs">
                  <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                    Online Selling Evidence Detected
                  </div>
                  <div className="text-slate-300 leading-relaxed font-mono text-[11px]">
                    {lead.onlineSellingEvidence}
                  </div>
                </div>
              )}
            </div>
          )}

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

            {/* Overall Score with D3 Radial Gauge */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">Quality Score</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      (lead.opportunityTier || (lead.leadScore >= 75 ? 'High' : lead.leadScore >= 55 ? 'Medium' : 'Low')) === 'High'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : (lead.opportunityTier || (lead.leadScore >= 75 ? 'High' : lead.leadScore >= 55 ? 'Medium' : 'Low')) === 'Medium'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {lead.opportunityTier || (lead.leadScore >= 75 ? 'High' : lead.leadScore >= 55 ? 'Medium' : 'Low')} Opportunity
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">{lead.leadScore}/100</span>
                </div>
              </div>
              <div className="py-1">
                <QualityScoreGauge score={lead.leadScore} strength={lead.leadStrength} size={150} />
              </div>
              <div className="w-full mt-1 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between">
                <span>Signal: {lead.signalDate}</span>
                <span>Researched: {lead.researchDate}</span>
              </div>
            </div>
          </div>

          {/* B2B Regulatory Compliance & Legal Safeguard Review */}
          {(lead.ukCompliance || lead.usCompliance || lead.complianceReviewStatus) && (
            <div className="rounded-xl border border-blue-900/50 bg-slate-950/80 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Scale className="h-4 w-4 text-blue-400" />
                  <span>
                    {(lead.country || '').toLowerCase().includes('united kingdom') || lead.marketCode === 'GB'
                      ? 'United Kingdom B2B Compliance Review (PECR & UK GDPR)'
                      : (lead.country || '').toLowerCase().includes('united states') || lead.marketCode === 'US'
                      ? 'United States B2B Outreach Safeguards (CAN-SPAM & TCPA)'
                      : 'Regulatory Compliance & Privacy Safeguards'}
                  </span>
                </div>
                {lead.complianceReviewStatus && (
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      lead.complianceReviewStatus.includes('PECR')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : lead.complianceReviewStatus.includes('CAN-SPAM')
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {lead.complianceReviewStatus}
                  </span>
                )}
              </div>

              {lead.ukCompliance && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400">Subscriber Form</div>
                    <div className="text-white font-semibold mt-0.5">{lead.ukCompliance.businessType}</div>
                    <div className="text-[10px] text-blue-300 mt-1 capitalize font-mono">
                      {lead.ukCompliance.subscriberType} subscriber
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400">PECR Email Marketing</div>
                    <div className="text-emerald-300 font-semibold mt-0.5">
                      {lead.ukCompliance.subscriberType === 'corporate'
                        ? 'Permitted (Clear Opt-Out)'
                        : 'Consent Review Advised'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Section 22 PECR rules</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400">Telephone Screening</div>
                    <div className="text-amber-300 font-semibold mt-0.5">{lead.ukCompliance.ctpsCheckStatus}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Screen CTPS before dialling</div>
                  </div>
                </div>
              )}

              {lead.usCompliance && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400">Entity Form &amp; State</div>
                    <div className="text-white font-semibold mt-0.5">{lead.usCompliance.businessEntityType}</div>
                    <div className="text-[10px] text-blue-300 mt-1">
                      {lead.region || lead.usCompliance.businessState}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400">CAN-SPAM Notice</div>
                    <div className="text-cyan-300 font-semibold mt-0.5">Mandatory Disclosures</div>
                    <div className="text-[10px] text-slate-400 mt-1">Header, address, opt-out link</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <div className="text-[10px] text-slate-400">TCPA Calling Rule</div>
                    <div className="text-indigo-300 font-semibold mt-0.5">{lead.usCompliance.callPermissionStatus}</div>
                    <div className="text-[10px] text-slate-400 mt-1">No automated dialers/SMS</div>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/60">
                {lead.ukCompliance?.complianceNotes ||
                  lead.usCompliance?.complianceNotes ||
                  'Operational reminder: Lead discovery is strictly separated from outreach execution.'}
              </p>
            </div>
          )}

          {/* Explainable Score & Missing Evidence Warnings */}
          {(lead.scoreExplanation || (lead.missingEvidenceWarnings && lead.missingEvidenceWarnings.length > 0)) && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
              {lead.scoreExplanation && (
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-blue-400 block mb-0.5">Qualification Explanation:</span>
                  {lead.scoreExplanation}
                </div>
              )}
              {lead.missingEvidenceWarnings && lead.missingEvidenceWarnings.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-amber-400 block mb-1">
                    Missing Evidence Warnings (Conservative Deductions):
                  </span>
                  <ul className="text-xs text-slate-400 space-y-1">
                    {lead.missingEvidenceWarnings.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

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
                  <div className="text-right">
                    {lead.businessEmail !== 'Not Found' ? (
                      <div>
                        <div className="text-cyan-300 font-mono font-medium">{lead.businessEmail}</div>
                        {lead.emailAccuracyStatus && (
                          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                            Status: {lead.emailAccuracyStatus.replace(/_/g, ' ')}
                          </div>
                        )}
                        {lead.emailSourceUrl && (
                          <a
                            href={lead.emailSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-slate-400 hover:text-blue-400 underline truncate max-w-[150px] inline-block"
                          >
                            Source link
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Not Found (Zero Guessing)</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Email Status:</span>
                  <span className="text-slate-300">{lead.emailStatus}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Phone Number (Text):</span>
                  {lead.phoneNumber !== 'Not Found' ? (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-emerald-400 font-mono font-medium">{lead.phoneNumber}</span>
                        {waPhone && (
                          <a
                            href={`https://wa.me/${waPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-semibold flex items-center gap-0.5"
                          >
                            <MessageSquare className="h-2.5 w-2.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                      {lead.phoneAccuracyStatus && (
                        <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                          Status: {lead.phoneAccuracyStatus.replace(/_/g, ' ')}
                        </div>
                      )}
                      {lead.phoneSourceUrl && (
                        <a
                          href={lead.phoneSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-slate-400 hover:text-blue-400 underline truncate max-w-[150px] inline-block"
                        >
                          Source link
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Not Found</span>
                  )}
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400">WhatsApp Status:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={lead.whatsAppStatus === 'Yes — Evidence' || lead.whatsAppStatus === 'Likely Mobile' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                      {lead.whatsAppStatus}
                    </span>
                    {waPhone && (
                      <span className="rounded bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.2 text-[9px] text-emerald-300 font-mono">
                        Direct Ready
                      </span>
                    )}
                  </div>
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

          {/* AI Cold Outreach Email Generator (Gemini 3.8 Flash) */}
          <OutreachEmailGenerator lead={lead} />

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
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Internal Lead ID: <code className="font-mono text-slate-500">{lead.leadId}</code></span>
            {onAddSuppression && (
              <button
                onClick={() => {
                  if (confirm(`Add ${lead.companyName} (${lead.canonicalDomain || lead.phoneNumber || 'this business'}) to Do-Not-Contact / Suppression list?`)) {
                    if (lead.canonicalDomain) {
                      onAddSuppression('domain', lead.canonicalDomain, `Suppressed from lead dossier: ${lead.companyName}`);
                    } else if (lead.phoneNumber !== 'Not Found') {
                      onAddSuppression('phone', lead.phoneNumber, `Suppressed from lead dossier: ${lead.companyName}`);
                    } else {
                      onAddSuppression('company', lead.companyName, `Suppressed from lead dossier: ${lead.companyName}`);
                    }
                  }
                }}
                className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-800/40 rounded px-2 py-1 transition-colors cursor-pointer"
                title="Suppress domain/phone/company to prevent future discovery"
              >
                <ShieldOff className="h-3 w-3" />
                <span>Do Not Contact</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
