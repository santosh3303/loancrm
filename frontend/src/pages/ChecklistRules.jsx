import { useEffect, useState } from 'react';
import { api } from '../api';

const CATEGORIES = ['Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'];
const TIERS = ['Full Set', 'KYC Only'];
const PROPERTY_TYPES = ['Residential Flat', 'Plot', 'Bungalow', 'Commercial Gala', 'Godown'];
const PROFILE_TYPES = ['Salaried', 'Self-employed', 'Business'];

export default function ChecklistRules() {
  const [banks, setBanks] = useState([]);
  const [bank, setBank] = useState('Generic');
  const [category, setCategory] = useState('Home Loan');
  const [rules, setRules] = useState([]);
  const [newDoc, setNewDoc] = useState({ document_name: '', document_tier: 'Full Set', applies_to_common: false, property_type: '', profile_type: '' });
  const [newBankName, setNewBankName] = useState('');

  const loadBanks = () => api.getChecklistBanks().then(setBanks);
  const loadRules = () => api.getChecklistRules({ bank_name: bank, loan_category: category }).then(setRules);

  useEffect(() => { loadBanks(); }, []);
  useEffect(() => { loadRules(); }, [bank, category]);

  const addRule = async () => {
    if (!newDoc.document_name) return;
    await api.addChecklistRule({ bank_name: bank, loan_category: category, ...newDoc });
    setNewDoc({ document_name: '', document_tier: 'Full Set', applies_to_common: false, property_type: '', profile_type: '' });
    loadRules();
  };
  const removeRule = async (id) => { await api.deleteChecklistRule(id); loadRules(); };

  const createBank = async () => {
    if (!newBankName) return;
    await api.copyBankRules({ new_bank_name: newBankName, from_bank_name: 'Generic' });
    setNewBankName('');
    await loadBanks();
    setBank(newBankName);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-display font-semibold text-navy-700 mb-1">Document Checklist Rules</h1>
      <p className="text-sm text-gray-500 mb-4">Edit which documents are required per bank, loan category, and applicant tier. These power the auto-generated Required Docs List on each Loan File.</p>

      <div className="card p-4 mb-4 flex gap-3 items-end flex-wrap text-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bank</label>
          <select value={bank} onChange={e => setBank(e.target.value)} className="input">
            {banks.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Loan Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="input">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="border-l pl-3 ml-2 flex gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Add a new bank (copies Generic list to start from)</label>
            <input value={newBankName} onChange={e => setNewBankName(e.target.value)} placeholder="e.g. HDFC" className="input" />
          </div>
          <button onClick={createBank} className="btn-primary text-xs px-3 py-2">Add Bank</button>
        </div>
      </div>

      <div className="card overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-navy-50/40 text-left text-navy-700/70"><tr><th className="p-3">Document</th><th>Tier</th><th>Only if Property</th><th>Only if Profile</th><th>Common (once per file)</th><th></th></tr></thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.document_name}</td>
                <td>{r.document_tier}</td>
                <td>{r.property_type || <span className="text-gray-400">any</span>}</td>
                <td>{r.profile_type || <span className="text-gray-400">any</span>}</td>
                <td>{r.applies_to_common ? 'Yes' : 'No'}</td>
                <td><button onClick={() => removeRule(r.id)} className="text-xs text-red-600">Remove</button></td>
              </tr>
            ))}
            {rules.length === 0 && <tr><td colSpan={6} className="p-3 text-gray-400">No rules yet for this bank/category</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card p-4 flex gap-2 items-end flex-wrap text-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Document Name</label>
          <input value={newDoc.document_name} onChange={e => setNewDoc(d => ({ ...d, document_name: e.target.value }))} className="input" placeholder="e.g. Bank Statement (12 months)" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Applies To</label>
          <select value={newDoc.document_tier} onChange={e => setNewDoc(d => ({ ...d, document_tier: e.target.value }))} className="input">
            {TIERS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1 text-xs text-gray-600 mb-2">
          <input type="checkbox" checked={newDoc.applies_to_common} onChange={e => setNewDoc(d => ({ ...d, applies_to_common: e.target.checked }))} />
          Common (once per file, not per applicant)
        </label>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Only if Property Type (optional)</label>
          <select value={newDoc.property_type} onChange={e => setNewDoc(d => ({ ...d, property_type: e.target.value }))} className="input">
            <option value="">Any property type</option>
            {PROPERTY_TYPES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Only if Profile (Main Applicant only, optional)</label>
          <select value={newDoc.profile_type} onChange={e => setNewDoc(d => ({ ...d, profile_type: e.target.value }))} className="input">
            <option value="">Any profile</option>
            {PROFILE_TYPES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <button onClick={addRule} className="btn-primary text-xs px-3 py-2">Add Document</button>
      </div>
    </div>
  );
}
