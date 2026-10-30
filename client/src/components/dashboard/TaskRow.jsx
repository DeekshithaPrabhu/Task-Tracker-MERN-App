import { fmt, isOverdue, PRIORITY } from '@/utils';

export default function TaskRow({ t, onDone, onExtend, busy }) {
  return (
    <li className={`task ${isOverdue(t) ? 'late' : ''}`}>
      <input type="checkbox" checked={t.status === 'done'} disabled={busy} onChange={() => onDone(t)} aria-label={`Mark ${t.title} done`} />
      <div className="task-main">
        <strong className={t.status === 'done' ? 'struck' : ''}>{t.title}</strong>
        <small><span className={`dot p-${t.priority}`} />{PRIORITY[t.priority]} priority, due {fmt(t.dueDate)}</small>
      </div>
      {onExtend && t.status !== 'done' && (
        <div className="extend" aria-label="Extend due date">
          {[1, 3, 7].map((d) => <button key={d} disabled={busy} onClick={() => onExtend(t, d)} title={`Push due date by ${d} day(s)`}>+{d}d</button>)}
        </div>
      )}
    </li>
  );
}
