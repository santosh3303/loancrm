const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, 'local.db')}`,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

function rowToObj(row, columns) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}

async function all(sql, args = []) {
  const res = await client.execute({ sql, args });
  return res.rows.map(r => rowToObj(r, res.columns));
}

async function get(sql, args = []) {
  const rows = await all(sql, args);
  return rows[0] || null;
}

async function run(sql, args = []) {
  const res = await client.execute({ sql, args });
  return { lastInsertRowid: Number(res.lastInsertRowid ?? 0), changes: res.rowsAffected };
}

async function columnsOf(table) {
  const res = await client.execute(`PRAGMA table_info(${table})`);
  return res.rows.map(r => r[1]); // column name is index 1
}

async function ensureColumn(table, column, definition) {
  const cols = await columnsOf(table);
  if (!cols.includes(column)) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Migrated: added ${table}.${column}`);
  }
}

async function init() {
  const check = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='contacts'`
  );

  if (check.rows.length === 0) {
    // Brand new database — create everything fresh from schema.sql
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.executeMultiple(schema);
    await seedChecklistRules();
    console.log('Database initialized with schema + starter checklist rules.');
    return;
  }

  // Existing database — self-heal by adding any columns/tables introduced later,
  // so an already-live deployment upgrades itself automatically on next deploy.
  await ensureColumn('contacts', 'monthly_income', 'REAL');
  await ensureColumn('contacts', 'loan_category', 'TEXT');
  await ensureColumn('contacts', 'loan_subcategory', 'TEXT');
  await ensureColumn('contacts', 'loan_amount', 'REAL');
  await ensureColumn('doc_checklist_rules', 'property_type', 'TEXT');
  await ensureColumn('doc_checklist_rules', 'profile_type', 'TEXT');

  const eligTable = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='eligibility_rules'`
  );
  if (eligTable.rows.length === 0) {
    await client.execute(`
      CREATE TABLE eligibility_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_category TEXT NOT NULL,
        condition_type TEXT NOT NULL CHECK (condition_type IN ('min_cibil', 'max_loan_to_income_ratio')),
        threshold REAL NOT NULL,
        message TEXT NOT NULL,
        active BOOLEAN DEFAULT 1
      )
    `);
    await seedEligibilityRules();
    console.log('Migrated: created eligibility_rules table');
  }
  console.log('Database schema up to date.');
}

async function seedChecklistRules() {
  const fullSetDocs = [
    'KYC (PAN + Aadhaar)', 'Last 6 months bank statements', 'Form 16 / ITR (2 years)',
    'Salary slips (3 months) / Business proof', 'Employment / Business vintage proof',
    'Passport photo (2 copies)'
  ];
  const kycOnlyDocs = ['KYC (PAN + Aadhaar)'];
  const commonDocs = ['Property documents (Agreement + Chain)'];
  const categories = ['Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'];

  for (const cat of categories) {
    for (const doc of fullSetDocs) {
      await run(`INSERT INTO doc_checklist_rules (bank_name, loan_category, loan_subcategory, document_tier, document_name, applies_to_common) VALUES (?,?,?,?,?,?)`,
        ['Generic', cat, null, 'Full Set', doc, 0]);
    }
    for (const doc of kycOnlyDocs) {
      await run(`INSERT INTO doc_checklist_rules (bank_name, loan_category, loan_subcategory, document_tier, document_name, applies_to_common) VALUES (?,?,?,?,?,?)`,
        ['Generic', cat, null, 'KYC Only', doc, 0]);
    }
    for (const doc of commonDocs) {
      await run(`INSERT INTO doc_checklist_rules (bank_name, loan_category, loan_subcategory, document_tier, document_name, applies_to_common) VALUES (?,?,?,?,?,?)`,
        ['Generic', cat, null, 'Full Set', doc, 1]);
    }
  }
  await seedEligibilityRules();
}

async function seedEligibilityRules() {
  await run(`INSERT INTO eligibility_rules (loan_category, condition_type, threshold, message) VALUES (?,?,?,?)`,
    ['Any', 'min_cibil', 700, 'CIBIL below 700 — may need justification or a stronger co-applicant']);
  await run(`INSERT INTO eligibility_rules (loan_category, condition_type, threshold, message) VALUES (?,?,?,?)`,
    ['Any', 'max_loan_to_income_ratio', 6, 'Loan amount is high relative to annual income — verify affordability with banker']);
}

module.exports = { get, all, run, init };
