import { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';

export default function LoanFiles() {
  const [files, setFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [leadQuery, setLeadQuery] = useState('');
  const [leadMatches, setLeadMatches] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [form, setForm] = useState({ loan_category: 'Home Loan', loan_subcategory: 'Fresh', loan_amount: '', bank_name: '', property_category: '', property_type: '' });
  const debounceRef = useRef();

  const load = () => api.getLoanFiles().then(setFiles);
  useEffect(() => { load(); }, []);

  const handleLeadSearch = (v) => {
    setLeadQuery(v); setSelectedLead(null);
    clearTimeout(debounceRef.current);
    if (v.length < 2) { setLeadMatches([]); return; }
    debounceRef.current = setTimeout(async () => setLeadMatches(await api.searchContacts(v, 'lead')), 300);
  };

  const submit = async () => {
    if (!selectedLead) return alert('Please select an existing lead first.');
    await api.createLoanFile({ lead_contact_id: selectedLead.id, ...form, loan_amount: Number(form.loan_amount) || null });
    setShowForm(false); setSelectedLead(null); setLeadQuery('');
    load();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Loan Files</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">+ New Loan File</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Lead</th><th>Category</th><th>Amount</th><th>Bank</th><th>Stage</th><th></th></tr>
          </thead>
          <tbody>
            {files.map(f => (
              <tr key={f.id} className="border-t">
                <td className="p-3">{f.lead_name}</td>
                <td>{f.loan_category} {f.loan_subcategory ? `(${f.loan_subcategory})` : ''}</td>
                <td>{f.loan_amount ? `₹${Number(f.loan_amount).toLocaleString('en-IN')}` : '-'}</td>
                <td>{f.bank_name || '-'}</td>
                <td><span className="px-2 py-0.5 rounded bg-gray-100">{f.current_stage}</span></td>
                <td><Link to={`/loan-files/${f.id}`} className="text-blue-600">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">New Loan File</h2>

            <Field label="Lead *">
              <input value={leadQuery} onChange={e => handleLeadSearch(e.target.value)} className="input" placeholder="Search existing lead by name/mobile" />
              {selectedLead && <div className="text-xs text-green-700 mt-1">Selected: {selectedLead.name} ({selectedLead.mobile})</div>}
              {leadMatches.length > 0 && (
                <div className="border border-blue-200 bg-blue-50 rounded p-2 mt-1 text-xs space-y-1">
                  {leadMatches.map(m => (
                    <div key={m.id} className="flex justify-between">
                      <span>{m.name} — {m.mobile}</span>
                      <button onClick={() => { setSelectedLead(m); setLeadQuery(m.name); setLeadMatches([]); }} className="text-blue-700 underline">Select</button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Loan Category">
                <select value={form.loan_category} onChange={e => setForm(f => ({ ...f, loan_category: e.target.value }))} className="input">
                  {['Home Loan', 'Mortgage Loan', 'Personal Loan', 'Business Loan', 'Others'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Sub-category">
                <select value={form.loan_subcategory} onChange={e => setForm(f => ({ ...f, loan_subcategory: e.target.value }))} className="input">
                  {['Fresh', 'Resell', 'BT', 'BT+TopUp', 'N/A'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Loan Amount"><input type="number" value={form.loan_amount} onChange={e => setForm(f => ({ ...f, loan_amount: e.target.value }))} className="input" /></Field>
            <Field label="Bank Name"><input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} className="input" placeholder="e.g. HDFC (leave blank for Generic)" /></Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Property Category">
                <select value={form.property_category} onChange={e => setForm(f => ({ ...f, property_category: e.target.value }))} className="input">
                  <option value="">-</option>
                  {['Corporation', 'Gram Panchayat', 'Gaothan', 'Chawl'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Property Type">
                <select value={form.property_type} onChange={e => setForm(f => ({ ...f, property_type: e.target.value }))} className="input">
                  <option value="">-</option>
                  {['Residential Flat', 'Plot', 'Bungalow', 'Commercial Gala', 'Godown'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
              <button onClick={submit} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white">Create File</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">{label}</label>{children}</div>;
}
