import Activity from './models/Activity.js';

const TRACKED = ['title', 'description', 'priority', 'status', 'category', 'tags', 'startDate', 'dueDate', 'estimatedMinutes'];
const key = (k, v) => (k.endsWith('Date') ? (v ? new Date(v).getTime() : null) : k === 'tags' ? (v || []).join(',') : (v ?? ''));
const store = (v) => (v instanceof Date ? v.toISOString() : Array.isArray(v) ? [...v] : (v ?? null));

// Applies changes to a task document and returns activity entries for the fields that really changed
export function applyChanges(task, changes, userId) {
  const entries = [];
  for (const k of TRACKED) {
    if (!(k in changes)) continue;
    const before = task[k], after = changes[k];
    if (key(k, before) !== key(k, after)) {
      entries.push({ task: task._id, user: userId, kind: 'change', field: k, ...(k === 'description' ? {} : { from: store(before), to: store(after) }) });
    }
    task[k] = after;
  }
  return entries;
}

export const record = (entries) => (entries.length ? Activity.insertMany(entries) : null);
