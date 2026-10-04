/**
 * Business Discovery Provider Abstraction & Hard Safety Gate
 * (Step 6: Truth-in-Discovery Architecture)
 *
 * CRITICAL RULE:
 * The application must NEVER create or return business candidates from
 * ungrounded Gemini model synthesis. If a verified public/external provider
 * is unavailable or returns 429 quota exhaustion, discovery must fail-safe
 * and return zero candidates rather than fabricating data.
 */

import { CandidateBusiness } from '../types';
import { getGeminiClient, PRIMARY_MODEL } from './geminiClient';

export interface BusinessDiscoveryRequest {
  country: string;
  niche: string;
  location?: string;
  query: string;
  targetCount: number;
}

export interface DiscoveryProviderResult {
  providerName: string;
  isOperational: boolean;
  candidates: CandidateBusiness[];
  sourcesUsed: string[];
  rejectionCount: number;
  errorReason?: string;
}

export interface BusinessDiscoveryProvider {
  readonly name: string;
  isAvailable(): Promise<{ available: boolean; state: string; reason?: string }>;
  searchBusinesses(request: BusinessDiscoveryRequest): Promise<DiscoveryProviderResult>;
}

/**
 * Validates whether a candidate business has verifiable real-source provenance.
 * Reject any candidate that is ungrounded or lacks external source URL.
 */
export function validateCandidateProvenance(candidate: Partial<CandidateBusiness>): {
  valid: boolean;
  reason?: string;
} {
  if (!candidate.companyName || candidate.companyName.trim().length < 2) {
    return { valid: false, reason: 'INVALID_COMPANY_NAME: Empty or too short' };
  }

  const lowerName = candidate.companyName.toLowerCase();
  if (
    lowerName.includes('example') ||
    lowerName.includes('sample company') ||
    lowerName.includes('acme') ||
    lowerName === 'unknown'
  ) {
    return { valid: false, reason: 'INVALID_COMPANY_NAME: Generic placeholder detected' };
  }

  // HARD GATE: Candidate MUST have isGrounded === true
  if (candidate.isGrounded !== true) {
    return { valid: false, reason: 'UNGROUNDED_CANDIDATE: Model generated without verified grounding' };
  }

  // HARD GATE: Candidate MUST have a recorded discovery provider
  if (!candidate.discoveryProvider || candidate.discoveryProvider.trim().length === 0) {
    return { valid: false, reason: 'MISSING_PROVIDER: Candidate lacks discovery provider provenance' };
  }

  // HARD GATE: Candidate MUST have a verifiable external source URL
  if (!candidate.discoverySourceUrl || !candidate.discoverySourceUrl.startsWith('http')) {
    return { valid: false, reason: 'MISSING_SOURCE_URL: Candidate lacks verifiable external source URL' };
  }

  return { valid: true };
}

/**
 * Google Search Grounding Discovery Provider.
 * Discovers real operating businesses strictly using Google Search Grounding tool.
 * If search grounding returns 429 or is unavailable, IT NEVER FALLS BACK TO UNGROUNDED GEMINI.
 */
export class GoogleSearchGroundingDiscoveryProvider implements BusinessDiscoveryProvider {
  public readonly name = 'Google Search Grounding';

