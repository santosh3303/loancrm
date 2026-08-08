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

async function init() {
  const check = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='contacts'`
  );
  if (check.rows.length > 0) return; // already set up

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await client.executeMultiple(schema);

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
      await run(
        `INSERT INTO doc_checklist_rules (bank_name, loan_category, loan_subcategory, document_tier, document_name, applies_to_common) VALUES (?,?,?,?,?,?)`,
        ['Generic', cat, null, 'Full Set', doc, 0]
      );
    }
    for (const doc of kycOnlyDocs) {
      await run(
        `INSERT INTO doc_checklist_rules (bank_name, loan_category, loan_subcategory, document_tier, document_name, applies_to_common) VALUES (?,?,?,?,?,?)`,
        ['Generic', cat, null, 'KYC Only', doc, 0]
      );
    }
    for (const doc of commonDocs) {
      await run(
        `INSERT INTO doc_checklist_rules (bank_name, loan_category, loan_subcategory, document_tier, document_name, applies_to_common) VALUES (?,?,?,?,?,?)`,
        ['Generic', cat, null, 'Full Set', doc, 1]
      );
    }
  }
  console.log('Database initialized with schema + starter checklist rules.');
}

module.exports = { get, all, run, init };
