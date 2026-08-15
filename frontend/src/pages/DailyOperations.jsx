import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { getEnabledFilters } from './DashboardCustomize';

const STATUS_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
];
const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
];
const ALL_TYPE_LABELS = { Call: 'Calls', Visit: 'Visits', WhatsApp: 'WhatsApp', Backend: 'Backend' };

// Color-coded tag: an explicit priority_tag (Urgent/Important/Top Priority) takes
// precedence; otherwise falls back to the auto-computed time status.
function tagFor(t, today) {
  if (t.priority_tag === 'Urgent') return { label: 'Urgent', color: '#8b1e1e' };
  if (t.priority_tag === 'Important') return { label: 'Important', color: '#a8890f', bar: '#f0d878' };
  if (t.priority_tag === 'Top Priority') return { label: 'Top Priority', color: '#ea7317' };
  if (t.due_date < today) return { label: 'Overdue', color: '#e0503f' };
  if (t.due_date === today) return { label: 'Today', color: '#9aa5b1' };
  return { label: 'Upcoming', color: '#8fae8b' };
}

export default function DailyOperations() {
  const [tasks, setTasks] = useState([]);
  const [leadNames, setLeadNames] = useState({});
  const [fileNames, setFileNames] = useState({});
  const [files, setFiles] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusOpen, setStatusOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showNewTask, setShowNewTask] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const statusRef = useRef();

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
  useEffect(() => {
    const onDocClick = (e) => { if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const toggleDone = async (t) => {
    await api.updateFollowUp(t.id, { status: t.status === 'Done' ? 'Pending' : 'Done' });
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const pending = tasks.filter(t => t.status === 'Pending');
  const overdueCount = pending.filter(t => t.due_date < today).length;
  const todayCount = pending.filter(t => t.due_date === today).length;
  const upcomingCount = pending.filter(t => t.due_date > today).length;

  let visible = pending;
  if (statusFilter === 'overdue') visible = pending.filter(t => t.due_date < today);
  else if (statusFilter === 'today') visible = pending.filter(t => t.due_date === today);
  else if (statusFilter === 'upcoming') visible = pending.filter(t => t.due_date > today);
  if (typeFilter !== 'all') visible = visible.filter(t => t.method === typeFilter);

  const nameFor = (t) => t.loan_file_id ? fileNames[t.loan_file_id] : leadNames[t.lead_contact_id];
  const statusCounts = { overdue: overdueCount, today: todayCount, upcoming: upcomingCount };

  return (
    <div className="p-4 pb-6 animate-fade-in">
      <div className="flex justify-between items-center mb-3.5 relative" ref={statusRef}>
        <h1 className="font-display text-xl font-bold text-navy-900">Daily Operations</h1>
        <button onClick={() => setStatusOpen(o => !o)} className="h-[38px] box-border flex items-center gap-1 bg-navy-50 rounded-xl px-3.5 text-[12.5px] font-bold text-navy-700">
          {STATUS_OPTIONS.find(s => s.key === statusFilter).label} <ChevronDown size={12} className={`transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
        </button>
        {statusOpen && (
          <div className="absolute right-0 top-[44px] w-[150px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-card p-2 z-40 animate-fade-in">
            {STATUS_OPTIONS.map(s => (
              <div key={s.key} onClick={() => { setStatusFilter(s.key); setStatusOpen(false); }}
                className={`px-2.5 py-2 rounded-lg text-[12px] font-bold cursor-pointer flex justify-between ${statusFilter === s.key ? 'bg-amber-50 text-amber-700' : 'text-navy-700 active:bg-navy-50'}`}>
                {s.label} {s.key !== 'all' && <span className="text-gray-400 font-normal">· {statusCounts[s.key]}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto mb-4">
        {TYPE_FILTERS.map(t => (
          <FilterChip key={t.key} active={typeFilter === t.key} onClick={() => setTypeFilter(t.key)}>{t.label}</FilterChip>
        ))}
        {getEnabledFilters().map(key => (
          <FilterChip key={key} active={typeFilter === key} onClick={() => setTypeFilter(key)}>{ALL_TYPE_LABELS[key]}</FilterChip>
        ))}
      </div>

      <div className="card p-0.5">
        {visible.length === 0 && <p className="text-center text-gray-300 text-sm py-10">Nothing here — you're all caught up.</p>}
        {visible.map(t => {
          const tag = tagFor(t, today);
          return (
            <div key={t.id} className="flex items-center gap-2.5 px-2.5 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-1 self-stretch rounded-sm shrink-0" style={{ background: tag.bar || tag.color, minHeight: '32px' }} />
              <button onClick={() => toggleDone(t)} className="w-5 h-5 rounded-full border-2 border-navy-100 shrink-0 active:scale-90 transition-transform" />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium text-navy-900">{t.notes || 'Follow up'}</div>
                <div className="text-[11.5px] text-gray-400 mt-0.5">
                  {nameFor(t) || t.party_type} · {t.method} · Due {t.due_date}
                </div>
              </div>
              <span className="text-[10.5px] font-bold shrink-0" style={{ color: tag.color }}>{tag.label}</span>
            </div>
          );
        })}
      </div>

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
  const [form, setForm] = useState({ party_type: 'Lead', method: 'Call', due_date: new Date().toISOString().slice(0, 10), notes: '', priority_tag: '' });
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
    await api.createFollowUp({ ...form, priority_tag: form.priority_tag || null, lead_contact_id: selectedLead?.id || null });
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
              <option>Call</option><option>WhatsApp</option><option>Visit</option><option>Backend</option>
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Due Date</label>
          <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="input" />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Priority Tag (optional — overrides the auto Overdue/Today/Upcoming tag)</label>
          <select value={form.priority_tag} onChange={e => setForm(f => ({ ...f, priority_tag: e.target.value }))} className="input">
            <option value="">None</option>
            <option value="Urgent">Urgent</option>
            <option value="Important">Important</option>
            <option value="Top Priority">Top Priority</option>
          </select>
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
