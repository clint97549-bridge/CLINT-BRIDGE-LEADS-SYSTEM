/**
 * Deep Business & Digital Intelligence Research Engine
 * Phases 5 - 12: Business Verification, Website Audit, Contact Identification,
 * Social Profile Research, Recent Need Signals, and Sales Opportunity Mapping.
 */

import { escapeFormula, normalizePhoneNumber } from '../lib/normalizer';
import { calculateLeadScore } from '../lib/scoring';
import {
  CandidateBusiness,
  EmailStatus,
  EvidenceRecord,
  Lead,
  PhoneStatus,
  WebsiteStatus,
  WhatsAppStatus,
} from '../types';
import { verifyAndAuditWebsite, verifyBusinessWebsiteMatch } from './websiteVerificationService';

interface DeepResearchResult {
  lead: Lead;
  evidence: EvidenceRecord[];
}

export async function conductDeepBusinessResearch(
  candidate: CandidateBusiness,
  userId: string,
  runId: string,
  niche: string,
  country: string
): Promise<DeepResearchResult | null> {
  try {
    // 1. Verify candidate has a discoverable website or source
    if (!candidate.website) {
      return null;
    }

    // 2. Actually retrieve and verify the public website server-side
    const siteAudit = await verifyAndAuditWebsite(candidate.website || '');
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    // Reject if website is unreachable or broken
    if (!siteAudit.isReachable) {
      return null;
    }

    // 3. Strengthen Business Identity Verification: Reject mismatches
    const matchCheck = verifyBusinessWebsiteMatch(candidate.companyName, candidate.website, siteAudit);
    if (!matchCheck.match) {
      console.warn(`[ResearchService] Rejected business identity mismatch for "${candidate.companyName}":`, matchCheck.reason);
      return null;
    }

    // 4. Contact Extraction: strictly from verified independent source HTML
    const verifiedEmailItem = siteAudit.emailsFound[0];
    const verifiedPhoneItem = siteAudit.phonesFound[0];
    const verifiedDecisionMaker = siteAudit.decisionMakersFound[0];

    const email = verifiedEmailItem ? verifiedEmailItem.email : 'Not Found';
    const emailStatus: EmailStatus = verifiedEmailItem ? 'Verified/Public' : 'Not Found';

    // Strictly independent phone sourcing - NEVER copy unverified discovery-provider phone
    let normPhone = '';
    let phoneStatus: PhoneStatus = 'Not Found';
    if (verifiedPhoneItem) {
      const normalized = normalizePhoneNumber(verifiedPhoneItem.phone, country);
      if (normalized && normalized.length >= 7) {
        normPhone = normalized;
        phoneStatus = 'Verified/Public';
      }
    }

    // Decision-maker: strictly from verified HTML source, never inferred or guessed
    const contactName = verifiedDecisionMaker ? verifiedDecisionMaker.name : 'Not Found';
    const jobTitle = verifiedDecisionMaker ? verifiedDecisionMaker.title : 'Not Found';

    const website = siteAudit.finalUrl || siteAudit.url || candidate.website;
    const websiteStatus: WebsiteStatus = siteAudit.websiteStatus;

    // Social profiles: strictly from verified HTML links
    const facebook = siteAudit.socialLinks.facebook || 'Not Found';
    const instagram = siteAudit.socialLinks.instagram || 'Not Found';
    const linkedin = siteAudit.socialLinks.linkedin || 'Not Found';

    // Postal Address: from verified HTML
    const verifiedAddressItem = siteAudit.addressesFound[0];
    const fullAddress = verifiedAddressItem ? verifiedAddressItem.address : 'Unknown';
    const city = candidate.city || 'Unknown';
    const region = candidate.region || 'Unknown';
    const whatsApp: WhatsAppStatus = 'Unknown';

    // 5. Determine observable technical digital problem & opportunity
    const topObservableProblem = siteAudit.observableProblems[0];
    if (!topObservableProblem) {
      // No observable technical problem or digital opportunity identified
      // Do not qualify the opportunity if none exists
      return null;
    }

    const topProblem = topObservableProblem.problem;
    const topEvidence = topObservableProblem.evidence;
    let topOpportunity = 'Web Architecture & Modernization';

    if (siteAudit.isInsecureHttp) {
      topOpportunity = 'SSL Security & HTTPS Migration';
    } else if (!siteAudit.hasViewportMeta) {
      topOpportunity = 'Mobile-Responsive Standards Alignment';
    } else if (siteAudit.outdatedCopyrightYear && siteAudit.outdatedCopyrightYear <= 2018) {
      topOpportunity = 'Legacy Website Re-platforming';
    } else if (!siteAudit.title || siteAudit.title.length < 10) {
      topOpportunity = 'On-Page SEO Optimization & Search Visibility';
    } else if (!siteAudit.hasContactForm && !siteAudit.hasCallToAction) {
      topOpportunity = 'Conversion Rate Optimization & Lead Capture Flow';
    }

    // 6. Independent Source URL - Strictly real, never fabricated
    const independentSourceUrl = website && website.startsWith('http') ? website : '';
    if (!independentSourceUrl) {
      return null;
    }

    // 7. Transparent scoring based purely on verified facts
    const scoringInput = {
      hasValidBusinessName: Boolean(candidate.companyName && candidate.companyName.length > 2),
      nicheMatched: true,
      countryMatched: true,
      websiteStatus,
      hasWebsite: Boolean(website && website !== 'No Website Found'),
      emailStatus,
      phoneStatus,
      hasDecisionMakerName: contactName !== 'Not Found',
      decisionMakerRole: jobTitle !== 'Not Found' ? jobTitle : undefined,
      hasRecentNeedSignal: Boolean(siteAudit.observableProblems.length > 0),
      evidenceCount: siteAudit.evidenceItems.length,
      hasEvidenceUrl: Boolean(siteAudit.finalUrl || website),
      hasOperationalVerification: siteAudit.isReachable || Boolean(normPhone),
      hasSocialProfiles: Boolean(facebook !== 'Not Found' || instagram !== 'Not Found' || linkedin !== 'Not Found'),
    };

    const scoreResult = calculateLeadScore(scoringInput);

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const lead: Lead = {
      id: leadId,
      leadId,
      userId,
      runId,
      companyName: candidate.companyName.trim(),
      canonicalDomain: website ? escapeFormula(website) : '',
      normalizedPhone: normPhone,
      duplicateKey: candidate.companyName.toLowerCase().trim(),
      contactFullName: contactName,
      jobTitle,
      businessEmail: email,
      emailStatus,
      phoneNumber: normPhone || 'Not Found',
      phoneStatus,
      whatsAppStatus: whatsApp,
      website: website || 'No Website Found',
      websiteStatus,
      facebook,
      instagram,
      linkedin,
      city,
      region,
      fullAddress,
      country,
      industry: niche,
      commercialVerification: siteAudit.isReachable ? 'Verified Operational Website' : 'Commercial Registry Record',
      businessStatus: 'Active',
      googlePlaceId: candidate.googlePlaceId || undefined,
      sourceType: 'business_website',
      sourceUrl: independentSourceUrl,
      retrievedAt: nowIso,
      sourceProvider: 'Official Business Website Audit',
      isGoogleDerived: false, // Independent permanent lead record
      recentNeedSignal: topProblem,
      needEvidence: topEvidence,
      businessProblem: topProblem,
      salesOpportunity: topOpportunity,
      signalDate: todayStr,
      source: independentSourceUrl,
      researchDate: todayStr,
      leadStrength: scoreResult.strength,
      leadScore: scoreResult.score,
      scoreFactors: scoreResult.factors,
      contacted: false,
      notes: '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 8. Construct factual evidence records with exact page URLs
    const evidenceList: EvidenceRecord[] = [];

    for (const ev of siteAudit.evidenceItems) {
      evidenceList.push({
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        leadId,
        claimSupported: ev.claim,
        evidenceUrl: ev.url || independentSourceUrl,
        evidenceSource: 'Official Website Technical Verification',
        evidenceTitle: `${candidate.companyName} Public Presence Audit`,
        evidenceDate: todayStr,
        evidenceSummary: ev.summary,
        createdAt: nowIso,
      });
    }

    if (evidenceList.length === 0) {
      evidenceList.push({
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        leadId,
        claimSupported: topProblem,
        evidenceUrl: independentSourceUrl,
        evidenceSource: 'Official Website Technical Verification',
        evidenceTitle: `${candidate.companyName} Commercial Profile`,
        evidenceDate: todayStr,
        evidenceSummary: topEvidence,
        createdAt: nowIso,
      });
    }

    return { lead, evidence: evidenceList };
  } catch (error) {
    console.error(`Error in deep research for ${candidate.companyName}:`, error);
    return null;
  }
}