  async isAvailable(): Promise<{ available: boolean; state: string; reason?: string }> {
    const ai = getGeminiClient();
    try {
      const pingResp = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: 'Test search grounding availability. Respond with OK.',
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const grounding = pingResp.candidates?.[0]?.groundingMetadata as any;
      const chunks = grounding?.groundingChunks;
      if (pingResp.text && chunks && chunks.length > 0) {
        return {
          available: true,
          state: 'SEARCH_GROUNDING_ACTIVE',
        };
      }

      return {
        available: false,
        state: 'SEARCH_GROUNDING_NO_METADATA',
        reason: 'Search grounding tool responded without grounding chunks.',
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuota =
        err?.status === 429 ||
        errMsg.includes('429') ||
        errMsg.toLowerCase().includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED');

      if (isQuota) {
        return {
          available: false,
          state: 'SEARCH_GROUNDING_QUOTA_BLOCKED',
          reason: 'Google Search Grounding quota exhausted (429 RESOURCE_EXHAUSTED) on current API key tier.',
        };
      }

      return {
        available: false,
        state: 'BUSINESS_DISCOVERY_PROVIDER_UNAVAILABLE',
        reason: errMsg,
      };
    }
  }

  async searchBusinesses(request: BusinessDiscoveryRequest): Promise<DiscoveryProviderResult> {
    const ai = getGeminiClient();
    const prompt = `You are a strict B2B business intelligence researcher.
Search for genuine, real operating businesses matching the following criteria:
Country: ${request.country}
Location: ${request.location || request.country}
Niche: ${request.niche}
Query: "${request.query}"

RULES:
1. ONLY return REAL, publicly registered or commercially operating businesses found in actual Google web search results.
2. DO NOT fabricate or hallucinate any business names. If you only find 3 businesses, return only 3.
3. For each business, extract:
   - exact official company name
   - official website URL (or directory profile URL if no official website exists)
   - phone number (if publicly listed)
   - street address or neighborhood/area
   - city
   - region/state/county
   - Google rating or review count if reported in the search results
   - brief excerpt of evidence showing they are an active business

Format your response strictly as a JSON array of objects with the following schema:
[
  {
    "companyName": "string",
    "website": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "region": "string",
    "country": "${request.country}",
    "initialRating": "string",
    "initialReviews": "string",
    "sourceUrl": "string",
    "sourceTitle": "string",
    "rawSnippet": "string"
  }
]
Output ONLY valid JSON without markdown fences if possible, or inside a \`\`\`json block.`;

    try {
      // Execute STRICTLY with googleSearch tool
      const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });

      const responseText = response.text || '';
      const candidateObj = response.candidates?.[0];
      const grounding = candidateObj?.groundingMetadata as any;
      const chunks = grounding?.groundingChunks || [];
      const sourcesUsed: string[] = [];

      for (const chunk of chunks) {
        if (chunk.web?.uri) {
          sourcesUsed.push(chunk.web.uri);
        }
      }

      // HARD GATE: If no grounding chunks returned, this is NOT a grounded response
      if (sourcesUsed.length === 0) {
        console.warn('[DiscoveryProvider] No grounding chunks returned by Google Search Grounding. Rejecting output.');
        return {
          providerName: this.name,
          isOperational: false,
          candidates: [],
          sourcesUsed: [],
          rejectionCount: 0,
          errorReason: 'SEARCH_GROUNDING_NO_METADATA',
        };
      }

      // Parse JSON from grounded output
      let parsedList: any[] = [];
      try {
        let jsonStr = responseText.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        } else {
          const start = jsonStr.indexOf('[');
          const end = jsonStr.lastIndexOf(']');
          if (start !== -1 && end !== -1 && end > start) {
            jsonStr = jsonStr.substring(start, end + 1);
          }
        }
        if (jsonStr.startsWith('[') && jsonStr.endsWith(']')) {
          parsedList = JSON.parse(jsonStr);
        }
      } catch (pe) {
        console.warn('[DiscoveryProvider] Failed to parse candidate JSON:', pe);
        return {
          providerName: this.name,
          isOperational: true,
          candidates: [],
          sourcesUsed,
          rejectionCount: 0,
          errorReason: 'PARSE_ERROR',
        };
      }

      const verifiedCandidates: CandidateBusiness[] = [];
      let rejectionCount = 0;
      const nowIso = new Date().toISOString();

      for (const item of parsedList) {
        // Associate source URL from grounding
        let sourceUrl = item.sourceUrl;
        if (!sourceUrl && sourcesUsed.length > 0) {
          sourceUrl = sourcesUsed[0];
        }

        const candidate: CandidateBusiness = {
          companyName: item.companyName ? String(item.companyName).trim() : '',
          website: item.website || '',
          phone: item.phone || '',
          address: item.address || '',
          city: item.city || request.location || '',
          region: item.region || '',
          country: request.country,
          sourceUrl: sourceUrl || '',
          sourceTitle: item.sourceTitle || `${item.companyName} Verified Search Grounding`,
          rawSnippet: item.rawSnippet || '',
          // Provenance Metadata
          discoveryProvider: this.name,
          discoverySource: item.sourceTitle || 'Google Web Search Grounding',
          discoverySourceUrl: sourceUrl || '',
          discoveryTimestamp: nowIso,
          isGrounded: Boolean(sourceUrl && sourceUrl.startsWith('http')),
        };

        const val = validateCandidateProvenance(candidate);
        if (val.valid) {
          verifiedCandidates.push(candidate);
        } else {
          rejectionCount++;
          console.warn(`[DiscoveryProvider] Candidate rejected: ${val.reason} (${candidate.companyName})`);
        }
      }

      return {
        providerName: this.name,
        isOperational: true,
        candidates: verifiedCandidates,
        sourcesUsed,
        rejectionCount,
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuota =
        err?.status === 429 ||
        errMsg.includes('429') ||
        errMsg.toLowerCase().includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED');

      if (isQuota) {
        // HARD SAFETY GATE: DO NOT CALL UNGROUNDED GEMINI.
        // Return 0 candidates in Safe Mode.
        console.warn(
          '[DiscoveryProvider] Google Search Grounding 429 quota blocked. Entering Safe Mode (0 candidates returned).'
        );
        return {
          providerName: this.name,
          isOperational: false,
          candidates: [],
          sourcesUsed: [],
          rejectionCount: 0,
          errorReason: 'SEARCH_GROUNDING_QUOTA_BLOCKED',
        };
      }

      console.error('[DiscoveryProvider] Error during grounded search:', errMsg);
      return {
        providerName: this.name,
        isOperational: false,
        candidates: [],
        sourcesUsed: [],
        rejectionCount: 0,
        errorReason: errMsg,
      };
    }
  }
}

