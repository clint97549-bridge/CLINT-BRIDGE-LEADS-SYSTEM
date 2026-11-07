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
import { getApiUrl } from './lib/apiConfig';
import { Lead, ResearchRun, SuppressionItem } from './types';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { GenerateLeadsView } from './components/GenerateLeadsView';
import { LeadsDatabaseView } from './components/LeadsDatabaseView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { RunHistoryView } from './components/RunHistoryView';
import { SuppressionView } from './components/SuppressionView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { IntegrationsView } from './components/IntegrationsView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Application Data State: allLeads contains historical database, displayedLeads isolates the active run
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [currentRunId, setCurrentRunId] = useState<string | null>(() => {
    return localStorage.getItem('leadpulse_active_run_id') || null;
  });
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

  // Secure Authorization Headers Generator (Firebase Token or Isolated Session)
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const activeSessionId = currentUser ? currentUser.uid : guestId;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Guest-Session': activeSessionId,
      'X-User-Id': activeSessionId,
    };
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.warn('ID token retrieval notice, using active session ID:', err);
        headers['Authorization'] = `Guest ${activeSessionId}`;
      }
    } else {
      headers['Authorization'] = `Guest ${activeSessionId}`;
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
            setAllLeads(loadedLeads);
            setRuns(loadedRuns);
            setSuppressions(loadedSupp);
          }
        } else {
          // Check local cache for guest session
          const cachedLeads = localStorage.getItem(`leads_${guestId}`);
          const cachedRuns = localStorage.getItem(`runs_${guestId}`);
          if (cachedLeads && isMounted) setAllLeads(JSON.parse(cachedLeads));
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

  // Execute a Research Run (with duplicate submission prevention)
  const handleExecuteRun = async (params: {
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
  }) => {
    if (isRunning) return; // Prevent duplicate run submissions from repeated clicks
    setIsRunning(true);
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('leadpulse_running_job_id', runId);

    // Prepare duplicate and contacted keys for suppression
    const existingDuplicateKeys = allLeads.map((l) => l.duplicateKey || l.companyName.toLowerCase().trim());
    const contactedKeys = allLeads
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
      subNiche: params.subNiche,
      province: params.province,
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
      qualificationFilters: {
        requireNoWebsite: params.requireNoWebsite,
        allowWeakWebsite: params.allowWeakWebsite,
        requireHiring: params.requireHiring,
        minQualityScore: params.minimumScore,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentRun(initialRun);

    try {
      // 1. Trigger backend execution with authenticated headers
      const authHeaders = await getAuthHeaders();
      const resp = await fetch(getApiUrl('/api/research/run'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          runId,
          country: params.country,
          niche: params.niche,
          subNiche: params.subNiche,
          province: params.province,
          location: params.location,
          customSearchTerms: params.customSearchTerms,
          leadCount: params.leadCount,
          freshLeadsOnly: params.freshLeadsOnly,
          excludeContacted: params.excludeContacted,
          minimumScore: params.minimumScore,
          targetStrength: params.targetStrength,
          researchDepth: params.researchDepth,
          requireNoWebsite: params.requireNoWebsite,
          allowWeakWebsite: params.allowWeakWebsite,
          requireHiring: params.requireHiring,
          requiredContactDetails: params.requiredContactDetails,
          opportunityType: params.opportunityType,
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
          const pollResp = await fetch(getApiUrl(`/api/research/status/${runId}`), {
            headers: authHeaders,
          });
          if (!pollResp.ok) return;

          const data = await pollResp.json();
          if (data.run) {
            setCurrentRun(data.run);

            if (data.run.status === 'completed' || data.run.status === 'partial' || data.run.status === 'failed') {
              clearInterval(pollInterval);
              setIsRunning(false);
              localStorage.removeItem('leadpulse_running_job_id');

              if (data.results && data.results.qualifiedLeads) {
                const newLeads: Lead[] = data.results.qualifiedLeads;

                // MANDATORY REQUIREMENT:
                // Replace current Leads Database view with that run's results only!
                // Keep all previous completed runs and their results in persistent Run History!
                setCurrentRun(data.run);
                setCurrentRunId(data.run.runId);
                localStorage.setItem('leadpulse_active_run_id', data.run.runId);

                // Update runs history
                setRuns((prev) => [data.run, ...prev.filter((r) => r.runId !== data.run.runId)]);

                // Preserve all historical leads in database
                setAllLeads((prev) => [
                  ...newLeads,
                  ...prev.filter((pl) => !newLeads.some((nl) => nl.id === pl.id)),
                ]);

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
                  const updatedLeads = [...newLeads, ...allLeads];
                  const updatedRuns = [data.run, ...runs];
                  localStorage.setItem(`leads_${guestId}`, JSON.stringify(updatedLeads));
                  localStorage.setItem(`runs_${guestId}`, JSON.stringify(updatedRuns));
                }

                // Auto-switch to database tab to show fresh leads
                setActiveTab('database');
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
      localStorage.removeItem('leadpulse_running_job_id');
      // If run fails, DO NOT erase the last successful result set!
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

  // Reconnect to active running job across browser refresh
  useEffect(() => {
    const runningJobId = localStorage.getItem('leadpulse_running_job_id');
    if (!runningJobId) return;

    let isPolling = true;
    setIsRunning(true);

    const resumeInterval = setInterval(async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const pollResp = await fetch(getApiUrl(`/api/research/status/${runningJobId}`), {
          headers: authHeaders,
        });
        if (!pollResp.ok) {
          clearInterval(resumeInterval);
          setIsRunning(false);
          localStorage.removeItem('leadpulse_running_job_id');
          return;
        }

        const data = await pollResp.json();
        if (data.run && isPolling) {
          setCurrentRun(data.run);

          if (data.run.status === 'completed' || data.run.status === 'partial' || data.run.status === 'failed') {
            clearInterval(resumeInterval);
            setIsRunning(false);
            localStorage.removeItem('leadpulse_running_job_id');

            if (data.results && data.results.qualifiedLeads) {
              const newLeads: Lead[] = data.results.qualifiedLeads;
              setCurrentRun(data.run);
              setCurrentRunId(data.run.runId);
              localStorage.setItem('leadpulse_active_run_id', data.run.runId);

              setRuns((prev) => [data.run, ...prev.filter((r) => r.runId !== data.run.runId)]);
              setAllLeads((prev) => [
                ...newLeads,
                ...prev.filter((pl) => !newLeads.some((nl) => nl.id === pl.id)),
              ]);
            }
          }
        }
      } catch (err) {
        console.warn('Reconnect poll error:', err);
      }
    }, 2000);

    return () => {
      isPolling = false;
      clearInterval(resumeInterval);
    };
  }, []);

  // Displayed Leads: Isolated to the active/selected completed run by default
  const displayedLeads = React.useMemo(() => {
    if (currentRunId) {
      const runMatchingLeads = allLeads.filter((l) => l.runId === currentRunId);
      // If the selected run has leads, return only those (isolated run view)
      if (runMatchingLeads.length > 0) {
        return runMatchingLeads;
      }
      // If currentRunId is stale / references 0 leads, fallback gracefully to all leads
      // rather than showing an accidental blank screen to the user
      return allLeads;
    }
    return allLeads;
  }, [allLeads, currentRunId]);

  // Active Run Object
  const activeRunObj = React.useMemo(() => {
    if (currentRun && currentRun.runId === currentRunId) return currentRun;
    return runs.find((r) => r.runId === currentRunId) || currentRun;
  }, [currentRun, currentRunId, runs]);

  // Mark Lead Contacted
  const handleToggleContacted = async (leadId: string, currentStatus: boolean) => {
    const updatedStatus = !currentStatus;

    setAllLeads((prev) =>
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
      const updated = allLeads.map((l) => (l.id === leadId ? { ...l, contacted: updatedStatus } : l));
      localStorage.setItem(`leads_${guestId}`, JSON.stringify(updated));
    }
  };

  // Mark Lead Reviewed
  const handleToggleReviewed = async (leadId: string, currentStatus: boolean) => {
    const updatedStatus = !currentStatus;

    setAllLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, isReviewed: updatedStatus } : l))
    );

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, isReviewed: updatedStatus } : null));
    }

    if (currentUser) {
      try {
        const leadRef = doc(db, 'leads', leadId);
        await setDoc(leadRef, { isReviewed: updatedStatus }, { merge: true });
      } catch (err) {
        console.error('Firestore review update failed:', err);
      }
    } else {
      const updated = allLeads.map((l) => (l.id === leadId ? { ...l, isReviewed: updatedStatus } : l));
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

  // Export Leads to XLSX (with optional run metadata for run-specific exports)
  const handleExportXlsx = (leadsToExport: Lead[], runForMetadata?: ResearchRun | null) => {
    if (leadsToExport.length === 0) return;
    const wb = buildXlsxWorkbook(leadsToExport, runForMetadata || activeRunObj || undefined);
    const prefix = runForMetadata ? `Run_${runForMetadata.runId}_` : '';
    const filename = `LeadPulse_${prefix}Verified_Leads_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        totalLeadsCount={allLeads.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            leads={allLeads}
            runs={runs}
            onStartSearch={handleQuickPresetSearch}
            onNavigateTab={setActiveTab}
            onSelectLead={setSelectedLead}
            onExportAll={() => handleExportXlsx(allLeads)}
          />
        )}

        {activeTab === 'generate' && (
          <GenerateLeadsView
            onExecuteRun={handleExecuteRun}
            currentRun={currentRun}
            isRunning={isRunning}
            onNavigateTab={setActiveTab}
            onExportRun={() => handleExportXlsx(displayedLeads, activeRunObj)}
          />
        )}

        {activeTab === 'database' && (
          <LeadsDatabaseView
            leads={displayedLeads}
            onSelectLead={setSelectedLead}
            onToggleContacted={handleToggleContacted}
            onToggleReviewed={handleToggleReviewed}
            onExportXlsx={(leadsToExport) => handleExportXlsx(leadsToExport, activeRunObj)}
            onExportCsv={(leadsToExport) => handleExportCsv(leadsToExport)}
            currentRun={activeRunObj}
            totalHistoricalLeadsCount={allLeads.length}
            onShowAllHistoricalLeads={() => {
              setCurrentRunId(null);
              localStorage.removeItem('leadpulse_active_run_id');
            }}
          />
        )}

        {activeTab === 'history' && (
          <RunHistoryView
            runs={runs}
            onSelectRun={(runId) => {
              setCurrentRunId(runId);
              localStorage.setItem('leadpulse_active_run_id', runId);
              setActiveTab('database');
            }}
            onExportRun={(runId) => {
              const runLeads = allLeads.filter((l) => l.runId === runId);
              const runObj = runs.find((r) => r.runId === runId);
              if (runLeads.length > 0) {
                handleExportXlsx(runLeads, runObj || null);
              }
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

        {activeTab === 'integrations' && <IntegrationsView />}

        {activeTab === 'diagnostics' && <DiagnosticsView />}
      </main>

      {/* 360° Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onToggleContacted={handleToggleContacted}
          onToggleReviewed={handleToggleReviewed}
          onAddSuppression={handleAddSuppression}
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
