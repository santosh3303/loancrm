import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ContactActions from '../components/ContactActions';
import RupeeInput from '../components/RupeeInput';
import Accordion from '../components/Accordion';
import { useToast } from '../components/Toast';
import { formatDateDisplay } from '../utils/taskDisplay';

const AVATAR_COLORS = ['#1c3252', '#e8896f', '#8fae8b', '#e0a13a', '#2f4d75'];
const colorFor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];
const LOAN_CATEGORIES = ['Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'];
const categoryLabel = (c) => (c === 'Others' ? 'Other Loan' : c);
// Priority label shown only for High/Medium — mirrors how a Task's priority_tag only
// ever shows a badge when notably flagged, never for the unremarkable default state.
// This is a judgment call (Low is deliberately left unflagged); easy to change.
const PRIORITY_BADGE_COLOR = { High: '#8b1e1e', Medium: '#d19a1a' };

// Duplicate errors surface the server's own message (via err.payload from api.js's
// req() helper) so the UI never has to re-derive or guess at duplicate logic itself —
// the backend is the single source of truth for what counts as a duplicate.
function DupBlock({ message }) {
  if (!message) return null;
  return <div className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg p-2 mt-2 font-medium">⛔ {message}</div>;
}

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
// Note: the "+ New Lead" button that used to live here has been removed — the FAB
// (Speed Dial) is now the only entry point, consistent with Loan Files and Contacts.
function LeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [fileFormLead, setFileFormLead] = useState(null); // set by "Save & Create Loan Files" to chain into NewFileModal
  const [expandedId, setExpandedId] = useState(null); // only one Lead card open at a time, across the whole list
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const load = () => api.getContacts('lead').then(setLeads);
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (searchParams.get('new') === 'lead') {
      const pre = {};
      ['prefillName', 'prefillMobile', 'prefillMobile2', 'prefillEmail', 'prefillLocation'].forEach(k => {
        if (searchParams.get(k)) pre[k.replace('prefill', '').replace(/^./, c => c.toLowerCase())] = searchParams.get(k);
      });
      setPrefill(Object.keys(pre).length ? pre : null);
      setShowForm(true);
      ['new', 'prefillName', 'prefillMobile', 'prefillMobile2', 'prefillEmail', 'prefillLocation'].forEach(k => searchParams.delete(k));
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  return (
    <>
      <div className="space-y-2.5">
        {leads.map(l => (
          <LeadCard key={l.id} lead={l} expanded={expandedId === l.id}
            onToggle={() => setExpandedId(id => id === l.id ? null : l.id)}
            onChanged={load} />
        ))}
        {leads.length === 0 && <p className="text-center text-gray-300 text-sm py-10">No leads yet</p>}
      </div>
      {showForm && (
        <NewLeadModal
          initialPrefill={prefill}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); toast('Lead added.', 'success'); load(); }}
          onSavedAndCreateFile={(lead) => { setShowForm(false); toast('Lead added.', 'success'); load(); setFileFormLead(lead); }}
        />
      )}
      {fileFormLead && (
        <NewFileModal
          initialLead={fileFormLead}
          onClose={() => setFileFormLead(null)}
          onSaved={() => { setFileFormLead(null); toast('Loan file created.', 'success'); }}
        />
      )}
    </>
  );
}

// Looks up a connector's display name for an existing referred_by_contact_id, so the
// Reference field can show it immediately rather than a blank input.
function useConnectorName(id) {
  const [name, setName] = useState('');
  useEffect(() => {
    if (id) api.getContact(id).then(c => setName(c.name)).catch(() => {});
    else setName('');
  }, [id]);
  return name;
}

