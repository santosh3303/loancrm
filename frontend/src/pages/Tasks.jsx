import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Phone, MessageCircle, MapPin, CheckCircle2, Circle } from 'lucide-react';

const METHOD_ICON = { Call: Phone, WhatsApp: MessageCircle, Visit: MapPin };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [leadNames, setLeadNames] = useState({});
  const [fileNames, setFileNames] = useState({});
  const [filter, setFilter] = useState('open'); // open | all

  const load = async () => {
    const all = await api.getFollowUps();
    setTasks(all);
    const leadIds = [...new Set(all.filter(t => t.lead_contact_id).map(t => t.lead_contact_id))];
    const fileIds = [...new Set(all.filter(t => t.loan_file_id).map(t => t.loan_file_id))];
    const leads = await Promise.all(leadIds.map(id => api.getContact(id).catch(() => null)));
    const files = await Promise.all(fileIds.map(id => api.getLoanFile(id).catch(() => null)));
    setLeadNames(Object.fromEntries(leads.filter(Boolean).map(l => [l.id, l.name])));
    setFileNames(Object.fromEntries(files.filter(Boolean).map(f => [f.id, f.lead_name])));
  };
  useEffect(() => { load(); }, []);

  const toggleDone = async (t) => {
    await api.updateFollowUp(t.id, { status: t.status === 'Done' ? 'Pending' : 'Done' });
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const visible = tasks.filter(t => filter === 'all' || t.status === 'Pending');
  const overdue = visible.filter(t => t.due_date < today && t.status === 'Pending');
  const dueToday = visible.filter(t => t.due_date === today && t.status === 'Pending');
  const upcoming = visible.filter(t => t.due_date > today && t.status === 'Pending');
  const done = filter === 'all' ? visible.filter(t => t.status === 'Done') : [];

  const nameFor = (t) => t.loan_file_id ? fileNames[t.loan_file_id] : leadNames[t.lead_contact_id];
  const linkFor = (t) => t.loan_file_id ? `/loan-files/${t.loan_file_id}` : `/leads/${t.lead_contact_id}`;

  const Group = ({ title, items, tone }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${tone}`}>{title} · {items.length}</h3>
        <div className="space-y-2">
          {items.map(t => {
            const Icon = METHOD_ICON[t.method] || Circle;
            return (
              <div key={t.id} className="card p-3 flex items-center gap-3 animate-fade-in">
                <button onClick={() => toggleDone(t)} className="text-navy-300 hover:text-navy-500 shrink-0">
                  {t.status === 'Done' ? <CheckCircle2 size={20} className="text-amber-600" /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-medium ${t.status === 'Done' ? 'line-through text-gray-400' : 'text-navy-700'}`}>{t.notes || 'Follow up'}</span>
                    <span className="badge bg-navy-50 text-navy-500">{t.party_type}</span>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                    <Icon size={12} /> {t.method} · Due {t.due_date}
                    {nameFor(t) && <>· <Link to={linkFor(t)} className="text-amber-700 hover:underline">{nameFor(t)}</Link></>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-display font-semibold text-navy-700">Tasks</h1>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5 text-sm">
          <button onClick={() => setFilter('open')} className={`px-3 py-1 rounded-md ${filter === 'open' ? 'bg-navy-500 text-white' : 'text-gray-500'}`}>Open</button>
          <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-md ${filter === 'all' ? 'bg-navy-500 text-white' : 'text-gray-500'}`}>All</button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">Every follow-up across your leads and loan files, in one place.</p>

      <Group title="Overdue" items={overdue} tone="text-red-600" />
      <Group title="Due Today" items={dueToday} tone="text-amber-700" />
      <Group title="Upcoming" items={upcoming} tone="text-navy-500" />
      <Group title="Done" items={done} tone="text-gray-400" />

      {visible.length === 0 && done.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle2 size={32} className="mx-auto mb-2 text-gray-300" />
          Nothing pending — you're all caught up.
        </div>
      )}
    </div>
  );
}
