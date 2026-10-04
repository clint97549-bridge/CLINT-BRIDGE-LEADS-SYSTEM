/**
 * Resumable Multi-Stage Research Orchestration Pipeline
 * (Phases 3 - 16, 20, 33, 34)
 */

import { generateDuplicateKey } from '../lib/normalizer';
import {
  CandidateBusiness,
  EvidenceRecord,
  JobStage,
  Lead,
  LeadHistoryItem,
  ResearchRun,
} from '../types';
import { discoverCandidatesWithGrounding } from './discoveryService';
import { validateCandidateProvenance } from './discoveryProvider';
import { createSearchPlan } from './planner';
import { performQualityControl } from './qcService';
import { conductDeepBusinessResearch } from './researchService';

export interface RunOptions {
  userId: string;
  runId: string;
  country: string;
  niche: string;
  location?: string;
  leadCount: number;
  freshLeadsOnly: boolean;
  excludeContacted: boolean;
  minimumScore: number;
  targetStrength?: 'A' | 'B' | 'ALL';
  researchDepth?: 'Standard' | 'Deep';
  existingDuplicateKeys?: string[];
  contactedKeys?: string[];
  suppressedDomains?: string[];
  onProgress?: (run: Partial<ResearchRun>) => void;
}

export interface OrchestrationResult {
  run: ResearchRun;
  qualifiedLeads: Lead[];
  evidenceRecords: EvidenceRecord[];
  historyRecords: LeadHistoryItem[];
}

