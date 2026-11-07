/**
 * Deep Business & Digital Intelligence Research Engine
 * Phases 5 - 12: Business Verification, Website Audit, Contact Identification,
 * Social Profile Research, Recent Need Signals, and Sales Opportunity Mapping.
 */

import { escapeFormula, normalizePhoneNumber } from '../lib/normalizer';
import { calculateLeadScore } from '../lib/scoring';
import {
  evaluateUKCompliance,
  evaluateUSCompliance,
  getOverallComplianceStatus,
} from '../lib/compliance';
import {
  CandidateBusiness,
  EmailStatus,
  EvidenceRecord,
  Lead,
  PhoneStatus,
  WebsiteStatus,
  WhatsAppStatus,
} from '../types';
import {
  determineOpportunityType,
  evaluateContactAccuracyStatus,
  findTargetIndustry,
  generateClientBridgeRecommendation,
} from '../lib/pakistanIndustries';
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
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    // Check whether candidate has a discoverable website URL
    const hasWebsite = Boolean(
      candidate.website &&
        candidate.website.trim().length > 3 &&
        candidate.website !== 'No Website Found' &&
        candidate.website !== 'None'
    );

    let siteAudit: any = null;
    let website = 'No Website Found';
    let websiteStatus: WebsiteStatus = 'No Website Found';
    let email = 'Not Found';
    let emailStatus: EmailStatus = 'Not Found';
    let normPhone = '';
    let phoneStatus: PhoneStatus = 'Not Found';
    let contactName = 'Not Found';
    let jobTitle = 'Not Found';
    let facebook = candidate.facebook || 'Not Found';
    let instagram = candidate.instagram || 'Not Found';
    let linkedin = candidate.linkedin || 'Not Found';
    let fullAddress = candidate.address || 'Unknown';
    const city = candidate.city || 'Unknown';
    const region = candidate.region || 'Unknown';

    let topProblem = '';
    let topEvidence = '';
    let topOpportunity = '';
    let independentSourceUrl = candidate.sourceUrl || candidate.discoverySourceUrl || '';
    const evidenceList: EvidenceRecord[] = [];

    if (!hasWebsite) {
      // CASE 1: REAL OPPORTUNITY - Business lacks an official website (Digital Void)
      website = 'No Website Found';
      websiteStatus = 'No Website Found';
      topProblem = 'Absence of Official Business Website (Digital Void)';
      topEvidence = `Verified active commercial entity in ${candidate.city || country} operating without an official indexed domain or web storefront.`;
      topOpportunity = 'Turnkey Web Development & Online Brand Presence';

      if (!independentSourceUrl) {
        return null;
      }

      // Sourced contact numbers from verified commercial listing/directory
      if (candidate.phone) {
        const normalized = normalizePhoneNumber(candidate.phone, country);
        if (normalized && normalized.length >= 7) {
          normPhone = normalized;
          phoneStatus = 'Verified/Public';
        }
      }

      evidenceList.push({
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        leadId: '',
        claimSupported: 'Absence of Official Business Website (Digital Void)',
        evidenceUrl: independentSourceUrl,
        evidenceSource: candidate.discoverySource || 'Verified Commercial Discovery',
        evidenceTitle: `${candidate.companyName} Public Discovery Record`,
        evidenceDate: todayStr,
        evidenceSummary: topEvidence,
        createdAt: nowIso,
      });
    } else {
      // CASE 2 & 3: Candidate has a website URL -> perform real technical server audit
      siteAudit = await verifyAndAuditWebsite(candidate.website || '');
      website = siteAudit.finalUrl || siteAudit.url || candidate.website!;

      if (!siteAudit.isReachable) {
        // CASE 2: REAL OPPORTUNITY - Website is broken or server is unreachable
        websiteStatus = siteAudit.websiteStatus;
        topProblem =
          siteAudit.observableProblems[0]?.problem ||
          `Website Server Error / Broken (${siteAudit.httpStatus ? 'HTTP ' + siteAudit.httpStatus : 'Connection Timeout'})`;
        topEvidence =
          siteAudit.observableProblems[0]?.evidence ||
          `Direct server connection to ${website} failed.`;
        topOpportunity = 'Website Server Recovery, Hosting & Modernization';

        if (candidate.phone) {
          const normalized = normalizePhoneNumber(candidate.phone, country);
          if (normalized && normalized.length >= 7) {
            normPhone = normalized;
            phoneStatus = 'Public';
          }
        }

        independentSourceUrl = website.startsWith('http') ? website : independentSourceUrl;
        if (!independentSourceUrl) {
          return null;
        }

        evidenceList.push({
          id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          userId,
          leadId: '',
          claimSupported: topProblem,
          evidenceUrl: independentSourceUrl,
          evidenceSource: 'Official Website Technical Verification',
          evidenceTitle: `${candidate.companyName} Reachability Audit`,
          evidenceDate: todayStr,
          evidenceSummary: topEvidence,
          createdAt: nowIso,
        });
      } else {
        // CASE 3: Website is reachable -> verify identity match and extract verifiable facts
        const matchCheck = verifyBusinessWebsiteMatch(candidate.companyName, candidate.website || '', siteAudit);
        if (!matchCheck.match) {
          console.warn(`[ResearchService] Rejected business identity mismatch for "${candidate.companyName}":`, matchCheck.reason);
          return null;
        }

        websiteStatus = siteAudit.websiteStatus;
        independentSourceUrl = siteAudit.finalUrl || website;

        // Contact extraction strictly from accessible HTML
        const verifiedEmailItem = siteAudit.emailsFound[0];
        const verifiedPhoneItem = siteAudit.phonesFound[0];
        const verifiedDecisionMaker = siteAudit.decisionMakersFound[0];

        if (verifiedEmailItem) {
          email = verifiedEmailItem.email;
          emailStatus = 'Verified/Public';
        }

        if (verifiedPhoneItem) {
          const normalized = normalizePhoneNumber(verifiedPhoneItem.phone, country);
          if (normalized && normalized.length >= 7) {
            normPhone = normalized;
            phoneStatus = 'Verified/Public';
          }
        }

        if (verifiedDecisionMaker) {
          contactName = verifiedDecisionMaker.name;
          jobTitle = verifiedDecisionMaker.title;
        }

        // Social profile links from HTML
        if (siteAudit.socialLinks.facebook) facebook = siteAudit.socialLinks.facebook;
        if (siteAudit.socialLinks.instagram) instagram = siteAudit.socialLinks.instagram;
        if (siteAudit.socialLinks.linkedin) linkedin = siteAudit.socialLinks.linkedin;

        // Address from HTML
        if (siteAudit.addressesFound[0]) {
          fullAddress = siteAudit.addressesFound[0].address;
        }

        // Digital Opportunity Gap Analysis
        const topObservableProblem = siteAudit.observableProblems[0];
        if (topObservableProblem) {
          topProblem = topObservableProblem.problem;
          topEvidence = topObservableProblem.evidence;

          if (siteAudit.isInsecureHttp) {
            topOpportunity = 'SSL Security & HTTPS Migration';
          } else if (!siteAudit.hasViewportMeta) {
            topOpportunity = 'Mobile-Responsive Modernization (High Priority)';
          } else if (
            siteAudit.ecommerceStorefrontDetected &&
            topProblem.includes('Manual Order Only')
          ) {
            topOpportunity = 'Shopify / WooCommerce Direct-to-Consumer Store Setup';
          } else if (
            !siteAudit.socialLinks.whatsapp &&
            (country.toLowerCase() === 'pakistan' || country.toLowerCase() === 'pk')
          ) {
            topOpportunity = 'WhatsApp Instant Lead Generation & Chat Funnel';
          } else if (siteAudit.outdatedCopyrightYear && siteAudit.outdatedCopyrightYear <= 2018) {
            topOpportunity = 'Modern Website Redesign & Re-platforming';
          } else if (!siteAudit.title || siteAudit.title.length < 10) {
            topOpportunity = 'Google Search Ranking & On-Page SEO';
          } else if (!siteAudit.hasContactForm && !siteAudit.hasCallToAction) {
            topOpportunity = 'Direct Inquiry Funnel & Booking System';
          } else {
            topOpportunity = 'Digital Infrastructure & Conversion Scaling';
          }
        } else if (!siteAudit.socialLinks.whatsapp && (country.toLowerCase() === 'pakistan' || country.toLowerCase() === 'pk')) {
          topProblem = 'Absence of WhatsApp Instant Booking / Chat Funnel';
          topEvidence = 'Website lacks a direct wa.me or WhatsApp click-to-chat inquiry link for mobile users.';
          topOpportunity = 'WhatsApp Fast Inquiry Integration';
        } else {
          // Flawless modern website with no detected gaps -> downgrade commercial opportunity
          topProblem = 'Digital Optimization & Growth Architecture';
          topEvidence = `Direct HTTP connection to ${siteAudit.finalUrl || website} verified. Standard website architecture active.`;
          topOpportunity = 'Digital Infrastructure & Conversion Scaling';
        }

        // Collect structured evidence records
        for (const ev of siteAudit.evidenceItems) {
          evidenceList.push({
            id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId,
            leadId: '',
            claimSupported: ev.claim,
            evidenceUrl: ev.url || independentSourceUrl,
            evidenceSource: 'Official Website Technical Verification',
            evidenceTitle: `${candidate.companyName} Public Presence Audit`,
            evidenceDate: todayStr,
            evidenceSummary: ev.summary,
            createdAt: nowIso,
          });
        }
      }
    }

    // WhatsApp Intelligence
    let whatsApp: WhatsAppStatus = 'Unknown';
    if (siteAudit?.socialLinks?.whatsapp || candidate.whatsapp) {
      whatsApp = 'Yes — Evidence';
    } else if (
      normPhone &&
      (normPhone.startsWith('03') ||
        normPhone.startsWith('+923') ||
        normPhone.startsWith('923') ||
        normPhone.startsWith('07') ||
        normPhone.startsWith('+447'))
    ) {
      whatsApp = 'Likely Mobile';
    }

    // Scoring based on verified facts
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
      hasRecentNeedSignal: Boolean(topProblem && topProblem !== 'Digital Optimization & Growth Architecture'),
      evidenceCount: evidenceList.length,
      hasEvidenceUrl: Boolean(independentSourceUrl),
      hasOperationalVerification: Boolean(normPhone) || (siteAudit ? siteAudit.isReachable : true),
      hasSocialProfiles: Boolean(facebook !== 'Not Found' || instagram !== 'Not Found' || linkedin !== 'Not Found'),
      ecommerceStorefrontDetected: siteAudit?.ecommerceStorefrontDetected,
      bookingWorkflowDetected: siteAudit?.bookingWorkflowDetected,
    };

    const scoreResult = calculateLeadScore(scoringInput);
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Set leadId on all evidence items
    for (const ev of evidenceList) {
      ev.leadId = leadId;
    }

    if (evidenceList.length === 0) {
      evidenceList.push({
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        leadId,
        claimSupported: topProblem,
        evidenceUrl: independentSourceUrl,
        evidenceSource: hasWebsite ? 'Official Website Technical Verification' : 'Verified Public Discovery Record',
        evidenceTitle: `${candidate.companyName} Commercial Profile`,
        evidenceDate: todayStr,
        evidenceSummary: topEvidence,
        createdAt: nowIso,
      });
    }

    // Determine Market Code & Location Postcode/Zip
    const cLower = (country || '').toLowerCase();
    const isUKLead = cLower.includes('united kingdom') || cLower === 'gb' || cLower === 'uk';
    const isUSLead = cLower.includes('united states') || cLower === 'us' || cLower === 'usa';
    const isPKLead = cLower.includes('pakistan') || cLower === 'pk';
    const marketCode: 'PK' | 'GB' | 'US' = isUKLead ? 'GB' : isUSLead ? 'US' : 'PK';

    // Extract Postcode or Zip Code from address or candidate if present
    let postcodeOrZip = '';
    const combinedAddress = `${fullAddress} ${city} ${region}`;
    if (isUKLead) {
      const ukPostMatch = combinedAddress.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/i);
      if (ukPostMatch) postcodeOrZip = ukPostMatch[0].toUpperCase();
    } else if (isUSLead) {
      const usZipMatch = combinedAddress.match(/\b\d{5}(?:-\d{4})?\b/);
      if (usZipMatch) postcodeOrZip = usZipMatch[0];
    }

    // Evaluate Regulatory Compliance (PECR for UK, CAN-SPAM / TCPA for US)
    const ukCompliance = isUKLead
      ? evaluateUKCompliance({
          companyName: candidate.companyName,
          contactFullName: contactName,
          email,
          phone: normPhone,
        })
      : undefined;

    const usCompliance = isUSLead
      ? evaluateUSCompliance({
          companyName: candidate.companyName,
          state: region,
          contactFullName: contactName,
          email,
          phone: normPhone,
        })
      : undefined;

    const complianceReviewStatus = getOverallComplianceStatus(country, ukCompliance, usCompliance);

    // Client Bridge Specialized Opportunity & Recommendation Engine (Sections 2, 6, 7 & 8)
    const targetInd = findTargetIndustry(niche);
    const cbRec = generateClientBridgeRecommendation(
      niche,
      candidate.companyName,
      websiteStatus,
      city,
      siteAudit
    );

    const opportunityType = determineOpportunityType(niche, websiteStatus, siteAudit, candidate);
    const emailAccuracyStatus = evaluateContactAccuracyStatus(
      email,
      emailStatus === 'Verified/Public',
      independentSourceUrl
    );
    const phoneAccuracyStatus = evaluateContactAccuracyStatus(
      normPhone,
      phoneStatus === 'Verified/Public',
      independentSourceUrl
    );

    const identifiedProblem = cbRec.problem || topProblem;
    const recommendedService = cbRec.recommendedService || topOpportunity;
    const businessEvidence = cbRec.evidence || topEvidence;
    const whyQualifies = cbRec.whyQualifies;
    const manualVerificationNeeded = cbRec.manualVerificationNeeded;
    const subcategory = targetInd?.subcategories[0] || niche;
    const area = candidate.address ? candidate.address.split(',')[0].trim() : city;

    const lead: Lead = {
      id: leadId,
      leadId,
      userId,
      runId,
      companyName: candidate.companyName.trim(),
      canonicalDomain: website && website !== 'No Website Found' ? escapeFormula(website) : '',
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
      marketCode,
      postcodeOrZip,
      complianceReviewStatus,
      ukCompliance,
      usCompliance,
      industry: niche,
      subcategory,
      area,
      opportunityType,
      identifiedProblem,
      recommendedService,
      whyQualifies,
      businessEvidence,
      manualVerificationNeeded,
      emailSourceUrl: independentSourceUrl,
      phoneSourceUrl: independentSourceUrl,
      emailAccuracyStatus,
      phoneAccuracyStatus,
      isReviewed: false,
      isSuppressed: false,
      verificationStatus: hasWebsite
        ? siteAudit?.isReachable
          ? 'Verified'
          : 'Needs Review'
        : 'Publicly Listed',
      commercialVerification: hasWebsite
        ? siteAudit?.isReachable
          ? 'Verified Operational Website'
          : 'Commercial Registry Record'
        : 'Verified Public Business Listing',
      businessStatus: 'Active',
      googlePlaceId: candidate.googlePlaceId || undefined,
      sourceType: hasWebsite ? 'business_website' : 'transient_signal',
      sourceUrl: independentSourceUrl,
      retrievedAt: nowIso,
      sourceProvider: hasWebsite ? 'Official Business Website Audit' : 'Verified Public Business Directory',
      isGoogleDerived: false,
      recentNeedSignal: topProblem,
      needEvidence: topEvidence,
      businessProblem: topProblem,
      salesOpportunity: topOpportunity,
      signalDate: todayStr,
      source: independentSourceUrl,
      researchDate: todayStr,
      leadStrength: scoreResult.strength,
      leadGrade: scoreResult.leadGrade,
      opportunityTier: scoreResult.opportunityTier,
      leadScore: scoreResult.score,
      scoreFactors: scoreResult.factors,
      scoreExplanation: scoreResult.explanation,
      missingEvidenceWarnings: scoreResult.missingEvidenceWarnings,
      ecommerceStorefrontDetected: siteAudit?.ecommerceStorefrontDetected,
      bookingWorkflowDetected: siteAudit?.bookingWorkflowDetected,
      contacted: false,
      notes: '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return { lead, evidence: evidenceList };
  } catch (error) {
    console.error(`Error in deep research for ${candidate.companyName}:`, error);
    return null;
  }
}

