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

r.get('/', wrap(async (_req, res) => res.json(await Task.find().sort('dueDate'))));
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
