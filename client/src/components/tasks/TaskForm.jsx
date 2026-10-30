import { useState } from 'react';
import { PRIORITY, toInput } from '@/utils';

// Used for creating (task = null) and editing. `quick` shows only the essentials.
export default function TaskForm({ task, quick, onClose, onSave }) {
  const [f, setF] = useState({
    title: task?.title || '',
    priority: task?.priority || 'medium',
    dueDate: toInput(task?.dueDate) || toInput(new Date()),
  });
  const [err, setErr] = useState('');
  const set = (k) => (e) => { const val = e.target.value; setF((p) => ({ ...p, [k]: val })); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await onSave({
        ...f,
        title: f.title.trim(),
        dueDate: new Date(f.dueDate + 'T23:59:00'),
      });
      onClose();
    } catch (x) { setErr(x.message); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{task ? 'Edit task' : quick ? 'Quick add' : 'New task'}</h2>
        <label>Title<input autoFocus required value={f.title} onChange={set('title')} /></label>
        <div className="two">
          <label>Priority
            <select value={f.priority} onChange={set('priority')}>
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Due date<input type="date" required value={f.dueDate} onChange={set('dueDate')} /></label>
        </div>
        {err && <p className="err">{err}</p>}
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="primary">{task ? 'Save changes' : 'Add task'}</button>
        </div>
      </form>
    </div>
  );
}
