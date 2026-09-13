import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Eye, Check, RotateCcw, Pencil } from 'lucide-react';
import { api } from '../api';
import { useToast } from './Toast';

// Compact popover anchored to the tapped task row — not a full-width sheet.
// Positions itself above or below the row depending on available space.
export default function TaskActionSheet({ task, displayLine, anchorRect, onClose, onChanged }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const popRef = useRef();

  useEffect(() => {
    const onDocClick = (e) => { if (popRef.current && !popRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [onClose]);

  if (!task || !anchorRect) return null;

  const view = () => {
    onClose();
    if (task.loan_file_id) navigate(`/loan-files/${task.loan_file_id}`);
    else if (task.lead_contact_id) navigate(`/leads/${task.lead_contact_id}`);
    else toast("This task isn't linked to a lead or file.", 'info');
  };

  const setStatus = async (status) => {
    await api.updateFollowUp(task.id, { status });
    toast(status === 'Done' ? 'Marked done.' : 'Marked as pending.', 'success');
    onChanged();
    onClose();
  };

  if (editing) {
    return <TaskEditForm task={task} onClose={onClose} onSaved={() => { onChanged(); onClose(); }} />;
  }

  const MENU_HEIGHT = 168; // ~3 rows + padding
  const MENU_WIDTH = 190;
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const showAbove = spaceBelow < MENU_HEIGHT + 16 && anchorRect.top > MENU_HEIGHT + 16;
  const left = Math.max(12, Math.min(anchorRect.left, window.innerWidth - MENU_WIDTH - 12));

  const style = {
    left,
    width: MENU_WIDTH,
    ...(showAbove ? { bottom: window.innerHeight - anchorRect.top + 8 } : { top: anchorRect.bottom + 8 }),
  };

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div ref={popRef} onClick={e => e.stopPropagation()} style={style}
        className="fixed bg-white rounded-2xl shadow-card border border-gray-100 p-1.5 animate-fade-in">
        <div className="px-2.5 pt-1.5 pb-2 border-b border-gray-50 mb-1">
          <div className="font-bold text-navy-900 text-[12.5px] truncate">{task.notes || 'Follow up'}</div>
          <div className="text-[10.5px] text-gray-400 mt-0.5 truncate">{displayLine}</div>
        </div>
        <MenuOpt icon={<Eye size={14} />} label="View" onClick={view} />
        {task.status === 'Done'
          ? <MenuOpt icon={<RotateCcw size={14} />} label="Undo" onClick={() => setStatus('Pending')} />
          : <MenuOpt icon={<Check size={14} />} label="Mark Done" onClick={() => setStatus('Done')} />}
        <MenuOpt icon={<Pencil size={14} />} label="Modify" onClick={() => setEditing(true)} />
      </div>
    </div>
  );
}

function MenuOpt({ icon, label, onClick }) {
  return (
    <div onClick={onClick} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl active:bg-navy-50 cursor-pointer">
      <span className="text-navy-500 shrink-0">{icon}</span>
      <span className="font-semibold text-navy-900 text-[12.5px]">{label}</span>
    </div>
  );
}

function TaskEditForm({ task, onClose, onSaved }) {
  const [form, setForm] = useState({
    due_date: task.due_date, notes: task.notes || '', method: task.method,
    party_type: task.party_type, priority_tag: task.priority_tag || ''
  });

  const submit = async () => {
    await api.updateFollowUp(task.id, { ...form, priority_tag: form.priority_tag || null });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] animate-fade-in" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-5 w-full max-w-sm mx-4 shadow-card">
        <h3 className="font-display font-semibold text-navy-900 mb-4">Modify Task</h3>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Notes</label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Party</label>
            <select value={form.party_type} onChange={e => setForm(f => ({ ...f, party_type: e.target.value }))} className="input">
              <option>Lead</option><option>Source</option><option>Bank</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Method</label>
            <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className="input">
              <option>Call</option><option>WhatsApp</option><option>Visit</option><option>Backend</option>
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Due Date</label>
          <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="input" />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Priority Tag</label>
          <select value={form.priority_tag} onChange={e => setForm(f => ({ ...f, priority_tag: e.target.value }))} className="input">
            <option value="">None</option>
            <option value="Urgent">Urgent</option>
            <option value="Important">Important</option>
            <option value="Top Priority">Top Priority</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}
