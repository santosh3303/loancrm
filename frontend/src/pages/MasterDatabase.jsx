import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ContactActions from '../components/ContactActions';
import { useToast } from '../components/Toast';

const AVATAR_COLORS = ['#1c3252', '#e8896f', '#8fae8b', '#e0a13a', '#2f4d75'];
const colorFor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export default function MasterDatabase() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'leads';

  const setTab = (t) => { searchParams.set('tab', t); setSearchParams(searchParams); };

  return (
    <div className="p-4 pb-6 animate-fade-in">
      <h1 className="font-display text-xl font-bold text-navy-900 mb-4">Master Database</h1>
      <div className="flex gap-2 mb-4">
        {['leads', 'files', 'contacts'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-[12.5px] font-semibold shadow-soft transition-colors ${tab === t ? 'bg-amber-500 text-white' : 'bg-white text-navy-500'}`}>
            {t === 'leads' ? 'Leads' : t === 'files' ? 'Loan Files' : 'Contacts'}
          </button>
        ))}
      </div>

      {tab === 'leads' && <LeadsPanel />}
      {tab === 'files' && <FilesPanel />}
      {tab === 'contacts' && <ContactsPanel />}
    </div>
  );
}

// ---------------- LEADS ----------------
function LeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const load = () => api.getContacts('lead').then(setLeads);
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (searchParams.get('new') === 'lead') { setShowForm(true); searchParams.delete('new'); setSearchParams(searchParams, { replace: true }); }
  }, [searchParams]);

  return (
    <>
      <div className="flex justify-end mb-3">
        <button onClick={() => setShowForm(true)} className="btn-primary text-[12.5px]">+ New Lead</button>
      </div>
      <div className="space-y-2.5">
        {leads.map(l => (
          <Link key={l.id} to={`/leads/${l.id}`} className="card flex items-center gap-3 p-3.5 active:scale-[0.98] transition-transform">
            <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: colorFor(l.id) }}>
              {l.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-navy-900">{l.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{l.mobile} · {l.qualification_status}</div>
            </div>
            <span className="text-gray-300 text-lg">›</span>
          </Link>
        ))}
        {leads.length === 0 && <p className="text-center text-gray-300 text-sm py-10">No leads yet</p>}
      </div>
      {showForm && <NewLeadModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); toast('Lead added.', 'success'); load(); }} />}
    </>
  );
}

const emptyLeadForm = {
  lead_date: new Date().toISOString().slice(0, 10), name: '', mobile: '', location: '',
  loan_category: 'Home Loan', loan_subcategory: 'Fresh', loan_amount: '',
  source: 'FB Ads', campaign_name: '', referred_by_name: '', referred_by_mobile: '', referred_by_contact_id: null,
  priority: 'Medium', qualification_status: 'Valid', additional_info: ''
};

function NewLeadModal({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyLeadForm);
  const [nameMatches, setNameMatches] = useState([]);
  const [refMatches, setRefMatches] = useState([]);
  const [dupWarning, setDupWarning] = useState(null);
  const debounceRef = useRef();

  const searchDebounced = (value, setResults, role) => {
    clearTimeout(debounceRef.current);
    if (value.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => setResults(await api.searchContacts(value, role)), 300);
  };
  const handleNameChange = (v) => { setForm(f => ({ ...f, name: v })); searchDebounced(v, setNameMatches, 'lead'); };
  const handleMobileBlur = async () => {
    if (!form.mobile) return;
    const matches = await api.searchContacts(form.mobile, 'lead');
    setDupWarning(matches.length ? matches[0] : null);
  };
  const handleRefChange = (v) => { setForm(f => ({ ...f, referred_by_name: v, referred_by_contact_id: null })); searchDebounced(v, setRefMatches, 'connector'); };

  const submit = async () => {
    let referredById = form.referred_by_contact_id;
    if (!referredById && form.referred_by_name) {
      const nc = await api.createContact({ role: 'connector', name: form.referred_by_name, mobile: form.referred_by_mobile });
      referredById = nc.id;
    }
    await api.createContact({
      role: 'lead', name: form.name, mobile: form.mobile, location: form.location,
      lead_date: form.lead_date, qualification_status: form.qualification_status, priority: form.priority,
      source: form.source, campaign_name: form.source === 'FB Ads' ? form.campaign_name : null,
      referred_by_contact_id: referredById, additional_info: form.additional_info,
      loan_category: form.loan_category, loan_subcategory: form.loan_subcategory, loan_amount: Number(form.loan_amount) || null
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4 shadow-card animate-fade-in">
        <h3 className="font-display font-semibold text-navy-900 mb-4">New Lead</h3>
        <Field label="Name *">
          <input value={form.name} onChange={e => handleNameChange(e.target.value)} className="input" />
          {nameMatches.length > 0 && <MatchBox matches={nameMatches} onUse={(m) => { setForm(f => ({ ...f, name: m.name, mobile: m.mobile || f.mobile })); setNameMatches([]); }} onDismiss={() => setNameMatches([])} />}
        </Field>
        <Field label="Mobile *">
          <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} onBlur={handleMobileBlur} className="input" />
          {dupWarning && <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2 mt-1">⚠ Possible duplicate: {dupWarning.name} ({dupWarning.mobile})</div>}
        </Field>
        <Field label="Location"><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="input" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Loan Category">
            <select value={form.loan_category} onChange={e => setForm(f => ({ ...f, loan_category: e.target.value }))} className="input">
              {['Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount"><input type="number" value={form.loan_amount} onChange={e => setForm(f => ({ ...f, loan_amount: e.target.value }))} className="input" /></Field>
        </div>
        <Field label="Source">
          <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input">
            {['FB Ads', 'Referral', 'Direct'].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Reference Name">
          <input value={form.referred_by_name} onChange={e => handleRefChange(e.target.value)} className="input" />
          {refMatches.length > 0 && <MatchBox matches={refMatches} onUse={(m) => { setForm(f => ({ ...f, referred_by_name: m.name, referred_by_mobile: m.mobile || '', referred_by_contact_id: m.id })); setRefMatches([]); }} onDismiss={() => setRefMatches([])} />}
        </Field>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} className="btn-primary">Save Lead</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- LOAN FILES ----------------
function FilesPanel() {
  const [files, setFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const load = () => api.getLoanFiles().then(setFiles);
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (searchParams.get('new') === 'file') { setShowForm(true); searchParams.delete('new'); setSearchParams(searchParams, { replace: true }); }
  }, [searchParams]);

  return (
    <>
      <div className="flex justify-end mb-3">
        <button onClick={() => setShowForm(true)} className="btn-primary text-[12.5px]">+ New Loan File</button>
      </div>
      <div className="space-y-2.5">
        {files.map(f => (
          <Link key={f.id} to={`/loan-files/${f.id}`} className="card flex items-center gap-3 p-3.5 active:scale-[0.98] transition-transform">
            <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: colorFor(f.id + 2) }}>
              {f.lead_name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-navy-900">{f.lead_name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{f.loan_category} · {f.bank_name || 'Generic'}</div>
            </div>
            <span className="stage-pill">{f.current_stage}</span>
            <span className="text-gray-300 text-lg">›</span>
          </Link>
        ))}
        {files.length === 0 && <p className="text-center text-gray-300 text-sm py-10">No loan files yet</p>}
      </div>
      {showForm && <NewFileModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); toast('Loan file created.', 'success'); load(); }} />}
    </>
  );
}

function NewFileModal({ onClose, onSaved }) {
  const [leadQuery, setLeadQuery] = useState('');
  const [leadMatches, setLeadMatches] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [bankers, setBankers] = useState([]);
  const [form, setForm] = useState({ loan_category: 'Home Loan', loan_subcategory: 'Fresh', loan_amount: '', bank_name: '', banker_contact_id: '', property_category: '', property_type: '' });
  const debounceRef = useRef();
  const toast = useToast();

  useEffect(() => { api.getContacts('banker').then(setBankers); }, []);

  const handleLeadSearch = (v) => {
    setLeadQuery(v); setSelectedLead(null);
    clearTimeout(debounceRef.current);
    if (v.length < 2) { setLeadMatches([]); return; }
    debounceRef.current = setTimeout(async () => setLeadMatches(await api.searchContacts(v, 'lead')), 300);
  };

  const submit = async () => {
    if (!selectedLead) { toast('Please select an existing lead first.', 'error'); return; }
    await api.createLoanFile({ lead_contact_id: selectedLead.id, ...form, banker_contact_id: form.banker_contact_id || null, loan_amount: Number(form.loan_amount) || null });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl p-5 w-full max-w-lg mx-4 shadow-card animate-fade-in">
        <h3 className="font-display font-semibold text-navy-900 mb-4">New Loan File</h3>
        <Field label="Lead *">
          <input value={leadQuery} onChange={e => handleLeadSearch(e.target.value)} className="input" placeholder="Search existing lead" />
          {selectedLead && <div className="text-xs text-amber-700 mt-1">Selected: {selectedLead.name}</div>}
          {leadMatches.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-2 mt-1 text-xs space-y-1">
              {leadMatches.map(m => (
                <div key={m.id} className="flex justify-between">
                  <span>{m.name} — {m.mobile}</span>
                  <button onClick={() => { setSelectedLead(m); setLeadQuery(m.name); setLeadMatches([]); }} className="text-amber-700 underline">Select</button>
                </div>
              ))}
            </div>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select value={form.loan_category} onChange={e => setForm(f => ({ ...f, loan_category: e.target.value }))} className="input">
              {['Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount"><input type="number" value={form.loan_amount} onChange={e => setForm(f => ({ ...f, loan_amount: e.target.value }))} className="input" /></Field>
        </div>
        <Field label="Bank Name"><input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} className="input" placeholder="Leave blank for Generic" /></Field>
        <Field label="Banker Contact">
          <select value={form.banker_contact_id} onChange={e => setForm(f => ({ ...f, banker_contact_id: e.target.value }))} className="input">
            <option value="">-- none --</option>
            {bankers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} className="btn-primary">Create File</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- CONTACTS ----------------
function ContactsPanel() {
  const [role, setRole] = useState('connector');
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '' });
  const [perf, setPerf] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const load = () => api.getContacts(role).then(setContacts);
  useEffect(() => { load(); setPerf(null); }, [role]);
  useEffect(() => {
    if (searchParams.get('new') === 'contact') { setShowForm(true); searchParams.delete('new'); setSearchParams(searchParams, { replace: true }); }
  }, [searchParams]);

  const submit = async () => {
    await api.createContact({ role, ...form });
    setForm({ name: '', mobile: '' }); setShowForm(false);
    toast(`${role === 'connector' ? 'Connector' : 'Banker'} added.`, 'success');
    load();
  };
  const viewPerf = async (id) => setPerf(await api.getConnectorPerformance(id));

  return (
    <>
      <div className="flex justify-between mb-3">
        <div className="flex gap-2">
          <button onClick={() => setRole('connector')} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold ${role === 'connector' ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>Connectors</button>
          <button onClick={() => setRole('banker')} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold ${role === 'banker' ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>Bankers</button>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-[12.5px]">+ New</button>
      </div>
      <div className="space-y-2.5">
        {contacts.map(c => (
          <div key={c.id} className="card flex items-center gap-3 p-3.5">
            <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: colorFor(c.id + 4) }}>
              {c.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-navy-900">{c.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{c.mobile}</div>
            </div>
            <ContactActions mobile={c.mobile} />
            {role === 'connector' && <button onClick={() => viewPerf(c.id)} className="text-[11px] text-amber-600 font-semibold ml-1">Stats</button>}
          </div>
        ))}
        {contacts.length === 0 && <p className="text-center text-gray-300 text-sm py-10">No {role}s yet</p>}
      </div>

      {perf && (
        <div className="card p-4 mt-4">
          <h3 className="font-display font-semibold text-navy-900 mb-3">Connector Performance</h3>
          <div className="grid grid-cols-4 gap-3 mb-3 text-center">
            <div><div className="text-lg font-bold text-navy-900">{perf.leads_referred}</div><div className="text-[9.5px] text-gray-400">REFERRED</div></div>
            <div><div className="text-lg font-bold text-navy-900">{perf.converted_to_file}</div><div className="text-[9.5px] text-gray-400">CONVERTED</div></div>
            <div><div className="text-lg font-bold text-navy-900">{perf.disbursed}</div><div className="text-[9.5px] text-gray-400">DISBURSED</div></div>
            <div><div className="text-lg font-bold text-navy-900">{perf.conversion_rate}%</div><div className="text-[9.5px] text-gray-400">RATE</div></div>
          </div>
          <div className="text-xs text-gray-400">Commission Earned: ₹{Number(perf.total_commission_earned).toLocaleString('en-IN')}</div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm mx-4 shadow-card animate-fade-in">
            <h3 className="font-display font-semibold text-navy-900 mb-4">New {role === 'connector' ? 'Connector' : 'Banker'}</h3>
            <Field label="Name"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" /></Field>
            <Field label="Mobile"><input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="input" /></Field>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={submit} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }) {
  return <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">{label}</label>{children}</div>;
}
function MatchBox({ matches, onUse, onDismiss }) {
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-2 mt-1 text-xs space-y-1">
      {matches.map(m => (
        <div key={m.id} className="flex justify-between items-center">
          <span>{m.name} — {m.mobile || 'no number'}</span>
          <button onClick={() => onUse(m)} className="text-amber-700 underline">Use this</button>
        </div>
      ))}
      <button onClick={onDismiss} className="text-gray-400">Different person, ignore</button>
    </div>
  );
}
