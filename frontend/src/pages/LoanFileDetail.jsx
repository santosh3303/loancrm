import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import ContactActions from '../components/ContactActions';
import StageTracker, { STAGES } from '../components/StageTracker';
import Breadcrumb from '../components/Breadcrumb';
import { useToast } from '../components/Toast';

export default function LoanFileDetail() {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [docsList, setDocsList] = useState(null);
  const [bankerSummary, setBankerSummary] = useState(null);
  const [tab, setTab] = useState('overview');
  const toast = useToast();

  const load = () => api.getLoanFile(id).then(setFile);
  useEffect(() => { load(); }, [id]);

  if (!file) return <div className="p-6 text-gray-400">Loading...</div>;

  const changeStage = async (stage) => {
    await api.updateLoanFile(id, { current_stage: stage });
    toast(`Stage updated to ${stage}.`, 'success');
    load();
  };

  const loadDocsList = async () => setDocsList(await api.getDocsList(id));
  const loadBankerSummary = async () => setBankerSummary(await api.getBankerSummary(id));

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <Breadcrumb items={[{ label: 'Master Database', to: '/master-database?tab=files' }, { label: file.lead_name }]} />
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy-700">{file.lead_name}</h1>
          <p className="text-sm text-gray-400">{file.loan_category} {file.loan_subcategory} — ₹{Number(file.loan_amount || 0).toLocaleString('en-IN')} — {file.bank_name || 'Generic'}</p>
        </div>
        <ContactActions mobile={file.lead_mobile} />
      </div>

      <StageTracker currentStage={file.current_stage} onChange={changeStage} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 text-sm overflow-x-auto scrollbar-hide">
        {['overview', 'applicants', 'followups', 'queries', 'communication'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2.5 px-3 capitalize whitespace-nowrap transition-colors ${tab === t ? 'border-b-2 border-amber-500 text-navy-700 font-semibold' : 'text-gray-400 hover:text-navy-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="font-medium mb-2">Banker Discussion Summary</h3>
            <button onClick={loadBankerSummary} className="text-xs bg-gray-100 px-2 py-1 rounded mb-2">Generate</button>
            {bankerSummary && (
              <div className="text-sm space-y-1">
                <p>Name: {bankerSummary.file.lead_name} | Location: {bankerSummary.file.location}</p>
                <p>CIBIL: {bankerSummary.file.cibil_score || 'N/A'} | Profile: {bankerSummary.file.profile_type || 'N/A'} {bankerSummary.file.profile_detail}</p>
                <div className="mt-2">
                  <div className="text-xs font-medium text-gray-500">⚠ Key Points:</div>
                  {bankerSummary.flags.map((f, i) => (
                    <div key={i} className="text-xs py-0.5">• {f.text} {f.type === 'manual' ? <span className="text-gray-400">[manual]</span> : null}</div>
                  ))}
                </div>
                <ShareButtons mobile={file.lead_mobile}
                  text={`Banker Summary — ${bankerSummary.file.lead_name}\nCIBIL: ${bankerSummary.file.cibil_score || 'N/A'}\nProfile: ${bankerSummary.file.profile_type || ''}\n${bankerSummary.flags.map(f => '- ' + f.text).join('\n')}`} />
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-medium mb-2">Required Docs List</h3>
            <button onClick={loadDocsList} className="text-xs bg-gray-100 px-2 py-1 rounded mb-2">Generate</button>
            {docsList && (
              <div className="text-sm space-y-2">
                {docsList.applicants.map(a => (
                  <div key={a.id}>
                    <div className="font-medium text-xs">{a.applicant_role} — {a.name} ({a.document_tier})</div>
                    <ul className="list-disc list-inside text-xs text-gray-600">
                      {a.documents.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                ))}
                {docsList.common_documents.length > 0 && (
                  <div>
                    <div className="font-medium text-xs">Common</div>
                    <ul className="list-disc list-inside text-xs text-gray-600">
                      {docsList.common_documents.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                )}
                <ShareButtons mobile={file.lead_mobile}
                  text={`Documents Required — ${file.bank_name || 'Generic'} ${file.loan_category}\n` +
                    docsList.applicants.map(a => `\n${a.applicant_role} (${a.document_tier}):\n` + a.documents.map(d => '- ' + d).join('\n')).join('') +
                    (docsList.common_documents.length ? `\n\nCommon:\n` + docsList.common_documents.map(d => '- ' + d).join('\n') : '')} />
              </div>
            )}
          </div>

          <div className="card p-4 col-span-2">
            <h3 className="font-medium mb-2">Commission</h3>
            <CommissionEditor file={file} onSave={load} />
          </div>

          <div className="card p-4 col-span-2">
            <h3 className="font-medium mb-2">Banker Contact</h3>
            <BankerEditor file={file} onSave={load} />
          </div>
        </div>
      )}

      {tab === 'applicants' && <ApplicantsTab fileId={id} applicants={file.applicants} onChange={load} />}
      {tab === 'followups' && <FollowUpsTab fileId={id} followUps={file.follow_ups} onChange={load} />}
      {tab === 'queries' && <QueriesTab fileId={id} queries={file.queries} onChange={load} />}
      {tab === 'communication' && <CommunicationTab fileId={id} log={file.communication_log} onChange={load} />}
    </div>
  );
}

function ShareButtons({ mobile, text }) {
  const clean = (mobile || '').replace(/\D/g, '');
  return (
    <div className="flex gap-2 mt-2">
      <button onClick={() => navigator.clipboard.writeText(text)} className="text-xs px-2 py-1 rounded bg-gray-100">Copy</button>
      <a href={`https://wa.me/91${clean}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"
        className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Send via WhatsApp</a>
    </div>
  );
}

function CommissionEditor({ file, onSave }) {
  const [expected, setExpected] = useState(file.commission_expected || '');
  const [status, setStatus] = useState(file.commission_status || 'Pending');
  const save = async () => { await api.updateLoanFile(file.id, { commission_expected: Number(expected) || null, commission_status: status }); onSave(); };
  return (
    <div className="flex gap-3 items-end text-sm">
      <div><label className="block text-xs text-gray-500">Expected Amount</label>
        <input type="number" value={expected} onChange={e => setExpected(e.target.value)} className="input" /></div>
      <div><label className="block text-xs text-gray-500">Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input">
          {['Pending', 'Partially Received', 'Received'].map(s => <option key={s}>{s}</option>)}
        </select></div>
      <button onClick={save} className="btn-primary text-xs px-3 py-2">Save</button>
    </div>
  );
}

function BankerEditor({ file, onSave }) {
  const [bankers, setBankers] = useState([]);
  const [selected, setSelected] = useState(file.banker_contact_id || '');
  useEffect(() => { api.getContacts('banker').then(setBankers); }, []);
  const save = async () => { await api.updateLoanFile(file.id, { banker_contact_id: selected || null }); onSave(); };
  return (
    <div className="flex gap-3 items-end text-sm">
      <div>
        <label className="block text-xs text-gray-500">Linked Banker</label>
        <select value={selected} onChange={e => setSelected(e.target.value)} className="input">
          <option value="">-- none --</option>
          {bankers.map(b => <option key={b.id} value={b.id}>{b.name} {b.mobile ? `(${b.mobile})` : ''}</option>)}
        </select>
      </div>
      <button onClick={save} className="btn-primary text-xs px-3 py-2">Save</button>
      {file.banker_name && <div className="ml-2"><ContactActions mobile={file.banker_mobile} /></div>}
    </div>
  );
}

function ApplicantsTab({ fileId, applicants, onChange }) {
  const [form, setForm] = useState({ name: '', mobile: '', applicant_role: 'Co-Applicant', document_tier: 'Full Set' });
  const add = async () => { await api.addApplicant(fileId, form); setForm({ name: '', mobile: '', applicant_role: 'Co-Applicant', document_tier: 'Full Set' }); onChange(); };
  const setTier = async (a, tier) => { await api.updateApplicant(a.id, { document_tier: tier }); onChange(); };
  return (
    <div className="card p-4">
      <table className="w-full text-sm mb-4">
        <thead className="text-left text-gray-500"><tr><th>Name</th><th>Role</th><th>Mobile</th><th>Doc Tier</th></tr></thead>
        <tbody>
          {applicants.map(a => (
            <tr key={a.id} className="border-t">
              <td className="py-1">{a.name}</td><td>{a.applicant_role}</td><td>{a.mobile || '-'}</td>
              <td>
                {a.applicant_role === 'Co-Applicant' ? (
                  <select value={a.document_tier} onChange={e => setTier(a, e.target.value)} className="input text-xs">
                    <option>Full Set</option><option>KYC Only</option>
                  </select>
                ) : a.document_tier}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 items-end">
        <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
        <input placeholder="Mobile" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="input" />
        <select value={form.applicant_role} onChange={e => setForm(f => ({ ...f, applicant_role: e.target.value }))} className="input">
          <option>Co-Applicant</option><option>Guarantor</option>
        </select>
        <button onClick={add} className="btn-primary text-xs px-3 py-2">Add</button>
      </div>
    </div>
  );
}

function FollowUpsTab({ fileId, followUps, onChange }) {
  const [form, setForm] = useState({ party_type: 'Lead', method: 'Call', due_date: new Date().toISOString().slice(0, 10), notes: '' });
  const add = async () => { await api.createFollowUp({ loan_file_id: fileId, ...form }); setForm(f => ({ ...f, notes: '' })); onChange(); };
  const markDone = async (id) => { await api.updateFollowUp(id, { status: 'Done' }); onChange(); };
  return (
    <div className="card p-4">
      <table className="w-full text-sm mb-4">
        <thead className="text-left text-gray-500"><tr><th>Party</th><th>Method</th><th>Due</th><th>Status</th><th>Notes</th><th></th></tr></thead>
        <tbody>
          {followUps.map(f => (
            <tr key={f.id} className="border-t">
              <td className="py-1">{f.party_type}</td><td>{f.method}</td><td>{f.due_date}</td>
              <td><span className={f.status === 'Pending' ? 'text-orange-600' : 'text-green-600'}>{f.status}</span></td>
              <td>{f.notes}</td>
              <td>{f.status === 'Pending' && <button onClick={() => markDone(f.id)} className="text-xs text-amber-700 hover:underline">Mark done</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 items-end flex-wrap">
        <select value={form.party_type} onChange={e => setForm(f => ({ ...f, party_type: e.target.value }))} className="input"><option>Lead</option><option>Source</option><option>Bank</option></select>
        <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className="input"><option>Call</option><option>WhatsApp</option><option>Visit</option></select>
        <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="input" />
        <input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" />
        <button onClick={add} className="btn-primary text-xs px-3 py-2">Add Follow-up</button>
      </div>
    </div>
  );
}

function QueriesTab({ fileId, queries, onChange }) {
  const [form, setForm] = useState({ raised_by: 'Bank', priority: 'Medium', description: '' });
  const add = async () => { if (!form.description) return; await api.createQuery({ loan_file_id: fileId, ...form }); setForm(f => ({ ...f, description: '' })); onChange(); };
  const setStatus = async (id, status) => { await api.updateQuery(id, { status }); onChange(); };
  return (
    <div className="card p-4">
      <table className="w-full text-sm mb-4">
        <thead className="text-left text-gray-500"><tr><th>Raised By</th><th>Priority</th><th>Description</th><th>Status</th></tr></thead>
        <tbody>
          {queries.map(q => (
            <tr key={q.id} className="border-t">
              <td className="py-1">{q.raised_by}</td>
              <td className={q.priority === 'High' ? 'text-red-600' : ''}>{q.priority}</td>
              <td>{q.description}</td>
              <td>
                <select value={q.status} onChange={e => setStatus(q.id, e.target.value)} className="input text-xs">
                  {['Open', 'Closed', 'Rejected', 'Sanctioned', 'Disbursed'].map(s => <option key={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 items-end flex-wrap">
        <select value={form.raised_by} onChange={e => setForm(f => ({ ...f, raised_by: e.target.value }))} className="input"><option>Bank</option><option>Lead</option><option>Connector</option></select>
        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input"><option>Low</option><option>Medium</option><option>High</option></select>
        <input placeholder="Query description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input flex-1" />
        <button onClick={add} className="btn-primary text-xs px-3 py-2">Add Query</button>
      </div>
    </div>
  );
}

function CommunicationTab({ fileId, log, onChange }) {
  const [form, setForm] = useState({ party_type: 'Lead', mode: 'Call', log_date: new Date().toISOString().slice(0, 10), content: '' });
  const add = async () => { if (!form.content) return; await api.addCommunicationLog({ loan_file_id: fileId, ...form }); setForm(f => ({ ...f, content: '' })); onChange(); };
  return (
    <div className="card p-4">
      <div className="space-y-2 mb-4 text-sm">
        {log.map(c => (
          <div key={c.id} className="border-b pb-2">
            <span className="text-gray-500">{c.log_date} | {c.party_type} | {c.mode}</span>
            <p>{c.content}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-end flex-wrap">
        <select value={form.party_type} onChange={e => setForm(f => ({ ...f, party_type: e.target.value }))} className="input"><option>Lead</option><option>Source</option><option>Bank</option></select>
        <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))} className="input"><option>Call</option><option>WhatsApp</option><option>Visit</option><option>Email</option></select>
        <input type="date" value={form.log_date} onChange={e => setForm(f => ({ ...f, log_date: e.target.value }))} className="input" />
        <input placeholder="What was discussed" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input flex-1" />
        <button onClick={add} className="btn-primary text-xs px-3 py-2">Log</button>
      </div>
    </div>
  );
}
