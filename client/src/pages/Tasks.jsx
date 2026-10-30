import { useEffect, useState, useCallback } from 'react';
import { api } from '@/api';
import TaskForm from '@/components/tasks/TaskForm.jsx';
import { fmt, fmtDuration, isOverdue, STATUS, PRIORITY } from '@/utils';

export default function Tasks() {
  const [tasks, setTasks] = useState(null);
  const [editing, setEditing] = useState(null); // a task, 'new', or null
  const [deleting, setDeleting] = useState(null); // the task waiting for delete confirmation
  const [error, setError] = useState('');

  const load = useCallback(() => api.list().then(setTasks).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const act = (fn) => async () => { try { await fn(); await load(); } catch (e) { setError(e.message); } };
  const save = async (body) => { await (editing === 'new' ? api.create(body) : api.update(editing._id, body)); await load(); };

  return (
    <>
      <header className="top">
        <h1>All tasks</h1>
        <button className="primary" onClick={() => setEditing('new')}>New task</button>
      </header>
      {error && <p className="err" onClick={() => setError('')}>{error}</p>}

      <ul className="list">
        {tasks === null && <p className="empty">Loading tasks…</p>}
        {tasks?.length === 0 && <p className="empty">No tasks yet. Create one with “New task”.</p>}
        {tasks?.map((t) => (
          <li key={t._id} className={`panel item ${isOverdue(t) ? 'late' : ''}`}>
            <div className="item-main">
              <strong className={t.status === 'done' ? 'struck' : ''}>{t.title}</strong>
              {t.description && <p className="desc">{t.description}</p>}
              <div className="meta">
                <span className={`badge s-${t.status}`}>{STATUS[t.status]}</span>
                <span className="badge"><i className={`dot p-${t.priority}`} />{PRIORITY[t.priority]}</span>
                {t.category && <span className="badge">{t.category}</span>}
                {t.startDate && <span>Starts {fmt(t.startDate)}</span>}
                <span className={isOverdue(t) ? 'overdue-text' : ''}>Due {fmt(t.dueDate)}{isOverdue(t) && ' (overdue)'}</span>
                {t.estimatedMinutes && <span>Est. {fmtDuration(t.estimatedMinutes)}</span>}
              </div>
            </div>
            <div className="item-actions">
              <button onClick={act(() => api.update(t._id, { status: t.status === 'done' ? 'todo' : 'done' }))}>{t.status === 'done' ? 'Reopen' : 'Mark complete'}</button>
              <button onClick={() => setEditing(t)}>Edit</button>
              <button className="danger" onClick={() => setDeleting(t)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {editing && <TaskForm task={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={save} />}
      {deleting && (
        <div className="overlay" onClick={() => setDeleting(null)}>
          <div className="modal" role="alertdialog" aria-labelledby="del-h" onClick={(e) => e.stopPropagation()}>
            <h2 id="del-h">Delete this task?</h2>
            <p>“{deleting.title}” will be permanently removed. This can't be undone.</p>
            <div className="actions">
              <button className="ghost" autoFocus onClick={() => setDeleting(null)}>Keep task</button>
              <button className="primary danger-fill" onClick={act(async () => { await api.remove(deleting._id); setDeleting(null); })}>Delete task</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
