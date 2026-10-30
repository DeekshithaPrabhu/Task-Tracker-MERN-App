import { useEffect, useState, useCallback } from 'react';
import { api } from '@/api';
import TaskForm from '@/components/tasks/TaskForm.jsx';
import Ring from '@/components/dashboard/Ring.jsx';
import Breakdown from '@/components/dashboard/Breakdown.jsx';
import TaskRow from '@/components/dashboard/TaskRow.jsx';

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [adding, setAdding] = useState(false);
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

  return dashboard;
}
