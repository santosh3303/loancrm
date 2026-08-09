import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, CheckSquare, Contact, BarChart3, FileStack, Sliders, History, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const PRIMARY = [
  { to: '/', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/loan-files', icon: FolderKanban, label: 'Loan Files' },
  { to: '/contacts', icon: Contact, label: 'Contacts' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

const SETUP = [
  { to: '/checklist-rules', icon: FileStack, label: 'Checklist Rules' },
  { to: '/eligibility-rules', icon: Sliders, label: 'Eligibility Rules' },
  { to: '/audit-log', icon: History, label: 'Change History' },
];

function NavItem({ to, end, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to} end={end} onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${isActive ? 'bg-navy-500 text-white shadow-soft' : 'text-navy-700/80 hover:bg-navy-50'}`
      }
    >
      <Icon size={18} strokeWidth={2} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const [setupOpen, setSetupOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0 py-5 px-3">
        <div className="px-2 mb-6">
          <span className="font-display font-bold text-lg text-navy-700">Loan CRM</span>
        </div>
        <nav className="flex-1 space-y-1">
          {PRIMARY.map(item => <NavItem key={item.to} {...item} />)}
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
        <button onClick={() => setMobileOpen(true)} className="text-navy-700 text-sm border rounded-lg px-3 py-1.5">Menu</button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/30" onClick={closeMobile}>
          <div className="bg-white w-64 h-full p-4 space-y-1 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="font-display font-bold text-navy-700">Loan CRM</span>
              <button onClick={closeMobile} className="text-gray-400 text-xl leading-none">&times;</button>
            </div>
            {PRIMARY.map(item => <NavItem key={item.to} {...item} onClick={closeMobile} />)}
            <div className="text-xs font-medium text-navy-700/60 px-3 pt-3 pb-1">Setup</div>
            {SETUP.map(item => <NavItem key={item.to} {...item} onClick={closeMobile} />)}
          </div>
        </div>
      )}
    </>
  );
}
