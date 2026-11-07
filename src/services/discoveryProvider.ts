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
let sharedGroundingQuotaExhausted = false;
let sharedGroundingQuotaResetTime = 0;

export class GoogleSearchGroundingDiscoveryProvider implements BusinessDiscoveryProvider {
  public readonly name = 'Google Search Grounding';

  async isAvailable(): Promise<{ available: boolean; state: string; reason?: string }> {
    if (!process.env.GEMINI_API_KEY) {
      return {
        available: false,
        state: 'BUSINESS_DISCOVERY_PROVIDER_UNAVAILABLE',
        reason: 'GEMINI_API_KEY not configured in environment.',
      };
    }

    if (sharedGroundingQuotaExhausted && Date.now() < sharedGroundingQuotaResetTime) {
      return {
        available: false,
        state: 'SEARCH_GROUNDING_QUOTA_BLOCKED',
        reason: 'Google Search Grounding quota exhausted (429 RESOURCE_EXHAUSTED). Backoff cooldown active.',
      };
    }

    if (sharedGroundingQuotaExhausted && Date.now() >= sharedGroundingQuotaResetTime) {
      sharedGroundingQuotaExhausted = false;
    }

    return {
      available: true,
      state: 'SEARCH_GROUNDING_ACTIVE',
    };
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
      let response: any = null;
      const maxAttempts = 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: PRIMARY_MODEL,
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              temperature: 0.2,
            },
          });
          break;
        } catch (callErr: any) {
          const isQuota =
            callErr?.status === 429 ||
            String(callErr).includes('429') ||
            String(callErr).includes('RESOURCE_EXHAUSTED');
          if (isQuota && attempt < maxAttempts) {
            console.warn(`[DiscoveryProvider] Google Search Grounding 429 encountered. Backing off 2000ms before retry...`);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          throw callErr;
        }
      }

      const responseText = response?.text || '';
      const candidateObj = response?.candidates?.[0];
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
        sharedGroundingQuotaExhausted = true;
        sharedGroundingQuotaResetTime = Date.now() + 30000;
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
  private isQuotaExhausted = false;
  private quotaResetTime = 0;

  async isAvailable(): Promise<{ available: boolean; state: string; reason?: string }> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return {
        available: false,
        state: 'BUSINESS_DISCOVERY_PROVIDER_UNAVAILABLE',
        reason: 'GOOGLE_MAPS_API_KEY not configured in environment.',
      };
    }

    if (this.isQuotaExhausted && Date.now() < this.quotaResetTime) {
      return {
        available: false,
        state: 'PLACES_API_QUOTA_BLOCKED',
        reason: 'Google Places API quota exceeded (HTTP 429 RATE_LIMIT_EXCEEDED). Safe Mode active.',
      };
    }

    // Reset flag if cooldown expired
    if (this.isQuotaExhausted && Date.now() >= this.quotaResetTime) {
      this.isQuotaExhausted = false;
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

    if (this.isQuotaExhausted && Date.now() < this.quotaResetTime) {
      return {
        providerName: this.name,
        isOperational: false,
        candidates: [],
        sourcesUsed: [],
        rejectionCount: 0,
        errorReason: 'PLACES_API_QUOTA_EXHAUSTED',
      };
    }

    const searchQuery = request.query || `${request.niche} in ${request.location || request.country}`;
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.businessStatus,places.types,nextPageToken',
    };

    const verifiedCandidates: CandidateBusiness[] = [];
    const sourcesUsed: string[] = [];
    let rejectionCount = 0;
    const nowIso = new Date().toISOString();

    let pageToken: string | undefined = undefined;
    const maxPages = request.targetCount > 20 ? Math.min(3, Math.ceil(request.targetCount / 20)) : 1;

    for (let page = 0; page < maxPages; page++) {
      const body: Record<string, any> = {
        textQuery: searchQuery,
        pageSize: 20,
      };
      if (pageToken) {
        body.pageToken = pageToken;
      }

      try {
        let response: Response | null = null;
        let lastErrorText = '';
        const maxRetries = 3;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(body),
            });

            if (response.ok) {
              break;
            }

            lastErrorText = await response.text();
            const isRateLimit =
              response.status === 429 ||
              lastErrorText.includes('RESOURCE_EXHAUSTED') ||
              lastErrorText.includes('RATE_LIMIT_EXCEEDED');

            if (isRateLimit && attempt < maxRetries) {
              const retryAfterHeader = response.headers.get('retry-after');
              const baseBackoff = retryAfterHeader
                ? Math.max(1, parseInt(retryAfterHeader, 10)) * 1000
                : Math.min(8000, 1500 * Math.pow(2, attempt));
              const jitter = Math.floor(Math.random() * 600);
              const waitMs = baseBackoff + jitter;

              console.log(
                `[PlacesDiscovery] Places API rate limit (429) hit. Backing off ${waitMs}ms before retry ${attempt + 1}/${maxRetries}...`
              );
              await new Promise((r) => setTimeout(r, waitMs));
              continue;
            }

            // Other HTTP status or retries exhausted
            break;
          } catch (fetchErr: unknown) {
            if (attempt < maxRetries) {
              const waitMs = 1500 * Math.pow(2, attempt) + Math.floor(Math.random() * 500);
              console.log(`[PlacesDiscovery] Network error during request. Retrying in ${waitMs}ms...`);
              await new Promise((r) => setTimeout(r, waitMs));
              continue;
            }
            throw fetchErr;
          }
        }

        if (!response || !response.ok) {
          const status = response ? response.status : 0;
          const isRateLimit =
            status === 429 ||
            lastErrorText.includes('RESOURCE_EXHAUSTED') ||
            lastErrorText.includes('RATE_LIMIT_EXCEEDED');

          if (isRateLimit) {
            this.isQuotaExhausted = true;
            this.quotaResetTime = Date.now() + 45000;
            console.warn('[PlacesDiscovery] Places API rate limit reached (HTTP 429). Safe Mode activated for 45s.');
          } else {
            console.warn(`[PlacesDiscovery] Places API error HTTP ${status}: ${lastErrorText.slice(0, 200)}`);
          }

          if (page === 0 && verifiedCandidates.length === 0) {
            return {
              providerName: this.name,
              isOperational: false,
              candidates: [],
              sourcesUsed: [],
              rejectionCount: 0,
              errorReason: isRateLimit ? 'PLACES_API_QUOTA_EXHAUSTED' : `PLACES_API_HTTP_${status}`,
            };
          }
          break;
        }

        const data = await response.json();
        const places = data.places || [];

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

        pageToken = data.nextPageToken;
        if (!pageToken || verifiedCandidates.length >= request.targetCount) {
          break;
        }

        // Paced delay between paginated pages to respect rate limits
        await new Promise((r) => setTimeout(r, 900));
      } catch (err: any) {
        console.error('[PlacesDiscovery] Network or fetch error on page', page, err);
        if (page === 0) {
          return {
            providerName: this.name,
            isOperational: false,
            candidates: [],
            sourcesUsed: [],
            rejectionCount: 0,
            errorReason: err?.message || String(err),
          };
        }
        break;
      }
    }

    return {
      providerName: this.name,
      isOperational: true,
      candidates: verifiedCandidates,
      sourcesUsed,
      rejectionCount,
    };
  }
}

