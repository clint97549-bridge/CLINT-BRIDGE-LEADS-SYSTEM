import React, { useState } from 'react';
import {
  ShieldBan,
  Plus,
  Trash2,
  Globe,
  Phone,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { SuppressionItem } from '../types';

interface SuppressionViewProps {
  suppressions: SuppressionItem[];
  onAddSuppression: (type: 'domain' | 'phone' | 'company', value: string, reason: string) => Promise<void>;
  onRemoveSuppression: (id: string) => Promise<void>;
}

export const SuppressionView: React.FC<SuppressionViewProps> = ({
  suppressions,
  onAddSuppression,
  onRemoveSuppression,
}) => {
  const [type, setType] = useState<'domain' | 'phone' | 'company'>('domain');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddSuppression(type, value.trim().toLowerCase(), reason.trim() || 'Manual suppression');
      setValue('');
      setReason('');
    } catch (err) {
      console.error('Failed to add suppression:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
          Suppression &amp; Do-Not-Contact Registry
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Businesses, domains, or phone numbers listed here will be automatically rejected during
          the Quality Control stage of every research run.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Suppression Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-xs">
            <Plus className="h-4 w-4 text-blue-400" />
            <span>Add Suppression Entry</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Suppression Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="domain">Domain (e.g. competitor.com)</option>
                <option value="phone">Phone Number</option>
                <option value="company">Company Name</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Value to Exclude
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  type === 'domain' ? 'e.g. acme.co.uk' : type === 'phone' ? 'e.g. 447700900123' : 'e.g. Acme Corp'
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Competitor, Unsubscribed, Existing Client"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !value.trim()}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              <ShieldBan className="h-4 w-4" />
              <span>{submitting ? 'Adding...' : 'Add to Suppression'}</span>
            </button>
          </form>
        </div>

        {/* Existing Entries Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="border-b border-slate-800 bg-slate-950 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Active Suppression List</span>
            <span className="font-mono text-xs text-slate-400">{suppressions.length} rules</span>
          </div>

          {suppressions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No entries in suppression list. Added items will automatically block matching leads.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Value</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Added Date</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {suppressions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300">
                          {item.type === 'domain' && <Globe className="h-3.5 w-3.5 text-blue-400" />}
                          {item.type === 'phone' && <Phone className="h-3.5 w-3.5 text-emerald-400" />}
                          {item.type === 'company' && <Building className="h-3.5 w-3.5 text-purple-400" />}
                          <span className="capitalize">{item.type}</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-4 font-mono text-white text-xs font-medium">
                        {item.value}
                      </td>

                      <td className="py-2.5 px-4 text-slate-400 text-xs">
                        {item.reason}
                      </td>

                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => onRemoveSuppression(item.id)}
                          className="rounded-lg p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove suppression rule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
