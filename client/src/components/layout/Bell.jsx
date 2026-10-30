import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useBusy } from '@/hooks/useBusy.js';
import { fmt } from '@/utils';

export default function Bell() {
  const [data, setData] = useState({ overdue: [], today: [], soon: [], count: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();
  const { run, isBusy } = useBusy();
  const { pathname } = useLocation();

  const load = useCallback(() => api.notifications().then(setData).catch(() => {}), []);
  // Refresh every minute and whenever the user moves to another page
  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, [load, pathname]);

  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const groups = [['Overdue', data.overdue, 'late'], ['Due today', data.today, ''], ['Coming up', data.soon, '']];
  const snooze = (id) => run(`snooze:${id}`, async () => { await api.extend(id, 1).catch(() => {}); await load(); });

  return (
    <div className="bell" ref={ref}>
      <button className="ghost small" aria-expanded={open} aria-label={`Reminders, ${data.count} pending`} onClick={() => { setOpen(!open); load(); }}>
        Reminders{data.count > 0 && <span className={`pill ${data.overdue.length ? 'late' : ''}`}>{data.count}</span>}
      </button>
      {open && (
        <div className="bell-panel panel" role="region" aria-label="Reminders">
          {data.count === 0 && <p className="empty">You're all caught up.</p>}
          {groups.map(([label, items, cls]) => items.length > 0 && (
            <section key={label}>
              <h3 className={cls}>{label} ({items.length})</h3>
              {items.map((t) => (
                <div className="bell-item" key={t._id}>
                  <button className="kc-title" onClick={() => { setOpen(false); nav(`/tasks?task=${t._id}`); }}>
                    {t.title}<small>Due {fmt(t.dueDate)}</small>
                  </button>
                  <button className="ghost small" disabled={isBusy(`snooze:${t._id}`)} onClick={() => snooze(t._id)} title="Push the due date by one day">+1d</button>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
