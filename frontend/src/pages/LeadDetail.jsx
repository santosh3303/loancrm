import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import ContactActions from '../components/ContactActions';
import RupeeInput from '../components/RupeeInput';
import Breadcrumb from '../components/Breadcrumb';
import { useToast } from '../components/Toast';
import { formatDateDisplay } from '../utils/taskDisplay';
import { parseRupeeValue } from '../utils/currency';

const LOAN_CATEGORIES = ['Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'];
const categoryLabel = (c) => (c === 'Others' ? 'Other Loan' : c);

function DupBlock({ message }) {
  if (!message) return null;
  return <div className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg p-2 mt-2 font-medium">⛔ {message}</div>;
}

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [tab, setTab] = useState('details');
  const [dynamicMatches, setDynamicMatches] = useState([]);
  const [campaignNames, setCampaignNames] = useState([]);
  const [referredName, setReferredName] = useState('');
  const [detailsDup, setDetailsDup] = useState(null);
  const [qualDup, setQualDup] = useState(null);
  const dynDebounceRef = useRef();
  const toast = useToast();

  const load = () => {
    api.getContact(id).then(setLead);
    api.getFollowUps().then(all => setFollowUps(all.filter(f => String(f.lead_contact_id) === id)));
  };
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (lead?.source === 'FB Ads') api.getCampaignNames().then(setCampaignNames);
  }, [lead?.source]);

  useEffect(() => {
    if (lead?.referred_by_contact_id) api.getContact(lead.referred_by_contact_id).then(c => setReferredName(c.name)).catch(() => {});
    else setReferredName('');
  }, [lead?.referred_by_contact_id]);

  if (!lead) return <div className="p-6 text-gray-400">Loading...</div>;

  const update = (field, value) => setLead(l => ({ ...l, [field]: value }));
  const isHomeOrMortgage = lead.loan_category === 'Home Loan' || lead.loan_category === 'Mortgage Loan';
  const dynamicLabel = lead.source === 'FB Ads' ? 'Campaign Name' : lead.source === 'Referral' ? 'Reference Name' : 'Source Details';
  const dynamicValue = lead.source === 'FB Ads' ? (lead.campaign_name || '') : lead.source === 'Referral' ? referredName : (lead.additional_info || '');

  const handleDynamicChange = (v) => {
    if (lead.source === 'FB Ads') {
      update('campaign_name', v);
      setDynamicMatches(v.length < 1 ? campaignNames : campaignNames.filter(n => n.toLowerCase().includes(v.toLowerCase())));
    } else if (lead.source === 'Referral') {
      setReferredName(v);
      update('referred_by_contact_id', null);
      clearTimeout(dynDebounceRef.current);
      if (v.length < 2) { setDynamicMatches([]); return; }
      dynDebounceRef.current = setTimeout(async () => setDynamicMatches(await api.searchContacts(v, 'connector')), 300);
    } else {
      update('additional_info', v);
    }
  };
  const applyConnectorMatch = (m) => {
    setReferredName(m.name);
    update('referred_by_contact_id', m.id);
    setDynamicMatches([]);
  };
  const applyCampaignMatch = (name) => {
    update('campaign_name', name);
    setDynamicMatches([]);
  };
  const handleSourceChange = (src) => {
    setLead(l => ({ ...l, source: src, campaign_name: '', additional_info: '', referred_by_contact_id: null }));
    setReferredName('');
    setDynamicMatches([]);
  };

  const saveDetails = async () => {
    setDetailsDup(null);
    let referredById = lead.referred_by_contact_id;
    if (lead.source === 'Referral' && !referredById && referredName) {
      try {
        const nc = await api.createContact({ role: 'connector', name: referredName, mobile: '' });
        referredById = nc.id;
      } catch (err) {
        if (err.status === 409 && err.payload?.existing) referredById = err.payload.existing.id;
        else { setDetailsDup(err.message); return; }
      }
    }
    try {
      await api.updateContact(id, {
        name: lead.name, mobile: lead.mobile, mobile_2: lead.mobile_2 || null, email: lead.email || null,
        location: lead.location,
        loan_category: lead.loan_category,
        property_usage: isHomeOrMortgage ? lead.property_usage : null,
        loan_amount: parseRupeeValue(lead.loan_amount),
        source: lead.source,
        campaign_name: lead.source === 'FB Ads' ? lead.campaign_name : null,
        referred_by_contact_id: lead.source === 'Referral' ? referredById : null,
        additional_info: lead.source === 'Direct' ? lead.additional_info : null,
      });
      toast('Lead details saved.', 'success');
      load();
    } catch (err) {
      if (err.status === 409) setDetailsDup(err.message);
      else throw err;
    }
  };

  const saveQualification = async () => {
    setQualDup(null);
    try {
      await api.updateContact(id, { qualification_status: lead.qualification_status, priority: lead.priority });
      toast('Qualification saved.', 'success');
      load();
    } catch (err) {
      if (err.status === 409) setQualDup(err.message);
      else throw err;
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <Breadcrumb items={[{ label: 'Master Database', to: '/master-database?tab=leads' }, { label: lead.name }]} />
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy-700">{lead.name}</h1>
          <p className="text-sm text-gray-500">{lead.mobile} — {lead.location || 'no location'}</p>
        </div>
        <ContactActions mobile={lead.mobile} />
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 text-sm">
        <button onClick={() => setTab('details')}
          className={`pb-2.5 px-3 transition-colors ${tab === 'details' ? 'border-b-2 border-amber-500 text-navy-700 font-semibold' : 'text-gray-400 hover:text-navy-500'}`}>
          Details
        </button>
        <button onClick={() => setTab('qualification')}
          className={`pb-2.5 px-3 transition-colors ${tab === 'qualification' ? 'border-b-2 border-amber-500 text-navy-700 font-semibold' : 'text-gray-400 hover:text-navy-500'}`}>
          Qualification
        </button>
        <button onClick={() => setTab('followups')}
          className={`pb-2.5 px-3 transition-colors ${tab === 'followups' ? 'border-b-2 border-amber-500 text-navy-700 font-semibold' : 'text-gray-400 hover:text-navy-500'}`}>
          Follow-ups
        </button>
      </div>

      {tab === 'details' && (
        <>
          <div className="card p-4 mb-4 space-y-3 text-sm">
            <h3 className="font-display font-semibold text-navy-700 mb-1">Name &amp; Contact</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><input value={lead.name || ''} onChange={e => update('name', e.target.value)} className="input" /></Field>
              <Field label="Mobile"><input value={lead.mobile || ''} onChange={e => update('mobile', e.target.value)} className="input" /></Field>
              <Field label="Mobile 2"><input value={lead.mobile_2 || ''} onChange={e => update('mobile_2', e.target.value)} className="input" /></Field>
              <Field label="Email"><input value={lead.email || ''} onChange={e => update('email', e.target.value)} className="input" /></Field>
            </div>
            <Field label="Location"><input value={lead.location || ''} onChange={e => update('location', e.target.value)} className="input" /></Field>
          </div>

          <div className="card p-4 mb-4 space-y-3 text-sm">
            <h3 className="font-display font-semibold text-navy-700 mb-1">Loan Interest</h3>
            <div className={isHomeOrMortgage ? 'grid grid-cols-2 gap-3' : ''}>
              <Field label="Loan Category">
                <select value={lead.loan_category || ''} onChange={e => update('loan_category', e.target.value)} className="input">
                  <option value="">-</option>
                  {LOAN_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                </select>
              </Field>
              {isHomeOrMortgage && (
                <Field label="Sub-Category">
                  <select value={lead.property_usage || 'Residential'} onChange={e => update('property_usage', e.target.value)} className="input">
                    <option>Residential</option><option>Commercial</option>
                  </select>
                </Field>
              )}
            </div>
            <Field label="Amount">
              <RupeeInput value={lead.loan_amount} onChange={v => update('loan_amount', v)} />
            </Field>
          </div>

          <div className="card p-4 mb-4 space-y-3 text-sm">
            <h3 className="font-display font-semibold text-navy-700 mb-1">Reference</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Source">
                <select value={lead.source || 'FB Ads'} onChange={e => handleSourceChange(e.target.value)} className="input">
                  {['FB Ads', 'Referral', 'Direct'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label={dynamicLabel}>
                <input value={dynamicValue} onChange={e => handleDynamicChange(e.target.value)} className="input" />
                {lead.source === 'Referral' && dynamicMatches.length > 0 && (
                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-2 mt-1 text-xs space-y-1">
                    {dynamicMatches.map(m => (
                      <div key={m.id} className="flex justify-between items-center">
                        <span>{m.name} — {m.mobile || 'no number'}</span>
                        <button onClick={() => applyConnectorMatch(m)} className="text-amber-700 underline">Use this</button>
                      </div>
                    ))}
                  </div>
                )}
                {lead.source === 'FB Ads' && dynamicMatches.length > 0 && (
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
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={saveDetails} className="btn-primary">Save Changes</button>
          </div>
          <DupBlock message={detailsDup} />
        </>
      )}

      {tab === 'qualification' && (
        <>
          <div className="card p-4 mb-4 space-y-3 text-sm">
            <h3 className="font-display font-semibold text-navy-700 mb-1">Qualification</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Qualification Status">
                <select value={lead.qualification_status || ''} onChange={e => update('qualification_status', e.target.value)} className="input">
                  {['Valid', 'Eligible', 'Not Eligible', 'No Response', 'Invalid'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select value={lead.priority || ''} onChange={e => update('priority', e.target.value)} className="input">
                  {['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={saveQualification} className="btn-primary">Save Changes</button>
          </div>
          <DupBlock message={qualDup} />
        </>
      )}

      {tab === 'followups' && (
        <div className="card p-4 mb-4 text-sm">
          {followUps.length === 0 && <p className="text-gray-400">None yet</p>}
          {followUps.map(f => (
            <div key={f.id} className="py-1 border-b flex justify-between">
              <span>{f.party_type} — {f.method} — {formatDateDisplay(f.due_date)} — {f.notes}</span>
              <span className={f.status === 'Pending' ? 'text-orange-600' : 'text-green-600'}>{f.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs text-gray-500 mb-1">{label}</label>{children}</div>;
}
