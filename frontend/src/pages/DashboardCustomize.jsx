import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '../components/Toast';

export const STAT_KEYS = ['openLeads', 'activeFiles', 'overdueFollowUps', 'openQueriesCount', 'bizValue', 'logins', 'sanctions', 'disb'];
export const STAT_LABELS = { openLeads: 'Leads', activeFiles: 'Files', overdueFollowUps: 'Overdue', openQueriesCount: 'Queries', bizValue: 'Biz Value', logins: 'Logins', sanctions: 'Sanctions', disb: 'Disb.' };
export const STATS_STORAGE_KEY = 'loan_crm_dashboard_stats';

export const FILTER_KEYS = ['Call', 'Visit', 'WhatsApp', 'Backend'];
export const FILTERS_STORAGE_KEY = 'loan_crm_task_filters';

export function getEnabledStats() {
  try {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : STAT_KEYS;
  } catch { return STAT_KEYS; }
}
export function getEnabledFilters() {
  try {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : FILTER_KEYS;
  } catch { return FILTER_KEYS; }
}

export default function DashboardCustomize() {
  const [stats, setStats] = useState(getEnabledStats());
  const [filters, setFilters] = useState(getEnabledFilters());
  const toast = useToast();

  const toggleStat = (key) => setStats(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);
  const toggleFilter = (key) => setFilters(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);

  const save = () => {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    toast('Dashboard customization saved.', 'success');
  };

  return (
    <div className="p-4 pb-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/settings" className="text-navy-500"><ChevronLeft size={22} /></Link>
        <h1 className="font-display text-xl font-bold text-navy-900">Dashboard Customization</h1>
      </div>

      <div className="text-[13.5px] font-bold text-navy-900 mb-1">Stat Cards</div>
      <p className="text-[11px] text-gray-400 mb-2.5">Choose which stat cards appear on your Dashboard.</p>
      <div className="card p-0.5">
        {STAT_KEYS.map(key => (
          <label key={key} className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 last:border-0 text-[13px] font-medium text-navy-900">
            <input type="checkbox" checked={stats.includes(key)} onChange={() => toggleStat(key)} className="w-[17px] h-[17px] accent-amber-500" />
            {STAT_LABELS[key]}
          </label>
        ))}
      </div>

      <div className="text-[13.5px] font-bold text-navy-900 mt-6 mb-1">Today's Tasks Filter Pills</div>
      <p className="text-[11px] text-gray-400 mb-2.5">Choose which filter pills appear on Dashboard & Daily Operations.</p>
      <div className="card p-0.5">
        <label className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 text-[13px] font-medium text-navy-900">
          <input type="checkbox" checked disabled className="w-[17px] h-[17px] accent-amber-500" />
          All <span className="text-gray-300 text-[11px]">(always shown)</span>
        </label>
        {FILTER_KEYS.map(key => (
          <label key={key} className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 last:border-0 text-[13px] font-medium text-navy-900">
            <input type="checkbox" checked={filters.includes(key)} onChange={() => toggleFilter(key)} className="w-[17px] h-[17px] accent-amber-500" />
            {key}
          </label>
        ))}
      </div>

      <button onClick={save} className="btn-primary w-full mt-6">Save Changes</button>
    </div>
  );
}
