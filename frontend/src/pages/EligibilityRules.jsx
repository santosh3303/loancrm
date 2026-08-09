import { useEffect, useState } from 'react';
import { api } from '../api';

const CATEGORIES = ['Any', 'Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'];

export default function EligibilityRules() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({ loan_category: 'Any', condition_type: 'min_cibil', threshold: '', message: '' });

  useEffect(() => { refresh(); }, []);
  const refresh = () => api.getEligibilityRules().then(setRules);

  const add = async () => {
    if (!form.threshold || !form.message) return;
    await api.addEligibilityRule({ ...form, threshold: Number(form.threshold) });
    setForm({ loan_category: 'Any', condition_type: 'min_cibil', threshold: '', message: '' });
    refresh();
  };
  const toggleActive = async (r) => { await api.updateEligibilityRule(r.id, { active: !r.active }); refresh(); };
  const remove = async (id) => { await api.deleteEligibilityRule(id); refresh(); };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-1">Eligibility Rules</h1>
      <p className="text-sm text-gray-500 mb-4">These drive the auto-suggested "key points to discuss" on each Loan File's Banker Discussion Summary.</p>

      <div className="bg-white border rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Category</th><th>Condition</th><th>Threshold</th><th>Message</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.loan_category}</td>
                <td>{r.condition_type === 'min_cibil' ? 'Min CIBIL' : 'Max Loan-to-Income Ratio'}</td>
                <td>{r.threshold}{r.condition_type === 'max_loan_to_income_ratio' ? 'x' : ''}</td>
                <td>{r.message}</td>
                <td><input type="checkbox" checked={!!r.active} onChange={() => toggleActive(r)} /></td>
                <td><button onClick={() => remove(r.id)} className="text-xs text-red-600">Remove</button></td>
              </tr>
            ))}
            {rules.length === 0 && <tr><td colSpan={6} className="p-3 text-gray-400">No rules yet</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-lg p-4 flex gap-2 items-end flex-wrap text-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Loan Category</label>
          <select value={form.loan_category} onChange={e => setForm(f => ({ ...f, loan_category: e.target.value }))} className="input">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Condition</label>
          <select value={form.condition_type} onChange={e => setForm(f => ({ ...f, condition_type: e.target.value }))} className="input">
            <option value="min_cibil">Min CIBIL</option>
            <option value="max_loan_to_income_ratio">Max Loan-to-Income Ratio</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Threshold</label>
          <input type="number" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} className="input" placeholder={form.condition_type === 'min_cibil' ? 'e.g. 700' : 'e.g. 6'} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Message shown when triggered</label>
          <input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="input" />
        </div>
        <button onClick={add} className="bg-blue-600 text-white text-xs px-3 py-2 rounded">Add Rule</button>
      </div>
    </div>
  );
}
