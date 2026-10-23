import { Router } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';

const r = Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
const esc = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const dayStart = (offset = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d; };
const RANK = { low: 0, medium: 1, high: 2, urgent: 3 };
const SORT_FIELD = { due: 'dueDate', created: 'createdAt', title: 'title' };
const open = { status: { $ne: 'done' } };

const QUICK = {
  myday: () => [open, { dueDate: { $gte: dayStart(), $lt: dayStart(1) } }],
  upcoming: () => [open, { dueDate: { $gte: dayStart(1) } }],
  overdue: () => [open, { dueDate: { $lt: dayStart() } }],
  completed: () => [{ status: 'done' }],
};

// Only these fields can be set from a request (never user or completedAt)
const FIELDS = ['title', 'description', 'category', 'tags', 'priority', 'status', 'startDate', 'dueDate', 'estimatedMinutes'];
const cleanTags = (t) => [...new Set((Array.isArray(t) ? t : []).map((x) => String(x).trim().toLowerCase().replace(/^#/, '').slice(0, 24)).filter(Boolean))].slice(0, 10);
const pick = (body) => {
  const out = {};
  for (const k of FIELDS) if (k in body) out[k] = body[k];
  if ('tags' in out) out.tags = cleanTags(out.tags);
  return out;
};
const mine = (req, id) => Task.findOne({ _id: id, user: req.userId });

r.get('/stats', wrap(async (req, res) => {
  const user = req.userId;
  const uid = new mongoose.Types.ObjectId(user);
  const start = dayStart(), end = dayStart(1), week = dayStart(8);

  const [total, completed, overdue, dueToday, upcoming, recent, byPriority, byStatus] = await Promise.all([
    Task.countDocuments({ user }),
    Task.countDocuments({ user, status: 'done' }),
    Task.countDocuments({ user, ...open, dueDate: { $lt: start } }),
    Task.find({ user, ...open, dueDate: { $gte: start, $lt: end } }).sort('dueDate'),
    Task.find({ user, ...open, dueDate: { $gte: end, $lt: week } }).sort('dueDate').limit(8),
    Task.find({ user }).sort('-createdAt').limit(5),
    Task.aggregate([{ $match: { user: uid } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: { user: uid } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const toMap = (rows) => Object.fromEntries(rows.map((x) => [x._id, x.count]));

  res.json({
    total, completed, pending: total - completed, overdue,
    completion: total ? Math.round((completed / total) * 100) : 0,
    dueToday, upcoming, recent, byPriority: toMap(byPriority), byStatus: toMap(byStatus),
  });
}));

r.get('/tags', wrap(async (req, res) => res.json((await Task.distinct('tags', { user: req.userId })).sort())));

r.get('/', wrap(async (req, res) => {
  const { q, status, priority, category, tag, dueFrom, dueTo, quick = 'all', sort = 'due', order = 'asc' } = req.query;
  const filter = { user: req.userId };
  const and = [...(QUICK[quick]?.() || [])];

  if (q) { const re = { $regex: esc(q), $options: 'i' }; filter.$or = [{ title: re }, { description: re }]; }
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (tag) filter.tags = tag;
  if (dueFrom) and.push({ dueDate: { $gte: new Date(`${dueFrom}T00:00:00`) } });
  if (dueTo) and.push({ dueDate: { $lte: new Date(`${dueTo}T23:59:59.999`) } });
  if (and.length) filter.$and = and;

  const dir = order === 'desc' ? -1 : 1;
  const query = Task.find(filter).collation({ locale: 'en' });
  if (sort === 'priority') {
    const list = await query.sort('dueDate');
    return res.json(list.sort((a, b) => (RANK[a.priority] - RANK[b.priority]) * dir));
  }
  res.json(await query.sort({ [SORT_FIELD[sort] || 'dueDate']: dir }));
}));

r.post('/', wrap(async (req, res) => res.status(201).json(await Task.create({ ...pick(req.body), user: req.userId }))));

r.patch('/:id', wrap(async (req, res) => {
  const task = await mine(req, req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  Object.assign(task, pick(req.body));
  res.json(await task.save());
}));

r.patch('/:id/extend', wrap(async (req, res) => {
  const days = Number(req.body.days);
  if (!Number.isFinite(days) || days < 1) return res.status(400).json({ message: 'days must be 1 or more' });
  const task = await mine(req, req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  task.dueDate = new Date(Math.max(task.dueDate.getTime(), Date.now()) + days * 86400000);
  res.json(await task.save());
}));

r.delete('/:id', wrap(async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.status(204).end();
}));

export default r;
