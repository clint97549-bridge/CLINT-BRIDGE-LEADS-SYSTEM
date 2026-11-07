/**
 * LeadPulse AI - Enterprise B2B Lead Intelligence Types
 */

import type { UKComplianceInfo, USComplianceInfo, ComplianceReviewStatus } from '../lib/compliance';

export type { UKComplianceInfo, USComplianceInfo, ComplianceReviewStatus };

export type LeadStrength = 'A' | 'B';

export type OpportunityTier = 'High' | 'Medium' | 'Low';

export type EvidenceClassification =
  | 'Verified fact'
  | 'Publicly listed, not independently verified'
  | 'Observed technical issue'
  | 'Potential sales opportunity'
  | 'Active hiring confirmed by a relevant source'
  | 'Not found'
  | 'Not verified';

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
  | 'Likely Mobile'
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

export type LeadGrade = 'A+' | 'A' | 'B' | 'C' | 'Excluded';

export type OpportunityType =
  | 'new_website'
  | 'website_redesign'
  | 'booking_system'
  | 'property_portal'
  | 'ecommerce'
  | 'mobile_app'
  | 'crm'
  | 'student_portal'
  | 'lms'
  | 'branding'
  | 'seo'
  | 'digital_marketing'
  | 'multiple_services'
  | 'manual_review';

export type ContactAccuracyStatus =
  | 'publicly_listed'
  | 'technically_verified'
  | 'unverified'
  | 'not_found'
  | 'manual_review_required';

export type ECommerceBusinessType =
  | 'ecommerce_brand'
  | 'online_retailer'
  | 'social_commerce_brand'
  | 'manufacturer_with_online_sales'
  | 'marketplace_seller'
  | 'physical_retailer_only'
  | 'unknown_business_type';

export type StoreFunctionalityStatus =
  | 'fully_functional'
  | 'catalog_only_no_checkout'
  | 'dm_ordering_only'
  | 'broken_checkout'
  | 'no_store'
  | 'not_tested';

export type ProductCatalogueStatus =
  | 'rich_catalog'
  | 'partial_catalog'
  | 'social_feed_only'
  | 'no_catalog';

export type MobileExperienceStatus =
  | 'optimized'
  | 'unresponsive_flawed'
  | 'not_tested';

export interface ScoreFactors {
  // Client Bridge Pakistan 100-Point Model (Section 6)
  websiteOpportunity?: number;           // 0 - 20 (or 25 legacy)
  industryDigitalOpportunity?: number;   // 0 - 20
  activeOperationsEvidence?: number;     // 0 - 15
  growthLaunchEvidence?: number;         // 0 - 15
  serviceFit?: number;                   // 0 - 15
  contactAvailability?: number;          // 0 - 10
  researchCompleteness?: number;         // 0 - 5

  // Backward-compatible Client Bridge 7-Factor Model fields
  websiteUsability?: number;             // 0 - 20
  growthSignals?: number;                // 0 - 15
  hiringInvestment?: number;             // 0 - 10
  businessIdentity?: number;             // 0 - 10

  // Backward-compatible granular factor fields
  nicheRelevance?: number;               // 0 - 15
  businessLegitimacy?: number;           // 0 - 15
  digitalOpportunity?: number;           // 0 - 15
  websiteCondition?: number;             // 0 - 15
  recentNeedSignal?: number;             // 0 - 10
  evidenceQuality?: number;              // 0 - 10
  contactCompleteness?: number;          // 0 - 10
  decisionMakerConfidence?: number;      // 0 - 5
  dataQuality?: number;                  // 0 - 5
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
  opportunityTier?: OpportunityTier;
  leadScore: number;
  scoreFactors: ScoreFactors;
  scoreExplanation?: string;
  missingEvidenceWarnings?: string[];
  hiringEvidence?: string;
  launchEvidence?: string;
  ecommerceStorefrontDetected?: boolean;
  bookingWorkflowDetected?: boolean;
  
  // Status & Notes
  contacted: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;

  // Multi-Market & Compliance Support (Client Bridge UK / US / PK)
  marketCode?: 'PK' | 'GB' | 'US';
  postcodeOrZip?: string;
  complianceReviewStatus?: ComplianceReviewStatus;
  ukCompliance?: UKComplianceInfo;
  usCompliance?: USComplianceInfo;
  leadGrade?: LeadGrade;

  // Client Bridge Pakistan Specialization
  subcategory?: string;
  area?: string;
  opportunityType?: OpportunityType;
  identifiedProblem?: string;
  recommendedService?: string;
  whyQualifies?: string;
  businessEvidence?: string;
  manualVerificationNeeded?: string;
  emailSourceUrl?: string;
  phoneSourceUrl?: string;
  emailAccuracyStatus?: ContactAccuracyStatus;
  phoneAccuracyStatus?: ContactAccuracyStatus;
  isReviewed?: boolean;
  isSuppressed?: boolean;
  verificationStatus?: 'Verified' | 'Unverified' | 'Needs Review' | 'Publicly Listed';
  