function LeadCard({ lead, expanded, onToggle, onChanged }) {
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState(null);
  const [followUps, setFollowUps] = useState(null);
  const [dynamicMatches, setDynamicMatches] = useState([]);
  const [campaignNames, setCampaignNames] = useState([]);
  const [detailsDup, setDetailsDup] = useState(null);
  const [qualDup, setQualDup] = useState(null);
  const dynDebounceRef = useRef();
  const toast = useToast();
  const referredName = useConnectorName(lead.referred_by_contact_id);

  useEffect(() => {
    if (expanded && !form) {
      setForm({
        name: lead.name, mobile: lead.mobile || '', mobile_2: lead.mobile_2 || '', email: lead.email || '',
        location: lead.location || '', loan_category: lead.loan_category || 'Home Loan',
        property_usage: lead.property_usage || 'Residential', loan_amount: lead.loan_amount || '',
        source: lead.source || 'FB Ads', campaign_name: lead.campaign_name || '',
        additional_info: lead.additional_info || '',
        referred_by_contact_id: lead.referred_by_contact_id || null, referred_by_name: '',
        qualification_status: lead.qualification_status || 'Valid', priority: lead.priority || 'Medium',
      });
    }
    if (expanded && tab === 'followups' && followUps === null) {
      api.getFollowUps().then(all => setFollowUps(all.filter(f => f.lead_contact_id === lead.id)));
    }
  }, [expanded, tab]);

  // Fill in the looked-up connector name once, without clobbering further edits.
  useEffect(() => {
    if (form && form.source === 'Referral' && !form.referred_by_name && referredName) {
      setForm(f => ({ ...f, referred_by_name: referredName }));
    }
  }, [referredName, form?.source]);

  useEffect(() => {
    if (form?.source === 'FB Ads') api.getCampaignNames().then(setCampaignNames);
  }, [form?.source]);

  if (!expanded) {
    const badgeColor = PRIORITY_BADGE_COLOR[lead.priority];
    return (
      <div onClick={onToggle} className="card flex items-center gap-3 p-3.5 active:scale-[0.98] transition-transform cursor-pointer">
        <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: colorFor(lead.id) }}>
          {lead.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold text-navy-900">{lead.name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{lead.mobile} · {lead.qualification_status}</div>
        </div>
        {badgeColor && <span className="text-[10px] font-bold shrink-0" style={{ color: badgeColor }}>{lead.priority}</span>}
        <span className="text-gray-300 text-lg">›</span>
      </div>
    );
  }

  if (!form) return <div className="card p-3.5 text-gray-400 text-sm">Loading...</div>;

  const isHomeOrMortgage = form.loan_category === 'Home Loan' || form.loan_category === 'Mortgage Loan';
  const dynamicLabel = form.source === 'FB Ads' ? 'Campaign Name' : form.source === 'Referral' ? 'Reference Name' : 'Source Details';
  const dynamicValue = form.source === 'FB Ads' ? form.campaign_name : form.source === 'Referral' ? form.referred_by_name : form.additional_info;

  const handleDynamicChange = (v) => {
    if (form.source === 'FB Ads') {
      setForm(f => ({ ...f, campaign_name: v }));
      setDynamicMatches(v.length < 1 ? campaignNames : campaignNames.filter(n => n.toLowerCase().includes(v.toLowerCase())));
    } else if (form.source === 'Referral') {
      setForm(f => ({ ...f, referred_by_name: v, referred_by_contact_id: null }));
      clearTimeout(dynDebounceRef.current);
      if (v.length < 2) { setDynamicMatches([]); return; }
      dynDebounceRef.current = setTimeout(async () => setDynamicMatches(await api.searchContacts(v, 'connector')), 300);
    } else {
      setForm(f => ({ ...f, additional_info: v }));
    }
  };
  const applyConnectorMatch = (m) => {
    setForm(f => ({ ...f, referred_by_name: m.name, referred_by_contact_id: m.id }));
    setDynamicMatches([]);
  };
  const applyCampaignMatch = (name) => {
    setForm(f => ({ ...f, campaign_name: name }));
    setDynamicMatches([]);
  };
  const handleSourceChange = (src) => {
    setForm(f => ({ ...f, source: src, campaign_name: '', additional_info: '', referred_by_name: '', referred_by_contact_id: null }));
    setDynamicMatches([]);
  };

  const saveDetails = async () => {
    setDetailsDup(null);
    let referredById = form.referred_by_contact_id;
    if (form.source === 'Referral' && !referredById && form.referred_by_name) {
      try {
        const nc = await api.createContact({ role: 'connector', name: form.referred_by_name, mobile: '' });
        referredById = nc.id;
      } catch (err) {
        if (err.status === 409 && err.payload?.existing) referredById = err.payload.existing.id; // auto-resolve to the existing connector
        else { setDetailsDup(err.message); return; }
      }
    }
    try {
      await api.updateContact(lead.id, {
        name: form.name, mobile: form.mobile, mobile_2: form.mobile_2 || null, email: form.email || null,
        location: form.location, loan_category: form.loan_category,
        property_usage: isHomeOrMortgage ? form.property_usage : null, loan_amount: Number(form.loan_amount) || null,
        source: form.source, campaign_name: form.source === 'FB Ads' ? form.campaign_name : null,
        referred_by_contact_id: form.source === 'Referral' ? referredById : null,
        additional_info: form.source === 'Direct' ? form.additional_info : null,
      });
      toast('Lead details saved.', 'success');
      onChanged();
    } catch (err) {
      if (err.status === 409) setDetailsDup(err.message);
      else throw err;
    }
  };

  const saveQualification = async () => {
    setQualDup(null);
    try {
      await api.updateContact(lead.id, { qualification_status: form.qualification_status, priority: form.priority });
      toast('Qualification saved.', 'success');
      onChanged();
    } catch (err) {
      if (err.status === 409) setQualDup(err.message);
      else throw err;
    }
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div onClick={onToggle} className="flex items-center gap-3 p-3.5 cursor-pointer">
        <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: colorFor(lead.id) }}>
          {lead.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold text-navy-900">{lead.name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{lead.mobile} · {lead.qualification_status}</div>
        </div>
        <span className="text-gray-300 text-lg">⌄</span>
      </div>
      <div className="border-t border-gray-100 px-3.5 pb-3.5 pt-2">
        <div className="flex gap-1 border-b border-gray-100 mb-3 text-xs">
          <button onClick={() => setTab('details')} className={`px-2.5 py-2 font-semibold ${tab === 'details' ? 'text-navy-700 border-b-2 border-amber-500' : 'text-gray-400'}`}>Details</button>
          <button onClick={() => setTab('qualification')} className={`px-2.5 py-2 font-semibold ${tab === 'qualification' ? 'text-navy-700 border-b-2 border-amber-500' : 'text-gray-400'}`}>Qualification</button>
          <button onClick={() => setTab('followups')} className={`px-2.5 py-2 font-semibold ${tab === 'followups' ? 'text-navy-700 border-b-2 border-amber-500' : 'text-gray-400'}`}>Follow-ups</button>
        </div>
        {tab === 'details' && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" /></Field>
              <Field label="Mobile"><input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="input" /></Field>
              <Field label="Mobile 2"><input value={form.mobile_2} onChange={e => setForm(f => ({ ...f, mobile_2: e.target.value }))} className="input" /></Field>
              <Field label="Email"><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" /></Field>
            </div>
            <Field label="Location"><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="input" /></Field>
            <div className={isHomeOrMortgage ? 'grid grid-cols-2 gap-3' : ''}>
              <Field label="Loan Category">
                <select value={form.loan_category} onChange={e => setForm(f => ({ ...f, loan_category: e.target.value }))} className="input">
                  {LOAN_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                </select>
              </Field>
              {isHomeOrMortgage && (
                <Field label="Sub-Category">
                  <select value={form.property_usage} onChange={e => setForm(f => ({ ...f, property_usage: e.target.value }))} className="input">
                    <option>Residential</option><option>Commercial</option>
                  </select>
                </Field>
              )}
            </div>
            <Field label="Amount"><RupeeInput value={form.loan_amount} onChange={v => setForm(f => ({ ...f, loan_amount: v }))} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Source">
                <select value={form.source} onChange={e => handleSourceChange(e.target.value)} className="input">
                  {['FB Ads', 'Referral', 'Direct'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label={dynamicLabel}>
                <input value={dynamicValue} onChange={e => handleDynamicChange(e.target.value)} className="input" />
                {form.source === 'Referral' && dynamicMatches.length > 0 && <MatchBox matches={dynamicMatches} onUse={applyConnectorMatch} onDismiss={() => setDynamicMatches([])} />}
                {form.source === 'FB Ads' && dynamicMatches.length > 0 && (
                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-2 mt-1 text-xs space-y-1">
                    {dynamicMatches.map((name, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{name}</span>
                        <button onClick={() => applyCampaignMatch(name)} className="text-amber-700 underline">Use</button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </div>
            <button onClick={saveDetails} className="btn-primary w-full mt-1">Save Changes</button>
            <DupBlock message={detailsDup} />
          </div>
        )}
        {tab === 'qualification' && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Qualification Status">
                <select value={form.qualification_status} onChange={e => setForm(f => ({ ...f, qualification_status: e.target.value }))} className="input">
                  {['Valid', 'Eligible', 'Not Eligible', 'No Response', 'Invalid'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input">
                  {['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
            </div>
            <button onClick={saveQualification} className="btn-primary w-full mt-1">Save Changes</button>
            <DupBlock message={qualDup} />
          </div>
        )}
        {tab === 'followups' && (
          <div>
            {followUps === null && <p className="text-gray-400 text-sm">Loading...</p>}
            {followUps && followUps.length === 0 && <p className="text-gray-400 text-sm">None yet</p>}
            {followUps && followUps.map(f => (
              <div key={f.id} className="py-1.5 border-b border-gray-50 last:border-0 flex justify-between text-sm">
                <span>{f.party_type} — {f.method} — {formatDateDisplay(f.due_date)} — {f.notes}</span>
                <span className={f.status === 'Pending' ? 'text-orange-600' : 'text-green-600'}>{f.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const emptyLeadForm = {
  name: '', mobile: '', mobile_2: '', email: '', location: '',
  loan_category: 'Home Loan', property_usage: 'Residential',
  loan_amount: '',
  source: 'FB Ads',
  campaign_name: '',
  referred_by_name: '', referred_by_mobile: '', referred_by_contact_id: null,
  additional_info: '',
};

function NewLeadModal({ onClose, onSaved, onSavedAndCreateFile, initialPrefill }) {
  const [form, setForm] = useState(() => ({ ...emptyLeadForm, ...(initialPrefill || {}) }));
  const [openSection, setOpenSection] = useState('contact');
  const [nameMatches, setNameMatches] = useState([]);
  const [dynamicMatches, setDynamicMatches] = useState([]);
  const [campaignNames, setCampaignNames] = useState([]);
  const [dupWarning, setDupWarning] = useState(null);
  const [dupError, setDupError] = useState(null);
  const debounceRef = useRef();
  const dynDebounceRef = useRef();

  const isHomeOrMortgage = form.loan_category === 'Home Loan' || form.loan_category === 'Mortgage Loan';

  useEffect(() => {
    if (form.source === 'FB Ads') api.getCampaignNames().then(setCampaignNames);
  }, [form.source]);
  useEffect(() => { setDynamicMatches([]); }, [form.source]);

  const handleNameChange = (v) => {
    setForm(f => ({ ...f, name: v }));
    clearTimeout(debounceRef.current);
    if (v.length < 2) { setNameMatches([]); return; }
    debounceRef.current = setTimeout(async () => setNameMatches(await api.searchContacts(v, 'lead')), 300);
  };
  const applyNameMatch = (m) => {
    setForm(f => ({
      ...f, name: m.name, mobile: m.mobile || f.mobile, mobile_2: m.mobile_2 || f.mobile_2,
      email: m.email || f.email, location: m.location || f.location,
    }));
    setNameMatches([]);
  };
  const handleMobileBlur = async () => {
    if (!form.mobile) { setDupWarning(null); return; }
    const matches = await api.searchContacts(form.mobile, 'lead');
    setDupWarning(matches.length ? matches[0] : null);
  };

  const dynamicLabel = form.source === 'FB Ads' ? 'Campaign Name' : form.source === 'Referral' ? 'Reference Name' : 'Source Details';
  const dynamicValue = form.source === 'FB Ads' ? form.campaign_name : form.source === 'Referral' ? form.referred_by_name : form.additional_info;
  const dynamicPlaceholder = form.source === 'FB Ads' ? 'e.g. Home Loan August' : form.source === 'Referral' ? 'Search connectors' : 'Optional notes';

  const handleDynamicChange = (v) => {
    if (form.source === 'FB Ads') {
      setForm(f => ({ ...f, campaign_name: v }));
      setDynamicMatches(v.length < 1 ? campaignNames : campaignNames.filter(n => n.toLowerCase().includes(v.toLowerCase())));
    } else if (form.source === 'Referral') {
      setForm(f => ({ ...f, referred_by_name: v, referred_by_contact_id: null }));
      clearTimeout(dynDebounceRef.current);
      if (v.length < 2) { setDynamicMatches([]); return; }
      dynDebounceRef.current = setTimeout(async () => setDynamicMatches(await api.searchContacts(v, 'connector')), 300);
    } else {
      setForm(f => ({ ...f, additional_info: v }));
    }
  };
  const applyConnectorMatch = (m) => {
    setForm(f => ({ ...f, referred_by_name: m.name, referred_by_mobile: m.mobile || '', referred_by_contact_id: m.id }));
    setDynamicMatches([]);
  };
  const applyCampaignMatch = (name) => {
    setForm(f => ({ ...f, campaign_name: name }));
    setDynamicMatches([]);
  };

  const buildPayload = async () => {
    let referredById = form.referred_by_contact_id;
    if (form.source === 'Referral' && !referredById && form.referred_by_name) {
      try {
        const nc = await api.createContact({ role: 'connector', name: form.referred_by_name, mobile: form.referred_by_mobile });
        referredById = nc.id;
      } catch (err) {
        if (err.status === 409 && err.payload?.existing) referredById = err.payload.existing.id;
        else throw err;
      }
    }
    return {
      role: 'lead', name: form.name, mobile: form.mobile, mobile_2: form.mobile_2 || null,
      email: form.email || null, location: form.location,
      lead_date: new Date().toISOString().slice(0, 10), qualification_status: 'Valid', priority: 'Medium',
      source: form.source,
      campaign_name: form.source === 'FB Ads' ? form.campaign_name : null,
      referred_by_contact_id: form.source === 'Referral' ? referredById : null,
      additional_info: form.source === 'Direct' ? form.additional_info : null,
      loan_category: form.loan_category,
      property_usage: isHomeOrMortgage ? form.property_usage : null,
      loan_amount: Number(form.loan_amount) || null
    };
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    setDupError(null);
    try {
      await api.createContact(await buildPayload());
      onSaved();
    } catch (err) {
      if (err.status === 409) setDupError(err.message);
      else throw err;
    }
  };

  const submitAndCreateFile = async () => {
    if (!form.name.trim()) return;
    setDupError(null);
    try {
      const created = await api.createContact(await buildPayload());
      onSavedAndCreateFile(created);
    } catch (err) {
      if (err.status === 409) setDupError(err.message);
      else throw err;
    }
  };

  const sections = [
    {
      key: 'contact', title: '1. Name & Contact', content: (
        <>
          <Field label="Name *">
            <input value={form.name} onChange={e => handleNameChange(e.target.value)} className="input" placeholder="Search existing leads or type new" />
            {nameMatches.length > 0 && <MatchBox matches={nameMatches} onUse={applyNameMatch} onDismiss={() => setNameMatches([])} />}
          </Field>
          <Field label="Mobile *">
            <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} onBlur={handleMobileBlur} className="input" />
            {dupWarning && <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2 mt-1">⚠ Possible duplicate: {dupWarning.name} ({dupWarning.mobile})</div>}
          </Field>
          <Field label="Mobile 2 (optional)"><input value={form.mobile_2} onChange={e => setForm(f => ({ ...f, mobile_2: e.target.value }))} className="input" /></Field>
          <Field label="Email (optional)"><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" /></Field>
          <Field label="Location"><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="input" /></Field>
        </>
      )
    },
    {
      key: 'loan', title: '2. Loan Interest', content: (
        <>
          <div className={isHomeOrMortgage ? 'grid grid-cols-2 gap-3' : ''}>
            <Field label="Loan Category">
              <select value={form.loan_category} onChange={e => setForm(f => ({ ...f, loan_category: e.target.value }))} className="input">
                {LOAN_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
              </select>
            </Field>
            {isHomeOrMortgage && (
              <Field label="Sub-Category">
                <select value={form.property_usage} onChange={e => setForm(f => ({ ...f, property_usage: e.target.value }))} className="input">
                  <option>Residential</option><option>Commercial</option>
                </select>
              </Field>
            )}
          </div>
          <Field label="Amount"><RupeeInput value={form.loan_amount} onChange={v => setForm(f => ({ ...f, loan_amount: v }))} /></Field>
        </>
      )
    },
    {
      key: 'reference', title: '3. Reference', content: (
        <>
          <Field label="Source">
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input">
              {['FB Ads', 'Referral', 'Direct'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label={dynamicLabel}>
            <input value={dynamicValue} onChange={e => handleDynamicChange(e.target.value)} className="input" placeholder={dynamicPlaceholder} />
            {form.source === 'Referral' && dynamicMatches.length > 0 && (
              <MatchBox matches={dynamicMatches} onUse={applyConnectorMatch} onDismiss={() => setDynamicMatches([])} />
            )}
            {form.source === 'FB Ads' && dynamicMatches.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-2 mt-1 text-xs space-y-1">
                {dynamicMatches.map((name, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{name}</span>
                    <button onClick={() => applyCampaignMatch(name)} className="text-amber-700 underline">Use</button>
                  </div>
                ))}
              </div>
            )}
          </Field>
        </>
      )
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4 shadow-card animate-fade-in">
        <h3 className="font-display font-semibold text-navy-900 mb-4">New Lead</h3>
        <Accordion sections={sections} openSection={openSection} onOpenSection={setOpenSection} />
        <div className="flex justify-end flex-wrap gap-1.5 mt-4">
          <button onClick={onClose} className="btn-secondary text-[12.5px] px-3 py-2">Cancel</button>
          <button onClick={submitAndCreateFile} className="text-[12px] font-semibold px-3 py-2 rounded-lg text-white bg-navy-700 hover:bg-navy-900 active:scale-[0.98] transition-all whitespace-nowrap">Save &amp; Create Loan Files</button>
          <button onClick={submit} className="btn-primary text-[12.5px] px-3 py-2">Save Lead</button>
        </div>
        <DupBlock message={dupError} />
      </div>
    </div>
  );
}

// ---------------- LOAN FILES ----------------
// Note: the "+ New Loan File" button that used to live here has been removed — the
// FAB (Speed Dial) is now the only entry point, matching Leads and Contacts.
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

function NewFileModal({ onClose, onSaved, initialLead }) {
  const [leadQuery, setLeadQuery] = useState(initialLead ? initialLead.name : '');
  const [leadMatches, setLeadMatches] = useState([]);
  const [selectedLead, setSelectedLead] = useState(initialLead || null);
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-5 w-full max-w-lg mx-4 shadow-card animate-fade-in">
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
              {LOAN_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </Field>
          <Field label="Amount"><RupeeInput value={form.loan_amount} onChange={v => setForm(f => ({ ...f, loan_amount: v }))} /></Field>
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
// Default view merges Connectors + Bankers into one "All" list, per the decision to
// free up the row that used to hold the role toggle + "+ New" button; a dropdown
// (styled like the app's existing Status/Tag filter dropdowns) narrows it down.
function ContactsPanel() {
  const [contacts, setContacts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterRef = useRef();
  const toast = useToast();

  const load = () => Promise.all([api.getContacts('connector'), api.getContacts('banker')])
    .then(([connectors, bankers]) => {
      const merged = [...connectors, ...bankers].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setContacts(merged);
    });
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (searchParams.get('new') === 'contact') { setShowForm(true); searchParams.delete('new'); setSearchParams(searchParams, { replace: true }); }
  }, [searchParams]);
  useEffect(() => {
    const onDocClick = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const visible = filter === 'all' ? contacts : contacts.filter(c => c.role === filter);
  const FILTER_LABEL = { all: 'All', connector: 'Connectors', banker: 'Bankers' };

  return (
    <>
      <div className="flex justify-end mb-3 relative" ref={filterRef}>
        <button onClick={() => setFilterOpen(o => !o)} className="flex items-center gap-1 bg-navy-50 rounded-xl px-3.5 text-[12.5px] font-bold text-navy-700" style={{ height: 38 }}>
          {FILTER_LABEL[filter]} <span className="text-[9px]">▾</span>
        </button>
        {filterOpen && (
          <div className="absolute bg-white rounded-2xl shadow-card border border-gray-100 p-2 z-40 animate-fade-in" style={{ right: 0, top: 44, width: 150 }}>
            {['all', 'connector', 'banker'].map(f => (
              <div key={f} onClick={() => { setFilter(f); setFilterOpen(false); }}
                className={`px-2.5 py-2 rounded-lg text-[12px] font-bold cursor-pointer ${filter === f ? 'bg-amber-50 text-amber-700' : 'text-navy-700 active:bg-navy-50'}`}>
                {FILTER_LABEL[f]}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2.5">
        {visible.map(c => (
          <ContactCard key={c.id} contact={c} expanded={expandedId === c.id}
            onToggle={() => setExpandedId(id => id === c.id ? null : c.id)}
            onChanged={load} />
        ))}
        {visible.length === 0 && <p className="text-center text-gray-300 text-sm py-10">No contacts yet</p>}
      </div>

      {showForm && (
        <NewContactModal
          onClose={() => setShowForm(false)}
          onSaved={(savedType) => {
            setShowForm(false);
            if (savedType === 'lead') {
              toast('Lead added. Since this was saved as a Lead, you\'ll find it under the Leads tab, not here in Contacts.', 'success');
            } else {
              toast(`${savedType === 'connector' ? 'Connector' : 'Banker'} added.`, 'success');
              load();
            }
          }}
        />
      )}
    </>
  );
}

function ContactCard({ contact, expanded, onToggle, onChanged }) {
  const [form, setForm] = useState(null);
  const [perf, setPerf] = useState(null);
  const [bankMatches, setBankMatches] = useState([]);
  const [bankNames, setBankNames] = useState([]);
  const [dupError, setDupError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (expanded && !form) {
      setForm({
        name: contact.name, mobile: contact.mobile || '', mobile_2: contact.mobile_2 || '',
        email: contact.email || '', location: contact.location || '', bank_name: contact.bank_name || '',
      });
      if (contact.role === 'connector') api.getConnectorPerformance(contact.id).then(setPerf);
      if (contact.role === 'banker') api.getBankNames().then(setBankNames);
    }
  }, [expanded]);

  if (!expanded) {
    return (
      <div onClick={onToggle} className="card flex items-center gap-3 p-3.5 cursor-pointer">
        <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: colorFor(contact.id + 4) }}>
          {contact.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold text-navy-900">{contact.name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{contact.mobile}</div>
        </div>
        <ContactActions mobile={contact.mobile} />
        <span className="text-gray-300 text-lg ml-1">›</span>
      </div>
    );
  }

  if (!form) return <div className="card p-3.5 text-gray-400 text-sm">Loading...</div>;

  const handleBankSearch = (v) => {
    setForm(f => ({ ...f, bank_name: v }));
    setBankMatches(v.length < 1 ? [] : bankNames.filter(b => b.toLowerCase().includes(v.toLowerCase())));
  };

  const save = async () => {
    setDupError(null);
    try {
      await api.updateContact(contact.id, {
        name: form.name, mobile: form.mobile, mobile_2: form.mobile_2 || null,
        email: form.email || null, location: form.location || null,
        bank_name: contact.role === 'banker' ? form.bank_name || null : null,
      });
      toast('Contact saved.', 'success');
      onChanged();
    } catch (err) {
      if (err.status === 409) setDupError(err.message);
      else throw err;
    }
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div onClick={onToggle} className="flex items-center gap-3 p-3.5 cursor-pointer">
        <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: colorFor(contact.id + 4) }}>
          {contact.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold text-navy-900">{contact.name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{contact.mobile}</div>
        </div>
        <ContactActions mobile={contact.mobile} />
        <span className="text-gray-300 text-lg ml-1">⌄</span>
      </div>
      <div className="border-t border-gray-100 px-3.5 pb-3.5 pt-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" /></Field>
          <Field label="Mobile"><input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="input" /></Field>
          <Field label="Mobile 2"><input value={form.mobile_2} onChange={e => setForm(f => ({ ...f, mobile_2: e.target.value }))} className="input" /></Field>
          <Field label="Email"><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" /></Field>
        </div>
        <Field label="Location"><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="input" /></Field>
        {contact.role === 'banker' && (
          <Field label="Bank / NBFC">
            <input value={form.bank_name} onChange={e => handleBankSearch(e.target.value)} className="input" />
            {bankMatches.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-2 mt-1 text-xs space-y-1">
                {bankMatches.map((b, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{b}</span>
                    <button onClick={() => { setForm(f => ({ ...f, bank_name: b })); setBankMatches([]); }} className="text-amber-700 underline">Use</button>
                  </div>
                ))}
              </div>
            )}
          </Field>
        )}
        {contact.role === 'connector' && perf && (
          <div className="card p-3 my-3">
            <h4 className="font-display font-semibold text-navy-900 text-xs mb-2.5">Connector Performance</h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><div className="text-sm font-bold text-navy-900">{perf.leads_referred}</div><div className="text-[8.5px] text-gray-400">REFERRED</div></div>
              <div><div className="text-sm font-bold text-navy-900">{perf.converted_to_file}</div><div className="text-[8.5px] text-gray-400">CONVERTED</div></div>
              <div><div className="text-sm font-bold text-navy-900">{perf.disbursed}</div><div className="text-[8.5px] text-gray-400">DISBURSED</div></div>
              <div><div className="text-sm font-bold text-navy-900">{perf.conversion_rate}%</div><div className="text-[8.5px] text-gray-400">RATE</div></div>
            </div>
          </div>
        )}
        <button onClick={save} className="btn-primary w-full mt-1">Save Changes</button>
        <DupBlock message={dupError} />
      </div>
    </div>
  );
}

function NewContactModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', mobile: '', mobile_2: '', email: '', location: '', type: 'lead', bank_name: '' });
  const [matches, setMatches] = useState([]);
  const [bankMatches, setBankMatches] = useState([]);
  const [bankNames, setBankNames] = useState([]);
  const [dupError, setDupError] = useState(null);
  const debounceRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (form.type === 'banker') api.getBankNames().then(setBankNames);
  }, [form.type]);

  const handleNameChange = (v) => {
    setForm(f => ({ ...f, name: v }));
    clearTimeout(debounceRef.current);
    if (v.length < 2) { setMatches([]); return; }
    debounceRef.current = setTimeout(async () => setMatches(await api.searchContacts(v)), 300);
  };
  const applyMatch = (m) => {
    setForm(f => ({
      ...f, name: m.name, mobile: m.mobile || f.mobile, mobile_2: m.mobile_2 || f.mobile_2,
      email: m.email || f.email, location: m.location || f.location, type: m.role,
      bank_name: m.bank_name || f.bank_name,
    }));
    setMatches([]);
  };
  const handleBankSearch = (v) => {
    setForm(f => ({ ...f, bank_name: v }));
    setBankMatches(v.length < 1 ? [] : bankNames.filter(b => b.toLowerCase().includes(v.toLowerCase())));
  };

  const buildPayload = () => ({
    role: form.type, name: form.name, mobile: form.mobile || null, mobile_2: form.mobile_2 || null,
    email: form.email || null, location: form.location || null,
    bank_name: form.type === 'banker' ? form.bank_name || null : null,
  });

  const submit = async () => {
    if (!form.name.trim()) return;
    setDupError(null);
    try {
      await api.createContact(buildPayload());
      onSaved(form.type);
    } catch (err) {
      if (err.status === 409) setDupError(err.message);
      else throw err;
    }
  };

  const saveAndCreate = async () => {
    if (!form.name.trim()) return;
    setDupError(null);
    try {
      await api.createContact(buildPayload());
    } catch (err) {
      if (err.status === 409) { setDupError(err.message); return; }
      throw err;
    }
    if (form.type === 'lead') {
      const params = new URLSearchParams({
        tab: 'leads', new: 'lead',
        prefillName: form.name, prefillMobile: form.mobile || '', prefillMobile2: form.mobile_2 || '',
        prefillEmail: form.email || '', prefillLocation: form.location || '',
      });
      navigate(`/master-database?${params.toString()}`);
    } else {
      const params = new URLSearchParams({
        new: 'task', prefillNotes: `Follow up with ${form.name}`, prefillParty: form.type === 'banker' ? 'Bank' : 'Source',
      });
      navigate(`/daily-operations?${params.toString()}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-5 w-full max-w-sm mx-4 shadow-card animate-fade-in">
        <h3 className="font-display font-semibold text-navy-900 mb-4">New Contact</h3>
        <Field label="Name">
          <input value={form.name} onChange={e => handleNameChange(e.target.value)} className="input" placeholder="Search all contacts or type new" />
          {matches.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-2 mt-1 text-xs space-y-1">
              {matches.map(m => (
                <div key={m.id} className="flex justify-between items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${TYPE_BADGE_STYLE[m.role]}`}>{m.role}</span>
                  <span className="flex-1">{m.name} — {m.mobile || 'no number'}</span>
                  <button onClick={() => applyMatch(m)} className="text-amber-700 underline shrink-0">Use</button>
                </div>
              ))}
            </div>
          )}
        </Field>
        <Field label="Mobile"><input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="input" /></Field>
        <Field label="Mobile 2 (optional)"><input value={form.mobile_2} onChange={e => setForm(f => ({ ...f, mobile_2: e.target.value }))} className="input" /></Field>
        <Field label="Email (optional)"><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" /></Field>
        <Field label="Location"><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="input" /></Field>
        <Field label="Contact Type">
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input">
            <option value="lead">Lead</option>
            <option value="connector">Connector</option>
            <option value="banker">Banker</option>
          </select>
        </Field>
        {form.type === 'banker' && (
          <Field label="Bank / NBFC">
            <input value={form.bank_name} onChange={e => handleBankSearch(e.target.value)} className="input" placeholder="e.g. HDFC" />
            {bankMatches.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-2 mt-1 text-xs space-y-1">
                {bankMatches.map((b, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{b}</span>
                    <button onClick={() => { setForm(f => ({ ...f, bank_name: b })); setBankMatches([]); }} className="text-amber-700 underline">Use</button>
                  </div>
                ))}
              </div>
            )}
          </Field>
        )}
        <div className="flex justify-end flex-wrap gap-1.5 mt-4">
          <button onClick={onClose} className="btn-secondary text-[12.5px] px-3 py-2">Cancel</button>
          <button onClick={saveAndCreate} className="text-[12px] font-semibold px-3 py-2 rounded-lg text-white bg-navy-700 hover:bg-navy-900 active:scale-[0.98] transition-all whitespace-nowrap">
            Save &amp; Create {form.type === 'lead' ? 'Lead' : 'Task'}
          </button>
          <button onClick={submit} className="btn-primary text-[12.5px] px-3 py-2">Save</button>
        </div>
        <DupBlock message={dupError} />
      </div>
    </div>
  );
}

const TYPE_BADGE_STYLE = {
  lead: 'bg-amber-100 text-amber-700',
  connector: 'bg-green-100 text-green-700',
  banker: 'bg-blue-100 text-blue-700',
};

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
