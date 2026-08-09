import { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { Sparkles, SlidersHorizontal, TrendingUp, Clock, AlertCircle } from 'lucide-react';

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
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { api.getDashboard().then(setData); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)); }, [widgets]);

  const loadSampleData = async () => {
    if (!confirm('This will add sample leads, loan files, and contacts to explore the app. It will NOT delete anything you already have. Continue?')) return;
    setSeeding(true);
    try {
      await api.seedDemoData();
      setData(await api.getDashboard());
      alert('Sample data added! Explore Leads, Loan Files, and Contacts to see it.');
    } catch (e) {
      alert('Something went wrong adding sample data: ' + e.message);
    }
    setSeeding(false);
  };

  const toggleWidget = (w) => setWidgets(cur => cur.includes(w) ? cur.filter(x => x !== w) : [...cur, w]);
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

  if (!data) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-display font-semibold text-navy-700">Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={loadSampleData} disabled={seeding} className="btn-secondary flex items-center gap-1.5">
            <Sparkles size={14} /> {seeding ? 'Loading...' : 'Load Sample Data'}
          </button>
          <button onClick={() => setCustomizing(c => !c)} className="btn-secondary flex items-center gap-1.5">
            <SlidersHorizontal size={14} /> {customizing ? 'Done' : 'Customize'}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">Your day, at a glance.</p>

      {customizing && (
        <div className="card p-4 text-sm space-y-2 mb-6 animate-fade-in">
          <p className="text-xs text-gray-400 mb-2">Show/hide widgets and reorder them. Remembered on this device.</p>
          {DEFAULT_WIDGETS.map(w => (
            <div key={w} className="flex items-center gap-3">
              <input type="checkbox" checked={widgets.includes(w)} onChange={() => toggleWidget(w)} className="accent-amber-600" />
              <span className="flex-1 text-navy-700">{WIDGET_LABELS[w]}</span>
              {widgets.includes(w) && (
                <>
                  <button onClick={() => move(w, -1)} className="text-xs px-2 py-0.5 border rounded-md hover:bg-navy-50">↑</button>
                  <button onClick={() => move(w, 1)} className="text-xs px-2 py-0.5 border rounded-md hover:bg-navy-50">↓</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {widgets.includes('stats') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Stat icon={TrendingUp} label="Open Leads" value={data.openLeads} />
          <Stat icon={Clock} label="Active Files" value={data.activeFiles} />
          <Stat icon={AlertCircle} label="Overdue Follow-ups" value={data.overdueFollowUps} warn={data.overdueFollowUps > 0} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {widgets.includes('pipeline') && (
          <Card title="Pipeline by Stage">
            {data.pipeline.length === 0 && <Empty text="No files yet" />}
            {data.pipeline.map(p => (
              <div key={p.current_stage} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <span className="text-navy-700">{p.current_stage}</span>
                <span className="font-semibold text-navy-500">{p.c}</span>
              </div>
            ))}
          </Card>
        )}

        {widgets.includes('today') && (
          <Card title="Today's Follow-ups" link="/tasks">
            {data.todayFollowUps.length === 0 && <Empty text="Nothing due today" />}
            {data.todayFollowUps.map(f => (
              <div key={f.id} className="text-sm py-2 border-b border-gray-50 last:border-0">
                <span className="font-medium text-navy-700">{f.party_type}</span>
                <span className="text-gray-400"> — {f.method} {f.notes ? `(${f.notes})` : ''}</span>
              </div>
            ))}
          </Card>
        )}

        {widgets.includes('queries') && (
          <Card title="Open Queries">
            {data.openQueries.length === 0 && <Empty text="No open queries" />}
            {data.openQueries.map(q => (
              <div key={q.id} className="text-sm py-2 border-b border-gray-50 last:border-0">
                <span className={`font-medium ${q.priority === 'High' ? 'text-red-600' : 'text-navy-700'}`}>{q.priority}</span>
                <span className="text-gray-500"> — {q.description}</span>
                <Link to={`/loan-files/${q.loan_file_id}`} className="text-amber-700 ml-1 hover:underline">view</Link>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, warn }) {
  return (
    <div className={`card p-5 ${warn ? 'border-red-200' : ''}`}>
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
        <Icon size={15} /> {label}
      </div>
      <div className={`text-3xl font-display font-semibold ${warn ? 'text-red-600' : 'text-navy-700'}`}>{value}</div>
    </div>
  );
}

function Card({ title, children, link }) {
  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium text-navy-700 text-sm">{title}</div>
        {link && <Link to={link} className="text-xs text-amber-700 hover:underline">view all</Link>}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-gray-300 text-sm py-4 text-center">{text}</p>;
}
