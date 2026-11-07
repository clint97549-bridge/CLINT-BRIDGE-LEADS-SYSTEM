/**
 * Transparent 0-100 Lead Scoring Model and A/B Lead Strength Qualification.
 * Every score component is explainable and grounded in factual research data.
 */

import { EmailStatus, LeadGrade, LeadStrength, OpportunityTier, PhoneStatus, ScoreFactors, WebsiteStatus } from '../types';

export interface ScoringInput {
  hasValidBusinessName: boolean;
  nicheMatched: boolean;
  countryMatched: boolean;
  websiteStatus: WebsiteStatus;
  hasWebsite: boolean;
  emailStatus: EmailStatus;
  phoneStatus: PhoneStatus;
  hasDecisionMakerName: boolean;
  decisionMakerRole?: string;
  hasRecentNeedSignal: boolean;
  evidenceCount: number;
  hasEvidenceUrl: boolean;
  hasOperationalVerification?: boolean;
  hasSocialProfiles: boolean;
  ecommerceStorefrontDetected?: boolean;
  bookingWorkflowDetected?: boolean;
}

export interface ScoreCalculationResult {
  score: number;
  factors: ScoreFactors;
  strength: LeadStrength;
  leadGrade?: LeadGrade;
  opportunityTier: OpportunityTier;
  intentLabel?: string;
  explanation: string;
  missingEvidenceWarnings: string[];
}

