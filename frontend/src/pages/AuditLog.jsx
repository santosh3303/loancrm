import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [tableFilter, setTableFilter] = useState('');

  const load = () => api.getAuditLog(tableFilter ? { table_name: tableFilter } : null).then(setLogs);
  useEffect(() => { load(); }, [tableFilter]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Change History</h1>
      <div className="mb-4">
        <select value={tableFilter} onChange={e => setTableFilter(e.target.value)} className="input w-64">
          <option value="">All records</option>
          <option value="contacts">Contacts (Leads/Connectors/Bankers)</option>
          <option value="loan_files">Loan Files</option>
        </select>
      </div>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">When</th><th>Record</th><th>Field</th><th>Old Value</th><th>New Value</th></tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-t">
                <td className="p-3 text-xs text-gray-500">{l.changed_at}</td>
                <td>{l.table_name} #{l.record_id}</td>
                <td>{l.field_changed}</td>
                <td className="text-gray-500">{l.old_value}</td>
                <td>{l.new_value}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="p-3 text-gray-400">No changes recorded yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
