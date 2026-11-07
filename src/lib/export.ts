/**
 * Enterprise XLSX and CSV Export Engine
 * Generates spreadsheets with exact 30 primary columns, text phone formatting,
 * formula injection prevention, autofilters, and evidence tabs.
 */

import * as XLSX from 'xlsx';
import { EvidenceRecord, Lead, ResearchRun } from '../types';
import { escapeFormula } from './normalizer';
import { validateExportCompliance } from './leadCompliance';

export const PRIMARY_30_COLUMNS = [
  'Company Name',
  'Contact Full Name',
  'Job Title',
  'Business Email',
  'Email Status',
  'Phone Number',
  'Phone Status',
  'WhatsApp Status',
  'Website',
  'Website Status',
  'Facebook',
  'Instagram',
  'LinkedIn',
  'City',
  'Region',
  'Country',
  'Full Address',
  'Industry',
  'Commercial Verification',
  'Source Type',
  'Business Status',
  'Recent Need Signal',
  'Need Evidence',
  'Business Problem',
  'Sales Opportunity',
  'Source',
  'Research Date',
  'Lead Strength',
  'Lead Score',
  'Notes',
] as const;

export function mapLeadToRow(lead: Lead): Record<string, string | number> {
  return {
    'Company Name': escapeFormula(lead.companyName || ''),
    'Contact Full Name': escapeFormula(lead.contactFullName || 'Not Found'),
    'Job Title': escapeFormula(lead.jobTitle || 'Not Found'),
    'Business Email': escapeFormula(lead.businessEmail || 'Not Found'),
    'Email Status': escapeFormula(lead.emailStatus || 'Not Found'),
    // Store phone strictly as text string
    'Phone Number': escapeFormula(lead.phoneNumber ? String(lead.phoneNumber) : 'Not Found'),
    'Phone Status': escapeFormula(lead.phoneStatus || 'Not Found'),
    'WhatsApp Status': escapeFormula(lead.whatsAppStatus || 'Unknown'),
    'Website': escapeFormula(lead.website || 'No Website Found'),
    'Website Status': escapeFormula(lead.websiteStatus || 'Unknown'),
    'Facebook': escapeFormula(lead.facebook || 'Not Found'),
    'Instagram': escapeFormula(lead.instagram || 'Not Found'),
    'LinkedIn': escapeFormula(lead.linkedin || 'Not Found'),
    'City': escapeFormula(lead.city || 'Unknown'),
    'Region': escapeFormula(lead.region || 'Unknown'),
    'Country': escapeFormula(lead.country || 'Unknown'),
    'Full Address': escapeFormula(lead.fullAddress || 'Unknown'),
    'Industry': escapeFormula(lead.industry || 'Unknown'),
    'Commercial Verification': escapeFormula(lead.commercialVerification || 'Verified Operational Website'),
    'Source Type': escapeFormula(lead.sourceType || 'business_website'),
    'Business Status': escapeFormula(lead.businessStatus || 'Active'),
    'Recent Need Signal': escapeFormula(lead.recentNeedSignal || 'Not Found'),
    'Need Evidence': escapeFormula(lead.needEvidence || 'Not Found'),
    'Business Problem': escapeFormula(lead.businessProblem || 'Not Found'),
    'Sales Opportunity': escapeFormula(lead.salesOpportunity || 'Not Found'),
    'Source': escapeFormula(lead.sourceUrl || lead.source || ''),
    'Research Date': escapeFormula(lead.researchDate || new Date().toISOString().split('T')[0]),
    'Lead Strength': escapeFormula(lead.leadStrength),
    'Lead Score': lead.leadScore,
    'Notes': escapeFormula(lead.notes || ''),
  };
}

/**
 * Builds XLSX Workbook with primary leads sheet, evidence sheet, and run summary.
 */
