import { useState } from 'react';
import { api } from '../api';

const FILTER_TABS = ['category', 'stage', 'source', 'date'];

export default function Reporting() {
  const [filters, setFilters] = useState({ category: '', stage: '', source: '', status: '', from: '', to: '', sort_by: 'date', sort_dir: 'desc' });
  const [openFilter, setOpenFilter] = useState(null);
  const [results, setResults] = useState(null);

  const run = async () => {
    const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
    setResults(await api.getReport(clean));
  };

  const exportCsv = () => {
    if (!results || !results.length) return;
    const headers = Object.keys(results[0]);
    const rows = results.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'loan_files_report.csv'; a.click();
  };

  const exportPdf = () => {
    if (!results || !results.length) return;
    const rowsHtml = results.map(r => `<tr><td>${r.lead_name}</td><td>${r.loan_category}</td><td>₹${Number(r.loan_amount || 0).toLocaleString('en-IN')}</td><td>${r.current_stage}</td></tr>`).join('');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Report</title><style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;font-size:13px;}th,td{border:1px solid #ccc;padding:6px 8px;}</style></head><body><h2>Loan Files Report</h2><table><thead><tr><th>Lead</th><th>Category</th><th>Amount</th><th>Stage</th></tr></thead><tbody>${rowsHtml}</tbody></table><script>window.print()</script></body></html>`);
    win.document.close();
  };

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="p-4 pb-6 animate-fade-in">
      <h1 className="font-display text-xl font-bold text-navy-900 mb-4">Reporting</h1>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
        {FILTER_TABS.map(f => (
          <button key={f} onClick={() => setOpenFilter(openFilter === f ? null : f)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold capitalize transition-colors ${openFilter === f ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>
            {f}
          </button>
        ))}
        <button onClick={run} className="shrink-0 btn-primary text-[12.5px] px-4 py-1.5">Run</button>
      </div>

      {openFilter === 'category' && (
        <div className="card p-3 mb-3 flex gap-2 flex-wrap">
          {['', 'Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'].map(c => (
            <button key={c} onClick={() => set('category', c)} className={`text-xs px-3 py-1.5 rounded-full ${filters.category === c ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-500'}`}>{c || 'Any'}</button>
          ))}
        </div>
      )}
      {openFilter === 'stage' && (
        <div className="card p-3 mb-3"><input value={filters.stage} onChange={e => set('stage', e.target.value)} className="input" placeholder="e.g. Credit PD" /></div>
      )}
      {openFilter === 'source' && (
        <div className="card p-3 mb-3 flex gap-2 flex-wrap">
          {['', 'FB Ads', 'Referral', 'Direct'].map(s => (
            <button key={s} onClick={() => set('source', s)} className={`text-xs px-3 py-1.5 rounded-full ${filters.source === s ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-500'}`}>{s || 'Any'}</button>
          ))}
        </div>
      )}
      {openFilter === 'date' && (
        <div className="card p-3 mb-3 flex gap-2">
          <input type="date" value={filters.from} onChange={e => set('from', e.target.value)} className="input" />
          <input type="date" value={filters.to} onChange={e => set('to', e.target.value)} className="input" />
        </div>
      )}

      {results && results.map(r => (
        <div key={r.id} className="card p-3.5 mb-2.5">
          <div className="font-semibold text-navy-900 text-[13.5px] mb-2">{r.lead_name}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
            <span className="text-gray-400">Category</span><span className="font-semibold text-right">{r.loan_category}</span>
            <span className="text-gray-400">Amount</span><span className="font-semibold text-right">₹{Number(r.loan_amount || 0).toLocaleString('en-IN')}</span>
            <span className="text-gray-400">Stage</span><span className="font-semibold text-right">{r.current_stage}</span>
            <span className="text-gray-400">Source</span><span className="font-semibold text-right">{r.source}</span>
          </div>
        </div>
      ))}
      {results && results.length === 0 && <p className="text-center text-gray-300 text-sm py-10">No matching records</p>}

      {results && results.length > 0 && (
        <div className="flex gap-2 mt-4">
          <button onClick={exportCsv} className="btn-secondary flex-1">Export CSV</button>
          <button onClick={exportPdf} className="btn-secondary flex-1">Export PDF</button>
        </div>
      )}
    </div>
  );
}
