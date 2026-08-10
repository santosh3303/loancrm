import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, CheckSquare, Contact, BarChart3, FileStack, Sliders, History, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api';

const PRIMARY = [
  { to: '/', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', badgeKey: 'tasks' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/loan-files', icon: FolderKanban, label: 'Loan Files' },
  { to: '/contacts', icon: Contact, label: 'Contacts' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];
const MOBILE_PRIMARY = PRIMARY.slice(0, 4);

const SETUP = [
  { to: '/checklist-rules', icon: FileStack, label: 'Checklist Rules' },
  { to: '/eligibility-rules', icon: Sliders, label: 'Eligibility Rules' },
  { to: '/audit-log', icon: History, label: 'Change History' },
];

function useTaskBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const load = () => {
      const today = new Date().toISOString().slice(0, 10);
      api.getFollowUps('Pending').then(all => {
        setCount(all.filter(t => t.due_date <= today).length);
      }).catch(() => {});
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);
  return count;
}

function NavItem({ to, end, icon: Icon, label, onClick, badge }) {
  return (
    <NavLink
      to={to} end={end} onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${isActive ? 'bg-navy-500 text-white shadow-soft' : 'text-navy-700/80 hover:bg-navy-50'}`
      }
    >
      <Icon size={18} strokeWidth={2} />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="bg-amber-500 text-white text-[10px] font-bold w-[18px] h-[18px] min-w-[18px] px-1 rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const [setupOpen, setSetupOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const taskCount = useTaskBadge();
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0 py-5 px-3">
        <div className="px-2 mb-6">
          <span className="font-display font-bold text-lg text-navy-700">Loan CRM</span>
        </div>
        <nav className="flex-1 space-y-1">
          {PRIMARY.map(item => <NavItem key={item.to} {...item} badge={item.badgeKey === 'tasks' ? taskCount : 0} />)}
          <button onClick={() => setSetupOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-navy-700/60 hover:bg-navy-50 mt-3">
            <span>Setup</span>
            <ChevronDown size={16} className={`transition-transform ${setupOpen ? 'rotate-180' : ''}`} />
          </button>
          {setupOpen && (
            <div className="space-y-1 animate-fade-in">
              {SETUP.map(item => <NavItem key={item.to} {...item} />)}
            </div>
          )}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <span className="font-display font-bold text-navy-700">Loan CRM</span>
        <button onClick={() => setMobileOpen(true)} className="text-navy-700 text-sm border border-gray-200 rounded-lg px-3 py-1.5">More</button>
      </div>

      {/* Mobile bottom nav bar - primary actions, thumb-reachable */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex justify-around py-1.5 px-1">
        {MOBILE_PRIMARY.map(({ to, end, icon: Icon, label, badgeKey }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium relative ${isActive ? 'text-navy-700' : 'text-gray-400'}`}>
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  {badgeKey === 'tasks' && taskCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-amber-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {taskCount > 9 ? '9+' : taskCount}
                    </span>
                  )}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Mobile drawer (secondary items) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/30 animate-fade-in" onClick={closeMobile}>
          <div className="bg-white w-64 h-full p-4 space-y-1 ml-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="font-display font-bold text-navy-700">Loan CRM</span>
              <button onClick={closeMobile} className="text-gray-400 text-xl leading-none">&times;</button>
            </div>
            {PRIMARY.map(item => <NavItem key={item.to} {...item} onClick={closeMobile} badge={item.badgeKey === 'tasks' ? taskCount : 0} />)}
            <div className="text-xs font-medium text-navy-700/60 px-3 pt-3 pb-1">Setup</div>
            {SETUP.map(item => <NavItem key={item.to} {...item} onClick={closeMobile} />)}
          </div>
        </div>
      )}
    </>
  );
}
