/**
 * Lead Compliance & Google Maps Platform Policy Enforcer
 * (Step 9: Policy Compliance Architecture)
 *
 * Implements strict data flow controls required by Google Maps Platform Terms
 * (specifically Section 3.2.3 "No Pre-Fetching, Caching, or Storage of Content"
 * and Section 3.2.4 "Restrictions on Content Export and Aggregation"):
 *
 * 1. Google Places is used strictly as a transient candidate discovery/verification signal.
 * 2. Permanent lead data (name, phone, email, address, services, opportunities)
 *    is sourced independently from the business's own official website or public corporate registry.
 * 3. Place IDs are permitted to be stored indefinitely (Section 3.2.3(a)(ii)).
 * 4. Google Reviews and Ratings are classified as RESTRICTED and MUST NOT be persisted
 *    to Firestore or exported to Excel/CSV.
 * 5. Bulk Google Places payloads are prohibited from storage.
 */

import { Lead, LeadSourceType } from '../types';

export interface CompliantLeadRecord extends Omit<Lead, 'googleRating' | 'googleReviews'> {
  googlePlaceId?: string;
  sourceType: LeadSourceType;
  sourceUrl: string;
  retrievedAt: string;
  sourceProvider: string;
  isGoogleDerived: boolean;
  commercialVerification: string;
}

export interface ComplianceValidationResult {
  compliant: boolean;
  violations: string[];
}

// Prohibited keys that must NEVER enter persistent storage
const RESTRICTED_PERSISTENCE_KEYS = [
  'googleRating',
  'googleReviews',
  'rating',
  'userRatingCount',
  'placesPayload',
  'rawPlacesData',
  'placesResponse',
  'reviews',
  'userReviews',
];

/**
 * Validates a lead object against Google Maps Platform storage and export policies.
 */
export function validateLeadCompliance(lead: any): ComplianceValidationResult {
  const violations: string[] = [];

  if (!lead) {
    return { compliant: false, violations: ['Lead object is null or undefined'] };
  }

  // Check 1: Restricted Google-derived fields must not be present
  for (const restrictedKey of RESTRICTED_PERSISTENCE_KEYS) {
    if (lead[restrictedKey] !== undefined && lead[restrictedKey] !== '' && lead[restrictedKey] !== 'Unknown') {
      violations.push(`RESTRICTED_FIELD_DETECTED: "${restrictedKey}" is not permitted to be persisted or exported under Google Maps Terms.`);
    }
  }

  // Check 2: Raw payload check
  if (lead.rawSnippet && (lead.rawSnippet.includes('reviews') || lead.rawSnippet.includes('userRatingCount'))) {
    violations.push('RESTRICTED_PAYLOAD_DETECTED: Raw snippet contains Google reviews or ratings data.');
  }

  // Check 3: If marked as Google-derived for permanent lead data, reject
  if (lead.isGoogleDerived === true && lead.sourceType !== 'transient_signal') {
    violations.push('POLICY_VIOLATION: Permanent lead records must be independently sourced from business website or registry, not Google-derived.');
  }

  // Check 4: Place ID validity (Place ID may be stored indefinitely under Section 3.2.3(a)(ii))
  if (lead.googlePlaceId && typeof lead.googlePlaceId === 'string') {
    if (!lead.googlePlaceId.startsWith('ChIJ') && !lead.googlePlaceId.startsWith('place_')) {
      violations.push('INVALID_PLACE_ID: Place ID does not conform to standard format.');
    }
  }

  // Check 5: Source provenance completeness
  if (!lead.sourceUrl || typeof lead.sourceUrl !== 'string' || !lead.sourceUrl.startsWith('http')) {
    violations.push('MISSING_INDEPENDENT_SOURCE: Every compliant lead must cite a valid independent source URL.');
  }

  return {
    compliant: violations.length === 0,
    violations,
  };
}

/**
 * Strips any restricted Google-derived fields and packages the lead into a
 * policy-compliant record safe for Firestore persistence.
 */
