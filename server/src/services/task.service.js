import { dayStart } from '../utils/dates.js';

export const OPEN = { status: { $ne: 'done' } };

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Quick filters, each a preset applied on top of the other filters
const QUICK = {
  myday: () => [OPEN, { dueDate: { $gte: dayStart(), $lt: dayStart(1) } }],
  upcoming: () => [OPEN, { dueDate: { $gte: dayStart(1) } }],
  overdue: () => [OPEN, { dueDate: { $lt: dayStart() } }],
  completed: () => [{ status: 'done' }],
};

// Builds the MongoDB filter for the task list from the query string
export function buildTaskFilter(query) {
  const { q, status, priority, category, dueFrom, dueTo, quick = 'all' } = query;
  const filter = {};
  const and = [...(QUICK[quick]?.() || [])];

  if (q) { const re = { $regex: escapeRegex(q), $options: 'i' }; filter.$or = [{ title: re }, { description: re }]; }
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (dueFrom) and.push({ dueDate: { $gte: new Date(`${dueFrom}T00:00:00`) } });
  if (dueTo) and.push({ dueDate: { $lte: new Date(`${dueTo}T23:59:59.999`) } });
  if (and.length) filter.$and = and;
  return filter;
}

// Only these fields can be set from a request (never user or completedAt)
const FIELDS = ['title', 'description', 'category', 'priority', 'status', 'startDate', 'dueDate', 'estimatedMinutes'];

export const pickTaskFields = (body) => {
  const out = {};
  for (const k of FIELDS) if (k in body) out[k] = body[k];
  return out;
};
