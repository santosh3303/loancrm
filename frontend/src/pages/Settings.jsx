import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const ITEMS = [
  { to: '/settings/checklist-rules', icon: '📄', title: 'Checklist Rules', sub: 'Documents required per bank' },
  { to: '/settings/eligibility-rules', icon: '📊', title: 'Eligibility Rules', sub: 'CIBIL & income checks' },
  { to: '/settings/audit-log', icon: '🕐', title: 'Change History', sub: 'Full audit trail' },
  { to: '/settings/dashboard-customization', icon: '🎛️', title: 'Dashboard Customization', sub: 'Stat cards & task filter pills' },
];

export default function Settings() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const doReset = async () => {
    setBusy(true);
    try {
      await api.resetAndSeed();
      setConfirmOpen(false);
      toast('All data cleared and fresh sample data loaded.', 'success');
    } catch (err) {
      setConfirmOpen(false);
      toast(`Reset failed: ${err.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 pb-6 animate-fade-in">
      <h1 className="font-display text-xl font-bold text-navy-900 mb-4">Settings</h1>
      <div className="card p-1.5">
        {ITEMS.map(item => (
          <Link key={item.to} to={item.to} className="flex items-center gap-3 px-2.5 py-3.5 border-b border-gray-50 last:border-0 active:bg-navy-50 rounded-xl transition-colors">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-navy-50 flex items-center justify-center text-[16px] shrink-0">{item.icon}</div>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-navy-900">{item.title}</div>
              <div className="text-[11px] text-gray-400">{item.sub}</div>
            </div>
            <span className="text-gray-300">›</span>
          </Link>
        ))}
      </div>

      <div className="text-[13.5px] font-bold text-navy-900 mt-6 mb-1">Testing Tools</div>
      <p className="text-[11px] text-gray-400 mb-2.5">Temporary — remove once testing is finished.</p>
      <div className="card p-1.5">
        <div onClick={() => setConfirmOpen(true)} className="flex items-center gap-3 px-2.5 py-3.5 cursor-pointer active:bg-navy-50 rounded-xl transition-colors">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-navy-50 flex items-center justify-center text-[16px] shrink-0">🔄</div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold text-navy-900">Reset &amp; Load Sample Data</div>
            <div className="text-[11px] text-gray-400">Deletes all records, loads fresh samples</div>
          </div>
          <span className="text-gray-300">›</span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Reset & Load Sample Data?"
        message="This permanently deletes ALL Leads, Contacts, Loan Files, Applicants, Tasks, Queries, Communication Log and Change History, then loads fresh sample data. Checklist Rules and Eligibility Rules are kept. This cannot be undone."
        confirmLabel={busy ? 'Resetting...' : 'Yes, delete & reload'}
        onConfirm={busy ? () => {} : doReset}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
