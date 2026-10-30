import { useEffect, useState, useCallback } from 'react';
import { api } from '@/api';
import { useBusy } from '@/hooks/useBusy.js';
import TaskForm from '@/components/tasks/TaskForm.jsx';
import TaskDetail from '@/components/tasks/TaskDetail.jsx';
import { fmt, fmtDuration, isOverdue, subProgress, STATUS, PRIORITY } from '@/utils';

const COLUMNS = ['todo', 'in-progress', 'done'];

export default function Board() {
  const [tasks, setTasks] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [error, setError] = useState('');
  const { run, isBusy } = useBusy();

  const load = useCallback(() => api.list().then(setTasks).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  // Optimistic move: update the UI first, save to MongoDB, roll back that card if the save fails
  // While a card is being saved it can't be dragged or moved again
  const move = (id, status) => run(`task:${id}`, async () => {
    const task = tasks.find((x) => x._id === id);
    if (!task || task.status === status) return;
    setTasks((cur) => cur.map((x) => (x._id === id ? { ...x, status } : x)));
    try {
      const saved = await api.update(id, { status });
      setTasks((cur) => cur.map((x) => (x._id === id ? saved : x)));
    } catch (e) {
      setTasks((cur) => cur.map((x) => (x._id === id ? task : x)));
      setError(`Couldn't move “${task.title}”: ${e.message}`);
    }
  });

  const drop = (e, status) => {
    e.preventDefault();
    setOverCol(null);
    move(e.dataTransfer.getData('text/plain'), status);
  };

  if (!tasks) return <p className="state">{error || 'Loading board…'}</p>;

  return (
    <>
      <header className="top">
        <h1>Board</h1>
        <button className="primary" onClick={() => setEditing('new')}>New task</button>
      </header>
      {error && <p className="err" onClick={() => setError('')}>{error}</p>}

      <div className="board">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
          return (
            <section key={col} className={`col ${overCol === col ? 'over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null); }}
              onDrop={(e) => drop(e, col)}>
              <h2>{STATUS[col]} <span className="count">{items.length}</span></h2>
              {items.length === 0 && <p className="empty">Drop tasks here.</p>}
              {items.map((t) => {
                const late = isOverdue(t);
                return (
                  <article key={t._id} draggable={!isBusy(`task:${t._id}`)} className={`kcard ${late ? 'late' : ''} ${dragId === t._id ? 'dragging' : ''}`}
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', t._id); e.dataTransfer.effectAllowed = 'move'; setDragId(t._id); }}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}>
                    <div className="kc-top">
                      <span className="badge"><i className={`dot p-${t.priority}`} />{PRIORITY[t.priority]}</span>
                      {t.category && <span className="badge">{t.category}</span>}
                      {late && <span className="badge late-tag">Overdue</span>}
                    </div>
                    <button className="kc-title" onClick={() => setDetailId(t._id)}>{t.title}</button>
                    <div className={`kc-foot ${late ? 'overdue-text' : ''}`}>
                      <span>Due {fmt(t.dueDate)}</span>
                      {t.estimatedMinutes && <span>Est. {fmtDuration(t.estimatedMinutes)}</span>}
                      {subProgress(t) && <span>Subtasks {subProgress(t)}</span>}
                    </div>
                    {/* Keyboard and touch alternative to dragging */}
                    <select value={t.status} disabled={isBusy(`task:${t._id}`)} onChange={(e) => move(t._id, e.target.value)} aria-label={`Move ${t.title} to another column`}>
                      {COLUMNS.map((c) => <option key={c} value={c}>{STATUS[c]}</option>)}
                    </select>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>

      {detailId && <TaskDetail id={detailId} onClose={() => setDetailId(null)} onChanged={load} onEdit={(t) => { setDetailId(null); setEditing(t); }} />}
      {editing && (
        <TaskForm task={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
          onSave={async (body) => { await (editing === 'new' ? api.create(body) : api.update(editing._id, body)); await load(); }} />
      )}
    </>
  );
}
