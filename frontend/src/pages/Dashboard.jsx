import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Calendar, FastForward } from 'lucide-react';
import { api } from '../api';
import { SkeletonCard, SkeletonList } from '../components/Skeleton';
import { periodRange, PERIOD_GROUPS } from '../utils/periods';
import { getEnabledStats, getEnabledFilters } from './DashboardCustomize';
import TaskActionSheet from '../components/TaskActionSheet';
import { taglineFor, sortByGroup, BAR_COLOR, statusOf } from '../utils/taskDisplay';

const ALL_STAT_DEFS = {
  openLeads: { lbl: 'LEADS', dest: () => '/master-database?tab=leads' },
  activeFiles: { lbl: 'FILES', dest: () => '/master-database?tab=files' },
  overdueFollowUps: { lbl: 'OVERDUE', warn: true, dest: () => '/daily-operations' },
  openQueriesCount: { lbl: 'QUERIES', dest: () => '/daily-operations' },
  bizValue: { lbl: 'BIZ VALUE', dest: () => '/reporting', money: true },
  logins: { lbl: 'LOGINS', dest: () => '/reporting' },
  sanctions: { lbl: 'SANCTIONS', dest: () => '/reporting' },
  disb: { lbl: 'DISB.', dest: () => '/reporting' },
};

