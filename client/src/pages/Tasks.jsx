import { useEffect, useState, useCallback } from 'react';
import { api } from '@/api';
import TaskForm from '@/components/tasks/TaskForm.jsx';
import { fmt, fmtDuration, isOverdue, STATUS, PRIORITY } from '@/utils';

const DEFAULTS = { q: '', status: '', priority: '', category: '', dueFrom: '', dueTo: '', quick: 'all' };
const QUICK = [['all', 'All'], ['myday', 'My Day'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['completed', 'Completed']];
const SORTS = { due: 'Due date', priority: 'Priority', created: 'Creation date', title: 'Title' };
const NATURAL_ORDER = { due: 'asc', priority: 'desc', created: 'desc', title: 'asc' };

export default function Tasks() {
  const [tasks, setTasks] = useState(null);
  const [filters, setFilters] = useState(DEFAULTS);
  const [sort, setSort] = useState({ sort: 'due', order: 'asc' });
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // a task, 'new', or null
  const [deleting, setDeleting] = useState(null); // the task waiting for delete confirmation
  const [error, setError] = useState('');

  const filtersActive = Object.keys(DEFAULTS).some((k) => filters[k] !== DEFAULTS[k]);

  const load = useCallback(() => {
    api.categories().then(setCategories).catch(() => {});
    return api.list({ ...filters, ...sort }).then(setTasks).catch((e) => setError(e.message));
  }, [filters, sort]);
  useEffect(() => { const id = setTimeout(load, 200); return () => clearTimeout(id); }, [load]);

  const act = (fn) => async () => { try { await fn(); await load(); } catch (e) { setError(e.message); } };
  const save = async (body) => { await (editing === 'new' ? api.create(body) : api.update(editing._id, body)); await load(); };
  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const pickQuick = (quick) => setFilters({ ...filters, quick, status: '', dueFrom: '', dueTo: '' });

  return (
    <>
      <header className="top">
        <h1>All tasks</h1>
        <button className="primary" onClick={() => setEditing('new')}>New task</button>
      </header>

      <div className="chips" role="group" aria-label="Quick filters">
        {QUICK.map(([k, label]) => (
          <button key={k} className={`chip ${filters.quick === k ? 'on' : ''}`} aria-pressed={filters.quick === k} onClick={() => pickQuick(k)}>{label}</button>
        ))}
      </div>

      <div className="toolbar">
        <input type="search" placeholder="Search title or description" value={filters.q} onChange={setF('q')} aria-label="Search tasks" />
        <select value={filters.status} onChange={setF('status')} aria-label="Filter by status" disabled={filters.quick !== 'all'}>
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.priority} onChange={setF('priority')} aria-label="Filter by priority">
          <option value="">All priorities</option>
          {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.category} onChange={setF('category')} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="toolbar">
        <label className="inline">Due from<input type="date" value={filters.dueFrom} max={filters.dueTo || undefined} onChange={setF('dueFrom')} disabled={filters.quick !== 'all'} /></label>
        <label className="inline">to<input type="date" value={filters.dueTo} min={filters.dueFrom || undefined} onChange={setF('dueTo')} disabled={filters.quick !== 'all'} /></label>
        <label className="inline push">Sort by
          <select value={sort.sort} onChange={(e) => setSort({ sort: e.target.value, order: NATURAL_ORDER[e.target.value] })}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <button className="ghost small" onClick={() => setSort({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' })} aria-label="Toggle sort direction">
          {sort.order === 'asc' ? 'Ascending' : 'Descending'}
        </button>
        {filtersActive && <button className="ghost small" onClick={() => setFilters(DEFAULTS)}>Clear all filters</button>}
      </div>
      {filters.quick !== 'all' && <p className="hint">Status and due date filters are off while a quick filter is selected.</p>}
      {error && <p className="err" onClick={() => setError('')}>{error}</p>}
      {tasks && <p className="hint" aria-live="polite">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>}

      <ul className="list">
        {tasks === null && <p className="empty">Loading tasks…</p>}
        {tasks?.length === 0 && <p className="empty">{filtersActive ? 'No tasks match these filters.' : 'No tasks yet. Create one with “New task”.'}</p>}
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
