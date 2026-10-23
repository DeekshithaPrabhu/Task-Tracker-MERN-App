export const STATUS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Completed' };
export const PRIORITY = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

export const fmt = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export const isOverdue = (t) => t.status !== 'done' && new Date(t.dueDate) < new Date().setHours(0, 0, 0, 0);

// Date -> value for <input type="date"> in local time
export const toInput = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const fmtDuration = (m) => (!m ? '' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`);

// 'system' follows the OS; otherwise force light or dark. Remembered locally to avoid a flash on load.
export const applyTheme = (t = 'system') => {
  const el = document.documentElement;
  if (t === 'system') delete el.dataset.theme; else el.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch { /* storage unavailable */ }
};

export const subProgress = (t) => (t.subtasks?.length ? `${t.subtasks.filter((s) => s.done).length}/${t.subtasks.length}` : '');
