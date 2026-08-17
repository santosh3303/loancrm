import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, CheckSquare, FolderPlus, Contact, Plus } from 'lucide-react';

const ICONS = { lead: UserPlus, task: CheckSquare, file: FolderPlus, contact: Contact };
const LABELS = { lead: 'New Lead', task: 'New Task', file: 'New Loan File', contact: 'New Contact' };
const DESTS = {
  lead: '/master-database?tab=leads&new=lead',
  task: '/daily-operations?new=task',
  file: '/master-database?tab=files&new=file',
  contact: '/master-database?tab=contacts&new=contact',
};

const ORDER_BY_CONTEXT = {
  '/': ['lead', 'task', 'file', 'contact'],
  '/daily-operations': ['task', 'lead', 'file', 'contact'],
  '/reporting': ['lead', 'file', 'task', 'contact'],
  '/settings': ['lead', 'task', 'file', 'contact'],
  'master-database-leads': ['lead', 'file', 'contact', 'task'],
  'master-database-files': ['file', 'lead', 'contact', 'task'],
  'master-database-contacts': ['contact', 'lead', 'file', 'task'],
};

export default function SpeedDialFab() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contextKey = location.pathname === '/master-database'
    ? `master-database-${searchParams.get('tab') || 'leads'}`
    : location.pathname;
  const order = ORDER_BY_CONTEXT[contextKey] || ORDER_BY_CONTEXT['/'];
  const displayOrder = [...order].reverse(); // first item ends up closest to FAB

  const select = (key) => { setOpen(false); navigate(DESTS[key]); };

  return (
    <>
      {open && <div className="fixed inset-0 bg-navy-900/15 backdrop-blur-[2px] z-[33]" onClick={() => setOpen(false)} />}

      <div className={`fixed right-[18px] bottom-[152px] max-w-[420px] mx-auto flex flex-col items-end gap-2.5 z-[34] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} style={{ right: 'max(18px, calc(50% - 210px + 18px))' }}>
        {displayOrder.map((key, i) => {
          const Icon = ICONS[key];
          return (
            <div key={key}
              className={`flex items-center gap-2.5 transition-all duration-250 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
              style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}>
              <div className="bg-navy-900/80 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-2 rounded-[10px] whitespace-nowrap shadow-lg cursor-pointer" onClick={() => select(key)}>
                {LABELS[key]}
              </div>
              <div className="w-10 h-10 rounded-[13px] bg-white/85 backdrop-blur-md text-navy-700 flex items-center justify-center shrink-0 shadow-lg cursor-pointer" onClick={() => select(key)}>
                <Icon size={17} strokeWidth={2.2} />
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-[86px] w-14 h-14 rounded-[18px] flex items-center justify-center shadow-[0_8px_20px_rgba(224,161,58,0.4)] z-[35] transition-all duration-250
          ${open ? 'bg-navy-900 rotate-[135deg]' : 'bg-amber-500 rotate-0'}`}
        style={{ right: 'max(18px, calc(50% - 210px + 18px))' }}>
        <Plus size={26} className="text-white" strokeWidth={2.4} />
      </button>
    </>
  );
}
