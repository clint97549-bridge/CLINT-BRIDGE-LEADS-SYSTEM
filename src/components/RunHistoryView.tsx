import React from 'react';
import {
  History,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  Search,
  ArrowRight,
} from 'lucide-react';
import { ResearchRun } from '../types';

interface RunHistoryViewProps {
  runs: ResearchRun[];
  onSelectRun: (runId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const RunHistoryView: React.FC<RunHistoryViewProps> = ({
  runs,
  onSelectRun,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Research Run History
          </h1>
          <p className="text-xs text-slate-400">
            Audit trail of all executed discovery runs, candidate counts, and qualification stats
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('generate')}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer"
        >
          <Search className="h-4 w-4" />
          <span>New Research Run</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        {runs.length === 0 ? (
          <div className="py-16 text-center">
            <History className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No Research Runs Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Execute your first research search to track execution duration, candidate pools, and deduplication history.
            </p>
            <button
              onClick={() => onNavigateTab('generate')}
              className="mt-4 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              Launch Research
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Run ID &amp; Date</th>
                  <th className="py-3 px-4">Country &amp; Niche</th>
                  <th className="py-3 px-4 text-center">Target</th>
                  <th className="py-3 px-4 text-center">Found</th>
                  <th className="py-3 px-4 text-center">Duplicates</th>
                  <th className="py-3 px-4 text-center">Rejected</th>
                  <th className="py-3 px-4 text-center">Qualified</th>
                  <th className="py-3 px-4 text-center">Shortfall</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-white text-[11px] font-semibold">{run.runId}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(run.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{run.niche}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Globe className="h-3 w-3 text-blue-400" />
                        <span>{run.country} {run.location ? `(${run.location})` : ''}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      {run.requestedCount}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-cyan-400">
                      {run.candidatesFound}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-amber-400">
                      {run.duplicatesRemoved}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-red-400">
                      {run.rejectedCount}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      {run.qualifiedCount}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {run.shortfall > 0 ? (
                        <span className="text-amber-400">-{run.shortfall}</span>
                      ) : (
                        <span className="text-emerald-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          run.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : run.status === 'partial'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          onSelectRun(run.runId);
                          onNavigateTab('database');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        <span>Filter Leads</span>
                        <ArrowRight className="h-3 w-3" />
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
  );
};
