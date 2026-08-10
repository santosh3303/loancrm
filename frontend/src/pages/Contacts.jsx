import { useEffect, useState } from 'react';
import { api } from '../api';
import ContactActions from '../components/ContactActions';

export default function Contacts() {
  const [role, setRole] = useState('connector');
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '' });
  const [perf, setPerf] = useState(null);

  const load = () => api.getContacts(role).then(setContacts);
  useEffect(() => { load(); setPerf(null); }, [role]);

  const submit = async () => { await api.createContact({ role, ...form }); setForm({ name: '', mobile: '' }); setShowForm(false); load(); };
  const viewPerf = async (id) => setPerf(await api.getConnectorPerformance(id));

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button onClick={() => setRole('connector')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${role === 'connector' ? 'bg-navy-500 text-white' : 'bg-white border border-gray-200 text-navy-700/70 hover:bg-navy-50'}`}>Connectors</button>
          <button onClick={() => setRole('banker')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${role === 'banker' ? 'bg-navy-500 text-white' : 'bg-white border border-gray-200 text-navy-700/70 hover:bg-navy-50'}`}>Bankers</button>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ New {role === 'connector' ? 'Connector' : 'Banker'}</button>
      </div>

      <div className="card overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-navy-50/40 text-left text-navy-700/70"><tr><th className="p-3">Name</th><th>Mobile</th><th></th></tr></thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id} className="border-t border-gray-50 hover:bg-navy-50/30 transition-colors">
                <td className="p-3">{c.name}</td><td>{c.mobile}</td>
                <td className="flex gap-3 items-center py-2">
                  <ContactActions mobile={c.mobile} />
                  {role === 'connector' && <button onClick={() => viewPerf(c.id)} className="text-xs text-amber-700 hover:underline">Performance</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {perf && (
        <div className="card p-4 text-sm">
          <h3 className="font-medium mb-2">Connector Performance</h3>
          <div className="grid grid-cols-4 gap-4 mb-3">
            <Stat label="Leads Referred" value={perf.leads_referred} />
            <Stat label="Converted to File" value={perf.converted_to_file} />
            <Stat label="Disbursed" value={perf.disbursed} />
            <Stat label="Conversion Rate" value={`${perf.conversion_rate}%`} />
          </div>
          <div className="text-xs text-gray-500">Total Commission Earned: ₹{Number(perf.total_commission_earned).toLocaleString('en-IN')}</div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-card animate-fade-in">
            <h2 className="text-lg font-display font-semibold text-navy-700 mb-4">New {role === 'connector' ? 'Connector' : 'Banker'}</h2>
            <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" /></div>
            <div className="mb-3"><label className="block text-xs text-gray-500 mb-1">Mobile</label>
              <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="input" /></div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={submit} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return <div><div className="text-xs text-gray-500">{label}</div><div className="text-xl font-semibold">{value}</div></div>;
}
