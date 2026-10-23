import { useState } from 'react';
import { STATUS, PRIORITY, toInput } from './utils.js';

// Used for creating (task = null) and editing. `quick` shows only the essentials.
export default function TaskForm({ task, quick, onClose, onSave }) {
  const [f, setF] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    startDate: toInput(task?.startDate),
    dueDate: toInput(task?.dueDate) || toInput(new Date()),
    estimatedMinutes: task?.estimatedMinutes || '',
  });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.startDate && f.dueDate < f.startDate) return setErr('Due date cannot be before the start date.');
    try {
      await onSave({
        ...f,
        title: f.title.trim(),
        startDate: f.startDate ? new Date(f.startDate + 'T00:00:00') : null,
        dueDate: new Date(f.dueDate + 'T23:59:00'),
        estimatedMinutes: f.estimatedMinutes ? Number(f.estimatedMinutes) : null,
      });
      onClose();
    } catch (x) { setErr(x.message); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{task ? 'Edit task' : quick ? 'Quick add' : 'New task'}</h2>
        <label>Title<input autoFocus required value={f.title} onChange={set('title')} /></label>
        {!quick && <label>Description<textarea rows={3} value={f.description} onChange={set('description')} /></label>}
        <div className="two">
          <label>Priority
            <select value={f.priority} onChange={set('priority')}>
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {quick
            ? <label>Due date<input type="date" required value={f.dueDate} onChange={set('dueDate')} /></label>
            : <label>Status
                <select value={f.status} onChange={set('status')}>
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>}
        </div>
        {!quick && (
          <>
            <div className="two">
              <label>Start date<input type="date" value={f.startDate} onChange={set('startDate')} /></label>
              <label>Due date<input type="date" required value={f.dueDate} onChange={set('dueDate')} /></label>
            </div>
            <label>Estimated duration (minutes, optional)
              <input type="number" min="1" step="1" value={f.estimatedMinutes} onChange={set('estimatedMinutes')} />
            </label>
          </>
        )}
        {err && <p className="err">{err}</p>}
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="primary">{task ? 'Save changes' : 'Add task'}</button>
        </div>
      </form>
    </div>
  );
}
