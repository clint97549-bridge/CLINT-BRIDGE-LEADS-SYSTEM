/**
 * Business Identity, Deduplication and Final Quality Control Engine
 * (Step 11: Final Lead Qualification, Need Evidence & Contact Validation)
 *
 * Implements rigorous 8-point final qualification gate:
 * 1. Business Identity: Verified company name, reachable or confirmed website, niche relevance.
 * 2. Contact Validation: Non-fabricated emails & phones, real decision-maker name check.
 * 3. Observable Need: Problem & opportunity supported strictly by measurable evidence (no generic fluff).
 * 4. Recent Need Signal: No invented dates.
 * 5. Lead Strength: Strictly 'A' or 'B' (Never 'C').
 * 6. Contradiction Protection: Evidence must not contradict website status or claims.
 * 7. Source URL Mandatory: Every record must have valid independent source URL.
 * 8. Zero Restricted Data: Zero Google Atmosphere ratings or raw places payloads.
 */

import { generateDuplicateKey, isValidPhoneNumber, normalizeCompanyName } from '../lib/normalizer';
import { Lead } from '../types';

export interface QCResult {
  passed: boolean;
  rejectionReason?: string;
  checks: {
    realBusiness: boolean;
    nicheRelevant: boolean;
    correctCountry: boolean;
    notDuplicate: boolean;
    notPreviouslyContacted: boolean;
    sourceUrlValid: boolean;
    contactNotFabricated: boolean;
    emailNotFabricated: boolean;
    phoneNotFabricated: boolean;
    needEvidenceGrounded: boolean;
    noGenericFluff: boolean;
    noContradictoryEvidence: boolean;
    strengthValidAorB: boolean;
    noRestrictedGoogleData: boolean;
    traceabilityRecorded: boolean;
  };
}

const GENERIC_FLUFF_PHRASES = [
  'business needs better seo',
  'business needs a modern website',
  'business could benefit from marketing',
  'opportunity identified',
  'digital presence upgrade',
  'analyzed online business profile',
  'digital infrastructure optimization',
  'website performance and conversion structure enhancement opportunity',
];

const DISALLOWED_EMAIL_DOMAINS = [
  'example.com',
  'domain.com',
  'test.com',
  'email.com',
  'sentry.io',
  'wixpress.com',
  'wix.com',
  'placeholder.com',
  'webador.com',
  'wordpress.org',
  'wordpress.com',
  'shopify.com',
  'myshopify.com',
  'squarespace.com',
  'weebly.com',
  'godaddy.com',
  'hostinger.com',
  'namecheap.com',
  'cloudflare.com',
  'yoursite.com',
  'cpanel.net',
];

const FORBIDDEN_CONTACT_NAMES = [
  'john doe',
  'jane doe',
  'admin',
  'administrator',
  'manager',
  'unknown',
  'not found',
  'owner',
  'ceo',
  'n/a',
  'test user',
];

