import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BarChart3, Database, Settings as SettingsIcon } from 'lucide-react';

const TABS = [
  { to: '/', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/daily-operations', icon: CheckSquare, label: 'Daily Ops' },
  { to: '/reporting', icon: BarChart3, label: 'Reporting' },
  { to: '/master-database', icon: Database, label: 'Master DB' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="relative shrink-0 z-20 bg-white rounded-t-[22px] shadow-[0_-4px_20px_rgba(18,33,58,0.08)] flex justify-around py-2.5 px-1 pb-3.5">
      {TABS.map(({ to, end, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[9.5px] font-bold px-2.5 py-0.5 rounded-lg transition-colors ${isActive ? 'text-amber-600' : 'text-gray-300'}`}>
          {({ isActive }) => (
            <>
              <Icon size={19} strokeWidth={isActive ? 2.4 : 2.1} className={isActive ? 'scale-110 transition-transform' : 'transition-transform'} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
