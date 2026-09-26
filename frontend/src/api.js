const BASE = `${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api`;

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    // Preserve status + parsed error body (e.g. { error: 'duplicate', message, existing })
    // so callers can distinguish a 409 duplicate from any other failure and show the
    // server's actual message, rather than a generic "API error" string.
    let payload = null;
    try { payload = await res.json(); } catch { /* non-JSON error body, ignore */ }
    const err = new Error(payload?.message || `API error ${res.status} on ${path}`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return res.json();
}

async function findOrCreateConnector(name, mobile) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  const normalized = trimmed.toLowerCase();
  const matches = await req('GET', `/contacts/search?q=${encodeURIComponent(trimmed)}&role=connector`);
  const exact = matches.find(m => (m.name || '').trim().toLowerCase() === normalized);
  if (exact) return exact;
  try {
    return await req('POST', '/contacts', { role: 'connector', name: trimmed, mobile: mobile || null });
  } catch (err) {
    if (err.status === 409 && err.payload?.existing) return err.payload.existing;
    throw err;
  }
}

export const api = {
  findOrCreateConnector,
  searchContacts: (q, role) => req('GET', `/contacts/search?q=${encodeURIComponent(q)}${role ? `&role=${role}` : ''}`),

// Shared helper for the "auto-create a Connector from a typed Referral name" flow
// (New Lead's Reference field, and the Lead card / Lead Detail equivalents). Looks
// for an EXACT (trim + lowercase) name match among existing Connectors first, so a
// second save with the same typed name reuses the same record instead of creating a
// duplicate — this covers the case the server's own duplicate check can't catch,
// since this flow never collects a mobile number for a brand-new connector, and the
// server's duplicate rule requires an overlapping mobile by design (documented
// behavior, not a bug — two genuinely different people can share a name with no
// mobile on file). Falls back to the server's real duplicate check on create, in
// case a mobile happens to be present.
  getContacts: (role) => req('GET', `/contacts${role ? `?role=${role}` : ''}`),
  getContact: (id) => req('GET', `/contacts/${id}`),
  createContact: (data) => req('POST', '/contacts', data),
  updateContact: (id, data) => req('PUT', `/contacts/${id}`, data),
  getConnectorPerformance: (id) => req('GET', `/contacts/${id}/performance`),
  getCampaignNames: () => req('GET', '/contacts/campaign-names'),
  getBankNames: () => req('GET', '/contacts/bank-names'),

  getLoanFiles: () => req('GET', '/loan-files'),
  getLoanFile: (id) => req('GET', `/loan-files/${id}`),
  createLoanFile: (data) => req('POST', '/loan-files', data),
  updateLoanFile: (id, data) => req('PUT', `/loan-files/${id}`, data),

  addApplicant: (fileId, data) => req('POST', `/loan-files/${fileId}/applicants`, data),
  updateApplicant: (id, data) => req('PUT', `/applicants/${id}`, data),
  getDocsList: (fileId) => req('GET', `/loan-files/${fileId}/docs-list`),
  getBankerSummary: (fileId) => req('GET', `/loan-files/${fileId}/banker-summary`),

  getFollowUps: (status) => req('GET', `/follow-ups${status ? `?status=${status}` : ''}`),
  createFollowUp: (data) => req('POST', '/follow-ups', data),
  updateFollowUp: (id, data) => req('PUT', `/follow-ups/${id}`, data),

  createQuery: (data) => req('POST', '/queries', data),
  updateQuery: (id, data) => req('PUT', `/queries/${id}`, data),

  addCommunicationLog: (data) => req('POST', '/communication-log', data),

  getDashboard: (from, to) => req('GET', `/dashboard${from && to ? `?from=${from}&to=${to}` : ''}`),
  getReport: (params) => req('GET', `/reports/loan-files?${new URLSearchParams(params).toString()}`),

  getAuditLog: (params) => req('GET', `/audit-log${params ? `?${new URLSearchParams(params).toString()}` : ''}`),

  getChecklistRules: (params) => req('GET', `/doc-checklist-rules${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  getChecklistBanks: () => req('GET', '/doc-checklist-rules/banks'),
  addChecklistRule: (data) => req('POST', '/doc-checklist-rules', data),
  deleteChecklistRule: (id) => req('DELETE', `/doc-checklist-rules/${id}`),
  copyBankRules: (data) => req('POST', '/doc-checklist-rules/copy-bank', data),

  getEligibilityRules: () => req('GET', '/eligibility-rules'),
  addEligibilityRule: (data) => req('POST', '/eligibility-rules', data),
  updateEligibilityRule: (id, data) => req('PUT', `/eligibility-rules/${id}`, data),
  deleteEligibilityRule: (id) => req('DELETE', `/eligibility-rules/${id}`),

  // Wipes all records and loads fresh sample data. The server refuses unless 'RESET' is sent.
  resetAndSeed: () => req('POST', '/reset-and-seed', { confirm: 'RESET' }),

  search: (q, scope) => req('GET', `/search?q=${encodeURIComponent(q)}${scope ? `&scope=${scope}` : ''}`),
};
