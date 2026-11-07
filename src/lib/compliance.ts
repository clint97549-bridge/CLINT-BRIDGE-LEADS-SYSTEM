/**
 * Country-Specific B2B Outreach Compliance & Regulatory Review Engine
 * (PECR / UK GDPR for United Kingdom & CAN-SPAM / TCPA / State rules for United States)
 * 
 * IMPORTANT: This module serves as a technical safeguard and operational reminder layer
 * to assist Client Bridge in conducting compliant B2B lead generation.
 * Lead discovery is strictly separated from outreach execution.
 */

export interface UKComplianceInfo {
  businessType: 'Private Limited Company (Ltd)' | 'Public Limited Company (PLC)' | 'Limited Liability Partnership (LLP)' | 'Sole Trader / Individual' | 'Partnership' | 'Unknown';
  subscriberType: 'corporate' | 'individual';
  personalDataPresent: boolean;
  lawfulBasisReviewRequired: boolean;
  emailMarketingReviewRequired: boolean;
  liveCallScreeningRequired: boolean;
  ctpsCheckStatus: 'Check Required before calling' | 'Exempt' | 'Not Screened';
  tpsCheckStatus: 'Check Required before calling' | 'Exempt' | 'Not Screened';
  doNotContact: boolean;
  optOutStatus: 'Active' | 'Opted Out' | 'None';
  complianceNotes: string;
}

export interface USComplianceInfo {
  businessState: string;
  businessEntityType: 'LLC' | 'Corporation (Inc/Corp)' | 'Sole Proprietorship' | 'Partnership' | 'General Commercial';
  personalDataPresent: boolean;
  canSpamReviewRequired: boolean;
  dncScreeningRequired: boolean;
  tcpaReviewRequired: boolean;
  callPermissionStatus: 'Prior Express Consent Required for Automated Calls' | 'Live B2B Inquiry Only' | 'Exempt';
  smsPermissionStatus: 'Strict Opt-In Required before SMS' | 'No SMS Consent';
  doNotContact: boolean;
  optOutStatus: 'Active' | 'Opted Out' | 'None';
  complianceNotes: string;
}

export type ComplianceReviewStatus =
  | 'Compliant for B2B Contact'
  | 'PECR Review Required'
  | 'CAN-SPAM Review Required'
  | 'Manual Legal Review Required'
  | 'Do Not Contact / Suppressed';

/**
 * Evaluates UK B2B Outreach Compliance according to PECR and UK GDPR guidelines.
 */
export function evaluateUKCompliance(params: {
  companyName: string;
  contactFullName?: string;
  email?: string;
  phone?: string;
}): UKComplianceInfo {
  const nameLower = (params.companyName || '').toLowerCase();
  const contactLower = (params.contactFullName || '').toLowerCase();
  const emailLower = (params.email || '').toLowerCase();

  // 1. Determine whether corporate or individual subscriber
  const isCorporate =
    nameLower.includes('limited') ||
    nameLower.includes('ltd') ||
    nameLower.includes('plc') ||
    nameLower.includes('llp') ||
    nameLower.includes('cic') ||
    nameLower.includes('charity');

  const isSoleTrader =
    !isCorporate &&
    (nameLower.includes('& sons') ||
      nameLower.includes('& co') ||
      nameLower.includes('sole trader') ||
      contactLower.length > 3 ||
      emailLower.includes('@gmail.com') ||
      emailLower.includes('@yahoo.co.uk') ||
      emailLower.includes('@hotmail.com') ||
      emailLower.includes('@outlook.com'));

  const subscriberType: 'corporate' | 'individual' = isCorporate ? 'corporate' : 'individual';
  const businessType = isCorporate
    ? nameLower.includes('plc')
      ? 'Public Limited Company (PLC)'
      : nameLower.includes('llp')
      ? 'Limited Liability Partnership (LLP)'
      : 'Private Limited Company (Ltd)'
    : isSoleTrader
    ? 'Sole Trader / Individual'
    : 'Partnership';

  const personalDataPresent = Boolean(
    (params.contactFullName && params.contactFullName !== 'Not Found') ||
      (params.email &&
        !params.email.startsWith('info@') &&
        !params.email.startsWith('enquiries@') &&
        !params.email.startsWith('hello@') &&
        !params.email.startsWith('contact@') &&
        params.email !== 'Not Found')
  );

  // In UK PECR:
  // Corporate subscribers (Ltd, PLC, LLP) can receive B2B marketing emails without prior consent,
  // subject to an easy opt-out mechanism and accurate sender identity.
  // Individual subscribers (Sole traders, unincorporated partnerships) require opt-in consent or soft opt-in.
  const emailMarketingReviewRequired = subscriberType === 'individual';
  const liveCallScreeningRequired = true; // CTPS / TPS screening recommended for all UK telemarketing
  const lawfulBasisReviewRequired = personalDataPresent;

  const notesParts: string[] = [];
  if (subscriberType === 'corporate') {
    notesParts.push('Corporate subscriber (Ltd/LLP): B2B email permitted under PECR with clear opt-out.');
  } else {
    notesParts.push('Individual subscriber / Sole Trader: Verify consent or soft opt-in under PECR before emailing.');
  }
  notesParts.push('Screen against CTPS/TPS before telephone outreach.');

  return {
    businessType,
    subscriberType,
    personalDataPresent,
    lawfulBasisReviewRequired,
    emailMarketingReviewRequired,
    liveCallScreeningRequired,
    ctpsCheckStatus: 'Check Required before calling',
    tpsCheckStatus: subscriberType === 'individual' ? 'Check Required before calling' : 'Exempt',
    doNotContact: false,
    optOutStatus: 'Active',
    complianceNotes: notesParts.join(' '),
  };
}

