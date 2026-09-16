import { useEffect, useState } from 'react';
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

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [tab, setTab] = useState('details');
  const toast = useToast();

  const load = () => {
    api.getContact(id).then(setLead);
    api.getFollowUps().then(all => setFollowUps(all.filter(f => String(f.lead_contact_id) === id)));
  };
  useEffect(() => { load(); }, [id]);

  if (!lead) return <div className="p-6 text-gray-400">Loading...</div>;

  const update = (field, value) => setLead(l => ({ ...l, [field]: value }));
  const isHomeOrMortgage = lead.loan_category === 'Home Loan' || lead.loan_category === 'Mortgage Loan';
  const dynamicLabel = lead.source === 'FB Ads' ? 'Campaign Name' : lead.source === 'Referral' ? 'Reference Name' : 'Source Details';

  const save = async () => {
    await api.updateContact(id, {
      qualification_status: lead.qualification_status, priority: lead.priority,
      name: lead.name, mobile: lead.mobile, mobile_2: lead.mobile_2 || null, email: lead.email || null,
      location: lead.location,
      loan_category: lead.loan_category,
      property_usage: isHomeOrMortgage ? lead.property_usage : null,
      loan_amount: parseRupeeValue(lead.loan_amount),
      source: lead.source,
      campaign_name: lead.source === 'FB Ads' ? lead.campaign_name : null,
      additional_info: lead.source === 'Direct' ? lead.additional_info : null,
    });
    toast('Lead details saved.', 'success');
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
                <select value={lead.source || 'FB Ads'} onChange={e => update('source', e.target.value)} className="input">
                  {['FB Ads', 'Referral', 'Direct'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              {lead.source !== 'Referral' && (
                <Field label={dynamicLabel}>
                  <input
                    value={lead.source === 'FB Ads' ? (lead.campaign_name || '') : (lead.additional_info || '')}
                    onChange={e => update(lead.source === 'FB Ads' ? 'campaign_name' : 'additional_info', e.target.value)}
                    className="input"
                  />
                </Field>
              )}
              {lead.source === 'Referral' && (
                <Field label="Reference Name"><input value={lead.referred_by_contact_id ? 'Linked connector' : ''} disabled className="input bg-gray-50 text-gray-400" /></Field>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={save} className="btn-primary">Save Changes</button>
          </div>
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