  // Dedicated E-Commerce Intelligence (Part C)
  businessType?: ECommerceBusinessType;
  ecommerceCategory?: string;
  onlineSellingEvidence?: string;
  storeFunctionalityStatus?: StoreFunctionalityStatus;
  mobileExperience?: MobileExperienceStatus;
  productCatalogueStatus?: ProductCatalogueStatus;
  isGenuineEcommerce?: boolean;

  // Rich Research Workspace & Quality Indicators (Phases 5 - 17)
  researchQuality?: 'Excellent' | 'Good' | 'Limited' | 'Rejected';
  facebookStatus?: 'Verified' | 'Unverified' | 'Not Found';
  facebookSource?: string;
  facebookTimestamp?: string;
  instagramStatus?: 'Verified' | 'Unverified' | 'Not Found';
  instagramSource?: string;
  instagramTimestamp?: string;
  servicesDiscovered?: string[];
  targetCustomers?: string;
  businessSummary?: string;
  commercialOpportunityDetails?: {
    problem: string;
    evidence: string;
    commercialImpact: string;
    recommendedService: string;
    prospectRationale: string;
  };
  timeline?: {
    stage: string;
    timestamp: string;
    status: 'completed' | 'in_progress' | 'skipped' | 'failed';
    detail: string;
  }[];
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
  classification?: EvidenceClassification;
  createdAt: string;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  category: 'Search & Discovery' | 'Social Intelligence' | 'Technical Auditing' | 'Data Persistence';
  status: 'Connected' | 'Not Configured' | 'Authorization Required' | 'Quota Limited' | 'Failed';
  capabilities: string[];
  permissions: string[];
  lastChecked: string;
  setupInstructions: string;
  safeDetails?: string;
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
  subNiche?: string;
  province?: string;
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
  qualificationFilters?: {
    requireNoWebsite?: boolean;
    allowWeakWebsite?: boolean;
    requireHiring?: boolean;
    minQualityScore?: number;
    requiredContactDetails?: 'any' | 'phone_only' | 'email_only' | 'both';
    opportunityType?: OpportunityType | 'ALL';
    onlyGenuineEcommerce?: boolean;
    ecommerceWebsiteOpportunitiesOnly?: boolean;
  };
  marketBreakdown?: Record<string, { requested: number; candidates: number; qualified: number; status?: string }>;
  selectedIndustries?: string[];
  selectedCities?: string[];
  industryBreakdown?: Record<string, { requested: number; candidates: number; qualified: number; status?: string }>;
  cityBreakdown?: Record<string, { requested: number; candidates: number; qualified: number; status?: string }>;
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
  // Social & Direct Communication Metadata
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
  // E-Commerce Metadata
  businessType?: ECommerceBusinessType;
  ecommerceCategory?: string;
  onlineSellingEvidence?: string;
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
  subNiche?: string;
  customSearchTerms?: string[];
  regions: string[];
  queries: SearchQueryPlan[];
  localTerminologyUsed: string[];
  candidateTargetPoolSize: number;
  qualificationFilters?: {
    requireNoWebsite?: boolean;
    allowWeakWebsite?: boolean;
    requireHiring?: boolean;
    minQualityScore?: number;
  };
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
  | 'PLACES_API_QUOTA_BLOCKED'
  | 'DISCOVERY_SAFE_MODE';

export interface ProviderStatus {
  name: string;
  type: 'discovery' | 'website' | 'social' | 'contact' | 'evidence';
  status: 'Active' | 'Unavailable' | 'Rate Limited' | 'Authentication Required' | 'Error';
  detail: string;
  lastChecked: string;
}

export interface SystemDiagnostics {
  geminiConnected: boolean;
  placesApiActive?: boolean;
  placesApiState?: string;
  placesApiError?: string;
  searchGroundingActive: boolean;
  searchGroundingQuotaBlocked?: boolean;
  searchGroundingState?: string;
  discoveryProviderActive?: boolean;
  discoveryProviderName?: string;
  discoverySafeMode?: boolean;
  activeStates?: DiagnosticState[];
  firebaseConfigured: boolean;
  firestoreConnected: boolean;
  authActive: boolean;
  websiteVerificationActive?: boolean;
  websiteVerificationState?: string;
  lastChecked: string;
  geminiModel: string;
  quotaWarning?: string;
  providers?: ProviderStatus[];
  metaIntegration?: {
    connected: boolean;
    status: 'Connected' | 'Not Connected';
    authorizedPagesCount: number;
    permissions: string[];
    lastVerified?: string;
  };
}
