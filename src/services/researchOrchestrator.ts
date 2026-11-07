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
  subNiche?: string;
  province?: string;
  location?: string;
  customSearchTerms?: string[];
  leadCount: number;
  freshLeadsOnly: boolean;
  excludeContacted: boolean;
  minimumScore: number;
  targetStrength?: 'A' | 'B' | 'ALL';
  researchDepth?: 'Standard' | 'Deep';
  requireNoWebsite?: boolean;
  allowWeakWebsite?: boolean;
  requireHiring?: boolean;
  requiredContactDetails?: 'any' | 'phone_only' | 'email_only' | 'both';
  opportunityType?: string;
  onlyGenuineEcommerce?: boolean;
  ecommerceWebsiteOpportunitiesOnly?: boolean;
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
    subNiche: options.subNiche,
    province: options.province,
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
    qualificationFilters: {
      requireNoWebsite: options.requireNoWebsite,
      allowWeakWebsite: options.allowWeakWebsite,
      requireHiring: options.requireHiring,
      minQualityScore: options.minimumScore,
    },
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

  const isCombinedUKUSA = options.country.toLowerCase().includes('uk + usa') || options.country.toLowerCase().includes('uk & us');
  const isAllEnabledMarkets = options.country.toLowerCase().includes('all enabled');
  const targetMarkets = isCombinedUKUSA
    ? ['United Kingdom', 'United States']
    : isAllEnabledMarkets
    ? ['Pakistan', 'United Kingdom', 'United States']
    : [options.country];

  currentRun.marketBreakdown = {};
  for (const m of targetMarkets) {
    currentRun.marketBreakdown[m] = { requested: 0, candidates: 0, qualified: 0, status: 'pending' };
  }

  try {
    for (let mIdx = 0; mIdx < targetMarkets.length; mIdx++) {
      const subMarket = targetMarkets[mIdx];
      const baseCount = Math.floor(options.leadCount / targetMarkets.length);
      const remainder = options.leadCount % targetMarkets.length;
      const subTargetCount = Math.max(1, baseCount + (mIdx < remainder ? 1 : 0));

      if (currentRun.marketBreakdown) {
        currentRun.marketBreakdown[subMarket].requested = subTargetCount;
        currentRun.marketBreakdown[subMarket].status = 'in_progress';
      }

      try {
        // Stage 1: Search Planning for Sub-Market
        const stageProgressBase = Math.floor((mIdx / targetMarkets.length) * 100);
        updateProgress('SEARCH_PLANNING', Math.min(95, stageProgressBase + 5));
        const plan = createSearchPlan(
          subMarket,
          options.niche,
          options.location,
          subTargetCount,
          {
            subNiche: options.subNiche,
            province: options.province,
            customSearchTerms: options.customSearchTerms,
            qualificationFilters: currentRun.qualificationFilters,
          }
        );

        // Stage 2: Candidate Discovery
        updateProgress('CANDIDATE_DISCOVERY', Math.min(95, stageProgressBase + 15), { status: 'discovering' });
        const discoveryResult = await discoverCandidatesWithGrounding(
          plan,
          plan.candidateTargetPoolSize,
          (found) => {
            currentRun.candidatesFound += found;
            if (currentRun.marketBreakdown) {
              currentRun.marketBreakdown[subMarket].candidates += found;
            }
          }
        );

        currentRun.sourcesUsed = Array.from(new Set([...currentRun.sourcesUsed, ...discoveryResult.sourcesUsed]));

        if (discoveryResult.isSafeMode && discoveryResult.statusMessage) {
          currentRun.errors.push(`[${subMarket}] ${discoveryResult.statusMessage}`);
          console.warn(`[Orchestrator] Discovery in Safe Mode for ${subMarket}: ${discoveryResult.statusMessage}`);
        }

        // Tag all candidates strictly with subMarket to prevent cross-contamination
        for (const cand of discoveryResult.candidates) {
          if (!cand.country || cand.country === 'All enabled markets' || cand.country === 'UK + USA') {
            cand.country = subMarket;
          }
        }

        if (currentRun.marketBreakdown) {
          currentRun.marketBreakdown[subMarket].candidates = discoveryResult.candidates.length;
        }

        // Stage 3: Provenance Validation & Deduplication of Candidates
        updateProgress('DEDUPLICATION', Math.min(95, stageProgressBase + 25));
        const uniqueCandidates: CandidateBusiness[] = [];
        const localRunDupSet = new Set<string>();

        for (const cand of discoveryResult.candidates) {
          const provenance = validateCandidateProvenance(cand);
          if (!provenance.valid) {
            currentRun.rejectedCount++;
            currentRun.errors.push(`Rejected ungrounded candidate "${cand.companyName}": ${provenance.reason}`);
            continue;
          }

          const dupKey = generateDuplicateKey(
            cand.companyName,
            cand.country || subMarket,
            cand.website,
            cand.phone,
            cand.city
          );

          if (localRunDupSet.has(dupKey)) {
            currentRun.duplicatesRemoved++;
            continue;
          }

          if (options.freshLeadsOnly && existingDupSet.has(dupKey)) {
            currentRun.duplicatesRemoved++;
            continue;
          }

          if (options.excludeContacted && contactedSet.has(dupKey)) {
            currentRun.duplicatesRemoved++;
            continue;
          }

          localRunDupSet.add(dupKey);
          uniqueCandidates.push(cand);
        }

        // Stage 4: Deep Business Research & Website Audit
        updateProgress('BUSINESS_RESEARCH', Math.min(95, stageProgressBase + 35), { status: 'researching' });
        let subMarketQualified = 0;

        for (let i = 0; i < uniqueCandidates.length; i++) {
          if (subMarketQualified >= subTargetCount || qualifiedLeads.length >= options.leadCount) {
            break;
          }

          const cand = uniqueCandidates[i];
          const researchResult = await conductDeepBusinessResearch(
            cand,
            userId,
            runId,
            options.niche,
            subMarket
          );

          currentRun.researchCompleted++;

          if (researchResult) {
            const { lead, evidence } = researchResult;
            lead.country = subMarket; // Explicit guarantee against cross-contamination

            // Stage 5: Quality Control
            const qc = performQualityControl(lead, existingDupSet, contactedSet, suppressedSet, {
              requestedCountry: subMarket,
              requestedNiche: options.niche,
              freshLeadsOnly: options.freshLeadsOnly,
              excludeContacted: options.excludeContacted,
              minimumScore: options.minimumScore,
              targetStrength: options.targetStrength,
              requireNoWebsite: options.requireNoWebsite,
              allowWeakWebsite: options.allowWeakWebsite,
              requireHiring: options.requireHiring,
              requiredContactDetails: options.requiredContactDetails,
              opportunityType: options.opportunityType,
              onlyGenuineEcommerce: options.onlyGenuineEcommerce,
              ecommerceWebsiteOpportunitiesOnly: options.ecommerceWebsiteOpportunitiesOnly,
            });

            if (qc.passed) {
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

              subMarketQualified++;
              currentRun.qualifiedCount = qualifiedLeads.length;
              if (currentRun.marketBreakdown) {
                currentRun.marketBreakdown[subMarket].qualified = subMarketQualified;
              }

              // Track Industry & City Breakdowns
              const indKey = lead.industry || options.niche;
              const cityKey = lead.city || 'Unknown';
              if (!currentRun.industryBreakdown) currentRun.industryBreakdown = {};
              if (!currentRun.industryBreakdown[indKey]) {
                currentRun.industryBreakdown[indKey] = { requested: options.leadCount, candidates: 0, qualified: 0 };
              }
              currentRun.industryBreakdown[indKey].qualified++;

              if (!currentRun.cityBreakdown) currentRun.cityBreakdown = {};
              if (!currentRun.cityBreakdown[cityKey]) {
                currentRun.cityBreakdown[cityKey] = { requested: 0, candidates: 0, qualified: 0 };
              }
              currentRun.cityBreakdown[cityKey].qualified++;
            } else {
              currentRun.rejectedCount++;
            }
          } else {
            currentRun.rejectedCount++;
          }
        }

        if (currentRun.marketBreakdown) {
          currentRun.marketBreakdown[subMarket].status = 'completed';
        }
      } catch (subErr) {
        const subMsg = subErr instanceof Error ? subErr.message : String(subErr);
        currentRun.errors.push(`[${subMarket}] Error: ${subMsg}`);
        console.error(`[Orchestrator] Error in sub-market ${subMarket}:`, subErr);
        if (currentRun.marketBreakdown) {
          currentRun.marketBreakdown[subMarket].status = 'failed';
        }
      }
    }

    // Final calculations
    currentRun.finalCount = qualifiedLeads.length;
    currentRun.shortfall = Math.max(0, options.leadCount - qualifiedLeads.length);
    currentRun.durationMs = Date.now() - startTime;
    currentRun.status = currentRun.shortfall > 0 ? (qualifiedLeads.length > 0 ? 'partial' : 'failed') : 'completed';
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
