export const fmt = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export const isOverdue = (t) => t.status !== 'done' && new Date(t.dueDate) < new Date().setHours(0, 0, 0, 0);

// Date -> value for <input type="date"> in local time
export const toInput = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