/**
 * E-Commerce & D2C Storefront Discovery Adapter
 * (Section B: Truth-in-Discovery for Online Merchants)
 *
 * CRITICAL RULE:
 * Does NOT depend on Google Maps discovery, because online D2C stores and
 * social commerce merchants usually do not operate physical retail storefronts.
 * Uses web search grounding specifically targeting public storefronts, brand
 * websites, Shopify/WooCommerce footprints, Cash on Delivery (COD) services,
 * and direct-to-consumer catalogs.
 */
export class EcommerceStorefrontDiscoveryProvider implements BusinessDiscoveryProvider {
  public readonly name = 'E-Commerce Storefront Discovery';

  async isAvailable(): Promise<{ available: boolean; state: string; reason?: string }> {
    if (!process.env.GEMINI_API_KEY) {
      return {
        available: false,
        state: 'ECOMMERCE_DISCOVERY_UNAVAILABLE',
        reason: 'GEMINI_API_KEY not configured in environment.',
      };
    }
    if (sharedGroundingQuotaExhausted && Date.now() < sharedGroundingQuotaResetTime) {
      return {
        available: false,
        state: 'SEARCH_GROUNDING_QUOTA_BLOCKED',
        reason: 'Search grounding quota cooldown active.',
      };
    }
    if (sharedGroundingQuotaExhausted && Date.now() >= sharedGroundingQuotaResetTime) {
      sharedGroundingQuotaExhausted = false;
    }
    return { available: true, state: 'ECOMMERCE_DISCOVERY_ACTIVE' };
  }

