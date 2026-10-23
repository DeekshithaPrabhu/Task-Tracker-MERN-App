import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from './api.js';
import TaskForm from './TaskForm.jsx';
import TaskDetail from './TaskDetail.jsx';
import { fmt, fmtDuration, isOverdue, subProgress, STATUS, PRIORITY } from './utils.js';

const DEFAULTS = { q: '', status: '', priority: '', category: '', tag: '', dueFrom: '', dueTo: '', quick: 'all' };
const QUICK = [['all', 'All'], ['myday', 'My Day'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['completed', 'Completed']];
const SORTS = { due: 'Due date', priority: 'Priority', created: 'Creation date', title: 'Title' };
const NATURAL_ORDER = { due: 'asc', priority: 'desc', created: 'desc', title: 'asc' };

export default function Tasks() {
  const [tasks, setTasks] = useState(null);
  const [filters, setFilters] = useState(DEFAULTS);
  const [sort, setSort] = useState({ sort: 'due', order: 'asc' });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [editing, setEditing] = useState(null); // a task, 'new', or null
  const [deleting, setDeleting] = useState(null); // { ids, label }
  const [selected, setSelected] = useState(new Set());
  const [bulkDue, setBulkDue] = useState('');
  const [error, setError] = useState('');
  const [params, setParams] = useSearchParams();
  const detailId = params.get('task'); // deep link, also used by reminders

  const filtersActive = Object.keys(DEFAULTS).some((k) => filters[k] !== DEFAULTS[k]);

  const load = useCallback(() => {
    api.categories().then((c) => setCategories(c.map((x) => x.name))).catch(() => {});
    api.tags().then(setTags).catch(() => {});
    return api.list({ ...filters, ...sort }).then(setTasks).catch((e) => setError(e.message));
  }, [filters, sort]);
  useEffect(() => { const id = setTimeout(load, 200); return () => clearTimeout(id); }, [load]);
  useEffect(() => setSelected(new Set()), [filters]);

  const act = (fn) => async () => { try { await fn(); await load(); } catch (e) { setError(e.message); } };
  const save = async (body) => { await (editing === 'new' ? api.create(body) : api.update(editing._id, body)); await load(); };
  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const pickQuick = (quick) => setFilters({ ...filters, quick, status: '', dueFrom: '', dueTo: '' });

  // Bulk selection works on the tasks currently shown
  const chosen = (tasks || []).filter((t) => selected.has(t._id));
  const ids = chosen.map((t) => t._id);
  const allSelected = tasks?.length > 0 && chosen.length === tasks.length;
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const bulk = (update) => act(async () => { await api.bulk(ids, update); setSelected(new Set()); })();
  const pickBulk = (key, map = (v) => v) => (e) => { if (e.target.value) bulk({ [key]: map(e.target.value) }); };

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
        <select value={filters.tag} onChange={setF('tag')} aria-label="Filter by tag">
          <option value="">All tags</option>
          {tags.map((g) => <option key={g} value={g}>#{g}</option>)}
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

      {tasks?.length > 0 && (
        <div className="selectbar">
          <label><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(tasks.map((t) => t._id)))} /> Select all</label>
          <span className="hint" aria-live="polite">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
        </div>
      )}

      {chosen.length > 0 && (
        <div className="bulkbar panel" role="region" aria-label="Bulk actions">
          <strong>{chosen.length} selected</strong>
          <button className="primary small" onClick={() => bulk({ status: 'done' })}>Complete</button>
          <select value="" onChange={pickBulk('status')} aria-label="Set status for selected"><option value="">Set status…</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select value="" onChange={pickBulk('priority')} aria-label="Set priority for selected"><option value="">Set priority…</option>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select value="" onChange={pickBulk('category', (v) => (v === '-' ? '' : v))} aria-label="Set category for selected"><option value="">Set category…</option><option value="-">No category</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          <label className="inline"><input type="date" value={bulkDue} onChange={(e) => setBulkDue(e.target.value)} aria-label="New due date for selected" />
            <button className="ghost small" disabled={!bulkDue} onClick={() => { bulk({ dueDate: new Date(bulkDue + 'T23:59:00') }); setBulkDue(''); }}>Set due date</button></label>
          <button className="ghost small danger push" onClick={() => setDeleting({ ids, label: `${ids.length} ${ids.length === 1 ? 'task' : 'tasks'}` })}>Delete</button>
        </div>
      )}

      <ul className="list">
        {tasks === null && <p className="empty">Loading tasks…</p>}
        {tasks?.length === 0 && <p className="empty">{filtersActive ? 'No tasks match these filters.' : 'No tasks yet. Create one with “New task”.'}</p>}
        {tasks?.map((t) => (
          <li key={t._id} className={`panel item ${isOverdue(t) ? 'late' : ''} ${selected.has(t._id) ? 'picked' : ''}`}>
            <input type="checkbox" className="pick" checked={selected.has(t._id)} onChange={() => toggle(t._id)} aria-label={`Select ${t.title}`} />
            <div className="item-main">
              <button className={`kc-title ${t.status === 'done' ? 'struck' : ''}`} onClick={() => setParams({ task: t._id })}>{t.title}</button>
              {t.description && <p className="desc">{t.description}</p>}
              <div className="meta">
                <span className={`badge s-${t.status}`}>{STATUS[t.status]}</span>
                <span className="badge"><i className={`dot p-${t.priority}`} />{PRIORITY[t.priority]}</span>
                {t.category && <span className="badge">{t.category}</span>}
                {t.tags?.map((g) => <span key={g} className="tag">#{g}</span>)}
                {t.startDate && <span>Starts {fmt(t.startDate)}</span>}
                <span className={isOverdue(t) ? 'overdue-text' : ''}>Due {fmt(t.dueDate)}{isOverdue(t) && ' (overdue)'}</span>
                {t.estimatedMinutes && <span>Est. {fmtDuration(t.estimatedMinutes)}</span>}
                {subProgress(t) && <span>Subtasks {subProgress(t)}</span>}
              </div>
            </div>
            <div className="item-actions">
              <button onClick={act(() => api.update(t._id, { status: t.status === 'done' ? 'todo' : 'done' }))}>{t.status === 'done' ? 'Reopen' : 'Mark complete'}</button>
              <button onClick={() => setEditing(t)}>Edit</button>
              <button className="danger" onClick={() => setDeleting({ ids: [t._id], label: `“${t.title}”` })}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {detailId && <TaskDetail id={detailId} onClose={() => setParams({})} onChanged={load} onEdit={(t) => { setParams({}); setEditing(t); }} />}
      {editing && <TaskForm task={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={save} />}
      {deleting && (
        <div className="overlay" onClick={() => setDeleting(null)}>
          <div className="modal" role="alertdialog" aria-labelledby="del-h" onClick={(e) => e.stopPropagation()}>
            <h2 id="del-h">Delete {deleting.ids.length === 1 ? 'this task' : `${deleting.ids.length} tasks`}?</h2>
            <p>{deleting.label} will be permanently removed, with their subtasks and history. This can't be undone.</p>
            <div className="actions">
              <button className="ghost" autoFocus onClick={() => setDeleting(null)}>Keep {deleting.ids.length === 1 ? 'task' : 'tasks'}</button>
              <button className="primary danger-fill" onClick={act(async () => { await api.bulkDelete(deleting.ids); setSelected(new Set()); setDeleting(null); })}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