/**
 * Google Places API (New) Discovery Provider.
 * Discovers real, operating commercial businesses with verified Place IDs,
 * phone numbers, physical addresses, websites, and user ratings.
 * Keeps credentials server-side.
 */
export class GooglePlacesDiscoveryProvider implements BusinessDiscoveryProvider {
  public readonly name = 'Google Places API (New)';

  async isAvailable(): Promise<{ available: boolean; state: string; reason?: string }> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return {
        available: false,
        state: 'BUSINESS_DISCOVERY_PROVIDER_UNAVAILABLE',
        reason: 'GOOGLE_MAPS_API_KEY not configured in environment.',
      };
    }
    return {
      available: true,
      state: 'BUSINESS_DISCOVERY_PROVIDER_ACTIVE',
    };
  }

  async searchBusinesses(request: BusinessDiscoveryRequest): Promise<DiscoveryProviderResult> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return {
        providerName: this.name,
        isOperational: false,
        candidates: [],
        sourcesUsed: [],
        rejectionCount: 0,
        errorReason: 'MISSING_API_KEY',
      };
    }

    const searchQuery = `${request.niche} in ${request.location || request.country}`;
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const body = {
      textQuery: searchQuery,
      pageSize: Math.min(Math.max(request.targetCount, 1), 20),
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.businessStatus,places.types',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[PlacesDiscovery] Places API error HTTP ${response.status}:`, errorText);
        return {
          providerName: this.name,
          isOperational: false,
          candidates: [],
          sourcesUsed: [],
          rejectionCount: 0,
          errorReason: `PLACES_API_HTTP_${response.status}`,
        };
      }

      const data = await response.json();
      const places = data.places || [];
      const verifiedCandidates: CandidateBusiness[] = [];
      const sourcesUsed: string[] = [];
      let rejectionCount = 0;
      const nowIso = new Date().toISOString();

      for (const p of places) {
        const companyName = p.displayName?.text?.trim() || '';
        const sourceUrl = p.googleMapsUri || (p.id ? `https://maps.google.com/?cid=${p.id}` : '');
        if (sourceUrl) {
          sourcesUsed.push(sourceUrl);
        }

        const candidate: CandidateBusiness = {
          companyName,
          website: p.websiteUri || '',
          phone: p.internationalPhoneNumber || p.nationalPhoneNumber || '',
          address: p.formattedAddress || '',
          city: request.location || '',
          country: request.country,
          googlePlaceId: p.id,
          sourceUrl,
          sourceTitle: `${companyName} (Google Maps Place)`,
          rawSnippet: `Operational status: ${p.businessStatus || 'Unknown'}. Categories: ${(p.types || []).join(', ')}`,
          discoveryProvider: this.name,
          discoverySource: 'Google Maps Places API (New) Transient Signal',
          discoverySourceUrl: sourceUrl,
          discoveryTimestamp: nowIso,
          isGrounded: Boolean(sourceUrl && sourceUrl.startsWith('http')),
        };

        const val = validateCandidateProvenance(candidate);
        if (val.valid) {
          verifiedCandidates.push(candidate);
        } else {
          rejectionCount++;
          console.warn(`[PlacesDiscovery] Rejected candidate "${candidate.companyName}": ${val.reason}`);
        }
      }

      return {
        providerName: this.name,
        isOperational: true,
        candidates: verifiedCandidates,
        sourcesUsed,
        rejectionCount,
      };
    } catch (err: any) {
      console.error('[PlacesDiscovery] Network or fetch error:', err);
      return {
        providerName: this.name,
        isOperational: false,
        candidates: [],
        sourcesUsed: [],
        rejectionCount: 0,
        errorReason: err?.message || String(err),
      };
    }
  }
}

/**
 * Returns the configured business discovery provider.
 * When GOOGLE_MAPS_API_KEY is present, uses GooglePlacesDiscoveryProvider.
 * Otherwise falls back to GoogleSearchGroundingDiscoveryProvider (which cleanly
 * activates Safe Mode if 429 quota exhaustion occurs).
 */
let cachedProvider: BusinessDiscoveryProvider | null = null;

export function getDiscoveryProvider(): BusinessDiscoveryProvider {
  if (process.env.GOOGLE_MAPS_API_KEY) {
    if (!cachedProvider || cachedProvider.name !== 'Google Places API (New)') {
      cachedProvider = new GooglePlacesDiscoveryProvider();
    }
    return cachedProvider;
  }
  if (!cachedProvider || cachedProvider.name !== 'Google Search Grounding') {
    cachedProvider = new GoogleSearchGroundingDiscoveryProvider();
  }
  return cachedProvider;
}