export async function executeResearchRun(options: RunOptions): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const runId = options.runId;
  const userId = options.userId;

  const currentRun: ResearchRun = {
    id: runId,
    userId,
    runId,
    country: options.country,
    niche: options.niche,
    location: options.location || 'All Regions',
    requestedCount: options.leadCount,
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
  };

  const updateProgress = (stage: JobStage, pct: number, extra: Partial<ResearchRun> = {}) => {
    currentRun.stage = stage;
    currentRun.progress = Math.min(100, Math.max(currentRun.progress, pct));
    currentRun.updatedAt = new Date().toISOString();
    Object.assign(currentRun, extra);
    if (options.onProgress) {
      options.onProgress({ ...currentRun });
    }
  };

  const existingDupSet = new Set(options.existingDuplicateKeys || []);
  const contactedSet = new Set(options.contactedKeys || []);
  const suppressedSet = new Set(options.suppressedDomains || []);

  const qualifiedLeads: Lead[] = [];
  const evidenceRecords: EvidenceRecord[] = [];
  const historyRecords: LeadHistoryItem[] = [];

  try {
    // Stage 1: Search Planning
    updateProgress('SEARCH_PLANNING', 10);
    const plan = createSearchPlan(options.country, options.niche, options.location, options.leadCount);

    // Stage 2: Candidate Discovery
    updateProgress('CANDIDATE_DISCOVERY', 20, { status: 'discovering' });
    const discoveryResult = await discoverCandidatesWithGrounding(
      plan,
      plan.candidateTargetPoolSize,
      (found) => {
        currentRun.candidatesFound = found;
        updateProgress('CANDIDATE_DISCOVERY', Math.min(45, 20 + Math.floor((found / plan.candidateTargetPoolSize) * 25)));
      }
    );

    currentRun.candidatesFound = discoveryResult.candidates.length;
    currentRun.sourcesUsed = discoveryResult.sourcesUsed;

    if (discoveryResult.isSafeMode && discoveryResult.statusMessage) {
      currentRun.errors.push(discoveryResult.statusMessage);
      console.warn(`[Orchestrator] Discovery ran in Safe Mode: ${discoveryResult.statusMessage}`);
    }

    // Stage 3: Provenance Validation & Deduplication of Candidates
    updateProgress('DEDUPLICATION', 50);
    const uniqueCandidates: CandidateBusiness[] = [];
    const localRunDupSet = new Set<string>();

    for (const cand of discoveryResult.candidates) {
      // HARD GATE: Validate candidate provenance before deduplication or research
      const provenance = validateCandidateProvenance(cand);
      if (!provenance.valid) {
        currentRun.rejectedCount++;
        currentRun.errors.push(`Rejected ungrounded candidate "${cand.companyName}": ${provenance.reason}`);
        console.warn(`[Orchestrator] Rejecting ungrounded candidate "${cand.companyName}": ${provenance.reason}`);
        continue;
      }

      const dupKey = generateDuplicateKey(
        cand.companyName,
        cand.country || options.country,
        cand.website,
        cand.phone,
        cand.city
      );

      // Check within current run
      if (localRunDupSet.has(dupKey)) {
        currentRun.duplicatesRemoved++;
        continue;
      }

      // Check against historical database if Fresh Leads Only is on
      if (options.freshLeadsOnly && existingDupSet.has(dupKey)) {
        currentRun.duplicatesRemoved++;
        continue;
      }

      // Check against contacted list if Exclude Contacted is on
      if (options.excludeContacted && contactedSet.has(dupKey)) {
        currentRun.duplicatesRemoved++;
        continue;
      }

      localRunDupSet.add(dupKey);
      uniqueCandidates.push(cand);
    }

    // Stage 4: Deep Business Research & Website Audit
    updateProgress('BUSINESS_RESEARCH', 60, { status: 'researching' });
    const totalToResearch = uniqueCandidates.length;

    for (let i = 0; i < totalToResearch; i++) {
      // If we already reached target requestedCount, we can stop
      if (qualifiedLeads.length >= options.leadCount) {
        break;
      }

      const cand = uniqueCandidates[i];
      const researchResult = await conductDeepBusinessResearch(
        cand,
        userId,
        runId,
        options.niche,
        options.country
      );

      currentRun.researchCompleted++;

      if (researchResult) {
        const { lead, evidence } = researchResult;

        // Stage 5: Quality Control
        const qc = performQualityControl(lead, existingDupSet, contactedSet, suppressedSet, {
          requestedCountry: options.country,
          requestedNiche: options.niche,
          freshLeadsOnly: options.freshLeadsOnly,
          excludeContacted: options.excludeContacted,
          minimumScore: options.minimumScore,
          targetStrength: options.targetStrength,
        });

        if (qc.passed) {
          // Register duplicate key
          const dupKey = generateDuplicateKey(
            lead.companyName,
            lead.country,
            lead.website !== 'No Website Found' ? lead.website : undefined,
            lead.phoneNumber !== 'Not Found' ? lead.phoneNumber : undefined,
            lead.city
          );
          existingDupSet.add(dupKey);

          qualifiedLeads.push(lead);
          evidenceRecords.push(...evidence);

          historyRecords.push({
            id: `hist_${lead.id}`,
            userId,
            duplicateKey: dupKey,
            companyName: lead.companyName,
            canonicalDomain: lead.canonicalDomain,
            normalizedPhone: lead.normalizedPhone,
            country: lead.country,
            niche: options.niche,
            firstDiscoveredAt: lead.createdAt,
            lastResearchedAt: lead.createdAt,
            status: 'Qualified',
            runId,
          });

          currentRun.qualifiedCount = qualifiedLeads.length;
        } else {
          currentRun.rejectedCount++;
        }
      } else {
        currentRun.rejectedCount++;
      }

      const pct = Math.floor(60 + (i / Math.max(1, totalToResearch)) * 30);
      updateProgress('WEBSITE_RESEARCH', pct);
    }

    // Final calculations
    currentRun.finalCount = qualifiedLeads.length;
    currentRun.shortfall = Math.max(0, options.leadCount - qualifiedLeads.length);
    currentRun.durationMs = Date.now() - startTime;
    currentRun.status = currentRun.shortfall > 0 ? 'partial' : 'completed';
    updateProgress('COMPLETED', 100);

    return {
      run: currentRun,
      qualifiedLeads,
      evidenceRecords,
      historyRecords,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    currentRun.errors.push(errorMsg);
    currentRun.status = 'failed';
    currentRun.durationMs = Date.now() - startTime;
    updateProgress('FAILED', 100);

    return {
      run: currentRun,
      qualifiedLeads,
      evidenceRecords,
      historyRecords,
    };
  }
}
