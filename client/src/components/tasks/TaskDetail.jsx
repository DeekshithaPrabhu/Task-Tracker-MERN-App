import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api';
import { useBusy } from '@/hooks/useBusy.js';
import { fmt, fmtDuration, isOverdue, STATUS, PRIORITY } from '@/utils';

const FIELD = { title: 'Title', description: 'Description', priority: 'Priority', status: 'Status', category: 'Category', tags: 'Tags', startDate: 'Start date', dueDate: 'Due date', estimatedMinutes: 'Estimate' };

const show = (field, v) => {
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return 'none';
  if (field === 'status') return STATUS[v] || v;
  if (field === 'priority') return PRIORITY[v] || v;
  if (field.endsWith('Date')) return fmt(v);
  if (field === 'tags') return v.map((t) => `#${t}`).join(' ');
  if (field === 'estimatedMinutes') return fmtDuration(v);
  return String(v);
};

const describe = (a) => {
  if (a.kind === 'created') return 'Created this task';
  if (a.kind === 'subtask') return `Subtask ${a.field}: “${a.text}”`;
  if (a.field === 'description') return 'Edited the description';
  return `${FIELD[a.field] || a.field}: ${show(a.field, a.from)} → ${show(a.field, a.to)}`;
};

export default function TaskDetail({ id, onClose, onEdit, onChanged }) {
  const [task, setTask] = useState(null);
  const [feed, setFeed] = useState([]);
  const [subTitle, setSubTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const { run: once, isBusy } = useBusy();

  const loadFeed = useCallback(() => api.activity(id).then(setFeed).catch(() => {}), [id]);
  useEffect(() => { api.task(id).then(setTask).catch((e) => setError(e.message)); loadFeed(); }, [id, loadFeed]);
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  // Runs an action, then refreshes the history and tells the parent list to reload
  // `key` (or a function returning one) names the action: its button stays disabled until the call finishes
  const run = (key, fn) => (...a) => once(typeof key === 'function' ? key(...a) : key, async () => {
    try { setError(''); await fn(...a); await loadFeed(); onChanged?.(); } catch (e) { setError(e.message); }
  });
  const addSub = run('sub-add', async (e) => { e.preventDefault(); if (subTitle.trim()) { setTask(await api.addSubtask(id, subTitle)); setSubTitle(''); } });
  const toggleSub = run((s) => `sub:${s._id}`, async (s) => setTask(await api.updateSubtask(id, s._id, { done: !s.done })));
  const removeSub = run((s) => `sub:${s._id}`, async (s) => setTask(await api.deleteSubtask(id, s._id)));
  const toggleDone = run('done', async () => setTask(await api.update(id, { status: task.status === 'done' ? 'todo' : 'done' })));
  const postComment = run('comment-add', async (e) => { e.preventDefault(); if (comment.trim()) { await api.addComment(id, comment); setComment(''); } });
  const removeComment = run((c) => `comment:${c._id}`, (c) => api.deleteComment(id, c._id));

  const subs = task?.subtasks || [];
  const doneCount = subs.filter((s) => s.done).length;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal detail" role="dialog" aria-label="Task details" onClick={(e) => e.stopPropagation()}>
        {!task ? (
          <div className="stack">
            <p className={error ? 'err' : 'empty'}>{/not found/i.test(error) ? 'This task could not be found. It may have been deleted.' : error || 'Loading…'}</p>
            {error && <button className="ghost" onClick={onClose}>Close</button>}
          </div>
        ) : (
          <>
            <div className="detail-head">
              <div>
                <h2 className={task.status === 'done' ? 'struck' : ''}>{task.title}</h2>
                <div className="meta">
                  <span className={`badge s-${task.status}`}>{STATUS[task.status]}</span>
                  <span className="badge"><i className={`dot p-${task.priority}`} />{PRIORITY[task.priority]}</span>
                  {task.category && <span className="badge">{task.category}</span>}
                  {task.tags?.map((g) => <span key={g} className="tag">#{g}</span>)}
                  <span className={isOverdue(task) ? 'overdue-text' : ''}>Due {fmt(task.dueDate)}{isOverdue(task) && ' (overdue)'}</span>
                  {task.estimatedMinutes && <span>Est. {fmtDuration(task.estimatedMinutes)}</span>}
                </div>
              </div>
              <button className="ghost small" onClick={onClose} aria-label="Close">Close</button>
            </div>
            {task.description && <p className="desc">{task.description}</p>}
            <div className="actions left">
              <button className="primary" disabled={isBusy('done')} aria-busy={isBusy('done')} onClick={toggleDone}>{task.status === 'done' ? 'Reopen' : 'Mark complete'}</button>
              <button className="ghost" onClick={() => onEdit(task)}>Edit details</button>
            </div>
            {error && <p className="err" role="alert">{error}</p>}

            <section>
              <h3>Subtasks {subs.length > 0 && <span className="count">{doneCount}/{subs.length}</span>}</h3>
              {subs.length > 0 && <div className="bar"><i style={{ width: `${(doneCount / subs.length) * 100}%` }} /></div>}
              <ul className="checklist">
                {subs.map((s) => (
                  <li key={s._id}>
                    <label><input type="checkbox" checked={s.done} disabled={isBusy(`sub:${s._id}`)} onChange={() => toggleSub(s)} /><span className={s.done ? 'struck' : ''}>{s.title}</span></label>
                    <button className="ghost small danger" disabled={isBusy(`sub:${s._id}`)} onClick={() => removeSub(s)} aria-label={`Remove subtask ${s.title}`}>Remove</button>
                  </li>
                ))}
              </ul>
              <form className="row" onSubmit={addSub}>
                <input placeholder="Add a checklist item" aria-label="New subtask" maxLength={120} value={subTitle} onChange={(e) => setSubTitle(e.target.value)} />
                <button className="primary" disabled={isBusy('sub-add')} aria-busy={isBusy('sub-add')}>Add</button>
              </form>
            </section>

            <section>
              <h3>Comments and history</h3>
              <form className="row" onSubmit={postComment}>
                <input placeholder="Write a comment" aria-label="New comment" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
                <button className="primary" disabled={isBusy('comment-add')} aria-busy={isBusy('comment-add')}>Post</button>
              </form>
              <ul className="timeline">
                {feed.map((a) => (
                  <li key={a._id} className={a.kind}>
                    <time>{new Date(a.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</time>
                    {a.kind === 'comment'
                      ? <p className="comment">{a.text} <button className="link" disabled={isBusy(`comment:${a._id}`)} onClick={() => removeComment(a)}>Delete</button></p>
                      : <p>{describe(a)}</p>}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
