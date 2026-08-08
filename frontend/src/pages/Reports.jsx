import { useState } from 'react';
import { api } from '../api';

export default function Reports() {
  const [filters, setFilters] = useState({ category: '', stage: '', source: '', banker: '', from: '', to: '' });
  const [results, setResults] = useState(null);

  const run = async () => {
    const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>
      <div className="bg-white border rounded-lg p-4 mb-4 flex gap-3 flex-wrap items-end text-sm">
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
        <div><label className="block text-xs text-gray-500">Bank</label>
          <input value={filters.banker} onChange={e => setFilters(f => ({ ...f, banker: e.target.value }))} className="input" /></div>
        <div><label className="block text-xs text-gray-500">From</label>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="input" /></div>
        <div><label className="block text-xs text-gray-500">To</label>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="input" /></div>
        <button onClick={run} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Run Report</button>
        {results && <button onClick={exportCsv} className="border px-4 py-2 rounded-md text-sm">Export CSV</button>}
      </div>

      {results && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="p-3">Lead</th><th>Category</th><th>Amount</th><th>Stage</th><th>Source</th><th>Bank</th></tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.lead_name}</td><td>{r.loan_category}</td>
                  <td>₹{Number(r.loan_amount || 0).toLocaleString('en-IN')}</td>
                  <td>{r.current_stage}</td><td>{r.source}</td><td>{r.bank_name || '-'}</td>
                </tr>
              ))}
              {results.length === 0 && <tr><td colSpan={6} className="p-3 text-gray-400">No matching records</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
