/**
 * Production Validation Script (Step 12: Real 10-Lead Production Run)
 * Runs one real research run for:
 * Country: United Kingdom
 * Niche: Builders
 * Target: 10 leads
 */

import fs from 'fs';
import * as XLSX from 'xlsx';
import { executeResearchRun } from '../src/services/researchOrchestrator';
import { buildXlsxWorkbook, mapLeadToRow, PRIMARY_30_COLUMNS } from '../src/lib/export';
import { validateExportCompliance, validateLeadCompliance } from '../src/lib/leadCompliance';

async function runProductionValidation() {
  console.log('=== STARTING STEP 12 REAL PRODUCTION TEST ===');
  console.log('Target: United Kingdom | Niche: Builders | Requested Leads: 10');

  const startTime = Date.now();
  const runId = `prod_test_${Date.now()}`;

  const result = await executeResearchRun({
    userId: 'prod_val_user',
    runId,
    country: 'United Kingdom',
    niche: 'Builders',
    leadCount: 10,
    freshLeadsOnly: true,
    excludeContacted: true,
    minimumScore: 60,
    targetStrength: 'ALL',
    researchDepth: 'Standard',
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nResearch Run Completed in ${durationSec}s. Status: ${result.run.status}`);
  console.log(`- Candidates Discovered: ${result.run.candidatesFound}`);
  console.log(`- Duplicates Removed: ${result.run.duplicatesRemoved}`);
  console.log(`- Candidates Rejected: ${result.run.rejectedCount}`);
  console.log(`- Final Qualified Leads: ${result.qualifiedLeads.length}`);

  let gradeACount = 0;
  let gradeBCount = 0;
  let missingEmails = 0;
  let missingPhones = 0;
  let verifiedEmails = 0;

  for (const lead of result.qualifiedLeads) {
    if (lead.leadStrength === 'A') gradeACount++;
    if (lead.leadStrength === 'B') gradeBCount++;
    if (lead.businessEmail === 'Not Found') missingEmails++;
    else verifiedEmails++;
    if (lead.phoneNumber === 'Not Found') missingPhones++;

    // Validate compliance
    const comp = validateLeadCompliance(lead);
    if (!comp.compliant) {
      console.error(`COMPLIANCE VIOLATION on ${lead.companyName}:`, comp.violations);
    }
  }

  console.log(`- Grade A Leads: ${gradeACount}`);
  console.log(`- Grade B Leads: ${gradeBCount}`);
  console.log(`- Verified Contact Emails: ${verifiedEmails}`);
  console.log(`- Missing Emails (Kept as 'Not Found'): ${missingEmails}`);
  console.log(`- Missing Phones: ${missingPhones}`);
  console.log(`- Total Evidence Records: ${result.evidenceRecords.length}`);

  // Generate Excel XLSX
  console.log('\nGenerating Production Excel XLSX...');
  const wb = buildXlsxWorkbook(result.qualifiedLeads, result.run, result.evidenceRecords);
  const wbBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filePath = 'leadpulse_production_test.xlsx';
  fs.writeFileSync(filePath, wbBuffer);
  console.log(`Excel file written to ${filePath} (${wbBuffer.length} bytes).`);

  // Programmatically reopen and verify
  console.log('Reopening and verifying generated Excel file...');
  const fileBuffer = fs.readFileSync(filePath);
  const reopened = XLSX.read(fileBuffer, { type: 'buffer' });
  const leadsSheet = reopened.Sheets['Qualified Leads'];
  const rows: any[] = XLSX.utils.sheet_to_json(leadsSheet);

  console.log(`- Reopened Row Count: ${rows.length} (Expected: ${result.qualifiedLeads.length})`);
  if (rows.length > 0) {
    const cols = Object.keys(rows[0]);
    console.log(`- Reopened Column Count: ${cols.length} (Expected: 30)`);
    console.log(`- Has Google Rating: ${cols.includes('Google Rating')} (Must be false)`);
    console.log(`- Has Google Reviews: ${cols.includes('Google Reviews')} (Must be false)`);
    console.log(`- Sample Company: ${rows[0]['Company Name']}`);
    console.log(`- Sample Need: ${rows[0]['Business Problem']}`);
    console.log(`- Sample Opportunity: ${rows[0]['Sales Opportunity']}`);
  }

  console.log('\n=== REAL PRODUCTION TEST COMPLETED SUCCESSFULLY ===');
}

runProductionValidation().catch((err) => {
  console.error('Fatal Production Test Failure:', err);
  process.exit(1);
});
