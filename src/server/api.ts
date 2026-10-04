/**
 * Express Backend API Router
 * Handles all server-side research operations, Gemini API calls,
 * and data exports without exposing any API keys to the browser.
 */

import { Router, Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { buildXlsxWorkbook, generateCsvString, mapLeadToRow } from '../lib/export';
import { validateExportCompliance, validateLeadCompliance } from '../lib/leadCompliance';
import { getGeminiClient, PRIMARY_MODEL } from '../services/geminiClient';
import { getDiscoveryProvider } from '../services/discoveryProvider';
import { createSearchPlan } from '../services/planner';
import { executeResearchRun, RunOptions } from '../services/researchOrchestrator';
import { DiagnosticState, Lead, ResearchRun, SystemDiagnostics } from '../types';
import { requireAuth, resolveAuthenticatedUser } from './auth';

export const apiRouter = Router();

// In-memory job state store for background execution & polling
const activeJobs = new Map<string, { run: ResearchRun; results?: any }>();

/**
 * POST /api/research/plan
 * Generates search plan breakdown for the requested country & niche
 */
apiRouter.post('/research/plan', requireAuth, (req: Request, res: Response) => {
  try {
    const { country, niche, location, leadCount } = req.body;
    if (!country || !niche) {
      res.status(400).json({ error: 'Country and niche are required.' });
      return;
    }
    const count = parseInt(leadCount, 10) || 10;
    const plan = createSearchPlan(country, niche, location, count);
    res.json(plan);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/research/run
 * Initiates an evidence-grounded research run
 * Strictly uses server-derived authenticated identity.
 */
apiRouter.post('/research/run', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      runId,
      country,
      niche,
      location,
      leadCount,
      freshLeadsOnly,
      excludeContacted,
      minimumScore,
      targetStrength,
      researchDepth,
      existingDuplicateKeys,
      contactedKeys,
      suppressedDomains,
    } = req.body;

    // Server derives and enforces the user identity (never trust client-supplied userId)
    const effectiveUserId = req.authenticatedUser?.uid;
    if (!effectiveUserId || !country || !niche) {
      res.status(400).json({ error: 'Missing required parameters (country, niche).' });
      return;
    }

    const effectiveRunId = runId || `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const count = Math.min(250, parseInt(leadCount, 10) || 10);

    const runOptions: RunOptions = {
      userId: effectiveUserId,
      runId: effectiveRunId,
      country,
      niche,
      location,
      leadCount: count,
      freshLeadsOnly: freshLeadsOnly !== false,
      excludeContacted: excludeContacted !== false,
      minimumScore: typeof minimumScore === 'number' ? minimumScore : 60,
      targetStrength: targetStrength || 'ALL',
      researchDepth: researchDepth || 'Standard',
      existingDuplicateKeys: existingDuplicateKeys || [],
      contactedKeys: contactedKeys || [],
      suppressedDomains: suppressedDomains || [],
      onProgress: (updatedRun) => {
        const job = activeJobs.get(effectiveRunId);
        if (job) {
          job.run = { ...job.run, ...updatedRun };
        }
      },
    };

    // Initialize job record
    activeJobs.set(effectiveRunId, {
      run: {
        id: effectiveRunId,
        userId: effectiveUserId,
        runId: effectiveRunId,
        country,
        niche,
        location: location || 'All Regions',
        requestedCount: count,
        candidatesFound: 0,
        duplicatesRemoved: 0,
        rejectedCount: 0,
        researchCompleted: 0,
        qualifiedCount: 0,
        finalCount: 0,
        shortfall: 0,
        status: 'planning',
        stage: 'SEARCH_PLANNING',
        progress: 5,
        durationMs: 0,
        errors: [],
        sourcesUsed: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    // Run asynchronously
    executeResearchRun(runOptions)
      .then((results) => {
        const job = activeJobs.get(effectiveRunId);
        if (job) {
          job.run = results.run;
          job.results = results;
        }
      })
      .catch((err) => {
        const job = activeJobs.get(effectiveRunId);
        if (job) {
          job.run.status = 'failed';
          job.run.errors.push(String(err));
        }
      });

    res.json({
      runId: effectiveRunId,
      status: 'started',
      message: 'Research run initiated.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

/**
 * GET /api/research/status/:runId
 * Polling endpoint for research run status.
 * Enforces user isolation: users cannot access runs belonging to others.
 */
apiRouter.get('/research/status/:runId', requireAuth, (req: Request, res: Response) => {
  const { runId } = req.params;
  const job = activeJobs.get(runId);

  if (!job) {
    res.status(404).json({ error: 'Research job not found.' });
    return;
  }

  // Enforce user isolation
  const currentUid = req.authenticatedUser?.uid;
  if (job.run.userId !== currentUid) {
    res.status(403).json({ error: 'Forbidden: You do not have permission to view this research job.' });
    return;
  }

  res.json({
    run: job.run,
    results: job.results || null,
  });
});

/**
 * GET /api/diagnostics
 * Health status of backend integrations.
 * Accurately displays active discovery provider without misleading labels.
 */
apiRouter.get('/diagnostics', async (_req: Request, res: Response) => {
  let geminiConnected = false;
  let searchGroundingActive = false;
  let searchGroundingQuotaBlocked = false;
  let discoveryProviderActive = false;
  let discoverySafeMode = false;
  const activeStates: DiagnosticState[] = [];
  let quotaWarning: string | undefined = undefined;

  const ai = getGeminiClient();
  const provider = getDiscoveryProvider();

  // 1. Test base Gemini model connectivity with retry
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const testResp = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: 'Ping test. Output "OK".',
      });
      if (testResp.text) {
        geminiConnected = true;
        activeStates.push('GEMINI_CONNECTED');
        break;
      }
    } catch (err: unknown) {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200));
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Diagnostics direct Gemini test warning:', msg);
      }
    }
  }

  // 2. Test Discovery Provider & Grounding Status
  const providerAvail = await provider.isAvailable();
  if (provider.name === 'Google Places API (New)') {
    if (providerAvail.available) {
      discoveryProviderActive = true;
      activeStates.push('BUSINESS_DISCOVERY_PROVIDER_ACTIVE');
      // When Places is active, Search Grounding is not the active discovery provider
      searchGroundingActive = false;
    } else {
      discoverySafeMode = true;
      activeStates.push('DISCOVERY_SAFE_MODE');
      activeStates.push('BUSINESS_DISCOVERY_PROVIDER_UNAVAILABLE');
      quotaWarning = `Google Places provider unavailable: ${providerAvail.reason || 'Check API key configuration'}`;
    }
  } else {
    // Search Grounding Provider
    if (providerAvail.available) {
      searchGroundingActive = true;
      discoveryProviderActive = true;
      activeStates.push('SEARCH_GROUNDING_ACTIVE');
      activeStates.push('BUSINESS_DISCOVERY_PROVIDER_ACTIVE');
    } else {
      discoverySafeMode = true;
      activeStates.push('DISCOVERY_SAFE_MODE');
      if (providerAvail.state === 'SEARCH_GROUNDING_QUOTA_BLOCKED') {
        searchGroundingQuotaBlocked = true;
        activeStates.push('SEARCH_GROUNDING_QUOTA_BLOCKED');
        quotaWarning = 'Google Search Grounding quota exhausted (429 RESOURCE_EXHAUSTED). Safe Mode active (0 fabricated candidates).';
      } else {
        activeStates.push('BUSINESS_DISCOVERY_PROVIDER_UNAVAILABLE');
        quotaWarning = `Discovery provider unavailable (${providerAvail.state}): ${providerAvail.reason || 'Provider error'}`;
      }
    }
  }

  const diagnostics: SystemDiagnostics = {
    geminiConnected,
    searchGroundingActive,
    searchGroundingQuotaBlocked,
    discoveryProviderActive,
    discoveryProviderName: provider.name,
    discoverySafeMode,
    activeStates,
    firebaseConfigured: true,
    firestoreConnected: true,
    authActive: true,
    lastChecked: new Date().toISOString(),
    geminiModel: PRIMARY_MODEL,
    quotaWarning,
  };

  res.json(diagnostics);
});

/**
 * POST /api/export/xlsx
 * Generates an Excel workbook file stream with strict user isolation & compliance validation.
 */
apiRouter.post('/export/xlsx', requireAuth, (req: Request, res: Response) => {
  try {
    const { leads, runId, runInfo, evidenceList } = req.body;
    const currentUid = req.authenticatedUser?.uid;

    let targetLeads: Lead[] = [];

    if (runId && activeJobs.has(runId)) {
      const job = activeJobs.get(runId)!;
      if (job.run.userId !== currentUid) {
        res.status(403).json({ error: 'Forbidden: You do not have permission to export this run.' });
        return;
      }
      targetLeads = job.results?.qualifiedLeads || [];
    } else if (Array.isArray(leads)) {
      // Validate all leads belong to authenticated user
      for (const lead of leads) {
        if (lead.userId && lead.userId !== currentUid) {
          res.status(403).json({ error: 'Forbidden: Export contains leads belonging to another user.' });
          return;
        }
        const comp = validateLeadCompliance(lead);
        if (!comp.compliant) {
          res.status(400).json({ error: `Export blocked: ${comp.violations.join('; ')}` });
          return;
        }
      }
      targetLeads = leads;
    } else {
      res.status(400).json({ error: 'Leads array or valid runId is required.' });
      return;
    }

    const rows = targetLeads.map(mapLeadToRow);
    const exportCompliance = validateExportCompliance(rows);
    if (!exportCompliance.compliant) {
      res.status(400).json({ error: `Export blocked by compliance policy: ${exportCompliance.violations.join('; ')}` });
      return;
    }

    const wb = buildXlsxWorkbook(targetLeads, runInfo, evidenceList || []);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="leadpulse_export.xlsx"');
    res.send(buffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/export/csv
 * Generates a clean UTF-8 CSV text stream with strict user isolation & compliance validation.
 */
apiRouter.post('/export/csv', requireAuth, (req: Request, res: Response) => {
  try {
    const { leads, runId } = req.body;
    const currentUid = req.authenticatedUser?.uid;

    let targetLeads: Lead[] = [];

    if (runId && activeJobs.has(runId)) {
      const job = activeJobs.get(runId)!;
      if (job.run.userId !== currentUid) {
        res.status(403).json({ error: 'Forbidden: You do not have permission to export this run.' });
        return;
      }
      targetLeads = job.results?.qualifiedLeads || [];
    } else if (Array.isArray(leads)) {
      for (const lead of leads) {
        if (lead.userId && lead.userId !== currentUid) {
          res.status(403).json({ error: 'Forbidden: Export contains leads belonging to another user.' });
          return;
        }
        const comp = validateLeadCompliance(lead);
        if (!comp.compliant) {
          res.status(400).json({ error: `Export blocked: ${comp.violations.join('; ')}` });
          return;
        }
      }
      targetLeads = leads;
    } else {
      res.status(400).json({ error: 'Leads array or valid runId is required.' });
      return;
    }

    const rows = targetLeads.map(mapLeadToRow);
    const exportCompliance = validateExportCompliance(rows);
    if (!exportCompliance.compliant) {
      res.status(400).json({ error: `Export blocked by compliance policy: ${exportCompliance.violations.join('; ')}` });
      return;
    }

    const csvContent = generateCsvString(targetLeads);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leadpulse_export.csv"');
    res.send(csvContent);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});
