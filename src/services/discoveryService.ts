/**
 * Candidate Discovery Engine (Step 6)
 *
 * HARD SAFETY GATE:
 * Uses BusinessDiscoveryProvider to find verified, operating local businesses
 * backed by real external grounding.
 *
 * If the provider is unavailable or quota-blocked (HTTP 429), it NEVER falls
 * back to ungrounded Gemini model synthesis. In Safe Mode, it returns zero
 * candidates rather than fabricating unverified businesses.
 */

import { CandidateBusiness, SearchPlan } from '../types';
import { getDiscoveryProvider, validateCandidateProvenance } from './discoveryProvider';

export interface DiscoveryServiceResult {
  candidates: CandidateBusiness[];
  sourcesUsed: string[];
  providerName: string;
  isSafeMode: boolean;
  statusMessage?: string;
}

export async function discoverCandidatesWithGrounding(
  plan: SearchPlan,
  targetCount: number,
  onProgress?: (foundCount: number, currentQuery: string) => void
): Promise<DiscoveryServiceResult> {
  const provider = getDiscoveryProvider();
  const candidates: CandidateBusiness[] = [];
  const sourcesSet = new Set<string>();
  let isSafeMode = false;
  let statusMessage: string | undefined = undefined;

  // Check provider availability first
  const avail = await provider.isAvailable();
  if (!avail.available) {
    console.warn(`[DiscoveryService] Discovery provider unavailable (${avail.state}): ${avail.reason}`);
    return {
      candidates: [],
      sourcesUsed: [],
      providerName: provider.name,
      isSafeMode: true,
      statusMessage: `DISCOVERY_SAFE_MODE: ${avail.state} - ${avail.reason || 'Provider unavailable'}`,
    };
  }

  // Iterate through planned queries until targetCount is met
  for (const queryPlan of plan.queries) {
    if (candidates.length >= targetCount) {
      break;
    }

    if (onProgress) {
      onProgress(candidates.length, queryPlan.query);
    }

    try {
      const result = await provider.searchBusinesses({
        country: plan.country,
        niche: plan.niche,
        location: queryPlan.location,
        query: queryPlan.query,
        targetCount: targetCount - candidates.length,
      });

      if (!result.isOperational) {
        isSafeMode = true;
        statusMessage = `DISCOVERY_SAFE_MODE: Provider halted with ${result.errorReason || 'Provider error'}. Refusing ungrounded synthesis.`;
        console.warn(`[DiscoveryService] Provider halted: ${result.errorReason}. Halting discovery in Safe Mode.`);
        break; // Stop immediately rather than continuing or guessing
      }

      for (const s of result.sourcesUsed) {
        sourcesSet.add(s);
      }

      for (const cand of result.candidates) {
        const val = validateCandidateProvenance(cand);
        if (val.valid) {
          // Double-check no duplicate within this discovery step
          const exists = candidates.some(
            (c) =>
              c.companyName.toLowerCase() === cand.companyName.toLowerCase() &&
              c.city?.toLowerCase() === cand.city?.toLowerCase()
          );
          if (!exists) {
            candidates.push(cand);
          }
        }
      }

      // Throttling delay
      await new Promise((r) => setTimeout(r, 600));
    } catch (err: unknown) {
      console.error(`[DiscoveryService] Error during search query "${queryPlan.query}":`, err);
      isSafeMode = true;
      statusMessage = 'DISCOVERY_SAFE_MODE: Unexpected provider exception. Refusing ungrounded synthesis.';
      break;
    }
  }

  return {
    candidates,
    sourcesUsed: Array.from(sourcesSet),
    providerName: provider.name,
    isSafeMode,
    statusMessage,
  };
}