  async searchBusinesses(request: BusinessDiscoveryRequest): Promise<DiscoveryProviderResult> {
    // If Meta Access Token is available, securely query Meta Graph API for verified business pages
    const metaToken = process.env.META_ACCESS_TOKEN || process.env.INSTAGRAM_GRAPH_API_KEY;
    if (metaToken) {
      try {
        const metaUrl = `https://graph.facebook.com/v19.0/pages/search?q=${encodeURIComponent(request.query || request.niche)}&fields=id,name,link,phone,emails,website,single_line_address&access_token=${metaToken}`;
        const metaResp = await fetch(metaUrl, { signal: AbortSignal.timeout(3000) });
        if (metaResp.ok) {
          const metaJson = await metaResp.json();
          console.log(`[EcommerceDiscovery] Meta Graph API returned ${metaJson.data?.length || 0} business pages.`);
        }
      } catch (me) {
        console.warn('[EcommerceDiscovery] Meta Graph API lookup notice (using grounded discovery):', me);
      }
    }

    const ai = getGeminiClient();
    const prompt = `You are an expert E-Commerce, D2C brand & Social Commerce intelligence specialist.
Search for genuine, real operating e-commerce stores, direct-to-consumer (D2C) brands, and online merchants matching:
Country: ${request.country}
Location: ${request.location || request.country}
Niche: ${request.niche}
Query: "${request.query}"

SPECIFIC E-COMMERCE & SOCIAL OMNI-CHANNEL RULES:
1. Search public web storefronts, independent brand domains, Shopify/WooCommerce stores, Instagram business brand profiles, and official Facebook commercial pages.
2. DO NOT rely on Google Maps physical store listings. Prioritize digital brands with independent online shopping or social-commerce ordering channels.
3. Check for Cash on Delivery (COD), nationwide courier delivery across Pakistan (TCS, Leopards, Trax), active shopping carts, or WhatsApp order funnels.
4. Extract:
   - companyName: Exact official brand or store name
   - website: Direct official storefront URL (or official Instagram/Facebook storefront link if no independent domain exists)
   - phone: Public customer support or WhatsApp order number (preserve 03xx local format for Pakistan)
   - whatsapp: WhatsApp click-to-chat link or order number (wa.me)
   - instagram: Official Instagram handle or profile URL (e.g. instagram.com/brandname)
   - facebook: Official Facebook business page URL
   - address: Office, warehouse, or operational city
   - city: Operating headquarters or dispatch city
   - sourceUrl: Exact verifiable web link where this brand was discovered
   - rawSnippet: Evidence of active e-commerce selling (e.g., product catalog, COD, shipping policy, Instagram storefront)

Format as a JSON array of objects:
[
  {
    "companyName": "string",
    "website": "string",
    "phone": "string",
    "whatsapp": "string",
    "instagram": "string",
    "facebook": "string",
    "address": "string",
    "city": "string",
    "region": "string",
    "country": "${request.country}",
    "sourceUrl": "string",
    "sourceTitle": "string",
    "rawSnippet": "string"
  }
]
Output ONLY valid JSON.`;

    return executeGroundedCandidateSearch(ai, prompt, this.name, request);
  }
}

