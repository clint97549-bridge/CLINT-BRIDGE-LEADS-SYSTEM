/**
 * LeadPulse AI - Enterprise B2B Lead Intelligence Types
 */

export type LeadStrength = 'A' | 'B';

export type WebsiteStatus =
  | 'Active'
  | 'Active but Weak'
  | 'Outdated Indicators'
  | 'Broken'
  | 'Unreachable'
  | 'No Website Found'
  | 'Unknown';

export type EmailStatus =
  | 'Verified/Public'
  | 'Public but Unverified'
  | 'Not Found'
  | 'Invalid/Rejected'
  | 'Not Verified';

export type PhoneStatus =
  | 'Verified/Public'
  | 'Public'
  | 'Not Found'
  | 'Invalid/Rejected'
  | 'Not Verified';

export type WhatsAppStatus =
  | 'Yes — Evidence'
  | 'No — Evidence'
  | 'Unknown';

export type BusinessStatus =
  | 'Active'
  | 'Temporarily Closed'
  | 'Closed'
  | 'Unknown';

export type LeadSourceType = 'business_website' | 'official_registry' | 'transient_signal';

export interface FieldProvenance {
  sourceType: LeadSourceType;
  sourceUrl: string;
  retrievedAt: string;
  sourceProvider: string;
  isGoogleDerived: boolean;
}

export interface ScoreFactors {
  nicheRelevance: number;       // 0 - 15
  businessLegitimacy: number;   // 0 - 15
  digitalOpportunity: number;   // 0 - 15
  websiteCondition: number;     // 0 - 15
  recentNeedSignal: number;     // 0 - 10
  evidenceQuality: number;      // 0 - 10
  contactCompleteness: number;  // 0 - 10
  decisionMakerConfidence: number; // 0 - 5
  dataQuality: number;          // 0 - 5
}

export interface Lead {
  id: string;
  userId: string;
  leadId: string;
  runId: string;
  companyName: string;
  canonicalDomain: string;
  normalizedPhone: string;
  duplicateKey: string;
  
  // Contact details (sourced from company website or public registry)
  contactFullName: string;
  jobTitle: string;
  businessEmail: string;
  emailStatus: EmailStatus;
  phoneNumber: string;
  phoneStatus: PhoneStatus;
  whatsAppStatus: WhatsAppStatus;
  
  // Online presence
  website: string;
  websiteStatus: WebsiteStatus;
  facebook: string;
  instagram: string;
  linkedin: string;
  
  // Location
  city: string;
  region: string;
  fullAddress: string;
  country: string;
  industry: string;
  
  // Commercial & Verification Status (Google Maps Policy Compliant)
  commercialVerification: string;
  businessStatus: BusinessStatus;
  googlePlaceId?: string; // Permitted under Google Maps Terms Section 3.2.3(a)(ii)
  
  // Data Provenance & Source Traceability
  sourceType: LeadSourceType;
  sourceUrl: string;
  retrievedAt: string;
  sourceProvider: string;
  isGoogleDerived: boolean;
  
  // Opportunity & Need Signal
  recentNeedSignal: string;
  needEvidence: string;
  businessProblem: string;
  salesOpportunity: string;
  signalDate: string;
  source: string;
  researchDate: string;
  
  // Qualification & Scoring
  leadStrength: LeadStrength;
  leadScore: number;
  scoreFactors: ScoreFactors;
  
  // Status & Notes
  contacted: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceRecord {
  id: string;
  userId: string;
  leadId: string;
  claimSupported: string;
  evidenceUrl: string;
  evidenceSource: string;
  evidenceTitle: string;
  evidenceDate: string;
  evidenceSummary: string;
  createdAt: string;
}

export interface LeadHistoryItem {
  id: string;
  userId: string;
  duplicateKey: string;
  companyName: string;
  canonicalDomain: string;
  normalizedPhone: string;
  country: string;
  niche: string;
  firstDiscoveredAt: string;
  lastResearchedAt: string;
  lastContactedAt?: string;
  status: 'Discovered' | 'Researching' | 'Qualified' | 'Exported' | 'Contacted' | 'Rejected' | 'Suppressed' | 'Archived';
  runId: string;
}

export type JobStage =
  | 'SEARCH_PLANNING'
  | 'CANDIDATE_DISCOVERY'
  | 'DEDUPLICATION'
  | 'BUSINESS_RESEARCH'
  | 'WEBSITE_RESEARCH'
  | 'CONTACT_RESEARCH'
  | 'SOCIAL_RESEARCH'
  | 'OPPORTUNITY_ANALYSIS'
  | 'EVIDENCE_VALIDATION'
  | 'A_B_QUALIFICATION'
  | 'FINAL_QC'
  | 'DATABASE_SAVE'
  | 'COMPLETED'
  | 'FAILED';

export interface ResearchRun {
  id: string;
  userId: string;
  runId: string;
  country: string;
  niche: string;
  location: string;
  requestedCount: number;
  candidatesFound: number;
  duplicatesRemoved: number;
  rejectedCount: number;
  researchCompleted: number;
  qualifiedCount: number;
  finalCount: number;
  shortfall: number;
  status: 'pending' | 'planning' | 'discovering' | 'researching' | 'qualifying' | 'completed' | 'partial' | 'failed';
  stage: JobStage;
  progress: number; // 0 - 100
  durationMs: number;
  errors: string[];
  sourcesUsed: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CandidateBusiness {
  companyName: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  rawSnippet?: string;
  googlePlaceId?: string; // Permitted under Section 3.2.3(a)(ii)
  // Step 6 & 9: Deterministic Candidate Provenance
  discoveryProvider?: string;
  discoverySource?: string;
  discoverySourceUrl?: string;
  discoveryTimestamp?: string;
  isGrounded?: boolean;
}

export interface SearchQueryPlan {
  query: string;
  location: string;
  targetFocus: string;
  terminology: string;
}

export interface SearchPlan {
  country: string;
  niche: string;
  regions: string[];
  queries: SearchQueryPlan[];
  localTerminologyUsed: string[];
  candidateTargetPoolSize: number;
}

export interface SuppressionItem {
  id: string;
  userId: string;
  type: 'domain' | 'phone' | 'company';
  value: string;
  reason: string;
  createdAt: string;
}

export type DiagnosticState =
  | 'GEMINI_CONNECTED'
  | 'SEARCH_GROUNDING_ACTIVE'
  | 'SEARCH_GROUNDING_QUOTA_BLOCKED'
  | 'BUSINESS_DISCOVERY_PROVIDER_ACTIVE'
  | 'BUSINESS_DISCOVERY_PROVIDER_UNAVAILABLE'
  | 'DISCOVERY_SAFE_MODE';

export interface SystemDiagnostics {
  geminiConnected: boolean;
  searchGroundingActive: boolean;
  searchGroundingQuotaBlocked?: boolean;
  discoveryProviderActive?: boolean;
  discoveryProviderName?: string;
  discoverySafeMode?: boolean;
  activeStates?: DiagnosticState[];
  firebaseConfigured: boolean;
  firestoreConnected: boolean;
  authActive: boolean;
  lastChecked: string;
  geminiModel: string;
  quotaWarning?: string;
}
