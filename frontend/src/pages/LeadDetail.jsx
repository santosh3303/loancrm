import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import ContactActions from '../components/ContactActions';
import Breadcrumb from '../components/Breadcrumb';
import { useToast } from '../components/Toast';
import { formatDateDisplay } from '../utils/taskDisplay';

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const toast = useToast();

  const load = () => {
    api.getContact(id).then(setLead);
    api.getFollowUps().then(all => setFollowUps(all.filter(f => String(f.lead_contact_id) === id)));
  };
  useEffect(() => { load(); }, [id]);

  if (!lead) return <div className="p-6 text-gray-400">Loading...</div>;

  const update = (field, value) => setLead(l => ({ ...l, [field]: value }));

  const save = async () => {
    await api.updateContact(id, {
      qualification_status: lead.qualification_status, priority: lead.priority,
      cibil_score: lead.cibil_score ? Number(lead.cibil_score) : null,
      profile_type: lead.profile_type, profile_detail: lead.profile_detail,
      monthly_income: lead.monthly_income ? Number(lead.monthly_income) : null,
      loan_category: lead.loan_category, loan_subcategory: lead.loan_subcategory,
      loan_amount: lead.loan_amount ? Number(lead.loan_amount) : null,
      additional_info: lead.additional_info, location: lead.location
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

      <div className="card p-4 mb-4 space-y-3 text-sm">
        <h3 className="font-display font-semibold text-navy-700 mb-1">Qualification Details</h3>
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
          <Field label="CIBIL Score">
            <input type="number" value={lead.cibil_score || ''} onChange={e => update('cibil_score', e.target.value)} className="input" />
          </Field>
          <Field label="Monthly Income">
            <input type="number" value={lead.monthly_income || ''} onChange={e => update('monthly_income', e.target.value)} className="input" />
          </Field>
          <Field label="Profile Type">
            <select value={lead.profile_type || ''} onChange={e => update('profile_type', e.target.value)} className="input">
              <option value="">-</option>
              <option>Salaried</option><option>Self-employed</option><option>Business</option>
            </select>
          </Field>
          <Field label="Profile Detail">
            <input value={lead.profile_detail || ''} onChange={e => update('profile_detail', e.target.value)} className="input" placeholder="e.g. IT sector, 6 yrs" />
          </Field>
        </div>
      </div>

      <div className="card p-4 mb-4 space-y-3 text-sm">
        <h3 className="font-display font-semibold text-navy-700 mb-1">Loan Interest (at enquiry stage)</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Loan Category">
            <select value={lead.loan_category || ''} onChange={e => update('loan_category', e.target.value)} className="input">
              <option value="">-</option>
              {['Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Sub-category">
            <input value={lead.loan_subcategory || ''} onChange={e => update('loan_subcategory', e.target.value)} className="input" />
          </Field>
          <Field label="Loan Amount">
            <input type="number" value={lead.loan_amount || ''} onChange={e => update('loan_amount', e.target.value)} className="input" />
          </Field>
        </div>
      </div>

      <div className="card p-4 mb-4 text-sm">
        <h3 className="font-medium mb-2">Additional Info</h3>
        <textarea value={lead.additional_info || ''} onChange={e => update('additional_info', e.target.value)} className="input" />
      </div>

      <div className="card p-4 mb-4 text-sm">
        <h3 className="font-medium mb-2">Follow-ups</h3>
        {followUps.length === 0 && <p className="text-gray-400">None yet</p>}
        {followUps.map(f => (
          <div key={f.id} className="py-1 border-b flex justify-between">
            <span>{f.party_type} — {f.method} — {formatDateDisplay(f.due_date)} — {f.notes}</span>
            <span className={f.status === 'Pending' ? 'text-orange-600' : 'text-green-600'}>{f.status}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={save} className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs text-gray-500 mb-1">{label}</label>{children}</div>;
}
