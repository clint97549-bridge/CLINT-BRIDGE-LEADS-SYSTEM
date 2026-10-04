import fs from 'fs';
import * as XLSX from 'xlsx';
import assert from 'assert';
import { PRIMARY_30_COLUMNS } from '../src/lib/export';

async function verifyExcel() {
  console.log('=== VERIFYING GENERATED EXCEL FILE ===');
  const filePath = 'leadpulse_production_test.xlsx';
  assert(fs.existsSync(filePath), 'File leadpulse_production_test.xlsx must exist');

  const fileBuffer = fs.readFileSync(filePath);
  console.log(`Read ${fileBuffer.length} bytes from ${filePath}`);
  assert(fileBuffer.length > 5000, 'File must be larger than 5KB');

  const wb = XLSX.read(fileBuffer, { type: 'buffer' });
  console.log('Sheet Names:', wb.SheetNames);
  assert(wb.SheetNames.includes('Qualified Leads'), 'Must contain Qualified Leads');
  assert(wb.SheetNames.includes('Research Evidence'), 'Must contain Research Evidence');
  assert(wb.SheetNames.includes('Run Summary'), 'Must contain Run Summary');

  const sheet = wb.Sheets['Qualified Leads'];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);
  console.log(`Qualified Leads Rows: ${rows.length}`);
  assert(rows.length > 0, 'Must contain at least 1 qualified lead');

  // Verify column count = 30
  const cols = Object.keys(rows[0]);
  console.log(`Column count: ${cols.length}`);
  assert.strictEqual(cols.length, 30, `Expected exactly 30 columns, got ${cols.length}`);

  for (const expectedCol of PRIMARY_30_COLUMNS) {
    assert(cols.includes(expectedCol), `Missing expected column: "${expectedCol}"`);
  }

  // Verify no forbidden Google atmosphere fields
  assert.strictEqual(cols.includes('Google Rating'), false, 'Google Rating must NOT be present');
  assert.strictEqual(cols.includes('Google Reviews'), false, 'Google Reviews must NOT be present');

  // Verify each lead row
  let gradeACount = 0;
  let gradeBCount = 0;
  let hasValidEvidence = true;

  rows.forEach((r, idx) => {
    assert(r['Company Name'] && r['Company Name'].length > 1, `Row ${idx} missing Company Name`);
    assert(r['Lead Strength'] === 'A' || r['Lead Strength'] === 'B', `Row ${idx} invalid strength: ${r['Lead Strength']}`);
    if (r['Lead Strength'] === 'A') gradeACount++;
    if (r['Lead Strength'] === 'B') gradeBCount++;

    assert(r['Business Problem'] && r['Business Problem'].length > 5, `Row ${idx} missing Business Problem`);
    assert(r['Need Evidence'] && r['Need Evidence'].length > 5, `Row ${idx} missing Need Evidence`);
    assert(r['Source Type'] === 'business_website' || r['Source Type'] === 'registry_or_directory', `Row ${idx} invalid Source Type`);
    
    // Check no placeholder fabrication
    assert(r['Business Email'] !== 'admin@example.com', 'No placeholder email');
    assert(r['Contact Full Name'] !== 'John Doe', 'No placeholder contact name');
  });

  console.log(`Grade A Count: ${gradeACount}, Grade B Count: ${gradeBCount}`);

  // Check Research Evidence sheet
  const evSheet = wb.Sheets['Research Evidence'];
  const evRows: any[] = XLSX.utils.sheet_to_json(evSheet);
  console.log(`Research Evidence Rows: ${evRows.length}`);
  assert(evRows.length > 0, 'Must have evidence records');

  // Check Run Summary sheet
  const summarySheet = wb.Sheets['Run Summary'];
  const summaryRows: any[] = XLSX.utils.sheet_to_json(summarySheet);
  console.log(`Run Summary Rows: ${summaryRows.length}`);
  assert(summaryRows.length > 5, 'Run Summary must have summary metrics');

  console.log('✓ EXCEL QUALITY VERIFICATION PASSED PERFECTLY!');
}

verifyExcel().catch((err) => {
  console.error('Excel verification failed:', err);
  process.exit(1);
});