/**
 * Education & Training Institute Discovery Adapter
 * (Section B: Language Centres, Graphic Design Academies, Vocational Institutes)
 */
export class EducationInstituteDiscoveryProvider implements BusinessDiscoveryProvider {
  public readonly name = 'Education & Training Institute Discovery';

  async isAvailable(): Promise<{ available: boolean; state: string; reason?: string }> {
    if (process.env.GOOGLE_MAPS_API_KEY) {
      return { available: true, state: 'EDUCATION_PLACES_ACTIVE' };
    }
    if (!process.env.GEMINI_API_KEY) {
      return {
        available: false,
        state: 'EDUCATION_DISCOVERY_UNAVAILABLE',
        reason: 'Neither GOOGLE_MAPS_API_KEY nor GEMINI_API_KEY configured.',
      };
    }
    if (sharedGroundingQuotaExhausted && Date.now() < sharedGroundingQuotaResetTime) {
      return {
        available: false,
        state: 'SEARCH_GROUNDING_QUOTA_BLOCKED',
        reason: 'Search grounding quota cooldown active.',
      };
    }
    if (sharedGroundingQuotaExhausted && Date.now() >= sharedGroundingQuotaResetTime) {
      sharedGroundingQuotaExhausted = false;
    }
    return { available: true, state: 'EDUCATION_GROUNDING_ACTIVE' };
  }

  async searchBusinesses(request: BusinessDiscoveryRequest): Promise<DiscoveryProviderResult> {
    // If Google Places API (New) is configured, prioritize it for physical training centres
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const placesProvider = new GooglePlacesDiscoveryProvider();
      const placesAvail = await placesProvider.isAvailable();
      if (placesAvail.available) {
        const placesResult = await placesProvider.searchBusinesses(request);
        if (placesResult.isOperational && placesResult.candidates.length > 0) {
          return placesResult;
        }
      }
    }

    const ai = getGeminiClient();
    const prompt = `You are a specialized education & vocational training research specialist.
Search for genuine, real operating English language centres, graphic design academies, IT institutes, and vocational training academies matching:
Country: ${request.country}
Location: ${request.location || request.country}
Niche: ${request.niche}
Query: "${request.query}"

SPECIFIC TRAINING INSTITUTE RULES:
1. Search for active academies with spoken English, IELTS, graphic design, UI/UX, full-stack, or vocational courses.
2. Identify official academy websites, active admissions, campus locations (Karachi, Lahore, Islamabad, etc.).
3. Extract:
   - companyName: Official academy/institute name
   - website: Official institute website URL
   - phone: Admissions or front-desk contact number
   - address: Campus address or neighborhood (e.g. Clifton, Gulshan, Gulberg, Blue Area)
   - city: City
   - sourceUrl: Verifiable external search result URL
   - rawSnippet: Course offerings or admissions status

Format as a JSON array of objects:
[
  {
    "companyName": "string",
    "website": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "region": "string",
    "country": "${request.country}",
    "sourceUrl": "string",
    "sourceTitle": "string",
    "rawSnippet": "string"
  }
]
Output ONLY valid JSON.`;

    return executeGroundedCandidateSearch(ai, prompt, this.name, request);
  }
}

/**
 * Vape Retail Discovery Adapter
 * (Section B: Regulated Retailers & Compliance Boundary)
 */
export class VapeRetailDiscoveryProvider implements BusinessDiscoveryProvider {
  public readonly name = 'Vape Retail Discovery';

  async isAvailable(): Promise<{ available: boolean; state: string; reason?: string }> {
    if (process.env.GOOGLE_MAPS_API_KEY) {
      return { available: true, state: 'VAPE_PLACES_ACTIVE' };
    }
    if (!process.env.GEMINI_API_KEY) {
      return {
        available: false,
        state: 'VAPE_DISCOVERY_UNAVAILABLE',
        reason: 'Neither GOOGLE_MAPS_API_KEY nor GEMINI_API_KEY configured.',
      };
    }
    if (sharedGroundingQuotaExhausted && Date.now() < sharedGroundingQuotaResetTime) {
      return {
        available: false,
        state: 'SEARCH_GROUNDING_QUOTA_BLOCKED',
        reason: 'Search grounding quota cooldown active.',
      };
    }
    if (sharedGroundingQuotaExhausted && Date.now() >= sharedGroundingQuotaResetTime) {
      sharedGroundingQuotaExhausted = false;
    }
    return { available: true, state: 'VAPE_GROUNDING_ACTIVE' };
  }