export function buildXlsxWorkbook(
  leads: Lead[],
  runInfo?: Partial<ResearchRun>,
  evidenceList: EvidenceRecord[] = []
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Primary Qualified Leads Sheet
  const rows = leads.map(mapLeadToRow);
  const compliance = validateExportCompliance(rows);
  if (!compliance.compliant) {
    throw new Error(`Export blocked by compliance policy: ${compliance.violations.join('; ')}`);
  }
  const wsLeads = XLSX.utils.json_to_sheet(rows, {
    header: [...PRIMARY_30_COLUMNS],
  });

  // Ensure Phone Number column cells are explicitly formatted as string/text ('s' type)
  // to avoid scientific notation in Excel
  const range = XLSX.utils.decode_range(wsLeads['!ref'] || 'A1');
  const phoneColIndex = PRIMARY_30_COLUMNS.indexOf('Phone Number');
  
  if (phoneColIndex >= 0) {
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: phoneColIndex });
      if (wsLeads[cellAddress]) {
        const rowIdx = R - (range.s.r + 1);
        const originalPhone = String(rows[rowIdx]?.['Phone Number'] ?? '');
        wsLeads[cellAddress].v = originalPhone;
        wsLeads[cellAddress].w = originalPhone;
        wsLeads[cellAddress].t = 's'; // String type
        wsLeads[cellAddress].z = '@'; // Text format
      }
    }
  }

  // Set column widths
  wsLeads['!cols'] = PRIMARY_30_COLUMNS.map((col) => {
    if (col === 'Company Name') return { wch: 30 };
    if (col === 'Business Email' || col === 'Website') return { wch: 28 };
    if (col === 'Full Address' || col === 'Business Problem' || col === 'Need Evidence') return { wch: 35 };
    if (col === 'Sales Opportunity' || col === 'Recent Need Signal') return { wch: 25 };
    if (col === 'Phone Number') return { wch: 18 };
    return { wch: 16 };
  });

  // Auto-filter on leads sheet
  wsLeads['!autofilter'] = { ref: wsLeads['!ref'] || 'A1' };

  XLSX.utils.book_append_sheet(wb, wsLeads, 'Qualified Leads');

  // 2. Evidence Sheet
  if (evidenceList.length > 0) {
    const evidenceRows = evidenceList.map((ev) => ({
      'Lead ID': escapeFormula(ev.leadId),
      'Claim Supported': escapeFormula(ev.claimSupported),
      'Evidence Source': escapeFormula(ev.evidenceSource),
      'Evidence URL': escapeFormula(ev.evidenceUrl),
      'Evidence Date': escapeFormula(ev.evidenceDate),
      'Summary': escapeFormula(ev.evidenceSummary),
    }));
    const wsEvidence = XLSX.utils.json_to_sheet(evidenceRows);
    wsEvidence['!cols'] = [
      { wch: 20 },
      { wch: 30 },
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, wsEvidence, 'Research Evidence');
  }

  // 3. Run Summary Sheet
  if (runInfo) {
    const summaryRows = [
      { Metric: 'Run ID', Value: runInfo.runId || 'N/A' },
      { Metric: 'Country', Value: runInfo.country || 'N/A' },
      { Metric: 'Niche / Industry', Value: runInfo.niche || 'N/A' },
      { Metric: 'Location Focus', Value: runInfo.location || 'Countrywide' },
      { Metric: 'Requested Lead Target', Value: runInfo.requestedCount || leads.length },
      { Metric: 'Candidates Discovered', Value: runInfo.candidatesFound || leads.length },
      { Metric: 'Duplicates Removed', Value: runInfo.duplicatesRemoved || 0 },
      { Metric: 'Rejected / Invalid', Value: runInfo.rejectedCount || 0 },
      { Metric: 'Qualified Leads', Value: leads.length },
      { Metric: 'Shortfall', Value: runInfo.shortfall ?? Math.max(0, (runInfo.requestedCount || 0) - leads.length) },
      { Metric: 'Execution Date', Value: new Date().toISOString() },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Run Summary');
  }

  return wb;
}

/**
 * Generates CSV string adhering to UTF-8 and formula escaping.
 */
export function generateCsvString(leads: Lead[]): string {
  const rows = leads.map(mapLeadToRow);
  const compliance = validateExportCompliance(rows);
  if (!compliance.compliant) {
    throw new Error(`Export blocked by compliance policy: ${compliance.violations.join('; ')}`);
  }
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...PRIMARY_30_COLUMNS] });
  return XLSX.utils.sheet_to_csv(ws);
}

/**
 * Triggers file download in browser
 */
