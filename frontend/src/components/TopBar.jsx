import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { api } from '../api';

const SCOPES = ['all', 'leads', 'files', 'contacts', 'tasks'];
const SCOPE_LABELS = { all: 'All', leads: 'Leads', files: 'Files', contacts: 'Contacts', tasks: 'Tasks' };

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [results, setResults] = useState(null);
  const debounceRef = useRef();
  const inputRef = useRef();
  const navigate = useNavigate();

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) setTimeout(() => inputRef.current?.focus(), 180);
    else { setQuery(''); setResults(null); }
  };

  const runSearch = (val, sc) => {
    clearTimeout(debounceRef.current);
    if (!val || val.length < 2) { setResults(null); return; }
    debounceRef.current = setTimeout(async () => {
      const r = await api.search(val, sc === 'all' ? null : sc);
      setResults(r);
    }, 280);
  };

  const onInput = (val) => { setQuery(val); runSearch(val, scope); };
  const onScope = (s) => { setScope(s); runSearch(query, s); };

  const goTo = (path) => { toggle(); navigate(path); };

  const groups = results ? [
    { key: 'leads', label: 'Leads', items: results.leads.map(l => ({ title: l.name, sub: `${l.mobile || ''} · ${l.qualification_status || ''}`, path: `/leads/${l.id}` })) },
    { key: 'files', label: 'Loan Files', items: results.files.map(f => ({ title: f.lead_name, sub: `${f.current_stage} · ${f.bank_name || ''}`, path: `/loan-files/${f.id}` })) },
    { key: 'contacts', label: 'Contacts', items: results.contacts.map(c => ({ title: c.name, sub: `${c.role} · ${c.mobile || ''}`, path: `/master-database?tab=contacts` })) },
    { key: 'tasks', label: 'Tasks', items: results.tasks.map(t => ({ title: t.notes || 'Follow up', sub: `${t.party_type} · Due ${t.due_date}`, path: `/daily-operations` })) },
  ].filter(g => g.items.length) : [];

  return (
    <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-navy-900/5 px-4 py-3.5">
      <div className={`flex justify-between items-center transition-opacity ${open ? 'opacity-0 h-0 pointer-events-none' : ''}`}>
        <span className="font-display font-bold text-[16px] text-navy-900">Loan CRM</span>
        <button onClick={toggle} className="w-[34px] h-[34px] rounded-[10px] bg-navy-900/5 flex items-center justify-center text-navy-500 active:scale-90 transition-transform">
          <Search size={16} strokeWidth={2.3} />
        </button>
      </div>

      <div className={`flex items-center gap-2 overflow-hidden transition-all ${open ? 'max-h-14 mt-0' : 'max-h-0'}`}>
        <div className="flex-1 bg-navy-900/5 rounded-[11px] px-3 py-2.5 flex items-center gap-2">
          <Search size={14} className="text-navy-300 shrink-0" />
          <input ref={inputRef} value={query} onChange={e => onInput(e.target.value)}
            placeholder="Search leads, files, contacts, tasks..."
            className="border-none bg-transparent outline-none flex-1 text-[13.5px] text-navy-900" />
        </div>
        <span onClick={toggle} className="text-[12.5px] font-semibold text-amber-600 shrink-0 cursor-pointer">Cancel</span>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full bg-white/85 backdrop-blur-xl border-b border-navy-900/5 px-4 pb-4 pt-3 max-h-[70vh] overflow-y-auto animate-fade-in">
          <div className="flex gap-1.5 overflow-x-auto mb-2.5">
            {SCOPES.map(s => (
              <button key={s} onClick={() => onScope(s)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-colors ${scope === s ? 'bg-navy-900 text-white' : 'bg-navy-900/6 text-navy-500'}`}>
                {SCOPE_LABELS[s]}
              </button>
            ))}
          </div>

          {!results && <p className="text-center text-gray-300 text-[12.5px] py-6">Search everything from any page — start typing above.</p>}
          {results && groups.length === 0 && <p className="text-center text-gray-300 text-[12.5px] py-6">No matches for "{query}"</p>}
          {groups.map(g => (
            <div key={g.key} className="mb-2">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-300 mt-2.5 mb-1">{g.label}</div>
              {g.items.map((it, i) => (
                <div key={i} onClick={() => goTo(it.path)} className="flex items-center gap-2.5 py-2 cursor-pointer active:opacity-60">
                  <div className="w-[30px] h-[30px] rounded-full bg-navy-50 text-navy-500 flex items-center justify-center font-bold text-[11.5px] shrink-0">{it.title[0]}</div>
                  <div>
                    <div className="text-[12.5px] font-semibold text-navy-900">{it.title}</div>
                    <div className="text-[10.5px] text-gray-400">{it.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