  async searchBusinesses(request: BusinessDiscoveryRequest): Promise<DiscoveryProviderResult> {
    // If Google Places API (New) is configured, prioritize it for physical retail shops
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const placesProvider = new GooglePlacesDiscoveryProvider();
      const placesAvail = await placesProvider.isAvailable();
      if (placesAvail.available) {
        const placesResult = await placesProvider.searchBusinesses(request);
        if (placesResult.isOperational && placesResult.candidates.length > 0) {
          return placesResult;
        }
      }
    }

    const ai = getGeminiClient();
    const prompt = `You are a compliance-grounded retail business researcher.
Search for genuine, real operating vape shops and smoke retail businesses matching:
Country: ${request.country}
Location: ${request.location || request.country}
Niche: ${request.niche}
Query: "${request.query}"

SPECIFIC COMPLIANCE & ACCURACY RULES:
1. ONLY discover publicly registered retail businesses and commercial storefronts.
2. DO NOT bypass age verification or platform access controls.
3. DO NOT infer customer intent or willingness to buy services.
4. Extract:
   - companyName: Official retail store name
   - website: Public website URL if available
   - phone: Public shop contact number
   - address: Physical store address or shopping mall outlet
   - city: City
   - sourceUrl: Verifiable external search result URL
   - rawSnippet: Operational status and publicly listed products

Format as a JSON array of objects:
[
  {
    "companyName": "string",
    "website": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "region": "string",
    "country": "${request.country}",
    "sourceUrl": "string",
    "sourceTitle": "string",
    "rawSnippet": "string"
  }
]
Output ONLY valid JSON.`;

    return executeGroundedCandidateSearch(ai, prompt, this.name, request);
  }
}

/**
 * Rent-a-Car Discovery Adapter
 * (Section B: Physical & Online Fleet Rental Discovery)
 */
export class RentACarDiscoveryProvider implements BusinessDiscoveryProvider {
  public readonly name = 'Rent-a-Car Discovery';

  async isAvailable(): Promise<{ available: boolean; state: string; reason?: string }> {
    if (process.env.GOOGLE_MAPS_API_KEY) {
      return { available: true, state: 'RENT_A_CAR_PLACES_ACTIVE' };
    }
    if (!process.env.GEMINI_API_KEY) {
      return {
        available: false,
        state: 'RENT_A_CAR_UNAVAILABLE',
        reason: 'Neither GOOGLE_MAPS_API_KEY nor GEMINI_API_KEY configured.',
      };
    }
    if (sharedGroundingQuotaExhausted && Date.now() < sharedGroundingQuotaResetTime) {
      return {
        available: false,
        state: 'SEARCH_GROUNDING_QUOTA_BLOCKED',
        reason: 'Search grounding quota cooldown active.',
      };
    }
    if (sharedGroundingQuotaExhausted && Date.now() >= sharedGroundingQuotaResetTime) {
      sharedGroundingQuotaExhausted = false;
    }
    return { available: true, state: 'RENT_A_CAR_GROUNDING_ACTIVE' };
  }

  async searchBusinesses(request: BusinessDiscoveryRequest): Promise<DiscoveryProviderResult> {
    // If Google Places API (New) is configured, prioritize it for physical fleet rentals
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const placesProvider = new GooglePlacesDiscoveryProvider();
      const placesAvail = await placesProvider.isAvailable();
      if (placesAvail.available) {
        return placesProvider.searchBusinesses(request);
      }
    }

