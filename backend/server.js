const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const auditLog = async (table, id, field, oldVal, newVal) => {
  if (String(oldVal) === String(newVal)) return;
  await db.run(
    `INSERT INTO audit_log (table_name, record_id, field_changed, old_value, new_value) VALUES (?,?,?,?,?)`,
    [table, id, field, String(oldVal ?? ''), String(newVal ?? '')]
  );
};

// ---------- CONTACTS ----------

app.get('/api/contacts/search', async (req, res) => {
  const { q, role } = req.query;
  if (!q || q.length < 2) return res.json([]);
  let sql = `SELECT * FROM contacts WHERE (name LIKE ? OR mobile LIKE ?)`;
  const args = [`%${q}%`, `%${q}%`];
  if (role) { sql += ` AND role = ?`; args.push(role); }
  sql += ` LIMIT 8`;
  res.json(await db.all(sql, args));
});

app.get('/api/contacts', async (req, res) => {
  const { role } = req.query;
  const rows = role
    ? await db.all(`SELECT * FROM contacts WHERE role = ? ORDER BY created_at DESC`, [role])
    : await db.all(`SELECT * FROM contacts ORDER BY created_at DESC`);
  res.json(rows);
});

app.get('/api/contacts/:id', async (req, res) => {
  const row = await db.get(`SELECT * FROM contacts WHERE id = ?`, [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.post('/api/contacts', async (req, res) => {
  const c = req.body;
  const info = await db.run(`
    INSERT INTO contacts (role, name, mobile, location, lead_date, qualification_status, priority,
      source, campaign_name, referred_by_contact_id, cibil_score, profile_type, profile_detail, additional_info)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `, [
    c.role, c.name, c.mobile || null, c.location || null, c.lead_date || null,
    c.qualification_status || null, c.priority || null, c.source || null, c.campaign_name || null,
    c.referred_by_contact_id || null, c.cibil_score || null, c.profile_type || null,
    c.profile_detail || null, c.additional_info || null
  ]);
  res.json(await db.get(`SELECT * FROM contacts WHERE id = ?`, [info.lastInsertRowid]));
});

app.put('/api/contacts/:id', async (req, res) => {
  const existing = await db.get(`SELECT * FROM contacts WHERE id = ?`, [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const c = { ...existing, ...req.body };
  await db.run(`
    UPDATE contacts SET role=?, name=?, mobile=?, location=?, lead_date=?,
      qualification_status=?, priority=?, source=?, campaign_name=?,
      referred_by_contact_id=?, cibil_score=?, profile_type=?, profile_detail=?, additional_info=?
    WHERE id=?
  `, [c.role, c.name, c.mobile, c.location, c.lead_date, c.qualification_status, c.priority,
      c.source, c.campaign_name, c.referred_by_contact_id, c.cibil_score, c.profile_type,
      c.profile_detail, c.additional_info, c.id]);
  for (const k of Object.keys(req.body)) await auditLog('contacts', c.id, k, existing[k], req.body[k]);
  res.json(await db.get(`SELECT * FROM contacts WHERE id = ?`, [req.params.id]));
});

app.get('/api/contacts/:id/performance', async (req, res) => {
  const connectorId = req.params.id;
  const leads = await db.all(`SELECT * FROM contacts WHERE referred_by_contact_id = ?`, [connectorId]);
  const leadIds = leads.map(l => l.id);
  let files = [];
  if (leadIds.length) {
    const placeholders = leadIds.map(() => '?').join(',');
    files = await db.all(`SELECT * FROM loan_files WHERE lead_contact_id IN (${placeholders})`, leadIds);
  }
  const disbursed = files.filter(f => f.current_stage === 'Disbursed');
  const totalCommission = disbursed.reduce((sum, f) => sum + (f.commission_expected || 0), 0);
  res.json({
    leads_referred: leads.length,
    converted_to_file: files.length,
    disbursed: disbursed.length,
    conversion_rate: leads.length ? Math.round((files.length / leads.length) * 100) : 0,
    total_commission_earned: totalCommission,
    linked_leads: leads
  });
});

// ---------- LOAN FILES ----------

app.get('/api/loan-files', async (req, res) => {
  res.json(await db.all(`
    SELECT lf.*, c.name as lead_name, c.mobile as lead_mobile, b.name as banker_name, b.mobile as banker_mobile
    FROM loan_files lf JOIN contacts c ON c.id = lf.lead_contact_id
    LEFT JOIN contacts b ON b.id = lf.banker_contact_id
    ORDER BY lf.created_at DESC
  `));
});

app.get('/api/loan-files/:id', async (req, res) => {
  const file = await db.get(`
    SELECT lf.*, c.name as lead_name, c.mobile as lead_mobile, c.location, c.cibil_score, c.profile_type, c.profile_detail,
      b.name as banker_name, b.mobile as banker_mobile
    FROM loan_files lf JOIN contacts c ON c.id = lf.lead_contact_id
    LEFT JOIN contacts b ON b.id = lf.banker_contact_id
    WHERE lf.id = ?
  `, [req.params.id]);
  if (!file) return res.status(404).json({ error: 'Not found' });
  file.applicants = await db.all(`SELECT * FROM file_applicants WHERE loan_file_id = ?`, [req.params.id]);
  file.follow_ups = await db.all(`SELECT * FROM follow_ups WHERE loan_file_id = ? ORDER BY due_date`, [req.params.id]);
  file.queries = await db.all(`SELECT * FROM queries WHERE loan_file_id = ? ORDER BY created_at DESC`, [req.params.id]);
  file.communication_log = await db.all(`SELECT * FROM communication_log WHERE loan_file_id = ? ORDER BY log_date DESC`, [req.params.id]);
  res.json(file);
});

app.post('/api/loan-files', async (req, res) => {
  const f = req.body;
  const info = await db.run(`
    INSERT INTO loan_files (lead_contact_id, loan_category, loan_subcategory, loan_amount, property_category,
      property_type, banker_contact_id, bank_name, current_stage, commission_expected, commission_status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `, [f.lead_contact_id, f.loan_category, f.loan_subcategory || null, f.loan_amount || null,
      f.property_category || null, f.property_type || null, f.banker_contact_id || null,
      f.bank_name || null, f.current_stage || 'File Prep', f.commission_expected || null,
      f.commission_status || 'Pending']);
  res.json(await db.get(`SELECT * FROM loan_files WHERE id = ?`, [info.lastInsertRowid]));
});

app.put('/api/loan-files/:id', async (req, res) => {
  const existing = await db.get(`SELECT * FROM loan_files WHERE id = ?`, [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const f = { ...existing, ...req.body };
  await db.run(`
    UPDATE loan_files SET loan_category=?, loan_subcategory=?, loan_amount=?,
      property_category=?, property_type=?, banker_contact_id=?,
      bank_name=?, current_stage=?, commission_expected=?, commission_status=?
    WHERE id=?
  `, [f.loan_category, f.loan_subcategory, f.loan_amount, f.property_category, f.property_type,
      f.banker_contact_id, f.bank_name, f.current_stage, f.commission_expected, f.commission_status, f.id]);
  for (const k of Object.keys(req.body)) await auditLog('loan_files', f.id, k, existing[k], req.body[k]);
  res.json(await db.get(`SELECT * FROM loan_files WHERE id = ?`, [req.params.id]));
});

app.post('/api/loan-files/:id/applicants', async (req, res) => {
  const a = req.body;
  const tier = a.applicant_role === 'Co-Applicant' ? (a.document_tier || 'Full Set') : 'Full Set';
  const info = await db.run(`
    INSERT INTO file_applicants (loan_file_id, contact_id, name, mobile, applicant_role, document_tier)
    VALUES (?,?,?,?,?,?)
  `, [req.params.id, a.contact_id || null, a.name, a.mobile || null, a.applicant_role, tier]);
  res.json(await db.get(`SELECT * FROM file_applicants WHERE id = ?`, [info.lastInsertRowid]));
});

app.put('/api/applicants/:id', async (req, res) => {
  await db.run(`UPDATE file_applicants SET document_tier = ? WHERE id = ?`, [req.body.document_tier, req.params.id]);
  res.json(await db.get(`SELECT * FROM file_applicants WHERE id = ?`, [req.params.id]));
});

app.get('/api/loan-files/:id/docs-list', async (req, res) => {
  const file = await db.get(`SELECT * FROM loan_files WHERE id = ?`, [req.params.id]);
  if (!file) return res.status(404).json({ error: 'Not found' });
  const applicants = await db.all(`SELECT * FROM file_applicants WHERE loan_file_id = ?`, [req.params.id]);
  const bank = file.bank_name || 'Generic';

  const getDocsFor = async (tier) => {
    let rule = await db.all(`
      SELECT document_name FROM doc_checklist_rules
      WHERE bank_name = ? AND loan_category = ? AND document_tier = ? AND applies_to_common = 0
    `, [bank, file.loan_category, tier]);
    if (!rule.length) {
      rule = await db.all(`
        SELECT document_name FROM doc_checklist_rules
        WHERE bank_name = 'Generic' AND loan_category = ? AND document_tier = ? AND applies_to_common = 0
      `, [file.loan_category, tier]);
    }
    return rule.map(r => r.document_name);
  };

  const bankHasCommon = await db.get(`SELECT 1 as x FROM doc_checklist_rules WHERE bank_name = ? AND applies_to_common=1 LIMIT 1`, [bank]);
  const effectiveBank = bankHasCommon ? bank : 'Generic';
  const commonRows = await db.all(`
    SELECT document_name FROM doc_checklist_rules WHERE loan_category = ? AND applies_to_common = 1 AND bank_name = ?
  `, [file.loan_category, effectiveBank]);
  const common = commonRows.map(r => r.document_name);

  const applicantsWithDocs = [];
  for (const a of applicants) {
    applicantsWithDocs.push({ ...a, documents: await getDocsFor(a.document_tier) });
  }

  res.json({ bank, loan_category: file.loan_category, applicants: applicantsWithDocs, common_documents: common });
});

app.get('/api/loan-files/:id/banker-summary', async (req, res) => {
  const file = await db.get(`
    SELECT lf.*, c.name as lead_name, c.location, c.cibil_score, c.profile_type, c.profile_detail
    FROM loan_files lf JOIN contacts c ON c.id = lf.lead_contact_id WHERE lf.id = ?
  `, [req.params.id]);
  if (!file) return res.status(404).json({ error: 'Not found' });

  const flags = [];
  if (file.cibil_score && file.cibil_score < 700) flags.push({ type: 'rule', text: `CIBIL ${file.cibil_score} — below 700, may need justification` });
  if (file.loan_amount && file.profile_type) {
    flags.push({ type: 'rule', text: `Verify income-to-loan ratio before banker discussion` });
  }
  const manualNotes = await db.all(`SELECT description FROM queries WHERE loan_file_id = ? AND status='Open'`, [req.params.id]);
  manualNotes.forEach(q => flags.push({ type: 'manual', text: q.description }));

  res.json({ file, flags });
});

// ---------- FOLLOW-UPS ----------
app.get('/api/follow-ups', async (req, res) => {
  const { status } = req.query;
  res.json(status
    ? await db.all(`SELECT * FROM follow_ups WHERE status = ? ORDER BY due_date`, [status])
    : await db.all(`SELECT * FROM follow_ups ORDER BY due_date`));
});
app.post('/api/follow-ups', async (req, res) => {
  const f = req.body;
  const info = await db.run(`
    INSERT INTO follow_ups (loan_file_id, lead_contact_id, party_type, method, due_date, status, notes)
    VALUES (?,?,?,?,?,?,?)
  `, [f.loan_file_id || null, f.lead_contact_id || null, f.party_type, f.method, f.due_date, f.status || 'Pending', f.notes || null]);
  res.json(await db.get(`SELECT * FROM follow_ups WHERE id = ?`, [info.lastInsertRowid]));
});
app.put('/api/follow-ups/:id', async (req, res) => {
  await db.run(`UPDATE follow_ups SET status = ? WHERE id = ?`, [req.body.status, req.params.id]);
  res.json(await db.get(`SELECT * FROM follow_ups WHERE id = ?`, [req.params.id]));
});

// ---------- QUERIES ----------
app.post('/api/queries', async (req, res) => {
  const q = req.body;
  const info = await db.run(`
    INSERT INTO queries (loan_file_id, raised_by, priority, description, status)
    VALUES (?,?,?,?,?)
  `, [q.loan_file_id, q.raised_by, q.priority, q.description, q.status || 'Open']);
  res.json(await db.get(`SELECT * FROM queries WHERE id = ?`, [info.lastInsertRowid]));
});
app.put('/api/queries/:id', async (req, res) => {
  const resolvedAt = ['Closed', 'Rejected', 'Sanctioned', 'Disbursed'].includes(req.body.status) ? new Date().toISOString() : null;
  const existing = await db.get(`SELECT resolved_at FROM queries WHERE id = ?`, [req.params.id]);
  await db.run(`UPDATE queries SET status = ?, resolved_at = ? WHERE id = ?`,
    [req.body.status, resolvedAt || existing.resolved_at, req.params.id]);
  res.json(await db.get(`SELECT * FROM queries WHERE id = ?`, [req.params.id]));
});

// ---------- COMMUNICATION LOG ----------
app.post('/api/communication-log', async (req, res) => {
  const c = req.body;
  const info = await db.run(`
    INSERT INTO communication_log (loan_file_id, party_type, mode, log_date, content)
    VALUES (?,?,?,?,?)
  `, [c.loan_file_id, c.party_type, c.mode, c.log_date, c.content]);
  res.json(await db.get(`SELECT * FROM communication_log WHERE id = ?`, [info.lastInsertRowid]));
});

// ---------- DASHBOARD ----------
app.get('/api/dashboard', async (req, res) => {
  const openLeads = (await db.get(`SELECT COUNT(*) c FROM contacts WHERE role='lead' AND qualification_status IN ('Valid','Eligible')`)).c;
  const activeFiles = (await db.get(`SELECT COUNT(*) c FROM loan_files WHERE current_stage NOT IN ('Disbursed')`)).c;
  const overdueFollowUps = (await db.get(`SELECT COUNT(*) c FROM follow_ups WHERE status='Pending' AND due_date < date('now')`)).c;
  const todayFollowUps = await db.all(`SELECT * FROM follow_ups WHERE status='Pending' AND due_date = date('now')`);
  const openQueries = await db.all(`SELECT * FROM queries WHERE status='Open' ORDER BY priority`);
  const pipeline = await db.all(`SELECT current_stage, COUNT(*) c FROM loan_files GROUP BY current_stage`);
  res.json({ openLeads, activeFiles, overdueFollowUps, todayFollowUps, openQueries, pipeline });
});

// ---------- REPORTS ----------
app.get('/api/reports/loan-files', async (req, res) => {
  const { category, stage, source, banker, from, to } = req.query;
  let sql = `
    SELECT lf.*, c.name as lead_name, c.mobile as lead_mobile, c.source
    FROM loan_files lf JOIN contacts c ON c.id = lf.lead_contact_id WHERE 1=1
  `;
  const args = [];
  if (category) { sql += ` AND lf.loan_category = ?`; args.push(category); }
  if (stage) { sql += ` AND lf.current_stage = ?`; args.push(stage); }
  if (source) { sql += ` AND c.source = ?`; args.push(source); }
  if (banker) { sql += ` AND lf.bank_name = ?`; args.push(banker); }
  if (from) { sql += ` AND lf.created_at >= ?`; args.push(from); }
  if (to) { sql += ` AND lf.created_at <= ?`; args.push(to); }
  res.json(await db.all(sql, args));
});

// ---------- AUDIT LOG ----------
app.get('/api/audit-log', async (req, res) => {
  const { table_name, record_id } = req.query;
  let sql = `SELECT * FROM audit_log WHERE 1=1`;
  const args = [];
  if (table_name) { sql += ` AND table_name = ?`; args.push(table_name); }
  if (record_id) { sql += ` AND record_id = ?`; args.push(record_id); }
  sql += ` ORDER BY changed_at DESC LIMIT 200`;
  res.json(await db.all(sql, args));
});

// ---------- DOCUMENT CHECKLIST RULES ----------
app.get('/api/doc-checklist-rules', async (req, res) => {
  const { bank_name, loan_category } = req.query;
  let sql = `SELECT * FROM doc_checklist_rules WHERE 1=1`;
  const args = [];
  if (bank_name) { sql += ` AND bank_name = ?`; args.push(bank_name); }
  if (loan_category) { sql += ` AND loan_category = ?`; args.push(loan_category); }
  sql += ` ORDER BY bank_name, loan_category, document_tier`;
  res.json(await db.all(sql, args));
});

app.get('/api/doc-checklist-rules/banks', async (req, res) => {
  const rows = await db.all(`SELECT DISTINCT bank_name FROM doc_checklist_rules ORDER BY bank_name`);
  res.json(rows.map(r => r.bank_name));
});

app.post('/api/doc-checklist-rules', async (req, res) => {
  const r = req.body;
  const info = await db.run(`
    INSERT INTO doc_checklist_rules (bank_name, loan_category, loan_subcategory, document_tier, document_name, applies_to_common)
    VALUES (?,?,?,?,?,?)
  `, [r.bank_name, r.loan_category, r.loan_subcategory || null, r.document_tier, r.document_name, r.applies_to_common ? 1 : 0]);
  res.json(await db.get(`SELECT * FROM doc_checklist_rules WHERE id = ?`, [info.lastInsertRowid]));
});

app.delete('/api/doc-checklist-rules/:id', async (req, res) => {
  await db.run(`DELETE FROM doc_checklist_rules WHERE id = ?`, [req.params.id]);
  res.json({ deleted: true });
});

app.post('/api/doc-checklist-rules/copy-bank', async (req, res) => {
  // Duplicate all "Generic" rules under a new bank name, as a starting point to customize
  const { new_bank_name, from_bank_name } = req.body;
  const source = await db.all(`SELECT * FROM doc_checklist_rules WHERE bank_name = ?`, [from_bank_name || 'Generic']);
  for (const r of source) {
    await db.run(`
      INSERT INTO doc_checklist_rules (bank_name, loan_category, loan_subcategory, document_tier, document_name, applies_to_common)
      VALUES (?,?,?,?,?,?)
    `, [new_bank_name, r.loan_category, r.loan_subcategory, r.document_tier, r.document_name, r.applies_to_common]);
  }
  res.json({ copied: source.length });
});

const PORT = process.env.PORT || 4000;
db.init().then(() => {
  app.listen(PORT, () => console.log(`Loan CRM backend running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
