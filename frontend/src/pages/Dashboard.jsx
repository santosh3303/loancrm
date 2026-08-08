import { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.getDashboard().then(setData); }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Open Leads" value={data.openLeads} />
        <Stat label="Active Files" value={data.activeFiles} />
        <Stat label="Overdue Follow-ups" value={data.overdueFollowUps} warn={data.overdueFollowUps > 0} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Pipeline by Stage">
          {data.pipeline.length === 0 && <p className="text-gray-400 text-sm">No files yet</p>}
          {data.pipeline.map(p => (
            <div key={p.current_stage} className="flex justify-between text-sm py-1 border-b">
              <span>{p.current_stage}</span><span className="font-medium">{p.c}</span>
            </div>
          ))}
        </Card>

        <Card title="Today's Follow-ups">
          {data.todayFollowUps.length === 0 && <p className="text-gray-400 text-sm">Nothing due today</p>}
          {data.todayFollowUps.map(f => (
            <div key={f.id} className="text-sm py-1 border-b">
              <span className="font-medium">{f.party_type}</span> — {f.method} {f.notes ? `(${f.notes})` : ''}
            </div>
          ))}
        </Card>

        <Card title="Open Queries">
          {data.openQueries.length === 0 && <p className="text-gray-400 text-sm">No open queries</p>}
          {data.openQueries.map(q => (
            <div key={q.id} className="text-sm py-1 border-b">
              <span className={`font-medium ${q.priority === 'High' ? 'text-red-600' : ''}`}>{q.priority}</span> — {q.description}
              <Link to={`/loan-files/${q.loan_file_id}`} className="text-blue-600 ml-1">view</Link>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div className={`rounded-lg p-4 bg-white shadow-sm border ${warn ? 'border-red-300' : 'border-gray-200'}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-3xl font-semibold ${warn ? 'text-red-600' : ''}`}>{value}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-lg p-4 bg-white shadow-sm border border-gray-200">
      <div className="font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}
