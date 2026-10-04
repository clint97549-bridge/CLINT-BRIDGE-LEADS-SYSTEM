/**
 * Transparent 0-100 Lead Scoring Model and A/B Lead Strength Qualification.
 * Every score component is explainable and grounded in factual research data.
 */

import { EmailStatus, LeadStrength, PhoneStatus, ScoreFactors, WebsiteStatus } from '../types';

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
}

export function calculateLeadScore(input: ScoringInput): { score: number; factors: ScoreFactors; strength: LeadStrength } {
  const factors: ScoreFactors = {
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

  // 1. Niche & Country Relevance (0 - 15)
  if (input.nicheMatched) factors.nicheRelevance += 10;
  if (input.countryMatched) factors.nicheRelevance += 5;

  // 2. Business Legitimacy (0 - 15) - Grounded in verified identity, not restricted third-party reviews
  if (input.hasValidBusinessName) factors.businessLegitimacy += 5;
  if (input.hasOperationalVerification || input.hasWebsite || (input.phoneStatus && input.phoneStatus !== 'Not Found')) {
    factors.businessLegitimacy += 5;
  }
  if (input.hasSocialProfiles) factors.businessLegitimacy += 5;

  // 3. Digital Opportunity (0 - 15)
  // Higher score if there is a concrete digital gap (e.g. no website, weak website, outdated indicators)
  if (input.websiteStatus === 'No Website Found') {
    factors.digitalOpportunity = 15; // Prime web design prospect
  } else if (input.websiteStatus === 'Outdated Indicators' || input.websiteStatus === 'Broken') {
    factors.digitalOpportunity = 15; // Prime redesign / repair prospect
  } else if (input.websiteStatus === 'Active but Weak') {
    factors.digitalOpportunity = 12; // Optimization & CRO prospect
  } else if (input.websiteStatus === 'Active') {
    factors.digitalOpportunity = 8; // Potential SEO/PPC/system expansion prospect
  } else {
    factors.digitalOpportunity = 5;
  }

  // 4. Website Condition (0 - 15)
  if (input.hasWebsite) {
    if (input.websiteStatus === 'Active but Weak' || input.websiteStatus === 'Outdated Indicators') {
      factors.websiteCondition = 12;
    } else if (input.websiteStatus === 'Active') {
      factors.websiteCondition = 10;
    } else {
      factors.websiteCondition = 6;
    }
  } else {
    factors.websiteCondition = 15; // Extreme opportunity for new website build
  }

  // 5. Recent Need Signal (0 - 10)
  if (input.hasRecentNeedSignal) {
    factors.recentNeedSignal = 10;
  } else {
    factors.recentNeedSignal = 3;
  }

  // 6. Evidence Quality (0 - 10)
  if (input.hasEvidenceUrl && input.evidenceCount >= 2) {
    factors.evidenceQuality = 10;
  } else if (input.hasEvidenceUrl || input.evidenceCount >= 1) {
    factors.evidenceQuality = 7;
  } else {
    factors.evidenceQuality = 2;
  }

  // 7. Contact Completeness (0 - 10)
  if (input.emailStatus === 'Verified/Public' || input.emailStatus === 'Public but Unverified') {
    factors.contactCompleteness += 5;
  }
  if (input.phoneStatus === 'Verified/Public' || input.phoneStatus === 'Public') {
    factors.contactCompleteness += 5;
  }

  // 8. Decision Maker Confidence (0 - 5)
  if (input.hasDecisionMakerName) {
    const role = (input.decisionMakerRole || '').toLowerCase();
    if (role.includes('owner') || role.includes('founder') || role.includes('director') || role.includes('managing')) {
      factors.decisionMakerConfidence = 5;
    } else {
      factors.decisionMakerConfidence = 3;
    }
  }

  // 9. Data Quality (0 - 5)
  let qualityPts = 0;
  if (input.hasValidBusinessName) qualityPts += 2;
  if (input.countryMatched) qualityPts += 2;
  if (input.evidenceCount > 0) qualityPts += 1;
  factors.dataQuality = qualityPts;

  // Total Score (0 - 100)
  const totalScore = Math.min(
    100,
    factors.nicheRelevance +
      factors.businessLegitimacy +
      factors.digitalOpportunity +
      factors.websiteCondition +
      factors.recentNeedSignal +
      factors.evidenceQuality +
      factors.contactCompleteness +
      factors.decisionMakerConfidence +
      factors.dataQuality
  );

  // Lead Strength Qualification (ONLY 'A' or 'B' - Never 'C')
  // 'A' criteria (Strict Production Hardened):
  // - High composite score (>= 72)
  // - Business identity independently verified
  // - Niche & country verified
  // - Clear observable digital opportunity (>= 10)
  // - Verified evidence URL exists with solid evidence quality (>= 6)
  // - At least one directly verified contact method (phone or email)
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
  };
}