/**
 * Evaluates USA B2B Outreach Compliance according to CAN-SPAM, TCPA, and state regulatory guidelines.
 */
export function evaluateUSCompliance(params: {
  companyName: string;
  state?: string;
  contactFullName?: string;
  email?: string;
  phone?: string;
}): USComplianceInfo {
  const nameLower = (params.companyName || '').toLowerCase();
  const contactLower = (params.contactFullName || '').toLowerCase();

  let businessEntityType: 'LLC' | 'Corporation (Inc/Corp)' | 'Sole Proprietorship' | 'Partnership' | 'General Commercial' =
    'General Commercial';

  if (nameLower.includes('llc') || nameLower.includes('l.l.c.')) {
    businessEntityType = 'LLC';
  } else if (nameLower.includes('inc') || nameLower.includes('corp') || nameLower.includes('corporation')) {
    businessEntityType = 'Corporation (Inc/Corp)';
  } else if (nameLower.includes('sole trader') || (!nameLower.includes('llc') && contactLower.length > 3)) {
    businessEntityType = 'Sole Proprietorship';
  }

  const personalDataPresent = Boolean(params.contactFullName && params.contactFullName !== 'Not Found');
  const businessState = params.state || 'General US';

  const notes = [
    'CAN-SPAM review: Must include accurate header, non-deceptive subject, valid physical address, and functional opt-out.',
    'TCPA notice: Do not use automated dialers or SMS without prior express written consent.',
    'Live B2B phone calls must respect Federal and State DNC lists.',
  ].join(' ');

  return {
    businessState,
    businessEntityType,
    personalDataPresent,
    canSpamReviewRequired: true,
    dncScreeningRequired: true,
    tcpaReviewRequired: true,
    callPermissionStatus: 'Live B2B Inquiry Only',
    smsPermissionStatus: 'Strict Opt-In Required before SMS',
    doNotContact: false,
    optOutStatus: 'Active',
    complianceNotes: notes,
  };
}

/**
 * Overall compliance review status determination for any lead.
 */
export function getOverallComplianceStatus(
  country: string,
  uk?: UKComplianceInfo,
  us?: USComplianceInfo
): ComplianceReviewStatus {
  const cLower = (country || '').toLowerCase();
  if (cLower.includes('united kingdom') || cLower === 'gb' || cLower === 'uk') {
    if (uk?.subscriberType === 'individual') {
      return 'PECR Review Required';
    }
    return 'Compliant for B2B Contact';
  }

  if (cLower.includes('united states') || cLower === 'us' || cLower === 'usa') {
    return 'CAN-SPAM Review Required';
  }

  return 'Compliant for B2B Contact';
}
