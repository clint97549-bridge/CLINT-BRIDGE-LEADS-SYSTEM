/**
 * OutreachEmailGenerator.tsx
 * Gemini 3.8 Flash-powered personalized B2B cold email template generator.
 * Deeply grounds email copy in lead's real observable digital problem,
 * sales opportunity, contact name, and location.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  Copy,
  Check,
  Send,
  RefreshCw,
  Sliders,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Lead } from '../types';
import { getApiUrl } from '../lib/apiConfig';
import { OutreachTemplateOption } from '../services/outreachService';

interface OutreachEmailGeneratorProps {
  lead: Lead;
}

export const OutreachEmailGenerator: React.FC<OutreachEmailGeneratorProps> = ({ lead }) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<OutreachTemplateOption[] | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [tone, setTone] = useState<'Consultative & Friendly' | 'Professional & Direct' | 'Executive & Concise'>(
    'Consultative & Friendly'
  );
  const [senderName, setSenderName] = useState(() => localStorage.getItem('leadpulse_sender_name') || '');
  const [senderAgency, setSenderAgency] = useState(() => localStorage.getItem('leadpulse_sender_agency') || '');
  const [showConfig, setShowConfig] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Store user sender preferences for reuse
      if (senderName) localStorage.setItem('leadpulse_sender_name', senderName);
      if (senderAgency) localStorage.setItem('leadpulse_sender_agency', senderAgency);

      const guestId = localStorage.getItem('leadpulse_guest_id') || `user_${Date.now()}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Guest-Session': guestId,
      };

      const res = await fetch(getApiUrl('/api/outreach/generate'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lead,
          senderName: senderName.trim() || undefined,
          senderAgency: senderAgency.trim() || undefined,
          tone,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.templates && Array.isArray(data.templates) && data.templates.length > 0) {
        setTemplates(data.templates);
        setSelectedTemplateIndex(0);
      } else {
        throw new Error('No templates returned from generator.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to generate outreach copy: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanPhone = lead.phoneNumber && lead.phoneNumber !== 'Not Found' ? lead.phoneNumber.replace(/\D/g, '') : '';
  let waNumber = cleanPhone;
  if (cleanPhone.startsWith('03') && cleanPhone.length === 11) {
    waNumber = '92' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('0092')) {
    waNumber = cleanPhone.substring(2);
  } else if (cleanPhone.startsWith('021') || cleanPhone.startsWith('042') || cleanPhone.startsWith('051')) {
    waNumber = '92' + cleanPhone.substring(1);
  }

  const currentTemplate = templates ? templates[selectedTemplateIndex] : null;

  const mailtoHref = currentTemplate
    ? `mailto:${lead.businessEmail !== 'Not Found' ? lead.businessEmail : ''}?subject=${encodeURIComponent(
        currentTemplate.subjectLine
      )}&body=${encodeURIComponent(currentTemplate.body)}`
    : '#';

  const waHref = currentTemplate && waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(currentTemplate.body)}`
    : null;

  return (
    <div className="rounded-2xl border border-indigo-900/50 bg-gradient-to-b from-indigo-950/20 via-slate-900/80 to-slate-950 p-5 space-y-4">
      {/* Header & Sparkle Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                AI Cold Outreach Email Generator
              </h3>
              <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-blue-300">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Generates 3 customized cold outreach templates tailored to {lead.companyName}'s verified digital gap.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            title="Configure Sender and Tone"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="text-[11px]">Options</span>
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Crafting Emails...' : templates ? 'Regenerate' : 'Generate Outreach'}</span>
          </button>
        </div>
      </div>

      {/* Config Panel Drawer */}
      {showConfig && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Your Name / Sign-off</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Your Agency / Firm</label>
            <input
              type="text"
              value={senderAgency}
              onChange={(e) => setSenderAgency(e.target.value)}
              placeholder="e.g. Apex Digital Growth"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Copy Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="Consultative & Friendly">Consultative &amp; Friendly</option>
              <option value="Professional & Direct">Professional &amp; Direct</option>
              <option value="Executive & Concise">Executive &amp; Concise</option>
            </select>
          </div>
        </div>
      )}

      {/* Grounding Anchors Pill Row */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="text-slate-500 font-semibold uppercase tracking-wider">Grounding Anchors:</span>
        <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-slate-300">
          Target: <strong className="text-white">{lead.companyName}</strong>
        </span>
        {lead.contactFullName !== 'Not Found' && (
          <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-slate-300">
            Contact: <strong className="text-emerald-400">{lead.contactFullName}</strong>
          </span>
        )}
        <span className="rounded bg-red-950/40 border border-red-900/40 px-2 py-0.5 text-red-300">
          Problem: {lead.businessProblem}
        </span>
        <span className="rounded bg-blue-950/40 border border-blue-900/40 px-2 py-0.5 text-blue-300">
          Pitch: {lead.salesOpportunity}
        </span>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Generated Templates View */}
      {templates && templates.length > 0 ? (
        <div className="space-y-4 pt-1">
          {/* Template Style Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            {templates.map((tpl, idx) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateIndex(idx)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTemplateIndex === idx
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tpl.styleName}</span>
              </button>
            ))}
          </div>

          {currentTemplate && (
            <div className="space-y-3.5">
              {/* Subject Line Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider">Subject Line</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentTemplate.subjectLine, 'subject')}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    {copiedField === 'subject' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Subject</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xs font-semibold text-white font-mono bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-850 select-all">
                  {currentTemplate.subjectLine}
                </div>
              </div>

              {/* Email Body Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">Personalized Email Body</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ~{currentTemplate.body.split(/\s+/).length} words
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleCopy(currentTemplate.body, 'body')}
                      className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      {copiedField === 'body' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied Body!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Body</span>
                        </>
                      )}
                    </button>

                    {lead.businessEmail !== 'Not Found' && (
                      <a
                        href={mailtoHref}
                        className="flex items-center gap-1 rounded-md bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-600/30"
                      >
                        <Send className="h-3 w-3" />
                        <span>Open in Mail</span>
                      </a>
                    )}

                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-md bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-all cursor-pointer"
                        title="Send this proposal directly via WhatsApp"
                      >
                        <MessageSquare className="h-3 w-3 text-emerald-400" />
                        <span>Send via WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-4 rounded-xl border border-slate-850/80 select-all font-medium">
                  {currentTemplate.body}
                </div>

                {/* Follow-up Note */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-cyan-400" />
                      <span>Recommended Follow-Up (Day 3-4):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentTemplate.followUpSnippet, 'followup')}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'followup' ? (
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      ) : (
                        <span>Copy Follow-Up</span>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 italic bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                    "{currentTemplate.followUpSnippet}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Call to Action State */
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <Mail className="h-5 w-5" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-xs font-bold text-slate-200">
              Generate 100% Grounded Sales Email Copy
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Gemini will read {lead.companyName}'s measured website gap (
              <span className="text-indigo-300 font-medium">{lead.businessProblem}</span>) and synthesize 3
              ready-to-send outreach templates with zero fluff.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Synthesizing with Gemini...' : 'Generate 3 Email Templates'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