    const ai = getGeminiClient();
    const prompt = `You are a commercial business researcher specialized in car rentals and fleet services.
Search for genuine, real operating rent-a-car companies, chauffeur-driven services, and car hire businesses matching:
Country: ${request.country}
Location: ${request.location || request.country}
Niche: ${request.niche}
Query: "${request.query}"

SPECIFIC RENT-A-CAR RULES:
1. Search for active car rental companies in ${request.location || request.country}.
2. Check for fleet reservation contacts, WhatsApp numbers (03xx format for Pakistan), airport transfer services.
3. Extract:
   - companyName: Official rent-a-car business name
   - website: Official website URL (or verified commercial listing)
   - phone: Booking/rental contact number
   - address: Office or airport terminal branch
   - city: City
   - sourceUrl: Verifiable external search result URL
   - rawSnippet: Rental services, chauffeur drive, luxury or economy fleet info

Format as a JSON array of objects:
[
  {
    "companyName": "string",
    "website": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "region": "string",
    "country": "${request.country}",
    "sourceUrl": "string",
    "sourceTitle": "string",
    "rawSnippet": "string"
  }
]
Output ONLY valid JSON.`;

    return executeGroundedCandidateSearch(ai, prompt, this.name, request);
  }
}

/**
 * Shared helper for executing grounded candidate searches with the hard safety gate.
 */
async function executeGroundedCandidateSearch(
  ai: any,
  prompt: string,
  providerName: string,
  request: BusinessDiscoveryRequest
): Promise<DiscoveryProviderResult> {
  try {
    let response: any = null;
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.2,
          },
        });
        break;
      } catch (callErr: any) {
        const isQuota =
          callErr?.status === 429 ||
          String(callErr).includes('429') ||
          String(callErr).includes('RESOURCE_EXHAUSTED');
        if (isQuota && attempt < maxAttempts) {
          console.warn(`[${providerName}] 429 rate limit encountered. Waiting 2000ms before retry...`);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw callErr;
      }
    }

    const responseText = response?.text || '';
    const candidateObj = response?.candidates?.[0];
    const grounding = candidateObj?.groundingMetadata as any;
    const chunks = grounding?.groundingChunks || [];
    const sourcesUsed: string[] = [];

    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        sourcesUsed.push(chunk.web.uri);
      }
    }

    if (sourcesUsed.length === 0) {
      console.warn(`[${providerName}] No grounding chunks returned. Enforcing safe mode.`);
      return {
        providerName,
        isOperational: false,
        candidates: [],
        sourcesUsed: [],
        rejectionCount: 0,
        errorReason: 'SEARCH_GROUNDING_NO_METADATA',
      };
    }

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
      console.warn(`[${providerName}] Failed to parse candidate JSON:`, pe);
      return {
        providerName,
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
        sourceTitle: item.sourceTitle || `${item.companyName} (${providerName})`,
        rawSnippet: item.rawSnippet || '',
        discoveryProvider: providerName,
        discoverySource: item.sourceTitle || `${providerName} Grounded Signal`,
        discoverySourceUrl: sourceUrl || '',
        discoveryTimestamp: nowIso,
        isGrounded: Boolean(sourceUrl && sourceUrl.startsWith('http')),
        facebook: item.facebook || undefined,
        instagram: item.instagram || undefined,
        linkedin: item.linkedin || undefined,
        whatsapp: item.whatsapp || undefined,
      };

      const val = validateCandidateProvenance(candidate);
      if (val.valid) {
        verifiedCandidates.push(candidate);
      } else {
        rejectionCount++;
      }
    }

    return {
      providerName,
      isOperational: true,
      candidates: verifiedCandidates,
      sourcesUsed,
      rejectionCount,
    };
  } catch (err: any) {
    const isQuota =
      err?.status === 429 ||
      String(err).includes('429') ||
      String(err).includes('RESOURCE_EXHAUSTED');

    if (isQuota) {
      sharedGroundingQuotaExhausted = true;
      sharedGroundingQuotaResetTime = Date.now() + 30000;
      console.warn(`[${providerName}] Quota exhausted (429). Safe Mode activated (0 candidates).`);
      return {
        providerName,
        isOperational: false,
        candidates: [],
        sourcesUsed: [],
        rejectionCount: 0,
        errorReason: 'SEARCH_GROUNDING_QUOTA_BLOCKED',
      };
    }

    return {
      providerName,
      isOperational: false,
      candidates: [],
      sourcesUsed: [],
      rejectionCount: 0,
      errorReason: err?.message || String(err),
    };
  }
}