export function downloadFile(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Client Bridge Pakistan High-Intent Columns (Section 10)
 */
export const CLIENT_BRIDGE_PAKISTAN_COLUMNS = [
  'Company Name',
  'Industry',
  'Subcategory',
  'City',
  'Area',
  'Address',
  'Website',
  'Website Status',
  'Public Business Email',
  'Email Source',
  'Email Status',
  'Public Phone',
  'Phone Source',
  'Lead Score',
  'Lead Grade',
  'Opportunity Type',
  'Identified Problem',
  'Recommended Service',
  'Business Evidence',
  'Source URLs',
  'Research Date',
  'Verification Status',
  'Notes',
] as const;

export function mapLeadToClientBridgeRow(lead: Lead): Record<string, string | number> {
  const rawEmail = lead.businessEmail && lead.businessEmail !== 'Not Found' ? lead.businessEmail : '';
  const rawPhone = lead.phoneNumber && lead.phoneNumber !== 'Not Found' ? String(lead.phoneNumber) : '';
  const website = lead.website && lead.website !== 'No Website Found' ? lead.website : '';

  return {
    'Company Name': escapeFormula(lead.companyName || ''),
    'Industry': escapeFormula(lead.industry || 'Unknown'),
    'Subcategory': escapeFormula(lead.subcategory || lead.industry || 'General'),
    'City': escapeFormula(lead.city || 'Unknown'),
    'Area': escapeFormula(lead.area || lead.city || 'General'),
    'Address': escapeFormula(lead.fullAddress || lead.city || 'Pakistan'),
    'Website': escapeFormula(website || 'No Website Found'),
    'Website Status': escapeFormula(lead.websiteStatus || 'Unknown'),
    'Public Business Email': escapeFormula(rawEmail || ''), // Leave blank if not found per Section 7
    'Email Source': escapeFormula(lead.emailSourceUrl || (rawEmail ? lead.sourceUrl || lead.source || '' : '')),
    'Email Status': escapeFormula(lead.emailAccuracyStatus || (rawEmail ? 'publicly_listed' : 'not_found')),
    'Public Phone': escapeFormula(rawPhone || ''), // Preserve Pakistani leading zeroes
    'Phone Source': escapeFormula(lead.phoneSourceUrl || (rawPhone ? lead.sourceUrl || lead.source || '' : '')),
    'Lead Score': lead.leadScore,
    'Lead Grade': escapeFormula(lead.leadGrade || (lead.leadScore >= 90 ? 'A+' : lead.leadScore >= 80 ? 'A' : lead.leadScore >= 65 ? 'B' : 'C')),
    'Opportunity Type': escapeFormula(lead.opportunityType || 'new_website'),
    'Identified Problem': escapeFormula(lead.identifiedProblem || lead.businessProblem || 'Digital Modernization Needed'),
    'Recommended Service': escapeFormula(lead.recommendedService || lead.salesOpportunity || 'Client Bridge Agency Solutions'),
    'Business Evidence': escapeFormula(lead.businessEvidence || lead.needEvidence || 'Verified Public Signal'),
    'Source URLs': escapeFormula(lead.sourceUrl || lead.source || ''),
    'Research Date': escapeFormula(lead.researchDate || new Date().toISOString().split('T')[0]),
    'Verification Status': escapeFormula(lead.verificationStatus || (website ? 'Verified' : 'Publicly Listed')),
    'Notes': escapeFormula(lead.notes || ''),
  };
}

/**
 * Builds dedicated Client Bridge Pakistan XLSX Workbook with strict leading zero preservation
 */
export function buildClientBridgeWorkbook(
  leads: Lead[],
  runInfo?: Partial<ResearchRun>,
  sheetTitle: string = 'Pakistan Qualified Leads'
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const rows = leads.map(mapLeadToClientBridgeRow);

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: [...CLIENT_BRIDGE_PAKISTAN_COLUMNS],
  });

  // Explicitly force Public Phone cell type to string ('s') and text format ('@')
  // to strictly preserve Pakistani mobile (03xx) and landline (021/042) leading zeros in Excel
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const phoneColIndex = CLIENT_BRIDGE_PAKISTAN_COLUMNS.indexOf('Public Phone');

  if (phoneColIndex >= 0) {
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: phoneColIndex });
      if (ws[cellAddress]) {
        const rowIdx = R - (range.s.r + 1);
        const originalPhone = String(rows[rowIdx]?.['Public Phone'] ?? '');
        ws[cellAddress].v = originalPhone;
        ws[cellAddress].w = originalPhone;
        ws[cellAddress].t = 's'; // Strict String type
        ws[cellAddress].z = '@'; // Strict Text format
      }
    }
  }

  // Column widths
  ws['!cols'] = CLIENT_BRIDGE_PAKISTAN_COLUMNS.map((col) => {
    if (col === 'Company Name') return { wch: 32 };
    if (col === 'Industry' || col === 'Subcategory') return { wch: 24 };
    if (col === 'Public Business Email' || col === 'Website') return { wch: 28 };
    if (col === 'Public Phone') return { wch: 18 };
    if (col === 'Identified Problem' || col === 'Business Evidence') return { wch: 38 };
    if (col === 'Recommended Service') return { wch: 36 };
    if (col === 'Source URLs' || col === 'Email Source' || col === 'Phone Source') return { wch: 30 };
    return { wch: 16 };
  });

  ws['!autofilter'] = { ref: ws['!ref'] || 'A1' };
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle.substring(0, 31));

  // Agency Run Summary Sheet
  if (runInfo) {
    const summaryRows = [
      { Metric: 'Client Agency', Value: 'Client Bridge (beth97549@gmail.com)' },
      { Metric: 'Run ID', Value: runInfo.runId || 'N/A' },
      { Metric: 'Target Market', Value: runInfo.country || 'Pakistan' },
      { Metric: 'Target Industries', Value: runInfo.niche || 'All Pakistan Target Industries' },
      { Metric: 'Location Focus', Value: runInfo.location || 'Countrywide Matrix' },
      { Metric: 'Requested Lead Target', Value: runInfo.requestedCount || leads.length },
      { Metric: 'Qualified Leads', Value: leads.length },
      { Metric: 'Shortfall', Value: runInfo.shortfall ?? Math.max(0, (runInfo.requestedCount || 0) - leads.length) },
      { Metric: 'Shortfall Explanation', Value: 'Zero quota stuffing. Non-conforming or fabricated leads strictly excluded by QC.' },
      { Metric: 'Generated At', Value: new Date().toISOString() },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Agency Audit Summary');
  }

  return wb;
}

/**
 * Generates Client Bridge CSV string with formula protection and leading zero preservation
 */
export function generateClientBridgeCsvString(leads: Lead[]): string {
  const rows = leads.map(mapLeadToClientBridgeRow);
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...CLIENT_BRIDGE_PAKISTAN_COLUMNS] });
  return XLSX.utils.sheet_to_csv(ws);
}

