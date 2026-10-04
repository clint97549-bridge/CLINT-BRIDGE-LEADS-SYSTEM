/**
 * Real Production Pipeline & Excel Validation Test
 * Country: United Kingdom
 * Niche: Builders & Construction
 * Requested: 10
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { executeResearchRun } from '../src/services/researchOrchestrator';
import { buildXlsxWorkbook, PRIMARY_30_COLUMNS } from '../src/lib/export';
import { validateExportCompliance, validateLeadCompliance } from '../src/lib/leadCompliance';
import { Lead } from '../src/types';

async function runProductionHardenedTest() {
  console.log('=== STARTING REAL PRODUCTION RUN: UK BUILDERS & CONSTRUCTION ===');

  const runResult = await executeResearchRun({
    userId: 'prod_verified_admin',
    runId: `prod_run_${Date.now()}`,
    country: 'United Kingdom',
    niche: 'Builders & Construction',
    leadCount: 10,
    freshLeadsOnly: true,
    excludeContacted: true,
    minimumScore: 60,
    targetStrength: 'ALL',
    researchDepth: 'Standard',
  });

  const { run, qualifiedLeads, evidenceRecords } = runResult;

  console.log('\n--- PIPELINE EXECUTION METRICS ---');
  console.log(`Status: ${run.status}`);
  console.log(`Candidates Discovered: ${run.candidatesFound}`);
  console.log(`Duplicates Removed: ${run.duplicatesRemoved}`);
  console.log(`Candidates Rejected by QC: ${run.rejectedCount}`);
  console.log(`Total Qualified Leads: ${qualifiedLeads.length}`);

  const aCount = qualifiedLeads.filter((l) => l.leadStrength === 'A').length;
  const bCount = qualifiedLeads.filter((l) => l.leadStrength === 'B').length;
  console.log(`Grade A Qualified: ${aCount}`);
  console.log(`Grade B Qualified: ${bCount}`);

  // Contact metrics
  const verifiedEmails = qualifiedLeads.filter((l) => l.businessEmail !== 'Not Found').length;
  const missingEmails = qualifiedLeads.filter((l) => l.businessEmail === 'Not Found').length;
  const verifiedPhones = qualifiedLeads.filter((l) => l.phoneNumber !== 'Not Found').length;
  const missingPhones = qualifiedLeads.filter((l) => l.phoneNumber === 'Not Found').length;

  console.log(`Verified Public Emails: ${verifiedEmails}`);
  console.log(`Missing Emails (Marked "Not Found"): ${missingEmails}`);
  console.log(`Verified Phone Numbers: ${verifiedPhones}`);
  console.log(`Missing Phone Numbers (Marked "Not Found"): ${missingPhones}`);

  // Verify Quality & Non-Fabrication
  for (const lead of qualifiedLeads) {
    assert(lead.companyName && lead.companyName.length > 2, 'Company name must be valid');
    assert(lead.leadStrength === 'A' || lead.leadStrength === 'B', 'Strength must strictly be A or B');
    assert(lead.leadScore >= 60 && lead.leadScore <= 100, 'Score must be >= 60');
    assert(lead.sourceUrl && lead.sourceUrl.startsWith('http'), 'Source URL must be valid HTTP(S)');
    assert(!lead.sourceUrl.includes('public-web-register.org'), 'Must not contain public-web-register.org');
    assert(lead.businessProblem && lead.businessProblem !== 'Not Found', 'Business problem must be verified');
    assert(lead.salesOpportunity && lead.salesOpportunity !== 'Not Found', 'Sales opportunity must be verified');
    assert(lead.needEvidence && lead.needEvidence !== 'Not Found', 'Need evidence must be verified');

    // Policy compliance
    const comp = validateLeadCompliance(lead);
    assert.strictEqual(comp.compliant, true, `Lead must pass policy compliance: ${comp.violations.join(', ')}`);
  }

  // Generate Excel workbook
  console.log('\n--- GENERATING EXCEL WORKBOOK ---');
  const wb = buildXlsxWorkbook(qualifiedLeads, run, evidenceRecords);
  const outPath = path.resolve(process.cwd(), 'leadpulse_production_hardened.xlsx');
  XLSX.writeFile(wb, outPath);

  assert(fs.existsSync(outPath), 'Excel file must exist on disk');
  const stats = fs.statSync(outPath);
  console.log(`Generated Excel File: ${outPath} (${stats.size} bytes)`);

  // Programmatically Reopen and Audit
  console.log('\n--- PROGRAMMATIC EXCEL REOPEN & QUALITY AUDIT ---');
  const fileBuffer = fs.readFileSync(outPath);
  const reopenedWb = XLSX.read(fileBuffer, { type: 'buffer' });
  assert(reopenedWb.SheetNames.includes('Qualified Leads'), 'Workbook must have Qualified Leads sheet');
  assert(reopenedWb.SheetNames.includes('Research Evidence'), 'Workbook must have Research Evidence sheet');

  const ws = reopenedWb.Sheets['Qualified Leads'];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);
  console.log(`Audit: Read ${rows.length} rows from Qualified Leads sheet`);
  assert.strictEqual(rows.length, qualifiedLeads.length, 'Row count must exactly match qualified leads count');

  if (rows.length > 0) {
    const firstRowCols = Object.keys(rows[0]);
    console.log(`Audit: Found ${firstRowCols.length} columns in Excel`);
    assert.strictEqual(firstRowCols.length, 30, 'Excel must contain exactly 30 columns');

    for (const col of PRIMARY_30_COLUMNS) {
      assert(firstRowCols.includes(col), `Missing expected column "${col}"`);
    }

    // Verify compliance across all rows in Excel
    const exportComp = validateExportCompliance(rows);
    assert.strictEqual(exportComp.compliant, true, `Export compliance failed: ${exportComp.violations.join('; ')}`);

    // Verify cell types for phone numbers remain text
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const phoneColIdx = PRIMARY_30_COLUMNS.indexOf('Phone Number');
    if (phoneColIdx >= 0) {
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: phoneColIdx });
        const cell = ws[cellAddr];
        if (cell && cell.v) {
          assert.strictEqual(cell.t, 's', `Phone cell at ${cellAddr} must be string type ('s'), found ${cell.t}`);
        }
      }
    }
    console.log('Audit: Phone numbers verified as text format (no scientific notation)');

    // Verify formula injection protection
    for (const row of rows) {
      for (const [key, val] of Object.entries(row)) {
        if (typeof val === 'string' && (val.startsWith('=') || val.startsWith('+') || val.startsWith('-') || val.startsWith('@'))) {
          assert.fail(`Unescaped formula injection detected in column "${key}": ${val}`);
        }
      }
    }
    console.log('Audit: Formula injection protection verified (zero unescaped formula triggers)');
  }

  console.log('\n=== REAL PRODUCTION RUN & EXCEL AUDIT COMPLETED SUCCESSFULLY! ===');
}

runProductionHardenedTest().catch((err) => {
  console.error('Fatal Production Test Error:', err);
  process.exit(1);
});
