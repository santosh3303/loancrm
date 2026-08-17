import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api';
import { useToast } from './Toast';

export default function TaskActionSheet({ task, displayLine, onClose, onChanged }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [editing, setEditing] = useState(false);

  if (!task) return null;

  const view = () => {
    onClose();
    if (task.loan_file_id) navigate(`/loan-files/${task.loan_file_id}`);
    else if (task.lead_contact_id) navigate(`/leads/${task.lead_contact_id}`);
    else toast("This task isn't linked to a lead or file.", 'info');
  };

  const toggleDone = async () => {
    await api.updateFollowUp(task.id, { status: task.status === 'Done' ? 'Pending' : 'Done' });
    toast(task.status === 'Done' ? 'Marked as pending.' : 'Marked done.', 'success');
    onChanged();
    onClose();
  };

  if (editing) {
    return <TaskEditForm task={task} onClose={onClose} onSaved={() => { onChanged(); onClose(); }} />;
  }

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] flex items-end z-[60] animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-t-2xl p-5 pb-7 w-full max-w-[420px] mx-auto shadow-card" onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="mb-2">
          <div className="font-bold text-navy-900 text-[14px]">{task.notes || 'Follow up'}</div>
          <div className="text-[11.5px] text-gray-400 mt-0.5">{displayLine}</div>
        </div>
        <SheetOpt icon="👁️" label="View" onClick={view} />
        <SheetOpt icon="✓" label={task.status === 'Done' ? 'Mark Undone' : 'Mark Done'} onClick={toggleDone} />
        <SheetOpt icon="✏️" label="Modify" onClick={() => setEditing(true)} />
      </div>
    </div>
  );
}

function SheetOpt({ icon, label, onClick }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 py-3 px-1 rounded-xl active:bg-navy-50 cursor-pointer">
      <div className="w-9 h-9 rounded-[11px] bg-navy-50 flex items-center justify-center text-base shrink-0">{icon}</div>
      <span className="font-bold text-navy-900 text-sm">{label}</span>
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] animate-fade-in">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm mx-4 shadow-card">
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