/**
 * Multi-Source Discovery Router
 * Selects the optimal discovery strategy based on niche characteristics,
 * strictly decoupling E-Commerce from Google Maps as mandated by Section B.
 */
export class MultiSourceDiscoveryRouter implements BusinessDiscoveryProvider {
  public readonly name = 'Multi-Source Discovery Router';

  public resolveAdapter(niche: string): BusinessDiscoveryProvider {
    const n = (niche || '').toLowerCase();

    // 1. E-Commerce & D2C Brands -> strictly decoupled from Google Maps
    if (
      n.includes('ecommerce') ||
      n.includes('e-commerce') ||
      n.includes('online store') ||
      n.includes('d2c') ||
      n.includes('brand') ||
      n.includes('social commerce') ||
      n.includes('seller') ||
      n.includes('shopping') ||
      n.includes('clothing') ||
      n.includes('apparel') ||
      n.includes('pret') ||
      n.includes('shoe') ||
      n.includes('footwear') ||
      n.includes('watch') ||
      n.includes('beauty') ||
      n.includes('skincare') ||
      n.includes('cosmetic') ||
      n.includes('makeup') ||
      n.includes('electronics') ||
      n.includes('gadget') ||
      n.includes('home decor') ||
      n.includes('furniture') ||
      n.includes('lifestyle') ||
      n.includes('boutique') ||
      n.includes('accessories')
    ) {
      return new EcommerceStorefrontDiscoveryProvider();
    }

    // 2. Training Centres & Education Institutes
    if (
      n.includes('language') ||
      n.includes('graphic') ||
      n.includes('academy') ||
      n.includes('institute') ||
      n.includes('training') ||
      n.includes('centre') ||
      n.includes('center') ||
      n.includes('college') ||
      n.includes('vocational') ||
      n.includes('school') ||
      n.includes('education') ||
      n.includes('tuition') ||
      n.includes('coaching')
    ) {
      return new EducationInstituteDiscoveryProvider();
    }

    // 3. Vape-Related Retailers
    if (n.includes('vape') || n.includes('e-cigarette') || n.includes('smoke')) {
      return new VapeRetailDiscoveryProvider();
    }

    // 4. Rent-a-Car
    if (n.includes('rent') || n.includes('car') || n.includes('vehicle') || n.includes('chauffeur')) {
      return new RentACarDiscoveryProvider();
    }

    // Default: Google Places if key exists, else Google Search Grounding
    if (process.env.GOOGLE_MAPS_API_KEY) {
      return new GooglePlacesDiscoveryProvider();
    }
    return new GoogleSearchGroundingDiscoveryProvider();
  }

  async isAvailable(): Promise<{ available: boolean; state: string; reason?: string }> {
    return { available: true, state: 'ROUTER_READY' };
  }

  async searchBusinesses(request: BusinessDiscoveryRequest): Promise<DiscoveryProviderResult> {
    const adapter = this.resolveAdapter(request.niche);
    return adapter.searchBusinesses(request);
  }
}

/**
 * Returns the configured business discovery provider.
 * When niche is provided, routes to the niche-specialized adapter.
 */
let cachedRouter: MultiSourceDiscoveryRouter | null = null;

export function getDiscoveryProvider(niche?: string): BusinessDiscoveryProvider {
  if (!cachedRouter) {
    cachedRouter = new MultiSourceDiscoveryRouter();
  }
  if (niche) {
    return cachedRouter.resolveAdapter(niche);
  }
  if (process.env.GOOGLE_MAPS_API_KEY) {
    return new GooglePlacesDiscoveryProvider();
  }
  return new GoogleSearchGroundingDiscoveryProvider();
}

