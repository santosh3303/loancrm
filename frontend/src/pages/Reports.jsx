import { useState } from 'react';
import { api } from '../api';

export default function Reports() {
  const [filters, setFilters] = useState({ category: '', stage: '', source: '', banker: '', status: '', from: '', to: '', sort_by: 'date', sort_dir: 'desc', group_by_month: false });
  const [results, setResults] = useState(null);
  const [grouped, setGrouped] = useState(null);

  const run = async () => {
    const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== false));
    const data = await api.getReport(clean);
    if (data.grouped) { setGrouped(data.months); setResults(null); }
    else { setResults(data); setGrouped(null); }
  };

  const flatResults = () => results || Object.values(grouped || {}).flat();

  const exportCsv = () => {
    const rows = flatResults();
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csvRows = rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'loan_files_report.csv'; a.click();
  };

  const exportPdf = () => {
    const rows = flatResults();
    if (!rows.length) return;
    const rowsHtml = rows.map(r => `
      <tr><td>${r.lead_name}</td><td>${r.loan_category}</td><td>₹${Number(r.loan_amount || 0).toLocaleString('en-IN')}</td>
      <td>${r.current_stage}</td><td>${r.source}</td><td>${r.bank_name || '-'}</td></tr>`).join('');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Loan Files Report</title>
      <style>
        body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;font-size:13px;}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;} th{background:#f4f5f7;}
      </style></head><body>
      <h2>Loan Files Report</h2>
      <p>Generated ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>Lead</th><th>Category</th><th>Amount</th><th>Stage</th><th>Source</th><th>Bank</th></tr></thead>
      <tbody>${rowsHtml}</tbody></table>
      <script>window.print();</script>
      </body></html>`);
    win.document.close();
  };

  const Row = ({ r }) => (
    <tr className="border-t">
      <td className="p-3">{r.lead_name}</td><td>{r.loan_category}</td>
      <td>₹{Number(r.loan_amount || 0).toLocaleString('en-IN')}</td>
      <td>{r.current_stage}</td><td>{r.source}</td><td>{r.qualification_status || '-'}</td><td>{r.bank_name || '-'}</td>
    </tr>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-display font-semibold text-navy-700 mb-4">Reports</h1>
      <div className="card p-4 mb-4 flex gap-3 flex-wrap items-end text-sm">
        <div><label className="block text-xs text-gray-500">Category</label>
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="input">
            <option value="">Any</option>{['Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'].map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div><label className="block text-xs text-gray-500">Stage</label>
          <input value={filters.stage} onChange={e => setFilters(f => ({ ...f, stage: e.target.value }))} className="input" /></div>
        <div><label className="block text-xs text-gray-500">Source</label>
          <select value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))} className="input">
            <option value="">Any</option>{['FB Ads', 'Referral', 'Direct'].map(s => <option key={s}>{s}</option>)}
          </select></div>
        <div><label className="block text-xs text-gray-500">Lead Status</label>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input">
            <option value="">Any</option>{['Valid', 'Eligible', 'Not Eligible', 'No Response', 'Invalid'].map(s => <option key={s}>{s}</option>)}
          </select></div>
        <div><label className="block text-xs text-gray-500">Bank</label>
          <input value={filters.banker} onChange={e => setFilters(f => ({ ...f, banker: e.target.value }))} className="input" /></div>
        <div><label className="block text-xs text-gray-500">From</label>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="input" /></div>
        <div><label className="block text-xs text-gray-500">To</label>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="input" /></div>
        <div><label className="block text-xs text-gray-500">Sort By</label>
          <select value={filters.sort_by} onChange={e => setFilters(f => ({ ...f, sort_by: e.target.value }))} className="input">
            <option value="date">Date</option><option value="amount">Amount</option><option value="stage">Stage</option><option value="name">Lead Name</option>
          </select></div>
        <div><label className="block text-xs text-gray-500">Direction</label>
          <select value={filters.sort_dir} onChange={e => setFilters(f => ({ ...f, sort_dir: e.target.value }))} className="input">
            <option value="desc">Newest/Highest first</option><option value="asc">Oldest/Lowest first</option>
          </select></div>
        <label className="flex items-center gap-1 text-xs text-gray-600 mb-2">
          <input type="checkbox" checked={filters.group_by_month} onChange={e => setFilters(f => ({ ...f, group_by_month: e.target.checked }))} />
          Group by month
        </label>
        <button onClick={run} className="btn-primary">Run Report</button>
        {(results || grouped) && <button onClick={exportCsv} className="btn-secondary">Export CSV</button>}
        {(results || grouped) && <button onClick={exportPdf} className="btn-secondary">Export PDF</button>}
      </div>

      {results && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy-50/40 text-left text-navy-700/70">
              <tr><th className="p-3">Lead</th><th>Category</th><th>Amount</th><th>Stage</th><th>Source</th><th>Lead Status</th><th>Bank</th></tr>
            </thead>
            <tbody>
              {results.map(r => <Row key={r.id} r={r} />)}
              {results.length === 0 && <tr><td colSpan={7} className="p-3 text-gray-400">No matching records</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {grouped && Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([month, rows]) => (
        <div key={month} className="mb-4">
          <h3 className="font-medium text-sm mb-1">{month} — {rows.length} file(s)</h3>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-navy-50/40 text-left text-navy-700/70">
                <tr><th className="p-3">Lead</th><th>Category</th><th>Amount</th><th>Stage</th><th>Source</th><th>Lead Status</th><th>Bank</th></tr>
              </thead>
              <tbody>{rows.map(r => <Row key={r.id} r={r} />)}</tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