export function calculateLeadScore(input: ScoringInput): ScoreCalculationResult {
  // 1. Client Bridge Transparent 7-Factor Model (100 pts)
  // Factor 1: Website absence, failure, or major weakness (0 - 25 pts)
  let websiteOpportunity = 5;
  if (input.websiteStatus === 'No Website Found') {
    websiteOpportunity = 25;
  } else if (input.websiteStatus === 'Broken' || input.websiteStatus === 'Unreachable') {
    websiteOpportunity = 24;
  } else if (input.websiteStatus === 'Outdated Indicators') {
    websiteOpportunity = 20;
  } else if (input.websiteStatus === 'Active but Weak') {
    websiteOpportunity = 15;
  }

  // Factor 2: Website usability & conversion opportunities (0 - 20 pts)
  let websiteUsability = 8;
  if (input.websiteStatus === 'No Website Found') {
    websiteUsability = 20;
  } else if (input.websiteStatus === 'Broken' || input.websiteStatus === 'Unreachable') {
    websiteUsability = 18;
  } else if (input.websiteStatus === 'Active but Weak' || input.websiteStatus === 'Outdated Indicators') {
    websiteUsability = 14;
  }

  // Factor 3: Credible business growth signals (0 - 15 pts)
  let growthSignals = 0;
  if (input.hasValidBusinessName) growthSignals += 5;
  if (input.hasOperationalVerification || input.hasWebsite || (input.phoneStatus && input.phoneStatus !== 'Not Found')) growthSignals += 5;
  if (input.hasSocialProfiles) growthSignals += 5;

  // Factor 4: Public hiring or investment signals (0 - 10 pts)
  const hiringInvestment = input.hasRecentNeedSignal ? 10 : 3;

  // Factor 5: Business identity & operating-status evidence (0 - 10 pts)
  let businessIdentity = 0;
  if (input.hasValidBusinessName) businessIdentity += 5;
  if (input.countryMatched) businessIdentity += 5;

  // Factor 6: Public contact-information availability (0 - 10 pts)
  let contactAvailability = 0;
  if (input.emailStatus === 'Verified/Public' || input.emailStatus === 'Public but Unverified') {
    contactAvailability += 5;
  }
  if (input.phoneStatus === 'Verified/Public' || input.phoneStatus === 'Public') {
    contactAvailability += 5;
  }

  // Factor 7: Fit with Client Bridge services (0 - 10 pts)
  const serviceFit = input.nicheMatched ? 10 : 5;

  // 2. Legacy / Granular Factors for backward compatibility with existing tests
  const factors: ScoreFactors = {
    // 7 Client Bridge factors
    websiteOpportunity,
    websiteUsability,
    growthSignals,
    hiringInvestment,
    businessIdentity,
    contactAvailability,
    serviceFit,

    // Section 6 Explicit Factor Aliases
    industryDigitalOpportunity: websiteUsability,
    activeOperationsEvidence: growthSignals,
    growthLaunchEvidence: hiringInvestment,
    researchCompleteness: input.evidenceCount >= 2 ? 5 : input.evidenceCount >= 1 ? 3 : 1,

    // Legacy granular factors
    nicheRelevance: 0,
    businessLegitimacy: 0,
    digitalOpportunity: 0,
    websiteCondition: 0,
    recentNeedSignal: 0,
    evidenceQuality: 0,
    contactCompleteness: 0,
    decisionMakerConfidence: 0,
    dataQuality: 0,
  };

  // Legacy Factor 1: Niche & Country Relevance (0 - 15)
  if (input.nicheMatched) factors.nicheRelevance = (factors.nicheRelevance || 0) + 10;
  if (input.countryMatched) factors.nicheRelevance = (factors.nicheRelevance || 0) + 5;

  // Legacy Factor 2: Business Legitimacy (0 - 15)
  if (input.hasValidBusinessName) factors.businessLegitimacy = (factors.businessLegitimacy || 0) + 5;
  if (input.hasOperationalVerification || input.hasWebsite || (input.phoneStatus && input.phoneStatus !== 'Not Found')) {
    factors.businessLegitimacy = (factors.businessLegitimacy || 0) + 5;
  }
  if (input.hasSocialProfiles) factors.businessLegitimacy = (factors.businessLegitimacy || 0) + 5;

  // Legacy Factor 3: Digital Opportunity (0 - 15)
  if (input.websiteStatus === 'No Website Found') {
    factors.digitalOpportunity = 15;
  } else if (input.websiteStatus === 'Outdated Indicators' || input.websiteStatus === 'Broken') {
    factors.digitalOpportunity = 15;
  } else if (input.websiteStatus === 'Active but Weak') {
    factors.digitalOpportunity = 12;
  } else if (input.websiteStatus === 'Active') {
    factors.digitalOpportunity = 8;
  } else {
    factors.digitalOpportunity = 5;
  }

  // Legacy Factor 4: Website Condition (0 - 15)
  if (input.hasWebsite) {
    if (input.websiteStatus === 'Active but Weak' || input.websiteStatus === 'Outdated Indicators') {
      factors.websiteCondition = 12;
    } else if (input.websiteStatus === 'Active') {
      factors.websiteCondition = 10;
    } else {
      factors.websiteCondition = 6;
    }
  } else {
    factors.websiteCondition = 15;
  }

  // Legacy Factor 5: Recent Need Signal (0 - 10)
  factors.recentNeedSignal = input.hasRecentNeedSignal ? 10 : 3;

  // Legacy Factor 6: Evidence Quality (0 - 10)
  if (input.hasEvidenceUrl && input.evidenceCount >= 2) {
    factors.evidenceQuality = 10;
  } else if (input.hasEvidenceUrl || input.evidenceCount >= 1) {
    factors.evidenceQuality = 7;
  } else {
    factors.evidenceQuality = 2;
  }

  // Legacy Factor 7: Contact Completeness (0 - 10)
  let contactComp = 0;
  if (input.emailStatus === 'Verified/Public' || input.emailStatus === 'Public but Unverified') {
    contactComp += 5;
  }
  if (input.phoneStatus === 'Verified/Public' || input.phoneStatus === 'Public') {
    contactComp += 5;
  }
  factors.contactCompleteness = contactComp;

  // Legacy Factor 8: Decision Maker Confidence (0 - 5)
  if (input.hasDecisionMakerName) {
    const role = (input.decisionMakerRole || '').toLowerCase();
    if (role.includes('owner') || role.includes('founder') || role.includes('director') || role.includes('managing')) {
      factors.decisionMakerConfidence = 5;
    } else {
      factors.decisionMakerConfidence = 3;
    }
  }

  // Legacy Factor 9: Data Quality (0 - 5)
  let qualityPts = 0;
  if (input.hasValidBusinessName) qualityPts += 2;
  if (input.countryMatched) qualityPts += 2;
  if (input.evidenceCount > 0) qualityPts += 1;
  factors.dataQuality = qualityPts;

  // Total Score (0 - 100)
  const totalScore = Math.min(
    100,
    (factors.nicheRelevance || 0) +
      (factors.businessLegitimacy || 0) +
      (factors.digitalOpportunity || 0) +
      (factors.websiteCondition || 0) +
      (factors.recentNeedSignal || 0) +
      (factors.evidenceQuality || 0) +
      (factors.contactCompleteness || 0) +
      (factors.decisionMakerConfidence || 0) +
      (factors.dataQuality || 0)
  );

  // Opportunity Tier (High: 75+, Medium: 55-74, Low: <55)
  let opportunityTier: OpportunityTier = 'Low';
  if (totalScore >= 75) {
    opportunityTier = 'High';
  } else if (totalScore >= 55) {
    opportunityTier = 'Medium';
  } else {
    opportunityTier = 'Low';
  }

  // Client Bridge Section 6 Grades and Intent Labels
  let leadGrade: LeadGrade = 'Excluded';
  let intentLabel = 'Insufficient evidence';
  if (totalScore >= 90) {
    leadGrade = 'A+';
    intentLabel = 'Exceptional opportunity evidence';
  } else if (totalScore >= 80) {
    leadGrade = 'A';
    intentLabel = 'High opportunity evidence';
  } else if (totalScore >= 65) {
    leadGrade = 'B';
    intentLabel = 'Medium opportunity evidence';
  } else if (totalScore >= 50) {
    leadGrade = 'C';
    intentLabel = 'Low opportunity evidence';
  } else {
    leadGrade = 'Excluded';
    intentLabel = 'Insufficient evidence';
  }

  // Missing-evidence warnings
  const missingEvidenceWarnings: string[] = [];
  if (!input.hasDecisionMakerName) {
    missingEvidenceWarnings.push('No direct decision-maker contact identified in public markup (general contact only)');
  }
  if (input.emailStatus === 'Not Found') {
    missingEvidenceWarnings.push('Public business email address not found in accessible HTML');
  }
  if (input.phoneStatus === 'Not Found') {
    missingEvidenceWarnings.push('Public business telephone not found on website');
  }
  if (!input.hasSocialProfiles) {
    missingEvidenceWarnings.push('No official Facebook, Instagram, or LinkedIn profiles linked on website');
  }
  if (!input.hasEvidenceUrl) {
    missingEvidenceWarnings.push('Candidate lacks independent website verification URL');
  }

  // Human-readable score explanation
  const strengths: string[] = [];
  if ((factors.businessLegitimacy ?? 0) >= 10) strengths.push('verified commercial legitimacy');
  if ((factors.digitalOpportunity ?? 0) >= 12) strengths.push('observable website modernization gaps');
  if ((factors.contactCompleteness ?? 0) >= 5) strengths.push('verified direct contact channels');
  if ((factors.evidenceQuality ?? 0) >= 7) strengths.push('multi-signal external evidence');

  const strengthSummary = strengths.length > 0 ? strengths.join(', ') : 'baseline directory presence';
  const explanation = `Score ${totalScore}/100 (${opportunityTier} Opportunity Tier) evaluated via ${strengthSummary}.${
    missingEvidenceWarnings.length > 0 ? ` Note: ${missingEvidenceWarnings[0]}.` : ''
  }`;

  // Lead Strength Qualification (A or B)
  const hasVerifiedContact =
    input.phoneStatus === 'Verified/Public' ||
    input.emailStatus === 'Verified/Public';

  let strength: LeadStrength = 'B';
  if (
    totalScore >= 72 &&
    hasVerifiedContact &&
    input.nicheMatched &&
    input.countryMatched &&
    input.hasEvidenceUrl &&
    factors.digitalOpportunity >= 10 &&
    factors.evidenceQuality >= 6
  ) {
    strength = 'A';
  } else {
    strength = 'B';
  }

  return {
    score: totalScore,
    factors,
    strength,
    leadGrade,
    opportunityTier,
    intentLabel,
    explanation,
    missingEvidenceWarnings,
  };
}
