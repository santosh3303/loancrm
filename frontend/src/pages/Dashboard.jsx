import { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';

const DEFAULT_WIDGETS = ['stats', 'pipeline', 'today', 'queries'];
const WIDGET_LABELS = { stats: 'Summary Stats', pipeline: 'Pipeline by Stage', today: "Today's Follow-ups", queries: 'Open Queries' };
const STORAGE_KEY = 'loan_crm_dashboard_layout';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch { return DEFAULT_WIDGETS; }
  });
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => { api.getDashboard().then(setData); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)); }, [widgets]);

  const toggleWidget = (w) => {
    setWidgets(cur => cur.includes(w) ? cur.filter(x => x !== w) : [...cur, w]);
  };
  const move = (w, dir) => {
    setWidgets(cur => {
      const i = cur.indexOf(w);
      const j = i + dir;
      if (j < 0 || j >= cur.length) return cur;
      const copy = [...cur];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button onClick={() => setCustomizing(c => !c)} className="text-sm border px-3 py-1.5 rounded-md">
          {customizing ? 'Done' : 'Customize'}
        </button>
      </div>

      {customizing && (
        <div className="bg-white border rounded-lg p-4 text-sm space-y-2">
          <p className="text-xs text-gray-500 mb-2">Show/hide widgets and reorder them. Your layout is remembered on this device.</p>
          {DEFAULT_WIDGETS.map(w => (
            <div key={w} className="flex items-center gap-3">
              <input type="checkbox" checked={widgets.includes(w)} onChange={() => toggleWidget(w)} />
              <span className="flex-1">{WIDGET_LABELS[w]}</span>
              {widgets.includes(w) && (
                <>
                  <button onClick={() => move(w, -1)} className="text-xs px-2 py-0.5 border rounded">↑</button>
                  <button onClick={() => move(w, 1)} className="text-xs px-2 py-0.5 border rounded">↓</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {widgets.includes('stats') && (
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Open Leads" value={data.openLeads} />
          <Stat label="Active Files" value={data.activeFiles} />
          <Stat label="Overdue Follow-ups" value={data.overdueFollowUps} warn={data.overdueFollowUps > 0} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {widgets.includes('pipeline') && (
          <Card title="Pipeline by Stage">
            {data.pipeline.length === 0 && <p className="text-gray-400 text-sm">No files yet</p>}
            {data.pipeline.map(p => (
              <div key={p.current_stage} className="flex justify-between text-sm py-1 border-b">
                <span>{p.current_stage}</span><span className="font-medium">{p.c}</span>
              </div>
            ))}
          </Card>
        )}

        {widgets.includes('today') && (
          <Card title="Today's Follow-ups">
            {data.todayFollowUps.length === 0 && <p className="text-gray-400 text-sm">Nothing due today</p>}
            {data.todayFollowUps.map(f => (
              <div key={f.id} className="text-sm py-1 border-b">
                <span className="font-medium">{f.party_type}</span> — {f.method} {f.notes ? `(${f.notes})` : ''}
              </div>
            ))}
          </Card>
        )}

        {widgets.includes('queries') && (
          <Card title="Open Queries">
            {data.openQueries.length === 0 && <p className="text-gray-400 text-sm">No open queries</p>}
            {data.openQueries.map(q => (
              <div key={q.id} className="text-sm py-1 border-b">
                <span className={`font-medium ${q.priority === 'High' ? 'text-red-600' : ''}`}>{q.priority}</span> — {q.description}
                <Link to={`/loan-files/${q.loan_file_id}`} className="text-blue-600 ml-1">view</Link>
              </div>
            ))}
          </Card>
        )}
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
