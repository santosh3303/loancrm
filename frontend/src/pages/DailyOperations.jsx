import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/Toast';

export default function DailyOperations() {
  const [tasks, setTasks] = useState([]);
  const [leadNames, setLeadNames] = useState({});
  const [fileNames, setFileNames] = useState({});
  const [files, setFiles] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showNewTask, setShowNewTask] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const load = async () => {
    const all = await api.getFollowUps();
    setTasks(all);
    const leadIds = [...new Set(all.filter(t => t.lead_contact_id).map(t => t.lead_contact_id))];
    const fileIds = [...new Set(all.filter(t => t.loan_file_id).map(t => t.loan_file_id))];
    const leads = await Promise.all(leadIds.map(id => api.getContact(id).catch(() => null)));
    const fls = await Promise.all(fileIds.map(id => api.getLoanFile(id).catch(() => null)));
    setLeadNames(Object.fromEntries(leads.filter(Boolean).map(l => [l.id, l.name])));
    setFileNames(Object.fromEntries(fls.filter(Boolean).map(f => [f.id, f.lead_name])));
    api.getLoanFiles().then(af => setFiles(af.filter(f => f.current_stage !== 'Disbursed')));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (searchParams.get('new') === 'task') { setShowNewTask(true); searchParams.delete('new'); setSearchParams(searchParams, { replace: true }); }
  }, [searchParams]);

  const toggleDone = async (t) => {
    await api.updateFollowUp(t.id, { status: t.status === 'Done' ? 'Pending' : 'Done' });
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const pending = tasks.filter(t => t.status === 'Pending');
  const overdue = pending.filter(t => t.due_date < today);
  const dueToday = pending.filter(t => t.due_date === today);
  const upcoming = pending.filter(t => t.due_date > today);

  const visible = filter === 'overdue' ? overdue : filter === 'today' ? dueToday : filter === 'upcoming' ? upcoming : pending;
  const groups = filter === 'all'
    ? [{ label: 'Overdue', items: overdue }, { label: 'Due Today', items: dueToday }, { label: 'Upcoming', items: upcoming }]
    : [{ label: null, items: visible }];

  const nameFor = (t) => t.loan_file_id ? fileNames[t.loan_file_id] : leadNames[t.lead_contact_id];

  return (
    <div className="p-4 pb-6 animate-fade-in">
      <h1 className="font-display text-xl font-bold text-navy-900 mb-4">Daily Operations</h1>

      <div className="flex gap-2 overflow-x-auto mb-4">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
        <FilterChip active={filter === 'overdue'} onClick={() => setFilter('overdue')}>Overdue · {overdue.length}</FilterChip>
        <FilterChip active={filter === 'today'} onClick={() => setFilter('today')}>Today · {dueToday.length}</FilterChip>
        <FilterChip active={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>Upcoming · {upcoming.length}</FilterChip>
      </div>

      {groups.map((g, gi) => g.items.length > 0 && (
        <div key={gi}>
          {g.label && <div className="text-[13.5px] font-bold text-navy-900 mt-5 mb-2.5">{g.label}</div>}
          <div className="card">
            {g.items.map(t => (
              <div key={t.id} className="flex items-center gap-2.5 py-2.5 border-b border-gray-50 last:border-0">
                <button onClick={() => toggleDone(t)} className="w-5 h-5 rounded-full border-2 border-navy-100 shrink-0 active:scale-90 transition-transform" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-navy-900">{t.notes || 'Follow up'}</div>
                  <div className="text-[11.5px] text-gray-400 mt-0.5">
                    {nameFor(t) || t.party_type} · {t.method} · Due {t.due_date}
                  </div>
                </div>
                <span className={`badge ${t.party_type === 'Bank' ? 'bg-navy-50 text-navy-500' : 'bg-amber-50 text-amber-700'}`}>{t.party_type}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {pending.length === 0 && <p className="text-center text-gray-300 text-sm py-10">Nothing pending — you're all caught up.</p>}

      <div className="flex justify-between items-center mt-6 mb-2.5">
        <span className="text-[13.5px] font-bold text-navy-900">Active Loan Files</span>
      </div>
      <div className="card">
        {files.length === 0 && <p className="text-center text-gray-300 text-sm py-4">No active files</p>}
        {files.map(f => (
          <Link key={f.id} to={`/loan-files/${f.id}`} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
            <div>
              <div className="text-[13.5px] font-semibold text-navy-900">{f.lead_name}</div>
              <div className="text-[11.5px] text-gray-400 mt-0.5">{f.loan_category} · ₹{Number(f.loan_amount || 0).toLocaleString('en-IN')} · {f.bank_name || 'Generic'}</div>
            </div>
            <span className="stage-pill">{f.current_stage}</span>
          </Link>
        ))}
      </div>

      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} onSaved={() => { setShowNewTask(false); toast('Task added.', 'success'); load(); }} />}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${active ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>
      {children}
    </button>
  );
}

function NewTaskModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ party_type: 'Lead', method: 'Call', due_date: new Date().toISOString().slice(0, 10), notes: '' });
  const [leadQuery, setLeadQuery] = useState('');
  const [leadMatches, setLeadMatches] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const debounceRef = useRef();

  const handleLeadSearch = (v) => {
    setLeadQuery(v); setSelectedLead(null);
    clearTimeout(debounceRef.current);
    if (v.length < 2) { setLeadMatches([]); return; }
    debounceRef.current = setTimeout(async () => setLeadMatches(await api.searchContacts(v, 'lead')), 300);
  };

  const submit = async () => {
    await api.createFollowUp({ ...form, lead_contact_id: selectedLead?.id || null });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] animate-fade-in">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm mx-4 shadow-card">
        <h3 className="font-display font-semibold text-navy-900 mb-4">New Task</h3>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Related Lead (optional)</label>
          <input value={leadQuery} onChange={e => handleLeadSearch(e.target.value)} className="input" placeholder="Search by name or mobile" />
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
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Party</label>
            <select value={form.party_type} onChange={e => setForm(f => ({ ...f, party_type: e.target.value }))} className="input">
              <option>Lead</option><option>Source</option><option>Bank</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Method</label>
            <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className="input">
              <option>Call</option><option>WhatsApp</option><option>Visit</option>
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Due Date</label>
          <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="input" />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Notes</label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" placeholder="What needs to happen" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} className="btn-primary">Add Task</button>
        </div>
      </div>
    </div>
  );
}
