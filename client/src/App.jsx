import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import TaskForm from './TaskForm.jsx';
import Tasks from './Tasks.jsx';
import Board from './Board.jsx';
import { fmt, isOverdue, STATUS, PRIORITY } from './utils.js';

function Ring({ value }) {
  const r = 70, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 180 180" className="ring" role="img" aria-label={`${value}% complete`}>
      <circle cx="90" cy="90" r={r} className="ring-bg" />
      <circle cx="90" cy="90" r={r} className="ring-fg" strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 90 90)" />
      <text x="90" y="92" textAnchor="middle" className="ring-num">{value}%</text>
      <text x="90" y="116" textAnchor="middle" className="ring-sub">complete</text>
    </svg>
  );
}

function Breakdown({ title, data, keys }) {
  const max = Math.max(1, ...keys.map((k) => data[k] || 0));
  return (
    <section className="panel">
      <h2>{title}</h2>
      {keys.map((k) => (
        <div className="bar-row" key={k}>
          <span>{STATUS[k] || PRIORITY[k]}</span>
          <div className="bar"><i className={`b-${k}`} style={{ width: `${((data[k] || 0) / max) * 100}%` }} /></div>
          <b>{data[k] || 0}</b>
        </div>
      ))}
    </section>
  );
}

function TaskRow({ t, onDone, onExtend }) {
  return (
    <li className={`task ${isOverdue(t) ? 'late' : ''}`}>
      <input type="checkbox" checked={t.status === 'done'} onChange={() => onDone(t)} aria-label={`Mark ${t.title} done`} />
      <div className="task-main">
        <strong className={t.status === 'done' ? 'struck' : ''}>{t.title}</strong>
        <small><span className={`dot p-${t.priority}`} />{PRIORITY[t.priority]} priority, due {fmt(t.dueDate)}</small>
      </div>
      {onExtend && t.status !== 'done' && (
        <div className="extend" aria-label="Extend due date">
          {[1, 3, 7].map((d) => <button key={d} onClick={() => onExtend(t, d)} title={`Push due date by ${d} day(s)`}>+{d}d</button>)}
        </div>
      )}
    </li>
  );
}

export default function App() {
  const [s, setS] = useState(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState('dashboard');
  const [error, setError] = useState('');
  const load = useCallback(() => api.stats().then(setS).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const act = (fn) => async (...a) => { try { await fn(...a); await load(); } catch (e) { setError(e.message); } };
  const toggle = act((t) => api.update(t._id, { status: t.status === 'done' ? 'todo' : 'done' }));
  const extend = act((t, d) => api.extend(t._id, d));
  const create = async (body) => { await api.create(body); await load(); };

  if (error && !s) return <p className="state">Can't reach the API: {error}. Check that the server and MongoDB are running.</p>;
  if (!s) return <p className="state">Loading your tasks…</p>;

  const cards = [['Total', s.total], ['Completed', s.completed], ['Pending', s.pending], ['Overdue', s.overdue, s.overdue > 0]];
  const empty = (msg) => <p className="empty">{msg}</p>;

  const dashboard = (
    <>
      <header className="top">
        <h1>Today, {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
        <button className="primary" onClick={() => setAdding(true)}>Quick add task</button>
      </header>
      {error && <p className="err" onClick={() => setError('')}>{error}</p>}

      <div className="hero">
        <section className="panel ringpanel"><Ring value={s.completion} /></section>
        <div className="cards">
          {cards.map(([label, n, bad]) => (
            <div className={`card ${bad ? 'bad' : ''}`} key={label}><b>{n}</b><span>{label}</span></div>
          ))}
        </div>
      </div>

      <div className="grid">
        <section className="panel">
          <h2>Due today</h2>
          <ul>{s.dueToday.length ? s.dueToday.map((t) => <TaskRow key={t._id} t={t} onDone={toggle} onExtend={extend} />) : empty('Nothing due today.')}</ul>
        </section>
        <section className="panel">
          <h2>Upcoming this week</h2>
          <ul>{s.upcoming.length ? s.upcoming.map((t) => <TaskRow key={t._id} t={t} onDone={toggle} onExtend={extend} />) : empty('No deadlines in the next 7 days.')}</ul>
        </section>
        <Breakdown title="By priority" data={s.byPriority} keys={['urgent', 'high', 'medium', 'low']} />
        <Breakdown title="By status" data={s.byStatus} keys={['todo', 'in-progress', 'done']} />
        <section className="panel wide">
          <h2>Recently added</h2>
          <ul>{s.recent.length ? s.recent.map((t) => <TaskRow key={t._id} t={t} onDone={toggle} onExtend={extend} />) : empty('Add your first task to get started.')}</ul>
        </section>
      </div>
      {adding && <TaskForm quick onClose={() => setAdding(false)} onSave={create} />}
    </>
  );

  const go = (v) => { setView(v); if (v === 'dashboard') load(); };
  return (
    <main>
      <nav className="tabs">
        {[['dashboard', 'Dashboard'], ['board', 'Board'], ['tasks', 'All tasks']].map(([v, label]) => (
          <button key={v} className={view === v ? 'on' : ''} aria-current={view === v} onClick={() => go(v)}>{label}</button>
        ))}
      </nav>
      {view === 'tasks' ? <Tasks /> : view === 'board' ? <Board /> : dashboard}
    </main>
  );
}
