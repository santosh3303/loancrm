import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { api } from '../api';

const SCOPES = ['all', 'leads', 'files', 'contacts', 'tasks'];
const SCOPE_LABELS = { all: 'All', leads: 'Leads', files: 'Files', contacts: 'Contacts', tasks: 'Tasks' };

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [scopeOpen, setScopeOpen] = useState(false);
  const [results, setResults] = useState(null);
  const debounceRef = useRef();
  const inputRef = useRef();
  const rootRef = useRef();
  const navigate = useNavigate();

  const toggle = () => {
    const next = !open;
    setOpen(next);
    setScopeOpen(false);
    if (next) setTimeout(() => inputRef.current?.focus(), 180);
    else { setQuery(''); setResults(null); }
  };

  // Tap anywhere outside the search UI closes it (icon click is handled separately above)
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) toggle();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const runSearch = (val, sc) => {
    clearTimeout(debounceRef.current);
    if (!val || val.length < 2) { setResults(null); return; }
    debounceRef.current = setTimeout(async () => {
      const r = await api.search(val, sc === 'all' ? null : sc);
      setResults(r);
    }, 280);
  };

  const onInput = (val) => { setQuery(val); runSearch(val, scope); };
  const onScope = (s) => { setScope(s); setScopeOpen(false); runSearch(query, s); };

  const goTo = (path) => { toggle(); navigate(path); };

  const groups = results ? [
    { key: 'leads', label: 'Leads', items: results.leads.map(l => ({ title: l.name, sub: `${l.mobile || ''} · ${l.qualification_status || ''}`, path: `/leads/${l.id}` })) },
    { key: 'files', label: 'Loan Files', items: results.files.map(f => ({ title: f.lead_name, sub: `${f.current_stage} · ${f.bank_name || ''}`, path: `/loan-files/${f.id}` })) },
    { key: 'contacts', label: 'Contacts', items: results.contacts.map(c => ({ title: c.name, sub: `${c.role} · ${c.mobile || ''}`, path: `/master-database?tab=contacts` })) },
    { key: 'tasks', label: 'Tasks', items: results.tasks.map(t => ({ title: t.notes || 'Follow up', sub: `${t.party_type} · Due ${t.due_date}`, path: `/daily-operations` })) },
  ].filter(g => g.items.length) : [];

  return (
    // Non-scrolling flex child now (outside the scroll region) — plain solid
    // background, no sticky/backdrop-blur needed since it never overlaps
    // scrolling content anymore.
    <div ref={rootRef} className="relative shrink-0 z-30 bg-white border-b border-navy-900/5 px-4 py-3.5">
      <div className={`flex justify-between items-center transition-opacity ${open ? 'opacity-0 h-0 pointer-events-none' : ''}`}>
        <span onClick={() => navigate('/')} className="font-display font-bold text-[16px] text-navy-900 cursor-pointer active:opacity-60">My CRM</span>
        <button onClick={toggle} className="w-[34px] h-[34px] rounded-[10px] bg-navy-900/5 flex items-center justify-center text-navy-500 active:scale-90 transition-transform">
          <Search size={16} strokeWidth={2.3} />
        </button>
      </div>

      <div className={`flex items-center gap-2 overflow-hidden transition-all ${open ? 'max-h-14 mt-2.5' : 'max-h-0'}`}>
        <div className="flex-1 h-[38px] box-border bg-navy-900/5 rounded-[11px] px-3 flex items-center gap-2">
          <Search size={14} className="text-navy-300 shrink-0" />
          <input ref={inputRef} value={query} onChange={e => onInput(e.target.value)}
            placeholder="Search leads, files, contacts..."
            className="border-none bg-transparent outline-none flex-1 text-[13.5px] text-navy-900" />
        </div>
        <button onClick={() => setScopeOpen(o => !o)}
          className="h-[38px] box-border shrink-0 flex items-center gap-1 bg-navy-50 rounded-xl px-3.5 text-[12.5px] font-bold text-navy-700">
          {SCOPE_LABELS[scope]} <ChevronDown size={12} className={`transition-transform ${scopeOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Fixed pixel offsets (not percentage-based) so positioning never
          depends on the header's animating height — this is what actually
          caused the header-covering bug. */}
      {open && scopeOpen && (
        <div className="absolute right-4 top-[76px] w-[140px] bg-white rounded-2xl shadow-card border border-gray-100 p-2 z-40 animate-fade-in">
          {SCOPES.map(s => (
            <div key={s} onClick={() => onScope(s)}
              className={`px-2.5 py-2 rounded-lg text-[12px] font-bold cursor-pointer ${scope === s ? 'bg-amber-50 text-amber-700' : 'text-navy-700 active:bg-navy-50'}`}>
              {SCOPE_LABELS[s]}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-[76px] bg-[#f7f8fb] border-b border-navy-900/5 shadow-lg px-4 pb-4 pt-3 max-h-[70vh] overflow-y-auto animate-fade-in z-30">
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
