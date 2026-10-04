/**
 * LeadPulse AI - Enterprise B2B Lead Intelligence Application
 * Full-stack orchestrator with Firebase Auth, Firestore persistence,
 * server-side Gemini Search Grounding, and Excel export.
 */

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  auth,
  db,
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType,
  FirebaseUser,
} from './lib/firebase';
import { buildXlsxWorkbook, downloadFile, generateCsvString } from './lib/export';
import { sanitizeLeadForPersistence } from './lib/leadCompliance';
import { Lead, ResearchRun, SuppressionItem } from './types';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { GenerateLeadsView } from './components/GenerateLeadsView';
import { LeadsDatabaseView } from './components/LeadsDatabaseView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { RunHistoryView } from './components/RunHistoryView';
import { SuppressionView } from './components/SuppressionView';
import { DiagnosticsView } from './components/DiagnosticsView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Application Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [suppressions, setSuppressions] = useState<SuppressionItem[]>([]);

  // Active Research State
  const [currentRun, setCurrentRun] = useState<ResearchRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Selected Lead for Modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Fallback guest session ID if user has not clicked Google Sign In yet
  const [guestId] = useState(() => {
    const saved = localStorage.getItem('leadpulse_guest_id');
    if (saved) return saved;
    const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('leadpulse_guest_id', newId);
    return newId;
  });

  const effectiveUserId = currentUser ? currentUser.uid : guestId;

  // Secure Authorization Headers Generator (Firebase Token or Isolated Guest Session)
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        headers['X-Guest-Session'] = guestId;
      }
    } else {
      headers['X-Guest-Session'] = guestId;
    }
    return headers;
  };

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // Record or update user profile in Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(
            userRef,
            {
              userId: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('User profile sync notice:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Leads & Runs from Firestore when user changes
  useEffect(() => {
    if (!effectiveUserId) return;

    let isMounted = true;

    async function loadData() {
      try {
        if (currentUser) {
          // Fetch leads from Firestore
          const leadsQuery = query(
            collection(db, 'leads'),
            where('userId', '==', currentUser.uid)
          );
          const leadsSnap = await getDocs(leadsQuery);
          const loadedLeads: Lead[] = [];
          leadsSnap.forEach((d) => {
            loadedLeads.push(d.data() as Lead);
          });

          // Fetch runs from Firestore
          const runsQuery = query(
            collection(db, 'researchRuns'),
            where('userId', '==', currentUser.uid)
          );
          const runsSnap = await getDocs(runsQuery);
          const loadedRuns: ResearchRun[] = [];
          runsSnap.forEach((d) => {
            loadedRuns.push(d.data() as ResearchRun);
          });

          // Fetch suppressions
          const suppQuery = query(
            collection(db, 'suppression'),
            where('userId', '==', currentUser.uid)
          );
          const suppSnap = await getDocs(suppQuery);
          const loadedSupp: SuppressionItem[] = [];
          suppSnap.forEach((d) => {
            loadedSupp.push(d.data() as SuppressionItem);
          });

          if (isMounted) {
            setLeads(loadedLeads);
            setRuns(loadedRuns);
            setSuppressions(loadedSupp);
          }
        } else {
          // Check local cache for guest session
          const cachedLeads = localStorage.getItem(`leads_${guestId}`);
          const cachedRuns = localStorage.getItem(`runs_${guestId}`);
          if (cachedLeads && isMounted) setLeads(JSON.parse(cachedLeads));
          if (cachedRuns && isMounted) setRuns(JSON.parse(cachedRuns));
        }
      } catch (err) {
        console.error('Data loading error:', err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentUser, effectiveUserId, guestId]);

  // Execute a Research Run
  const handleExecuteRun = async (params: {
    country: string;
    niche: string;
    location?: string;
    leadCount: number;
    freshLeadsOnly: boolean;
    excludeContacted: boolean;
    minimumScore: number;
    targetStrength: 'A' | 'B' | 'ALL';
    researchDepth: 'Standard' | 'Deep';
  }) => {
    setIsRunning(true);
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Prepare duplicate and contacted keys for suppression
    const existingDuplicateKeys = leads.map((l) => l.duplicateKey || l.companyName.toLowerCase().trim());
    const contactedKeys = leads
      .filter((l) => l.contacted)
      .map((l) => l.duplicateKey || l.companyName.toLowerCase().trim());
    const suppressedDomains = suppressions
      .filter((s) => s.type === 'domain')
      .map((s) => s.value.toLowerCase().trim());

    // Initial placeholder run
    const initialRun: ResearchRun = {
      id: runId,
      userId: effectiveUserId,
      runId,
      country: params.country,
      niche: params.niche,
      location: params.location || 'All Regions',
      requestedCount: params.leadCount,
      candidatesFound: 0,
      duplicatesRemoved: 0,
      rejectedCount: 0,
      researchCompleted: 0,
      qualifiedCount: 0,
      finalCount: 0,
      shortfall: 0,
      status: 'planning',
      stage: 'SEARCH_PLANNING',
      progress: 10,
      durationMs: 0,
      errors: [],
      sourcesUsed: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentRun(initialRun);

    try {
      // 1. Trigger backend execution with authenticated headers
      const authHeaders = await getAuthHeaders();
      const resp = await fetch('/api/research/run', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: effectiveUserId,
          runId,
          country: params.country,
          niche: params.niche,
          location: params.location,
          leadCount: params.leadCount,
          freshLeadsOnly: params.freshLeadsOnly,
          excludeContacted: params.excludeContacted,
          minimumScore: params.minimumScore,
          targetStrength: params.targetStrength,
          researchDepth: params.researchDepth,
          existingDuplicateKeys,
          contactedKeys,
          suppressedDomains,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`);
      }

      // 2. Poll for progress until completed or failed
      const pollInterval = setInterval(async () => {
        try {
          const pollResp = await fetch(`/api/research/status/${runId}`, {
            headers: authHeaders,
          });
          if (!pollResp.ok) return;

          const data = await pollResp.json();
          if (data.run) {
            setCurrentRun(data.run);

            if (data.run.status === 'completed' || data.run.status === 'partial' || data.run.status === 'failed') {
              clearInterval(pollInterval);
              setIsRunning(false);

              if (data.results && data.results.qualifiedLeads) {
                const newLeads: Lead[] = data.results.qualifiedLeads;
                const newRuns: ResearchRun[] = [data.run];

                // Update state
                setLeads((prev) => [...newLeads, ...prev]);
                setRuns((prev) => [data.run, ...prev]);

                // Persist to Firestore if user is authenticated
                if (currentUser) {
                  try {
                    // Save run
                    await setDoc(doc(db, 'researchRuns', runId), data.run);

                    // Save leads (Policy compliant, no restricted Google fields)
                    for (const l of newLeads) {
                      const cleanLead = sanitizeLeadForPersistence(l);
                      await setDoc(doc(db, 'leads', l.id), cleanLead);
                    }

                    // Save history records
                    if (data.results.historyRecords) {
                      for (const h of data.results.historyRecords) {
                        await setDoc(doc(db, 'leadHistory', h.id), h);
                      }
                    }

                    // Save evidence records
                    if (data.results.evidenceRecords) {
                      for (const ev of data.results.evidenceRecords) {
                        await setDoc(doc(db, 'evidence', ev.id), ev);
                      }
                    }
                  } catch (fsErr) {
                    console.error('Firestore save failed:', fsErr);
                  }
                } else {
                  // Save in local storage for guest
                  const updatedLeads = [...newLeads, ...leads];
                  const updatedRuns = [data.run, ...runs];
                  localStorage.setItem(`leads_${guestId}`, JSON.stringify(updatedLeads));
                  localStorage.setItem(`runs_${guestId}`, JSON.stringify(updatedRuns));
                }
              }
            }
          }
        } catch (pollErr) {
          console.warn('Poll error:', pollErr);
        }
      }, 1500);
    } catch (err: unknown) {
      console.error('Run execution error:', err);
      setIsRunning(false);
      setCurrentRun((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              errors: [err instanceof Error ? err.message : String(err)],
            }
          : null
      );
    }
  };

  // Mark Lead Contacted
  const handleToggleContacted = async (leadId: string, currentStatus: boolean) => {
    const updatedStatus = !currentStatus;

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, contacted: updatedStatus } : l))
    );

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, contacted: updatedStatus } : null));
    }

    if (currentUser) {
      try {
        const leadRef = doc(db, 'leads', leadId);
        await setDoc(leadRef, { contacted: updatedStatus }, { merge: true });
      } catch (err) {
        console.error('Firestore contact update failed:', err);
      }
    } else {
      const updated = leads.map((l) => (l.id === leadId ? { ...l, contacted: updatedStatus } : l));
      localStorage.setItem(`leads_${guestId}`, JSON.stringify(updated));
    }
  };

  // Add Suppression Entry
  const handleAddSuppression = async (
    type: 'domain' | 'phone' | 'company',
    value: string,
    reason: string
  ) => {
    const suppId = `supp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newItem: SuppressionItem = {
      id: suppId,
      userId: effectiveUserId,
      type,
      value,
      reason,
      createdAt: new Date().toISOString(),
    };

    setSuppressions((prev) => [newItem, ...prev]);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'suppression', suppId), newItem);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'suppression');
      }
    }
  };

  // Remove Suppression Entry
  const handleRemoveSuppression = async (id: string) => {
    setSuppressions((prev) => prev.filter((s) => s.id !== id));
    // Firestore delete if authenticated
  };

  // Quick preset search handler from Dashboard
  const handleQuickPresetSearch = (presetCountry: string, presetNiche: string, count: number) => {
    setActiveTab('generate');
    handleExecuteRun({
      country: presetCountry,
      niche: presetNiche,
      leadCount: count,
      freshLeadsOnly: true,
      excludeContacted: true,
      minimumScore: 60,
      targetStrength: 'ALL',
      researchDepth: 'Standard',
    });
  };

  // Export Leads to XLSX
  const handleExportXlsx = (leadsToExport: Lead[]) => {
    if (leadsToExport.length === 0) return;
    const wb = buildXlsxWorkbook(leadsToExport, currentRun || undefined);
    const filename = `LeadPulse_Verified_Leads_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Export Leads to CSV
  const handleExportCsv = (leadsToExport: Lead[]) => {
    if (leadsToExport.length === 0) return;
    const csvStr = generateCsvString(leadsToExport);
    const filename = `LeadPulse_Verified_Leads_${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csvStr, filename, 'text/csv;charset=utf-8;');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        authLoading={authLoading}
        totalLeadsCount={leads.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            leads={leads}
            runs={runs}
            onStartSearch={handleQuickPresetSearch}
            onNavigateTab={setActiveTab}
            onSelectLead={setSelectedLead}
            onExportAll={() => handleExportXlsx(leads)}
          />
        )}

        {activeTab === 'generate' && (
          <GenerateLeadsView
            onExecuteRun={handleExecuteRun}
            currentRun={currentRun}
            isRunning={isRunning}
            onNavigateTab={setActiveTab}
            onExportRun={() => handleExportXlsx(leads)}
          />
        )}

        {activeTab === 'database' && (
          <LeadsDatabaseView
            leads={leads}
            onSelectLead={setSelectedLead}
            onToggleContacted={handleToggleContacted}
            onExportXlsx={handleExportXlsx}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 'history' && (
          <RunHistoryView
            runs={runs}
            onSelectRun={(runId) => {
              setActiveTab('database');
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'suppression' && (
          <SuppressionView
            suppressions={suppressions}
            onAddSuppression={handleAddSuppression}
            onRemoveSuppression={handleRemoveSuppression}
          />
        )}

        {activeTab === 'diagnostics' && <DiagnosticsView />}
      </main>

      {/* 360° Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onToggleContacted={handleToggleContacted}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            LeadPulse AI Lead Intelligence &bull; Production Full-Stack Engine &bull; Port 3000
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Server-side Gemini Grounding</span>
            <span>&bull;</span>
            <span>Firestore Persistent Storage</span>
            <span>&bull;</span>
            <span>Zero-Fabrication Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