export function sanitizeLeadForPersistence(lead: Lead): CompliantLeadRecord {
  const sanitized: Record<string, any> = { ...lead };

  // Strip restricted fields
  for (const key of RESTRICTED_PERSISTENCE_KEYS) {
    delete sanitized[key];
  }

  // Ensure independent source provenance
  const nowIso = new Date().toISOString();
  const independentUrl =
    lead.website && lead.website !== 'No Website Found' && lead.website.startsWith('http')
      ? lead.website
      : lead.sourceUrl && lead.sourceUrl.startsWith('http') && !lead.sourceUrl.includes('google.com')
      ? lead.sourceUrl
      : lead.website && lead.website !== 'No Website Found'
      ? `https://${lead.website}`
      : '';

  return {
    ...sanitized,
    commercialVerification: lead.commercialVerification || 'Verified Operational Website',
    googlePlaceId: lead.googlePlaceId || undefined,
    sourceType: lead.sourceType || 'business_website',
    sourceUrl: independentUrl,
    retrievedAt: lead.retrievedAt || nowIso,
    sourceProvider: lead.sourceProvider || 'Official Business Website / Public Presence',
    isGoogleDerived: false, // Independent permanent lead record
  } as CompliantLeadRecord;
}

const FORBIDDEN_FABRICATED_VALUES = [
  'public-web-register.org',
  'digital presence upgrade',
  'grounded web research',
  'opportunity identified',
  'web development / optimization',
  'date not verified',
];

/**
 * Validates that an export payload contains zero restricted Google-derived fields,
 * no leaked secrets, no fabricated default values, and valid source/evidence fields.
 */
export function validateExportCompliance(rows: Record<string, any>[]): ComplianceValidationResult {
  const violations: string[] = [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return { compliant: true, violations: [] };
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // 1. Company Name Check
    const company = String(row['Company Name'] || '').trim().replace(/^'/, '');
    if (!company || company.length < 2 || company.toLowerCase().startsWith('test')) {
      violations.push(`ROW_${i}: Invalid or missing Company Name ("${company}").`);
    }

    // 2. Lead Strength Check (Strictly 'A' or 'B')
    const strength = String(row['Lead Strength'] || '').trim().replace(/^'/, '');
    if (strength !== 'A' && strength !== 'B') {
      violations.push(`ROW_${i}: Invalid Lead Strength ("${strength}"). Only 'A' or 'B' permitted.`);
    }

    // 3. Lead Score Check
    const score = Number(row['Lead Score']);
    if (isNaN(score) || score < 0 || score > 100) {
      violations.push(`ROW_${i}: Invalid Lead Score ("${row['Lead Score']}"). Must be 0-100.`);
    }

    // 4. Required Source & Evidence Checks
    const problem = String(row['Business Problem'] || '').trim().replace(/^'/, '');
    const opportunity = String(row['Sales Opportunity'] || '').trim().replace(/^'/, '');
    const evidence = String(row['Need Evidence'] || '').trim().replace(/^'/, '');
    const source = String(row['Source'] || '').trim().replace(/^'/, '');

    if (!problem || problem === 'Not Found' || problem.length < 5) {
      violations.push(`ROW_${i}: Missing or insufficient Business Problem.`);
    }
    if (!opportunity || opportunity === 'Not Found' || opportunity.length < 5) {
      violations.push(`ROW_${i}: Missing or insufficient Sales Opportunity.`);
    }
    if (!evidence || evidence === 'Not Found' || evidence.length < 5) {
      violations.push(`ROW_${i}: Missing or insufficient Need Evidence.`);
    }
    if (!source || !source.startsWith('http') || source.includes('public-web-register.org')) {
      violations.push(`ROW_${i}: Missing or invalid independent Source URL ("${source}").`);
    }

    // 5. Inspect every column for restricted content, secrets, and fabricated values
    for (const [colName, val] of Object.entries(row)) {
      const lowerCol = colName.toLowerCase();
      const valStr = String(val || '');
      const lowerVal = valStr.toLowerCase();

      // Restricted Google data
      if (lowerCol.includes('google rating') || lowerCol.includes('google review') || lowerCol.includes('places payload')) {
        violations.push(`ROW_${i}: Column "${colName}" exports restricted Google Maps content.`);
      }

      // Leaked API keys or credentials
      if (valStr.includes('AIza') || (process.env.GEMINI_API_KEY && valStr.includes(process.env.GEMINI_API_KEY))) {
        violations.push(`ROW_${i}: Leaked API key detected in column "${colName}".`);
      }

      // Forbidden fabricated values
      for (const forbidden of FORBIDDEN_FABRICATED_VALUES) {
        if (lowerVal.includes(forbidden)) {
          violations.push(`ROW_${i}: Forbidden fabricated default value "${forbidden}" in column "${colName}".`);
        }
      }
    }
  }

  return {
    compliant: violations.length === 0,
    violations,
  };
}