const ALL_TYPE_LABELS = { Call: 'Calls', Visit: 'Visits', WhatsApp: 'WhatsApp', Backend: 'Backend' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [files, setFiles] = useState([]);
  const [leadNames, setLeadNames] = useState({});
  const [fileNames, setFileNames] = useState({});
  const [period, setPeriod] = useState('MTD');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTask, setActiveTask] = useState(null);
  const navigate = useNavigate();
  const periodRef = useRef();

  const load = (code) => {
    const range = periodRange(code);
    api.getDashboard(range?.from, range?.to).then(async d => {
      setData(d);
      const leadIds = [...new Set(d.todayFollowUps.filter(t => t.lead_contact_id).map(t => t.lead_contact_id))];
      const fileIds = [...new Set(d.todayFollowUps.filter(t => t.loan_file_id).map(t => t.loan_file_id))];
      const leads = await Promise.all(leadIds.map(id => api.getContact(id).catch(() => null)));
      const fls = await Promise.all(fileIds.map(id => api.getLoanFile(id).catch(() => null)));
      setLeadNames(Object.fromEntries(leads.filter(Boolean).map(l => [l.id, l.name])));
      setFileNames(Object.fromEntries(fls.filter(Boolean).map(f => [f.id, f.lead_name])));
    });
  };
  useEffect(() => { load(period); }, [period]);
  useEffect(() => {
    api.getLoanFiles().then(all => setFiles(all.filter(f => f.current_stage !== 'Disbursed').slice(0, 6)));
  }, []);

  useEffect(() => {
    const onDocClick = (e) => { if (periodRef.current && !periodRef.current.contains(e.target)) setPeriodOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (!data) return (
    <div className="p-4">
      <div className="h-6 bg-gray-100 rounded w-40 mb-5 animate-pulse" />
      <div className="grid grid-cols-4 gap-2 mb-5">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <SkeletonList rows={3} />
    </div>
  );

  const today = new Date().toISOString().slice(0, 10);
  const statValues = { ...data, openQueriesCount: data.openQueries.length };
  let visibleTasks = typeFilter === 'all' ? data.todayFollowUps : data.todayFollowUps.filter(t => t.method === typeFilter);
  visibleTasks = sortByGroup(visibleTasks, today);
  const enabledStatKeys = getEnabledStats();
  const enabledFilterKeys = getEnabledFilters();
  const nameFor = (t) => t.loan_file_id ? fileNames[t.loan_file_id] : leadNames[t.lead_contact_id];

  return (
    <div className="p-4 pb-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 relative" ref={periodRef}>
        <div className="text-[12.5px] text-gray-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <button onClick={() => setPeriodOpen(o => !o)} className="flex items-center gap-1 bg-navy-50 rounded-full px-2.5 py-1 text-[11px] font-bold text-navy-700">
          <Calendar size={11} /> {period} <ChevronDown size={9} className={`transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
        </button>

        {periodOpen && (
          <div className="absolute left-0 top-8 w-[210px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-card p-2 z-40 animate-fade-in">
            {PERIOD_GROUPS.map(g => (
              <div key={g.label}>
                <div className="text-[9.5px] font-bold uppercase text-gray-300 px-2 pt-1.5 pb-0.5">{g.label}</div>
                {g.options.map(o => (
                  <div key={o.code} onClick={() => { setPeriod(o.code); setPeriodOpen(false); }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${period === o.code ? 'bg-amber-50 text-amber-700' : 'text-navy-700 active:bg-navy-50'}`}>
                    {g.label === 'Upcoming' ? <FastForward size={12} /> : <Calendar size={12} />}
                    {o.code} <span className="font-normal text-gray-400 text-[10.5px]">{o.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-1">
        {enabledStatKeys.map(key => {
          const s = ALL_STAT_DEFS[key];
          if (!s) return null;
          return (
            <Stat key={key} num={s.money ? `₹${(statValues[key] / 100000).toFixed(1)}L` : statValues[key]}
              lbl={s.lbl} warn={s.warn && statValues[key] > 0} onClick={() => navigate(s.dest())} />
          );
        })}
      </div>
      <p className="text-[10px] text-gray-300 mb-1">Tap any card to jump to its full view.</p>

      <SectionTitle title="Today's Tasks" action="Full list →" onAction={() => navigate('/daily-operations')} />
      <div className="flex gap-2 overflow-x-auto mb-2.5">
        <button onClick={() => setTypeFilter('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${typeFilter === 'all' ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>
          All
        </button>
        {enabledFilterKeys.map(key => (
          <button key={key} onClick={() => setTypeFilter(key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${typeFilter === key ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>
            {ALL_TYPE_LABELS[key]}
          </button>
        ))}
      </div>
      <div className="card p-1.5">
        {visibleTasks.length === 0 && <p className="text-center text-gray-300 text-sm py-4">Nothing here — you're caught up.</p>}
        {visibleTasks.slice(0, 4).map(t => {
          const status = statusOf(t, today);
          return (
            <div key={t.id} onClick={() => setActiveTask(t)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl active:bg-navy-50 transition-colors cursor-pointer">
              <div className="w-[3px] self-stretch rounded-sm" style={{ background: BAR_COLOR[status] }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-navy-900">{t.notes || 'Follow up'}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{taglineFor(t, nameFor(t))}</div>
              </div>
            </div>
          );
        })}
      </div>

      <SectionTitle title="Active Files" action="See all →" onAction={() => navigate('/master-database?tab=files')} />
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
        {files.length === 0 && <p className="text-gray-300 text-sm py-4">No active files yet</p>}
        {files.map(f => (
          <div key={f.id} onClick={() => navigate(`/loan-files/${f.id}`)} className="shrink-0 w-[148px] card p-3.5 cursor-pointer active:scale-[0.97] transition-transform">
            <div className="text-[13px] font-bold text-navy-900 truncate">{f.lead_name}</div>
            <div className="text-[10.5px] text-gray-400 mt-0.5 mb-2.5">₹{Number(f.loan_amount || 0).toLocaleString('en-IN')} · {f.bank_name || 'Generic'}</div>
            <span className="inline-block bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">{f.current_stage}</span>
          </div>
        ))}
      </div>

      {activeTask && (
        <TaskActionSheet task={activeTask} displayLine={taglineFor(activeTask, nameFor(activeTask))}
          onClose={() => setActiveTask(null)} onChanged={() => load(period)} />
      )}
    </div>
  );
}

function Stat({ num, lbl, warn, onClick }) {
  return (
    <div onClick={onClick} className="card p-2 text-center active:scale-95 transition-transform cursor-pointer">
      <div className={`font-display font-bold text-[14.5px] truncate ${warn ? 'text-red-500' : 'text-navy-900'}`}>{num}</div>
      <div className="text-[8px] text-gray-400 mt-0.5 font-semibold">{lbl}</div>
    </div>
  );
}

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="flex justify-between items-center text-[13.5px] font-bold text-navy-900 mt-4 mb-2.5">
      {title}
      {action && <span onClick={onAction} className="text-[11px] text-amber-600 font-semibold cursor-pointer">{action}</span>}
    </div>
  );
}
