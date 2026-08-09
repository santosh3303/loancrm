import { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';
import ContactActions from '../components/ContactActions';

const emptyForm = {
  lead_date: new Date().toISOString().slice(0, 10),
  name: '', mobile: '', location: '',
  loan_category: 'Home Loan', loan_subcategory: 'Fresh', loan_amount: '',
  source: 'FB Ads', campaign_name: '',
  referred_by_name: '', referred_by_mobile: '', referred_by_contact_id: null,
  priority: 'Medium', qualification_status: 'Valid', additional_info: ''
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [nameMatches, setNameMatches] = useState([]);
  const [refMatches, setRefMatches] = useState([]);
  const [dupWarning, setDupWarning] = useState(null);
  const debounceRef = useRef();

  const load = () => api.getContacts('lead').then(setLeads);
  useEffect(() => { load(); }, []);

  const searchDebounced = (field, value, setResults, role) => {
    clearTimeout(debounceRef.current);
    if (value.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await api.searchContacts(value, role);
      setResults(res);
    }, 300);
  };

  const handleNameChange = (v) => {
    setForm(f => ({ ...f, name: v }));
    searchDebounced('name', v, setNameMatches, 'lead');
  };
  const handleMobileBlur = async () => {
    if (!form.mobile) return;
    const matches = await api.searchContacts(form.mobile, 'lead');
    setDupWarning(matches.length ? matches[0] : null);
  };
  const handleRefChange = (v) => {
    setForm(f => ({ ...f, referred_by_name: v, referred_by_contact_id: null }));
    searchDebounced('ref', v, setRefMatches, 'connector');
  };

  const useNameMatch = (m) => {
    setForm(f => ({ ...f, name: m.name, mobile: m.mobile || f.mobile, location: m.location || f.location }));
    setNameMatches([]);
  };
  const useRefMatch = (m) => {
    setForm(f => ({ ...f, referred_by_name: m.name, referred_by_mobile: m.mobile || '', referred_by_contact_id: m.id }));
    setRefMatches([]);
  };

  const submit = async () => {
    let referredById = form.referred_by_contact_id;
    if (!referredById && form.referred_by_name) {
      const newConnector = await api.createContact({ role: 'connector', name: form.referred_by_name, mobile: form.referred_by_mobile });
      referredById = newConnector.id;
    }
    await api.createContact({
      role: 'lead', name: form.name, mobile: form.mobile, location: form.location,
      lead_date: form.lead_date, qualification_status: form.qualification_status, priority: form.priority,
      source: form.source, campaign_name: form.source === 'FB Ads' ? form.campaign_name : null,
      referred_by_contact_id: referredById, additional_info: form.additional_info,
      loan_category: form.loan_category, loan_subcategory: form.loan_subcategory,
      loan_amount: Number(form.loan_amount) || null
    });
    setForm(emptyForm); setShowForm(false); setDupWarning(null);
    load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-display font-semibold text-navy-700">Leads</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ New Lead</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy-50/40 text-left text-navy-700/70">
            <tr><th className="p-3">Name</th><th>Mobile</th><th>Loan Category</th><th>Status</th><th>Priority</th><th>Source</th><th></th></tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id} className="border-t">
                <td className="p-3"><Link to={`/leads/${l.id}`} className="text-amber-700 hover:underline">{l.name}</Link></td>
                <td>{l.mobile}</td>
                <td>{l.loan_category || '-'}</td>
                <td><span className="px-2 py-0.5 rounded bg-gray-100">{l.qualification_status}</span></td>
                <td>{l.priority}</td>
                <td>{l.source}</td>
                <td><ContactActions mobile={l.mobile} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-card animate-fade-in">
            <h2 className="text-lg font-display font-semibold text-navy-700 mb-4">New Lead</h2>

            <Field label="Lead Date">
              <input type="date" value={form.lead_date} onChange={e => setForm(f => ({ ...f, lead_date: e.target.value }))} className="input" />
            </Field>

            <Field label="Name *">
              <input value={form.name} onChange={e => handleNameChange(e.target.value)} className="input" placeholder="Full name" />
              {nameMatches.length > 0 && (
                <MatchBox matches={nameMatches} onUse={useNameMatch} onDismiss={() => setNameMatches([])} />
              )}
            </Field>

            <Field label="Mobile No. *">
              <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} onBlur={handleMobileBlur} className="input" />
              {dupWarning && (
                <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 mt-1">
                  ⚠ Possible duplicate: {dupWarning.name} ({dupWarning.mobile})
                </div>
              )}
            </Field>

            <Field label="Location"><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="input" /></Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Loan Category">
                <select value={form.loan_category} onChange={e => setForm(f => ({ ...f, loan_category: e.target.value }))} className="input">
                  {['Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Sub-category">
                <select value={form.loan_subcategory} onChange={e => setForm(f => ({ ...f, loan_subcategory: e.target.value }))} className="input">
                  {['Fresh', 'Resell', 'BT', 'BT+TopUp', 'N/A'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Loan Amount (approx)"><input type="number" value={form.loan_amount} onChange={e => setForm(f => ({ ...f, loan_amount: e.target.value }))} className="input" /></Field>

            <Field label="Source">
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input">
                {['FB Ads', 'Referral', 'Direct'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>

            {form.source === 'FB Ads' && (
              <Field label="Campaign / Ad Name"><input value={form.campaign_name} onChange={e => setForm(f => ({ ...f, campaign_name: e.target.value }))} className="input" /></Field>
            )}

            <Field label="Source/Reference Name">
              <input value={form.referred_by_name} onChange={e => handleRefChange(e.target.value)} className="input" />
              {refMatches.length > 0 && <MatchBox matches={refMatches} onUse={useRefMatch} onDismiss={() => setRefMatches([])} />}
            </Field>
            <Field label="Source/Reference Mobile">
              <input value={form.referred_by_mobile} onChange={e => setForm(f => ({ ...f, referred_by_mobile: e.target.value }))} className="input" />
            </Field>

            <Field label="Priority">
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input">
                {['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Qualification Status">
              <select value={form.qualification_status} onChange={e => setForm(f => ({ ...f, qualification_status: e.target.value }))} className="input">
                {['Valid', 'Eligible', 'Not Eligible', 'No Response', 'Invalid'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Additional Info">
              <textarea value={form.additional_info} onChange={e => setForm(f => ({ ...f, additional_info: e.target.value }))} className="input" />
            </Field>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={submit} className="btn-primary">Save Lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">{label}</label>{children}</div>;
}

function MatchBox({ matches, onUse, onDismiss }) {
  return (
    <div className="border border-blue-200 bg-blue-50 rounded p-2 mt-1 text-xs space-y-1">
      {matches.map(m => (
        <div key={m.id} className="flex justify-between items-center">
          <span>{m.name} — {m.mobile || 'no number'} {m.location ? `— ${m.location}` : ''}</span>
          <button onClick={() => onUse(m)} className="text-amber-700 underline">Use this</button>
        </div>
      ))}
      <button onClick={onDismiss} className="text-gray-500">Different person, ignore</button>
    </div>
  );
}
