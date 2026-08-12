import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { SkeletonCard, SkeletonList } from '../components/Skeleton';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboard().then(setData);
    api.getLoanFiles().then(all => setFiles(all.filter(f => f.current_stage !== 'Disbursed').slice(0, 6)));
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
  const overdue = data.todayFollowUps.filter(f => f.due_date < today);
  const dueToday = data.todayFollowUps.filter(f => f.due_date === today);
  const todayItems = [...overdue, ...dueToday].slice(0, 3);

  const JUMP_TILES = [
    { to: '/daily-operations', label: 'Daily Operations', sub: `${data.overdueFollowUps + data.todayFollowUps.length} tasks, ${data.activeFiles} files`, cls: 'bg-gradient-to-br from-navy-700 to-navy-500' },
    { to: '/reporting', label: 'Reporting', sub: 'Filter & export', cls: 'bg-gradient-to-br from-amber-600 to-amber-500' },
    { to: '/master-database', label: 'Master Database', sub: `${data.openLeads} leads`, cls: 'bg-gradient-to-br from-[#3a5a7a] to-navy-500' },
    { to: '/settings', label: 'Settings', sub: 'Rules & setup', cls: 'bg-gradient-to-br from-gray-600 to-gray-500' },
  ];

  return (
    <div className="p-4 pb-6 animate-fade-in">
      <div className="text-[12.5px] text-gray-400 mb-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <h1 className="font-display text-xl font-bold text-navy-900 mb-4">Good day, Chetan</h1>

      <div className="grid grid-cols-4 gap-2 mb-5">
        <Stat num={data.openLeads} lbl="LEADS" />
        <Stat num={data.activeFiles} lbl="FILES" />
        <Stat num={data.overdueFollowUps} lbl="OVERDUE" warn={data.overdueFollowUps > 0} />
        <Stat num={data.openQueries.length} lbl="QUERIES" />
      </div>

      <SectionTitle title="Jump to" />
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {JUMP_TILES.map(t => (
          <div key={t.to} onClick={() => navigate(t.to)} className={`rounded-2xl p-3.5 text-white cursor-pointer active:scale-[0.97] transition-transform ${t.cls}`}>
            <div className="font-bold text-[13px]">{t.label}</div>
            <div className="text-[10.5px] opacity-85 mt-0.5">{t.sub}</div>
          </div>
        ))}
      </div>

      <SectionTitle title="Today" action="Full list →" onAction={() => navigate('/daily-operations')} />
      <div className="card p-1.5">
        {todayItems.length === 0 && <p className="text-center text-gray-300 text-sm py-4">Nothing pending — you're caught up.</p>}
        {todayItems.map(t => (
          <div key={t.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl active:bg-navy-50 transition-colors">
            <div className={`w-[3px] self-stretch rounded-sm ${t.due_date < today ? 'bg-red-500' : 'bg-amber-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-navy-900">{t.notes || 'Follow up'}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{t.party_type} · {t.due_date < today ? 'Overdue' : 'Due today'}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle title="Files in motion" action="See all →" onAction={() => navigate('/master-database?tab=files')} />
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
    </div>
  );
}

function Stat({ num, lbl, warn }) {
  return (
    <div className="card p-2.5 text-center active:scale-95 transition-transform">
      <div className={`font-display font-bold text-[18px] ${warn ? 'text-red-500' : 'text-navy-900'}`}>{num}</div>
      <div className="text-[9px] text-gray-400 mt-0.5 font-semibold">{lbl}</div>
    </div>
  );
}

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="flex justify-between items-center text-[13.5px] font-bold text-navy-900 mt-5 mb-2.5">
      {title}
      {action && <span onClick={onAction} className="text-[11px] text-amber-600 font-semibold cursor-pointer">{action}</span>}
    </div>
  );
}
