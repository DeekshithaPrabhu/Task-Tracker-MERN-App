import { Router } from 'express';
import Task from '../models/Task.js';

const r = Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

// Dashboard data in one call
r.get('/stats', wrap(async (_req, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const week = new Date(start); week.setDate(week.getDate() + 8);
  const open = { status: { $ne: 'done' } };

  const [total, completed, overdue, dueToday, upcoming, recent, byPriority, byStatus] = await Promise.all([
    Task.countDocuments(),
    Task.countDocuments({ status: 'done' }),
    Task.countDocuments({ ...open, dueDate: { $lt: start } }),
    Task.find({ ...open, dueDate: { $gte: start, $lt: end } }).sort('dueDate'),
    Task.find({ ...open, dueDate: { $gte: end, $lt: week } }).sort('dueDate').limit(8),
    Task.find().sort('-createdAt').limit(5),
    Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const toMap = (rows) => Object.fromEntries(rows.map((x) => [x._id, x.count]));

  res.json({
    total, completed, pending: total - completed, overdue,
    completion: total ? Math.round((completed / total) * 100) : 0,
    dueToday, upcoming, recent,
    byPriority: toMap(byPriority), byStatus: toMap(byStatus),
  });
}));

const esc = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const dayStart = (offset = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d; };
const RANK = { low: 0, medium: 1, high: 2, urgent: 3 };
const SORT_FIELD = { due: 'dueDate', created: 'createdAt', title: 'title' };
const open = { status: { $ne: 'done' } };

// Quick filters, each a preset applied on top of the other filters
const QUICK = {
  myday: () => [open, { dueDate: { $gte: dayStart(), $lt: dayStart(1) } }],
  upcoming: () => [open, { dueDate: { $gte: dayStart(1) } }],
  overdue: () => [open, { dueDate: { $lt: dayStart() } }],
  completed: () => [{ status: 'done' }],
};

r.get('/categories', wrap(async (_req, res) => {
  res.json((await Task.distinct('category')).filter(Boolean).sort((a, b) => a.localeCompare(b)));
}));

r.get('/', wrap(async (req, res) => {
  const { q, status, priority, category, dueFrom, dueTo, quick = 'all', sort = 'due', order = 'asc' } = req.query;
  const filter = {};
  const and = [...(QUICK[quick]?.() || [])];

  if (q) { const re = { $regex: esc(q), $options: 'i' }; filter.$or = [{ title: re }, { description: re }]; }
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (dueFrom) and.push({ dueDate: { $gte: new Date(`${dueFrom}T00:00:00`) } });
  if (dueTo) and.push({ dueDate: { $lte: new Date(`${dueTo}T23:59:59.999`) } });
  if (and.length) filter.$and = and;

  const dir = order === 'desc' ? -1 : 1;
  const query = Task.find(filter).collation({ locale: 'en' }); // case-insensitive title sort
  if (sort === 'priority') {
    const list = await query.sort('dueDate'); // due date breaks ties (Array.sort is stable)
    return res.json(list.sort((a, b) => (RANK[a.priority] - RANK[b.priority]) * dir));
  }
  res.json(await query.sort({ [SORT_FIELD[sort] || 'dueDate']: dir }));
}));
r.post('/', wrap(async (req, res) => res.status(201).json(await Task.create(req.body))));

r.patch('/:id', wrap(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  Object.assign(task, req.body);
  res.json(await task.save());
}));

// Push the due date forward by N days (counted from the later of today or the current due date)
r.patch('/:id/extend', wrap(async (req, res) => {
  const days = Number(req.body.days);
  if (!Number.isFinite(days) || days < 1) return res.status(400).json({ message: 'days must be 1 or more' });
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const base = Math.max(task.dueDate.getTime(), Date.now());
  task.dueDate = new Date(base + days * 86400000);
  res.json(await task.save());
}));

r.delete('/:id', wrap(async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.status(204).end();
}));

export default r;