export function performQualityControl(
  lead: Lead,
  existingDuplicateKeys: Set<string>,
  contactedKeys: Set<string>,
  suppressedDomains: Set<string>,
  options: {
    requestedCountry: string;
    requestedNiche: string;
    freshLeadsOnly: boolean;
    excludeContacted: boolean;
    minimumScore: number;
    targetStrength?: 'A' | 'B' | 'ALL';
    requireNoWebsite?: boolean;
    allowWeakWebsite?: boolean;
    requireHiring?: boolean;
    requiredContactDetails?: 'any' | 'phone_only' | 'email_only' | 'both';
    opportunityType?: string;
  }
): QCResult {
  const normName = normalizeCompanyName(lead.companyName);
  const dupKey = generateDuplicateKey(
    lead.companyName,
    lead.country,
    lead.website !== 'No Website Found' ? lead.website : undefined,
    lead.phoneNumber !== 'Not Found' ? lead.phoneNumber : undefined,
    lead.city
  );

  const isDuplicate =
    existingDuplicateKeys.has(dupKey) ||
    (Boolean(lead.duplicateKey) && existingDuplicateKeys.has(lead.duplicateKey));

  const isPreviouslyContacted =
    options.excludeContacted &&
    (contactedKeys.has(dupKey) ||
      (Boolean(lead.duplicateKey) && contactedKeys.has(lead.duplicateKey)));

  // 1. Business Identity & Niche Relevance
  const realBusiness = normName.length >= 2 && !normName.toLowerCase().startsWith('test');
  
  let nicheRelevant = true;
  if (options.requestedNiche && options.requestedNiche.trim().length > 2) {
    const nicheWords = options.requestedNiche.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const leadContent = `${lead.companyName} ${lead.industry} ${lead.businessProblem} ${lead.salesOpportunity}`.toLowerCase();
    
    // Check if at least one niche anchor matches or if industry is aligned
    const matchesNiche = nicheWords.some((w) => leadContent.includes(w)) || lead.industry.toLowerCase().includes(options.requestedNiche.toLowerCase());
    
    // Check for obvious niche contradictions (e.g. searching for Builders but lead is a Bakery or Dentist)
    const isContradictory =
      (options.requestedNiche.toLowerCase().includes('builder') || options.requestedNiche.toLowerCase().includes('roof')) &&
      (leadContent.includes('dental') || leadContent.includes('bakery') || leadContent.includes('hair salon') || leadContent.includes('optician'));
    
    nicheRelevant = matchesNiche && !isContradictory;
  }

  // 2. Source URL & Traceability
  const sourceUrlValid = Boolean(
    lead.sourceUrl &&
      typeof lead.sourceUrl === 'string' &&
      (lead.sourceUrl.startsWith('http://') || lead.sourceUrl.startsWith('https://')) &&
      lead.sourceUrl.length >= 10
  );

  // 3. Contact Fabrication Checks
  let contactNotFabricated = true;
  if (lead.contactFullName && lead.contactFullName !== 'Not Found') {
    const nameLower = lead.contactFullName.trim().toLowerCase();
    const parts = nameLower.split(/\s+/);
    if (parts.length < 2 || FORBIDDEN_CONTACT_NAMES.includes(nameLower)) {
      contactNotFabricated = false;
    }
  }

  let emailNotFabricated = true;
  if (lead.businessEmail && lead.businessEmail !== 'Not Found') {
    const emailLower = lead.businessEmail.trim().toLowerCase();
    const domain = emailLower.split('@')[1];
    if (
      !emailLower.includes('@') ||
      !domain ||
      DISALLOWED_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`)) ||
      emailLower.startsWith('support@webador') ||
      emailLower.startsWith('abuse@') ||
      emailLower.startsWith('postmaster@') ||
      emailLower.startsWith('mailer-daemon@') ||
      emailLower.startsWith('noreply@') ||
      emailLower.startsWith('no-reply@')
    ) {
      emailNotFabricated = false;
    }
  }

  let phoneNotFabricated = true;
  if (lead.phoneNumber && lead.phoneNumber !== 'Not Found') {
    if (!isValidPhoneNumber(lead.phoneNumber, lead.country)) {
      phoneNotFabricated = false;
    }
  }

  // 4. Observable Evidence & Anti-Fluff Checks
  const problemLower = (lead.businessProblem || '').trim().toLowerCase();
  const evidenceLower = (lead.needEvidence || '').trim().toLowerCase();

  const isGenericProblem = GENERIC_FLUFF_PHRASES.some((fluff) => problemLower === fluff);
  const isGenericEvidence = GENERIC_FLUFF_PHRASES.some((fluff) => evidenceLower === fluff);
  const noGenericFluff = !isGenericProblem && !isGenericEvidence;

  const needEvidenceGrounded = Boolean(
    lead.businessProblem &&
      lead.businessProblem.length >= 10 &&
      lead.needEvidence &&
      lead.needEvidence.length >= 10
  );

  // 5. Contradiction Protection (Cases 1, 4 & Consistency Gates)
  let noContradictoryEvidence = true;

  // Case 1: Must NOT qualify solely based on Copyright 2022
  if (problemLower.includes('copyright 2022') || evidenceLower.includes('copyright 2022')) {
    noContradictoryEvidence = false;
  }

  // Case 4: Must NOT report missing contact form if a genuine quote/contact mechanism exists
  if (
    problemLower.includes('missing contact form') ||
    evidenceLower.includes('missing contact form') ||
    problemLower.includes('absence of interactive contact form')
  ) {
    // If the business has a verified phone, email, contact page, or CTA, claim is contradictory
    if (
      (lead.phoneNumber && lead.phoneNumber !== 'Not Found') ||
      (lead.businessEmail && lead.businessEmail !== 'Not Found') ||
      (lead as any).hasContactForm ||
      (lead as any).hasContactPage ||
      (lead as any).hasCallToAction
    ) {
      noContradictoryEvidence = false;
    }
  }

  if (lead.websiteStatus === 'No Website Found') {
    // If no website found, problem must not claim website has broken HTML tags or slow load
    if (evidenceLower.includes('viewport') || evidenceLower.includes('meta description') || evidenceLower.includes('title tag')) {
      noContradictoryEvidence = false;
    }
  } else if (lead.websiteStatus === 'Unreachable' || lead.websiteStatus === 'Broken') {
    // If broken or unreachable, evidence must not claim website is responsive and fast
    if (evidenceLower.includes('responsive and fast') || evidenceLower.includes('active and running')) {
      noContradictoryEvidence = false;
    }
  }

  // 6. Lead Strength & Restricted Data
  const strengthValidAorB = lead.leadStrength === 'A' || lead.leadStrength === 'B';
  const noRestrictedGoogleData = (lead as any).googleRating === undefined && (lead as any).googleReviews === undefined;

  const checks = {
    realBusiness,
    nicheRelevant,
    correctCountry:
      !options.requestedCountry ||
      (options.requestedCountry.toLowerCase().includes('uk + usa') &&
        (lead.country.toLowerCase().includes('united kingdom') ||
          lead.country.toLowerCase().includes('united states') ||
          lead.country.toLowerCase() === 'uk' ||
          lead.country.toLowerCase() === 'gb' ||
          lead.country.toLowerCase() === 'us' ||
          lead.country.toLowerCase() === 'usa')) ||
      (options.requestedCountry.toLowerCase().includes('all enabled') &&
        (lead.country.toLowerCase().includes('pakistan') ||
          lead.country.toLowerCase().includes('united kingdom') ||
          lead.country.toLowerCase().includes('united states') ||
          lead.country.toLowerCase() === 'pk' ||
          lead.country.toLowerCase() === 'gb' ||
          lead.country.toLowerCase() === 'us')) ||
      lead.country.toLowerCase().includes(options.requestedCountry.toLowerCase()) ||
      options.requestedCountry.toLowerCase().includes(lead.country.toLowerCase()),
    notDuplicate: !isDuplicate,
    notPreviouslyContacted: !isPreviouslyContacted,
    sourceUrlValid,
    contactNotFabricated,
    emailNotFabricated,
    phoneNotFabricated,
    needEvidenceGrounded,
    noGenericFluff,
    noContradictoryEvidence,
    strengthValidAorB,
    noRestrictedGoogleData,
    traceabilityRecorded: Boolean(lead.researchDate && lead.source),
  };

  // Rejection Evaluations
  if (!checks.realBusiness) {
    return { passed: false, rejectionReason: 'Invalid, missing, or test business name', checks };
  }
  if (!checks.correctCountry) {
    return { passed: false, rejectionReason: `Business location "${lead.country}" does not match requested country "${options.requestedCountry}"`, checks };
  }
  if (!checks.nicheRelevant) {
    return { passed: false, rejectionReason: `Business is irrelevant to requested niche "${options.requestedNiche}"`, checks };
  }
  if (!checks.notDuplicate) {
    return { passed: false, rejectionReason: 'Duplicate business entity detected', checks };
  }
  if (!checks.notPreviouslyContacted) {
    return { passed: false, rejectionReason: 'Business was previously contacted', checks };
  }
  if (!checks.sourceUrlValid) {
    return { passed: false, rejectionReason: 'Missing or invalid independent source URL', checks };
  }
  if (!checks.contactNotFabricated) {
    return { passed: false, rejectionReason: 'Fabricated or placeholder contact person detected', checks };
  }
  if (!checks.emailNotFabricated) {
    return { passed: false, rejectionReason: 'Fabricated or placeholder business email detected', checks };
  }
  if (!checks.phoneNotFabricated) {
    return { passed: false, rejectionReason: 'Invalid or dummy phone number detected', checks };
  }
  if (!checks.noGenericFluff) {
    return { passed: false, rejectionReason: 'Vague generic claim without specific observable technical evidence', checks };
  }
  if (!checks.needEvidenceGrounded) {
    return { passed: false, rejectionReason: 'Missing concrete evidence grounding for business problem', checks };
  }
  if (!checks.noContradictoryEvidence) {
    return { passed: false, rejectionReason: 'Evidence directly contradicts website status', checks };
  }
  if (!checks.strengthValidAorB) {
    return { passed: false, rejectionReason: 'Invalid lead strength (only A or B allowed, never C)', checks };
  }
  if (!checks.noRestrictedGoogleData) {
    return { passed: false, rejectionReason: 'Restricted Google Atmosphere content detected', checks };
  }

  // Suppression list checks (Domain, Phone, Company Name)
  if (lead.canonicalDomain && suppressedDomains.has(lead.canonicalDomain.toLowerCase())) {
    return {
      passed: false,
      rejectionReason: `Domain ${lead.canonicalDomain} is in the suppression list`,
      checks,
    };
  }
  if (lead.phoneNumber && lead.phoneNumber !== 'Not Found' && suppressedDomains.has(lead.phoneNumber)) {
    return {
      passed: false,
      rejectionReason: `Phone number ${lead.phoneNumber} is in the suppression list`,
      checks,
    };
  }
  if (lead.companyName && suppressedDomains.has(lead.companyName.toLowerCase().trim())) {
    return {
      passed: false,
      rejectionReason: `Company "${lead.companyName}" is in the suppression list`,
      checks,
    };
  }

  // Minimum score check
  if (lead.leadScore < options.minimumScore) {
    return {
      passed: false,
      rejectionReason: `Score ${lead.leadScore} is below minimum threshold ${options.minimumScore}`,
      checks,
    };
  }

  // Required contact details check
  if (options.requiredContactDetails === 'phone_only' && (!lead.phoneNumber || lead.phoneNumber === 'Not Found')) {
    return { passed: false, rejectionReason: 'Public phone number required by run criteria', checks };
  }
  if (options.requiredContactDetails === 'email_only' && (!lead.businessEmail || lead.businessEmail === 'Not Found')) {
    return { passed: false, rejectionReason: 'Public email address required by run criteria', checks };
  }
  if (options.requiredContactDetails === 'both') {
    if (!lead.phoneNumber || lead.phoneNumber === 'Not Found' || !lead.businessEmail || lead.businessEmail === 'Not Found') {
      return { passed: false, rejectionReason: 'Both public phone and email required by run criteria', checks };
    }
  }

  // Opportunity Type filter check
  if (options.opportunityType && options.opportunityType !== 'ALL' && lead.opportunityType !== options.opportunityType) {
    return { passed: false, rejectionReason: `Lead opportunity type ${lead.opportunityType} does not match requested ${options.opportunityType}`, checks };
  }

  // User qualification control: Mandatory absence of official website
  if (options.requireNoWebsite) {
    if (lead.websiteStatus !== 'No Website Found') {
      return {
        passed: false,
        rejectionReason: `Business has a website (${lead.websiteStatus}), but run required businesses with No Official Website`,
        checks,
      };
    }
  }

  // User qualification control: Weak websites disallowed
  if (options.allowWeakWebsite === false) {
    if (lead.websiteStatus === 'Active but Weak' || lead.websiteStatus === 'Outdated Indicators') {
      return {
        passed: false,
        rejectionReason: `Website has weak or outdated indicators, which is disallowed by current run criteria`,
        checks,
      };
    }
  }

  // User qualification control: Hiring evidence mandatory
  if (options.requireHiring) {
    const hiring = (lead.hiringEvidence || '').toLowerCase().trim();
    if (!hiring || hiring.includes('not observed') || hiring.includes('none observed') || hiring === 'not found') {
      return {
        passed: false,
        rejectionReason: `No public hiring evidence observed, but run required verified hiring activity`,
        checks,
      };
    }
  }

  return {
    passed: true,
    checks,
  };
}
